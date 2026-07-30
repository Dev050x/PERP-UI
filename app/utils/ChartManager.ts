import {
  ColorType,
  createChart,
  CrosshairMode,
  ISeriesApi,
  IChartApi,
  UTCTimestamp,
  CandlestickSeries,
} from "lightweight-charts";

export class ChartManager {
  private candleSeries: ISeriesApi<"Candlestick">;
  private lastUpdateTime: number = 0;
  private chart: IChartApi;

  constructor(
    ref: HTMLElement,
    initialData: any[],
    layout: { background: string; color: string }
  ) {
    this.chart = createChart(ref, {
      autoSize: true,
      overlayPriceScales: {
        ticksVisible: true,
        borderVisible: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        visible: true,
        ticksVisible: true,
        entireTextOnly: true,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      grid: {
        horzLines: {
          color: "#222831",
        },
        vertLines: {
          color: "#222831",
        },
      },
      layout: {
        background: {
          type: ColorType.Solid,
          color: layout.background,
        },
        textColor: "#475168",
      },
    });

    this.candleSeries = this.chart.addSeries(CandlestickSeries);

    if (initialData.length > 0) {
      this.candleSeries.setData(
        initialData.map((data) => ({
          ...data,
          time: data.timestamp as UTCTimestamp,
        }))
      );

      // Use logical range to show future dates
      const timeScale = this.chart.timeScale();
      const dataLength = initialData.length;
      
      // Show all data + 14 empty candles for future dates
      timeScale.setVisibleLogicalRange({
        from: 0,
        to: dataLength + 14,
      });
    }
  }

  public update(updatedPrice: any) {
    const currentTime = Math.floor(new Date().getTime() / 1000);

    if (!this.lastUpdateTime) {
      this.lastUpdateTime = currentTime;
    }

    this.candleSeries.update({
      time: this.lastUpdateTime as UTCTimestamp,
      close: updatedPrice.close,
      low: updatedPrice.low,
      high: updatedPrice.high,
      open: updatedPrice.open,
    });

    if (updatedPrice.newCandleInitiated) {
      this.lastUpdateTime = updatedPrice.time;
    }
  }

  public destroy() {
    this.chart.remove();
  }
}