"use client";
import React, { useEffect, useState } from "react";
import { getDepth, getKlines, getTrades } from "../utils/httpClient";

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
    const symbol = market ? market.toUpperCase() : "SOL_USDC";
    const baseAsset = symbol.split("_")[0];
    const coinLogo = baseAsset === "ETH" ? "/coins/eth.png" : "/coins/sol.png";

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
            const [tradesData, candlesData, depthData] = await Promise.all([
                getTrades(market, "100").catch(() => []),
                getKlines(market, "1d", undefined, 50).catch(() => []),
                getDepth(market).catch(() => null),
            ]);

            const trades = Array.isArray(tradesData) ? tradesData : [];
            const candles = Array.isArray(candlesData) ? candlesData : [];

            // 1. Current Price calculation
            let lastPriceNum = 0;
            if (trades.length > 0 && trades[0].price) {
                lastPriceNum = parseFloat(trades[0].price);
            } else if (depthData && (depthData.bids?.length || depthData.asks?.length)) {
                const bestBid = depthData.bids?.[0] ? parseFloat(depthData.bids[0][0]) : 0;
                const bestAsk = depthData.asks?.[0] ? parseFloat(depthData.asks[0][0]) : 0;
                if (bestBid && bestAsk) lastPriceNum = (bestBid + bestAsk) / 2;
                else lastPriceNum = bestBid || bestAsk;
            }

            if (!lastPriceNum || isNaN(lastPriceNum)) return;

            // 2. High, Low, Volume, Open Price calculation
            let high = lastPriceNum;
            let low = lastPriceNum;
            let totalVolume = 0;
            let openPrice = lastPriceNum;

            if (trades.length > 0) {
                trades.forEach((t) => {
                    const p = parseFloat(t.price || "0");
                    const q = parseFloat(t.quantity || "0");
                    if (p > high) high = p;
                    if (p < low && p > 0) low = p;
                    totalVolume += p * q;
                });
                const lastTradePrice = parseFloat(trades[trades.length - 1].price || "0");
                if (lastTradePrice > 0) openPrice = lastTradePrice;
            }

            if (candles.length > 0) {
                const latestCandle = candles[candles.length - 1];
                if (latestCandle) {
                    const cHigh = parseFloat(latestCandle.high || "0");
                    const cLow = parseFloat(latestCandle.low || "0");
                    const cOpen = parseFloat(latestCandle.open || "0");
                    const cVol = parseFloat(latestCandle.quoteVolume || latestCandle.volume || "0");

                    if (cHigh > high) high = cHigh;
                    if (cLow < low && cLow > 0) low = cLow;
                    if (cOpen > 0) openPrice = cOpen;
                    if (cVol > 0) totalVolume = Math.max(totalVolume, cVol);
                }
            }

            const priceDiff = lastPriceNum - openPrice;
            const percentChange = openPrice > 0 ? (priceDiff / openPrice) * 100 : 0;
            const isPos = priceDiff >= 0;

            setStats({
                currentPrice: lastPriceNum.toFixed(2),
                priceChange24h: `${isPos ? "+" : ""}${priceDiff.toFixed(2)}`,
                priceChangePercent: `${isPos ? "+" : ""}${percentChange.toFixed(2)}%`,
                high24h: high.toFixed(2),
                low24h: low.toFixed(2),
                volume24h: totalVolume > 0 ? totalVolume.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "0.00",
                isPositive: isPos,
            });
        } catch (e) {
            console.error("Error updating market bar stats:", e);
        }
    };

    useEffect(() => {
        fetchMarketStats();
        const intervalId = setInterval(fetchMarketStats, 2000);
        const handleOrderUpdate = () => fetchMarketStats();

        window.addEventListener("orderUpdated", handleOrderUpdate);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener("orderUpdated", handleOrderUpdate);
        };
    }, [market]);

    return (
        <div className="flex items-center flex-row bg-[#181a20] relative w-full rounded-lg border border-[#2B2F36]/50">
            <div className="flex items-center flex-row no-scrollbar mr-4 ml-4 h-[65px] w-full overflow-auto">
                <div className="flex justify-between flex-row w-full gap-4">
                    <div className="flex flex-row shrink-0 gap-6">
                        <div className="flex flex-row gap-2">
                            <button
                                type="button"
                                className="rounded-xl pl-2 hover:opacity-80 transition-opacity"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex mr-1">
                                        <a href={`/trade/${symbol}`}>
                                            <div className="flex items-center min-w-max gap-2">
                                                <div className="relative shrink-0">
                                                    <img
                                                        src={coinLogo}
                                                        alt={`${symbol} Logo`}
                                                        width={24}
                                                        height={24}
                                                        className="rounded-full"
                                                        onError={(e) => {
                                                            (e.target as HTMLElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                                <p className="font-bold text-nowrap text-[#EAECEF]">
                                                   {symbol}
                                                </p>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </button>
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



