const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";

export type DepthData = {
  bids: [string, string][];
  asks: [string, string][];
};

type DepthUpdateCallback = (data: DepthData) => void;

class WebSocketManager {
  private socket: WebSocket | null = null;
  private callbacks: Map<string, Set<DepthUpdateCallback>> = new Map();
  private isConnected: boolean = false;
  private pendingSubscriptions: Set<string> = new Set();

  public connect() {
    if (typeof window === "undefined") return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(WS_URL);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.pendingSubscriptions.forEach((market) => {
          this.sendSubscribe(market);
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.market && data?.depth) {
            const market = data.market.toUpperCase();
            const bids: [string, string][] = data.depth.bids || [];
            const asks: [string, string][] = data.depth.asks || [];

            // Trigger callbacks matching either ETH or ETH_USDC
            this.callbacks.forEach((cbSet, key) => {
              if (key === market || key.startsWith(market)) {
                cbSet.forEach((cb) => cb({ bids, asks }));
              }
            });
          }
        } catch (e) {
          console.error("WS message parse error:", e);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        setTimeout(() => this.connect(), 3000);
      };

      this.socket.onerror = (err) => {
        console.error("WS connection error:", err);
      };
    } catch (e) {
      console.error("WS connection failed:", e);
    }
  }

  private sendSubscribe(market: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const marketSymbol = market.split("_")[0].toUpperCase();
      this.socket.send(
        JSON.stringify({
          method: "SUBSCRIBE",
          params: [marketSymbol],
          id: `${marketSymbol.toLowerCase()}-depth-stream`,
        })
      );
    }
  }

  public subscribeDepth(market: string, callback: DepthUpdateCallback) {
    const marketSymbol = market.split("_")[0].toUpperCase();
    if (!this.callbacks.has(marketSymbol)) {
      this.callbacks.set(marketSymbol, new Set());
    }
    this.callbacks.get(marketSymbol)!.add(callback);
    this.pendingSubscriptions.add(marketSymbol);

    if (this.isConnected) {
      this.sendSubscribe(marketSymbol);
    } else {
      this.connect();
    }

    return () => {
      const cbs = this.callbacks.get(marketSymbol);
      if (cbs) {
        cbs.delete(callback);
        if (cbs.size === 0) {
          this.callbacks.delete(marketSymbol);
          this.pendingSubscriptions.delete(marketSymbol);
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(
              JSON.stringify({
                msg: "UNSUBSCRIBE",
                id: `${marketSymbol.toLowerCase()}-depth-stream`,
              })
            );
          }
        }
      }
    };
  }
}

export const wsManager = new WebSocketManager();
