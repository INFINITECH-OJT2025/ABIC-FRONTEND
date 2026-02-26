"use client";

import React from "react";

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface MaintenancePaginationProps {
  paginationMeta: PaginationMeta | null;
  currentPage: number;
  setCurrentPage: (page: number | ((p: number) => number)) => void;
  itemName?: string;
  /** Layout: 'full' shows page numbers, 'simple' shows prev/next only */
  variant?: "full" | "simple";
}

/**
 * Pagination component for maintenance pages, matching ledger design.
 */
export function MaintenancePagination({
  paginationMeta,
  currentPage,
  setCurrentPage,
  itemName = "items",
  variant = "full",
}: MaintenancePaginationProps) {
  if (!paginationMeta || paginationMeta.total === 0) return null;

  const prevNextClass =
    "px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7B0F2B]/5 hover:border-[#7B0F2B]/30 transition-all";

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100">
      <div className="text-sm text-gray-600">
        Showing {paginationMeta.from} to {paginationMeta.to} of{" "}
        {paginationMeta.total} {itemName}
      </div>
      {paginationMeta.last_page > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={paginationMeta.current_page === 1}
            className={prevNextClass}
          >
            Previous
          </button>
          {variant === "full" && (
            <div className="flex items-center gap-1">
              {[...Array(paginationMeta.last_page)].map((_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === paginationMeta.last_page ||
                  (page >= paginationMeta.current_page - 1 &&
                    page <= paginationMeta.current_page + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                        paginationMeta.current_page === page
                          ? "bg-[#7B0F2B] text-white"
                          : "border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === paginationMeta.current_page - 2 ||
                  page === paginationMeta.current_page + 2
                ) {
                  return (
                    <span key={page} className="px-2 text-gray-500">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>
          )}
          {variant === "simple" && (
            <span className="text-sm text-gray-600">
              Page {currentPage} of {paginationMeta.last_page}
            </span>
          )}
          <button
            onClick={() =>
              setCurrentPage((p) =>
                Math.min(paginationMeta.last_page, p + 1)
              )
            }
            disabled={
              paginationMeta.current_page === paginationMeta.last_page
            }
            className={prevNextClass}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
