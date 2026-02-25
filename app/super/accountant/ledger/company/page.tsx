"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, User, Columns2, Receipt, Plus } from "lucide-react";
import { OwnerSelectModal } from "@/components/owner-ledger/OwnerSelectModal";
import {
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
  fuzzyMatch,
  type LedgerRow,
  type InstrumentAttachment,
} from "@/components/accountant/ledger";

type CompanyOwner = {
  id: number;
  name: string;
  owner_type: string;
};

export default function CompanyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [companyOwners, setCompanyOwners] = useState<CompanyOwner[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [showOwnerSelectModal, setShowOwnerSelectModal] = useState(false);
  const [dateCreatedSort, setDateCreatedSort] = useState<"newest" | "oldest">("oldest");
  const [highlightTransactionId, setHighlightTransactionId] = useState<string | null>(null);
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(true);
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

  useEffect(() => {
    const fetchCompanyOwners = async () => {
      setLoadingOwners(true);
      try {
        const res = await fetch(
          "/api/accountant/maintenance/owners?status=active&owner_type=COMPANY&per_page=all"
        );
        const data = await res.json();
        if (res.ok && data.success) {
          const list = data.data?.data ?? data.data ?? [];
          const owners = Array.isArray(list) ? list : [];
          setCompanyOwners(owners);

          const ownerIdParam = searchParams.get("owner_id");
          if (ownerIdParam) {
            setSelectedOwnerId(ownerIdParam);
            setCompanySearchQuery("");
            setShowOwnerSelectModal(false);
          } else {
            setSelectedOwnerId("");
            setCompanySearchQuery("");
            if (owners.length > 0) {
              setShowOwnerSelectModal(true);
            }
          }
        } else {
          setCompanyOwners([]);
          setSelectedOwnerId("");
        }
      } catch {
        setCompanyOwners([]);
      } finally {
        setLoadingOwners(false);
      }
    };
    fetchCompanyOwners();
  }, [searchParams]);

  const fetchTransactions = async () => {
    if (!selectedOwnerId) {
      setRows([]);
      return;
    }
    setLoadingTransactions(true);
    try {
      const res = await fetch(
        `/api/accountant/ledger/company?owner_id=${selectedOwnerId}&sort=${dateCreatedSort}`
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
    if (!selectedOwnerId) {
      setRows([]);
      return;
    }
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOwnerId, dateCreatedSort]);

  useEffect(() => {
    if (selectedOwnerId && companyOwners.length > 0) {
      const selectedOwner = companyOwners.find((o) => String(o.id) === selectedOwnerId);
      if (selectedOwner && companySearchQuery !== selectedOwner.name) {
        setCompanySearchQuery(selectedOwner.name);
      }
    } else if (!selectedOwnerId) {
      setCompanySearchQuery("");
    }
  }, [selectedOwnerId, companyOwners]);

  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (highlightId) {
      setHighlightTransactionId(highlightId);
      setTimeout(() => {
        setHighlightTransactionId(null);
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete("highlight");
        router.replace(`${window.location.pathname}?${newParams.toString()}`, { scroll: false });
      }, 3000);
    }
  }, [searchParams, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        setShowOwnerSelectModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectedOwner = companyOwners.find((o) => String(o.id) === selectedOwnerId);
  const selectedAccountLabel = selectedOwner?.name ?? "Select company";

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
    setPreviewImageUrl(null);
    setPreviewImageError(null);
    setPreviewFileType(null);
    setPreviewImageLoading(false);
  };

  const computed = useMemo(() => {
    const sortedRows = [...rows].sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (aDate === bDate) {
        return (a.transactionId ?? 0) - (b.transactionId ?? 0);
      }
      return aDate - bDate;
    });

    const sortedDisplayRows =
      dateCreatedSort === "newest" ? [...sortedRows].reverse() : sortedRows;

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
    <div className="min-h-full flex flex-col">
      <div className="sticky top-0 z-20 shrink-0 bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-5 flex items-center justify-between border-b border-[#6A0D25]/30">
        <div>
          <h1 className="text-lg font-semibold tracking-wide">Company Ledger</h1>
        </div>
        <button
          onClick={() => setShowTransactionPanel(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-white/20 hover:bg-white/30 text-white font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Transaction
        </button>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <section className="rounded-md bg-white p-5 shadow-sm border border-gray-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#5f0c18]">Company Ledger</h2>
              <p className="text-sm text-gray-600 mt-1">View company transactions with running balance</p>
            </div>
            {selectedOwnerId && <EndingBalance endingBalance={computed.endingBalance} />}
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-6">
            <div className="flex items-center gap-2 flex-1 max-w-2xl">
              <div className="flex items-center gap-2 text-sm font-medium text-[#7a0f1f]">
                <User className="w-4 h-4" />
                <label>Company</label>
              </div>
              <div className="relative flex-1 group min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none z-10 transition-colors group-hover:text-[#7a0f1f]/70" />
                <input
                  type="text"
                  placeholder="Select company account..."
                  value={companySearchQuery}
                  onFocus={() => {
                    if (!searchParams.get("owner_id") && !selectedOwnerId) {
                      setShowOwnerSelectModal(true);
                    }
                  }}
                  readOnly
                  disabled={loadingOwners}
                  className="w-full rounded-md border border-gray-200 bg-white px-10 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:opacity-60 cursor-pointer transition-all hover:border-[#7a0f1f]/40 hover:bg-gray-50/50"
                />
                {selectedOwnerId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOwnerId("");
                      setCompanySearchQuery("");
                      setShowOwnerSelectModal(true);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#7a0f1f] transition-colors p-0.5 rounded hover:bg-[#7a0f1f]/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {selectedOwnerId && (
                <>
                  <div className="flex items-center gap-2 text-sm font-medium text-[#7a0f1f]">
                    <Receipt className="w-4 h-4" />
                    <label>Transactions</label>
                  </div>
                  <div className="relative flex-1 group min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none z-10 transition-colors group-hover:text-[#7a0f1f]/70" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-md border border-gray-200 bg-white px-10 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] transition-all hover:border-[#7a0f1f]/40 hover:bg-gray-50/50"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#7a0f1f] transition-colors p-0.5 rounded hover:bg-[#7a0f1f]/10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {selectedOwnerId && (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
                <RefreshButton onClick={fetchTransactions} />
                <SortSelector
                  value={dateCreatedSort}
                  onChange={(value) => setDateCreatedSort(value)}
                />
                <button
                  onClick={() => setShowAdditionalColumns(!showAdditionalColumns)}
                  className={`px-4 py-2 rounded-md border transition-all flex items-center gap-2 text-sm font-medium ${
                    showAdditionalColumns
                      ? "bg-[#7a0f1f] text-white border-[#7a0f1f] shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:border-[#7a0f1f] hover:text-[#7a0f1f]"
                  }`}
                  title={showAdditionalColumns ? "Hide additional columns" : "Show additional columns"}
                >
                  <Columns2 className="w-4 h-4" />
                  <span>Columns</span>
                </button>
              </div>
            )}
          </div>

          {selectedOwnerId && (
            <div className="text-sm text-neutral-600 my-3">
              Showing {showing.from} to {showing.to} of {showing.total} entries
            </div>
          )}

          {selectedOwnerId && (
            <LedgerColumnHeader
              accountLabel={selectedAccountLabel}
              showAdditionalColumns={showAdditionalColumns}
              openingBalance={openingBalance}
            />
          )}

          {selectedOwnerId && (
            <div className="border border-gray-200 border-t-0 bg-white overflow-hidden rounded-b-md">
              {loadingTransactions ? (
                <LoadingSkeleton />
              ) : computed.computedRows.length === 0 ? (
                <EmptyState
                  message={searchQuery ? "No transactions match your search" : selectedOwnerId ? "No transactions found" : "Select an account to view transactions"}
                  description={searchQuery ? "Try adjusting your search terms" : selectedOwnerId ? "Transactions will appear here once recorded" : "Choose a company account from the dropdown above"}
                />
              ) : (
                <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
                  <table className="w-full border-collapse bg-white" style={{ tableLayout: "fixed" }}>
                    <LedgerTableHeader showAdditionalColumns={showAdditionalColumns} ownerColumnLabel="ACCOUNT SOURCE" />
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
          )}
        </section>
      </div>

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

      <OwnerSelectModal
        open={showOwnerSelectModal}
        onClose={() => setShowOwnerSelectModal(false)}
        owners={companyOwners}
        loading={loadingOwners}
        title="Company"
        placeholder="Search companies..."
        fuzzyMatch={fuzzyMatch}
        onSelect={(owner) => {
          setSelectedOwnerId(String(owner.id));
          setCompanySearchQuery(owner.name);
        }}
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
        prefillToOwnerId={selectedOwnerId ? parseInt(selectedOwnerId, 10) : null}
        onTransactionSuccess={fetchTransactions}
      />
    </div>
  );
}
