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

      <form className="space-y-4 text-black">

        {/* ================= BASIC DETAILS ================= */}

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
          <label className="block text-sm font-medium mb-2">Paid To</label>
          <input
            type="text"
            value={formData.paidTo ?? ""}
            onChange={(e) => onInputChange("paidTo", e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          />
        </div>

        {/* ================= CHEQUE DETAILS ================= */}

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

        {/* ================= DESCRIPTION ================= */}

        <div>
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

        <div>
          <label className="block text-sm font-medium mb-2">Purpose</label>
          <textarea
            value={formData.purpose ?? ""}
            onChange={(e) => onInputChange("purpose", e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Note</label>
          <textarea
            value={formData.note ?? ""}
            onChange={(e) => onInputChange("note", e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
            rows={3}
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

        <div>
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

        {/* ================= SIGNATURE UPLOAD ================= */}

        <div>
          <label className="block text-sm font-medium mb-2">
            Received From Signature
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onloadend = () => {
                onInputChange(
                  "receivedFromSignature",
                  reader.result as string
                );
              };
              reader.readAsDataURL(file);
            }}
            className="w-full px-4 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Approved By Signature
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onloadend = () => {
                onInputChange(
                  "approvedBySignature",
                  reader.result as string
                );
              };
              reader.readAsDataURL(file);
            }}
            className="w-full px-4 py-2 border rounded-md"
          />
        </div>

        <div className="pt-4">
          <DownloadButton formData={formData} />
        </div>

      </form>
    </div>
  );
}