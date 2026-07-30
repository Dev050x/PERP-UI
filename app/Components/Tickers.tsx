"use client"
import { useEffect, useState } from "react"
import { getTickers } from "../utils/httpClient";
import { Ticker } from "../utils/types";

const Tickers = () => {
    const [ticker, setTicker] = useState<Ticker[] | null>(null);

    useEffect(() => {
        const tickers = async () => {
            const tickers = await getTickers();
            const sortedTickers = tickers.sort((a, b) => {
                return parseFloat(b.lastPrice) - parseFloat(a.lastPrice);
            });
            const Tickers = sortedTickers.filter(ticker => !ticker.symbol.includes("PERP"));
            const finalTickers = Tickers.slice(0,14);
            setTicker(finalTickers);
        }
        tickers();
    }, []);

    return (
        <div className="flex flex-col ">
            <div className="h-[42px] py-3 mx-3 text-[#EAECEF] font-bold">
                Coins
            </div>
            <hr className="text-[#424755]" />
            <TableHeader />
            <>
                {
                    ticker && ticker.map((item, index) =>
                        <Bid symbol={item.symbol} lastPrice={item.lastPrice} priceChange={item.priceChangePercent} key={index} />
                    )
                }
            </>
        </div>
    )
}



const TableHeader = () => {
    return (
        <div className="flex flex-row justify-between items-center h-[32px] px-3 py-2">
            <div className="flex h-full w-[18%] items-center text-[12px] text-[#848E9C]">Coin</div>
            <div className="flex h-full w-[35%] items-center justify-end text-[12px] text-[#848E9C]">Last Price</div>
            <div className="flex h-full w-[35%] items-center justify-end text-[12px] text-[#848E9C]">24h Chg</div>
        </div>
    );
}


const Bid = ({ symbol, lastPrice, priceChange}: { symbol: string; lastPrice: string; priceChange: string;}) => {
    return (

        <div className="flex flex-row justify-between items-center h-[24px] mx-3">
            <div className={`flex h-full w-[20%] items-center text-xs font-normal tabular-nums text-[#848E9C] font-semibold`}>
                {symbol}
            </div>
            <div className="flex h-full w-[35%] items-center justify-end text-xs font-normal tabular-nums text-white">
                {lastPrice}
            </div>
            <div className={`flex h-full w-[35%] items-center justify-end text-xs font-normal tabular-nums ${parseFloat(priceChange) < 0 ? 'text-[#F6465D]' : 'text-[#2EBD85]' }`}>
                {(parseFloat(priceChange) * 100).toFixed(2)}%
            </div>
        </div>
    )
}

export default Tickers