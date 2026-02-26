"use client";

import React from "react";
import { TransactionFormData, FieldErrors, TransactionType } from "./types";
import { formatCurrency } from "./helpers";

interface TransactionFormFieldsProps {
  formData: TransactionFormData;
  fieldErrors: FieldErrors;
  voucherMode: "WITH_VOUCHER" | "NO_VOUCHER";
  onFormDataChange: (data: Partial<TransactionFormData>) => void;
  onFieldErrorChange: (errors: Partial<FieldErrors>) => void;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  excludeVoucherFields?: boolean; // Option to exclude voucher fields when handled separately
  balanceWarning?: string; // Warning message to show below amount field
}

export default function TransactionFormFields({
  formData,
  fieldErrors,
  voucherMode,
  onFormDataChange,
  onFieldErrorChange,
  onAmountChange,
  excludeVoucherFields = false,
  balanceWarning,
}: TransactionFormFieldsProps) {
  return (
    <>
      {/* Voucher Section - Conditionally Rendered */}
      {!excludeVoucherFields && voucherMode === "WITH_VOUCHER" && (
        <div className="space-y-6 border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-900">
            Voucher Information
          </h3>

          <div className="space-y-6">
            {/* Voucher Date */}
            <div data-field-error={fieldErrors.voucher_date ? true : undefined}>
              <label className="block text-sm font-medium mb-2">
                Voucher Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.voucher_date}
                onChange={(e) => {
                  onFormDataChange({ voucher_date: e.target.value });
                  if (fieldErrors.voucher_date) {
                    onFieldErrorChange({ voucher_date: undefined });
                  }
                }}
                className={`w-full rounded-md border px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 disabled:opacity-60 transition-all ${
                  fieldErrors.voucher_date
                    ? "border-red-500 bg-red-50 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-200 bg-white focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f]"
                }`}
              />
              {fieldErrors.voucher_date && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.voucher_date}</p>
              )}
            </div>

            {/* Voucher No */}
            <div data-field-error={fieldErrors.voucher_no ? true : undefined}>
              <label className="block text-sm font-medium mb-2">
                Voucher No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.voucher_no}
                readOnly={true}
                className={`w-full rounded-md border px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 disabled:opacity-60 transition-all ${
                  fieldErrors.voucher_no
                    ? "border-red-500 bg-red-50 focus:ring-red-500/20 focus:border-red-500"
                    : "border-gray-200 bg-gray-50 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f]"
                }`}
                placeholder="Upload image to set voucher number"
              />
              {fieldErrors.voucher_no && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.voucher_no}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Amount Field - Main Focal Point */}
      <div className="md:col-span-2" data-field-error={fieldErrors.amount ? true : undefined}>
        <label className="block text-sm font-medium mb-2 text-gray-900">
          Transaction Amount <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold ${
            fieldErrors.amount ? "text-red-600" : "text-[#7a0f1f]"
          }`}>
            ₱
          </div>
          <input
            type="text"
            placeholder="0.00"
            value={formData.amount}
            onChange={onAmountChange}
            className={`w-full rounded-md border-2 pl-10 pr-4 py-3 text-xl font-bold text-gray-900 outline-none focus:ring-2 disabled:opacity-60 transition-all ${
              fieldErrors.amount
                ? "border-red-500 bg-red-50 focus:ring-red-500/20 focus:border-red-600"
                : "border-[#7a0f1f] bg-white focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] hover:border-[#7a0f1f]/80 cursor-text shadow-sm hover:shadow-md"
            }`}
          />
        </div>
        {fieldErrors.amount && (
          <p className="mt-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {fieldErrors.amount}
          </p>
        )}
        {!fieldErrors.amount && balanceWarning && (
          <p className="mt-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            {balanceWarning}
          </p>
        )}
      </div>

      {/* Particulars */}
      <div className="md:col-span-2 space-y-6 border-t border-gray-200 pt-6">
        <div data-field-error={fieldErrors.particulars ? true : undefined}>
          <label className="block text-sm font-medium mb-2 text-gray-900">
            Particulars <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="Enter transaction particulars..."
            value={formData.particulars}
            maxLength={500}
            onChange={(e) => {
              onFormDataChange({ particulars: e.target.value });
              if (fieldErrors.particulars) {
                onFieldErrorChange({ particulars: undefined });
              }
            }}
            className={`w-full rounded-md border px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 disabled:opacity-60 transition-all ${
              fieldErrors.particulars
                ? "border-red-500 bg-red-50 focus:ring-red-500/20 focus:border-red-500"
                : "border-gray-200 bg-white focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f]"
            }`}
          />
          <div className="flex items-center justify-between mt-1">
            {fieldErrors.particulars && (
              <p className="text-sm text-red-600">{fieldErrors.particulars}</p>
            )}
            <p className={`text-xs ml-auto ${formData.particulars.length >= 450 ? 'text-orange-600' : 'text-gray-500'}`}>
              {formData.particulars.length}/500
            </p>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="space-y-6 border-t border-gray-200 pt-6">
          <h4 className="text-sm font-semibold text-gray-900">
            Additional Information
          </h4>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Fund Reference */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Fund Reference
              </label>
              <input
                type="text"
                value={formData.fund_reference}
                maxLength={100}
                onChange={(e) => onFormDataChange({ fund_reference: e.target.value })}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
                placeholder="Enter fund reference"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {formData.fund_reference.length}/100
              </p>
            </div>

            {/* Person in Charge */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Person in Charge
              </label>
              <input
                type="text"
                value={formData.person_in_charge}
                maxLength={100}
                onChange={(e) => onFormDataChange({ person_in_charge: e.target.value })}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
                placeholder="Enter person in charge"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {formData.person_in_charge.length}/100
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
