"use client"
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  getAllPositionsApi,
  getOrdersApi,
  getOpenOrdersApi,
  getFillsApi,
  deleteOrderApi,
  createOrderApi,
} from "../utils/httpClient";
import { getToken, AUTH_CHANGED_EVENT } from "../utils/auth";
import { useBalanceContext } from "../context/BalanceContext";

type TabType =
  | "Balances"
  | "Positions"
  | "Open Orders"
  | "Order History"
  | "Position History";

const tabs: TabType[] = [
  "Balances",
  "Positions",
  "Open Orders",
  "Order History",
  "Position History",
];

const ACCOUNT_POLL_MS = 5000;

const AccountPanel = ({ market }: { market: string }) => {
  const { availableNum, lockedNum, totalNum } = useBalanceContext();
  const [activeTab, setActiveTab] = useState<TabType>("Balances");
  const [positions, setPositions] = useState<any[]>([]);
  const [openOrdersList, setOpenOrdersList] = useState<any[]>([]);
  const [ordersHistory, setOrdersHistory] = useState<any[]>([]);
  const [fills, setFills] = useState<any[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [closingMarket, setClosingMarket] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<{ text: string; isError: boolean; isDepositPrompt?: boolean } | null>(null);

  // Ignore responses from a fetch superseded by a newer one (e.g. after switching markets)
  const requestIdRef = useRef(0);

  const fetchAllData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    if (!getToken()) {
      setPositions([]);
      setOpenOrdersList([]);
      setOrdersHistory([]);
      setFills([]);
      return;
    }

    const [posRes, openOrdersRes, allOrdersRes, fillsRes] = await Promise.allSettled([
      getAllPositionsApi(),
      getOpenOrdersApi(market),
      getOrdersApi(market),
      getFillsApi(),
    ]);
    if (requestId !== requestIdRef.current) return;

    if (posRes.status === "fulfilled") {
      const rawPositions = posRes.value?.data ?? [];
      setPositions(
        Array.isArray(rawPositions)
          ? rawPositions.filter((p: any) => p && parseFloat(p.qty || "0") > 0)
          : []
      );
    }
    if (openOrdersRes.status === "fulfilled") {
      const rawOpen = openOrdersRes.value?.data?.orders ?? openOrdersRes.value?.orders ?? [];
      setOpenOrdersList(Array.isArray(rawOpen) ? rawOpen : []);
    }
    if (allOrdersRes.status === "fulfilled") {
      const rawAll = allOrdersRes.value?.data?.orders ?? allOrdersRes.value?.orders ?? [];
      setOrdersHistory(Array.isArray(rawAll) ? rawAll : []);
    }
    if (fillsRes.status === "fulfilled") {
      const rawFills = fillsRes.value?.data?.fills ?? fillsRes.value?.data ?? fillsRes.value?.fills ?? [];
      setFills(Array.isArray(rawFills) ? rawFills : []);
    }
  }, [market]);

  useEffect(() => {
    fetchAllData();

    const handleUpdate = () => fetchAllData();
    // Resting orders can be filled by other users at any time
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") fetchAllData();
    }, ACCOUNT_POLL_MS);
    window.addEventListener("orderUpdated", handleUpdate);
    window.addEventListener(AUTH_CHANGED_EVENT, handleUpdate);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("orderUpdated", handleUpdate);
      window.removeEventListener(AUTH_CHANGED_EVENT, handleUpdate);
    };
  }, [fetchAllData]);

  const handleCancelOrder = async (orderId: string) => {
    if (!orderId) return;
    setCancellingId(orderId);
    setNoticeMsg(null);

    // Optimistic UI update: immediately remove from open orders UI list
    setOpenOrdersList((prev) => prev.filter((o) => (o.id || o.orderId) !== orderId));

    try {
      const res = await deleteOrderApi(orderId);
      if (res?.success || res?.msg?.includes("Cancelled") || res?.order) {
        setNoticeMsg({ text: "Order cancelled successfully", isError: false });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("orderUpdated"));
          window.dispatchEvent(new Event("balanceUpdated"));
        }
      } else {
        // Re-fetch if backend returns unexpected failure
        fetchAllData();
      }
    } catch (e) {
      console.error("Failed to cancel order:", e);
      fetchAllData();
    } finally {
      setCancellingId(null);
    }
  };

  const handleClosePosition = async (pos: any) => {
    if (!pos || closingMarket) return;
    const posMarket = pos.market || market;
    setClosingMarket(posMarket);
    setNoticeMsg(null);

    const closeSide = (pos.side || "").toUpperCase() === "LONG" ? "SHORT" : "LONG";
    const closeQty = pos.qty;
    const baseMarket = posMarket.split("_")[0];
    const margin = pos.margin || "0";

    // Optimistic UI update: remove position from UI immediately
    setPositions((prev) => prev.filter((p) => p !== pos));

    try {
      const res = await createOrderApi({
        market: baseMarket,
        side: closeSide,
        type: "market",
        qty: closeQty,
        margin: margin,
      });

      if (res?.success) {
        setNoticeMsg({ text: "Position closed successfully!", isError: false });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("orderUpdated"));
          window.dispatchEvent(new Event("balanceUpdated"));
        }
      } else {
        const rawErr = res?.error || res?.msg || "Failed to close position";
        let formatted = rawErr;
        if (typeof rawErr === "string" && (rawErr.includes("No buy order is available") || rawErr.includes("No sell order is available") || rawErr.includes("order is available"))) {
          formatted = `Orderbook Empty: No matching ${closeSide === "SHORT" ? "sell" : "buy"} order is currently available in the orderbook to close this position.`;
        }
        setNoticeMsg({ text: formatted, isError: true });
        fetchAllData();
      }
    } catch (e: any) {
      const errorData = e.response?.data;
      const rawErr = errorData?.error || errorData?.msg || e.message || "Failed to close position";
      let formatted = typeof rawErr === "string" ? rawErr : "Failed to close position";
      if (typeof rawErr === "string" && (rawErr.includes("No buy order is available") || rawErr.includes("No sell order is available") || rawErr.includes("order is available"))) {
        formatted = `Orderbook Empty: No matching ${closeSide === "SHORT" ? "sell" : "buy"} order is currently available in the orderbook to close this position.`;
      }
      setNoticeMsg({ text: formatted, isError: true });
      fetchAllData();
    } finally {
      setClosingMarket(null);
    }
  };

  const formattedAvail = availableNum.toFixed(2);
  const formattedLocked = lockedNum.toFixed(2);
  const totalBalance = totalNum.toFixed(2);

  return (
    <div className="flex flex-col h-full bg-[#181a20] rounded-[8px] overflow-hidden text-[#EAECEF]">
      {/* Tabs */}
      <div className="flex items-center gap-5 px-4 border-b border-[#2B2F36] overflow-x-auto no-scrollbar whitespace-nowrap">
        {tabs.map((tab) => {
          const count = tab === "Positions" ? positions.length : tab === "Open Orders" ? openOrdersList.length : 0;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 py-2.5 text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? "border-white text-white"
                  : "border-transparent text-[#848E9C] hover:text-white"
              }`}
            >
              {tab}
              {count > 0 && (
                <span className="rounded bg-[#2B2F36] px-1.5 text-[10px] font-semibold text-white tabular-nums">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {noticeMsg && (
        <div className={`flex items-center justify-between gap-3 border-b border-[#2B2F36] px-4 py-2 text-xs ${noticeMsg.isError ? "text-[#F6465D]" : "text-[#00C076]"}`}>
          <span>{noticeMsg.text}</span>
          <button
            type="button"
            onClick={() => setNoticeMsg(null)}
            aria-label="Dismiss"
            className="text-[#848E9C] hover:text-white"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Main Body Content */}
      <div className="flex-1 p-3 lg:p-0 overflow-y-auto">
        {/* Balances Tab */}
        {activeTab === "Balances" && (
          <>
          <div className="lg:hidden">
            <Card>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">USDC</span>
                <span className="text-sm font-bold text-white tabular-nums">${totalBalance}</span>
              </div>
              <Row label="Available" value={`$${formattedAvail}`} valueClass="text-[#00C076]" />
              <Row label="In orders" value={`$${formattedLocked}`} />
            </Card>
          </div>
          <table className="hidden lg:table w-full text-xs">
            <thead className="sticky top-0 bg-[#181a20] text-[#B7BDC6]">
              <tr>
                <th className="h-9 px-4 font-medium text-left">Asset</th>
                <th className="h-9 px-4 font-medium text-right">Total</th>
                <th className="h-9 px-4 font-medium text-right">Available</th>
                <th className="h-9 px-4 font-medium text-right">In orders</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[#2B2F36]/60">
                <td className="h-10 px-4 font-semibold text-white">USDC</td>
                <td className="h-10 px-4 text-right text-white tabular-nums">${totalBalance}</td>
                <td className="h-10 px-4 text-right text-[#00C076] tabular-nums">${formattedAvail}</td>
                <td className="h-10 px-4 text-right text-white tabular-nums">${formattedLocked}</td>
              </tr>
            </tbody>
          </table>
          </>
        )}

        {/* Positions Tab */}
        {activeTab === "Positions" && (
          <>
          <div className="lg:hidden flex flex-col gap-2">
            {positions.length > 0 ? positions.map((position) => {
              const pnl = parseFloat(position.pnl || "0");
              return (
                <Card key={position.market}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{position.market || market}</span>
                      <SideBadge side={position.side} />
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${pnl >= 0 ? "text-[#00C076]" : "text-[#F6465D]"}`}>
                      {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                    </span>
                  </div>
                  <Row label="Size" value={parseFloat(position.qty || "0").toFixed(4)} />
                  <Row label="Entry price" value={`$${parseFloat(position.averagePrice || "0").toFixed(2)}`} />
                  <Row label="Margin" value={`$${parseFloat(position.margin || "0").toFixed(2)}`} />
                  <Row label="Liq. price" value={`$${parseFloat(position.liquidationPrice || "0").toFixed(2)}`} valueClass="text-[#F6465D]" />
                  <button
                    type="button"
                    disabled={closingMarket !== null}
                    onClick={() => handleClosePosition(position)}
                    className="mt-3 h-9 w-full rounded-md bg-[#F6465D]/15 text-xs font-bold text-[#F6465D] hover:bg-[#F6465D]/25 disabled:opacity-50 transition-colors"
                  >
                    {closingMarket === position.market ? "Closing..." : "Market Close"}
                  </button>
                </Card>
              );
            }) : <Empty text="No open positions" />}
          </div>
          {positions.length > 0 ? (
            <table className="hidden lg:table w-full text-xs">
              <thead className="sticky top-0 bg-[#181a20] text-[#B7BDC6]">
                <tr>
                  <th className="h-9 px-4 font-medium text-left">Market</th>
                  <th className="h-9 px-4 font-medium text-right">Size</th>
                  <th className="h-9 px-4 font-medium text-right">Entry price</th>
                  <th className="h-9 px-4 font-medium text-right">Margin</th>
                  <th className="h-9 px-4 font-medium text-right">Liq. price</th>
                  <th className="h-9 px-4 font-medium text-right">PnL</th>
                  <th className="h-9 px-4 font-medium text-right" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {positions.map((position) => {
                  const pnl = parseFloat(position.pnl || "0");
                  return (
                    <tr key={position.market} className="border-t border-[#2B2F36]/60 hover:bg-[#1E2026] transition-colors">
                      <td className="h-10 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{position.market || market}</span>
                          <SideBadge side={position.side} />
                        </div>
                      </td>
                      <td className="h-10 px-4 text-right text-white tabular-nums">{parseFloat(position.qty || "0").toFixed(4)}</td>
                      <td className="h-10 px-4 text-right text-white tabular-nums">${parseFloat(position.averagePrice || "0").toFixed(2)}</td>
                      <td className="h-10 px-4 text-right text-white tabular-nums">${parseFloat(position.margin || "0").toFixed(2)}</td>
                      <td className="h-10 px-4 text-right text-[#F6465D] tabular-nums">${parseFloat(position.liquidationPrice || "0").toFixed(2)}</td>
                      <td className={`h-10 px-4 text-right font-semibold tabular-nums ${pnl >= 0 ? "text-[#00C076]" : "text-[#F6465D]"}`}>
                        {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                      </td>
                      <td className="h-10 px-4 text-right">
                        <button
                          type="button"
                          disabled={closingMarket !== null}
                          onClick={() => handleClosePosition(position)}
                          className="h-7 rounded-md bg-[#F6465D]/15 px-3 text-[11px] font-semibold text-[#F6465D] hover:bg-[#F6465D]/25 disabled:opacity-50 transition-colors"
                        >
                          {closingMarket === position.market ? "Closing..." : "Market Close"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="hidden lg:block"><Empty text="No open positions" /></div>
          )}
          </>
        )}

        {/* Open Orders Tab */}
        {activeTab === "Open Orders" && (
          <>
          <div className="lg:hidden flex flex-col gap-2">
            {openOrdersList.length > 0 ? openOrdersList.map((ord: any, idx: number) => {
              const orderId = ord.id || ord.orderId;
              return (
                <Card key={orderId || idx}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{ord.market || market}</span>
                      <SideBadge side={ord.side} />
                      <span className="text-[11px] uppercase text-[#B7BDC6]">{ord.type || "limit"}</span>
                    </div>
                    <span className="text-[11px] text-[#B7BDC6]">{formatTime(ord.createdAt)}</span>
                  </div>
                  <Row label="Price" value={ord.price ? `$${parseFloat(ord.price).toFixed(2)}` : "Market"} />
                  <Row label="Quantity" value={parseFloat(ord.quantity || ord.qty || "0").toFixed(2)} />
                  <Row label="Status" value={ord.status || "open"} valueClass="capitalize text-[#00C076]" />
                  <button
                    type="button"
                    disabled={cancellingId === orderId}
                    onClick={() => handleCancelOrder(orderId)}
                    className="mt-3 h-9 w-full rounded-md bg-[#2B2F36] text-xs font-bold text-white hover:bg-[#363A45] disabled:opacity-50 transition-colors"
                  >
                    {cancellingId === orderId ? "Cancelling..." : "Cancel"}
                  </button>
                </Card>
              );
            }) : <Empty text="No open orders" />}
          </div>
          {openOrdersList.length > 0 ? (
            <table className="hidden lg:table w-full text-xs">
              <thead className="sticky top-0 bg-[#181a20] text-[#B7BDC6]">
                <tr>
                  <th className="h-9 px-4 font-medium text-left">Time</th>
                  <th className="h-9 px-4 font-medium text-left">Market</th>
                  <th className="h-9 px-4 font-medium text-left">Type</th>
                  <th className="h-9 px-4 font-medium text-right">Price</th>
                  <th className="h-9 px-4 font-medium text-right">Quantity</th>
                  <th className="h-9 px-4 font-medium text-right">Filled</th>
                  <th className="h-9 px-4 font-medium text-right" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {openOrdersList.map((ord: any, idx: number) => {
                  const orderId = ord.id || ord.orderId;
                  return (
                    <tr key={orderId || idx} className="border-t border-[#2B2F36]/60 hover:bg-[#1E2026] transition-colors">
                      <td className="h-10 px-4 text-[#B7BDC6] tabular-nums">{formatTime(ord.createdAt)}</td>
                      <td className="h-10 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{ord.market || market}</span>
                          <SideBadge side={ord.side} />
                        </div>
                      </td>
                      <td className="h-10 px-4 capitalize text-white">{ord.type || "limit"}</td>
                      <td className="h-10 px-4 text-right text-white tabular-nums">{ord.price ? `$${parseFloat(ord.price).toFixed(2)}` : "Market"}</td>
                      <td className="h-10 px-4 text-right text-white tabular-nums">{parseFloat(ord.quantity || ord.qty || "0").toFixed(2)}</td>
                      <td className="h-10 px-4 text-right text-white tabular-nums">{parseFloat(ord.filledQuantity || ord.filledQty || "0").toFixed(2)}</td>
                      <td className="h-10 px-4 text-right">
                        <button
                          type="button"
                          disabled={cancellingId === orderId}
                          onClick={() => handleCancelOrder(orderId)}
                          className="h-7 rounded-md bg-[#2B2F36] px-3 text-[11px] font-semibold text-white hover:bg-[#363A45] disabled:opacity-50 transition-colors"
                        >
                          {cancellingId === orderId ? "Cancelling..." : "Cancel"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="hidden lg:block"><Empty text="No open orders" /></div>
          )}
          </>
        )}

        {/* Order History Tab */}
        {activeTab === "Order History" && (
          <>
          <div className="lg:hidden flex flex-col gap-2">
            {ordersHistory.length > 0 ? ordersHistory.map((ord: any, idx: number) => (
              <Card key={ord.id || ord.orderId || idx}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{ord.market || market}</span>
                    <SideBadge side={ord.side} />
                    <span className="text-[11px] uppercase text-[#B7BDC6]">{ord.type || "limit"}</span>
                  </div>
                  <span className={`text-xs font-semibold capitalize ${ord.status === "Filled" ? "text-[#00C076]" : ord.status === "Cancel" ? "text-[#F6465D]" : "text-white"}`}>
                    {ord.status || "open"}
                  </span>
                </div>
                <Row label="Price" value={ord.price ? `$${parseFloat(ord.price).toFixed(2)}` : "Market"} />
                <Row label="Quantity" value={parseFloat(ord.quantity || ord.qty || "0").toFixed(2)} />
                <Row label="Time" value={formatTime(ord.createdAt)} />
              </Card>
            )) : <Empty text="No order history" />}
          </div>
          {ordersHistory.length > 0 ? (
            <table className="hidden lg:table w-full text-xs">
              <thead className="sticky top-0 bg-[#181a20] text-[#B7BDC6]">
                <tr>
                  <th className="h-9 px-4 font-medium text-left">Time</th>
                  <th className="h-9 px-4 font-medium text-left">Market</th>
                  <th className="h-9 px-4 font-medium text-left">Type</th>
                  <th className="h-9 px-4 font-medium text-right">Price</th>
                  <th className="h-9 px-4 font-medium text-right">Quantity</th>
                  <th className="h-9 px-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {ordersHistory.map((ord: any, idx: number) => (
                  <tr key={ord.id || ord.orderId || idx} className="border-t border-[#2B2F36]/60 hover:bg-[#1E2026] transition-colors">
                    <td className="h-10 px-4 text-[#B7BDC6] tabular-nums">{formatTime(ord.createdAt)}</td>
                    <td className="h-10 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{ord.market || market}</span>
                        <SideBadge side={ord.side} />
                      </div>
                    </td>
                    <td className="h-10 px-4 capitalize text-white">{ord.type || "limit"}</td>
                    <td className="h-10 px-4 text-right text-white tabular-nums">{ord.price ? `$${parseFloat(ord.price).toFixed(2)}` : "Market"}</td>
                    <td className="h-10 px-4 text-right text-white tabular-nums">{parseFloat(ord.quantity || ord.qty || "0").toFixed(2)}</td>
                    <td className={`h-10 px-4 text-right font-semibold capitalize ${ord.status === "Filled" ? "text-[#00C076]" : ord.status === "Cancel" ? "text-[#F6465D]" : "text-white"}`}>
                      {ord.status || "open"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="hidden lg:block"><Empty text="No order history" /></div>
          )}
          </>
        )}

        {/* Position History / Fills Tab */}
        {activeTab === "Position History" && (
          <>
          <div className="lg:hidden flex flex-col gap-2">
            {fills.length > 0 ? fills.map((fill: any, idx: number) => (
              <Card key={idx}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{fill.market || market}</span>
                  <span className="text-sm font-bold text-[#00C076] tabular-nums">${parseFloat(fill.price || "0").toFixed(2)}</span>
                </div>
                <Row label="Filled qty" value={parseFloat(fill.qty || fill.quantity || "0").toFixed(2)} />
                <Row label="Buy order" value={shortId(fill.buyOrderId)} />
                <Row label="Sell order" value={shortId(fill.sellOrderId)} />
              </Card>
            )) : <Empty text="No position history" />}
          </div>
          {fills.length > 0 ? (
            <table className="hidden lg:table w-full text-xs">
              <thead className="sticky top-0 bg-[#181a20] text-[#B7BDC6]">
                <tr>
                  <th className="h-9 px-4 font-medium text-left">Market</th>
                  <th className="h-9 px-4 font-medium text-left">Buy order</th>
                  <th className="h-9 px-4 font-medium text-left">Sell order</th>
                  <th className="h-9 px-4 font-medium text-right">Filled qty</th>
                  <th className="h-9 px-4 font-medium text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {fills.map((fill: any, idx: number) => (
                  <tr key={idx} className="border-t border-[#2B2F36]/60 hover:bg-[#1E2026] transition-colors">
                    <td className="h-10 px-4 font-semibold text-white">{fill.market || market}</td>
                    <td className="h-10 px-4 font-mono text-[11px] text-[#B7BDC6]">{shortId(fill.buyOrderId)}</td>
                    <td className="h-10 px-4 font-mono text-[11px] text-[#B7BDC6]">{shortId(fill.sellOrderId)}</td>
                    <td className="h-10 px-4 text-right text-white tabular-nums">{parseFloat(fill.qty || fill.quantity || "0").toFixed(2)}</td>
                    <td className="h-10 px-4 text-right font-semibold text-white tabular-nums">${parseFloat(fill.price || "0").toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="hidden lg:block"><Empty text="No position history" /></div>
          )}
          </>
        )}
      </div>
    </div>
  );
};

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border border-[#2B2F36]/70 bg-[#1E2026] p-3">{children}</div>
);

const Row = ({ label, value, valueClass = "text-white" }: { label: string; value: React.ReactNode; valueClass?: string }) => (
  <div className="mt-2 flex items-center justify-between text-xs">
    <span className="text-[#B7BDC6]">{label}</span>
    <span className={`font-medium tabular-nums ${valueClass}`}>{value}</span>
  </div>
);

const SideBadge = ({ side }: { side?: string }) => {
  const s = (side || "").toUpperCase();
  const isLong = s === "LONG" || s === "BUY";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${isLong ? "bg-[#00C076]/15 text-[#00C076]" : "bg-[#F6465D]/15 text-[#F6465D]"}`}>
      {s}
    </span>
  );
};

const Empty = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center py-10 text-xs text-[#B7BDC6]">{text}</div>
);

const formatTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "--";

const shortId = (id?: string) => (id ? `${id.slice(0, 6)}…${id.slice(-4)}` : "--");

export default AccountPanel;
