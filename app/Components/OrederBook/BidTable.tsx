const BidTable = ({ bids }: { bids: [string, string][] }) => {
    let currentTotal = 0;
    let relavantBids = bids.slice(0, 15);
    let bidWithTotal: [string, string, number][] = [];
    relavantBids.map(([price, size]) => {
        bidWithTotal.push([price, size, currentTotal += parseFloat(size)]);
    })
    const maxTotal = currentTotal;
    return (
        <>
            {bidWithTotal.map(([price, size, total], index) => {
                const percentage = (total / maxTotal) * 100;
                return <Bid key={index} price={price} size={parseFloat(size)} total={parseFloat(total.toFixed(2))} percentage={percentage} />;
            })}
        </>
    );
}

const Bid = ({ price, size, total, percentage }: { price: string; size: number; total: number, percentage: number }) => {

    return (
        
        <div className="relative flex flex-row justify-between items-center h-[23px] mx-3 overflow-hidden">
            <div 
                className="absolute top-0 left-0 h-full bg-[#113534] opacity-50"
                style={{ width: `${percentage}%` }}
            />
            <div className="relative z-10 flex h-full w-[30%] items-center text-xs font-normal tabular-nums text-[#00c278e6]/90">
                {price}
            </div>
            <div className="relative z-10 flex h-full w-[35%] items-center justify-end text-xs font-normal tabular-nums text-[#EAECEF]/80">
                {size}
            </div>
            <div className="relative z-10 flex h-full w-[35%] items-center justify-end text-xs font-normal tabular-nums text-[#EAECEF]/80">
                {total}
            </div>
        </div>
    )
}

export default BidTable;
