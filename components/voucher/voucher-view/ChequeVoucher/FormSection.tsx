
import { PrintableData } from "./types";
import DownloadButton from "@/components/voucher/shared/DownloadButton";

interface FormSectionProps {
  formData: PrintableData;
  onInputChange: (field: keyof PrintableData, value: string) => void;
}

export default function FormSection({
  formData,
  onInputChange,
}: FormSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Cheque Voucher Details
      </h2>

      <form className="space-y-6 text-black">
        {/* ================= BASIC DETAILS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Paid To</label>
            <input
              type="text"
              value={formData.paidTo ?? ""}
              onChange={(e) => onInputChange("paidTo", e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Voucher No</label>
            <input
              type="text"
              value={formData.voucherNo ?? ""}
              onChange={(e) => onInputChange("voucherNo", e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              value={formData.date ?? ""}
              onChange={(e) => onInputChange("date", e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Amount (₱)</label>
            <input
              type="number"
              value={formData.amount ?? ""}
              onChange={(e) => onInputChange("amount", e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
        </div>

        {/* ================= DESCRIPTION ================= */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Purpose</label>
            <textarea
              value={formData.purpose ?? ""}
              onChange={(e) => onInputChange("purpose", e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
              rows={3}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Note</label>
            <textarea
              value={formData.note ?? ""}
              onChange={(e) => onInputChange("note", e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
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
              className="w-full px-4 py-2 border rounded-md"
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
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
        </div>

        {/* ================= CHEQUE DETAILS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Check Date</label>
            <input
              type="date"
              value={formData.checkDate ?? ""}
              onChange={(e) => onInputChange("checkDate", e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Check No</label>
            <input
              type="text"
              value={formData.checkNo ?? ""}
              onChange={(e) => onInputChange("checkNo", e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Account Name</label>
            <input
              type="text"
              value={formData.accountName ?? ""}
              onChange={(e) => onInputChange("accountName", e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Account Number</label>
            <input
              type="text"
              value={formData.accountNumber ?? ""}
              onChange={(e) => onInputChange("accountNumber", e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
        </div>

        {/* ================= SIGNATURES ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Received By
            </label>
            <label className="block text-sm font-medium mb-2">Printed Name</label>
            <input
              type="text"
              value="MARIA KRISSA CHARES R. BONGON"
              readOnly
              className="w-full px-4 py-2 border rounded-md bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Approved By
            </label>
            <label className="block text-sm font-medium mb-2">Printed Name</label>
            <input
              type="text"
              value="ANGELLE S. SARMIENTO"
              readOnly
              className="w-full px-4 py-2 border rounded-md bg-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <div className="w-full px-4 py-2 border rounded-md bg-gray-100 flex items-center justify-center">
              <img
                src="/images/voucher/signature/ReceivedSignature.png"
                alt="Received Signature"
                className="h-12 w-auto object-contain"
              />
            </div>
            <button
              type="button"
              className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
            >
              Save Voucher
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="w-full px-4 py-2 border rounded-md bg-gray-100 flex items-center justify-center">
              <img
                src="/images/voucher/signature/ApprovedSignature.png"
                alt="Approved Signature"
                className="h-12 w-auto object-contain"
              />
            </div>
            <DownloadButton formData={formData} />
          </div>
        </div>
      </form>
    </div>
  );
}
