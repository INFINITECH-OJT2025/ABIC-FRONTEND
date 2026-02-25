"use client";

import React from "react";
import { EndingBalance, OpeningBalance } from "./BalanceSummaryCards";

interface LedgerColumnHeaderProps {
  accountLabel: string;
  showAdditionalColumns: boolean;
  endingBalance?: number;
  openingBalance?: number;
}

export function LedgerColumnHeader({ accountLabel, showAdditionalColumns, endingBalance, openingBalance }: LedgerColumnHeaderProps) {
  return (
    <div className="overflow-hidden bg-[#7a0f1f] sticky top-0 z-10 shadow-md rounded-t-md">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          
          <div className="flex-1 border-l-4 border-white pl-4">
            
            <div className="text-xs font-semibold uppercase tracking-wider text-white/80">
              ABIC REALTY & CONSULTANCY CORPORATION 2025
            </div>

            <div className="text-sm font-bold uppercase tracking-widest text-white mt-1">
              {accountLabel}
            </div>

          </div>

          {openingBalance !== undefined && (
            <OpeningBalance openingBalance={openingBalance} />
          )}

          {endingBalance !== undefined && openingBalance === undefined && (
            <EndingBalance endingBalance={endingBalance} />
          )}

        </div>
      </div>
    </div>
  );
}

export function LedgerTableHeader({ showAdditionalColumns, ownerColumnLabel = "OWNER" }: { showAdditionalColumns: boolean; ownerColumnLabel?: string }) {
  return (
    <thead className="bg-white">
      <tr className="text-xs font-bold text-gray-700 bg-white border-b-2 border-gray-300">
        <th className="w-[140px] px-4 py-3 text-left bg-white sticky top-0 z-10">VOUCHER DATE</th>
        <th className="w-[140px] px-4 py-3 text-left border-l border-gray-200 bg-white sticky top-0 z-10">VOUCHER NO.</th>
        <th className="w-[160px] px-4 py-3 text-left border-l border-gray-200 bg-white sticky top-0 z-10">TRANSACTION TYPE</th>
        <th className="w-[200px] px-4 py-3 text-left border-l border-gray-200 bg-white sticky top-0 z-10">{ownerColumnLabel}</th>
        {showAdditionalColumns ? (
          <>
            <th className="px-4 py-3 text-left border-l border-gray-200 bg-white sticky top-0 z-10">FUND REFERENCE</th>
            <th className="px-4 py-3 text-left border-l border-gray-200 bg-white sticky top-0 z-10">PERSON IN CHARGE</th>
          </>
        ) : (
          <th className="px-4 py-3 text-left border-l border-gray-200 bg-white sticky top-0 z-10">PARTICULARS</th>
        )}
        <th className="w-[150px] px-4 py-3 text-right border-l border-gray-200 bg-white sticky top-0 z-10">DEPOSIT</th>
        <th className="w-[150px] px-4 py-3 text-right border-l border-gray-200 bg-white sticky top-0 z-10">WITHDRAWAL</th>
        <th className="w-[150px] px-4 py-3 text-right border-l border-gray-200 bg-white sticky top-0 z-10">BALANCE</th>
      </tr>
    </thead>
  );
}
