"use client";

import React from "react";
import { X } from "lucide-react";

export interface MaintenanceSidePanelProps {
  open: boolean;
  closing: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Optional footer (e.g. Save/Cancel buttons) */
  footer?: React.ReactNode;
  /** Max width: 'sm' | 'md' | 'lg' | 'xl' */
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

const maxWidthClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

/**
 * Slide-in side panel for maintenance pages (create/detail drawers).
 * Matches ledger design with gradient header and slide animation.
 */
export function MaintenanceSidePanel({
  open,
  closing,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "lg",
}: MaintenanceSidePanelProps) {
  if (!open && !closing) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
          closing ? "opacity-0" : "opacity-100"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 right-0 bottom-0 w-full ${maxWidthClasses[maxWidth]} h-screen bg-white z-50 flex flex-col rounded-l-2xl overflow-hidden shadow-xl`}
        style={{
          animation: closing
            ? "maintenanceSlideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
            : "maintenanceSlideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
        }}
      >
        <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-br from-[#7B0F2B] via-[#8B1535] to-[#5E0C20] text-white">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            {subtitle && (
              <p className="text-sm text-white/90 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes maintenanceSlideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes maintenanceSlideOut {
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
