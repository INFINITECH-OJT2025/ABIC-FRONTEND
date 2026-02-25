"use client";

import React, { useState, useEffect } from "react";
import { X, FileText, Calendar, Image as ImageIcon } from "lucide-react";

interface ImagePreviewPanelProps {
  open: boolean;
  closing: boolean;
  onClose: () => void;
  imageUrl: string | null;
  imageName: string;
  isVoucher: boolean;
  loading: boolean;
  error: string | null;
  fileType: string | null;
  attachmentUrl: string | null;
}

/** Skeleton for image loading state */
function ImageSkeleton() {
  return (
    <div
      className="rounded-md border border-gray-200 overflow-hidden bg-white flex items-center justify-center shadow-lg animate-pulse"
      style={{ minHeight: "400px" }}
    >
      <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-4">
        <div className="h-48 w-64 bg-gray-200 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ImagePreviewPanel({
  open,
  closing,
  onClose,
  imageUrl,
  imageName,
  isVoucher,
  loading,
  error,
  fileType,
  attachmentUrl,
}: ImagePreviewPanelProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get the image source URL - use attachmentUrl directly like saved-receipts page
  const imageSrc = attachmentUrl || imageUrl || null;

  // Reset loaded state when URL changes
  useEffect(() => {
    setImageLoaded(false);
  }, [imageSrc]);

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

      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-5xl h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
        style={{
          animation: closing
            ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
            : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
          <div>
            <div>
              <h2 className="text-lg font-bold">
                {isVoucher ? "Voucher Preview" : "Attachment Preview"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-white/20 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* File Information Section */}
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">File Name</div>
                  <div className="text-sm text-gray-900 font-medium">{imageName || "—"}</div>
                </div>
              </div>
              {fileType && (
                <div className="flex items-start gap-3">
                  <ImageIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">File Type</div>
                    <div className="text-sm text-gray-900">{fileType}</div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Type</div>
                  <div className="text-sm text-gray-900">
                    {isVoucher ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#7a0f1f]/10 text-[#7a0f1f] font-medium">
                        Voucher
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-medium">
                        Attachment
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Preview Section */}
          <div className="p-6">
            {error ? (
              <div className="rounded-md border border-gray-200 overflow-hidden bg-white flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                  <X className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-sm font-medium text-red-600 mb-1">Error Loading Image</p>
                <p className="text-xs text-gray-500">{error}</p>
              </div>
            ) : imageSrc ? (
              <div className="space-y-4">
                {/* Image Container - Skeleton while loading, fade-in when loaded */}
                <div
                  className="rounded-md border border-gray-200 overflow-hidden bg-white flex items-center justify-center shadow-lg relative"
                  style={{ minHeight: "400px" }}
                >
                  {(loading || !imageLoaded) && (
                    <div className="absolute inset-0 z-10">
                      <ImageSkeleton />
                    </div>
                  )}
                  <div
                    className={`w-full h-full flex items-center justify-center p-4 overflow-auto transition-opacity duration-500 ${
                      imageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <img
                      src={imageSrc}
                      alt={isVoucher ? "Voucher Preview" : "Attachment Preview"}
                      className="w-full h-auto rounded-md shadow-sm max-w-full max-h-[70vh] object-contain"
                      onLoad={() => setImageLoaded(true)}
                      onError={(e) => {
                        setImageLoaded(true); // Stop skeleton
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector(".error-fallback-panel")) {
                          const fallback = document.createElement("div");
                          fallback.className =
                            "error-fallback-panel flex items-center justify-center h-64 bg-gray-100 rounded-md";
                          fallback.innerHTML =
                            '<svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-gray-200 overflow-hidden bg-white flex items-center justify-center min-h-[400px]">
                <FileText className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>
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
