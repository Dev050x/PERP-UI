// TradeView.tsx
import { useEffect, useRef } from "react";
import { ChartManager } from "../utils/ChartManager";
import { getKlines } from "../utils/httpClient";
import { Kline } from "../utils/types";

export default function TradeView({
  market,
}: {
  market: string;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager>(null);

  useEffect(() => {
    // Set on cleanup so a slow candle response for a previous market doesn't mount a second chart
    let cancelled = false;

    const init = async () => {
      let klineData: Kline[] = [];
      try {
        const startTime = Math.floor(
          (new Date().getTime() - 1000 * 60 * 60 * 24 * 7) / 1000
        );
        klineData = await getKlines(market, "1h", startTime.toString());
      } catch (e) {
        console.error("Failed to fetch candles:", e);
      }

      if (cancelled) return;

      if (chartRef.current) {

        // Convert timestamp to valid seconds for lightweight-charts
        const formattedData = (klineData || [])
          .map((x: any) => {
            const rawTime = x.timestamp ?? x.time ?? x.end ?? x.start;
            let timeInSec: number;
            if (typeof rawTime === "number") {
              timeInSec = rawTime > 1e11 ? Math.floor(rawTime / 1000) : rawTime;
            } else if (typeof rawTime === "string") {
              const parsed = Number(rawTime);
              if (!isNaN(parsed) && parsed > 0) {
                timeInSec = parsed > 1e11 ? Math.floor(parsed / 1000) : parsed;
              } else {
                timeInSec = Math.floor(new Date(rawTime).getTime() / 1000);
              }
            } else {
              timeInSec = Math.floor(Date.now() / 1000);
            }

            return {
              close: parseFloat(x.close || "0"),
              high: parseFloat(x.high || "0"),
              low: parseFloat(x.low || "0"),
              open: parseFloat(x.open || "0"),
              timestamp: timeInSec,
            };
          })
          .filter((x) => !isNaN(x.timestamp) && x.timestamp > 0)
          .sort((x, y) => x.timestamp - y.timestamp)
          .filter((item, index, self) => index === 0 || item.timestamp > self[index - 1].timestamp);

        const chartManager = new ChartManager(
          chartRef.current,
          formattedData,
          {
            background: "#181a20",
            color: "#475168",
          }
        );
        chartManagerRef.current = chartManager;
      }
    };
    init();

    return () => {
      cancelled = true;
      chartManagerRef.current?.destroy();
      chartManagerRef.current = null;
    };
  }, [market]);

  return (
    <>
      <div
        ref={chartRef}
        // 515px on desktop (unchanged); fills the shorter mobile chart panel
        className="h-[calc(100%-4px)] lg:h-[515px]"
        style={{ width: "100%", marginTop: 4 }}
      ></div>
    </>
  );
}