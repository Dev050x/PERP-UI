"use client"
import { useCallback, useEffect, useRef, useState } from "react";
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
      {/* Top Tab Navigation */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#2B2F36] overflow-x-auto no-scrollbar whitespace-nowrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 text-xs font-semibold rounded-[6px] transition-colors ${
              activeTab === tab
                ? "bg-[#2B2F36] text-[#EAECEF]"
                : "text-[#848E9C] hover:text-[#EAECEF]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dismissible Notice Banner */}
      {noticeMsg && (
        <div className={`mx-4 mt-3 p-3 rounded-lg text-xs  flex items-center justify-between ${noticeMsg.isError ? "bg-[#3B171E] text-[#F6465D] border border-[#F6465D]/30" : "bg-[#0F3A2C] text-[#00C076] border border-[#00C076]/30"}`}>
          <div className="flex items-center gap-2">
            <span>{noticeMsg.isError ? "Error" : "✔"}</span>
            <span>{noticeMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNoticeMsg(null)}
            className="text-xs font-bold px-1.5 py-0.5 hover:bg-black/20 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Body Content */}
      <div className="flex-1 p-4 overflow-y-auto overflow-x-auto lg:overflow-x-visible">
        {/* Balances Tab */}
        {activeTab === "Balances" && (
          <div className="flex flex-col gap-1 min-w-[640px] lg:min-w-0">
            <div className="grid grid-cols-4 items-center text-xs font-semibold text-[#848E9C] border-b border-[#2B2F36] pb-2 px-2">
              <span className="text-left">Asset</span>
              <span className="text-right">Total Balance</span>
              <span className="text-right">Available Balance</span>
              <span className="text-right">In Orders</span>
            </div>
            <div className="grid grid-cols-4 items-center text-xs py-2.5 px-2 border-b border-[#23272E]/40 hover:bg-[#2B2F36]/30 transition-colors">
              <span className="font-semibold text-white text-left">USDC</span>
              <span className="text-right tabular-nums text-[#EAECEF]">${totalBalance}</span>
              <span className="text-right tabular-nums text-[#EAECEF]">${formattedAvail}</span>
              <span className="text-right tabular-nums text-[#EAECEF]">${formattedLocked}</span>
            </div>
          </div>
        )}

        {/* Positions Tab */}
        {activeTab === "Positions" && (
          <div className="flex flex-col gap-1 min-w-[640px] lg:min-w-0">
            <div className="grid grid-cols-8 items-center text-xs font-semibold text-[#848E9C] border-b border-[#2B2F36] pb-2 px-2">
              <span className="text-left">Market</span>
              <span className="text-left">Side</span>
              <span className="text-right">Size</span>
              <span className="text-right">Avg Entry Price</span>
              <span className="text-right">Margin</span>
              <span className="text-right">Liq. Price</span>
              <span className="text-right">PnL</span>
              <span className="text-right">Action</span>
            </div>
            {positions.length > 0 ? (
              positions.map((position) => (
              <div key={position.market} className="grid grid-cols-8 items-center text-xs py-2.5 px-2 border-b border-[#23272E]/40 hover:bg-[#2B2F36]/30 transition-colors font-medium">
                <span className="font-bold text-white text-left">{position.market || market}</span>
                <span className={`text-left font-bold ${position.side === "LONG" ? "text-[#00C076]" : "text-[#F6465D]"}`}>
                  {position.side}
                </span>
                <span className="text-right tabular-nums text-[#EAECEF]">{parseFloat(position.qty || "0").toFixed(4)}</span>
                <span className="text-right tabular-nums text-[#EAECEF]">${parseFloat(position.averagePrice || "0").toFixed(2)}</span>
                <span className="text-right tabular-nums text-[#EAECEF]">${parseFloat(position.margin || "0").toFixed(2)}</span>
                <span className="text-right tabular-nums text-[#EAECEF]">${parseFloat(position.liquidationPrice || "0").toFixed(2)}</span>
                <span className={`text-right tabular-nums font-bold ${parseFloat(position.pnl || "0") >= 0 ? "text-[#00C076]" : "text-[#F6465D]"}`}>
                  ${parseFloat(position.pnl || "0").toFixed(2)}
                </span>
                <div className="text-right">
                  <button
                    type="button"
                    disabled={closingMarket !== null}
                    onClick={() => handleClosePosition(position)}
                    className="px-2 py-1 text-[11px] font-bold bg-[#3B171E] hover:bg-[#F6465D] text-[#F6465D] hover:text-white rounded transition-colors disabled:opacity-50"
                  >
                    {closingMarket === position.market ? "Closing..." : "Market Close"}
                  </button>
                </div>
              </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-xs text-[#848E9C]">
                No open positions
              </div>
            )}
          </div>
        )}

        {/* Open Orders Tab */}
        {activeTab === "Open Orders" && (
          <div className="flex flex-col gap-1 min-w-[640px] lg:min-w-0">
            <div className="grid grid-cols-8 items-center text-xs font-semibold text-[#848E9C] border-b border-[#2B2F36] pb-2 px-2">
              <span className="text-left">Time</span>
              <span className="text-left">Market</span>
              <span className="text-left">Type</span>
              <span className="text-left">Side</span>
              <span className="text-right">Price</span>
              <span className="text-right">Quantity</span>
              <span className="text-right">Status</span>
              <span className="text-right">Action</span>
            </div>
            {openOrdersList.length > 0 ? (
              openOrdersList.map((ord: any, idx: number) => {
                const orderId = ord.id || ord.orderId;
                const isLong = (ord.side || "").toUpperCase() === "LONG" || (ord.side || "").toUpperCase() === "BUY";
                return (
                  <div key={orderId || idx} className="grid grid-cols-8 items-center text-xs py-2.5 px-2 border-b border-[#23272E]/40 hover:bg-[#2B2F36]/30 transition-colors">
                    <span className="text-left text-[#848E9C]">
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString() : "--"}
                    </span>
                    <span className="font-bold text-white text-left">{ord.market || market}</span>
                    <span className="text-left uppercase text-[#EAECEF]">{ord.type || "limit"}</span>
                    <span className={`text-left font-bold ${isLong ? "text-[#00C076]" : "text-[#F6465D]"}`}>
                      {(ord.side || "").toUpperCase()}
                    </span>
                    <span className="text-right tabular-nums text-[#EAECEF]">
                      {ord.price ? `$${parseFloat(ord.price).toFixed(2)}` : "Market"}
                    </span>
                    <span className="text-right tabular-nums text-[#EAECEF]">
                      {parseFloat(ord.quantity || ord.qty || "0").toFixed(2)}
                    </span>
                    <span className="text-right capitalize text-[#00C076] font-semibold">
                      {ord.status || "open"}
                    </span>
                    <div className="text-right">
                      <button
                        type="button"
                        disabled={cancellingId === orderId}
                        onClick={() => handleCancelOrder(orderId)}
                        className="px-2 py-0.5 text-[11px] font-bold bg-[#3B171E] hover:bg-[#F6465D] text-[#F6465D] hover:text-white rounded transition-colors disabled:opacity-50"
                      >
                        {cancellingId === orderId ? "..." : "Cancel"}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-xs text-[#848E9C]">
                No open orders
              </div>
            )}
          </div>
        )}

        {/* Order History Tab */}
        {activeTab === "Order History" && (
          <div className="flex flex-col gap-1 min-w-[640px] lg:min-w-0">
            <div className="grid grid-cols-7 items-center text-xs font-semibold text-[#848E9C] border-b border-[#2B2F36] pb-2 px-2">
              <span className="text-left">Time</span>
              <span className="text-left">Market</span>
              <span className="text-left">Type</span>
              <span className="text-left">Side</span>
              <span className="text-right">Price</span>
              <span className="text-right">Quantity</span>
              <span className="text-right">Status</span>
            </div>
            {ordersHistory.length > 0 ? (
              ordersHistory.map((ord: any, idx: number) => {
                const orderId = ord.id || ord.orderId;
                const isLong = (ord.side || "").toUpperCase() === "LONG" || (ord.side || "").toUpperCase() === "BUY";
                return (
                  <div key={orderId || idx} className="grid grid-cols-7 items-center text-xs py-2.5 px-2 border-b border-[#23272E]/40 hover:bg-[#2B2F36]/30 transition-colors">
                    <span className="text-left text-[#848E9C]">
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString() : "--"}
                    </span>
                    <span className="font-bold text-white text-left">{ord.market || market}</span>
                    <span className="text-left uppercase text-[#EAECEF]">{ord.type || "limit"}</span>
                    <span className={`text-left font-bold ${isLong ? "text-[#00C076]" : "text-[#F6465D]"}`}>
                      {(ord.side || "").toUpperCase()}
                    </span>
                    <span className="text-right tabular-nums text-[#EAECEF]">
                      {ord.price ? `$${parseFloat(ord.price).toFixed(2)}` : "Market"}
                    </span>
                    <span className="text-right tabular-nums text-[#EAECEF]">
                      {parseFloat(ord.quantity || ord.qty || "0").toFixed(2)}
                    </span>
                    <span className={`text-right capitalize font-semibold ${ord.status === "Filled" ? "text-[#00C076]" : ord.status === "Cancel" ? "text-[#F6465D]" : "text-[#EAECEF]"}`}>
                      {ord.status || "open"}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-xs text-[#848E9C]">
                No order history
              </div>
            )}
          </div>
        )}

        {/* Position History / Fills Tab */}
        {activeTab === "Position History" && (
          <div className="flex flex-col gap-1 min-w-[640px] lg:min-w-0">
            <div className="grid grid-cols-5 items-center text-xs font-semibold text-[#848E9C] border-b border-[#2B2F36] pb-2 px-2">
              <span className="text-left">Market</span>
              <span className="text-[#848E9C] text-left">Buy Order</span>
              <span className="text-[#848E9C] text-left">Sell Order</span>
              <span className="text-right">Filled Qty</span>
              <span className="text-right">Price</span>
            </div>
            {fills.length > 0 ? (
              fills.map((fill: any, idx: number) => (
                <div key={idx} className="grid grid-cols-5 items-center text-xs py-2.5 px-2 border-b border-[#23272E]/40 hover:bg-[#2B2F36]/30 transition-colors">
                  <span className="font-bold text-white text-left">{fill.market || market}</span>
                  <span className="text-left text-[11px] text-[#848E9C] truncate max-w-[100px]">{fill.buyOrderId || "--"}</span>
                  <span className="text-left text-[11px] text-[#848E9C] truncate max-w-[100px]">{fill.sellOrderId || "--"}</span>
                  <span className="text-right tabular-nums text-[#EAECEF]">{parseFloat(fill.qty || fill.quantity || "0").toFixed(2)}</span>
                  <span className="text-right tabular-nums font-bold text-[#00C076]">${parseFloat(fill.price || "0").toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-xs text-[#848E9C]">
                No position history
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPanel;
