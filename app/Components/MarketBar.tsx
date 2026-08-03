const MarketBar = ({ market }: { market: string }) => {
    const symbol = market ? market.toUpperCase() : "SOL_USDC";

    return (
        <div className="flex items-center flex-row bg-base-background-l1 relative w-full rounded-lg">
            <div className="flex items-center flex-row no-scrollbar mr-4 ml-4 h-[65px] w-full overflow-auto">
                <div className="flex justify-between flex-row w-full gap-4">
                    <div className="flex flex-row shrink-0 gap-6">
                        <div className="flex flex-row gap-2">
                            <button
                                type="button"
                                className="rounded-xl pl-2 hover:opacity-80"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex mr-1">
                                        <a href={`/trade/${symbol}`}>
                                            <div className="flex items-center min-w-max gap-2">
                                                <div className="relative shrink-0">
                                                    <img
                                                        src="/coins/sol.png"
                                                        alt="SOL Logo"
                                                        width={24}
                                                        height={24}
                                                        className="rounded-full"
                                                    />
                                                </div>
                                                <p className="font-bold text-nowrap text-[#EAECEF]">
                                                   {symbol}
                                                </p>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </button>

                        </div>
                        <div className="flex items-center flex-row flex-wrap gap-x-6">
                            <div className="flex flex-col justify-center">
                                <button type="button" className="cursor-help">
                                    <p className="text-lg font-medium tabular-nums text-[#F6465D]">
                                        --
                                    </p>
                                </button>
                                <p className="text-sm font-normal tabular-nums text-[#EAECEF]">
                                    --
                                </p>
                            </div>
                            <div className="flex flex-col justify-center">
                                <p className="text-xs font-medium text-[#848E9C]">
                                    24H Change
                                </p>
                                <span className="mt-1 text-sm font-normal tabular-nums text-[#0ECB81]">
                                    +0.00%
                                </span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <p className="text-xs font-medium text-[#848E9C]">
                                    24H High
                                </p>
                                <span className="mt-1 text-sm font-normal tabular-nums text-[#EAECEF]">
                                    --
                                </span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <p className="text-xs font-medium text-[#848E9C]">
                                    24H Low
                                </p>
                                <span className="mt-1 text-sm font-normal tabular-nums text-[#EAECEF]">
                                    --
                                </span>
                            </div>
                            <button
                                type="button"
                                className="text-left text-base font-medium text-[#1E90FF] hover:opacity-80"
                            >
                                <div className="flex flex-col justify-center">
                                    <p className="text-xs font-medium text-[#848E9C]">
                                        24H Volume (USD)
                                    </p>
                                    <span className="mt-1 text-sm font-normal tabular-nums text-[#EAECEF]">
                                        --
                                    </span>
                                </div>
                            </button>


                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MarketBar


