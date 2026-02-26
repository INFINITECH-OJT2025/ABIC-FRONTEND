"use client";

import React from "react";
import { FileText } from "lucide-react";

interface EmptyStateProps {
  message: string;
  description: string;
}

export function EmptyState({ message, description }: EmptyStateProps) {
  return (
    <div className="rounded-2xl bg-gray-50/80 border-2 border-dashed border-gray-200 px-4 py-16 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#7B0F2B]/10 flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-[#7B0F2B]" />
      </div>
      <p className="text-lg font-semibold text-gray-900 mb-1">{message}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
