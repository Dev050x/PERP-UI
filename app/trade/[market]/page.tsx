"use client"
import Header from "@/app/Components/Header";
import MarketBar from "@/app/Components/MarketBar";
import OrderBook from "@/app/Components/OrederBook/OrderBook";
import Swap from "@/app/Components/SwapUi/Swap";
import Tickers from "@/app/Components/Tickers";
import Trades from "@/app/Components/Trades";
import TradeView from "@/app/Components/TradeView";
import { useParams } from "next/navigation";


const page = () => {
  const {market} = useParams();
  return (
    <div className="bg-[#0B0E11] flex flex-col max-h-screen min-h-screen overflow-y-hidden gap-1">
      <div className="bg-[#181a20] sticky top-0 z-20 w-full">
        <Header />
      </div>
      <div className="bg-[#0B0E11] text-high-emphasis flex flex-1 flex-col justify-between overflow-auto mx-25">
            <div className="flex flex-row h-full w-full flex-1 gap-1 px-4">
              <div className="flex flex-col flex-1 gap-1">
                <div className="bg-[#181a20] rounded-[8px] ">
                  <MarketBar market={market as string}/>
                </div>
                <div className="flex flex-row flex-1 gap-1">
                  <div className="w-[380px] bg-[#181a20] rounded-[8px] h-[810px]">
                    <OrderBook market = {market as string}/>
                  </div>
                  <div className="flex flex-col flex-1 gap-1">
                    <div className="h-[524px] bg-[#181a20] rounded-[8px]">
                      <TradeView market={market as string}/>
                    </div>
                    <div className=" bg-[#181a20] rounded-[8px]">
                      <Swap market={market as string}/>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col w-[380px] gap-1">
                <div className="h-[419px] bg-[#181a20] rounded-[8px]">
                  <Tickers />
                </div>
                <div className="h-[480px] bg-[#181a20] rounded-[8px]">
                  <Trades market={market as string}/>
                </div>
              </div>
            </div>
      </div>
    </div>
  );
}

export default page