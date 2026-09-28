"use client"
import { getDepth, createOrderApi, getApiErrorMessage } from "@/app/utils/httpClient";
import { getToken } from "@/app/utils/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBalanceContext } from "@/app/context/BalanceContext";

// Digits with an optional decimal part of at most 8 places (API limit)
const DECIMAL_INPUT = /^\d*\.?\d{0,8}$/;

const Swap = ({ market }: { market: string }) => {
    const router = useRouter();
    const { balance, availableNum, openDepositModal } = useBalanceContext();
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
    const notional = numericQty * numericPrice;
    const orderValue = notional.toFixed(2);
    const marginNum = notional > 0 && leverage > 0 ? notional / leverage : 0;
    // Sent to the API (max 8 decimals). Clamp float noise so a 100% order never exceeds available balance.
    const marginToSend = marginNum > availableNum && marginNum - availableNum < 1e-6
        ? balance.availableBalance
        : marginNum.toFixed(8);
    const marginRequired = marginNum.toFixed(2);

    const leverageOptions = [1, 2, 5, 10, 20, 50];

    const handleSliderChange = (percent: number) => {
        setSliderVal(percent);
        const currentPrice = parseFloat(price || lastPrice || "0");

        if (availableNum > 0 && currentPrice > 0) {
            const marginToUse = availableNum * (percent / 100);
            const buyingPower = marginToUse * leverage;
            // Round down so the required margin never exceeds the available balance
            const calculatedQty = Math.floor((buyingPower / currentPrice) * 1e4) / 1e4;
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

        if (marginNum > availableNum + 1e-6) {
            setStatusMsg({ text: `Insufficient balance: margin $${marginRequired} exceeds available $${availableNum.toFixed(2)}.`, isError: false, isDepositPrompt: true });
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
                // Drop a trailing "." left from typing (e.g. "144.")
                price: marketStatus === 'limit' ? price.replace(/\.$/, "") : undefined,
                qty: quantity.replace(/\.$/, ""),
                margin: marginToSend,
            });

            if (res?.success) {
                setStatusMsg({ text: res.msg || "Order placed successfully", isError: false });
                setQuantity("");
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("orderUpdated"));
                    window.dispatchEvent(new Event("balanceUpdated"));
                }
            } else {
                const rawErr = getApiErrorMessage(res, "Failed to place order");
                if (checkIsDepositError(rawErr)) {
                    setStatusMsg({ text: "Deposit USDC to start trading.", isError: false, isDepositPrompt: true });
                    openDepositModal();
                } else {
                    setStatusMsg({ text: rawErr, isError: true });
                }
            }
        } catch (err: any) {
            const rawErr = getApiErrorMessage(err, "Order placement failed");
            if (checkIsDepositError(rawErr)) {
                setStatusMsg({ text: "Deposit USDC to start trading.", isError: false, isDepositPrompt: true });
                openDepositModal();
            } else {
                setStatusMsg({ text: rawErr, isError: true });
            }
        } finally {
            setLoading(false);
        }
    };

    const baseAsset = market ? market.split("_")[0] : "SOL";
    const isBuy = side === 'buy';

    return (
        <div className="flex h-full flex-col p-4 text-[#EAECEF]">
            {/* Side */}
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#0B0E11] p-1">
                <button
                    type="button"
                    onClick={() => setSide('buy')}
                    className={`h-9 rounded-md text-sm font-semibold transition-colors ${
                        isBuy ? "bg-[#122322] text-[#00C076]" : "text-[#B7BDC6] hover:text-white"
                    }`}
                >
                    Buy / Long
                </button>
                <button
                    type="button"
                    onClick={() => setSide('sell')}
                    className={`h-9 rounded-md text-sm font-semibold transition-colors ${
                        !isBuy ? "bg-[#38161F] text-[#F6465D]" : "text-[#B7BDC6] hover:text-white"
                    }`}
                >
                    Sell / Short
                </button>
            </div>

            {/* Order type */}
            <div className="mt-4 flex gap-5 border-b border-[#2B2F36] text-sm">
                {(['limit', 'market'] as const).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setMarketStatus(t)}
                        className={`-mb-px border-b-2 pb-2 font-semibold capitalize transition-colors ${
                            marketStatus === t ? "border-white text-white" : "border-transparent text-[#848E9C] hover:text-white"
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Leverage */}
            <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-[#B7BDC6]">Leverage</span>
                    <span className="font-semibold text-white tabular-nums">{leverage}x</span>
                </div>
                <div className="grid grid-cols-6 gap-1">
                    {leverageOptions.map((lev) => (
                        <button
                            key={lev}
                            type="button"
                            onClick={() => setLeverage(lev)}
                            className={`h-7 rounded-md border text-xs font-medium tabular-nums transition-colors ${
                                leverage === lev
                                    ? "border-[#5E6673] bg-[#2B2F36] text-white"
                                    : "border-[#2B2F36] text-[#B7BDC6] hover:text-white"
                            }`}
                        >
                            {lev}x
                        </button>
                    ))}
                </div>
            </div>

            {/* Available */}
            <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-[#B7BDC6]">Available</span>
                <span className="flex items-center gap-2">
                    <span className="font-semibold text-white tabular-nums">${availableNum.toFixed(2)} USDC</span>
                    <button type="button" onClick={openDepositModal} className="font-semibold text-[#00C076] hover:text-[#00A865]">
                        Deposit
                    </button>
                </span>
            </div>

            {/* Price */}
            <FieldBox label="Price" unit="USD" className="mt-3">
                {marketStatus === 'market' ? (
                    <span className="flex-1 text-right text-sm text-[#848E9C]">Market price</span>
                ) : (
                    <>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={price}
                            onChange={(e) => DECIMAL_INPUT.test(e.target.value) && setPrice(e.target.value)}
                            placeholder={lastPrice ? parseFloat(lastPrice).toFixed(2) : "0.00"}
                            className="min-w-0 flex-1 bg-transparent text-right text-sm font-medium text-white tabular-nums placeholder:text-[#5E6673] focus:outline-none"
                        />
                        {lastPrice && (
                            <button
                                type="button"
                                onClick={() => setPrice(parseFloat(lastPrice).toFixed(2))}
                                className="rounded bg-[#2B2F36] px-1.5 py-0.5 text-[10px] font-semibold text-[#B7BDC6] hover:text-white"
                            >
                                Last
                            </button>
                        )}
                    </>
                )}
            </FieldBox>

            {/* Quantity */}
            <FieldBox label="Size" unit={baseAsset} className="mt-2">
                <input
                    type="text"
                    inputMode="decimal"
                    value={quantity}
                    onChange={(e) => {
                        if (!DECIMAL_INPUT.test(e.target.value)) return;
                        setQuantity(e.target.value);
                        setSliderVal(0);
                    }}
                    placeholder="0.00"
                    className="min-w-0 flex-1 bg-transparent text-right text-sm font-medium text-white tabular-nums placeholder:text-[#5E6673] focus:outline-none"
                />
            </FieldBox>

            {/* Size by % of available margin */}
            <PercentSlider
                value={sliderVal}
                onChange={handleSliderChange}
                color={isBuy ? "#2EBD85" : "#F6465D"}
            />

            {/* Summary */}
            <dl className="mt-4 space-y-2 border-t border-[#2B2F36] pt-4 text-xs">
                <div className="flex justify-between">
                    <dt className="text-[#B7BDC6]">Order value</dt>
                    <dd className="font-medium text-white tabular-nums">${orderValue}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-[#B7BDC6]">Margin required</dt>
                    <dd className="font-medium text-white tabular-nums">${marginRequired}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-[#B7BDC6]">Est. liquidation price</dt>
                    <dd className="font-medium text-white tabular-nums">--</dd>
                </div>
            </dl>

            <div className="mt-auto pt-4">
                {statusMsg && (
                    <div className="mb-3 flex items-center justify-between gap-2 text-xs">
                        <span className={statusMsg.isError ? "text-[#F6465D]" : statusMsg.isDepositPrompt ? "text-[#EAECEF]" : "text-[#00C076]"}>
                            {statusMsg.text}
                        </span>
                        {statusMsg.isDepositPrompt && (
                            <button
                                type="button"
                                onClick={openDepositModal}
                                className="shrink-0 font-semibold text-[#00C076] hover:text-[#00A865]"
                            >
                                Deposit
                            </button>
                        )}
                    </div>
                )}
                <button
                    type="button"
                    disabled={loading}
                    onClick={handlePlaceOrder}
                    className={`h-11 w-full rounded-md text-sm font-bold transition-colors disabled:opacity-60 ${
                        isBuy
                            ? "bg-[#2EBD85] text-black hover:bg-[#28a774]"
                            : "bg-[#F6465D] text-white hover:bg-[#e03e54]"
                    }`}
                >
                    {loading ? "Submitting…" : `${isBuy ? "Buy / Long" : "Sell / Short"} ${baseAsset}`}
                </button>
            </div>
        </div>
    );
};

const SLIDER_STOPS = [0, 25, 50, 75, 100];

// Native range input (for drag/keyboard/a11y) layered invisibly over a custom track
const PercentSlider = ({
    value,
    onChange,
    color,
}: {
    value: number;
    onChange: (v: number) => void;
    color: string;
}) => (
    <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-[#B7BDC6]">Size by balance</span>
            <span className="font-semibold text-white tabular-nums">{value}%</span>
        </div>
        <div className="relative h-5">
            {/* Track */}
            <div className="absolute inset-x-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#2B2F36]">
                <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
            </div>
            {/* Stops */}
            {SLIDER_STOPS.map((stop) => (
                <span
                    key={stop}
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] border-2"
                    style={{
                        left: `calc(0.5rem + (100% - 1rem) * ${stop / 100})`,
                        borderColor: value >= stop ? color : "#2B2F36",
                        backgroundColor: value >= stop ? color : "#181a20",
                    }}
                />
            ))}
            {/* Handle */}
            <span
                className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[#181a20] shadow"
                style={{ left: `calc(0.5rem + (100% - 1rem) * ${value / 100})`, borderColor: color }}
            />
            <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Size as percentage of available balance"
            />
        </div>
        <div className="relative mt-1 h-4 text-[10px] text-[#848E9C]">
            {SLIDER_STOPS.map((stop) => (
                <button
                    key={stop}
                    type="button"
                    onClick={() => onChange(stop)}
                    className={`absolute -translate-x-1/2 tabular-nums hover:text-white ${value === stop ? "text-white" : ""}`}
                    style={{ left: `calc(0.5rem + (100% - 1rem) * ${stop / 100})` }}
                >
                    {stop}%
                </button>
            ))}
        </div>
    </div>
);

// Input row with the label on the left and unit on the right
const FieldBox = ({
    label,
    unit,
    className = "",
    children,
}: {
    label: string;
    unit: string;
    className?: string;
    children: React.ReactNode;
}) => (
    <label className={`flex h-10 items-center gap-2 rounded-md border border-[#2B2F36] bg-[#0B0E11] px-3 transition-colors focus-within:border-[#5E6673] ${className}`}>
        <span className="text-xs text-[#B7BDC6]">{label}</span>
        {children}
        <span className="w-9 text-right text-xs text-[#848E9C]">{unit}</span>
    </label>
);

export default Swap;