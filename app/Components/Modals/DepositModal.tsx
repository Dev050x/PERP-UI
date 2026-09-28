"use client";
import React, { useState } from "react";
import { depositApi, getApiErrorMessage } from "@/app/utils/httpClient";
import { useBalanceContext } from "@/app/context/BalanceContext";
import { AmountField, Chip, ModalShell, StatusText, formatUsd } from "./ModalParts";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESETS = ["100", "500", "1000", "5000"];

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { availableNum } = useBalanceContext();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  // Reset on close so a reopened modal starts fresh
  const handleClose = () => {
    setAmount("");
    setErrorMsg("");
    setSuccessMsg("");
    onClose();
  };

  const amountNum = parseFloat(amount);
  const isValid = amountNum > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!isValid) {
      setErrorMsg("Enter an amount greater than 0.");
      return;
    }

    setLoading(true);
    try {
      const res = await depositApi(amount.replace(/\.$/, ""));
      const isSuccess =
        res?.success === true ||
        !!res?.data ||
        (typeof res?.msg === "string" && /success|completed|onramp|processed/i.test(res.msg));

      if (isSuccess) {
        setSuccessMsg(`Deposited $${formatUsd(amountNum)} USDC.`);
        window.dispatchEvent(new Event("balanceUpdated"));
        onSuccess?.();
        setTimeout(handleClose, 1000);
      } else {
        setErrorMsg(getApiErrorMessage(res, "Deposit failed."));
      }
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, "Deposit failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Deposit USDC" onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <AmountField
          label="Amount"
          hint={<>Available <span className="font-medium text-white">${formatUsd(availableNum)}</span></>}
          value={amount}
          onChange={(v) => {
            setAmount(v);
            setErrorMsg("");
          }}
          invalid={!!errorMsg}
          autoFocus
        />

        <div className="mt-3 grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <Chip key={p} active={amount === p} onClick={() => setAmount(p)}>
              {Number(p).toLocaleString("en-US")}
            </Chip>
          ))}
        </div>

        <StatusText error={errorMsg} success={successMsg} />

        <button
          type="submit"
          disabled={loading || !!successMsg}
          className="mt-5 h-11 w-full rounded-md bg-[#00C076] text-sm font-semibold text-[#0B0E11] hover:bg-[#00A865] disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
        >
          {loading ? "Depositing…" : isValid ? `Deposit $${formatUsd(amountNum)}` : "Deposit"}
        </button>
      </form>
    </ModalShell>
  );
};

export default DepositModal;
