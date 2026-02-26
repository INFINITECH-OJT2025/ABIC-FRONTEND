"use client";

import React from "react";

export interface MaintenanceRefreshButtonProps {
  onClick: () => void;
  title?: string;
}

/**
 * Refresh button for maintenance pages, matching ledger RefreshButton style.
 */
export function MaintenanceRefreshButton({
  onClick,
  title = "Refresh",
}: MaintenanceRefreshButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-2.5 rounded-xl border border-gray-200 hover:bg-[#7B0F2B]/5 hover:border-[#7B0F2B]/30 transition-all"
      title={title}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M4 12a8 8 0 0 1 14.9-3M20 12a8 8 0 0 1-14.9 3" />
        <path d="M18 5v4h-4M6 19v-4h4" />
      </svg>
    </button>
  );
}
