const BidTable = ({ bids }: { bids: [string, string][] }) => {
    let currentTotal = 0;
    let relavantBids = bids.slice(0, 15);
    let bidWithTotal: [string, string, number, number][] = [];
    relavantBids.forEach(([price, size]) => {
        const numSize = parseFloat(size);
        currentTotal += numSize;
        bidWithTotal.push([price, size, currentTotal, numSize]);
    });
    const maxTotal = currentTotal || 1;
    return (
        <>
            {bidWithTotal.map(([price, size, total, levelQty], index) => {
                const totalPercentage = (total / maxTotal) * 100;
                const sizePercentage = (levelQty / maxTotal) * 100;
                return (
                    <Bid 
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

const Bid = ({ 
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
            {/* Lighter green bar representing cumulative total quantity till this price level */}
            <div 
                className="absolute top-0 right-0 h-full bg-[#2EBD85]/15 transition-all duration-200"
                style={{ width: `${totalPercentage}%` }}
            />
            {/* Darker green bar representing current price level quantity */}
            <div 
                className="absolute top-0 right-0 h-full bg-[#2EBD85]/40 transition-all duration-200"
                style={{ width: `${sizePercentage}%` }}
            />
            <div 
                className="relative z-10 flex h-full w-[30%] items-center text-xs font-normal tabular-nums"
                style={{ color: "oklab(0.716624 -0.156358 0.06509 / 0.9)" }}
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

export default BidTable;
