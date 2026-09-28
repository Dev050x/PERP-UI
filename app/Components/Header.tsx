"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useBalanceContext } from "../context/BalanceContext";
import { getToken, getUserId, removeAuthData } from "../utils/auth";
import WithdrawModal from "./Modals/WithdrawModal";

const UserIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-[#848E9C] transition-transform ${open ? "rotate-180" : ""}`}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const formatUsd = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Header = () => {
    const { balance, availableNum, lockedNum, totalNum, openDepositModal } = useBalanceContext();
    const [loggedIn, setLoggedIn] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const userId = loggedIn ? getUserId() : null;
    const shortUserId = userId ? `${userId.slice(0, 4)}…${userId.slice(-4)}` : null;

    useEffect(() => {
        const token = getToken();
        setLoggedIn(!!token);
    }, []);

    // Close profile dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        removeAuthData();
        setLoggedIn(false);
        setIsProfileOpen(false);
        window.location.reload();
    };

    return (
        <div className="relative">
            <div className="relative flex h-14 w-full flex-col justify-center ">
                <div className="flex items-center justify-between">
                    {/* Navigation */}
                    <div className="flex items-center flex-row">
                        <Link href="/" className="flex items-center justify-center h-8 text-sm font-semibold ml-4 hover:opacity-90 shrink-0 text-white">
                            PERP
                        </Link>
                        <Link href="/" className="flex items-center justify-center h-8 text-sm font-semibold ml-4 sm:ml-6 hover:opacity-90 shrink-0 text-[#848E9C] hover:text-white transition-colors">
                            Markets
                        </Link>
                        <Link href="/trade/SOL" className="flex items-center justify-center h-8 text-sm font-semibold ml-4 hover:opacity-90 shrink-0 text-[#848E9C] hover:text-white transition-colors">
                            Trade
                        </Link>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 sm:gap-4 mx-4">
                        {loggedIn ? (
                            <>
                                {/* Deposit Button */}
                                <button
                                    type="button"
                                    onClick={openDepositModal}
                                    className="hidden sm:block rounded-lg bg-[#202127] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                                >
                                    Deposit
                                </button>

                                {/* Withdraw Button */}
                                <button
                                    type="button"
                                    onClick={() => setIsWithdrawOpen(true)}
                                    className="hidden sm:block rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-[#14151b] hover:opacity-90 transition-opacity"
                                >
                                    Withdraw
                                </button>

                                {/* Account menu */}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        aria-expanded={isProfileOpen}
                                        className="flex h-8 items-center gap-2 rounded-lg bg-[#202127] pl-2 pr-2.5 text-sm text-white hover:bg-[#2B2F36] transition-colors"
                                    >
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2B2F36] text-[#B7BDC6]">
                                            <UserIcon />
                                        </span>
                                        <span className="hidden sm:inline font-medium tabular-nums">${formatUsd(totalNum)}</span>
                                        <ChevronIcon open={isProfileOpen} />
                                    </button>

                                    {isProfileOpen && (
                                        <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-[#2B2F36] bg-[#181a20] shadow-xl z-50">
                                            <div className="px-4 pt-3 pb-4">
                                                <div className="text-xs text-[#B7BDC6]">
                                                    Account{shortUserId && <span className="text-[#B7BDC6]"> · {shortUserId}</span>}
                                                </div>
                                                <div className="mt-3 text-xs text-[#B7BDC6]">Total balance</div>
                                                <div className="mt-0.5 text-xl font-semibold text-white tabular-nums">
                                                    ${formatUsd(totalNum)} <span className="text-xs font-normal text-[#848E9C]">USDC</span>
                                                </div>
                                                <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                                    <div>
                                                        <dt className="text-[#B7BDC6]">Available</dt>
                                                        <dd className="mt-0.5 font-medium text-[#00C076] tabular-nums">${formatUsd(availableNum)}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-[#B7BDC6]">In orders</dt>
                                                        <dd className="mt-0.5 text-white tabular-nums">${formatUsd(lockedNum)}</dd>
                                                    </div>
                                                </dl>

                                                {/* The header buttons are hidden on phones, so offer them here */}
                                                <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsProfileOpen(false);
                                                            openDepositModal();
                                                        }}
                                                        className="h-8 rounded-md bg-[#00C076] text-xs font-semibold text-[#0B0E11] hover:bg-[#00A865] transition-colors"
                                                    >
                                                        Deposit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsProfileOpen(false);
                                                            setIsWithdrawOpen(true);
                                                        }}
                                                        className="h-8 rounded-md bg-[#F6465D]/15 text-xs font-semibold text-[#F6465D] hover:bg-[#F6465D]/25 transition-colors"
                                                    >
                                                        Withdraw
                                                    </button>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="w-full border-t border-[#2B2F36] px-4 py-2.5 text-left text-sm text-[#F6465D] hover:bg-[#F6465D]/10 transition-colors rounded-b-lg"
                                            >
                                                Log out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/signin"
                                    className="hidden sm:block rounded-lg bg-[#202127] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2B2F36] transition-colors"
                                >
                                    Deposit
                                </Link>
                                <Link
                                    href="/signin"
                                    className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-[#14151b] hover:bg-[#EAECEF] transition-colors"
                                >
                                    Sign In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <WithdrawModal
                isOpen={isWithdrawOpen}
                onClose={() => setIsWithdrawOpen(false)}
                availableBalance={balance.availableBalance}
            />
        </div>
    );
};

export default Header;
