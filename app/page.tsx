"use client";
import React, { useState } from "react";
import Image from "next/image";
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
    } ${solid ? "w-[76px] shrink-0" : ""}`}
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
    <div className="bg-[#181a20] min-h-screen text-[#EAECEF] flex flex-col font-sans">
      <div className="bg-[#181a20] sticky top-0 z-20 w-full">
        <Header />
      </div>

      <main className="w-full">
        {/* Hero */}
        <section className="mx-auto flex max-w-3xl flex-col items-center px-4 sm:px-6 pt-12 sm:pt-20 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.05]">
            Trade Perpetual Futures with <span className="text-[#00C076]">Sub-Millisecond</span> Speed
          </h1>
          <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-[#B7BDC6]">
            Experience ultra-fast order matching, in-memory execution, deep liquidity, and up to 50x leverage.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/trade/SOL"
              className="inline-flex h-10 items-center rounded-lg bg-white px-5 text-sm font-semibold text-[#14151b] hover:bg-[#EAECEF] transition-colors"
            >
              Start Trading
            </Link>
            <a
              href="#markets"
              className="inline-flex h-10 items-center rounded-lg bg-[#2B2F36] px-5 text-sm font-semibold text-white hover:bg-[#363A45] transition-colors"
            >
              View Markets
            </a>
          </div>
        </section>

        {/* App preview: framed screenshot, cropped at the bottom by the stats bar */}
        <section className="mx-auto mt-12 sm:mt-16 max-w-5xl px-4 sm:px-6">
          <Link
            href="/trade/SOL"
            aria-label="Open the trading terminal"
            className="relative block h-[200px] sm:h-[340px] lg:h-[420px] overflow-hidden rounded-t-2xl border border-b-0 border-white/10 bg-[#1E2026] p-1.5 sm:p-2 pb-0 sm:pb-0"
          >
            <div className="overflow-hidden rounded-t-xl border border-b-0 border-white/5">
              <Image
                src="/assets/trading-ui.webp"
                alt="PERP trading terminal with order book, candlestick chart and order form"
                width={1917}
                height={928}
                priority
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="block h-auto w-full"
              />
            </div>
            {/* Fade the cropped bottom into the page */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-[#181a20]" />
          </Link>
        </section>

        {/* Stats bar */}
        <section className="border-y border-white/5">
          <dl className="mx-auto grid max-w-4xl grid-cols-2 sm:grid-cols-4 px-4 py-6 sm:py-8">
            {[
              { label: "24h Volume", value: loaded ? `$${formatCompact(totalVolume)}` : "—" },
              { label: "Markets", value: String(MARKETS.length) },
              { label: "Max Leverage", value: "50x" },
              { label: "Collateral", value: "USDC" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`flex flex-col-reverse items-center py-3 sm:py-0 ${
                  i > 0 ? "sm:border-l border-white/5" : ""
                } ${i % 2 === 1 ? "border-l border-white/5" : ""}`}
              >
                <dt className="mt-1 text-sm text-[#B7BDC6]">{stat.label}</dt>
                <dd className="text-2xl sm:text-3xl font-semibold text-white tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <div id="markets" className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-10 sm:pb-16 scroll-mt-16">
        <h2 className="mb-4 text-xl sm:text-2xl font-bold text-white">Markets</h2>
        <section className="rounded-lg border border-white/5 bg-[#1E2026] overflow-hidden">
          {/* Desktop / tablet table */}
          <table className="hidden md:table w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-[#B7BDC6]">
                <th className="py-3 pl-5 pr-3 text-left font-medium">Market</th>
                <th className="py-3 px-3 text-right font-medium">Price</th>
                <th className="py-3 px-3 text-right font-medium">24h change</th>
                <th className="hidden lg:table-cell py-3 px-3 text-right font-medium">24h high</th>
                <th className="hidden lg:table-cell py-3 px-3 text-right font-medium">24h low</th>
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
                    className="border-b border-white/5 last:border-0 hover:bg-[#2B2F36]/60 cursor-pointer transition-colors"
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
                      {s ? `$${formatPrice(s.high)}` : <Placeholder />}
                    </td>
                    <td className="hidden lg:table-cell py-4 px-3 text-right tabular-nums text-white">
                      {s ? `$${formatPrice(s.low)}` : <Placeholder />}
                    </td>
                    <td className="py-4 px-3 text-right tabular-nums text-white">
                      {s ? `$${formatPrice(s.volumeUsd)}` : <Placeholder />}
                    </td>
                    <td className="py-4 pl-3 pr-5 text-right">
                      <Link
                        href={href}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-8 items-center rounded-md bg-[#2B2F36] px-3 text-xs font-semibold text-white hover:bg-[#363A45] transition-colors"
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
          <ul className="md:hidden divide-y divide-white/5">
            <li className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-[#B7BDC6]">
              <span className="flex-1">Market</span>
              <span className="w-24 shrink-0 text-right">Price</span>
              <span className="w-[76px] shrink-0 text-right">24h change</span>
            </li>
            {MARKETS.map((m) => {
              const s = stats[m.symbol];
              return (
                <li key={m.symbol}>
                  <Link
                    href={`/trade/${m.symbol}`}
                    className="flex items-center gap-3 px-4 py-3.5 active:bg-[#2B2F36]/60"
                  >
                    <div className="min-w-0 flex-1">
                      <MarketLabel market={m} subtitle={s ? `$${formatCompact(s.volumeUsd)} vol` : undefined} />
                    </div>
                    <div className={`w-24 shrink-0 text-right text-sm font-semibold tabular-nums ${s ? priceColor(s) : ""}`}>
                      {s ? `$${formatPrice(s.lastPrice)}` : <Placeholder />}
                    </div>
                    {s ? <ChangePill s={s} solid /> : <Placeholder />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <footer className="border-t border-white/5">

        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="py-12 sm:py-16">
            <h2 className="text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight text-white">
              Start
              <br />
              Trading
            </h2>
            <p className="mt-4 max-w-sm text-sm text-[#B7BDC6]">
              Trade SOL and ETH perpetuals on a fast in-memory order book, margined in USDC.
            </p>
            <Link
              href="/trade/SOL"
              className="group mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#14151b] hover:bg-[#EAECEF] transition-colors"
            >
              Launch App
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>

          <div className="flex flex-col items-center gap-4 border-t border-white/5 py-6 sm:flex-row sm:justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white">
              <Image src="/logo.png" alt="" width={20} height={20} />
              PERP
            </span>
            <span className="text-xs text-[#848E9C]">© {new Date().getFullYear()} PERP. All rights reserved.</span>
            <div className="flex items-center gap-4 text-[#B7BDC6]">
              <a href="https://x.com/div5533" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://github.com/0xDev05" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                </svg>
              </a>
            </div>
          </div>
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

