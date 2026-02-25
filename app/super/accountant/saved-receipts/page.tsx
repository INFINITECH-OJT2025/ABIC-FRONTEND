"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  RotateCcw,
  Search,
} from "lucide-react";
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
  receipt_data: any;
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

export default function SavedReceiptsPage() {
  const [receipts, setReceipts] = useState<SavedReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] =
    useState<SavedReceipt | null>(null);
  const [panelClosing, setPanelClosing] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 12;

  const [filtersOpen, setFiltersOpen] = useState(true);

  const [filters, setFilters] = useState<SearchFilters>({
    owner_id: null,
    owner_name: "",
    voucher_no: "",
    date_from: "",
    date_to: "",
    transaction_type: "ALL",
  });

  const [debouncedVoucher, setDebouncedVoucher] = useState("");

  // Owner dropdown state
  const [owners, setOwners] = useState<Owner[]>([]);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState("");
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(false);

  /* ---------------- FILTERS ---------------- */

  const filteredOwners = useMemo(() => {
    if (!ownerSearchQuery.trim()) {
      return owners.filter((owner) => {
        const status = typeof owner.status === "string" ? owner.status.toUpperCase() : "ACTIVE";
        const ownerType = typeof owner.owner_type === "string" ? owner.owner_type.toUpperCase() : "";
        return status === "ACTIVE" && ownerType !== "SYSTEM" && ownerType !== "MAIN";
      });
    }
    const q = ownerSearchQuery.toLowerCase();
    return owners.filter(
      (owner) => {
        const status = typeof owner.status === "string" ? owner.status.toUpperCase() : "ACTIVE";
        const ownerType = typeof owner.owner_type === "string" ? owner.owner_type.toUpperCase() : "";
        return status === "ACTIVE" &&
          ownerType !== "SYSTEM" &&
          ownerType !== "MAIN" &&
          (owner.name?.toLowerCase().includes(q) ||
            owner.email?.toLowerCase().includes(q) ||
            owner.phone?.toLowerCase().includes(q));
      }
    );
  }, [owners, ownerSearchQuery]);

  /* ---------------- DEBOUNCE ---------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        voucher_no: debouncedVoucher,
      }));
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [debouncedVoucher]);

  /* ---------------- FETCH ---------------- */

  const fetchOwners = async () => {
    setLoadingOwners(true);
    try {
      const res = await fetch("/api/accountant/maintenance/owners?status=ACTIVE&per_page=all");
      const data = await res.json();
      if (res.ok && data.success) {
        const ownersList = data.data?.data || data.data || [];
        // Filter out SYSTEM and MAIN types
        const filteredOwners = Array.isArray(ownersList) 
          ? ownersList.filter((owner: Owner) => {
              const ownerType = typeof owner.owner_type === "string" ? owner.owner_type.toUpperCase() : "";
              return ownerType !== "SYSTEM" && ownerType !== "MAIN";
            })
          : [];
        setOwners(filteredOwners);
      } else {
        setOwners([]);
      }
    } catch (error) {
      console.error("Error fetching owners:", error);
      setOwners([]);
    } finally {
      setLoadingOwners(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  // Only fetch receipts when filters are active
  useEffect(() => {
    const hasFilters = !!(
      filters.owner_id ||
      filters.owner_name ||
      filters.voucher_no ||
      filters.date_from ||
      filters.date_to ||
      filters.transaction_type !== "ALL"
    );
    
    if (hasFilters) {
      fetchReceipts();
    } else {
      // Clear receipts when no filters
      setReceipts([]);
      setPagination(null);
      setLoading(false);
    }
  }, [filters, currentPage]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);

      let url = `/api/accountant/saved-receipts?page=${currentPage}&per_page=${perPage}`;

      if (filters.owner_id)
        url += `&owner_id=${filters.owner_id}`;
      if (filters.owner_name)
        url += `&owner_name=${encodeURIComponent(filters.owner_name)}`;
      if (filters.voucher_no)
        url += `&voucher_no=${encodeURIComponent(filters.voucher_no)}`;
      if (filters.date_from) url += `&date_from=${filters.date_from}`;
      if (filters.date_to) url += `&date_to=${filters.date_to}`;
      if (filters.transaction_type !== "ALL")
        url += `&transaction_type=${filters.transaction_type}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setReceipts(data.data || []);
        setPagination(data.pagination || null);
      } else {
        setReceipts([]);
        setPagination(null);
      }
    } catch (error) {
      console.error(error);
      setReceipts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

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

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.owner_id ||
      filters.owner_name ||
      filters.voucher_no ||
      filters.date_from ||
      filters.date_to ||
      filters.transaction_type !== "ALL"
    );
  }, [filters]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatAmount = (amount: string) =>
    `₱ ${parseFloat(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })}`;

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-full flex flex-col">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 border-b">
        <h1 className="text-lg font-semibold">Transactions Receipt</h1>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 bg-gray-50">
        <div className="w-full">
          {/* FILTER BAR */}
          <div className="sticky top-0 z-30 bg-gray-50 pb-4">
            <div className="bg-white border rounded-xl shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Transaction Receipts
                  </h2>
                  <p className="text-xs text-gray-500">
                    Filter and manage saved receipts
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {hasActiveFilters && (
                    <span className="text-xs font-semibold text-[#7B0F2B] bg-[#7B0F2B]/10 px-3 py-1 rounded-full">
                      Filters Active
                    </span>
                  )}

                  <button
                    onClick={() => setFiltersOpen(!filtersOpen)}
                    className="px-3 py-2 text-sm font-medium text-white bg-[#7B0F2B] rounded-md hover:bg-[#8B1535] transition-colors"
                  >
                    {filtersOpen ? "Hide Filters" : "Show Filters"}
                  </button>
                </div>
              </div>

              {filtersOpen && (
                <div className="px-5 py-5 bg-gray-50 rounded-b-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

                    {/* Owner */}
                    <div className="flex flex-col">
                      <OwnerSearchableDropdown
                        label="Owner"
                        placeholder="Search owner..."
                        value={filters.owner_id}
                        searchQuery={ownerSearchQuery}
                        owners={owners}
                        filteredOwners={filteredOwners}
                        loading={loadingOwners}
                        onSelect={(ownerId) => {
                          setFilters((prev) => ({
                            ...prev,
                            owner_id: ownerId,
                          }));
                          setCurrentPage(1);
                        }}
                        onClear={() => {
                          setFilters((prev) => ({
                            ...prev,
                            owner_id: null,
                            owner_name: "",
                          }));
                          setOwnerSearchQuery("");
                          setCurrentPage(1);
                        }}
                        onSearchChange={(query) => {
                          setOwnerSearchQuery(query);
                        }}
                        onShowDropdown={setShowOwnerDropdown}
                        showDropdown={showOwnerDropdown}
                        emptyMessage="No owners found"
                        noResultsMessage="No owners found"
                      />
                    </div>

                    {/* Voucher */}
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium mb-2 text-gray-900">
                        Voucher Number
                      </label>
                      <input
                        type="text"
                        placeholder="Enter voucher..."
                        value={debouncedVoucher}
                        onChange={(e) => setDebouncedVoucher(e.target.value)}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 disabled:opacity-60 transition-all focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f]"
                      />
                    </div>

                    {/* Transaction Type */}
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium mb-2 text-gray-900">
                        Transaction Type
                      </label>
                      <select
                        value={filters.transaction_type}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            transaction_type: e.target.value as any,
                          }))
                        }
                        className="w-full rounded-md border border-gray-200 px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 disabled:opacity-60 transition-all focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f]"
                      >
                        <option value="ALL">All</option>
                        <option value="DEPOSIT">Deposit</option>
                        <option value="WITHDRAWAL">Withdrawal</option>
                      </select>
                    </div>

                    {/* Date From */}
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium mb-2 text-gray-900">
                        Date From
                      </label>
                      <input
                        type="date"
                        value={filters.date_from}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            date_from: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-200 px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 disabled:opacity-60 transition-all focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f]"
                      />
                    </div>

                    {/* Date To */}
                    <div className="flex flex-col">
                      <label className="block text-sm font-medium mb-2 text-gray-900">
                        Date To
                      </label>
                      <input
                        type="date"
                        value={filters.date_to}
                        min={filters.date_from || undefined}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            date_to: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-200 px-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 disabled:opacity-60 transition-all focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f]"
                      />
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={handleResetFilters}
                        className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-gray-100"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RECEIPTS */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mt-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <ReceiptCardSkeleton count={perPage} />
              </div>
            ) : receipts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    onClick={() => {
                      setPanelClosing(false);
                      setSelectedReceipt(receipt);
                    }}
                    className="group border rounded-lg overflow-hidden bg-white cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                  >
                    <div className="relative h-52 bg-gray-100">
                      {receipt.file_url ? (
                        <img
                          src={receipt.file_url}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <FileText className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="bg-[#7B0F2B] p-4 text-white">
                      <p className="text-sm font-semibold truncate text-white">
                        {receipt.display_name || "No Name"}
                      </p>

                      {receipt.transaction && (
                        <p className="text-lg font-bold text-white mt-1">
                          {formatAmount(receipt.transaction.amount)}
                        </p>
                      )}

                      <div className="mt-3 text-xs text-white/90 flex items-center justify-between">
                        <span>{formatDate(receipt.created_at)}</span>
                        <span className="font-medium opacity-0 group-hover:opacity-100 transition">
                          Click to view
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : hasActiveFilters ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No receipts found</h3>
                <p className="text-sm text-gray-500 text-center max-w-md">
                  No receipts match your current filters. Try adjusting your search criteria.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No filters applied</h3>
                <p className="text-sm text-gray-500 text-center max-w-md">
                  Apply filters above to search for transaction receipts. You can filter by owner, voucher number, date range, or transaction type.
                </p>
              </div>
            )}
          </div>
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