"use client";

import React from "react";

interface LoadingSkeletonProps {
  count?: number;
}

export function LoadingSkeleton({ count = 5 }: LoadingSkeletonProps) {
  return (
    <>
      {[...Array(count)].map((_, idx) => (
        <div key={idx} className="border-b border-gray-200 bg-white animate-pulse px-4 py-2.5">
          <div className="flex items-center gap-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-28"></div>
            <div className="flex-1 h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      ))}
    </>
  );
}
