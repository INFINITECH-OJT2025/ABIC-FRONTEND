"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Search, X, Inbox, Plus, Eye, Banknote, User, Filter } from "lucide-react";
import SuccessModal from "@/components/ui/SuccessModal";
import LoadingModal from "@/components/ui/LoadingModal";
import FailModal from "@/components/ui/FailModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type BankStatus = "ACTIVE" | "INACTIVE";

type Bank = {
  id: number;
  name: string;
  short_name?: string | null;
  country?: string | null;
  status: BankStatus;
  created_at?: string;
  updated_at?: string;
};

type BankContactChannel = {
  id?: number;
  contact_id?: number;
  channel_type: "PHONE" | "MOBILE" | "EMAIL" | "VIBER";
  value: string;
  label?: string | null;
  country_code?: string | null;
};

type BankContact = {
  id: number;
  bank_id: number;
  branch_name: string;
  contact_person?: string | null;
  position?: string | null;
  notes?: string | null;
  channels?: BankContactChannel[];
  created_at?: string;
  updated_at?: string;
};


// Country list with common countries
const COUNTRIES = [
  { code: "PH", name: "Philippines" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "SG", name: "Singapore" },
  { code: "MY", name: "Malaysia" },
  { code: "TH", name: "Thailand" },
  { code: "ID", name: "Indonesia" },
  { code: "VN", name: "Vietnam" },
  { code: "HK", name: "Hong Kong" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "IN", name: "India" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "CH", name: "Switzerland" },
  { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" },
];

// Country phone codes
const COUNTRY_PHONE_CODES = [
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
  { code: "+1", country: "United States/Canada", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" },
  { code: "+852", country: "Hong Kong", flag: "🇭🇰" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
];

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

// Format phone number
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters except +
  const cleaned = value.replace(/[^\d+]/g, "");
  return cleaned;
};

// Validate email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const EyeIcon = (props: any) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Reusable Pagination Component
const Pagination = ({
  paginationMeta,
  currentPage,
  setCurrentPage,
  itemName = "items",
}: {
  paginationMeta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  } | null;
  currentPage: number;
  setCurrentPage: (page: number | ((p: number) => number)) => void;
  itemName?: string;
}) => {
  if (!paginationMeta || paginationMeta.total === 0) return null;

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100">
      <div className="text-sm text-gray-600">
        Showing {paginationMeta.from} to {paginationMeta.to} of {paginationMeta.total} {itemName}
      </div>
      {paginationMeta.last_page > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={paginationMeta.current_page === 1}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7B0F2B]/5 hover:border-[#7B0F2B]/30 transition-all"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {[...Array(paginationMeta.last_page)].map((_, i) => {
              const page = i + 1;
              if (page === 1 || page === paginationMeta.last_page || (page >= paginationMeta.current_page - 1 && page <= paginationMeta.current_page + 1)) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                      paginationMeta.current_page === page ? "bg-[#7B0F2B] text-white" : "border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === paginationMeta.current_page - 2 || page === paginationMeta.current_page + 2) {
                return <span key={page} className="px-2 text-gray-500">...</span>;
              }
              return null;
            })}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(paginationMeta.last_page, p + 1))}
            disabled={paginationMeta.current_page === paginationMeta.last_page}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7B0F2B]/5 hover:border-[#7B0F2B]/30 transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
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
  const [detailBank, setDetailBank] = useState<Bank | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null);
  const [detailFormData, setDetailFormData] = useState<Partial<Bank>>({});
  const [savingBank, setSavingBank] = useState(false);
  const [showSaveLoading, setShowSaveLoading] = useState(false);
  const [showCreateBankConfirm, setShowCreateBankConfirm] = useState(false);
  const [showCreateContactConfirm, setShowCreateContactConfirm] = useState(false);

  // Bank Contacts state
  const [bankContacts, setBankContacts] = useState<BankContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<BankContact | null>(null);
  const [contactFormData, setContactFormData] = useState({
    branch_name: "",
    contact_person: "",
    position: "",
    notes: "",
    channels: [] as BankContactChannel[],
  });
  const [savingContact, setSavingContact] = useState(false);
  const [showContactLoading, setShowContactLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    short_name: "",
    country: "",
    status: "ACTIVE" as BankStatus,
  });
  const [nameError, setNameError] = useState<string | null>(null);
  const [checkingName, setCheckingName] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, [searchQuery, statusFilter, currentPage, sortBy, sortOrder]);

  // Debounce bank name checking
  useEffect(() => {
    if (!formData.name.trim()) {
      setNameError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkBankNameExists(formData.name);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.name]);

  // Debounce bank name checking for detail form
  useEffect(() => {
    if (!detailBank?.id || !detailFormData.name?.trim()) {
      return;
    }

    const timeoutId = setTimeout(() => {
      checkBankNameExists(detailFormData.name || "", detailBank?.id);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [detailFormData.name, detailBank?.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, sortBy, sortOrder]);

  const paginatedBanks = banks;

  const summaryStats = useMemo(() => {
    const total = paginationMeta?.total || banks.length;
    const active = banks.filter((b) => b.status === "ACTIVE").length;
    const inactive = banks.filter((b) => b.status === "INACTIVE").length;
    return { total, active, inactive };
  }, [banks, paginationMeta]);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/accountant/maintenance/banks", window.location.origin);
      if (searchQuery.trim()) {
        url.searchParams.append("search", searchQuery.trim());
      }
      if (statusFilter && statusFilter !== "ALL") {
        url.searchParams.append("status", statusFilter);
      }
      const itemsPerPage = 30;
      url.searchParams.append("page", currentPage.toString());
      url.searchParams.append("per_page", itemsPerPage.toString());
      url.searchParams.append("sort_by", sortBy);
      url.searchParams.append("sort_order", sortOrder);
      
      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok && data.success) {
        const banksList = data.data?.data || data.data || [];
        setBanks(Array.isArray(banksList) ? banksList : []);
        
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
        setBanks([]);
        setPaginationMeta(null);
      }
    } catch {
      setBanks([]);
      setPaginationMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const openDetailDrawer = async (bankId: number) => {
    setDetailDrawerOpen(true);
    setLoadingDetail(true);
    setDetailLoadError(null);
    try {
      const res = await fetch(`/api/accountant/maintenance/banks/${bankId}`);
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setDetailBank(data.data);
        setDetailFormData(data.data);
        await fetchBankContacts(bankId);
      } else {
        setDetailLoadError(data.message || "Failed to load bank details");
      }
    } catch (error) {
      setDetailLoadError("An error occurred while loading bank details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchBankContacts = async (bankId: number) => {
    setLoadingContacts(true);
    try {
      const res = await fetch(`/api/accountant/maintenance/bank-contacts?bank_id=${bankId}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setBankContacts(data.data);
      } else {
        setBankContacts([]);
      }
    } catch {
      setBankContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const closeDetailDrawer = () => {
    setDetailDrawerClosing(true);
    setTimeout(() => {
      setDetailDrawerOpen(false);
      setDetailDrawerClosing(false);
      setDetailBank(null);
      setDetailLoadError(null);
      setDetailFormData({});
      setNameError(null);
      setBankContacts([]);
      setShowContactForm(false);
      setEditingContact(null);
      setContactFormData({
        branch_name: "",
        contact_person: "",
        position: "",
        notes: "",
        channels: [],
      });
    }, 350);
  };

  const checkBankNameExists = async (name: string, excludeId?: number) => {
    if (!name.trim()) {
      setNameError(null);
      setCheckingName(false);
      return;
    }

    setCheckingName(true);
    try {
      const url = `/api/accountant/maintenance/banks/check-name?name=${encodeURIComponent(name.trim())}${excludeId ? `&exclude_id=${excludeId}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.exists) {
        setNameError("A bank with this name already exists.");
      } else {
        setNameError(null);
      }
    } catch (error) {
      console.error("Error checking bank name:", error);
      setNameError(null);
    } finally {
      setCheckingName(false);
    }
  };

  const closeCreatePanel = () => {
    setCreatePanelClosing(true);
    setTimeout(() => {
      setShowCreatePanel(false);
      setCreatePanelClosing(false);
      setFormData({
        name: "",
        short_name: "",
        country: "",
        status: "ACTIVE",
      });
      setNameError(null);
      setCheckingName(false);
    }, 350);
  };

  const handleCreateBankConfirm = () => {
    setShowCreateBankConfirm(false);
    handleCreateBank();
  };

  const handleCreateBank = async () => {
    if (!formData.name.trim()) {
      setFailTitle("Failed to Create Bank");
      setCreateFailMessage("Bank name is required");
      setShowCreateFail(true);
      return;
    }

    if (nameError) {
      setFailTitle("Failed to Create Bank");
      setCreateFailMessage(nameError);
      setShowCreateFail(true);
      return;
    }

    setShowCreateLoading(true);
    try {
      const res = await fetch("/api/accountant/maintenance/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          short_name: formData.short_name.trim() || null,
          country: formData.country.trim() || null,
          status: formData.status,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchBanks();
        closeCreatePanel();
        setSuccessTitle("Bank Created Successfully");
        setSuccessMessage("The bank has been created successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle("Failed to Create Bank");
        const errorMsg = data.errors?.name?.[0] || data.message || "Failed to create bank";
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch (error) {
      console.error("Error creating bank:", error);
      setFailTitle("Failed to Create Bank");
      setCreateFailMessage("An error occurred while creating the bank");
      setShowCreateFail(true);
    } finally {
      setShowCreateLoading(false);
    }
  };

  const handleSaveBank = async (formData: Partial<Bank>) => {
    if (!detailBank?.id) return;
    
    if (nameError) {
      setCreateFailMessage(nameError);
      setShowCreateFail(true);
      return;
    }
    
    setSavingBank(true);
    setShowSaveLoading(true);
    try {
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (key === "id") return acc;
        acc[key] = value === "" ? null : value;
        return acc;
      }, {} as Record<string, any>);

      const res = await fetch(`/api/accountant/maintenance/banks/${detailBank.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDetailBank((prev) => (prev ? { ...prev, ...data.data } : null));
        setDetailFormData((prev) => (prev ? { ...prev, ...data.data } : {}));
        setNameError(null);
        await fetchBanks();
        setSuccessTitle("Bank Updated Successfully");
        setSuccessMessage("The bank has been updated successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle("Failed to Update Bank");
        const errorMsg = data.errors?.name?.[0] || data.message || "Failed to update bank";
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch {
      setFailTitle("Failed to Update Bank");
      setCreateFailMessage("An error occurred while updating the bank");
      setShowCreateFail(true);
    } finally {
      setSavingBank(false);
      setShowSaveLoading(false);
    }
  };


  const parsePhoneNumber = (value: string): { countryCode: string; number: string } => {
    for (const codeData of COUNTRY_PHONE_CODES) {
      if (value.startsWith(codeData.code)) {
        return {
          countryCode: codeData.code,
          number: value.substring(codeData.code.length),
        };
      }
    }
    return { countryCode: "+63", number: value };
  };

  const openContactForm = (contact?: BankContact) => {
    if (contact) {
      setEditingContact(contact);
      setContactFormData({
        branch_name: contact.branch_name || "",
        contact_person: contact.contact_person || "",
        position: contact.position || "",
        notes: contact.notes || "",
        channels: contact.channels
          ? contact.channels.map((ch) => {
              if (ch.channel_type === "PHONE" || ch.channel_type === "MOBILE" || ch.channel_type === "VIBER") {
                const parsed = parsePhoneNumber(ch.value);
                return { ...ch, value: parsed.number, country_code: parsed.countryCode };
              }
              return { ...ch };
            })
          : [],
      });
    } else {
      setEditingContact(null);
      setContactFormData({
        branch_name: "",
        contact_person: "",
        position: "",
        notes: "",
        channels: [],
      });
    }
    setShowContactForm(true);
  };

  const closeContactForm = () => {
    setShowContactForm(false);
    setEditingContact(null);
    setContactFormData({
      branch_name: "",
      contact_person: "",
      position: "",
      notes: "",
      channels: [],
    });
  };

  const addChannel = () => {
    setContactFormData({
      ...contactFormData,
      channels: [
        { channel_type: "PHONE", value: "", label: null, country_code: "+63" },
        ...contactFormData.channels,
      ],
    });
  };

  const removeChannel = (index: number) => {
    setContactFormData({
      ...contactFormData,
      channels: contactFormData.channels.filter((_, i) => i !== index),
    });
  };

  const updateChannel = (index: number, field: keyof BankContactChannel, value: any) => {
    const updatedChannels = [...contactFormData.channels];
    const updatedChannel = { ...updatedChannels[index], [field]: value };
    
    // If changing to EMAIL, remove country_code
    if (field === "channel_type" && value === "EMAIL") {
      updatedChannel.country_code = null;
    }
    // If changing from EMAIL to phone type and no country_code exists, set default
    else if (field === "channel_type" && (value === "PHONE" || value === "MOBILE" || value === "VIBER") && !updatedChannel.country_code) {
      updatedChannel.country_code = "+63";
    }
    
    updatedChannels[index] = updatedChannel;
    setContactFormData({ ...contactFormData, channels: updatedChannels });
  };

  const handleSaveContactConfirm = () => {
    setShowCreateContactConfirm(false);
    handleSaveContact();
  };

  const handleSaveContact = async () => {
    if (!detailBank?.id) return;
    if (!contactFormData.branch_name.trim()) {
      setFailTitle(editingContact ? "Failed to Update Contact" : "Failed to Create Contact");
      setCreateFailMessage("Branch name is required");
      setShowCreateFail(true);
      return;
    }

    // Validate channels
    for (let i = 0; i < contactFormData.channels.length; i++) {
      const channel = contactFormData.channels[i];
      if (!channel.value.trim()) {
        setFailTitle(editingContact ? "Failed to Update Contact" : "Failed to Create Contact");
        setCreateFailMessage(`Channel ${i + 1} value is required`);
        setShowCreateFail(true);
        return;
      }
      if (channel.channel_type === "EMAIL" && !isValidEmail(channel.value.trim())) {
        setFailTitle(editingContact ? "Failed to Update Contact" : "Failed to Create Contact");
        setCreateFailMessage(`Channel ${i + 1} has an invalid email address`);
        setShowCreateFail(true);
        return;
      }
    }

    setSavingContact(true);
    setShowContactLoading(true);
    try {
      const url = editingContact
        ? `/api/accountant/maintenance/bank-contacts/${editingContact.id}`
        : `/api/accountant/maintenance/bank-contacts`;
      const method = editingContact ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_id: detailBank.id,
          branch_name: contactFormData.branch_name.trim(),
          contact_person: contactFormData.contact_person.trim() || null,
          position: contactFormData.position.trim() || null,
          notes: contactFormData.notes.trim() || null,
          channels: contactFormData.channels.map((ch) => {
            let value = ch.value.trim();
            // Prepend country code for phone types
            if ((ch.channel_type === "PHONE" || ch.channel_type === "MOBILE" || ch.channel_type === "VIBER") && ch.country_code) {
              // Only add country code if value doesn't already start with it
              if (!value.startsWith(ch.country_code)) {
                value = ch.country_code + value;
              }
            }
            return {
              ...(ch.id && { id: ch.id }),
              channel_type: ch.channel_type,
              value: value,
              label: ch.label?.trim() || null,
            };
          }),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await fetchBankContacts(detailBank.id);
        closeContactForm();
        setSuccessTitle(editingContact ? "Contact Updated Successfully" : "Contact Created Successfully");
        setSuccessMessage(editingContact ? "The contact has been updated successfully." : "The contact has been created successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle(editingContact ? "Failed to Update Contact" : "Failed to Create Contact");
        const errorMsg = data.errors ? Object.values(data.errors).flat().join(", ") : data.message || `Failed to ${editingContact ? "update" : "create"} contact`;
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      setFailTitle(editingContact ? "Failed to Update Contact" : "Failed to Create Contact");
      setCreateFailMessage(`An error occurred while ${editingContact ? "updating" : "creating"} the contact`);
      setShowCreateFail(true);
    } finally {
      setSavingContact(false);
      setShowContactLoading(false);
    }
  };


  

  return (
    <div className="min-h-full flex flex-col bg-gray-50/80">
      <div className="sticky top-0 z-20 bg-gray-50/80">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#7B0F2B] via-[#8B1535] to-[#5E0C20] text-white px-6 py-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
              <Banknote className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Banks</h1>
              <p className="text-white/80 text-sm mt-0.5">Manage bank institutions and contacts</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreatePanel(true)}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold bg-white text-[#7B0F2B] hover:bg-white/95 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Create Bank
          </button>
        </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 -mt-4">
        <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Banks</h2>
              <p className="text-sm text-gray-600 mt-1">Manage bank institutions and contacts</p>
            </div>
          </div>
          {/* Summary Stats - Card row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#7B0F2B]/10 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-[#7B0F2B]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{summaryStats.total}</div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-700">{summaryStats.active}</div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-700">{summaryStats.inactive}</div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Inactive</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-6">
            {/* Filters Section */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#7B0F2B]" />
                <span className="text-sm font-semibold text-gray-700">Status</span>
                <div className="flex gap-1.5">
                  {(["ALL", "ACTIVE", "INACTIVE"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        statusFilter === s
                          ? "bg-[#7B0F2B] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search & Sort */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <button
                onClick={() => fetchBanks()}
                className="p-2.5 rounded-xl border border-gray-200 hover:bg-[#7B0F2B]/5 hover:border-[#7B0F2B]/30 transition-all"
                title="Refresh"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 12a8 8 0 0 1 14.9-3M20 12a8 8 0 0 1-14.9 3" />
                  <path d="M18 5v4h-4M6 19v-4h4" />
                </svg>
              </button>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search banks..."
                  className="w-full rounded-xl border border-gray-200 pl-10 pr-10 py-2.5 h-10 text-sm focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] outline-none transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#7B0F2B]">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split("-") as [typeof sortBy, typeof sortOrder];
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 h-10 text-sm focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] outline-none cursor-pointer min-w-[200px]"
                >
                  <option value="date-desc">Newest first</option>
                  <option value="date-asc">Oldest first</option>
                  <option value="name-asc">Name A–Z</option>
                  <option value="name-desc">Name Z–A</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {paginationMeta && (
            <div className="px-6">
              <Pagination
                paginationMeta={paginationMeta}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                itemName="banks"
              />
            </div>
          )}

          <div className="p-6 pt-0">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <BankCardSkeleton key={i} />
                ))}
              </div>
            ) : paginatedBanks.length === 0 ? (
              <div className="px-4 py-16 flex flex-col items-center justify-center text-center rounded-2xl bg-gray-50/80 border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 rounded-2xl bg-[#7B0F2B]/10 flex items-center justify-center mb-4">
                  <Inbox className="w-8 h-8 text-[#7B0F2B]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No banks found</h3>
                <p className="text-sm text-gray-500 mt-1 mb-6 max-w-sm">Create a bank or adjust your filters.</p>
                <button
                  onClick={() => setShowCreatePanel(true)}
                  className="px-5 py-2.5 bg-[#7B0F2B] text-white rounded-xl font-semibold hover:bg-[#8B1535] transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Bank
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedBanks.map((bank) => (
                  <div
                    key={bank.id}
                    className="rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-[#7B0F2B]/10 flex items-center justify-center shrink-0">
                          <Banknote className="w-6 h-6 text-[#7B0F2B]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{bank.name}</h3>
                          {bank.short_name && <p className="text-sm text-gray-600 mt-0.5 truncate">{bank.short_name}</p>}
                          {bank.country && <p className="text-xs text-gray-500 mt-0.5 truncate">{bank.country}</p>}
                        </div>
                      </div>
                      <div
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 ${
                          bank.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {bank.status}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-xs text-gray-500">Created: {formatDate(bank.created_at)}</div>
                      <button
                        onClick={() => openDetailDrawer(bank.id)}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-[#7B0F2B] text-white hover:bg-[#8B1535] transition-colors"
                        title="View"
                      >
                        <EyeIcon />
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

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
              <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-br from-[#7B0F2B] via-[#8B1535] to-[#5E0C20] text-white">
                <h2 className="text-lg font-bold">Create Bank</h2>
                <button onClick={closeCreatePanel} className="p-2 rounded-xl hover:bg-white/20 transition-colors" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all ${
                        nameError ? "border-red-500" : "border-gray-200"
                      }`}
                      placeholder="e.g., Security Bank"
                      required
                    />
                    {checkingName && (
                      <p className="text-xs text-gray-500 mt-1">Checking availability...</p>
                    )}
                    {nameError && !checkingName && (
                      <p className="text-xs text-red-500 mt-1">{nameError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">Short Name</label>
                    <input
                      type="text"
                      value={formData.short_name}
                      onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                      placeholder="e.g., SCB"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">Country</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                    >
                      <option value="">Select a country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as BankStatus })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t border-gray-100">
                <button
                  onClick={closeCreatePanel}
                  className="px-6 py-2.5 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateBankConfirm(true)}
                  disabled={showCreateLoading || !!nameError}
                  className="px-6 py-2.5 rounded-xl font-semibold bg-[#7B0F2B] text-white hover:bg-[#8B1535] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {showCreateLoading ? "Creating..." : "Create Bank"}
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
              <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-br from-[#7B0F2B] via-[#8B1535] to-[#5E0C20] text-white">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{detailBank ? detailBank.name : loadingDetail ? "Loading..." : "Bank Details"}</h2>
                    {detailBank?.short_name && <p className="text-sm text-white/90 mt-0.5">{detailBank.short_name}</p>}
                  </div>
                  {detailBank && (
                    <div
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                        detailBank.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {detailBank.status}
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
                    <BankDetailSkeleton />
                  </div>
                ) : !detailBank ? (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <p className="text-slate-500 text-sm">Unable to load bank details.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Bank Name <span className="text-red-500">*</span>
                        </label>
                        <div>
                          <input
                            type="text"
                            value={detailFormData.name || ""}
                            onChange={(e) => setDetailFormData({ ...detailFormData, name: e.target.value })}
                            className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all ${
                              nameError ? "border-red-500" : "border-gray-200"
                            }`}
                          />
                          {checkingName && (
                            <p className="text-xs text-gray-500 mt-1">Checking availability...</p>
                          )}
                          {nameError && !checkingName && (
                            <p className="text-xs text-red-500 mt-1">{nameError}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">Short Name</label>
                        <input
                          type="text"
                          value={detailFormData.short_name || ""}
                          onChange={(e) => setDetailFormData({ ...detailFormData, short_name: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">Country</label>
                        <select
                          value={detailFormData.country || ""}
                          onChange={(e) => setDetailFormData({ ...detailFormData, country: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                        >
                          <option value="">Select a country</option>
                          {COUNTRIES.map((country) => (
                            <option key={country.code} value={country.name}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={detailFormData.status || "ACTIVE"}
                          onChange={(e) => setDetailFormData({ ...detailFormData, status: e.target.value as BankStatus })}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>
                    </div>

                    {/* Bank Contacts Section */}
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-base font-semibold text-neutral-900">Bank Contacts</h3>
                            <p className="text-sm text-neutral-600 mt-0.5">Manage contacts for this bank</p>
                          </div>
                          <button
                            onClick={() => openContactForm()}
                            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-[#7B0F2B] text-white hover:bg-[#8B1535] transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Contact
                          </button>
                        </div>

                        {loadingContacts ? (
                          <div className="py-8 flex items-center justify-center">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#7a0f1f]"></div>
                          </div>
                        ) : bankContacts.length === 0 ? (
                          <div className="py-8 text-center">
                            <User className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">No contacts added yet</p>
                          </div>
                        ) : (
                          <div>
                            <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-0 mb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2 py-2 text-sm font-bold text-neutral-900">
                                    <div>Branch</div>
                                    <div>Contact Channels</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="w-20"></div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {bankContacts.map((contact) => {
                                const phoneChannels = contact.channels?.filter((ch) => ch.channel_type === "PHONE" || ch.channel_type === "MOBILE") || [];
                                const emailChannels = contact.channels?.filter((ch) => ch.channel_type === "EMAIL") || [];
                                const viberChannels = contact.channels?.filter((ch) => ch.channel_type === "VIBER") || [];
                                
                                return (
                                  <div
                                    key={contact.id}
                                    className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                                          <div className="min-w-0">
                                            <div className="font-semibold text-neutral-900 truncate">{contact.branch_name}</div>
                                            <div className="text-xs text-neutral-500 mt-0.5">Branch</div>
                                          </div>
                                          <div className="min-w-0">
                                            <div className="text-sm text-neutral-900">
                                              {phoneChannels.length > 0 && (
                                                <div className="mb-2">
                                                  <span className="font-medium text-neutral-700">Phone:</span>
                                                  <div className="mt-0.5 space-y-0.5">
                                                    {phoneChannels.map((ch, idx) => (
                                                      <div key={idx} className="text-neutral-600">
                                                        {ch.value}
                                                        {ch.label && <span className="text-xs text-neutral-500 ml-1">({ch.label})</span>}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                              {emailChannels.length > 0 && (
                                                <div className="mb-2">
                                                  <span className="font-medium text-neutral-700">Email:</span>
                                                  <div className="mt-0.5 space-y-0.5">
                                                    {emailChannels.map((ch, idx) => (
                                                      <div key={idx} className="text-neutral-600">
                                                        {ch.value}
                                                        {ch.label && <span className="text-xs text-neutral-500 ml-1">({ch.label})</span>}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                              {viberChannels.length > 0 && (
                                                <div className="mb-2">
                                                  <span className="font-medium text-neutral-700">Viber:</span>
                                                  <div className="mt-0.5 space-y-0.5">
                                                    {viberChannels.map((ch, idx) => (
                                                      <div key={idx} className="text-neutral-600">
                                                        {ch.value}
                                                        {ch.label && <span className="text-xs text-neutral-500 ml-1">({ch.label})</span>}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                              {(!contact.channels || contact.channels.length === 0) && (
                                                <span className="text-gray-400">—</span>
                                              )}
                                            </div>
                                            <div className="text-xs text-neutral-500 mt-0.5">Contact Channels</div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0">
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => openContactForm(contact)}
                                            className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                                            title="View contact"
                                          >
                                            <Eye className="w-4 h-4 text-gray-600" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                  </div>
                )}
              </div>
              {detailBank && (
                <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t border-gray-100">
                  <button
                    onClick={() => handleSaveBank(detailFormData)}
                    disabled={savingBank || !!nameError}
                    className="px-6 py-2.5 rounded-xl font-semibold bg-[#7B0F2B] text-white hover:bg-[#8B1535] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingBank ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

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
            title="Creating Bank" 
            message="Please wait while we create the bank..." 
          />
        )}

        {showSaveLoading && (
          <LoadingModal 
            isOpen={showSaveLoading} 
            title="Updating Bank" 
            message="Please wait while we update the bank..." 
          />
        )}

        {showContactLoading && (
          <LoadingModal 
            isOpen={showContactLoading} 
            title={editingContact ? "Updating Contact" : "Creating Contact"} 
            message={editingContact ? "Please wait while we update the contact..." : "Please wait while we create the contact..."} 
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
            title="Failed to Load Bank"
            message={detailLoadError}
            buttonText="Close"
          />
        )}

        <ConfirmationModal
          isOpen={showCreateBankConfirm}
          onClose={() => setShowCreateBankConfirm(false)}
          onConfirm={handleCreateBankConfirm}
          title="Create Bank"
          message={`Are you sure you want to create the bank "${formData.name.trim()}"?`}
          confirmText="Create"
          isLoading={showCreateLoading}
        />

        <ConfirmationModal
          isOpen={showCreateContactConfirm}
          onClose={() => setShowCreateContactConfirm(false)}
          onConfirm={handleSaveContactConfirm}
          title="Create Contact"
          message={`Are you sure you want to create a contact for branch "${contactFormData.branch_name.trim()}"?`}
          confirmText="Create"
          isLoading={showContactLoading}
        />

        {/* Contact Form Side Panel */}
        {showContactForm && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-[350ms] opacity-100"
              onClick={closeContactForm}
              aria-hidden="true"
            />
            <div
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl h-screen bg-white z-50 flex flex-col rounded-l-2xl overflow-hidden shadow-xl"
              style={{
                animation: "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
              }}
            >
              <div className="flex-shrink-0 flex items-center justify-between p-5 bg-gradient-to-br from-[#7B0F2B] via-[#8B1535] to-[#5E0C20] text-white">
                <div>
                  <h2 className="text-lg font-bold">{editingContact ? "Edit Contact" : "Add New Contact"}</h2>
                  <p className="text-sm text-white/90 mt-0.5">
                    {editingContact ? "Update contact information" : "Fill in the details below to add a new contact."}
                  </p>
                </div>
                <button
                  onClick={closeContactForm}
                  className="p-2 rounded-xl hover:bg-white/20 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Branch <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contactFormData.branch_name}
                      onChange={(e) => setContactFormData({ ...contactFormData, branch_name: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                      placeholder="Enter branch name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">Contact Person</label>
                    <input
                      type="text"
                      value={contactFormData.contact_person}
                      onChange={(e) => setContactFormData({ ...contactFormData, contact_person: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                      placeholder="Enter contact person name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">Position</label>
                    <input
                      type="text"
                      value={contactFormData.position}
                      onChange={(e) => setContactFormData({ ...contactFormData, position: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                      placeholder="Enter position"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">Notes</label>
                    <textarea
                      value={contactFormData.notes}
                      onChange={(e) => setContactFormData({ ...contactFormData, notes: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                      placeholder="Enter notes"
                      rows={3}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-neutral-900">Contact Channels</label>
                      <button
                        type="button"
                        onClick={addChannel}
                        className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold bg-[#7B0F2B] text-white hover:bg-[#8B1535] transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add Channel
                      </button>
                    </div>
                    <div className="space-y-2">
                      {contactFormData.channels.map((channel, index) => {
                        const isPhoneType = channel.channel_type === "PHONE" || channel.channel_type === "MOBILE" || channel.channel_type === "VIBER";
                        const isEmailType = channel.channel_type === "EMAIL";
                        const channelValue = channel.value || "";
                        const hasEmailError = isEmailType && channelValue && !isValidEmail(channelValue);
                        
                        return (
                          <div key={index} className="flex gap-2 items-start p-3 rounded-xl border border-gray-100">
                            <div className="flex-1 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  value={channel.channel_type}
                                  onChange={(e) => {
                                    const newType = e.target.value as "PHONE" | "MOBILE" | "EMAIL" | "VIBER";
                                    updateChannel(index, "channel_type", newType);
                                  }}
                                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                                >
                                  <option value="PHONE">Phone</option>
                                  <option value="MOBILE">Mobile</option>
                                  <option value="EMAIL">Email</option>
                                  <option value="VIBER">Viber</option>
                                </select>
                                <input
                                  type="text"
                                  value={channel.label || ""}
                                  onChange={(e) => updateChannel(index, "label", e.target.value)}
                                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                                  placeholder="Label (optional)"
                                />
                              </div>
                              <div className="flex gap-2">
                                {isPhoneType && (
                                  <select
                                    value={channel.country_code || "+63"}
                                    onChange={(e) => updateChannel(index, "country_code", e.target.value)}
                                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all w-32"
                                  >
                                    {COUNTRY_PHONE_CODES.map((code) => (
                                      <option key={code.code} value={code.code}>
                                        {code.flag} {code.code}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                <div className="flex-1">
                                  <input
                                    type={isEmailType ? "email" : "text"}
                                    value={channelValue}
                                    onChange={(e) => {
                                      let value = e.target.value;
                                      if (isPhoneType) {
                                        value = formatPhoneNumber(value);
                                      }
                                      updateChannel(index, "value", value);
                                    }}
                                    className={`rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all w-full ${
                                      hasEmailError ? "border-red-500" : "border-gray-200"
                                    }`}
                                    placeholder={isEmailType ? "email@example.com" : "Number"}
                                  />
                                  {hasEmailError && (
                                    <p className="text-xs text-red-500 mt-0.5">Invalid email format</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeChannel(index)}
                              className="p-1.5 rounded-xl hover:bg-red-50 transition-colors shrink-0"
                              title="Remove channel"
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        );
                      })}
                      {contactFormData.channels.length === 0 && (
                        <div className="text-center py-4 text-sm text-gray-500 border border-gray-100 rounded-xl">
                          No channels added. Click "Add Channel" to add contact information.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t border-gray-100">
                <button
                  onClick={closeContactForm}
                  className="px-6 py-2.5 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editingContact) {
                      handleSaveContact();
                    } else {
                      setShowCreateContactConfirm(true);
                    }
                  }}
                  disabled={savingContact || !contactFormData.branch_name.trim()}
                  className="px-6 py-2.5 rounded-xl font-semibold bg-[#7B0F2B] text-white hover:bg-[#8B1535] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingContact ? "Saving..." : editingContact ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

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
  );
}

function BankDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i}>
          <div className="h-4 bg-slate-200 w-24 mb-2 rounded" />
          <div className="h-10 bg-slate-100 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

function BankCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
        <div className="h-6 bg-gray-200 rounded-lg w-16" />
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="h-3 bg-gray-200 rounded w-24" />
        <div className="h-9 bg-gray-200 rounded-xl w-20" />
      </div>
    </div>
  );
}
