"use client";

import React from "react";
import { formatCurrency } from "./helpers";

interface OpeningBalanceProps {
  openingBalance: number;
}

export function OpeningBalance({ openingBalance }: OpeningBalanceProps) {
  return (
    <div className="mb-3">
      <div className="text-xs text-white/80 mb-0.5">
        Opening Balance
      </div>
      <div className="text-lg font-bold text-white">
        {formatCurrency(openingBalance)}
      </div>
    </div>
  );
}

interface EndingBalanceProps {
  endingBalance: number;
}

export function EndingBalance({ endingBalance }: EndingBalanceProps) {
  return (
    <div
      className={`flex items-center justify-end
        px-4 py-3 -me-5 transition-all
        bg-[#7a0f1f] text-white
        rounded-l-md rounded-tr-none rounded-br-none
        min-w-[180px]`}
    >
      
      <div className="border-r-4 border-white pr-4 text-right">
        
        <div className="text-[11px] uppercase tracking-wide text-white/80 mb-0.5">
          Running Balance
        </div>

        <div
          className={`text-xl font-semibold tracking-tight
            ${endingBalance < 0 
              ? "text-rose-100" 
              : "text-white"
            }`}
        >
          {formatCurrency(endingBalance)}
        </div>

      </div>

    </div>
  );
}
