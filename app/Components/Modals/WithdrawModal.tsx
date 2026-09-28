"use client";
import React, { useState } from "react";
import { withdrawApi, getApiErrorMessage } from "@/app/utils/httpClient";
import { AmountField, Chip, ModalShell, StatusText, formatUsd } from "./ModalParts";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance?: string;
  onSuccess?: () => void;
}

const PERCENTS = [25, 50, 75, 100];

const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  availableBalance = "0",
  onSuccess,
}) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const available = parseFloat(availableBalance) || 0;
  const amountNum = parseFloat(amount);
  const exceeds = amountNum > available;
  const isValid = amountNum > 0 && !exceeds;

  // Reset on close so a reopened modal starts fresh
  const handleClose = () => {
    setAmount("");
    setErrorMsg("");
    setSuccessMsg("");
    onClose();
  };

  const setPercent = (pct: number) => {
    setErrorMsg("");
    // 100% uses the exact balance string so no rounding can exceed it
    if (pct === 100) {
      setAmount(availableBalance);
      return;
    }
    const v = Math.floor(available * (pct / 100) * 1e8) / 1e8;
    setAmount(v > 0 ? String(v) : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!isValid) {
      setErrorMsg(exceeds ? "Amount exceeds your available balance." : "Enter an amount greater than 0.");
      return;
    }

    setLoading(true);
    try {
      const res = await withdrawApi(amount.replace(/\.$/, ""));
      const isSuccess =
        res?.success === true ||
        !!res?.data ||
        (typeof res?.msg === "string" && /success|completed|processed/i.test(res.msg));

      if (isSuccess) {
        setSuccessMsg(`Withdrew $${formatUsd(amountNum)} USDC.`);
        window.dispatchEvent(new Event("balanceUpdated"));
        onSuccess?.();
        setTimeout(handleClose, 1000);
      } else {
        setErrorMsg(getApiErrorMessage(res, "Withdrawal failed."));
      }
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, "Withdrawal failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Withdraw USDC" onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <AmountField
          label="Amount"
          hint={<>Available <span className="font-medium text-white">${formatUsd(available)}</span></>}
          value={amount}
          onChange={(v) => {
            setAmount(v);
            setErrorMsg("");
          }}
          invalid={!!errorMsg || exceeds}
          autoFocus
          action={
            <button
              type="button"
              onClick={() => setPercent(100)}
              className="text-xs font-semibold text-[#00C076] hover:text-[#00A865]"
            >
              MAX
            </button>
          }
        />

        <div className="mt-3 grid grid-cols-4 gap-2">
          {PERCENTS.map((pct) => (
            <Chip
              key={pct}
              active={available > 0 && amount !== "" && Math.abs(amountNum - available * (pct / 100)) < 1e-8}
              onClick={() => setPercent(pct)}
            >
              {pct}%
            </Chip>
          ))}
        </div>

        <StatusText
          error={errorMsg || (exceeds ? "Amount exceeds your available balance." : "")}
          success={successMsg}
        />

        <button
          type="submit"
          disabled={loading || !isValid || !!successMsg}
          className="mt-5 h-11 w-full rounded-md bg-[#F6465D] text-sm font-semibold text-white hover:bg-[#E03E54] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          {loading ? "Withdrawing…" : isValid ? `Withdraw $${formatUsd(amountNum)}` : "Withdraw"}
        </button>
      </form>
    </ModalShell>
  );
};

export default WithdrawModal;
