"use client";

import UnifiedTransactionForm from "@/components/accountant/transaction/UnifiedTransactionForm";

export default function TransactionsPage() {
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center justify-between shrink-0 border-b border-[#6A0D25]/30">
        <div>
          <h1 className="text-lg font-semibold tracking-wide">New Transaction</h1>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <UnifiedTransactionForm />
      </div>
    </div>
  );
}
