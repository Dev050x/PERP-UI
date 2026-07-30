"use client"
import { getTicker } from "@/app/utils/httpClient";
import { use, useEffect, useState } from "react";
import InputBox from "./InputBox";
import Button from "./Button";

const Swap = ({ market }: { market: string }) => {
    const [marketStatus, setMarketStatus] = useState<'limit' | 'market'>('limit');
    const [lastPrice, setLastPrice] = useState<string | null>(null);

    useEffect(() => {
        const getDepthData = async () => {
            const ticker = await getTicker(market);
            const lastPrice = ticker?.lastPrice;
            setLastPrice(lastPrice || null);
            console.log("Last Price:", lastPrice);
        }
        getDepthData();
    }, [market]);

    return (
        <div>
            <div className="h-[41px] mx-[16px]">
                <button className="pt-[12px] pb-[6px] mx-[16px] text-[#848E9C] font-semibold cursor-pointer hover:text-white" onClick={() => setMarketStatus('limit')}>Limit</button>
                <button className="pt-[12px] pb-[6px] mx-[16px] text-[#848E9C] font-semibold cursor-pointer hover:text-white" onClick={() => setMarketStatus('market')}>Market</button>
            </div>
            <hr className="text-[#424755]" />
            <div>
                <div className="flex flex-row mx-[3px] my-[10px] pb-[6px]">
                    <InputBox placeholder={lastPrice || "Price"} isMarket={marketStatus} />
                    <InputBox placeholder={lastPrice || "Price"} isMarket={marketStatus} />
                </div>
                <div className="flex flex-row mx-[3px] my-[6px] pb-[6px]">
                    <InputBox placeholder="USDC" isMarket={marketStatus} />
                    <InputBox placeholder="USDC" isMarket={marketStatus} />
                </div>
                <div className="flex flex-row mx-[6px] my-[6px] pb-[6px] items-center">
                    <IOC />
                    <IOC />
                </div>
                <div className="flex flex-row mx-[6px] my-[6px] pb-[6px]">
                    <Button color="bg-[#2EBD85]" label="Buy" />
                    <Button color="bg-[#F6465D]" label="Sell" />
                </div>
            </div>

        </div>
    )
}

const IOC = () => {
    return (
        <div className="w-full flex items-center gap-1">
            <input
                type="checkbox"
                className="h-[13px] w-[13px] border border-[#848E9C] rounded bg-transparent cursor-pointer appearance-none checked:bg-[#FCD535] checked:border-[#FCD535] relative
                after:content-['✓'] after:absolute after:top-[-2px] after:left-[1px] after:text-[10px] after:text-black after:hidden checked:after:block"
            />
            <label className="text-[#848E9C] text-[12px] cursor-pointer">IOC</label>
        </div>
    )
}


export default Swap