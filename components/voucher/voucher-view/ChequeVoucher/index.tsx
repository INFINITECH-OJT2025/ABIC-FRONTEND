"use client";

import { useState } from "react";
import PreviewSection from "./PreviewSection";
import FormSection from "./FormSection";
import { PrintableData } from "./types";

export default function PrintableView() {
  const [formData, setFormData] = useState<PrintableData>({
    voucherNo: "",
    date: "",
    paidTo: "",
    projectDetails: "", // ✅ ADD THIS
    purpose: "",
    note: "",
    amount: "",
    owner: "",
    receivedBy: "",
    approvedBy: "",
    receivedFromSignature: "",
    approvedBySignature: "",
    checkDate: "",
    checkNo: "",
    accountName: "",
    accountNumber: "",
    
  });

  const handleInputChange = (field: keyof PrintableData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-[1600px] mx-auto px-6 space-y-10">
        <h1 className="text-3xl font-bold text-gray-900">
          Cash Voucher Printable Generator
        </h1>

        {/* FORM SECTION (Row 1) */}
        <FormSection formData={formData} onInputChange={handleInputChange} />

        {/* PREVIEW SECTION (Row 2) */}
        <PreviewSection formData={formData} />
      </div>
    </div>
  );
}