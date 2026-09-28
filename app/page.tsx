"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "./Components/Header";
import { get24hStats, MarketStats24h } from "./utils/httpClient";
import { usePolling } from "./utils/usePolling";

interface MarketInfo {
  symbol: string;
  name: string;
  asset: string;
  logo: string;
}

const MARKETS: MarketInfo[] = [
  { symbol: "SOL", name: "SOL-PERP", asset: "Solana", logo: "/coins/sol.png" },
  { symbol: "ETH", name: "ETH-PERP", asset: "Ethereum", logo: "/coins/eth.png" },
];

const formatPrice = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Compact volume for tight mobile rows: $1.2M, $845.3K
const formatCompact = (n: number) =>
  n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 });

const isUp = (s: MarketStats24h) => s.change >= 0;

const priceColor = (s: MarketStats24h) => (isUp(s) ? "text-[#00C076]" : "text-[#F6465D]");

const ChangePill = ({ s, solid = false }: { s: MarketStats24h; solid?: boolean }) => (
  <span
    className={`inline-flex justify-center rounded-md px-2 py-1 text-xs font-semibold tabular-nums ${
      solid
        ? isUp(s) ? "bg-[#00C076] text-[#0B0E11]" : "bg-[#F6465D] text-white"
        : isUp(s) ? "bg-[#00C076]/10 text-[#00C076]" : "bg-[#F6465D]/10 text-[#F6465D]"
    } ${solid ? "w-[76px]" : ""}`}
  >
    {formatChange(s)}
  </span>
);

const formatChange = (s: MarketStats24h) =>
  `${s.change >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}%`;

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<Record<string, MarketStats24h | null>>({});

  const updateAllStats = async () => {
    const results = await Promise.all(
      MARKETS.map((m) =>
        get24hStats(m.symbol).catch((e) => {
          console.error(`Error fetching stats for ${m.symbol}:`, e);
          return undefined;
        })
      )
    );
    setStats((prev) => {
      const next = { ...prev };
      // Keep the last good value if a poll fails
      MARKETS.forEach((m, i) => {
        if (results[i] !== undefined) next[m.symbol] = results[i];
      });
      return next;
    });
  };

  usePolling(updateAllStats, 5000);

  const loaded = MARKETS.some((m) => stats[m.symbol]);
  const totalVolume = MARKETS.reduce((sum, m) => sum + (stats[m.symbol]?.volumeUsd ?? 0), 0);

  return (
    <div className="bg-[#0B0E11] min-h-screen text-[#EAECEF] flex flex-col font-sans">
      <div className="bg-[#181a20] sticky top-0 z-20 w-full border-b border-[#2B2F36]">
        <Header />
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-6">
        <section className="flex flex-col items-center text-center gap-5 py-4 sm:py-8">
          <h1 className="max-w-2xl text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Trade Perpetual Futures with Sub-Millisecond Speed
          </h1>
          <p className="max-w-xl text-sm sm:text-base text-[#B7BDC6]">
            Experience ultra-fast order matching, in-memory execution, deep liquidity, and up to 50x leverage.
          </p>
          <dl className="flex justify-center gap-10 text-sm">
            <div>
              <dt className="text-xs text-[#B7BDC6]">24h volume</dt>
              <dd className="mt-0.5 font-medium text-white tabular-nums">
                {loaded ? `$${formatPrice(totalVolume)}` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#B7BDC6]">Markets</dt>
              <dd className="mt-0.5 font-medium text-white tabular-nums">{MARKETS.length}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-[#2B2F36] bg-[#181a20] overflow-hidden">
          {/* Desktop / tablet table */}
          <table className="hidden md:table w-full text-sm">
            <thead>
              <tr className="border-b border-[#2B2F36] text-xs text-[#B7BDC6]">
                <th className="py-3 pl-5 pr-3 text-left font-medium">Market</th>
                <th className="py-3 px-3 text-right font-medium">Price</th>
                <th className="py-3 px-3 text-right font-medium">24h change</th>
                <th className="hidden lg:table-cell py-3 px-3 text-right font-medium">24h high / low</th>
                <th className="py-3 px-3 text-right font-medium">24h volume</th>
                <th className="py-3 pl-3 pr-5" aria-label="Trade" />
              </tr>
            </thead>
            <tbody>
              {MARKETS.map((m) => {
                const s = stats[m.symbol];
                const href = `/trade/${m.symbol}`;
                return (
                  <tr
                    key={m.symbol}
                    onClick={() => router.push(href)}
                    className="border-b border-[#2B2F36]/60 last:border-0 hover:bg-[#1E2026] cursor-pointer transition-colors"
                  >
                    <td className="py-4 pl-5 pr-3">
                      <MarketLabel market={m} />
                    </td>
                    <td className={`py-4 px-3 text-right font-semibold tabular-nums ${s ? priceColor(s) : ""}`}>
                      {s ? `$${formatPrice(s.lastPrice)}` : <Placeholder />}
                    </td>
                    <td className="py-4 px-3 text-right">
                      {s ? <ChangePill s={s} /> : <Placeholder />}
                    </td>
                    <td className="hidden lg:table-cell py-4 px-3 text-right tabular-nums text-white">
                      {s ? `${formatPrice(s.high)} / ${formatPrice(s.low)}` : <Placeholder />}
                    </td>
                    <td className="py-4 px-3 text-right tabular-nums text-white">
                      {s ? `$${formatPrice(s.volumeUsd)}` : <Placeholder />}
                    </td>
                    <td className="py-4 pl-3 pr-5 text-right">
                      <Link
                        href={href}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-8 items-center rounded-md border border-[#2B2F36] px-3 text-xs font-medium text-white hover:border-[#00C076] hover:text-[#00C076] transition-colors"
                      >
                        Trade
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile list */}
          <ul className="md:hidden divide-y divide-[#2B2F36]/60">
            <li className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-[#B7BDC6]">
              <span className="flex-1">Market</span>
              <span className="w-24 text-right">Price</span>
              <span className="w-[76px] text-right">24h change</span>
            </li>
            {MARKETS.map((m) => {
              const s = stats[m.symbol];
              return (
                <li key={m.symbol}>
                  <Link
                    href={`/trade/${m.symbol}`}
                    className="flex items-center gap-3 px-4 py-3.5 active:bg-[#1E2026]"
                  >
                    <div className="min-w-0 flex-1">
                      <MarketLabel market={m} subtitle={s ? `$${formatCompact(s.volumeUsd)} vol` : undefined} />
                    </div>
                    <div className={`w-24 text-right text-sm font-semibold tabular-nums ${s ? priceColor(s) : ""}`}>
                      {s ? `$${formatPrice(s.lastPrice)}` : <Placeholder />}
                    </div>
                    {s ? <ChangePill s={s} solid /> : <Placeholder />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      <footer className="border-t border-[#2B2F36] py-5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-xs text-[#848E9C]">
          Prices update every 5 seconds.
        </div>
      </footer>
    </div>
  );
}

const MarketLabel = ({ market, subtitle }: { market: MarketInfo; subtitle?: string }) => (
  <div className="flex items-center gap-3 min-w-0">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={market.logo} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-full" />
    <div className="min-w-0">
      <div className="font-medium text-white truncate">{market.name}</div>
      <div className="text-xs text-[#848E9C] truncate">{subtitle ?? market.asset}</div>
    </div>
  </div>
);

const Placeholder = () => (
  <span className="inline-block h-3.5 w-14 rounded bg-[#2B2F36] animate-pulse align-middle" />
);

