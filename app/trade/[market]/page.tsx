"use client"
import { useState } from "react";
import AccountPanel from "@/app/Components/AccountPanel";
import Header from "@/app/Components/Header";
import MarketBar from "@/app/Components/MarketBar";
import OrderBook from "@/app/Components/OrederBook/OrderBook";
import Swap from "@/app/Components/SwapUi/Swap";
import TradeView from "@/app/Components/TradeView";
import { useParams } from "next/navigation";

type MobilePanel = "chart" | "book";

// One component tree for all sizes (so the WS subscription, polling and chart
// aren't duplicated). Below lg it stacks; from lg up the grid fills the viewport:
// 340px book | chart over 281px account panel | 350px order form.
const TradePage = () => {
  const {market} = useParams();
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("chart");

  return (
    <div className="bg-[#0B0E11] flex flex-col min-h-screen gap-1 lg:h-screen lg:overflow-hidden">
      <div className="bg-[#181a20] sticky top-0 z-20 w-full">
        <Header />
      </div>
      <div className="bg-[#0B0E11] text-high-emphasis flex flex-1 flex-col lg:min-h-0 lg:overflow-auto">
        <div className="flex flex-col gap-1 px-2 pb-2 lg:grid lg:h-full lg:min-h-[720px] lg:grid-cols-[340px_minmax(0,1fr)_350px] lg:grid-rows-[auto_minmax(0,1fr)_281px]">
          <div className="bg-[#181a20] rounded-[8px] lg:col-start-1 lg:col-end-3 lg:row-start-1">
            <MarketBar key={market as string} market={market as string}/>
          </div>

          {/* Mobile only: switch between chart and order book */}
          <div className="lg:hidden grid grid-cols-2 gap-1 rounded-[8px] bg-[#181a20] p-1">
            {(["chart", "book"] as const).map((panel) => (
              <button
                key={panel}
                type="button"
                onClick={() => setMobilePanel(panel)}
                className={`h-8 rounded-[6px] text-xs font-semibold transition-colors ${
                  mobilePanel === panel ? "bg-[#2B2F36] text-[#EAECEF]" : "text-[#848E9C]"
                }`}
              >
                {panel === "chart" ? "Chart" : "Order Book"}
              </button>
            ))}
          </div>

          <div
            className={`${mobilePanel === "chart" ? "block" : "hidden"} lg:block h-[380px] sm:h-[460px] lg:h-auto lg:min-h-0 bg-[#181a20] rounded-[8px] lg:col-start-2 lg:row-start-2`}
          >
            <TradeView market={market as string}/>
          </div>

          <div
            className={`${mobilePanel === "book" ? "block" : "hidden"} lg:block bg-[#181a20] rounded-[8px] lg:min-h-0 lg:overflow-hidden lg:col-start-1 lg:row-start-2 lg:row-span-2`}
          >
            <OrderBook market = {market as string}/>
          </div>

          <div className="bg-[#181a20] rounded-[8px] lg:min-h-0 lg:overflow-y-auto no-scrollbar lg:col-start-3 lg:row-start-1 lg:row-span-3">
            {/* key resets form state (price, qty) when switching markets */}
            <Swap key={market as string} market={market as string}/>
          </div>

          <div className="h-[360px] lg:h-auto lg:min-h-0 bg-[#181a20] rounded-[8px] lg:col-start-2 lg:row-start-3">
            <AccountPanel market={market as string}/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TradePage
