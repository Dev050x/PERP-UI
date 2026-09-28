import { normalizeDepth } from "./types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL!;

// Delay before telling the server we're done with a market, so a quick
// remount (React strict mode, market switch back) doesn't re-subscribe.
const UNSUBSCRIBE_DELAY_MS = 2000;

export type DepthData = {
  bids: [string, string][];
  asks: [string, string][];
};

// `null` means the server dropped its cached depth (it sends `depth: {}` after a
// cancel) — the subscriber should refetch a REST snapshot.
type DepthUpdateCallback = (data: DepthData | null) => void;

const EMPTY = "EMPTY";

const streamId = (market: string) => `${market.toLowerCase()}-depth-stream`;

class WebSocketManager {
  private socket: WebSocket | null = null;
  private callbacks: Map<string, Set<DepthUpdateCallback>> = new Map();
  // Markets subscribed on the current socket
  private subscribed: Set<string> = new Set();
  private unsubscribeTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  // The server re-broadcasts identical depth many times per second; keep the
  // last raw payload to drop duplicates and the latest parsed depth per market
  private lastRaw: Map<string, string> = new Map();
  private latest: Map<string, DepthData | null> = new Map();
  private dirty: Set<string> = new Set();
  private flushScheduled = false;

  public connect() {
    if (typeof window === "undefined") return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(WS_URL);

      this.socket.onopen = () => {
        this.callbacks.forEach((_, market) => this.sendSubscribe(market));
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!data?.market) return;
          const market = String(data.market).toUpperCase();
          if (!this.callbacks.has(market)) return;

          const hasDepth = !!(data.depth?.bids || data.depth?.asks);
          const raw = hasDepth ? JSON.stringify(data.depth) : EMPTY;
          if (this.lastRaw.get(market) === raw) return;
          const hadDepth = this.lastRaw.has(market) && this.lastRaw.get(market) !== EMPTY;
          this.lastRaw.set(market, raw);

          if (!hasDepth) {
            // `{}` before the first snapshot is just "not loaded yet"; after real depth it means the book changed
            if (!hadDepth) return;
            this.latest.set(market, null);
          } else {
            this.latest.set(market, normalizeDepth(data.depth.bids, data.depth.asks));
          }
          this.dirty.add(market);
          this.scheduleFlush();
        } catch (e) {
          console.error("WS message parse error:", e);
        }
      };

      this.socket.onclose = () => {
        this.subscribed.clear();
        setTimeout(() => this.connect(), 3000);
      };

      this.socket.onerror = (err) => {
        console.error("WS connection error:", err);
      };
    } catch (e) {
      console.error("WS connection failed:", e);
    }
  }

  // Deliver at most one update per market per animation frame
  private scheduleFlush() {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    requestAnimationFrame(() => {
      this.flushScheduled = false;
      this.dirty.forEach((market) => {
        const depth = this.latest.get(market) ?? null;
        this.callbacks.get(market)?.forEach((cb) => cb(depth));
      });
      this.dirty.clear();
    });
  }

  private sendSubscribe(market: string) {
    if (this.subscribed.has(market)) return;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          method: "SUBSCRIBE",
          params: [market],
          id: streamId(market),
        })
      );
      this.subscribed.add(market);
    }
  }

  private sendUnsubscribe(market: string) {
    this.subscribed.delete(market);
    this.lastRaw.delete(market);
    this.latest.delete(market);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Server expects `msg` (not `method`) for UNSUBSCRIBE
      this.socket.send(JSON.stringify({ msg: "UNSUBSCRIBE", id: streamId(market) }));
    }
  }

  public subscribeDepth(market: string, callback: DepthUpdateCallback) {
    const marketSymbol = market.split("_")[0].toUpperCase();

    const pendingUnsub = this.unsubscribeTimers.get(marketSymbol);
    if (pendingUnsub) {
      clearTimeout(pendingUnsub);
      this.unsubscribeTimers.delete(marketSymbol);
    }

    if (!this.callbacks.has(marketSymbol)) {
      this.callbacks.set(marketSymbol, new Set());
    }
    this.callbacks.get(marketSymbol)!.add(callback);

    // Hand a remounted component the last known depth right away
    const cached = this.latest.get(marketSymbol);
    if (cached) callback(cached);

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.sendSubscribe(marketSymbol);
    } else {
      this.connect();
    }

    return () => {
      const cbs = this.callbacks.get(marketSymbol);
      if (!cbs) return;
      cbs.delete(callback);
      if (cbs.size > 0) return;
      this.callbacks.delete(marketSymbol);
      this.unsubscribeTimers.set(
        marketSymbol,
        setTimeout(() => {
          this.unsubscribeTimers.delete(marketSymbol);
          if (!this.callbacks.has(marketSymbol)) this.sendUnsubscribe(marketSymbol);
        }, UNSUBSCRIBE_DELAY_MS)
      );
    };
  }
}

export const wsManager = new WebSocketManager();
