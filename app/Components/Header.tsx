"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getBalanceApi, extractBalance } from "../utils/httpClient";
import { getToken, removeAuthData } from "../utils/auth";
import DepositModal from "./Modals/DepositModal";
import WithdrawModal from "./Modals/WithdrawModal";

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const Header = () => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [balances, setBalances] = useState({ availableBalance: "0.00", lockedBalance: "0.00" });
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchBalance = async () => {
        const token = getToken();
        if (!token) {
            setLoggedIn(false);
            setBalances({ availableBalance: "0.00", lockedBalance: "0.00" });
            return;
        }
        setLoggedIn(true);
        try {
            const res = await getBalanceApi();
            const extracted = extractBalance(res);
            setBalances({
                availableBalance: parseFloat(extracted.availableBalance).toFixed(2),
                lockedBalance: parseFloat(extracted.lockedBalance).toFixed(2),
            });
        } catch (err) {
            console.error("Failed to fetch balance:", err);
        }
    };

    useEffect(() => {
        fetchBalance();
        const handleBalanceUpdate = () => {
            fetchBalance();
        };
        window.addEventListener("balanceUpdated", handleBalanceUpdate);
        return () => {
            window.removeEventListener("balanceUpdated", handleBalanceUpdate);
        };
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
        setBalances({ availableBalance: "0.00", lockedBalance: "0.00" });
        setIsProfileOpen(false);
        window.location.reload();
    };

    const availNum = parseFloat(balances.availableBalance);
    const lockedNum = parseFloat(balances.lockedBalance);
    const totalBalance = (availNum + lockedNum).toFixed(2);

    return (
        <div className="relative">
            <div className="relative flex h-14 w-full flex-col justify-center ">
                <div className="flex items-center justify-between">
                    {/* Navigation */}
                    <div className="flex items-center flex-row">
                        <Link href="/" className="flex items-center justify-center h-8 text-sm font-semibold ml-4 hover:opacity-90 shrink-0 text-white">
                            Exchange
                        </Link>
                        <Link href="/trade/SOL_USDC" className="flex items-center justify-center h-8 text-sm font-semibold mx-4 hover:opacity-90 shrink-0 text-[#848E9C] hover:text-white transition-colors">
                            Trade
                        </Link>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4 mx-4">
                        {loggedIn ? (
                            <>
                                {/* Deposit Button */}
                                <button
                                    type="button"
                                    onClick={() => setIsDepositOpen(true)}
                                    className="rounded-lg bg-[#202127] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                                >
                                    Deposit
                                </button>

                                {/* Withdraw Button */}
                                <button
                                    type="button"
                                    onClick={() => setIsWithdrawOpen(true)}
                                    className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-[#14151b] hover:opacity-90 transition-opacity"
                                >
                                    Withdraw
                                </button>

                                {/* Profile Dropdown Container */}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="rounded-lg bg-[#202127] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <div className="w-4 h-4 rounded-full bg-[#00C076]/20 text-[#00C076] flex items-center justify-center">
                                            <UserIcon />
                                        </div>
                                        <span>Profile</span>
                                        <span className="text-[10px] text-[#848E9C]">▼</span>
                                    </button>

                                    {/* Profile Dropdown Menu */}
                                    {isProfileOpen && (
                                        <div className="absolute right-0 mt-2 w-72 bg-[#14161C] border border-[#23262F] rounded-2xl p-4 shadow-2xl z-50 flex flex-col gap-4 animate-fadeIn">
                                            {/* User Header */}
                                            <div className="flex items-center gap-3 border-b border-[#2B2F36] pb-3">
                                                <div className="w-9 h-9 rounded-full bg-[#00C076]/20 text-[#00C076] flex items-center justify-center font-bold">
                                                    <UserIcon />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-white">Account Profile</span>
                                                    <span className="text-[11px] text-[#848E9C]">PERP Exchange Trader</span>
                                                </div>
                                            </div>

                                            {/* USDC Balances Section */}
                                            <div className="flex flex-col gap-2 bg-[#1E2026] p-3 rounded-xl border border-[#2B2F36]">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-[#848E9C]">Total Balance</span>
                                                    <span className="font-bold text-white tabular-nums">${totalBalance} USDC</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-[#848E9C]">Available Balance</span>
                                                    <span className="font-semibold text-[#00C076] tabular-nums">${balances.availableBalance} USDC</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-[#848E9C]">Locked Balance</span>
                                                    <span className="font-medium text-[#EAECEF] tabular-nums">${balances.lockedBalance} USDC</span>
                                                </div>
                                            </div>

                                            {/* Action Options */}
                                            <div className="flex flex-col gap-1.5 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsProfileOpen(false);
                                                        setIsDepositOpen(true);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-white hover:bg-[#2B2F36] rounded-lg transition-colors flex items-center justify-between"
                                                >
                                                    <span>Deposit USDC</span>
                                                    <span className="text-[#00C076]">+</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsProfileOpen(false);
                                                        setIsWithdrawOpen(true);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-white hover:bg-[#2B2F36] rounded-lg transition-colors flex items-center justify-between"
                                                >
                                                    <span>Withdraw USDC</span>
                                                    <span className="text-[#848E9C]">→</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-[#F6465D] hover:bg-[#3B171E] rounded-lg transition-colors flex items-center justify-between mt-1 border-t border-[#2B2F36]/60 pt-2.5"
                                                >
                                                    <span>Logout</span>
                                                    <span>➔</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/signin"
                                    className="rounded-lg bg-[#202127] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2B2F36] transition-colors"
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
            <DepositModal
                isOpen={isDepositOpen}
                onClose={() => setIsDepositOpen(false)}
                onSuccess={fetchBalance}
            />
            <WithdrawModal
                isOpen={isWithdrawOpen}
                onClose={() => setIsWithdrawOpen(false)}
                availableBalance={balances.availableBalance}
                onSuccess={fetchBalance}
            />
        </div>
    );
};

export default Header;
