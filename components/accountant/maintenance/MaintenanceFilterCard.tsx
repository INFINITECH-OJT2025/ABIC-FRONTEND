"use client";

import React from "react";
import { RotateCcw } from "lucide-react";

export interface MaintenanceFilterCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Whether filters are currently applied */
  hasFilters?: boolean;
  /** Callback when reset filters is clicked */
  onReset?: () => void;
  /** Whether filters section is open */
  filtersOpen?: boolean;
  /** Callback to toggle filters visibility */
  onToggleFilters?: () => void;
}

/**
 * Filter card for maintenance pages (saved-receipts, activity-log).
 * Matches ledger design with collapsible filters.
 */
export function MaintenanceFilterCard({
  title,
  description,
  children,
  hasFilters = false,
  onReset,
  filtersOpen = true,
  onToggleFilters,
}: MaintenanceFilterCardProps) {
  return (
    <section className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-visible">
      <div className="p-6 bg-gray-50/50 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasFilters && (
              <span className="text-xs font-semibold text-[#7B0F2B] bg-[#7B0F2B]/10 px-3 py-1 rounded-full">
                Filters Active
              </span>
            )}
            {hasFilters && onReset && (
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
            {onToggleFilters && (
              <button
                onClick={onToggleFilters}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#7B0F2B] rounded-xl hover:bg-[#8B1535] transition-colors"
              >
                {filtersOpen ? "Hide Filters" : "Show Filters"}
              </button>
            )}
          </div>
        </div>
        {filtersOpen && children}
      </div>
    </section>
  );
}
