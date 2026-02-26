"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

const HERO_PATTERN =
  "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";

export interface MaintenancePageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  primaryAction?: React.ReactNode;
}

export function MaintenancePageHeader({
  icon: Icon,
  title,
  subtitle,
  primaryAction,
}: MaintenancePageHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#7B0F2B] via-[#8B1535] to-[#5E0C20] text-white px-6 py-8">
      <div
        className="absolute inset-0 opacity-50"
        style={{ backgroundImage: `url("${HERO_PATTERN}")` }}
      />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-white/80 text-sm mt-0.5">{subtitle}</p>
          </div>
        </div>
        {primaryAction}
      </div>
    </div>
  );
}

export interface MaintenancePageLayoutProps {
  children: React.ReactNode;
  /** Optional: if provided, renders the hero header. Otherwise children must include it. */
  header?: MaintenancePageHeaderProps;
  /** Layout variant: 'default' (single content area) or 'filter' (sticky filter card + scrollable content) */
  variant?: "default" | "filter";
}

/**
 * Page layout for maintenance pages, based on ledger design.
 * Uses min-h-full flex flex-col bg-gray-50/80, sticky header, and consistent spacing.
 */
export function MaintenancePageLayout({
  children,
  header,
  variant = "default",
}: MaintenancePageLayoutProps) {
  return (
    <div className="min-h-full flex flex-col bg-gray-50/80">
      <div className={`flex-1 min-h-0 flex flex-col ${variant === "filter" ? "" : ""}`}>
        {header && (
          <div className="sticky top-0 z-20 bg-gray-50/80 shrink-0">
            <MaintenancePageHeader {...header} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
