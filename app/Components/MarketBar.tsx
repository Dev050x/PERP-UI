"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { get24hStats } from "../utils/httpClient";
import { usePolling } from "../utils/usePolling";

const MARKET_STATS_POLL_MS = 3000;

interface MarketStats {
    currentPrice: string;
    priceChange24h: string;
    priceChangePercent: string;
    high24h: string;
    low24h: string;
    volume24h: string;
    isPositive: boolean;
}

const MarketBar = ({ market }: { market: string }) => {
    const rawSymbol = market ? market.toUpperCase() : "SOL";
    const baseAsset = rawSymbol.split(/[_:-]/)[0] || "SOL";
    const displayMarket = `${baseAsset}-PERP`;
    const coinLogo = baseAsset.includes("ETH") ? "/coins/eth.png" : "/coins/sol.png";
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [stats, setStats] = useState<MarketStats>({
        currentPrice: "--",
        priceChange24h: "+0.00",
        priceChangePercent: "+0.00%",
        high24h: "--",
        low24h: "--",
        volume24h: "--",
        isPositive: true,
    });

    const fetchMarketStats = async () => {
        try {
            const s = await get24hStats(baseAsset);
            if (!s) return;
            const isPos = s.change >= 0;
            setStats({
                currentPrice: s.lastPrice.toFixed(2),
                priceChange24h: `${isPos ? "+" : ""}${s.change.toFixed(2)}`,
                priceChangePercent: `${isPos ? "+" : ""}${s.changePercent.toFixed(2)}%`,
                high24h: s.high.toFixed(2),
                low24h: s.low.toFixed(2),
                volume24h: s.volumeUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                isPositive: isPos,
            });
        } catch (e) {
            console.error("Error updating market bar stats:", e);
        }
    };

    usePolling(fetchMarketStats, MARKET_STATS_POLL_MS, [baseAsset]);

    useEffect(() => {
        const handleOrderUpdate = () => fetchMarketStats();
        window.addEventListener("orderUpdated", handleOrderUpdate);
        return () => window.removeEventListener("orderUpdated", handleOrderUpdate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseAsset]);

    return (
        <div className="flex items-center flex-row bg-[#181a20] relative w-full rounded-lg border border-[#2B2F36]/50">
            <div className="flex items-center flex-row no-scrollbar mr-4 ml-4 h-[65px] w-full overflow-auto">
                <div className="flex justify-between flex-row w-full gap-4">
                    <div className="flex flex-row shrink-0 gap-6">
                        <div className="flex flex-row gap-2 relative">
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="rounded-xl pl-2 hover:opacity-80 transition-opacity"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex mr-1">
                                        <div className="flex items-center min-w-max gap-2">
                                            <div className="relative shrink-0 w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-[#202127]">
                                                 <img
                                                     key={coinLogo}
                                                     src={coinLogo}
                                                     alt={`${displayMarket} Logo`}
                                                     width={24}
                                                     height={24}
                                                     className="w-full h-full object-cover rounded-full"
                                                 />
                                             </div>
                                            <p className="font-bold text-nowrap text-[#EAECEF] flex items-center gap-1.5">
                                               {displayMarket}
                                               <span className="text-[10px] text-[#848E9C]">▼</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {/* Market Selector Dropdown */}
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-44 bg-[#181a20] border border-[#2B2F36] rounded-xl shadow-2xl z-50 flex flex-col p-1.5">
                                    <Link
                                        href="/trade/SOL"
                                        onClick={() => setIsDropdownOpen(false)}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                                            baseAsset === "SOL" ? "bg-[#2B2F36] text-[#00C076]" : "text-[#EAECEF] hover:bg-[#2B2F36]/50"
                                        }`}
                                    >
                                        <img src="/coins/sol.png" alt="SOL" className="w-5 h-5 rounded-full" />
                                        <span>SOL-PERP</span>
                                    </Link>
                                    <Link
                                        href="/trade/ETH"
                                        onClick={() => setIsDropdownOpen(false)}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                                            baseAsset === "ETH" ? "bg-[#2B2F36] text-[#00C076]" : "text-[#EAECEF] hover:bg-[#2B2F36]/50"
                                        }`}
                                    >
                                        <img src="/coins/eth.png" alt="ETH" className="w-5 h-5 rounded-full" />
                                        <span>ETH-PERP</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center flex-row flex-wrap gap-x-8">
                            {/* Current Price */}
                            <div className="flex flex-col justify-center">
                                <p className={`text-lg font-bold tabular-nums ${stats.isPositive ? 'text-[#00C076]' : 'text-[#F6465D]'}`}>
                                    ${stats.currentPrice}
                                </p>
                                <p className="text-xs font-normal tabular-nums text-[#848E9C]">
                                    {stats.priceChange24h}
                                </p>
                            </div>

                            {/* 24H Change */}
                            <div className="flex flex-col justify-center">
                                <p className="text-xs font-medium text-[#848E9C]">
                                    24H Change
                                </p>
                                <span className={`mt-1 text-sm font-semibold tabular-nums ${stats.isPositive ? 'text-[#00C076]' : 'text-[#F6465D]'}`}>
                                    {stats.priceChangePercent}
                                </span>
                            </div>

                            {/* 24H High */}
                            <div className="flex flex-col justify-center">
                                <p className="text-xs font-medium text-[#848E9C]">
                                    24H High
                                </p>
                                <span className="mt-1 text-sm font-semibold tabular-nums text-[#EAECEF]">
                                    ${stats.high24h}
                                </span>
                            </div>

                            {/* 24H Low */}
                            <div className="flex flex-col justify-center">
                                <p className="text-xs font-medium text-[#848E9C]">
                                    24H Low
                                </p>
                                <span className="mt-1 text-sm font-semibold tabular-nums text-[#EAECEF]">
                                    ${stats.low24h}
                                </span>
                            </div>

                            {/* 24H Volume */}
                            <div className="flex flex-col justify-center">
                                <p className="text-xs font-medium text-[#848E9C]">
                                    24H Volume (USD)
                                </p>
                                <span className="mt-1 text-sm font-semibold tabular-nums text-[#EAECEF]">
                                    ${stats.volume24h}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketBar;



