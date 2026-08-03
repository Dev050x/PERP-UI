"use client"
import AccountPanel from "@/app/Components/AccountPanel";
import Header from "@/app/Components/Header";
import MarketBar from "@/app/Components/MarketBar";
import OrderBook from "@/app/Components/OrederBook/OrderBook";
import Swap from "@/app/Components/SwapUi/Swap";
import TradeView from "@/app/Components/TradeView";
import { useParams } from "next/navigation";


const page = () => {
  const {market} = useParams();
  return (
    <div className="bg-[#0B0E11] flex flex-col max-h-screen min-h-screen overflow-y-hidden gap-1">
      <div className="bg-[#181a20] sticky top-0 z-20 w-full">
        <Header />
      </div>
      <div className="bg-[#0B0E11] text-high-emphasis flex flex-1 flex-col justify-between overflow-auto">
            <div className="flex flex-row h-full w-full flex-1 gap-1 px-2">
              <div className="flex flex-col flex-1 gap-1">
                <div className="bg-[#181a20] rounded-[8px] ">
                  <MarketBar market={market as string}/>
                </div>
                <div className="flex flex-row flex-1 gap-1">
                  <div className="w-[340px] bg-[#181a20] rounded-[8px] h-[810px]">
                    <OrderBook market = {market as string}/>
                  </div>
                  <div className="flex flex-col flex-1 gap-1">
                    <div className="h-[524px] bg-[#181a20] rounded-[8px]">
                      <TradeView market={market as string}/>
                    </div>
                    <div className="h-[281px] bg-[#181a20] rounded-[8px]">
                      <AccountPanel market={market as string}/>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col w-[350px] gap-1">
                <div className="h-[700px] bg-[#181a20] rounded-[8px]">
                  <Swap market={market as string}/>
                </div>
              </div>
            </div>
      </div>
    </div>
  );
}

export default page