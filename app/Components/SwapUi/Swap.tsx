"use client"
import { getTicker } from "@/app/utils/httpClient";
import { useEffect, useState } from "react";

const Swap = ({ market }: { market: string }) => {
    const [side, setSide] = useState<'buy' | 'sell'>('buy');
    const [marketStatus, setMarketStatus] = useState<'limit' | 'market'>('limit');
    const [lastPrice, setLastPrice] = useState<string | null>(null);
    const [price, setPrice] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [sliderVal, setSliderVal] = useState<number>(0);
    const [leverage, setLeverage] = useState<number>(10);

    useEffect(() => {
        const getDepthData = async () => {
            const ticker = await getTicker(market);
            const priceVal = ticker?.lastPrice;
            setLastPrice(priceVal || null);
            if (priceVal && !price) {
                setPrice(parseFloat(priceVal).toFixed(2));
            }
        };
        getDepthData();
    }, [market]);

    const numericPrice = parseFloat(price || lastPrice || "0");
    const numericQty = parseFloat(quantity || "0");
    const orderValue = (numericQty * numericPrice).toFixed(2);
    const marginRequired = (numericQty * numericPrice > 0 && leverage > 0)
        ? ((numericQty * numericPrice) / leverage).toFixed(2)
        : "0.00";

    const leverageOptions = [1, 2, 5, 10, 20, 50];

    return (
        <div className="flex flex-col h-full p-5 justify-between text-[#EAECEF] bg-[#181a20] rounded-[8px]">
            <div className="flex flex-col gap-4">
                {/* Side Selector Tabs (Buy / Long vs Sell / Short) */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0B0E11] rounded-xl">
                    <button
                        type="button"
                        onClick={() => setSide('buy')}
                        className={`h-11 text-sm font-semibold rounded-lg transition-all ${
                            side === 'buy'
                                ? "bg-[#0F3A2C] text-[#00C076]"
                                : "text-[#848E9C] hover:text-white"
                        }`}
                    >
                        Buy / Long
                    </button>
                    <button
                        type="button"
                        onClick={() => setSide('sell')}
                        className={`h-11 text-sm font-semibold rounded-lg transition-all ${
                            side === 'sell'
                                ? "bg-[#501A24] text-[#F6465D]"
                                : "text-[#848E9C] hover:text-white"
                        }`}
                    >
                        Sell / Short
                    </button>
                </div>

                {/* Order Type Tabs */}
                <div className="flex items-center gap-4 border-b border-[#2B2F36] pb-2 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setMarketStatus('limit')}
                        className={`${marketStatus === 'limit' ? "text-white font-bold border-b-2 border-white pb-1 -mb-[9px]" : "text-[#848E9C] hover:text-white"}`}
                    >
                        Limit
                    </button>
                    <button
                        type="button"
                        onClick={() => setMarketStatus('market')}
                        className={`${marketStatus === 'market' ? "text-white font-bold border-b-2 border-white pb-1 -mb-[9px]" : "text-[#848E9C] hover:text-white"}`}
                    >
                        Market
                    </button>
                </div>

                {/* Leverage Selector */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs px-0.5">
                        <span className="text-[#848E9C]">Leverage</span>
                        <span className="font-bold text-[#2EBD85]">{leverage}x</span>
                    </div>
                    <div className="grid grid-cols-6 gap-1 bg-[#0B0E11] p-1 rounded-lg">
                        {leverageOptions.map((lev) => (
                            <button
                                key={lev}
                                type="button"
                                onClick={() => setLeverage(lev)}
                                className={`py-1.5 text-[11px] font-semibold rounded transition-all ${
                                    leverage === lev
                                        ? "bg-[#2B2F36] text-white"
                                        : "text-[#848E9C] hover:text-white"
                                }`}
                            >
                                {lev}x
                            </button>
                        ))}
                    </div>
                </div>

                {/* Available Equity */}
                <div className="flex justify-between items-center text-xs px-0.5">
                    <span className="text-[#848E9C]">Available Equity</span>
                    <span className="font-semibold text-white">$0.00</span>
                </div>

                {/* Price Input */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs px-0.5">
                        <span className="text-[#848E9C]">Price</span>
                    </div>
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            disabled={marketStatus === 'market'}
                            value={marketStatus === 'market' ? "Market" : price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder={lastPrice ? parseFloat(lastPrice).toFixed(2) : "0.00"}
                            className="w-full h-11 px-3 bg-[#0B0E11] border border-[#2B2F36] rounded-lg text-sm text-white focus:outline-none focus:border-[#424755] disabled:opacity-50"
                        />
                        <span className="absolute right-3 text-xs text-[#848E9C] font-semibold">$</span>
                    </div>
                </div>

                {/* Quantity Input */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-[#848E9C]">Quantity</span>
                    </div>
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="0"
                            className="w-full h-11 px-3 bg-[#0B0E11] border border-[#2B2F36] rounded-lg text-sm text-white focus:outline-none focus:border-[#424755]"
                        />
                        <span className="absolute right-3 text-xs text-[#848E9C] font-semibold">{market || "SOL"}</span>
                    </div>
                </div>

                {/* Continuous Percentage Slider (0-100% with point buttons) */}
                <div className="flex flex-col gap-2 my-1">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={sliderVal}
                        onChange={(e) => setSliderVal(Number(e.target.value))}
                        className="w-full h-1.5 bg-[#2B2F36] rounded-lg appearance-none cursor-pointer accent-[#2EBD85]"
                    />
                    <div className="flex justify-between text-[11px] text-[#848E9C] px-1">
                        <button type="button" onClick={() => setSliderVal(0)} className="hover:text-white">0%</button>
                        <button type="button" onClick={() => setSliderVal(25)} className="hover:text-white">25%</button>
                        <button type="button" onClick={() => setSliderVal(50)} className="hover:text-white">50%</button>
                        <button type="button" onClick={() => setSliderVal(75)} className="hover:text-white">75%</button>
                        <button type="button" onClick={() => setSliderVal(100)} className="hover:text-white">100%</button>
                    </div>
                </div>

                {/* Order Summary Values */}
                <div className="flex flex-col gap-2.5 pt-3 border-t border-[#2B2F36] text-xs">
                    <div className="flex justify-between text-[#848E9C]">
                        <span>Order Value</span>
                        <span className="text-white font-medium">${orderValue}</span>
                    </div>
                    <div className="flex justify-between text-[#848E9C]">
                        <span>Margin Required</span>
                        <span className="text-white font-medium">${marginRequired}</span>
                    </div>
                    <div className="flex justify-between text-[#848E9C]">
                        <span>Est. Liquidation Price</span>
                        <span className="text-white font-medium">--</span>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <button
                type="button"
                className={`w-full h-12 rounded-lg text-sm font-bold transition-all shadow-md mt-4 ${
                    side === 'buy'
                        ? "bg-[#2EBD85] hover:bg-[#28a774] text-black"
                        : "bg-[#F6465D] hover:bg-[#e03e54] text-white"
                }`}
            >
                {side === 'buy' ? "Buy / Long" : "Sell / Short"}
            </button>
        </div>
    );
};

export default Swap;