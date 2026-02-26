
import { PrintableData } from "./types";
import DownloadButton from "@/components/voucher/shared/DownloadButton";
import { useCallback, useMemo, useState } from "react";

interface FormSectionProps {
  formData: PrintableData;
  onInputChange: (field: keyof PrintableData, value: string) => void;
}

export default function FormSection({
  formData,
  onInputChange,
}: FormSectionProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const requiredFields = useMemo(
    () =>
      [
        { key: "paidTo", id: "paidTo", label: "Paid To" },
        { key: "voucherNo", id: "voucherNo", label: "Voucher No" },
        { key: "date", id: "date", label: "Date" },
        { key: "amount", id: "amount", label: "Amount" },
        { key: "purpose", id: "purpose", label: "Purpose" },
        { key: "note", id: "note", label: "Note" },
        { key: "projectDetails", id: "projectDetails", label: "Project Details" },
        { key: "owner", id: "owner", label: "Owner / Client" },
        { key: "checkDate", id: "checkDate", label: "Check Date" },
        { key: "checkNo", id: "checkNo", label: "Check No" },
        { key: "accountName", id: "accountName", label: "Account Name" },
        { key: "accountNumber", id: "accountNumber", label: "Account Number" },
        { key: "receivedFromDate", id: "receivedFromDate", label: "Received Date" },
        { key: "approvedByDate", id: "approvedByDate", label: "Approved Date" },
      ] as const,
    [],
  );

  const validateRequired = useCallback(() => {
    for (const field of requiredFields) {
      const value = formData[field.key as keyof PrintableData];
      if (typeof value !== "string" || value.trim() === "") {
        setFormError(`${field.label} is required.`);

        const el = document.getElementById(field.id);
        if (el && "focus" in el) {
          (el as HTMLElement).focus();
        }
        return false;
      }
    }

    setFormError(null);
    return true;
  }, [formData, requiredFields]);

  const handleSaveVoucher = useCallback(() => {
    validateRequired();
  }, [validateRequired]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-6">
        Cheque Voucher Details
      </h2>

      <form className="space-y-6">
        {formError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {formError}
          </div>
        )}
        {/* ================= BASIC DETAILS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Paid To</label>
            <input
              type="text"
              value={formData.paidTo ?? ""}
              onChange={(e) => onInputChange("paidTo", e.target.value)}
              id="paidTo"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Voucher No</label>
            <input
              type="text"
              value={formData.voucherNo ?? ""}
              onChange={(e) => onInputChange("voucherNo", e.target.value)}
              id="voucherNo"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Date</label>
            <input
              type="date"
              value={formData.date ?? ""}
              onChange={(e) => onInputChange("date", e.target.value)}
              id="date"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Amount (₱)</label>
            <input
              type="number"
              value={formData.amount ?? ""}
              onChange={(e) => onInputChange("amount", e.target.value)}
              id="amount"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>
        </div>

        {/* ================= DESCRIPTION ================= */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2 text-gray-900">Purpose</label>
            <textarea
              value={formData.purpose ?? ""}
              onChange={(e) => onInputChange("purpose", e.target.value.slice(0, 100))}
              id="purpose"
              maxLength={100}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
              rows={3}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2 text-gray-900">Note</label>
            <textarea
              value={formData.note ?? ""}
              onChange={(e) => onInputChange("note", e.target.value.slice(0, 100))}
              id="note"
              maxLength={100}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
              rows={3}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Project Details
            </label>
            <input
              type="text"
              value={formData.projectDetails ?? ""}
              onChange={(e) => onInputChange("projectDetails", e.target.value)}
              id="projectDetails"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Owner / Client
            </label>
            <input
              type="text"
              value={formData.owner ?? ""}
              onChange={(e) => onInputChange("owner", e.target.value)}
              id="owner"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>
        </div>

        {/* ================= CHEQUE DETAILS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Check Date</label>
            <input
              type="date"
              value={formData.checkDate ?? ""}
              onChange={(e) => onInputChange("checkDate", e.target.value)}
              id="checkDate"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Check No</label>
            <input
              type="text"
              value={formData.checkNo ?? ""}
              onChange={(e) => onInputChange("checkNo", e.target.value)}
              id="checkNo"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Account Name</label>
            <input
              type="text"
              value={formData.accountName ?? ""}
              onChange={(e) => onInputChange("accountName", e.target.value)}
              id="accountName"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Account Number</label>
            <input
              type="text"
              value={formData.accountNumber ?? ""}
              onChange={(e) => onInputChange("accountNumber", e.target.value)}
              id="accountNumber"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>
        </div>

        {/* ================= SIGNATURES ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Received By
            </label>
            <label className="block text-sm font-medium mb-2 text-gray-900">Printed Name</label>
            <input
              type="text"
              value="MARIA KRISSA CHARES R. BONGON"
              readOnly
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Approved By
            </label>
            <label className="block text-sm font-medium mb-2 text-gray-900">Printed Name</label>
            <input
              type="text"
              value="ANGELLE S. SARMIENTO"
              readOnly
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <div className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center justify-center">
              <img
                src="/images/voucher/signature/ReceivedSignature.png"
                alt="Received Signature"
                className="h-12 w-auto object-contain"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">Date</label>
              <input
                type="date"
                value={formData.receivedFromDate ?? ""}
                onChange={(e) => onInputChange("receivedFromDate", e.target.value)}
                id="receivedFromDate"
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveVoucher}
              className="w-full px-8 py-2.5 text-sm font-semibold text-white bg-[#7a0f1f] rounded-md hover:bg-[#8b1535] transition-all shadow-md hover:shadow-lg"
            >
              Save Voucher
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center justify-center">
              <img
                src="/images/voucher/signature/ApprovedSignature.png"
                alt="Approved Signature"
                className="h-12 w-auto object-contain"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">Date</label>
              <input
                type="date"
                value={formData.approvedByDate ?? ""}
                onChange={(e) => onInputChange("approvedByDate", e.target.value)}
                id="approvedByDate"
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 transition-all"
              />
            </div>
            <DownloadButton formData={formData} onValidate={validateRequired} />
          </div>
        </div>
      </form>
    </div>
  );
}
