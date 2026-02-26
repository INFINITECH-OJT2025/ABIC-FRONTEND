"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

export interface MaintenanceEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional primary action button */
  action?: React.ReactNode;
}

/**
 * Empty state for maintenance pages, matching ledger/ledger-style design.
 */
export function MaintenanceEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: MaintenanceEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl bg-gray-50/80 border-2 border-dashed border-gray-200">
      <div className="w-16 h-16 rounded-2xl bg-[#7B0F2B]/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[#7B0F2B]" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-md mb-6">
        {description}
      </p>
      {action}
    </div>
  );
}
