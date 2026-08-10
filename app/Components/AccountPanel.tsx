"use client"
import { useEffect, useState } from "react";
import {
  getBalanceApi,
  extractBalance,
  BalanceData,
  getOpenPositionApi,
  getOrdersApi,
  getFillsApi,
  deleteOrderApi,
  createOrderApi,
} from "../utils/httpClient";
import { getToken } from "../utils/auth";

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

const AccountPanel = ({ market }: { market: string }) => {
  const [activeTab, setActiveTab] = useState<TabType>("Balances");
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [position, setPosition] = useState<any | null>(null);
  const [openOrdersList, setOpenOrdersList] = useState<any[]>([]);
  const [ordersHistory, setOrdersHistory] = useState<any[]>([]);
  const [fills, setFills] = useState<any[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [closingPosition, setClosingPosition] = useState<boolean>(false);
  const [noticeMsg, setNoticeMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const fetchAllData = async () => {
    const token = getToken();
    if (!token) return;

    try {
      // 1. Fetch Balances
      const balanceRes = await getBalanceApi();
      setBalanceData(extractBalance(balanceRes));

      // 2. Fetch Open Position
      try {
        const posRes = await getOpenPositionApi(market);
        const rawPos = posRes?.data?.position ?? posRes?.position ?? posRes?.data;
        if (rawPos && Object.keys(rawPos).length > 0 && rawPos.qty && parseFloat(rawPos.qty) > 0) {
          setPosition(rawPos);
        } else {
          setPosition(null);
        }
      } catch (e) {
        setPosition(null);
      }

      // 3. Fetch Open Orders
      try {
        const openOrdersRes = await getOrdersApi(market); // Or open orders
        const rawOrders = openOrdersRes?.data?.orders ?? openOrdersRes?.orders ?? [];
        if (Array.isArray(rawOrders)) {
          setOrdersHistory(rawOrders);
          setOpenOrdersList(rawOrders.filter((o: any) => o.status === "open" || o.status === "partiallyFilled"));
        } else {
          setOrdersHistory([]);
          setOpenOrdersList([]);
        }
      } catch (e) {
        setOrdersHistory([]);
        setOpenOrdersList([]);
      }

      // 4. Fetch Fills / Position History
      try {
        const fillsRes = await getFillsApi();
        const rawFills = fillsRes?.data?.fills ?? fillsRes?.data ?? fillsRes?.fills ?? [];
        const parsedFills = Array.isArray(rawFills) ? rawFills : [];
        setFills(parsedFills);
      } catch (e) {
        setFills([]);
      }
    } catch (e) {
      console.error("Failed to fetch AccountPanel data:", e);
    }
  };

  useEffect(() => {
    fetchAllData();

    const handleUpdate = () => fetchAllData();
    window.addEventListener("balanceUpdated", handleUpdate);
    window.addEventListener("orderUpdated", handleUpdate);

    return () => {
      window.removeEventListener("balanceUpdated", handleUpdate);
      window.removeEventListener("orderUpdated", handleUpdate);
    };
  }, [market]);

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
    if (!pos || closingPosition) return;
    setClosingPosition(true);
    setNoticeMsg(null);

    const closeSide = (pos.side || "").toUpperCase() === "LONG" ? "SHORT" : "LONG";
    const closeQty = pos.qty;
    const baseMarket = (pos.market || market).split("_")[0];
    const margin = pos.margin || "0";

    // Optimistic UI update: remove position from UI immediately
    setPosition(null);

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
      setClosingPosition(false);
    }
  };

  const formattedAvail = balanceData?.availableBalance ? parseFloat(balanceData.availableBalance).toFixed(2) : "0.00";
  const formattedLocked = balanceData?.lockedBalance ? parseFloat(balanceData.lockedBalance).toFixed(2) : "0.00";
  const totalBalance = (parseFloat(formattedAvail) + parseFloat(formattedLocked)).toFixed(2);

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
        <div className={`mx-4 mt-3 p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${noticeMsg.isError ? "bg-[#3B171E] text-[#F6465D] border border-[#F6465D]/30" : "bg-[#0F3A2C] text-[#00C076] border border-[#00C076]/30"}`}>
          <div className="flex items-center gap-2">
            <span>{noticeMsg.isError ? "⚠️" : "✔"}</span>
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
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Balances Tab */}
        {activeTab === "Balances" && (
          <div className="flex flex-col gap-1">
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
          <div className="flex flex-col gap-1">
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
            {position ? (
              <div className="grid grid-cols-8 items-center text-xs py-2.5 px-2 border-b border-[#23272E]/40 hover:bg-[#2B2F36]/30 transition-colors font-medium">
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
                    disabled={closingPosition}
                    onClick={() => handleClosePosition(position)}
                    className="px-2 py-1 text-[11px] font-bold bg-[#3B171E] hover:bg-[#F6465D] text-[#F6465D] hover:text-white rounded transition-colors disabled:opacity-50"
                  >
                    {closingPosition ? "Closing..." : "Market Close"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-xs text-[#848E9C]">
                No open positions
              </div>
            )}
          </div>
        )}

        {/* Open Orders Tab */}
        {activeTab === "Open Orders" && (
          <div className="flex flex-col gap-1">
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
          <div className="flex flex-col gap-1">
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
          <div className="flex flex-col gap-1">
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
