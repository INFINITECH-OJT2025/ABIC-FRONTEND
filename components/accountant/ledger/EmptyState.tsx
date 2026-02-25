"use client";

import React from "react";
import { FileText } from "lucide-react";

interface EmptyStateProps {
  message: string;
  description: string;
}

export function EmptyState({ message, description }: EmptyStateProps) {
  return (
    <div className="rounded-md bg-white border border-gray-200 p-12 text-center">
      <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-gray-700 mb-1">{message}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}
