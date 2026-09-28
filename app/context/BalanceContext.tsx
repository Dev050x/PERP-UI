"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { getBalanceApi, extractBalance, BalanceData } from "../utils/httpClient";
import { getToken, AUTH_CHANGED_EVENT } from "../utils/auth";
import DepositModal from "../Components/Modals/DepositModal";

interface BalanceContextType {
  balance: BalanceData;
  availableNum: number;
  lockedNum: number;
  totalNum: number;
  hasDeposited: boolean;
  isLoading: boolean;
  refetchBalance: () => Promise<void>;
  openDepositModal: () => void;
  closeDepositModal: () => void;
  isDepositModalOpen: boolean;
}

const defaultBalance: BalanceData = {
  availableBalance: "0.00",
  lockedBalance: "0.00",
};

const BalanceContext = createContext<BalanceContextType>({
  balance: defaultBalance,
  availableNum: 0,
  lockedNum: 0,
  totalNum: 0,
  hasDeposited: true,
  isLoading: false,
  refetchBalance: async () => {},
  openDepositModal: () => {},
  closeDepositModal: () => {},
  isDepositModalOpen: false,
});

// Balance can change without a local action (resting orders filled by others)
const BALANCE_POLL_MS = 5000;

export const BalanceProvider = ({ children }: { children: React.ReactNode }) => {
  const [balance, setBalance] = useState<BalanceData>(defaultBalance);
  const [isLoading, setIsLoading] = useState(false);
  const [hasDeposited, setHasDeposited] = useState<boolean>(true);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const hasAutoPromptedRef = useRef(false);
  // Ignore responses from requests superseded by a newer fetch (e.g. after logout/login)
  const requestIdRef = useRef(0);

  const promptDepositOnce = () => {
    if (hasAutoPromptedRef.current) return;
    hasAutoPromptedRef.current = true;
    setIsDepositModalOpen(true);
  };

  const fetchBalance = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const token = getToken();
    if (!token) {
      setBalance(defaultBalance);
      setHasDeposited(true);
      setIsDepositModalOpen(false);
      hasAutoPromptedRef.current = false;
      return;
    }

    setIsLoading(true);
    try {
      const res = await getBalanceApi();
      if (requestId !== requestIdRef.current) return;
      const extracted = extractBalance(res);
      // Keep full precision; components format for display
      setBalance(extracted);

      const total = parseFloat(extracted.availableBalance || "0") + parseFloat(extracted.lockedBalance || "0");
      const isZero = !(total > 0);
      setHasDeposited(!isZero);
      if (isZero) promptDepositOnce();
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      console.error("Failed to fetch balance in BalanceContext:", err);
      const errMsg = err.response?.data?.error || err.response?.data?.msg || err.message || "";
      if (errMsg.includes("user does not deposit") || errMsg.includes("deposit any asset")) {
        setBalance(defaultBalance);
        setHasDeposited(false);
        promptDepositOnce();
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();

    const handleUpdate = () => fetchBalance();
    const handleAuthChange = () => {
      hasAutoPromptedRef.current = false;
      fetchBalance();
    };
    const intervalId = setInterval(() => {
      if (getToken() && document.visibilityState === "visible") fetchBalance();
    }, BALANCE_POLL_MS);

    window.addEventListener("balanceUpdated", handleUpdate);
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("balanceUpdated", handleUpdate);
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    };
  }, [fetchBalance]);

  const availNum = parseFloat(balance.availableBalance) || 0;
  const lockedNum = parseFloat(balance.lockedBalance) || 0;
  const totalNum = availNum + lockedNum;

  return (
    <BalanceContext.Provider
      value={{
        balance,
        availableNum: availNum,
        lockedNum: lockedNum,
        totalNum,
        hasDeposited,
        isLoading,
        refetchBalance: fetchBalance,
        openDepositModal: () => setIsDepositModalOpen(true),
        closeDepositModal: () => setIsDepositModalOpen(false),
        isDepositModalOpen,
      }}
    >
      {children}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />
    </BalanceContext.Provider>
  );
};

export const useBalanceContext = () => useContext(BalanceContext);
