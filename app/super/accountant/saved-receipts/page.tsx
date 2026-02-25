"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FileText, RotateCcw, Search, Receipt, Users } from "lucide-react";
import { ReceiptCardSkeleton } from "@/components/accountant/saved-receipts/ReceiptCardSkeleton";
import { ImagePreviewPanel } from "@/components/accountant/ledger";
import { OwnerSearchableDropdown, type Owner } from "@/components/accountant/transaction";

interface SavedReceipt {
  id: number;
  transaction_id: number | null;
  transaction_type: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  receipt_data: unknown;
  file_url?: string;
  display_name?: string;
  created_at: string;
  transaction?: {
    id: number;
    voucher_no: string | null;
    amount: string;
  };
}

interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface SearchFilters {
  owner_id: number | null;
  owner_name: string;
  voucher_no: string;
  date_from: string;
  date_to: string;
  transaction_type: "ALL" | "DEPOSIT" | "WITHDRAWAL";
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatAmount = (amount: string) =>
  `₱ ${parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function SavedReceiptsPage() {
  const [receipts, setReceipts] = useState<SavedReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<SavedReceipt | null>(null);
  const [panelClosing, setPanelClosing] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 12;
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [debouncedVoucher, setDebouncedVoucher] = useState("");

  const [filters, setFilters] = useState<SearchFilters>({
    owner_id: null,
    owner_name: "",
    voucher_no: "",
    date_from: "",
    date_to: "",
    transaction_type: "ALL",
  });

  const [owners, setOwners] = useState<Owner[]>([]);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState("");
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(false);

  const filteredOwners = useMemo(() => {
    if (!ownerSearchQuery.trim()) {
      return owners.filter((o) => {
        const status = (o.status ?? "ACTIVE").toString().toUpperCase();
        const type = (o.owner_type ?? "").toString().toUpperCase();
        return status === "ACTIVE" && type !== "SYSTEM" && type !== "MAIN";
      });
    }
    const q = ownerSearchQuery.toLowerCase();
    return owners.filter((o) => {
      const status = (o.status ?? "ACTIVE").toString().toUpperCase();
      const type = (o.owner_type ?? "").toString().toUpperCase();
      return (
        status === "ACTIVE" &&
        type !== "SYSTEM" &&
        type !== "MAIN" &&
        (o.name?.toLowerCase().includes(q) ||
          o.email?.toLowerCase().includes(q) ||
          o.phone?.toLowerCase().includes(q))
      );
    });
  }, [owners, ownerSearchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, voucher_no: debouncedVoucher }));
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [debouncedVoucher]);

  const fetchOwners = async () => {
    setLoadingOwners(true);
    try {
      const res = await fetch("/api/accountant/maintenance/owners?status=ACTIVE&per_page=all");
      const data = await res.json();
      if (res.ok && data.success) {
        const list = data.data?.data ?? data.data ?? [];
        setOwners(
          Array.isArray(list)
            ? list.filter((o: Owner) => {
                const type = (o.owner_type ?? "").toString().toUpperCase();
                return type !== "SYSTEM" && type !== "MAIN";
              })
            : []
        );
      } else setOwners([]);
    } catch {
      setOwners([]);
    } finally {
      setLoadingOwners(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const hasFilters = useMemo(
    () =>
      !!(filters.owner_id || filters.owner_name || filters.voucher_no || filters.date_from || filters.date_to || filters.transaction_type !== "ALL"),
    [filters]
  );

  const fetchReceipts = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), per_page: String(perPage) });
      if (filters.owner_id) params.append("owner_id", String(filters.owner_id));
      if (filters.owner_name) params.append("owner_name", filters.owner_name);
      if (filters.voucher_no) params.append("voucher_no", filters.voucher_no);
      if (filters.date_from) params.append("date_from", filters.date_from);
      if (filters.date_to) params.append("date_to", filters.date_to);
      if (filters.transaction_type !== "ALL") params.append("transaction_type", filters.transaction_type);

      const res = await fetch(`/api/accountant/saved-receipts?${params}`);
      const data = await res.json();
      if (data.success) {
        setReceipts(data.data ?? []);
        setPagination(data.pagination ?? null);
      } else {
        setReceipts([]);
        setPagination(null);
      }
    } catch {
      setReceipts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    if (hasFilters) fetchReceipts();
    else {
      setReceipts([]);
      setPagination(null);
      setLoading(false);
    }
  }, [hasFilters, fetchReceipts]);


  const handleResetFilters = () => {
    setFilters({
      owner_id: null,
      owner_name: "",
      voucher_no: "",
      date_from: "",
      date_to: "",
      transaction_type: "ALL",
    });
    setOwnerSearchQuery("");
    setDebouncedVoucher("");
    setCurrentPage(1);
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 px-4 py-2.5 h-10 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all";

  return (
    <div className="min-h-full flex flex-col bg-gray-50/80">
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Sticky: Header + Filter Card */}
        <div className="sticky top-0 z-20 bg-gray-50 shrink-0 pb-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
          {/* Hero Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#7B0F2B] via-[#8B1535] to-[#5E0C20] text-white px-6 py-8">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                <Receipt className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Transaction Receipts</h1>
                <p className="text-white/80 text-sm mt-0.5">Search and view saved transaction receipts</p>
              </div>
            </div>
          </div>

          {/* Filter Card - sticky with header */}
          <div className="px-4 sm:px-6 lg:px-8 mt-6">
            <section className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-visible">
              <div className="p-6 bg-gray-50/50 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                <p className="text-xs text-gray-500">Apply filters to search receipts</p>
              </div>
              <div className="flex items-center gap-3">
                {hasFilters && (
                  <span className="text-xs font-semibold text-[#7B0F2B] bg-[#7B0F2B]/10 px-3 py-1 rounded-full">
                    Filters Active
                  </span>
                )}

                {hasFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                )}

                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#7B0F2B] rounded-xl hover:bg-[#8B1535] transition-colors"
                >
                  {filtersOpen ? "Hide Filters" : "Show Filters"}
                </button>
              </div>
            </div>

            {filtersOpen && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="flex flex-col">
                  <OwnerSearchableDropdown
                    label="Owner"
                    required={false}
                    placeholder="Search owner..."
                    value={filters.owner_id}
                    searchQuery={ownerSearchQuery}
                    owners={owners}
                    filteredOwners={filteredOwners}
                    loading={loadingOwners}
                    onSelect={(id) => {
                      setFilters((prev) => ({ ...prev, owner_id: id }));
                      setCurrentPage(1);
                    }}
                    onClear={() => {
                      setFilters((prev) => ({ ...prev, owner_id: null, owner_name: "" }));
                      setOwnerSearchQuery("");
                      setCurrentPage(1);
                    }}
                    onSearchChange={setOwnerSearchQuery}
                    onShowDropdown={setShowOwnerDropdown}
                    showDropdown={showOwnerDropdown}
                    emptyMessage="No owners found"
                    noResultsMessage="No owners found"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Voucher Number</label>
                  <input
                    type="text"
                    placeholder="Enter voucher..."
                    value={debouncedVoucher}
                    onChange={(e) => setDebouncedVoucher(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Transaction Type</label>
                  <select
                    value={filters.transaction_type}
                    onChange={(e) => {
                      setFilters((prev) => ({ ...prev, transaction_type: e.target.value as SearchFilters["transaction_type"] }));
                      setCurrentPage(1);
                    }}
                    className={inputClass}
                  >
                    <option value="ALL">All</option>
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAWAL">Withdrawal</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Date From</label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Date To</label>
                  <input
                    type="date"
                    value={filters.date_to}
                    min={filters.date_from || undefined}
                    onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
              </div>
            </section>
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 mt-6 pb-6">
          <section className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <ReceiptCardSkeleton count={perPage} />
              </div>
            ) : receipts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {receipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      onClick={() => {
                        setPanelClosing(false);
                        setSelectedReceipt(receipt);
                      }}
                      className="group rounded-2xl border border-gray-100 overflow-hidden bg-white cursor-pointer hover:shadow-lg hover:border-[#7B0F2B]/30 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="relative h-52 bg-gray-50">
                        {receipt.file_url ? (
                          <img src={receipt.file_url} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <FileText className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="bg-[#7B0F2B] p-4 text-white">
                        <p className="text-sm font-semibold truncate">{receipt.display_name || "No Name"}</p>
                        {receipt.transaction && (
                          <p className="text-lg font-bold mt-1">{formatAmount(receipt.transaction.amount)}</p>
                        )}
                        <div className="mt-3 text-xs text-white/90 flex items-center justify-between">
                          <span>{formatDate(receipt.created_at)}</span>
                          <span className="font-medium opacity-0 group-hover:opacity-100 transition">Click to view</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {pagination && pagination.last_page > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      Showing {pagination.from} to {pagination.to} of {pagination.total} receipts
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7B0F2B]/5 hover:border-[#7B0F2B]/30 transition-all"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {pagination.last_page}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                        disabled={currentPage >= pagination.last_page}
                        className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7B0F2B]/5 hover:border-[#7B0F2B]/30 transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : hasFilters ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl bg-gray-50/80 border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 rounded-2xl bg-[#7B0F2B]/10 flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-[#7B0F2B]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No receipts found</h3>
                <p className="text-sm text-gray-500 text-center max-w-md">
                  No receipts match your current filters. Try adjusting your search criteria.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl bg-gray-50/80 border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 rounded-2xl bg-[#7B0F2B]/10 flex items-center justify-center mb-4">
                  <Receipt className="w-8 h-8 text-[#7B0F2B]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No filters applied</h3>
                <p className="text-sm text-gray-500 text-center max-w-md">
                  Apply filters above to search for transaction receipts. Filter by owner, voucher number, date range, or transaction type.
                </p>
              </div>
            )}
            </div>
          </section>
        </div>
      </div>

      <ImagePreviewPanel
        open={selectedReceipt !== null}
        closing={panelClosing}
        onClose={() => {
          setPanelClosing(true);
          setTimeout(() => {
            setSelectedReceipt(null);
            setPanelClosing(false);
          }, 350);
        }}
        imageUrl={null}
        imageName={selectedReceipt?.display_name || ""}
        isVoucher={false}
        loading={false}
        error={null}
        fileType={selectedReceipt?.file_type || null}
        attachmentUrl={selectedReceipt?.file_url || null}
      />
    </div>
  );
}
