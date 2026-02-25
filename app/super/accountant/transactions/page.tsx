"use client";

import { Plus } from "lucide-react";
import UnifiedTransactionForm from "@/components/accountant/transaction/UnifiedTransactionForm";

export default function TransactionsPage() {
  return (
    <div className="min-h-full flex flex-col bg-gray-50/80">
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-gray-50/80">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#7B0F2B] via-[#8B1535] to-[#5E0C20] text-white px-6 py-8">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                <Plus className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">New Transaction</h1>
                <p className="text-white/80 text-sm mt-0.5">Create deposit or withdrawal transactions</p>
              </div>
            </div>
          </div>
        </div>
        {/* Content - form fills remaining space, sticky action bar at bottom */}
        <div className="flex-1 min-h-0 flex flex-col mt-6">
          <UnifiedTransactionForm />
        </div>
      </div>
    </div>
  );
}
