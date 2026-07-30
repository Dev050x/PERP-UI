const AskTable = ({ asks }: { asks: [string, string][] }) => {
    let currentTotal = 0;
    let relavantAsks = asks.slice(0, 15);
    let askWithTotal: [string, string, number][] = [];
    relavantAsks.map(([price, size]) => {
        askWithTotal.push([price, size, currentTotal += parseFloat(size)]);
    })
    askWithTotal.reverse();
    const mxTotal = currentTotal;
    return (
        <>
            {askWithTotal.map(([price, size, total], index) => {
                const percentage = (total / mxTotal) * 100;
                return <Ask key={index} price={price} size={parseFloat(size)} total={parseFloat(total.toFixed(2))} percentage={percentage} />;
            })}
        </>
    );
}

const Ask = ({ price, size, total, percentage }: { price: string; size: number; total: number, percentage: number }) => {
    return (
        <div className="relative flex flex-row justify-between items-center h-[23px] mx-3 overflow-hidden">
            <div 
                className="absolute top-0 left-0 h-full bg-[#fb4b4e29] opacity-50"
                style={{ width: `${percentage}%` }}
            />
            <div className="relative z-10 flex h-full w-[30%] items-center text-xs font-normal tabular-nums text-[#F6465D]/90">
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

export default AskTable;