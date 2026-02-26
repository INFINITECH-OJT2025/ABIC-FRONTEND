"use client";

import React from "react";
import { ArrowUpDown, ChevronDown } from "lucide-react";

interface SortSelectorProps {
  value: "newest" | "oldest";
  onChange: (value: "newest" | "oldest") => void;
}

export function SortSelector({ value, onChange }: SortSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-sm font-medium text-[#7B0F2B]">
        <ArrowUpDown className="w-4 h-4" />
        <label>Sort</label>
      </div>
      <div className="relative min-w-[220px]">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as "newest" | "oldest")}
          className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 pr-10 text-sm transition-all hover:border-[#7B0F2B]/40 hover:bg-gray-50/50 focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] focus:outline-none cursor-pointer appearance-none"
        >
          <option value="oldest">Date Created (Oldest First)</option>
          <option value="newest">Date Created (Newest First)</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
      </div>
    </div>
  );
}
