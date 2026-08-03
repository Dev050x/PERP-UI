"use client";
import React, { useState } from "react";
import { depositApi } from "@/app/utils/httpClient";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState("1000");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!amount || parseFloat(amount) <= 0) {
      setErrorMsg("Please enter a valid deposit amount.");
      return;
    }

    setLoading(true);
    try {
      const res = await depositApi(amount);
      const isSuccess =
        res?.success === true ||
        !!res?.data ||
        (res?.msg && (
          res.msg.toLowerCase().includes("success") ||
          res.msg.toLowerCase().includes("completed") ||
          res.msg.toLowerCase().includes("onramp") ||
          res.msg.toLowerCase().includes("processed")
        ));

      if (isSuccess) {
        setSuccessMsg(res?.msg || `Successfully deposited $${parseFloat(amount).toFixed(2)} USDC!`);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("balanceUpdated"));
        }
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setSuccessMsg("");
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res?.error || res?.msg || "Deposit failed.");
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      setErrorMsg(errorData?.error || errorData?.msg || "Failed to process deposit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="w-full max-w-[420px] bg-[#14161C] border border-[#23262F] rounded-2xl p-6 flex flex-col gap-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2B2F36] pb-4">
          <h2 className="text-lg font-bold text-white">Deposit USDC</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#848E9C] hover:text-white hover:bg-[#2B2F36] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Banners */}
        {errorMsg && (
          <div className="p-3 bg-[#3B171E] border border-[#F6465D]/30 rounded-xl text-xs text-[#F6465D]">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-[#0F3A2C] border border-[#00C076]/30 rounded-xl text-xs text-[#00C076]">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Amount Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#848E9C]">Deposit Amount</label>
            <div className="relative flex items-center">
              <input
                type="number"
                step="any"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                className="w-full h-12 pl-4 pr-16 bg-[#1E2026] border border-[#2B2F36] rounded-xl text-base font-semibold text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#424755]"
              />
              <span className="absolute right-4 text-xs font-bold text-[#848E9C]">USDC</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-4 gap-2">
            {["100", "500", "1000", "5000"].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                  amount === preset
                    ? "bg-[#2B2F36] border-[#424755] text-white"
                    : "bg-[#1E2026] border-[#2B2F36] text-[#848E9C] hover:text-white"
                }`}
              >
                +${preset}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 bg-[#00C076] hover:bg-[#00D080] disabled:opacity-50 text-[#0B0E11] font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.99]"
          >
            {loading ? "Processing..." : "Confirm Deposit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;
