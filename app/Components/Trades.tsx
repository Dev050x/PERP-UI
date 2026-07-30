"use client"
import { useEffect, useState } from "react"
import { getTrades } from "../utils/httpClient"
import { Trade } from "../utils/types";

const Trades = ({ market }: { market: string }) => {
    const [trades, setTrades] = useState<Trade[] | null>(null);
    useEffect(() => {
        const trades = async () => {
            const trades = await getTrades(market, "17");
            setTrades(trade => trades);
        }
        trades();
    }, [market]);

    return (
        <div className="flex flex-col ">
            <div className="h-[42px] py-3 mx-3 text-[#EAECEF] font-bold">
                Market Trades
            </div>
            <hr className="text-[#424755]" />
            <TableHeader />
            <>
                {
                    trades && trades.map((trade, index) =>
                        <Bid 
                            price={trade.price} 
                            size={trade.quantity} 
                            timestamp={trade.timestamp} 
                            color={trade.isBuyerMaker ? "#2EBD85" : "#F6465D"} 
                            key={index} 
                        />
                    )
                }
            </>

        </div>

    )
}

const TableHeader = () => {
    return (
        <div className="flex flex-row justify-between items-center h-[32px] px-3 py-2">
            <div className="flex h-full w-[18%] items-center text-[12px] text-[#848E9C]">Price</div>
            <div className="flex h-full w-[35%] items-center justify-end text-[12px] text-[#848E9C]">Size</div>
            <div className="flex h-full w-[35%] items-center justify-end text-[12px] text-[#848E9C]">Time</div>
        </div>
    );
}


const Bid = ({ price, size, timestamp, color }: { price: string; size: string; timestamp: number; color: string }) => {
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    return (

        <div className="flex flex-row justify-between items-center h-[23px] mx-3">
            <div 
                className="flex h-full w-[20%] items-center text-xs font-normal tabular-nums"
                style={{ color: color }}
            >
                {price}
            </div>
            <div className="flex h-full w-[35%] items-center justify-end text-xs font-normal tabular-nums text-[#EAECEF]/80">
                {size}
            </div>
            <div className="flex h-full w-[35%] items-center justify-end text-xs font-normal tabular-nums text-[#EAECEF]/80">
                {formatTime(timestamp)}
            </div>
        </div>
    )
}

export default Trades