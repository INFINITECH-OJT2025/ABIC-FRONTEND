"use client";

import React from "react";
import { Printer, X } from "lucide-react";
import { getTransactionTypeLabel, formatAmount, formatDate } from "@/components/accountant/transaction/helpers";

interface TransactionSuccessModalProps {
  isOpen: boolean;
  isClosing?: boolean;
  onClose: () => void;
  title: string;
  message: string;
  voucherTypeLabel?: string; // e.g., "Deposit Type" or "Withdrawal Type"
  transactionData: {
    voucherMode: "WITH_VOUCHER" | "NO_VOUCHER";
    voucher_date?: string;
    voucher_no?: string;
    transaction_type: string;
    instrument_no?: string;
    instrumentNumbers?: string[];
    fromOwnerName: string;
    toOwnerName: string;
    unit_name?: string;
    particulars?: string;
    fund_reference?: string;
    person_in_charge?: string;
    attachmentsCount: number;
    amount: string;
  };
  onPrint: () => void;
}

export default function TransactionSuccessModal({
  isOpen,
  isClosing = false,
  onClose,
  title,
  message,
  voucherTypeLabel = "Transaction Type",
  transactionData,
  onPrint,
}: TransactionSuccessModalProps) {
  if (!isOpen && !isClosing) return null;

  const BORDER = "rgba(0,0,0,0.12)";

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-lg h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
        style={{
          animation: isClosing
            ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
            : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="space-y-4">
              {/* Deposit/Withdrawal Type */}
              <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {voucherTypeLabel}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {transactionData.voucherMode === "WITH_VOUCHER" ? "With Voucher" : "No Voucher"}
                  </span>
                </div>
              </div>

              {/* Voucher Information */}
              {transactionData.voucherMode === "WITH_VOUCHER" && (transactionData.voucher_date || transactionData.voucher_no) && (
                <div className="space-y-2 pb-3 border-b" style={{ borderColor: BORDER }}>
                  {transactionData.voucher_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Voucher Date</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(transactionData.voucher_date)}
                      </span>
                    </div>
                  )}
                  {transactionData.voucher_no && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Voucher No.</span>
                      <span className="text-sm font-medium text-gray-900 font-mono">
                        {transactionData.voucher_no}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction Type */}
              <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Transaction Type</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {getTransactionTypeLabel(transactionData.transaction_type)}
                  </span>
                </div>
                {transactionData.instrumentNumbers && transactionData.instrumentNumbers.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-600 mb-1">
                      {transactionData.transaction_type === "CHEQUE" 
                        ? "Cheque Numbers"
                        : transactionData.transaction_type === "DEPOSIT SLIP"
                        ? "Deposit Slip Numbers"
                        : "Instrument Numbers"}
                    </div>
                    <div className="space-y-1">
                      {transactionData.instrumentNumbers.map((num, index) => (
                        <div key={index} className="text-sm font-medium text-gray-900 text-right">
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Owners */}
              <div className="space-y-2 pb-3 border-b" style={{ borderColor: BORDER }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Main</span>
                  <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate">
                    {transactionData.fromOwnerName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Owner</span>
                  <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate">
                    {transactionData.toOwnerName}
                  </span>
                </div>
              </div>

              {/* Unit */}
              {transactionData.unit_name && (
                <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unit</span>
                    <span className="text-sm font-medium text-gray-900">{transactionData.unit_name}</span>
                  </div>
                </div>
              )}

              {/* Particulars */}
              {transactionData.particulars && (
                <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Particulars</span>
                    <p className="text-sm text-gray-900 leading-relaxed break-words text-right">
                      {transactionData.particulars}
                    </p>
                  </div>
                </div>
              )}

              {/* Fund Reference */}
              {transactionData.fund_reference && (
                <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fund Reference</span>
                    <span className="text-sm font-medium text-gray-900">{transactionData.fund_reference}</span>
                  </div>
                </div>
              )}

              {/* Person in Charge */}
              {transactionData.person_in_charge && (
                <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Person in Charge</span>
                    <span className="text-sm font-medium text-gray-900">{transactionData.person_in_charge}</span>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {transactionData.attachmentsCount > 0 && (
                <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Attachments</span>
                    <span className="text-sm font-medium text-gray-900">
                      {transactionData.attachmentsCount} file{transactionData.attachmentsCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Total Amount */}
              <div className="pt-2">
                <div className="flex items-center justify-between py-3 px-4 rounded-md bg-gray-50 border" style={{ borderColor: BORDER }}>
                  <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">Total Amount</span>
                  <span className="text-2xl font-bold text-[#4A081A]">
                    {formatAmount(transactionData.amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions - Sticky Bottom */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPrint();
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-md font-semibold border-2 border-gray-200 hover:bg-slate-50 transition-colors cursor-pointer"
            type="button"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-md font-semibold bg-[#7a0f1f] text-white hover:opacity-95 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(100%);
          }
        }
      `}</style>
    </>
  );
}
