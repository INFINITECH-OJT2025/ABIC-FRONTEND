"use client";

import React from "react";
import { X } from "lucide-react";
import UnifiedTransactionForm from "@/components/accountant/transaction/UnifiedTransactionForm";

type TransactionMode = "DEPOSIT" | "WITHDRAWAL";

interface TransactionSidePanelProps {
  open: boolean;
  closing: boolean;
  onClose: () => void;
  prefillFromOwnerId?: number | null;
  prefillToOwnerId?: number | null;
  initialMode?: TransactionMode;
  onTransactionSuccess?: () => void;
}

export function TransactionSidePanel({
  open,
  closing,
  onClose,
  prefillFromOwnerId,
  prefillToOwnerId,
  initialMode = "DEPOSIT",
  onTransactionSuccess,
}: TransactionSidePanelProps) {
  if (!open && !closing) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
          closing ? "opacity-0" : "opacity-100"
        }`}
        onClick={onClose}
      />

      {/* Panel - wide to accommodate transaction form */}
      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-[min(1400px,95vw)] h-screen bg-gray-50 z-50 flex flex-col overflow-hidden shadow-xl"
        style={{
          animation: closing
            ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
            : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white border-b border-[#6A0D25]/30">
          <h2 className="text-lg font-semibold tracking-wide">New Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form - form handles its own scroll */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <UnifiedTransactionForm
            initialMode={initialMode}
            prefillFromOwnerId={prefillFromOwnerId}
            prefillToOwnerId={prefillToOwnerId}
            onTransactionSuccess={onTransactionSuccess}
          />
        </div>
      </div>
    </>
  );
}
