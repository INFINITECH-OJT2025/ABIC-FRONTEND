"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Receipt, Search, Columns2, X, Plus } from "lucide-react";
import {
  OpeningBalance,
  EndingBalance,
  SortSelector,
  RefreshButton,
  LedgerColumnHeader,
  LedgerTableHeader,
  LoadingSkeleton,
  EmptyState,
  LedgerRowComponent,
  ImagePreviewPanel,
  TransactionSidePanel,
  type LedgerRow,
  type InstrumentAttachment,
} from "@/components/accountant/ledger";

export default function SystemLedgerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dateCreatedSort, setDateCreatedSort] = useState<"newest" | "oldest">("oldest");
  const [highlightTransactionId, setHighlightTransactionId] = useState<string | null>(null);
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [showImagePreviewPanel, setShowImagePreviewPanel] = useState(false);
  const [imagePreviewPanelClosing, setImagePreviewPanelClosing] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>("");
  const [previewIsVoucher, setPreviewIsVoucher] = useState(false);
  const [previewImageLoading, setPreviewImageLoading] = useState(false);
  const [previewImageError, setPreviewImageError] = useState<string | null>(null);
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string | null>(null);
  const [previewFileType, setPreviewFileType] = useState<string | null>(null);
  const [showAdditionalColumns, setShowAdditionalColumns] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTransactionPanel, setShowTransactionPanel] = useState(false);
  const [transactionPanelClosing, setTransactionPanelClosing] = useState(false);

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const res = await fetch(
        `/api/accountant/ledger/system?sort=${dateCreatedSort}`
      );
      const data = await res.json();
      if (res.ok && data.success && data.data?.transactions) {
        const txns = data.data.transactions;
        setRows(
          txns.map((t: Record<string, unknown>) => ({
            createdAt: String(t.createdAt ?? ""),
            voucherDate: String(t.voucherDate ?? ""),
            isVoucherDate: t.isVoucherDate !== undefined ? Boolean(t.isVoucherDate) : true,
            voucherNo: String(t.voucherNo ?? ""),
            transType: String(t.transType ?? ""),
            owner: String(t.owner ?? ""),
            particulars: String(t.particulars ?? ""),
            deposit: Number(t.deposit ?? 0),
            withdrawal: Number(t.withdrawal ?? 0),
            outsBalance: Number(t.outsBalance ?? 0),
            transferGroupId: t.transferGroupId ? String(t.transferGroupId) : null,
            voucherAttachmentUrl: t.voucherAttachmentUrl ? String(t.voucherAttachmentUrl) : null,
            instrumentAttachments: Array.isArray(t.instrumentAttachments)
              ? (t.instrumentAttachments as InstrumentAttachment[])
              : [],
            fundReference: t.fundReference ? String(t.fundReference) : null,
            personInCharge: t.personInCharge ? String(t.personInCharge) : null,
            otherOwnerId: t.otherOwnerId ? Number(t.otherOwnerId) : null,
            otherOwnerType: t.otherOwnerType ? String(t.otherOwnerType) : null,
            transactionId: t.transactionId ? Number(t.transactionId) : null,
          }))
        );
        setOpeningBalance(Number(data.data?.openingBalance ?? 0));
      } else {
        setRows([]);
      }
    } catch {
      setRows([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateCreatedSort]);

  // Handle URL params for highlighting
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (highlightId) {
      setHighlightTransactionId(highlightId);
      setTimeout(() => {
        setHighlightTransactionId(null);
        router.replace(window.location.pathname, { scroll: false });
      }, 3000);
    }
  }, [searchParams, router]);

  const handleTransactionCardClick = (row: LedgerRow) => {
    if (!row.otherOwnerId || !row.otherOwnerType) return;
    const highlightId = row.transactionId ? String(row.transactionId) : row.createdAt;

    if (row.otherOwnerType === "CLIENT") {
      router.push(`/super/accountant/ledger/clients?owner_id=${row.otherOwnerId}&highlight=${highlightId}`);
    } else if (row.otherOwnerType === "MAIN") {
      router.push(`/super/accountant/ledger/mains?owner_id=${row.otherOwnerId}&highlight=${highlightId}`);
    } else if (row.otherOwnerType === "COMPANY") {
      router.push(`/super/accountant/ledger/company?owner_id=${row.otherOwnerId}&highlight=${highlightId}`);
    } else if (row.otherOwnerType === "SYSTEM") {
      router.push(`/super/accountant/ledger/system?highlight=${highlightId}`);
    }
  };

  const handleOwnerNameClick = (e: React.MouseEvent, ownerId: number | null | undefined) => {
    e.stopPropagation();
    if (!ownerId) return;
    router.push(`/super/accountant/maintenance/owners?highlight=${ownerId}`);
  };

  const closeImagePreviewPanel = () => {
    setImagePreviewPanelClosing(true);
    setTimeout(() => {
      setShowImagePreviewPanel(false);
      setImagePreviewPanelClosing(false);
      setPreviewImageUrl(null);
      setPreviewImageName("");
      setPreviewIsVoucher(false);
      setPreviewImageError(null);
      setPreviewAttachmentUrl(null);
      setPreviewFileType(null);
    }, 350);
  };

  const openVoucherPreview = (label: string, attachmentUrl: string | null, isVoucher = false) => {
    if (!attachmentUrl) return;
    setPreviewImageName(label);
    setPreviewIsVoucher(isVoucher);
    setPreviewAttachmentUrl(attachmentUrl);
    setShowImagePreviewPanel(true);
    // Let ImagePreviewPanel handle loading via attachmentUrl
    setPreviewImageUrl(null);
    setPreviewImageError(null);
    setPreviewFileType(null);
    setPreviewImageLoading(false);
  };

  const computed = useMemo(() => {
    // Order by full timestamp (date + time + microseconds) for precise ordering
    const sortedRows = [...rows].sort((a, b) => {
      // Parse ISO8601 timestamp string (includes microseconds if available)
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      
      // If timestamps are identical (same millisecond), use transaction ID as tiebreaker
      if (aDate === bDate) {
        return (a.transactionId ?? 0) - (b.transactionId ?? 0);
      }
      return aDate - bDate;
    });

    // Apply display sort (oldest/newest)
    const sortedDisplayRows =
      dateCreatedSort === "newest" ? [...sortedRows].reverse() : sortedRows;

    // Apply search filter
    const filteredRows = searchQuery.trim()
      ? sortedDisplayRows.filter((row) => {
          const query = searchQuery.toLowerCase();
          return (
            row.voucherNo?.toLowerCase().includes(query) ||
            row.owner?.toLowerCase().includes(query) ||
            row.particulars?.toLowerCase().includes(query) ||
            row.transType?.toLowerCase().includes(query) ||
            row.fundReference?.toLowerCase().includes(query) ||
            row.personInCharge?.toLowerCase().includes(query) ||
            row.voucherDate?.toLowerCase().includes(query)
          );
        })
      : sortedDisplayRows;

    // Ending balance is the last entry's running balance (from backend)
    const endingBalance = sortedRows.length
      ? sortedRows[sortedRows.length - 1].outsBalance
      : openingBalance;

    return {
      computedRows: filteredRows,
      endingBalance,
    };
  }, [rows, dateCreatedSort, openingBalance, searchQuery]);

  const showing = useMemo(() => {
    const total = computed.computedRows.length;
    return { total, from: total ? 1 : 0, to: total };
  }, [computed.computedRows.length]);

  return (
    <div className="min-h-full flex flex-col bg-gray-50/80">
      <div className="sticky top-0 z-20 bg-gray-50/80">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#7B0F2B] via-[#8B1535] to-[#5E0C20] text-white px-6 py-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                <Receipt className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">System Ledger</h1>
                <p className="text-white/80 text-sm mt-0.5">View system transactions with running balance</p>
              </div>
            </div>
            <button
              onClick={() => setShowTransactionPanel(true)}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold bg-white text-[#7B0F2B] hover:bg-white/95 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              New Transaction
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 -mt-4">
        <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">System Ledger</h2>
              <p className="text-sm text-gray-600 mt-1">View system transactions with running balance</p>
            </div>
            <EndingBalance endingBalance={computed.endingBalance} />
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-6">
            {/* Left: Transactions Search */}
            <div className="flex items-center gap-2 flex-1 max-w-2xl">
              <div className="flex items-center gap-2 text-sm font-medium text-[#7B0F2B]">
                <Receipt className="w-4 h-4" />
                <label>Transactions</label>
              </div>
              <div className="relative flex-1 group min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none z-10 transition-colors group-hover:text-[#7B0F2B]/70" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-10 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all hover:border-[#7B0F2B]/40 hover:bg-gray-50/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#7B0F2B] transition-colors p-0.5 rounded hover:bg-[#7B0F2B]/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Refresh, Sort, and Column Toggle */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
              <RefreshButton onClick={fetchTransactions} />

              <SortSelector
                value={dateCreatedSort}
                onChange={(value) => setDateCreatedSort(value)}
              />

              <button
                onClick={() => setShowAdditionalColumns(!showAdditionalColumns)}
                className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 text-sm font-medium ${
                  showAdditionalColumns
                    ? "bg-[#7B0F2B] text-white border-[#7B0F2B] shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-[#7B0F2B] hover:text-[#7B0F2B]"
                }`}
                title={showAdditionalColumns ? "Hide additional columns" : "Show additional columns"}
              >
                <Columns2 className="w-4 h-4" />
                <span>Columns</span>
              </button>
            </div>
          </div>

          {/* Pagination Info */}
          <div className="text-sm text-neutral-600 my-3">
            Showing {showing.from} to {showing.to} of {showing.total} entries
          </div>

          {/* Column Header Card */}
          <LedgerColumnHeader
            accountLabel="SYSTEM"
            showAdditionalColumns={showAdditionalColumns}
            openingBalance={openingBalance}
          />

          {/* Transactions Table */}
          <div className="border border-gray-100 border-t-0 bg-white overflow-hidden rounded-b-2xl">
            {loadingTransactions ? (
              <LoadingSkeleton />
            ) : computed.computedRows.length === 0 ? (
              <EmptyState
                message={searchQuery ? "No transactions match your search" : "No transactions found"}
                description={searchQuery ? "Try adjusting your search terms" : "Transactions will appear here once recorded"}
              />
            ) : (
              <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
                <table className="w-full border-collapse bg-white" style={{ tableLayout: 'fixed' }}>
                  <LedgerTableHeader showAdditionalColumns={showAdditionalColumns} />
                  <tbody>
                    {computed.computedRows.map((r, idx) => {
                      const isHighlighted = highlightTransactionId && (
                        String(r.transactionId) === highlightTransactionId ||
                        r.createdAt === highlightTransactionId
                      );
                      return (
                        <LedgerRowComponent
                          key={idx}
                          row={r}
                          isHighlighted={!!isHighlighted}
                          showAdditionalColumns={showAdditionalColumns}
                          onVoucherPreview={openVoucherPreview}
                          onOwnerClick={handleOwnerNameClick}
                          onCardClick={handleTransactionCardClick}
                          index={idx}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Image Preview Panel */}
      <ImagePreviewPanel
        open={showImagePreviewPanel}
        closing={imagePreviewPanelClosing}
        onClose={closeImagePreviewPanel}
        imageUrl={previewImageUrl}
        imageName={previewImageName}
        isVoucher={previewIsVoucher}
        loading={previewImageLoading}
        error={previewImageError}
        fileType={previewFileType}
        attachmentUrl={previewAttachmentUrl}
      />

      <TransactionSidePanel
        open={showTransactionPanel}
        closing={transactionPanelClosing}
        onClose={() => {
          setTransactionPanelClosing(true);
          setTimeout(() => {
            setShowTransactionPanel(false);
            setTransactionPanelClosing(false);
          }, 350);
        }}
        onTransactionSuccess={fetchTransactions}
      />
    </div>
  );
}
