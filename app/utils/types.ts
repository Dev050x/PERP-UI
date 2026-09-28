export interface Ticker {
    firstPrice: string;
    high: string;
    lastPrice: string;
    low: string;
    priceChange: string;
    priceChangePercent: string;
    quoteVolume: string;
    symbol: string;
    trades: string;
    volume: string;
}

export interface Depth {
    asks: [string, string][],
    bids: [string, string][],
    lastUpdateId: string
    timestamp: string
}

export interface Kline {
    timestamp: number | string; // bucket start (unix seconds/ms or ISO string)
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
}

export interface Trade {
    id: number | string;
    isBuyerMaker?: boolean;
    price: string;
    quantity: string;
    quoteQuantity?: string;
    timestamp: number;
    createdAt?: string;
}


export type DepthLevel = [string, string];

// Backend sends both sides in ascending price order; the UI wants best price first
export function normalizeDepth(bids?: DepthLevel[], asks?: DepthLevel[]) {
    const valid = (levels?: DepthLevel[]) => (levels ?? []).filter(([, qty]) => parseFloat(qty) > 0);
    return {
        bids: valid(bids).sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])),
        asks: valid(asks).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])),
    };
}
