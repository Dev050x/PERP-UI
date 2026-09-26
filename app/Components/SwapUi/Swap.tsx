"use client"
import { getDepth, createOrderApi } from "@/app/utils/httpClient";
import { getToken } from "@/app/utils/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBalanceContext } from "@/app/context/BalanceContext";

const Swap = ({ market }: { market: string }) => {
    const router = useRouter();
    const { balance, openDepositModal } = useBalanceContext();
    const availableEquity = balance.availableBalance;
    const [side, setSide] = useState<'buy' | 'sell'>('buy');
    const [marketStatus, setMarketStatus] = useState<'limit' | 'market'>('limit');
    const [lastPrice, setLastPrice] = useState<string | null>(null);
    const [price, setPrice] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [sliderVal, setSliderVal] = useState<number>(0);
    const [leverage, setLeverage] = useState<number>(10);
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean; isDepositPrompt?: boolean } | null>(null);

    useEffect(() => {
        const getDepthData = async () => {
            try {
                const depth = await getDepth(market);
                const firstPrice = depth?.asks?.[0]?.[0] || depth?.bids?.[0]?.[0];
                if (firstPrice) {
                    setLastPrice(firstPrice);
                    if (!price) {
                        setPrice(parseFloat(firstPrice).toFixed(2));
                    }
                }
            } catch (e) {
                console.error("Failed to fetch depth for Swap:", e);
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

    const handleSliderChange = (percent: number) => {
        setSliderVal(percent);
        const avail = parseFloat(availableEquity || "0");
        const currentPrice = parseFloat(price || lastPrice || "0");

        if (avail > 0 && currentPrice > 0) {
            const marginToUse = avail * (percent / 100);
            const buyingPower = marginToUse * leverage;
            const calculatedQty = buyingPower / currentPrice;
            setQuantity(calculatedQty > 0 ? calculatedQty.toFixed(4) : "0");
        } else {
            setQuantity("0");
        }
    };

    const handlePlaceOrder = async () => {
        setStatusMsg(null);
        const token = getToken();
        if (!token) {
            router.push("/signin");
            return;
        }

        if (!numericQty || numericQty <= 0) {
            setStatusMsg({ text: "Please enter a valid quantity", isError: true });
            return;
        }

        if (marketStatus === 'limit' && (!numericPrice || numericPrice <= 0)) {
            setStatusMsg({ text: "Please enter a valid limit price", isError: true });
            return;
        }

        const baseMarket = market ? market.split("_")[0] : "SOL";
        setLoading(true);

        const checkIsDepositError = (rawErr: string) => {
            const lower = rawErr.toLowerCase();
            return (
                lower.includes("user does not deposit") ||
                lower.includes("deposit any asset") ||
                lower.includes("not have enough balance") ||
                lower.includes("insufficient balance")
            );
        };

        try {
            const res = await createOrderApi({
                market: baseMarket,
                side: side === 'buy' ? "LONG" : "SHORT",
                type: marketStatus,
                price: marketStatus === 'limit' ? price : undefined,
                qty: quantity,
                margin: marginRequired,
            });

            if (res?.success) {
                setStatusMsg({ text: res.msg || "Order placed successfully", isError: false });
                setQuantity("");
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("orderUpdated"));
                    window.dispatchEvent(new Event("balanceUpdated"));
                }
            } else {
                const rawErr = res?.error || res?.msg || "Failed to place order";
                if (typeof rawErr === "string" && checkIsDepositError(rawErr)) {
                    setStatusMsg({ text: "Deposit USDC to start trading.", isError: false, isDepositPrompt: true });
                    openDepositModal();
                } else {
                    setStatusMsg({ text: rawErr, isError: true });
                }
            }
        } catch (err: any) {
            const errorData = err.response?.data;
            const rawErr = errorData?.error || errorData?.msg || err.message || "Order placement failed";
            if (typeof rawErr === "string" && checkIsDepositError(rawErr)) {
                setStatusMsg({ text: "Deposit USDC to start trading.", isError: false, isDepositPrompt: true });
                openDepositModal();
            } else {
                setStatusMsg({ text: rawErr, isError: true });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full p-5 justify-between text-[#EAECEF] bg-[#181a20] rounded-[8px]">
            <div className="flex flex-col gap-4">
                {/* Side Selector Tabs (Buy / Long vs Sell / Short) */}
                <div className="grid grid-cols-2 bg-[#0B0E11] rounded-xl gap-0.5">
                    <button
                        type="button"
                        onClick={() => setSide('buy')}
                        className={`h-11 text-sm font-semibold rounded-lg transition-all ${
                            side === 'buy'
                                ? "bg-[#122322] text-[#00C076]"
                                : "bg-transparent text-[#848E9C] hover:text-white"
                        }`}
                    >
                        Buy / Long
                    </button>
                    <button
                        type="button"
                        onClick={() => setSide('sell')}
                        className={`h-11 text-sm font-semibold rounded-lg transition-all ${
                            side === 'sell'
                                ? "bg-[#38161F] text-[#F6465D]"
                                : "bg-transparent text-[#848E9C] hover:text-white"
                        }`}
                    >
                        Sell / Short
                    </button>
                </div>

                {/* Status Message Banner */}
                {statusMsg && (
                    <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
                        statusMsg.isError 
                            ? "bg-[#3B171E] text-[#F6465D] border border-[#F6465D]/30" 
                            : statusMsg.isDepositPrompt
                                ? "bg-[#1E2026] text-[#EAECEF] border border-[#00C076]/40"
                                : "bg-[#0F3A2C] text-[#00C076] border border-[#00C076]/30"
                    }`}>
                        <span>{statusMsg.text}</span>
                        {statusMsg.isDepositPrompt && (
                            <button
                                type="button"
                                onClick={openDepositModal}
                                className="px-3 py-1 text-xs font-bold text-black bg-[#00C076] hover:bg-[#00C076]/90 rounded-lg shrink-0 transition-colors"
                            >
                                Deposit Funds
                            </button>
                        )}
                    </div>
                )}

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
                    <div className="flex justify-between items-center text-sm px-0.5">
                        <span className="text-[#848E9C]">Leverage</span>
                    </div>
                    <div className="grid grid-cols-6 gap-1 bg-[#0B0E11] p-1 rounded-lg">
                        {leverageOptions.map((lev) => (
                            <button
                                key={lev}
                                type="button"
                                onClick={() => setLeverage(lev)}
                                className={`py-1.5 text-[12px] rounded transition-all ${
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
                    <span className="font-semibold text-white">${availableEquity} USDC</span>
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
                        <span className="absolute right-3 text-xs text-[#848E9C] font-semibold">{market ? market.split("_")[0] : "SOL"}</span>
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
                        onChange={(e) => handleSliderChange(Number(e.target.value))}
                        className="w-full h-1.5 bg-[#2B2F36] rounded-lg appearance-none cursor-pointer accent-[#2EBD85]"
                    />
                    <div className="flex justify-between text-[11px] text-[#848E9C] px-1">
                        {[0, 25, 50, 75, 100].map((pct) => (
                            <button
                                key={pct}
                                type="button"
                                onClick={() => handleSliderChange(pct)}
                                className={`hover:text-white transition-colors ${sliderVal === pct ? "text-[#00C076] font-bold" : ""}`}
                            >
                                {pct}%
                            </button>
                        ))}
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
                disabled={loading}
                onClick={handlePlaceOrder}
                className={`w-full h-12 rounded-lg text-sm font-bold transition-all shadow-md mt-4 disabled:opacity-50 ${
                    side === 'buy'
                        ? "bg-[#2EBD85] hover:bg-[#28a774] text-black"
                        : "bg-[#F6465D] hover:bg-[#e03e54] text-white"
                }`}
            >
                {loading ? "Submitting..." : side === 'buy' ? "Buy / Long" : "Sell / Short"}
            </button>
        </div>
    );
};

export default Swap;