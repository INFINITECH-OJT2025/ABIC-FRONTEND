"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, Inbox, Plus, Eye, Banknote } from "lucide-react";
import SuccessModal from "@/components/ui/SuccessModal";
import LoadingModal from "@/components/ui/LoadingModal";
import FailModal from "@/components/ui/FailModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import {
  MaintenancePageLayout,
  MaintenanceSectionCard,
  MaintenanceEmptyState,
  MaintenancePagination,
  MaintenanceRefreshButton,
  MaintenanceFilterCard,
} from "@/components/accountant/maintenance";

type AccountStatus = "ACTIVE" | "INACTIVE" ;
type AccountType = "BANK" | "GCASH" | "CASH" | "INTERNAL";

type Owner = {
  id: number;
  name: string;
  owner_type: string;
  status: string;
};

type Bank = {
  id: number;
  name: string;
  short_name?: string | null;
  status: string;
};

type BankAccount = {
  id: number;
  owner_id: number;
  bank_id?: number | null;
  account_name: string;
  account_number?: string | null;
  account_holder: string;
  account_type: AccountType;
  opening_balance: number;
  opening_date: string;
  currency: string;
  status: AccountStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  owner?: Owner | null;
  bank?: Bank | null;
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Not available";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString();
  } catch {
    return "Invalid date";
  }
};

const formatCurrency = (amount: number | null | undefined, currency: string = "PHP"): string => {
  if (amount === null || amount === undefined) return `₱0.00`;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const EyeIcon = (props: any) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Skeleton Components
const BankAccountTableSkeleton = () => (
  <div>
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 mb-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gray-200 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="h-4 bg-gray-200 rounded w-16" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-14" />
          <div className="w-20" />
        </div>
      </div>
    </div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gray-200 rounded-xl shrink-0" />
              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j}>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-12" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-7 bg-gray-200 rounded-xl w-16" />
              <div className="h-8 bg-gray-200 rounded-xl w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const BankAccountDetailSkeleton = () => (
  <div className="animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
          <div className="h-10 bg-gray-100 rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

export default function BankAccountsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Get initial values from URL params or defaults
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">((searchParams.get("status") as "ALL" | "ACTIVE" | "INACTIVE") || "ALL");
  const [accountTypeFilter, setAccountTypeFilter] = useState<AccountType | "ALL">((searchParams.get("account_type") as AccountType | "ALL") || "ALL");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1", 10));
  const [sortBy, setSortBy] = useState<"date" | "name">((searchParams.get("sort_by") as "date" | "name") || "date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">((searchParams.get("sort_order") as "asc" | "desc") || "desc");
  const [paginationMeta, setPaginationMeta] = useState<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  } | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [createPanelClosing, setCreatePanelClosing] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [successTitle, setSuccessTitle] = useState("");
  const [showCreateLoading, setShowCreateLoading] = useState(false);
  const [showCreateFail, setShowCreateFail] = useState(false);
  const [createFailMessage, setCreateFailMessage] = useState("");
  const [failTitle, setFailTitle] = useState("");
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailDrawerClosing, setDetailDrawerClosing] = useState(false);
  const [detailAccount, setDetailAccount] = useState<BankAccount | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null);
  const [detailFormData, setDetailFormData] = useState<Partial<BankAccount>>({});
  const [savingAccount, setSavingAccount] = useState(false);
  const [showSaveLoading, setShowSaveLoading] = useState(false);
  const [showCreateAccountConfirm, setShowCreateAccountConfirm] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Owners and Banks for dropdowns
  const [owners, setOwners] = useState<Owner[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState("");
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  const [formData, setFormData] = useState({
    owner_id: null as number | null,
    bank_id: null as number | null,
    account_name: "",
    account_number: "",
    account_holder: "",
    account_type: "BANK" as AccountType,
    opening_balance: "",
    opening_date: "",
    currency: "PHP",
    notes: "",
    status: "ACTIVE" as AccountStatus,
  });

  // Sync URL params when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter) params.set("status", statusFilter);
    if (accountTypeFilter && accountTypeFilter !== "ALL") params.set("account_type", accountTypeFilter);
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (sortBy !== "date") params.set("sort_by", sortBy);
    if (sortOrder !== "desc") params.set("sort_order", sortOrder);
    
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, statusFilter, accountTypeFilter, currentPage, sortBy, sortOrder, router]);

  useEffect(() => {
    fetchBankAccounts();
  }, [searchQuery, statusFilter, accountTypeFilter, currentPage, sortBy, sortOrder]);

  useEffect(() => {
    fetchOwners();
    fetchBanks();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, accountTypeFilter, searchQuery, sortBy, sortOrder]);

  const fetchBankAccounts = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/accountant/maintenance/bank-accounts", window.location.origin);
      if (searchQuery.trim()) {
        url.searchParams.append("search", searchQuery.trim());
      }
      if (statusFilter && statusFilter !== "ALL") {
        url.searchParams.append("status", statusFilter);
      }
      if (accountTypeFilter && accountTypeFilter !== "ALL") {
        url.searchParams.append("account_type", accountTypeFilter);
      }
      url.searchParams.append("page", currentPage.toString());
      url.searchParams.append("per_page", "10");
      url.searchParams.append("sort_by", sortBy);
      url.searchParams.append("sort_order", sortOrder);
      
      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok && data.success) {
        const accountsList = data.data?.data || data.data || [];
        setBankAccounts(Array.isArray(accountsList) ? accountsList : []);
        
        // Extract pagination metadata
        if (data.data?.current_page !== undefined) {
          setPaginationMeta({
            current_page: data.data.current_page,
            last_page: data.data.last_page,
            per_page: data.data.per_page,
            total: data.data.total,
            from: data.data.from,
            to: data.data.to,
          });
        } else {
          setPaginationMeta(null);
        }
      } else {
        setBankAccounts([]);
        setPaginationMeta(null);
      }
    } catch {
      setBankAccounts([]);
      setPaginationMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    setLoadingOwners(true);
    try {
      const res = await fetch("/api/accountant/maintenance/owners?per_page=all&status=ACTIVE");
      const data = await res.json();
      if (res.ok && data.success) {
        const ownersList = data.data?.data || data.data || [];
        const list = Array.isArray(ownersList) ? ownersList : [];
        // Include MAIN, COMPANY, CLIENT only (exclude SYSTEM)
        setOwners(list.filter((o: Owner) => {
          const type = (o.owner_type ?? "").toString().toUpperCase();
          return type !== "SYSTEM";
        }));
      } else {
        setOwners([]);
      }
    } catch {
      setOwners([]);
    } finally {
      setLoadingOwners(false);
    }
  };

  const fetchBanks = async () => {
    setLoadingBanks(true);
    try {
      const res = await fetch("/api/accountant/maintenance/banks?per_page=all&status=ACTIVE");
      const data = await res.json();
      if (res.ok && data.success) {
        // When per_page=all, backend returns data.data as array directly
        const banksList = data.data?.data || data.data || [];
        setBanks(Array.isArray(banksList) ? banksList : []);
      } else {
        setBanks([]);
      }
    } catch {
      setBanks([]);
    } finally {
      setLoadingBanks(false);
    }
  };

  const filteredOwners = useMemo(() => {
    const activeOwners = owners.filter((o) => {
      const status = (o.status ?? "ACTIVE").toString().toUpperCase();
      const type = (o.owner_type ?? "").toString().toUpperCase();
      return status === "ACTIVE" && type !== "SYSTEM";
    });
    if (!ownerSearchQuery.trim()) return activeOwners;
    const q = ownerSearchQuery.toLowerCase();
    return activeOwners.filter(
      (owner) =>
        owner.name?.toLowerCase().includes(q) ||
        owner.owner_type?.toLowerCase().includes(q)
    );
  }, [owners, ownerSearchQuery]);

  const filteredBanks = useMemo(() => {
    if (!bankSearchQuery.trim()) {
      return banks.filter(b => b.status === "ACTIVE");
    }
    const q = bankSearchQuery.toLowerCase();
    return banks.filter(
      (bank) =>
        bank.status === "ACTIVE" &&
        (bank.name?.toLowerCase().includes(q) ||
          bank.short_name?.toLowerCase().includes(q))
    );
  }, [banks, bankSearchQuery]);


  const openDetailDrawer = async (accountId: number) => {
    setDetailDrawerOpen(true);
    setLoadingDetail(true);
    setDetailLoadError(null);
    try {
      const res = await fetch(`/api/accountant/maintenance/bank-accounts/${accountId}`);
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setDetailAccount(data.data);
        setDetailFormData(data.data);
        // Set search queries for dropdowns
        if (data.data.owner) {
          setOwnerSearchQuery(data.data.owner.name);
        }
        if (data.data.bank) {
          setBankSearchQuery(data.data.bank.name);
        }
      } else {
        setDetailLoadError(data.message || "Failed to load bank account details");
      }
    } catch (error) {
      setDetailLoadError("An error occurred while loading bank account details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetailDrawer = () => {
    setDetailDrawerClosing(true);
    setTimeout(() => {
      setDetailDrawerOpen(false);
      setDetailDrawerClosing(false);
      setDetailAccount(null);
      setDetailFormData({});
      setDetailLoadError(null);
      setOwnerSearchQuery("");
      setBankSearchQuery("");
      setShowOwnerDropdown(false);
      setShowBankDropdown(false);
    }, 350);
  };

  const closeCreatePanel = () => {
    setCreatePanelClosing(true);
    setTimeout(() => {
      setShowCreatePanel(false);
      setCreatePanelClosing(false);
      setFormData({
        owner_id: null,
        bank_id: null,
        account_name: "",
        account_number: "",
        account_holder: "",
        account_type: "BANK",
        opening_balance: "",
        opening_date: "",
        currency: "PHP",
        notes: "",
        status: "ACTIVE",
      });
      setOwnerSearchQuery("");
      setBankSearchQuery("");
      setShowOwnerDropdown(false);
      setShowBankDropdown(false);
    }, 350);
  };

  const handleCreateAccountConfirm = () => {
    setShowCreateAccountConfirm(false);
    handleCreateAccount();
  };

  const handleCreateAccount = async () => {
    if (!formData.owner_id) {
      setFailTitle("Failed to Create Bank Account");
      setCreateFailMessage("Owner is required");
      setShowCreateFail(true);
      return;
    }

    if (formData.account_type === "BANK" && !formData.bank_id) {
      setFailTitle("Failed to Create Bank Account");
      setCreateFailMessage("Bank is required for BANK account type");
      setShowCreateFail(true);
      return;
    }

    if (!formData.account_name.trim() || !formData.account_holder.trim() || !formData.opening_date.trim()) {
      setFailTitle("Failed to Create Bank Account");
      setCreateFailMessage("Please fill in all required fields");
      setShowCreateFail(true);
      return;
    }

    if (formData.account_type === "BANK" && !formData.account_number.trim()) {
      setFailTitle("Failed to Create Bank Account");
      setCreateFailMessage("Account number is required for BANK account type");
      setShowCreateFail(true);
      return;
    }

    setShowCreateLoading(true);
    try {
      const body: any = {
        owner_id: formData.owner_id,
        account_name: formData.account_name.trim(),
        account_holder: formData.account_holder.trim(),
        account_type: formData.account_type,
        opening_balance: parseFloat(formData.opening_balance) || 0,
        opening_date: formData.opening_date,
        currency: formData.currency,
        status: formData.status,
      };

      if (formData.account_type === "BANK") {
        body.bank_id = formData.bank_id;
        body.account_number = formData.account_number.trim();
      } else {
        body.account_number = formData.account_number.trim() || null;
      }

      if (formData.notes.trim()) {
        body.notes = formData.notes.trim();
      }

      const res = await fetch("/api/accountant/maintenance/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchBankAccounts();
        closeCreatePanel();
        setSuccessTitle("Bank Account Created Successfully");
        setSuccessMessage("The bank account has been created successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle("Failed to Create Bank Account");
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join(", ") 
          : data.message || "Failed to create bank account";
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch (error) {
      console.error("Error creating bank account:", error);
      setFailTitle("Failed to Create Bank Account");
      setCreateFailMessage("An error occurred while creating the bank account");
      setShowCreateFail(true);
    } finally {
      setShowCreateLoading(false);
    }
  };

  const handleSaveAccount = async (formData: Partial<BankAccount>) => {
    if (!detailAccount?.id) return;
    
    if (!formData.owner_id) {
      setFailTitle("Failed to Update Bank Account");
      setCreateFailMessage("Owner is required");
      setShowCreateFail(true);
      return;
    }

    if (formData.account_type === "BANK" && !formData.bank_id) {
      setFailTitle("Failed to Update Bank Account");
      setCreateFailMessage("Bank is required for BANK account type");
      setShowCreateFail(true);
      return;
    }

    if (!formData.account_name?.trim() || !formData.account_holder?.trim() || !formData.opening_date) {
      setFailTitle("Failed to Update Bank Account");
      setCreateFailMessage("Please fill in all required fields");
      setShowCreateFail(true);
      return;
    }

    if (formData.account_type === "BANK" && !formData.account_number?.trim()) {
      setFailTitle("Failed to Update Bank Account");
      setCreateFailMessage("Account number is required for BANK account type");
      setShowCreateFail(true);
      return;
    }
    
    setSavingAccount(true);
    setShowSaveLoading(true);
    try {
      const body: any = {
        owner_id: formData.owner_id,
        account_name: formData.account_name.trim(),
        account_holder: formData.account_holder.trim(),
        account_type: formData.account_type,
        opening_balance: formData.opening_balance || 0,
        opening_date: formData.opening_date,
        currency: formData.currency || "PHP",
        status: formData.status,
      };

      if (formData.account_type === "BANK") {
        body.bank_id = formData.bank_id;
        body.account_number = formData.account_number?.trim();
      } else {
        body.bank_id = null;
        body.account_number = formData.account_number?.trim() || null;
      }

      if (formData.notes?.trim()) {
        body.notes = formData.notes.trim();
      }

      const res = await fetch(`/api/accountant/maintenance/bank-accounts/${detailAccount.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDetailAccount((prev) => (prev ? { ...prev, ...data.data } : null));
        setDetailFormData((prev) => (prev ? { ...prev, ...data.data } : {}));
        await fetchBankAccounts();
        setSuccessTitle("Bank Account Updated Successfully");
        setSuccessMessage("The bank account has been updated successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle("Failed to Update Bank Account");
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join(", ") 
          : data.message || "Failed to update bank account";
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch {
      setFailTitle("Failed to Update Bank Account");
      setCreateFailMessage("An error occurred while updating the bank account");
      setShowCreateFail(true);
    } finally {
      setSavingAccount(false);
      setShowSaveLoading(false);
    }
  };

  // Update owner search query when owner_id changes
  useEffect(() => {
    if (formData.owner_id && owners.length > 0) {
      const selectedOwner = owners.find(o => o.id === formData.owner_id);
      if (selectedOwner && ownerSearchQuery !== selectedOwner.name) {
        setOwnerSearchQuery(selectedOwner.name);
      }
    } else if (!formData.owner_id && ownerSearchQuery && showCreatePanel) {
      setOwnerSearchQuery("");
    }
  }, [formData.owner_id, owners]);

  // Update bank search query when bank_id changes
  useEffect(() => {
    if (formData.bank_id && banks.length > 0) {
      const selectedBank = banks.find(b => b.id === formData.bank_id);
      if (selectedBank && bankSearchQuery !== selectedBank.name) {
        setBankSearchQuery(selectedBank.name);
      }
    } else if (!formData.bank_id && bankSearchQuery && showCreatePanel) {
      setBankSearchQuery("");
    }
  }, [formData.bank_id, banks]);

  // Update owner search query in detail drawer
  useEffect(() => {
    if (detailFormData.owner_id && owners.length > 0 && detailDrawerOpen) {
      const selectedOwner = owners.find(o => o.id === detailFormData.owner_id);
      if (selectedOwner && ownerSearchQuery !== selectedOwner.name) {
        setOwnerSearchQuery(selectedOwner.name);
      }
    }
  }, [detailFormData.owner_id, owners, detailDrawerOpen]);

  // Update bank search query in detail drawer
  useEffect(() => {
    if (detailFormData.bank_id && banks.length > 0 && detailDrawerOpen) {
      const selectedBank = banks.find(b => b.id === detailFormData.bank_id);
      if (selectedBank && bankSearchQuery !== selectedBank.name) {
        setBankSearchQuery(selectedBank.name);
      }
    } else if (!detailFormData.bank_id && bankSearchQuery && detailDrawerOpen) {
      setBankSearchQuery("");
    }
  }, [detailFormData.bank_id, banks, detailDrawerOpen]);

  const hasFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "ALL" ||
    accountTypeFilter !== "ALL" ||
    sortBy !== "date" ||
    sortOrder !== "desc";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setAccountTypeFilter("ALL");
    setSortBy("date");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 px-4 py-2.5 h-10 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all";

  return (
    <MaintenancePageLayout
      header={{
        icon: Banknote,
        title: "Bank Accounts",
        subtitle: "Manage bank accounts and their opening balances",
        primaryAction: (
          <button
            onClick={() => setShowCreatePanel(true)}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold bg-white text-[#7B0F2B] hover:bg-white/95 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Create Bank Account
          </button>
        ),
      }}
    >
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="sticky top-0 z-20 bg-gray-50 shrink-0 pb-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="px-4 sm:px-6 lg:px-8 mt-6">
            <MaintenanceFilterCard
              title="Filters"
              description="Search and filter bank accounts"
              hasFilters={hasFilters}
              onReset={handleResetFilters}
              filtersOpen={filtersOpen}
              onToggleFilters={() => setFiltersOpen(!filtersOpen)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className={inputClass}
                  >
                    <option value="ALL">All</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Account Type</label>
                  <select
                    value={accountTypeFilter}
                    onChange={(e) => setAccountTypeFilter(e.target.value as typeof accountTypeFilter)}
                    className={inputClass}
                  >
                    <option value="ALL">All</option>
                    <option value="BANK">Bank</option>
                    <option value="GCASH">GCash</option>
                    <option value="CASH">Cash</option>
                    <option value="INTERNAL">Internal</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Account name, number, holder..."
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-10 py-2.5 h-10 text-sm focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] outline-none transition-all"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#7B0F2B]">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Sort</label>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] = e.target.value.split("-") as [typeof sortBy, typeof sortOrder];
                      setSortBy(newSortBy);
                      setSortOrder(newSortOrder);
                    }}
                    className={inputClass}
                  >
                    <option value="date-desc">Date (Newest First)</option>
                    <option value="date-asc">Date (Oldest First)</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <MaintenanceRefreshButton onClick={fetchBankAccounts} title="Refresh list" />
                </div>
              </div>
            </MaintenanceFilterCard>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 mt-6 pb-6">
          <MaintenanceSectionCard>
            <div className="p-6">


            {paginationMeta && (
              <div className="mt-6">
                <MaintenancePagination
                  paginationMeta={paginationMeta}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  itemName="accounts"
                />
              </div>
            )}

            <div className="mt-6">
            {loading ? (
              <BankAccountTableSkeleton />
            ) : bankAccounts.length === 0 ? (
              <MaintenanceEmptyState
                icon={Inbox}
                title="No data"
                description="Create a bank account or adjust your search."
                action={
                  <button
                    onClick={() => setShowCreatePanel(true)}
                    className="px-5 py-2.5 bg-[#7B0F2B] text-white rounded-xl font-semibold hover:bg-[#8B1535] transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Bank Account
                  </button>
                }
              />
            ) : (
              <div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-0 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 shrink-0"></div>
                      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-2 text-sm font-bold text-neutral-900">
                        <div>Account Name</div>
                        <div>Owner</div>
                        <div>Bank</div>
                        <div>Account Number</div>
                        <div>Type</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-sm font-bold text-neutral-900 w-24">Balance</div>
                      <div className="text-sm font-bold text-neutral-900 w-20">Status</div>
                      <div className="w-20"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {bankAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-[#7B0F2B]/10 flex items-center justify-center shrink-0">
                            <Banknote className="w-6 h-6 text-[#7B0F2B]" />
                          </div>
                          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold text-neutral-900 truncate">{account.account_name}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Account Name</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-neutral-900 truncate">{account.owner?.name || "—"}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Owner</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-neutral-900 truncate">{account.bank?.name || "—"}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Bank</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-neutral-900 truncate">{account.account_number || "—"}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Account Number</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-neutral-900 truncate">{account.account_type}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">Type</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-sm text-neutral-900 font-semibold w-24 text-right">{formatCurrency(account.opening_balance, account.currency)}</div>
                          <div
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                              account.status === "ACTIVE" ? "bg-green-100 text-green-700" : 
                              account.status === "INACTIVE" ? "bg-red-100 text-red-700" : 
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {account.status}
                          </div>
                          <button
                            onClick={() => openDetailDrawer(account.id)}
className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold bg-[#7B0F2B] text-white hover:bg-[#8B1535] transition-colors"
                            title="View"
                          >
                            <EyeIcon />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>
        </MaintenanceSectionCard>

        {/* Create Panel - Full Height Side Panel */}
        {(showCreatePanel || createPanelClosing) && (
          <>
            <div
              className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
                createPanelClosing ? "opacity-0" : "opacity-100"
              }`}
              onClick={closeCreatePanel}
              aria-hidden="true"
            />
            <div
              className="fixed top-0 right-0 bottom-0 w-full max-w-md h-screen bg-white z-50 flex flex-col rounded-l-2xl overflow-hidden shadow-xl"
              style={{
                animation: createPanelClosing
                  ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                  : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
              }}
            >
              <div className="flex-shrink-0 flex items-center justify-between p-5 bg-gradient-to-br from-[#7B0F2B] via-[#8B1535] to-[#5E0C20] text-white">
                <h2 className="text-lg font-bold">Create Bank Account</h2>
                <button onClick={closeCreatePanel} className="p-2 rounded-xl hover:bg-white/20 transition-colors" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Owner <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                        <input
                          type="text"
                          value={ownerSearchQuery}
                          onChange={(e) => {
                            setOwnerSearchQuery(e.target.value);
                            setShowOwnerDropdown(true);
                          }}
                          onFocus={() => setShowOwnerDropdown(true)}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pl-10 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                          placeholder="Search owners..."
                        />
                        {formData.owner_id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({ ...formData, owner_id: null });
                              setOwnerSearchQuery("");
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {showOwnerDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowOwnerDropdown(false)}
                          />
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                            {loadingOwners ? (
                              <div className="p-4 text-center text-sm text-gray-500">Loading owners...</div>
                            ) : filteredOwners.length === 0 ? (
                              <div className="p-4 text-center text-sm text-gray-500">No owners found</div>
                            ) : (
                              filteredOwners.map((owner) => (
                                <button
                                  key={owner.id}
                                  onClick={() => {
                                    setFormData({ ...formData, owner_id: owner.id });
                                    setOwnerSearchQuery(owner.name);
                                    setShowOwnerDropdown(false);
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                                    formData.owner_id === owner.id ? "bg-gray-50" : ""
                                  }`}
                                >
                                  <div className="font-medium">{owner.name}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">{owner.owner_type}</div>
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Account Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.account_type}
                      onChange={(e) => {
                        const newType = e.target.value as AccountType;
                        setFormData({ 
                          ...formData, 
                          account_type: newType,
                          bank_id: newType !== "BANK" ? null : formData.bank_id,
                          account_number: newType !== "BANK" ? "" : formData.account_number,
                        });
                      }}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                    >
                      <option value="BANK">Bank</option>
                      <option value="GCASH">GCash</option>
                      <option value="CASH">Cash</option>
                      <option value="INTERNAL">Internal</option>
                    </select>
                  </div>

                  {formData.account_type === "BANK" && (
                    <div className="relative">
                      <label className="block text-sm font-medium text-neutral-900 mb-2">
                        Bank <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                          <input
                            type="text"
                            value={bankSearchQuery}
                            onChange={(e) => {
                              setBankSearchQuery(e.target.value);
                              setShowBankDropdown(true);
                            }}
                            onFocus={() => setShowBankDropdown(true)}
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pl-10 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                            placeholder="Search banks..."
                          />
                          {formData.bank_id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData({ ...formData, bank_id: null });
                                setBankSearchQuery("");
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {showBankDropdown && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowBankDropdown(false)}
                            />
                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                              {loadingBanks ? (
                                <div className="p-4 text-center text-sm text-gray-500">Loading banks...</div>
                              ) : filteredBanks.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">No banks found</div>
                              ) : (
                                filteredBanks.map((bank) => (
                                  <button
                                    key={bank.id}
                                    onClick={() => {
                                      setFormData({ ...formData, bank_id: bank.id });
                                      setBankSearchQuery(bank.name);
                                      setShowBankDropdown(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                                      formData.bank_id === bank.id ? "bg-gray-50" : ""
                                    }`}
                                  >
                                    <div className="font-medium">{bank.name}</div>
                                    {bank.short_name && <div className="text-xs text-gray-500 mt-0.5">{bank.short_name}</div>}
                                  </button>
                                ))
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Account Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.account_name}
                      onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                      placeholder="e.g., SCB 483 Account"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Account Number {formData.account_type === "BANK" && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                      placeholder={formData.account_type === "BANK" ? "e.g., 1234567890" : "Optional"}
                      required={formData.account_type === "BANK"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Account Holder <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.account_holder}
                      onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                      placeholder="e.g., ABIC Realty & Consultancy Corp"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Opening Balance <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.opening_balance}
                      onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Opening Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.opening_date}
                      onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                    >
                      <option value="PHP">PHP - Philippine Peso</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                      placeholder="Optional description or notes"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AccountStatus })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center justify-end gap-3 p-5 border-t border-gray-100">
                <button
                  onClick={closeCreatePanel}
                  className="px-6 py-2.5 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateAccountConfirm(true)}
                  disabled={showCreateLoading || !formData.owner_id || (formData.account_type === "BANK" && !formData.bank_id)}
                  className="px-6 py-2.5 rounded-xl font-semibold bg-[#7B0F2B] text-white hover:bg-[#8B1535] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {showCreateLoading ? "Creating..." : "Create Bank Account"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Detail Drawer */}
        {(detailDrawerOpen || detailDrawerClosing) && (
          <>
            <div
              className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
                detailDrawerClosing ? "opacity-0" : "opacity-100"
              }`}
              onClick={closeDetailDrawer}
              aria-hidden="true"
            />
            <div
              className="fixed top-0 right-0 bottom-0 w-full max-w-4xl h-screen bg-white z-50 flex flex-col rounded-l-2xl overflow-hidden shadow-xl"
              style={{
                animation: detailDrawerClosing
                  ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                  : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
              }}
            >
              <div className="flex-shrink-0 flex items-center justify-between p-5 bg-gradient-to-br from-[#7B0F2B] via-[#8B1535] to-[#5E0C20] text-white">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{detailAccount ? detailAccount.account_name : loadingDetail ? "Loading..." : "Bank Account Details"}</h2>
                    {detailAccount?.owner && <p className="text-sm text-white/90 mt-0.5">{detailAccount.owner.name}</p>}
                  </div>
                  {detailAccount && (
                    <div
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                        detailAccount.status === "ACTIVE" ? "bg-green-100 text-green-700" : 
                        detailAccount.status === "INACTIVE" ? "bg-red-100 text-red-700" : 
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {detailAccount.status}
                    </div>
                  )}
                </div>
                <button onClick={closeDetailDrawer} className="p-2 rounded-xl hover:bg-white/20 transition-colors" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {loadingDetail ? (
                  <div className="flex-1 overflow-y-auto p-6">
                    <BankAccountDetailSkeleton />
                  </div>
                ) : !detailAccount ? (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <p className="text-slate-500 text-sm">Unable to load bank account details.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="relative">
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Owner <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                              <input
                                type="text"
                                value={ownerSearchQuery}
                                onChange={(e) => {
                                  setOwnerSearchQuery(e.target.value);
                                  setShowOwnerDropdown(true);
                                }}
                                onFocus={() => setShowOwnerDropdown(true)}
                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pl-10 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                                placeholder="Search owners..."
                              />
                              {detailFormData.owner_id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailFormData({ ...detailFormData, owner_id: undefined });
                                    setOwnerSearchQuery("");
                                  }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {showOwnerDropdown && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setShowOwnerDropdown(false)}
                                />
                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                                  {loadingOwners ? (
                                    <div className="p-4 text-center text-sm text-gray-500">Loading owners...</div>
                                  ) : filteredOwners.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500">No owners found</div>
                                  ) : (
                                    filteredOwners.map((owner) => (
                                      <button
                                        key={owner.id}
                                        onClick={() => {
                                          setDetailFormData({ ...detailFormData, owner_id: owner.id });
                                          setOwnerSearchQuery(owner.name);
                                          setShowOwnerDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                                          detailFormData.owner_id === owner.id ? "bg-gray-50" : ""
                                        }`}
                                      >
                                        <div className="font-medium">{owner.name}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{owner.owner_type}</div>
                                      </button>
                                    ))
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Account Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={detailFormData.account_type || "BANK"}
                          onChange={(e) => {
                            const newType = e.target.value as AccountType;
                            setDetailFormData({ 
                              ...detailFormData, 
                              account_type: newType,
                              bank_id: newType !== "BANK" ? null : detailFormData.bank_id,
                              account_number: newType !== "BANK" ? null : detailFormData.account_number,
                            });
                          }}
className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                        >
                          <option value="BANK">Bank</option>
                          <option value="GCASH">GCash</option>
                          <option value="CASH">Cash</option>
                          <option value="INTERNAL">Internal</option>
                        </select>
                      </div>

                      {detailFormData.account_type === "BANK" && (
                        <div className="relative">
                          <label className="block text-sm font-medium text-neutral-900 mb-2">
                            Bank <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                              <input
                                type="text"
                                value={bankSearchQuery}
                                onChange={(e) => {
                                  setBankSearchQuery(e.target.value);
                                  setShowBankDropdown(true);
                                }}
                                onFocus={() => setShowBankDropdown(true)}
                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pl-10 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                                placeholder="Search banks..."
                              />
                              {detailFormData.bank_id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailFormData({ ...detailFormData, bank_id: null });
                                    setBankSearchQuery("");
                                  }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {showBankDropdown && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setShowBankDropdown(false)}
                                />
                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                                  {loadingBanks ? (
                                    <div className="p-4 text-center text-sm text-gray-500">Loading banks...</div>
                                  ) : filteredBanks.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500">No banks found</div>
                                  ) : (
                                    filteredBanks.map((bank) => (
                                      <button
                                        key={bank.id}
                                        onClick={() => {
                                          setDetailFormData({ ...detailFormData, bank_id: bank.id });
                                          setBankSearchQuery(bank.name);
                                          setShowBankDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                                          detailFormData.bank_id === bank.id ? "bg-gray-50" : ""
                                        }`}
                                      >
                                        <div className="font-medium">{bank.name}</div>
                                        {bank.short_name && <div className="text-xs text-gray-500 mt-0.5">{bank.short_name}</div>}
                                      </button>
                                    ))
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Account Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={detailFormData.account_name || ""}
                          onChange={(e) => setDetailFormData({ ...detailFormData, account_name: e.target.value })}
className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Account Number {detailFormData.account_type === "BANK" && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          value={detailFormData.account_number || ""}
                          onChange={(e) => setDetailFormData({ ...detailFormData, account_number: e.target.value })}
className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                          placeholder={detailFormData.account_type === "BANK" ? "Required" : "Optional"}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Account Holder <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={detailFormData.account_holder || ""}
                          onChange={(e) => setDetailFormData({ ...detailFormData, account_holder: e.target.value })}
className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Opening Balance <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={detailFormData.opening_balance || ""}
                          onChange={(e) => setDetailFormData({ ...detailFormData, opening_balance: parseFloat(e.target.value) || 0 })}
className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Opening Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={detailFormData.opening_date ? new Date(detailFormData.opening_date).toISOString().split("T")[0] : ""}
                          onChange={(e) => setDetailFormData({ ...detailFormData, opening_date: e.target.value })}
className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Currency <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={detailFormData.currency || "PHP"}
                          onChange={(e) => setDetailFormData({ ...detailFormData, currency: e.target.value })}
className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                        >
                          <option value="PHP">PHP - Philippine Peso</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="JPY">JPY - Japanese Yen</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={detailFormData.status || "ACTIVE"}
                          onChange={(e) => setDetailFormData({ ...detailFormData, status: e.target.value as AccountStatus })}
className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-900 mb-2">Notes</label>
                        <textarea
                          value={detailFormData.notes || ""}
                          onChange={(e) => setDetailFormData({ ...detailFormData, notes: e.target.value })}
className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {detailAccount && (
                <div className="flex-shrink-0 flex items-center justify-end gap-3 p-5 border-t border-gray-100">
                  <button
                    onClick={() => handleSaveAccount(detailFormData)}
                    disabled={savingAccount || !detailFormData.owner_id || (detailFormData.account_type === "BANK" && !detailFormData.bank_id)}
                    className="px-6 py-2.5 rounded-xl font-semibold bg-[#7B0F2B] text-white hover:bg-[#8B1535] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingAccount ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showCreateSuccess && (
        <SuccessModal
          isOpen={showCreateSuccess}
          onClose={() => {
            setShowCreateSuccess(false);
            setSuccessMessage("");
            setSuccessTitle("");
          }}
          title={successTitle || "Success"}
          message={successMessage || "Operation completed successfully."}
          buttonText="OK"
        />
      )}

      {showCreateLoading && (
        <LoadingModal 
          isOpen={showCreateLoading} 
          title="Creating Bank Account" 
          message="Please wait while we create the bank account..." 
        />
      )}

      {showSaveLoading && (
        <LoadingModal 
          isOpen={showSaveLoading} 
          title="Updating Bank Account" 
          message="Please wait while we update the bank account..." 
        />
      )}

      {showCreateFail && (
        <FailModal
          isOpen={showCreateFail}
          onClose={() => {
            setShowCreateFail(false);
            setCreateFailMessage("");
            setFailTitle("");
          }}
          title={failTitle || "Operation Failed"}
          message={createFailMessage || "An error occurred. Please try again."}
          buttonText="OK"
        />
      )}

      {detailLoadError && (
        <FailModal
          isOpen={!!detailLoadError}
          onClose={() => {
            setDetailLoadError(null);
            closeDetailDrawer();
          }}
          title="Failed to Load Bank Account"
          message={detailLoadError}
          buttonText="Close"
        />
      )}

      <ConfirmationModal
        isOpen={showCreateAccountConfirm}
        onClose={() => setShowCreateAccountConfirm(false)}
        onConfirm={handleCreateAccountConfirm}
        title="Create Bank Account"
        message={`Are you sure you want to create the bank account "${formData.account_name.trim()}"?`}
        confirmText="Create"
        isLoading={showCreateLoading}
      />

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(100%);
          }
        }
      `}</style>
      </div>
    </MaintenancePageLayout>
  );
}
