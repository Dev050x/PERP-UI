const AskTable = ({ asks }: { asks: [string, string][] }) => {
    let currentTotal = 0;
    let relavantAsks = asks.slice(0, 15);
    let askWithTotal: [string, string, number, number][] = [];
    relavantAsks.forEach(([price, size]) => {
        const numSize = parseFloat(size);
        currentTotal += numSize;
        askWithTotal.push([price, size, currentTotal, numSize]);
    });
    askWithTotal.reverse();
    const mxTotal = currentTotal || 1;
    return (
        <>
            {askWithTotal.map(([price, size, total, levelQty], index) => {
                const totalPercentage = (total / mxTotal) * 100;
                const sizePercentage = (levelQty / mxTotal) * 100;
                return (
                    <Ask 
                        key={index} 
                        price={parseFloat(price).toFixed(2)} 
                        size={parseFloat(size)} 
                        total={parseFloat(total.toFixed(2))} 
                        totalPercentage={totalPercentage}
                        sizePercentage={sizePercentage}
                    />
                );
            })}
        </>
    );
}

const Ask = ({ 
    price, 
    size, 
    total, 
    totalPercentage, 
    sizePercentage 
}: { 
    price: string; 
    size: number; 
    total: number; 
    totalPercentage: number; 
    sizePercentage: number; 
}) => {
    return (
        <div className="relative flex flex-row justify-between items-center h-[23px] px-3 border-b border-[#23272E]/50 overflow-hidden">
            {/* Lighter red bar representing cumulative total quantity till this price level */}
            <div 
                className="absolute top-0 right-0 h-full bg-[#F6465D]/15 transition-all duration-200"
                style={{ width: `${totalPercentage}%` }}
            />
            {/* Darker red bar representing current price level quantity */}
            <div 
                className="absolute top-0 right-0 h-full bg-[#F6465D]/40 transition-all duration-200"
                style={{ width: `${sizePercentage}%` }}
            />
            <div 
                className="relative z-10 flex h-full w-[30%] items-center text-xs font-normal tabular-nums"
                style={{ color: "oklab(0.667935 0.195332 0.0881307 / 0.9)" }}
            >
                {price}
            </div>
            <div 
                className="relative z-10 flex h-full w-[35%] items-center justify-end text-xs font-normal tabular-nums"
                style={{ color: "oklab(0.967711 0.000790805 -0.00252581 / 0.8)" }}
            >
                {size}
            </div>
            <div 
                className="relative z-10 flex h-full w-[35%] items-center justify-end text-xs font-normal tabular-nums"
                style={{ color: "oklab(0.967711 0.000790805 -0.00252581 / 0.8)" }}
            >
                {total}
            </div>
        </div>
    )
}

export default AskTable;