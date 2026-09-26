"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getBalanceApi, extractBalance, BalanceData } from "../utils/httpClient";
import { getToken } from "../utils/auth";
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

export const BalanceProvider = ({ children }: { children: React.ReactNode }) => {
  const [balance, setBalance] = useState<BalanceData>(defaultBalance);
  const [isLoading, setIsLoading] = useState(false);
  const [hasDeposited, setHasDeposited] = useState<boolean>(true);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [hasAutoPrompted, setHasAutoPrompted] = useState(false);

  const fetchBalance = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setBalance(defaultBalance);
      setHasDeposited(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await getBalanceApi();
      const extracted = extractBalance(res);
      const avail = parseFloat(extracted.availableBalance || "0");
      const locked = parseFloat(extracted.lockedBalance || "0");
      const total = avail + locked;

      setBalance({
        availableBalance: avail.toFixed(2),
        lockedBalance: locked.toFixed(2),
      });

      const isZero = total === 0;
      setHasDeposited(!isZero);

      if (isZero && !hasAutoPrompted) {
        setHasAutoPrompted(true);
        setIsDepositModalOpen(true);
      }
    } catch (err: any) {
      console.error("Failed to fetch balance in BalanceContext:", err);
      const errMsg = err.response?.data?.error || err.response?.data?.msg || err.message || "";
      if (errMsg.includes("user does not deposit") || errMsg.includes("deposit any asset")) {
        setHasDeposited(false);
        if (!hasAutoPrompted) {
          setHasAutoPrompted(true);
          setIsDepositModalOpen(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [hasAutoPrompted]);

  useEffect(() => {
    fetchBalance();

    const handleUpdate = () => fetchBalance();
    window.addEventListener("balanceUpdated", handleUpdate);
    return () => window.removeEventListener("balanceUpdated", handleUpdate);
  }, [fetchBalance]);

  const availNum = parseFloat(balance.availableBalance);
  const lockedNum = parseFloat(balance.lockedBalance);
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
