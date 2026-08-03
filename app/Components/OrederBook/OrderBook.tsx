"use client"
import { useEffect, useState } from "react";
import { getDepth } from "../../utils/httpClient";
import { wsManager, DepthData } from "@/app/utils/wsClient";
import AskTable from "./AskTable";
import BidTable from "./BidTable";
import Trades from "../Trades";

const OrderBook = ({ market }: { market: string }) => {
    const [activeTab, setActiveTab] = useState<"book" | "trades">("book");
    const [bids, setBids] = useState<[string, string][] | null>(null);
    const [asks, setAsks] = useState<[string, string][] | null>(null);
    const [lastPrice, setLastPrice] = useState<string | null>(null);
    
    useEffect(() => {
        // Initial REST Depth Snapshot
        const fetchInitialDepth = async () => {
            try {
                const depth = await getDepth(market);
                if (depth) {
                    const validAsks = (depth.asks || []).filter((ask: [string, string]) => parseFloat(ask[1]) > 0);
                    const validBids = (depth.bids || []).filter((bid: [string, string]) => parseFloat(bid[1]) > 0).reverse();
                    setAsks(validAsks);
                    setBids(validBids);
                    if (validAsks.length > 0) {
                        setLastPrice(validAsks[0][0]);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch initial depth:", e);
            }
        };

        fetchInitialDepth();

        // Real-Time WebSocket Depth Stream Subscription
        const unsubscribe = wsManager.subscribeDepth(market, (data: DepthData) => {
            const validAsks = (data.asks || []).filter((ask: [string, string]) => parseFloat(ask[1]) > 0);
            const validBids = (data.bids || []).filter((bid: [string, string]) => parseFloat(bid[1]) > 0);

            setAsks(validAsks);
            setBids(validBids);

            if (validAsks.length > 0) {
                setLastPrice(validAsks[0][0]);
            } else if (validBids.length > 0) {
                setLastPrice(validBids[0][0]);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [market]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 h-[42px] px-3 py-2 border-b border-[#2B2F36]">
                <button
                    type="button"
                    onClick={() => setActiveTab("book")}
                    className={`px-3 py-1 text-xs font-semibold rounded-[6px] transition-colors ${
                        activeTab === "book"
                            ? "bg-[#2B2F36] text-[#EAECEF]"
                            : "text-[#848E9C] hover:text-[#EAECEF]"
                    }`}
                >
                    Book
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("trades")}
                    className={`px-3 py-1 text-xs font-semibold rounded-[6px] transition-colors ${
                        activeTab === "trades"
                            ? "bg-[#2B2F36] text-[#EAECEF]"
                            : "text-[#848E9C] hover:text-[#EAECEF]"
                    }`}
                >
                    Trades
                </button>
            </div>
            {activeTab === "book" ? (
                <>
                    <TableHeader />
                    <div>{asks && <AskTable asks={asks} />}</div>
                    <PriceBar lastPrice={lastPrice} />
                    <div>{bids && <BidTable bids={bids} />}</div>
                </>
            ) : (
                <Trades market={market} hideHeader={true} />
            )}
        </div>
    )
}


const TableHeader = () => {
    return (
        <div className="flex flex-row justify-between items-center h-[32px] px-3 py-2">
            <div className="flex h-full w-[30%] items-center text-[12px] text-[#848E9C]">Price</div>
            <div className="flex h-full w-[35%] items-center justify-end text-[12px] text-[#848E9C]">Size</div>
            <div className="flex h-full w-[35%] items-center justify-end text-[12px] text-[#848E9C]">Total</div>
        </div>
    );
}

const PriceBar = ({ lastPrice }: { lastPrice: string | null }) => {
    return (
        <div className="sticky bottom-0 z-10 flex flex-col px-3 py-1">
            <div className="flex items-center gap-1.5">
                <p 
                    className="font-bold text-lg tabular-nums"
                    style={{ color: "oklab(0.667935 0.195332 0.0881307 / 0.9)" }}
                >
                    {lastPrice ? parseFloat(lastPrice).toFixed(2) : null}
                </p>
            </div>
        </div>
    )
}


export default OrderBook

