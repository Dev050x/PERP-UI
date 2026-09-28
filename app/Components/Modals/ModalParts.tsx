"use client";
import React, { useEffect } from "react";

// Digits with an optional decimal part of at most 8 places (API limit)
export const AMOUNT_INPUT = /^\d*\.?\d{0,8}$/;

export const formatUsd = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const ModalShell = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg border border-[#2B2F36] bg-[#181a20] shadow-xl"
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 flex h-7 w-7 items-center justify-center rounded-md text-[#848E9C] hover:bg-[#2B2F36] hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 pt-4 pb-5">{children}</div>
      </div>
    </div>
  );
};

export const AmountField = ({
  label,
  hint,
  value,
  onChange,
  action,
  invalid,
  autoFocus,
}: {
  label: string;
  hint?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  action?: React.ReactNode;
  invalid?: boolean;
  autoFocus?: boolean;
}) => (
  <div>
    <div className="mb-1.5 flex items-center justify-between text-xs">
      <label htmlFor="amount" className="text-[#848E9C]">{label}</label>
      {hint && <span className="text-[#848E9C] tabular-nums">{hint}</span>}
    </div>
    <div
      className={`flex h-12 items-center gap-2 rounded-md border bg-[#0B0E11] px-3 transition-colors focus-within:border-[#5E6673] ${
        invalid ? "border-[#F6465D]" : "border-[#2B2F36]"
      }`}
    >
      <input
        id="amount"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder="0.00"
        value={value}
        onChange={(e) => AMOUNT_INPUT.test(e.target.value) && onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-lg font-medium text-white tabular-nums placeholder:text-[#5E6673] focus:outline-none"
      />
      {action}
      <span className="text-sm text-[#848E9C]">USDC</span>
    </div>
  </div>
);

export const Chip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`h-8 rounded-md border text-xs font-medium tabular-nums transition-colors ${
      active
        ? "border-[#5E6673] bg-[#2B2F36] text-white"
        : "border-[#2B2F36] text-[#B7BDC6] hover:border-[#5E6673] hover:text-white"
    }`}
  >
    {children}
  </button>
);

export const StatusText = ({ error, success }: { error?: string; success?: string }) =>
  error ? (
    <p className="mt-3 text-xs text-[#F6465D]">{error}</p>
  ) : success ? (
    <p className="mt-3 text-xs text-[#00C076]">{success}</p>
  ) : null;
