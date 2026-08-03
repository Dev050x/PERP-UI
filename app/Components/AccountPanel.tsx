"use client"
import { useState } from "react";

type TabType =
  | "Balances"
  | "Positions"
  | "Order History"
  | "Position History";

const tabs: TabType[] = [
  "Balances",
  "Positions",
  "Order History",
  "Position History",
];

const AccountPanel = ({ market }: { market: string }) => {
  const [activeTab, setActiveTab] = useState<TabType>("Balances");

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

      {/* Main Body Content */}
      <div className="flex-1 p-4 overflow-y-auto">
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
              <span className="text-right tabular-nums text-[#EAECEF]">0.00</span>
              <span className="text-right tabular-nums text-[#EAECEF]">0.00</span>
              <span className="text-right tabular-nums text-[#EAECEF]">0.00</span>
            </div>
            <div className="grid grid-cols-4 items-center text-xs py-2.5 px-2 border-b border-[#23272E]/40 hover:bg-[#2B2F36]/30 transition-colors">
              <span className="font-semibold text-white text-left">{market || "SOL"}</span>
              <span className="text-right tabular-nums text-[#EAECEF]">0.00</span>
              <span className="text-right tabular-nums text-[#EAECEF]">0.00</span>
              <span className="text-right tabular-nums text-[#EAECEF]">0.00</span>
            </div>
          </div>
        )}

        {activeTab === "Positions" && (
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-7 items-center text-xs font-semibold text-[#848E9C] border-b border-[#2B2F36] pb-2 px-2">
              <span className="text-left">Market</span>
              <span className="text-left">Side</span>
              <span className="text-right">Size</span>
              <span className="text-right">Entry Price</span>
              <span className="text-right">Mark Price</span>
              <span className="text-right">Unrealized PnL</span>
              <span className="text-right">Action</span>
            </div>
            <div className="flex flex-col items-center justify-center py-10 text-xs text-[#848E9C]">
              No open positions
            </div>
          </div>
        )}

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
            <div className="flex flex-col items-center justify-center py-10 text-xs text-[#848E9C]">
              No order history
            </div>
          </div>
        )}

        {activeTab === "Position History" && (
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-5 items-center text-xs font-semibold text-[#848E9C] border-b border-[#2B2F36] pb-2 px-2">
              <span className="text-left">Time</span>
              <span className="text-left">Market</span>
              <span className="text-left">Side</span>
              <span className="text-right">Closed Size</span>
              <span className="text-right">Realized PnL</span>
            </div>
            <div className="flex flex-col items-center justify-center py-10 text-xs text-[#848E9C]">
              No position history
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPanel;
