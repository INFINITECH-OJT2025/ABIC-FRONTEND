"use client";

import React from "react";

export interface MaintenanceSectionCardProps {
  children: React.ReactNode;
  /** Optional section title and description above content */
  title?: string;
  description?: string;
  /** Additional class for the card */
  className?: string;
}

/**
 * Content card for maintenance pages, matching ledger section style.
 * rounded-2xl bg-white shadow-sm border border-gray-100
 */
export function MaintenanceSectionCard({
  children,
  title,
  description,
  className = "",
}: MaintenanceSectionCardProps) {
  return (
    <section
      className={`rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden ${className}`}
    >
      {(title || description) && (
        <div className="p-5 border-b border-gray-100">
          {title && <h2 className="text-lg font-bold text-gray-900">{title}</h2>}
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
