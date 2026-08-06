"use client"
import { useEffect, useState } from "react"
import { getTrades } from "../utils/httpClient"
import { Trade } from "../utils/types";

const Trades = ({ market, hideHeader = false }: { market: string; hideHeader?: boolean }) => {
    const [trades, setTrades] = useState<Trade[] | null>(null);

    const fetchRecentTrades = async () => {
        try {
            const data = await getTrades(market, "30");
            setTrades(data || []);
        } catch (e) {
            console.error("Failed to fetch trades:", e);
        }
    };

    useEffect(() => {
        fetchRecentTrades();

        // 1. Polling interval every 2 seconds for fresh trades
        const intervalId = setInterval(fetchRecentTrades, 2000);

        // 2. Window event listener for immediate updates on order placement
        const handleOrderUpdate = () => fetchRecentTrades();
        window.addEventListener("orderUpdated", handleOrderUpdate);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener("orderUpdated", handleOrderUpdate);
        };
    }, [market]);

    return (
        <div className="flex flex-col">
            {!hideHeader && (
                <>
                    <div className="h-[42px] py-3 mx-3 text-[#EAECEF] font-bold">
                        Market Trades
                    </div>
                    <hr className="text-[#424755]" />
                </>
            )}
            <TableHeader />
            <div className="flex flex-col overflow-y-auto max-h-[400px]">
                {trades && trades.length > 0 ? (
                    trades.map((trade, index) => {
                        const nextTrade = trades[index + 1];
                        const currPrice = parseFloat(trade.price || "0");
                        const nextPrice = nextTrade ? parseFloat(nextTrade.price || "0") : currPrice;

                        let isGreen = index % 2 === 0;
                        if (trade.isBuyerMaker !== undefined) {
                            // Maker has LONG order -> Green (#00C076), Maker has SHORT order -> Red (#F6465D)
                            isGreen = trade.isBuyerMaker;
                        } else if (currPrice !== nextPrice) {
                            isGreen = currPrice > nextPrice;
                        }

                        const rawQty = parseFloat(trade.quantity || "0");
                        const formattedQty = rawQty % 1 === 0 ? rawQty.toFixed(0) : rawQty.toFixed(2);
                        return (
                            <Bid 
                                price={currPrice.toFixed(2)} 
                                size={formattedQty} 
                                timestamp={trade.timestamp}
                                createdAt={trade.createdAt}
                                color={isGreen ? "#00C076" : "#F6465D"} 
                                key={trade.id || index} 
                            />
                        );
                    })
                ) : (
                    <div className="flex justify-center items-center py-8 text-xs text-[#848E9C]">
                        No market trades yet
                    </div>
                )}
            </div>
        </div>
    );
};

const TableHeader = () => {
    return (
        <div className="flex flex-row justify-between items-center h-[32px] px-3 py-2 border-b border-[#2B2F36]">
            <div className="flex h-full w-[25%] items-center text-[12px] text-[#848E9C]">Price</div>
            <div className="flex h-full w-[35%] items-center justify-end text-[12px] text-[#848E9C]">Size</div>
            <div className="flex h-full w-[40%] items-center justify-end text-[12px] text-[#848E9C]">Time</div>
        </div>
    );
};

const Bid = ({ price, size, timestamp, createdAt, color }: { price: string; size: string; timestamp?: number; createdAt?: string; color: string }) => {
    const formatTime = () => {
        let date: Date | null = null;
        if (createdAt) {
            date = new Date(createdAt);
        } else if (timestamp) {
            date = new Date(timestamp > 1e11 ? timestamp : timestamp * 1000);
        }
        if (!date || isNaN(date.getTime())) return "--";
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    return (
        <div className="flex flex-row justify-between items-center h-[23px] mx-3 hover:bg-[#2B2F36]/20 transition-colors">
            <div 
                className="flex h-full w-[25%] items-center text-xs font-semibold tabular-nums"
                style={{ color: color }}
            >
                ${price}
            </div>
            <div className="flex h-full w-[35%] items-center justify-end text-xs font-medium tabular-nums text-[#EAECEF]/90">
                {size}
            </div>
            <div className="flex h-full w-[40%] items-center justify-end text-xs font-normal tabular-nums text-[#848E9C]">
                {formatTime()}
            </div>
        </div>
    );
};

export default Trades