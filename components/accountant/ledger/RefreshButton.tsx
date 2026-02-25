"use client";

import React from "react";

interface RefreshButtonProps {
  onClick: () => void;
  title?: string;
}

export function RefreshButton({ onClick, title = "Refresh" }: RefreshButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-all hover:border-[#7a0f1f]/40"
      title={title}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 12a8 8 0 0 1 14.9-3M20 12a8 8 0 0 1-14.9 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 5v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 19v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}
