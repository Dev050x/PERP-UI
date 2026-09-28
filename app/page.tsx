"use client";
import React, { useState } from "react";
import Link from "next/link";
import Header from "./Components/Header";
import { get24hStats } from "./utils/httpClient";
import { usePolling } from "./utils/usePolling";

interface MarketPairData {
  symbol: string;
  name: string;
  baseAsset: string;
  logo: string;
  price: string;
  change24h: string;
  high24h: string;
  low24h: string;
  volume24h: string;
  isPositive: boolean;
  tradeUrl: string;
}

export default function Home() {
  const [pairs, setPairs] = useState<MarketPairData[]>([
    {
      symbol: "SOL",
      name: "SOL-PERP",
      baseAsset: "SOL",
      logo: "/coins/sol.png",
      price: "--",
      change24h: "+0.00%",
      high24h: "--",
      low24h: "--",
      volume24h: "--",
      isPositive: true,
      tradeUrl: "/trade/SOL",
    },
    {
      symbol: "ETH",
      name: "ETH-PERP",
      baseAsset: "ETH",
      logo: "/coins/eth.png",
      price: "--",
      change24h: "+0.00%",
      high24h: "--",
      low24h: "--",
      volume24h: "--",
      isPositive: true,
      tradeUrl: "/trade/ETH",
    },
  ]);

  const fetchPairStats = async (marketSymbol: string) => {
    try {
      const s = await get24hStats(marketSymbol);
      if (!s) return null;
      const isPos = s.change >= 0;
      return {
        price: s.lastPrice.toFixed(2),
        change24h: `${isPos ? "+" : ""}${s.changePercent.toFixed(2)}%`,
        high24h: s.high.toFixed(2),
        low24h: s.low.toFixed(2),
        volume24h: s.volumeUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        isPositive: isPos,
      };
    } catch (e) {
      console.error(`Error fetching stats for ${marketSymbol}:`, e);
      return null;
    }
  };

  const updateAllStats = async () => {
    const [solStats, ethStats] = await Promise.all([fetchPairStats("SOL"), fetchPairStats("ETH")]);

    setPairs((prev) =>
      prev.map((pair) => {
        if (pair.symbol === "SOL" && solStats) {
          return { ...pair, ...solStats };
        }
        if (pair.symbol === "ETH" && ethStats) {
          return { ...pair, ...ethStats };
        }
        return pair;
      })
    );
  };

  usePolling(updateAllStats, 5000);

  return (
    <div className="bg-[#0B0E11] min-h-screen text-white flex flex-col font-sans">
      {/* Header Bar */}
      <div className="bg-[#181a20] sticky top-0 z-20 w-full border-b border-[#2B2F36]/60">
        <Header />
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10 flex flex-col gap-10">
        {/* Hero Banner */}
        <section className="flex flex-col items-center text-center gap-4 py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E2026] border border-[#2B2F36] text-xs text-[#00C076] font-medium">
            High-Performance Derivatives Exchange
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-2xl">
            Trade Perpetual Futures with Sub-Millisecond Speed
          </h1>
          <p className="text-base text-[#848E9C] max-w-xl">
            Experience ultra-fast order matching, in-memory execution, deep liquidity, and up to 10x leverage.
          </p>
        </section>

        {/* Markets Table Section */}
        <section className="bg-[#181a20] rounded-2xl border border-[#2B2F36]/60 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-[#2B2F36]/60 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Supported Markets</h2>
              <p className="text-xs text-[#848E9C] mt-1">Select a perpetual pair to start trading</p>
            </div>
            <div className="text-xs text-[#848E9C] bg-[#1E2026] px-3 py-1.5 rounded-lg border border-[#2B2F36]">
              2 Active Pairs
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2B2F36]/60 text-xs font-semibold text-[#848E9C]">
                  <th className="py-4 px-6">Pair</th>
                  <th className="py-4 px-6 text-right">Last Price</th>
                  <th className="py-4 px-6 text-right">24H Change</th>
                  <th className="py-4 px-6 text-right">24H High</th>
                  <th className="py-4 px-6 text-right">24H Low</th>
                  <th className="py-4 px-6 text-right">24H Volume (USD)</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B2F36]/40">
                {pairs.map((pair) => (
                  <tr key={pair.symbol} className="hover:bg-[#1E2026]/50 transition-colors group">
                    {/* Pair Info */}
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#202127] p-1.5 flex items-center justify-center shrink-0 border border-[#2B2F36]">
                          <img
                            src={pair.logo}
                            alt={`${pair.baseAsset} Logo`}
                            className="w-full h-full object-contain rounded-full"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-base group-hover:text-[#00C076] transition-colors">
                            {pair.name}
                          </span>
                          <span className="text-xs text-[#848E9C]">Perpetual Contract</span>
                        </div>
                      </div>
                    </td>

                    {/* Last Price */}
                    <td className="py-5 px-6 text-right font-bold text-white tabular-nums text-base">
                      ${pair.price}
                    </td>

                    {/* 24H Change */}
                    <td className="py-5 px-6 text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold tabular-nums ${
                          pair.isPositive
                            ? "bg-[#00C076]/10 text-[#00C076]"
                            : "bg-[#F6465D]/10 text-[#F6465D]"
                        }`}
                      >
                        {pair.change24h}
                      </span>
                    </td>

                    {/* 24H High */}
                    <td className="py-5 px-6 text-right text-sm font-medium text-[#EAECEF] tabular-nums">
                      ${pair.high24h}
                    </td>

                    {/* 24H Low */}
                    <td className="py-5 px-6 text-right text-sm font-medium text-[#EAECEF] tabular-nums">
                      ${pair.low24h}
                    </td>

                    {/* 24H Volume */}
                    <td className="py-5 px-6 text-right text-sm font-medium text-[#EAECEF] tabular-nums">
                      ${pair.volume24h}
                    </td>

                    {/* Action Button */}
                    <td className="py-5 px-6 text-right">
                      <Link
                        href={pair.tradeUrl}
                        className="inline-flex items-center justify-center px-4 py-2 bg-[#00C076] hover:bg-[#00A865] text-black font-bold text-xs rounded-xl transition-all shadow-lg hover:shadow-[#00C076]/20"
                      >
                        Trade {pair.baseAsset}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2B2F36]/60 py-6 text-center text-xs text-[#848E9C]">
        PERP Exchange — High-Frequency Derivatives Platform
      </footer>
    </div>
  );
}
