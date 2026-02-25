"use client";

import React from "react";

interface ReceiptCardSkeletonProps {
  count?: number;
}

export function ReceiptCardSkeleton({ count = 6 }: ReceiptCardSkeletonProps) {
  return (
    <>
      {[...Array(count)].map((_, idx) => (
        <div
          key={idx}
          className="border border-gray-200 rounded-lg overflow-hidden bg-white animate-pulse"
        >
          {/* Image Container Skeleton */}
          <div className="relative h-48 bg-gray-200"></div>
          
          {/* Content Skeleton */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="flex items-center gap-1 mb-2">
              <div className="h-3 bg-gray-200 rounded w-3"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-8 bg-gray-200 rounded"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
