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
    const init = async () => {
      let klineData: Kline[] = [];
      try {
        const startTime = Math.floor(
          (new Date().getTime() - 1000 * 60 * 60 * 24 * 7) / 1000
        );
        klineData = await getKlines(market, "1h", startTime.toString());
      } catch (e) {}

      if (chartRef.current) {
        if (chartManagerRef.current) {
          chartManagerRef.current.destroy();
        }

        // Convert timestamp to seconds (unix epoch)
        const chartData = (klineData || [])
          .map((x) => ({
            close: parseFloat(x.close),
            high: parseFloat(x.high),
            low: parseFloat(x.low),
            open: parseFloat(x.open),
            // x.end should already be a timestamp in milliseconds
            // Convert to seconds for lightweight-charts
            timestamp: Math.floor(new Date(x.end).getTime() / 1000),
          }))
          .sort((x, y) => x.timestamp - y.timestamp);

        const chartManager = new ChartManager(
          chartRef.current,
          chartData,
          {
            background: "#181a20",
            color: "#475168",
          }
        );
        chartManagerRef.current = chartManager;
      }
    };
    init();
  }, [market, chartRef]);

  return (
    <>
      <div
        ref={chartRef}
        style={{ height: "515px", width: "100%", marginTop: 4 }}
      ></div>
    </>
  );
}