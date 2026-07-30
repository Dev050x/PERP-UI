const Header = () => {
    return (
        <div>
            <div className="relative flex h-14 w-full flex-col justify-center">
                <div className="flex items-center justify-between">
                    <div className="flex items-center flex-row">
                        <a href="/" className="flex items-center justify-center h-8 text-sm font-semibold ml-4 hover:opacity-90 shrink-0">
                            Exchange
                        </a>
                        <a href="/" className="flex items-center justify-center h-8 text-sm font-semibold mx-4 hover:opacity-90 shrink-0">
                            Trade
                        </a>
                    </div>
                    <div className="flex justify-end gap-4 mx-4">
                        <a className="rounded-lg bg-[#202127] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90" href="/login">
                            Deposit
                        </a>
                        <a className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-[#14151b] hover:opacity-90" href="/signup">
                            Withdraw
                        </a>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Header

