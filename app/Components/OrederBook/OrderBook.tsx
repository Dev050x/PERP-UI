"use client"
import { useEffect, useState } from "react";
import { getDepth, getTicker } from "../../utils/httpClient";
import AskTable from "./AskTable";
import BidTable from "./BidTable";
import { SignalingManager } from "@/app/utils/SiganlingManager";

const OrderBook = ({ market }: { market: string }) => {
    const [bids, setBids] = useState<[string, string][] | null>(null);
    const [asks, setAsks] = useState<[string, string][] | null>(null);
    const [lastPrice, setLastPrice] = useState<string | null>(null);
    
    useEffect(() => {
        const getDepthData = async () => {
            const depth = await getDepth(market);
            setAsks(depth.asks.filter((ask: [string, string]) => parseFloat(ask[1]) > 0));
            setBids(depth.bids.filter((bid: [string, string]) => parseFloat(bid[1]) > 0).reverse());
            const ticker = await getTicker(market);
            const lastPrice = ticker?.lastPrice;
            setLastPrice(lastPrice || null);
        }

        SignalingManager.getInstance().registerCallback("depth", (data: any) => {
            console.log("Received depth data:", data);
            setBids((originalBids) => {

                const bidsAfterUpdate = [...(originalBids || [])];

                for (let j = 0; j < data.bids.length; j++) {
                    const [price, quantity] = data.bids[j];
                    const index = bidsAfterUpdate.findIndex(bid => bid[0] === price);

                    if (quantity == 0) {
                        if (index !== -1) {
                            bidsAfterUpdate.splice(index, 1);
                        }
                    } else if (index !== -1) {
                        bidsAfterUpdate[index][1] = quantity;
                    } else {
                        bidsAfterUpdate.push([price, quantity]);
                    }
                }

                return bidsAfterUpdate.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
            });

            setAsks((originalAsks) => {

                const asksAfterUpdate = [...(originalAsks || [])];

                for (let j = 0; j < data.asks.length; j++) {
                    const [price, quantity] = data.asks[j];
                    const index = asksAfterUpdate.findIndex(ask => ask[0] === price);

                    if (quantity == 0) {
                        if (index !== -1) {
                            asksAfterUpdate.splice(index, 1);
                        }
                    } else if (index !== -1) {
                        asksAfterUpdate[index][1] = quantity;
                    } else {
                        asksAfterUpdate.push([price, quantity]);
                    }
                }

                return asksAfterUpdate.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
            });
        }, `DEPTH-${market}`);

        SignalingManager.getInstance().sendMessage({ "method": "SUBSCRIBE", "params": [`depth.200ms.${market}`] });

        getDepthData();

        return () => {
            SignalingManager.getInstance().sendMessage({ "method": "UNSUBSCRIBE", "params": [`depth.200ms.${market}`] });
            SignalingManager.getInstance().deRegisterCallback("depth", `DEPTH-${market}`);
        }


    }, [market]);

    return (
        <div className="flex flex-col ">
            <div className="h-[42px] py-3 mx-3 text-[#EAECEF] font-bold">
                OderBook
            </div>
            <hr className="text-[#424755]" />
            <TableHeader />
            <div>{asks && <AskTable asks={asks} />}</div>
            <PriceBar lastPrice={lastPrice} />
            <div>{bids && <BidTable bids={bids} />}</div>
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
        <div className="sticky bottom-0 z-10 flex flex-col px-3 py-1 ">
            <div className="flex justify-between">
                <div className="flex items-center gap-1.5">
                    <button type="button" className="hover:opacity-90">
                        <p className="font-medium tabular-nums text-[#F6465D] font-bold">
                            {lastPrice}
                        </p>
                    </button>
                </div>

                <button
                    type="button"
                    className="text-xs font-medium text-[#1E90FF] hover:opacity-80"
                >
                    Recenter
                </button>
            </div>
        </div>
    )
}


export default OrderBook

