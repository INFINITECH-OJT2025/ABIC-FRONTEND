"use client";

import React from "react";
import { Upload, X, FileText, Trash2 } from "lucide-react";
import { TransactionFormData, TransactionType } from "./types";

interface TransactionTypeUploadSectionProps {
  formData: TransactionFormData;
  shouldShowUploadSection: boolean;
  uploadedFiles: File[];
  filePreviews?: string[]; // Preview URLs for uploaded files
  onTransactionTypeChange: (newType: TransactionType) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onOpenFilePreview: (index: number) => void;
  fileInputId: string;
  fileUploadError?: string;
  duplicateFileNames?: string[]; // Array of duplicate file names (without extension)
}

export default function TransactionTypeUploadSection({
  formData,
  shouldShowUploadSection,
  uploadedFiles,
  filePreviews = [],
  onTransactionTypeChange,
  onFileUpload,
  onRemoveFile,
  onOpenFilePreview,
  fileInputId,
  fileUploadError,
  duplicateFileNames = [],
}: TransactionTypeUploadSectionProps) {
  return (
    <>
      {/* Transaction Type */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-2 text-gray-900">
          Transaction Type <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.transaction_type}
          onChange={(e) => onTransactionTypeChange(e.target.value as TransactionType)}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 h-10 text-sm focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] focus:outline-none cursor-pointer appearance-none"
        >
          <option value="CHEQUE">Cheque</option>
          <option value="DEPOSIT SLIP">Deposit Slip</option>
          <option value="CASH DEPOSIT">Cash Deposit</option>
          <option value="BANK TRANSFER">Bank Transfer</option>
          <option value="CHEQUE DEPOSIT">Cheque Deposit</option>
        </select>
      </div>

      {/* Add Attachments Section - Only for Cheque/Deposit Slip */}
      {shouldShowUploadSection && (
        <div className="md:col-span-2" data-file-upload-error={fileUploadError ? true : undefined}>
          <label className="block text-sm font-medium mb-2 text-gray-900">
            {formData.transaction_type === "CHEQUE" ? "CHEQUE NUMBERS" : "DEPOSIT SLIP NUMBERS"} <span className="text-red-500">*</span>
          </label>
          
          <div className="space-y-4">
            {/* Display uploaded files in card format (like voucher upload) */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                {uploadedFiles.map((file, index) => {
                  const preview = filePreviews[index];
                  const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                  const isDuplicate = duplicateFileNames.includes(fileNameWithoutExt);
                  return (
                    <div key={index} className={`flex items-center gap-4 p-4 border rounded-md ${
                      isDuplicate ? "border-red-500 bg-red-50" : "border-gray-200"
                    }`}>
                      <div className="w-12 h-12 rounded-md border overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                        {preview ? (
                          <img src={preview} alt={fileNameWithoutExt} className="w-full h-full object-cover cursor-pointer" onClick={() => onOpenFilePreview(index)} />
                        ) : (
                          <FileText className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold truncate cursor-pointer hover:text-gray-700 ${isDuplicate ? "text-red-700" : "text-neutral-900"}`} onClick={() => onOpenFilePreview(index)}>
                          {fileNameWithoutExt}
                        </div>
                        {isDuplicate && (
                          <p className="text-xs text-red-600 mt-1">This file already exists</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFile(index);
                        }}
                        className="p-2 rounded-md hover:bg-red-50 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Upload area */}
            <div>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,application/pdf,.jpeg,.jpg,.png,.pdf"
                onChange={onFileUpload}
                className="hidden"
                id={fileInputId}
              />
              <label
                htmlFor={fileInputId}
                className={`flex flex-col items-center justify-center gap-2 w-full px-4 py-8 rounded-md cursor-pointer border-2 border-dashed transition-colors ${
                  fileUploadError
                    ? "border-red-500 bg-red-50 hover:border-red-600 hover:bg-red-100"
                    : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                } text-gray-600`}
              >
                <Upload className={`w-5 h-5 ${fileUploadError ? 'text-red-600' : ''}`} />
                <span className={`text-sm font-medium ${fileUploadError ? 'text-red-700' : ''}`}>
                  {formData.transaction_type === "CHEQUE"
                    ? "Upload Cheque Numbers"
                    : "Upload Deposit Slip Numbers"}
                </span>
                <span className={`text-xs ${fileUploadError ? 'text-red-600' : 'text-gray-500'}`}>
                  {fileUploadError || "Click to browse or drag and drop multiple files"}
                </span>
              </label>
              {fileUploadError && (
                <p className="mt-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {fileUploadError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
