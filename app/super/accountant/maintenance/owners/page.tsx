"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, Inbox, Plus, Eye, User, Building2, Users, Mail, Phone } from "lucide-react";
import SuccessModal from "@/components/ui/SuccessModal";
import LoadingModal from "@/components/ui/LoadingModal";
import FailModal from "@/components/ui/FailModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import CreateOwnerPanel from "@/components/accountant/CreateOwnerPanel";
import {
  MaintenancePageLayout,
  MaintenanceSectionCard,
  MaintenanceEmptyState,
  MaintenancePagination,
  MaintenanceRefreshButton,
  MaintenanceFilterCard,
} from "@/components/accountant/maintenance";

type OwnerType = "COMPANY" | "CLIENT" | "MAIN" | "SYSTEM";
type OwnerStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

type Owner = {
  id: number;
  owner_type: OwnerType;
  name: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  /** @deprecated Use phone. Kept for backward compatibility with backend. */
  phone_number?: string | null;
  address?: string | null;
  status: OwnerStatus | string; // Allow string for backward compatibility during transition
  is_system?: boolean;
  created_at?: string;
  updated_at?: string;
};

type UnitStatus = "ACTIVE" | "INACTIVE";

type Property = {
  id: number;
  name: string;
  property_type: string;
  address?: string | null;
  status: string;
};

type Unit = {
  id: number;
  owner_id?: number | null;
  property_id?: number | null;
  unit_name: string;
  status: UnitStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  property?: Property | null;
};

const BORDER = "rgba(0,0,0,0.08)";

// Status badge utility function
const getStatusBadge = (status: string): string => {
  const s = status?.toUpperCase();
  if (s === "ACTIVE") return "bg-green-100 text-green-700";
  if (s === "SUSPENDED") return "bg-yellow-100 text-yellow-700";
  if (s === "INACTIVE") return "bg-gray-100 text-gray-700";
  return "bg-gray-100 text-gray-700";
};

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

const OwnerTableSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 animate-pulse">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 bg-gray-200 rounded-xl shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
          <div className="h-6 bg-gray-200 rounded-lg w-16 shrink-0" />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="mt-3 flex justify-end">
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </div>
    ))}
  </div>
);

const OwnerDetailSkeleton = () => (
  <div className="animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
          <div className="h-10 bg-gray-100 rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

export default function OwnersPage() {
  const searchParams = useSearchParams();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "SUSPENDED">("ALL");
  const [ownerTypeFilter, setOwnerTypeFilter] = useState<OwnerType | "ALL">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [highlightOwnerId, setHighlightOwnerId] = useState<number | null>(null);
  const [paginationMeta, setPaginationMeta] = useState<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  } | null>(null);

  // Handle URL params for highlighting.
  // When opened directly from ledger, force filters/search so the exact owner is visible.
  useEffect(() => {
    const highlightParam = searchParams.get("highlight");
    if (!highlightParam) return;

    const ownerId = parseInt(highlightParam, 10);
    if (isNaN(ownerId)) return;

    const focusOwner = async () => {
      try {
        const res = await fetch(`/api/accountant/maintenance/owners/${ownerId}`);
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          const owner = data.data as Owner;
          const ownerStatus = typeof owner.status === "string" ? owner.status.toUpperCase() : "ACTIVE";
          // Set status filter based on owner status (ACTIVE, INACTIVE, or SUSPENDED)
          if (ownerStatus === "INACTIVE") {
            setStatusFilter("INACTIVE");
          } else if (ownerStatus === "SUSPENDED") {
            setStatusFilter("SUSPENDED");
          } else {
            setStatusFilter("ALL");
          }
          setOwnerTypeFilter(owner.owner_type ?? "ALL");
          setSearchQuery(owner.name ?? "");
          setCurrentPage(1);
        }
      } catch {
        // no-op: fallback to current list state
      } finally {
        setHighlightOwnerId(ownerId);
        setTimeout(() => setHighlightOwnerId(null), 3000);
      }
    };

    focusOwner();
  }, [searchParams]);
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
  const [detailOwner, setDetailOwner] = useState<Owner | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null);
  const [detailFormData, setDetailFormData] = useState<Partial<Owner>>({});
  const [savingOwner, setSavingOwner] = useState(false);
  const [showSaveLoading, setShowSaveLoading] = useState(false);
  const [showCreateOwnerConfirm, setShowCreateOwnerConfirm] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Units state
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitFormData, setUnitFormData] = useState({
    unit_name: "",
    property_id: null as number | null,
    status: "ACTIVE" as UnitStatus,
    notes: "",
    opening_balance: "",
    opening_date: new Date().toISOString().split("T")[0],
  });
  const [savingUnit, setSavingUnit] = useState(false);
  const [showUnitLoading, setShowUnitLoading] = useState(false);
  const [showCreateUnitConfirm, setShowCreateUnitConfirm] = useState(false);

  // Properties state for dropdown
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);

  const [formData, setFormData] = useState({
    owner_type: "CLIENT" as OwnerType,
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    opening_balance: "",
    opening_date: new Date().toISOString().split('T')[0], // Default to today
  });
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [openingBalanceError, setOpeningBalanceError] = useState<string | null>(null);
  const [openingDateError, setOpeningDateError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [checkingName, setCheckingName] = useState(false);

  useEffect(() => {
    fetchOwners();
  }, [searchQuery, statusFilter, ownerTypeFilter, currentPage, sortBy, sortOrder]);

  useEffect(() => {
    fetchProperties();
  }, []);

  // Update property search query when property_id changes or properties are loaded
  useEffect(() => {
    if (unitFormData.property_id && properties.length > 0) {
      const selectedProperty = properties.find(p => p.id === unitFormData.property_id);
      if (selectedProperty && propertySearchQuery !== selectedProperty.name) {
        setPropertySearchQuery(selectedProperty.name);
      }
    } else if (!unitFormData.property_id && propertySearchQuery && showUnitForm) {
      // Only clear if we're in the form and property_id is cleared
      setPropertySearchQuery("");
    }
  }, [unitFormData.property_id, properties]);

  // Debounce owner name checking
  useEffect(() => {
    if (!formData.name.trim()) {
      setNameError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkOwnerNameExists(formData.name);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.name]);

  // Debounce email validation
  useEffect(() => {
    const error = validateEmail(formData.email);
    setEmailError(error);
  }, [formData.email]);

  // Validate phone number
  useEffect(() => {
    const error = validatePhone(formData.phone);
    setPhoneError(error);
  }, [formData.phone]);

  // Validate description
  useEffect(() => {
    const error = validateDescription(formData.description);
    setDescriptionError(error);
  }, [formData.description]);

  // Validate address
  useEffect(() => {
    const error = validateAddress(formData.address);
    setAddressError(error);
  }, [formData.address]);

  // Validate opening balance
  useEffect(() => {
    const error = validateOpeningBalance(formData.opening_balance);
    setOpeningBalanceError(error);
    
    // Also validate date if balance is provided
    if (formData.opening_balance && parseFloat(formData.opening_balance) > 0) {
      const dateError = validateOpeningDate(formData.opening_date, true);
      setOpeningDateError(dateError);
    } else {
      setOpeningDateError(null);
    }
  }, [formData.opening_balance, formData.opening_date]);

  // Debounce owner name checking for detail form
  useEffect(() => {
    if (!detailOwner?.id || !detailFormData.name?.trim()) {
      setNameError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkOwnerNameExists(detailFormData.name || "", detailOwner.id);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [detailFormData.name, detailOwner?.id]);

  // Debounce email validation for detail form
  useEffect(() => {
    if (!detailOwner?.id) {
      setEmailError(null);
      return;
    }
    const error = validateEmail(detailFormData.email || "");
    setEmailError(error);
  }, [detailFormData.email, detailOwner?.id]);

  // Filtering is now done on the backend, so we just use owners directly
  const paginatedOwners = owners;

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, ownerTypeFilter, searchQuery, sortBy, sortOrder]);

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/accountant/maintenance/owners", window.location.origin);
      if (searchQuery.trim()) {
        url.searchParams.append("search", searchQuery.trim());
      }
      if (statusFilter && statusFilter !== "ALL") {
        url.searchParams.append("status", statusFilter);
      }
      if (ownerTypeFilter && ownerTypeFilter !== "ALL") {
        url.searchParams.append("owner_type", ownerTypeFilter);
      }
      url.searchParams.append("page", currentPage.toString());
      url.searchParams.append("per_page", "10");
      url.searchParams.append("sort_by", sortBy);
      url.searchParams.append("sort_order", sortOrder);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok && data.success) {
        // Backend returns paginated data
        const ownersList = data.data?.data || data.data || [];
        setOwners(Array.isArray(ownersList) ? ownersList : []);
        
        // Store pagination metadata
        if (data.data?.current_page !== undefined) {
          setPaginationMeta({
            current_page: data.data.current_page || 1,
            last_page: data.data.last_page || 1,
            per_page: data.data.per_page || 10,
            total: data.data.total || 0,
            from: data.data.from || 0,
            to: data.data.to || 0,
          });
        }
      } else {
        setOwners([]);
        setPaginationMeta(null);
      }
    } catch {
      setOwners([]);
      setPaginationMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const openDetailDrawer = async (ownerId: number) => {
    setDetailDrawerOpen(true);
    setLoadingDetail(true);
    setDetailLoadError(null);
    try {
      const res = await fetch(`/api/accountant/maintenance/owners/${ownerId}`);
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        const upperOwner = {
          ...data.data,
          name: data.data.name?.toUpperCase() || "",
        };
        
        setDetailOwner(upperOwner);
        setDetailFormData(upperOwner);

        await fetchUnits(ownerId);
      } else {
        setDetailLoadError(data.message || "Failed to load owner details");
      }
    } catch (error) {
      setDetailLoadError("An error occurred while loading owner details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchProperties = async () => {
    setLoadingProperties(true);
    try {
      const res = await fetch("/api/accountant/maintenance/properties?per_page=all");
      const data = await res.json();
      if (res.ok && data.success) {
        const propertiesList = data.data?.data || data.data || [];
        setProperties(Array.isArray(propertiesList) ? propertiesList : []);
      } else {
        setProperties([]);
      }
    } catch {
      setProperties([]);
    } finally {
      setLoadingProperties(false);
    }
  };

  const filteredProperties = useMemo(() => {
    if (!propertySearchQuery.trim()) {
      return properties.filter(p => p.status === "ACTIVE");
    }
    const q = propertySearchQuery.toLowerCase();
    return properties.filter(
      (property) =>
        property.status === "ACTIVE" &&
        (property.name?.toLowerCase().includes(q) ||
          property.property_type?.toLowerCase().includes(q) ||
          property.address?.toLowerCase().includes(q))
    );
  }, [properties, propertySearchQuery]);

  const fetchUnits = async (ownerId: number) => {
    setLoadingUnits(true);
    try {
      const res = await fetch(`/api/accountant/maintenance/units?owner_id=${ownerId}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setUnits(data.data);
      } else {
        setUnits([]);
      }
    } catch {
      setUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  };

  const closeDetailDrawer = () => {
    setDetailDrawerClosing(true);
    setTimeout(() => {
      setDetailDrawerOpen(false);
      setDetailDrawerClosing(false);
      setDetailOwner(null);
      setDetailFormData({});
      setDetailLoadError(null);
      setNameError(null);
      setEmailError(null);
      setUnits([]);
      setShowUnitForm(false);
      setEditingUnit(null);
    }, 350);
  };

  const closeCreatePanel = () => {
    setShowCreatePanel(false);
  };

  // Validation helper functions
  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return "Owner name is required";
    }
    if (name.trim().length < 2) {
      return "Owner name must be at least 2 characters";
    }
    if (name.trim().length > 255) {
      return "Owner name must not exceed 255 characters";
    }
    // Check for potentially dangerous characters (basic XSS prevention)
    if (/<script|javascript:|onerror=|onclick=/i.test(name)) {
      return "Owner name contains invalid characters";
    }
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
      return null; // Email is optional
    }
    if (!isValidEmail(email.trim())) {
      return "Invalid email format";
    }
    if (email.trim().length > 255) {
      return "Email must not exceed 255 characters";
    }
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone.trim()) {
      return null; // Phone is optional
    }
    // Remove formatting characters for validation
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleanPhone.length > 20) {
      return "Phone number is too long";
    }
    // Allow digits, spaces, dashes, parentheses, and plus sign
    if (!/^[\d\s\-\(\)\+]+$/.test(phone)) {
      return "Phone number contains invalid characters";
    }
    return null;
  };

  const validateDescription = (description: string): string | null => {
    if (!description.trim()) {
      return null; // Description is optional
    }
    if (description.trim().length > 1000) {
      return "Description must not exceed 1000 characters";
    }
    return null;
  };

  const validateAddress = (address: string): string | null => {
    if (!address.trim()) {
      return null; // Address is optional
    }
    if (address.trim().length > 500) {
      return "Address must not exceed 500 characters";
    }
    return null;
  };

  const validateOpeningBalance = (balance: string): string | null => {
    if (!balance.trim()) {
      return null; // optional
    }
  
    const numBalance = parseFloat(balance);
  
    if (isNaN(numBalance)) {
      return "Opening balance must be a valid number";
    }
  
    if (numBalance < 0) {
      return "Opening balance cannot be negative";
    }
  
    if (numBalance > 999_999_999) {
      return "Opening balance cannot exceed 999,999,999";
    }
  
    // max 2 decimal places
    const decimalParts = balance.split(".");
    if (decimalParts.length === 2 && decimalParts[1].length > 2) {
      return "Maximum of 2 decimal places allowed";
    }
  
    return null;
  };

  const validateOpeningDate = (date: string, hasBalance: boolean): string | null => {
    if (!hasBalance) {
      return null; // Date not required if no balance
    }
    if (!date.trim()) {
      return "Opening date is required when opening balance is provided";
    }
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (isNaN(selectedDate.getTime())) {
      return "Invalid date format";
    }
    if (selectedDate > today) {
      return "Opening date cannot be in the future";
    }
    return null;
  };

  const validateOwnerType = (ownerType: string): string | null => {
    // SYSTEM allowed only when editing existing system owners (not for create)
    const validTypes = ['CLIENT', 'COMPANY', 'MAIN', 'SYSTEM'];
    if (!ownerType) {
      return "Owner type is required";
    }
    if (!validTypes.includes(ownerType)) {
      return "Invalid owner type selected";
    }
    return null;
  };

  const checkOwnerNameExists = async (name: string, excludeId?: number) => {
    if (!name.trim()) {
      setNameError(null);
      setCheckingName(false);
      return;
    }

    // First check basic validation
    const nameValidationError = validateName(name);
    if (nameValidationError) {
      setNameError(nameValidationError);
      setCheckingName(false);
      return;
    }

    setCheckingName(true);
    try {
      // Check if name exists by searching
      const url = new URL("/api/accountant/maintenance/owners", window.location.origin);
      url.searchParams.append("search", name.trim());
      const res = await fetch(url.toString());
      const data = await res.json();
      
      if (res.ok && data.success) {
        const ownersList = data.data?.data || data.data || [];
        const matchingOwner = Array.isArray(ownersList) 
          ? ownersList.find((owner: Owner) => 
              owner.name.toLowerCase() === name.trim().toLowerCase() && 
              (!excludeId || owner.id !== excludeId)
            )
          : null;
        
        if (matchingOwner) {
          setNameError("An owner with this name already exists.");
        } else {
          setNameError(null);
        }
      }
    } catch (error) {
      console.error("Error checking owner name:", error);
      setNameError(null);
    } finally {
      setCheckingName(false);
    }
  };

  const handleCreateOwnerConfirm = () => {
    setShowCreateOwnerConfirm(false);
    handleCreateOwner();
  };

  const handleCreateOwner = async () => {
    // Comprehensive validation
    const nameValidationError = validateName(formData.name);
    if (nameValidationError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(nameValidationError);
      setShowCreateFail(true);
      return;
    }

    const ownerTypeError = validateOwnerType(formData.owner_type);
    if (ownerTypeError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(ownerTypeError);
      setShowCreateFail(true);
      return;
    }

    const emailValidationError = validateEmail(formData.email);
    if (emailValidationError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(emailValidationError);
      setShowCreateFail(true);
      return;
    }

    const phoneValidationError = validatePhone(formData.phone);
    if (phoneValidationError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(phoneValidationError);
      setShowCreateFail(true);
      return;
    }

    const descriptionValidationError = validateDescription(formData.description);
    if (descriptionValidationError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(descriptionValidationError);
      setShowCreateFail(true);
      return;
    }

    const addressValidationError = validateAddress(formData.address);
    if (addressValidationError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(addressValidationError);
      setShowCreateFail(true);
      return;
    }

    const openingBalanceValidationError = validateOpeningBalance(formData.opening_balance);
    if (openingBalanceValidationError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(openingBalanceValidationError);
      setShowCreateFail(true);
      return;
    }

    const hasOpeningBalance = !!(formData.opening_balance && parseFloat(formData.opening_balance) > 0);
    const openingDateValidationError = validateOpeningDate(formData.opening_date, hasOpeningBalance);
    if (openingDateValidationError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(openingDateValidationError);
      setShowCreateFail(true);
      return;
    }

    // Check for async validation errors
    if (nameError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(nameError);
      setShowCreateFail(true);
      return;
    }

    if (emailError) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage(emailError);
      setShowCreateFail(true);
      return;
    }

    // Check if name is still being validated
    if (checkingName) {
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage("Please wait while we verify the owner name");
      setShowCreateFail(true);
      return;
    }

    setShowCreateLoading(true);
    try {
      const res = await fetch("/api/accountant/maintenance/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_type: formData.owner_type,
          name: formData.name.trim().toUpperCase(),
          description: formData.description?.trim() || null,
          email: formData.email?.trim() || null,
          phone: formData.phone?.trim() || null,
          address: formData.address?.trim() || null,
          opening_balance: formData.opening_balance && parseFloat(formData.opening_balance) > 0 
            ? parseFloat(formData.opening_balance) 
            : null,
          opening_date: formData.opening_balance && parseFloat(formData.opening_balance) > 0 && formData.opening_date
            ? formData.opening_date
            : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchOwners();
        closeCreatePanel();
        setSuccessTitle("Owner Created Successfully");
        setSuccessMessage("The owner has been created successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle("Failed to Create Owner");
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join(", ") 
          : data.message || "Failed to create owner";
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch (error) {
      console.error("Error creating owner:", error);
      setFailTitle("Failed to Create Owner");
      setCreateFailMessage("An error occurred while creating the owner");
      setShowCreateFail(true);
    } finally {
      setShowCreateLoading(false);
    }
  };

  const openUnitForm = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit);
      // Convert ARCHIVED status to ACTIVE for editing (only ACTIVE/INACTIVE allowed)
      const editableStatus = (unit.status === "ACTIVE" || unit.status === "INACTIVE" ? unit.status : "ACTIVE");
      setUnitFormData({
        unit_name: unit.unit_name || "",
        property_id: unit.property_id || null,
        status: editableStatus as UnitStatus,
        notes: unit.notes || "",
        opening_balance: "",
        opening_date: new Date().toISOString().split("T")[0],
      });
      // Set property search query to show selected property name
      if (unit.property_id && unit.property) {
        setPropertySearchQuery(unit.property.name);
      } else if (unit.property_id && properties.length > 0) {
        const selectedProperty = properties.find(p => p.id === unit.property_id);
        if (selectedProperty) {
          setPropertySearchQuery(selectedProperty.name);
        } else {
          setPropertySearchQuery("");
        }
      } else {
        setPropertySearchQuery("");
      }
    } else {
      setEditingUnit(null);
      setUnitFormData({
        unit_name: "",
        property_id: null,
        status: "ACTIVE",
        notes: "",
        opening_balance: "",
        opening_date: new Date().toISOString().split("T")[0],
      });
      setPropertySearchQuery("");
    }
    setShowPropertyDropdown(false);
    setShowUnitForm(true);
  };

  const closeUnitForm = () => {
    setShowUnitForm(false);
    setEditingUnit(null);
    setUnitFormData({
      unit_name: "",
      property_id: null,
      status: "ACTIVE",
      notes: "",
      opening_balance: "",
      opening_date: new Date().toISOString().split("T")[0],
    });
    setPropertySearchQuery("");
    setShowPropertyDropdown(false);
  };

  const handleSaveUnitConfirm = () => {
    setShowCreateUnitConfirm(false);
    handleSaveUnit();
  };

  const handleSaveUnit = async () => {
    if (!detailOwner?.id) return;
    if (!unitFormData.unit_name.trim()) {
      setFailTitle(editingUnit ? "Failed to Update Unit" : "Failed to Create Unit");
      setCreateFailMessage("Unit name is required");
      setShowCreateFail(true);
      return;
    }

    // Validate status - only ACTIVE or INACTIVE allowed
    if (unitFormData.status !== "ACTIVE" && unitFormData.status !== "INACTIVE") {
      setFailTitle(editingUnit ? "Failed to Update Unit" : "Failed to Create Unit");
      setCreateFailMessage("Status must be either ACTIVE or INACTIVE");
      setShowCreateFail(true);
      return;
    }

    setSavingUnit(true);
    setShowUnitLoading(true);
    try {
      const url = editingUnit
        ? `/api/accountant/maintenance/units/${editingUnit.id}`
        : `/api/accountant/maintenance/units`;
      const method = editingUnit ? "PUT" : "POST";

      // Ensure status is only ACTIVE or INACTIVE
      const statusToSend = unitFormData.status === "ACTIVE" || unitFormData.status === "INACTIVE" 
        ? unitFormData.status 
        : "ACTIVE";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: detailOwner.id,
          property_id: unitFormData.property_id || null,
          unit_name: unitFormData.unit_name.trim().toUpperCase(),
          status: statusToSend,
          notes: unitFormData.notes.trim() || null,
          opening_balance: !editingUnit && unitFormData.opening_balance && parseFloat(String(unitFormData.opening_balance).replace(/,/g, "")) > 0
            ? parseFloat(String(unitFormData.opening_balance).replace(/,/g, ""))
            : null,
          opening_date: !editingUnit && unitFormData.opening_balance && parseFloat(String(unitFormData.opening_balance).replace(/,/g, "")) > 0 && unitFormData.opening_date
            ? unitFormData.opening_date
            : null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await fetchUnits(detailOwner.id);
        closeUnitForm();
        setSuccessTitle(editingUnit ? "Unit Updated Successfully" : "Unit Created Successfully");
        setSuccessMessage(editingUnit ? "The unit has been updated successfully." : "The unit has been created successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle(editingUnit ? "Failed to Update Unit" : "Failed to Create Unit");
        const errorMsg = data.errors ? Object.values(data.errors).flat().join(", ") : data.message || `Failed to ${editingUnit ? "update" : "create"} unit`;
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch (error) {
      console.error("Error saving unit:", error);
      setFailTitle(editingUnit ? "Failed to Update Unit" : "Failed to Create Unit");
      setCreateFailMessage(`An error occurred while ${editingUnit ? "updating" : "creating"} the unit`);
      setShowCreateFail(true);
    } finally {
      setSavingUnit(false);
      setShowUnitLoading(false);
    }
  };

  const handleSaveOwner = async (formData: Partial<Owner>) => {
    if (!detailOwner?.id) return;
    
    // Comprehensive validation
    const nameValidationError = validateName(formData.name || "");
    if (nameValidationError) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage(nameValidationError);
      setShowCreateFail(true);
      return;
    }

    const ownerTypeError = validateOwnerType(formData.owner_type || "");
    if (ownerTypeError) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage(ownerTypeError);
      setShowCreateFail(true);
      return;
    }

    const emailValidationError = validateEmail(formData.email || "");
    if (emailValidationError) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage(emailValidationError);
      setShowCreateFail(true);
      return;
    }

    const phoneValidationError = validatePhone(formData.phone || "");
    if (phoneValidationError) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage(phoneValidationError);
      setShowCreateFail(true);
      return;
    }

    const descriptionValidationError = validateDescription(formData.description || "");
    if (descriptionValidationError) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage(descriptionValidationError);
      setShowCreateFail(true);
      return;
    }

    const addressValidationError = validateAddress(formData.address || "");
    if (addressValidationError) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage(addressValidationError);
      setShowCreateFail(true);
      return;
    }

    // Validate status - only ACTIVE, INACTIVE, or SUSPENDED allowed
    if (formData.status && formData.status !== "ACTIVE" && formData.status !== "INACTIVE" && formData.status !== "SUSPENDED" 
        && formData.status !== "active" && formData.status !== "inactive" && formData.status !== "suspended") {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage("Status must be ACTIVE, INACTIVE, or SUSPENDED");
      setShowCreateFail(true);
      return;
    }

    // Check for async validation errors
    if (nameError) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage(nameError);
      setShowCreateFail(true);
      return;
    }

    if (emailError) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage(emailError);
      setShowCreateFail(true);
      return;
    }

    // Check if name is still being validated
    if (checkingName) {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage("Please wait while we verify the owner name");
      setShowCreateFail(true);
      return;
    }
    
    setSavingOwner(true);
    setShowSaveLoading(true);
    try {
      // Normalize status to uppercase
      const statusToSend = formData.status 
        ? (formData.status.toUpperCase() === "ACTIVE" || formData.status.toUpperCase() === "INACTIVE" || formData.status.toUpperCase() === "SUSPENDED"
            ? formData.status.toUpperCase() 
            : "ACTIVE")
        : "ACTIVE";

      // TypeScript guard: name is already validated above
      const ownerName = formData.name || "";
      
      const cleanedData: Record<string, any> = {
        owner_type: formData.owner_type,
        name: ownerName.trim().toUpperCase(),
        description: formData.description?.trim() || null,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        status: statusToSend,
      };

      const res = await fetch(`/api/accountant/maintenance/owners/${detailOwner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDetailOwner((prev) => (prev ? { ...prev, ...data.data } : null));
        setDetailFormData((prev) => (prev ? { ...prev, ...data.data } : {}));
        setNameError(null);
        setEmailError(null);
        await fetchOwners();
        setSuccessTitle("Owner Updated Successfully");
        setSuccessMessage("The owner has been updated successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle("Failed to Update Owner");
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join(", ") 
          : data.message || "Failed to update owner";
        setCreateFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch {
      setFailTitle("Failed to Update Owner");
      setCreateFailMessage("An error occurred while updating the owner");
      setShowCreateFail(true);
    } finally {
      setSavingOwner(false);
      setShowSaveLoading(false);
    }
  };

  const hasFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "ALL" ||
    ownerTypeFilter !== "ALL" ||
    sortBy !== "date" ||
    sortOrder !== "desc";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setOwnerTypeFilter("ALL");
    setSortBy("date");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 px-4 py-2.5 h-10 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all";

  return (
    <MaintenancePageLayout
      header={{
        icon: Users,
        title: "Owners",
        subtitle: "Manage clients, companies, and fund owners",
        primaryAction: (
          <button
            onClick={() => setShowCreatePanel(true)}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold bg-white text-[#7B0F2B] hover:bg-white/95 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Create Owner
          </button>
        ),
      }}
    >
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="sticky top-0 z-20 bg-gray-50 shrink-0 pb-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="px-4 sm:px-6 lg:px-8 mt-6">
            <MaintenanceFilterCard
              title="Filters"
              description="Search and filter owners"
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
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Type</label>
                  <select
                    value={ownerTypeFilter}
                    onChange={(e) => setOwnerTypeFilter(e.target.value as typeof ownerTypeFilter)}
                    className={inputClass}
                  >
                    <option value="ALL">All</option>
                    <option value="CLIENT">Client</option>
                    <option value="COMPANY">Company</option>
                    <option value="MAIN">Main</option>
                    <option value="SYSTEM">System</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search owners..."
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
                    <option value="date-desc">Newest first</option>
                    <option value="date-asc">Oldest first</option>
                    <option value="name-asc">Name A–Z</option>
                    <option value="name-desc">Name Z–A</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <MaintenanceRefreshButton onClick={fetchOwners} title="Refresh list" />
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
                  itemName="owners"
                />
              </div>
            )}

            <div className="mt-6">
            {loading ? (
              <OwnerTableSkeleton />
            ) : paginatedOwners.length === 0 ? (
              <MaintenanceEmptyState
                icon={Inbox}
                title="No owners found"
                description="Create an owner or adjust your filters."
                action={
                  <button
                    onClick={() => setShowCreatePanel(true)}
                    className="px-5 py-2.5 bg-[#7B0F2B] text-white rounded-xl font-semibold hover:bg-[#8B1535] transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Owner
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedOwners.map((owner) => {
                  const isHighlighted = highlightOwnerId === owner.id;
                  return (
                    <div
                      key={owner.id}
                      onClick={() => openDetailDrawer(owner.id)}
                      ref={(el) => {
                        if (isHighlighted && el) {
                          setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
                        }
                      }}
                      className={`group rounded-2xl border bg-white p-5 cursor-pointer transition-all hover:shadow-lg hover:border-[#7B0F2B]/30 hover:-translate-y-0.5 ${
                        isHighlighted ? "ring-2 ring-[#7B0F2B] ring-offset-2 border-[#7B0F2B]" : "border-gray-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-[#7B0F2B]/10 flex items-center justify-center shrink-0">
                            <User className="w-6 h-6 text-[#7B0F2B]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 truncate" title={owner.name}>
                              {owner.name}
                            </div>
                            <div className="text-xs text-[#7B0F2B] font-medium mt-0.5">{owner.owner_type || "—"}</div>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 ${getStatusBadge(owner.status || "ACTIVE")}`}>
                          {typeof owner.status === "string" ? owner.status.toUpperCase() : "ACTIVE"}
                        </span>
                      </div>
                      <div className="mt-4 space-y-2 pt-4 border-t border-gray-100">
                        {(owner.email || owner.phone || owner.phone_number) && (
                          <>
                            {owner.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
                                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="truncate" title={owner.email}>{owner.email}</span>
                              </div>
                            )}
                            {(owner.phone || owner.phone_number) && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
                                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="truncate" title={owner.phone ?? owner.phone_number ?? undefined}>
                                  {owner.phone ?? owner.phone_number ?? "—"}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {!owner.email && !owner.phone && !owner.phone_number && (
                          <div className="text-xs text-gray-400">No contact info</div>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-medium text-[#7B0F2B] flex items-center gap-1">
                          View details
                          <Eye className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </div>
        </MaintenanceSectionCard>

        <CreateOwnerPanel
          isOpen={showCreatePanel}
          onClose={closeCreatePanel}
          onSuccess={(owner) => {
            // Refresh owners list after successful creation
            fetchOwners();
          }}
          refreshOwners={fetchOwners}
        />

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
              className="fixed top-0 right-0 bottom-0 w-full max-w-4xl h-screen bg-white z-50 flex flex-col overflow-hidden shadow-2xl"
              style={{
                animation: detailDrawerClosing
                  ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                  : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                boxShadow: "-12px 0 40px rgba(123,15,43,0.12)",
              }}
            >
              <div className="flex-shrink-0 flex items-center justify-between p-5 bg-gradient-to-br from-[#7B0F2B] via-[#8B1535] to-[#5E0C20] text-white">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{detailOwner ? detailOwner.name : loadingDetail ? "Loading..." : "Owner Details"}</h2>
                    {detailOwner?.owner_type && <p className="text-sm text-white/90 mt-0.5">{detailOwner.owner_type}</p>}
                  </div>
                  {detailOwner && (
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(detailOwner.status || "ACTIVE")}`}>
                      {(typeof detailOwner.status === "string" ? detailOwner.status.toUpperCase() : "ACTIVE")}
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
                    <OwnerDetailSkeleton />
                  </div>
                ) : !detailOwner ? (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <p className="text-slate-500 text-sm">Unable to load owner details.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Owner Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={detailFormData.owner_type || "CLIENT"}
                          onChange={(e) => setDetailFormData({ ...detailFormData, owner_type: e.target.value as OwnerType })}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all disabled:opacity-60"
                          disabled={detailOwner?.is_system === true}
                        >
                          <option value="CLIENT">Client</option>
                          <option value="COMPANY">Company</option>
                          <option value="MAIN">Main</option>
                          {detailOwner?.owner_type === "SYSTEM" && <option value="SYSTEM">System</option>}
                        </select>
                        {detailOwner?.is_system && (
                          <p className="text-xs text-gray-500 mt-1">System owners cannot change type</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Owner Name <span className="text-red-500">*</span>
                        </label>
                        <div>
                          <input
                            type="text"
                            value={detailFormData.name || ""}
                            onChange={(e) =>
                              setDetailFormData({
                                ...detailFormData,
                                name: e.target.value.toUpperCase(),
                              })
                            }
                            className={`uppercase w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all ${
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
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Description
                        </label>
                        <textarea
                          value={detailFormData.description || ""}
                          onChange={(e) => setDetailFormData({ ...detailFormData, description: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                          placeholder="Optional internal notes (e.g., Primary operational account)"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Email
                        </label>
                        <div>
                          <input
                            type="email"
                            value={detailFormData.email || ""}
                            onChange={(e) => setDetailFormData({ ...detailFormData, email: e.target.value })}
                            className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all ${
                              emailError ? "border-red-500" : "border-gray-200"
                            }`}
                          />
                          {emailError && (
                            <p className="text-xs text-red-500 mt-1">{emailError}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={detailFormData.phone || ""}
                          onChange={(e) => setDetailFormData({ ...detailFormData, phone: formatPhoneNumber(e.target.value) })}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Address
                        </label>
                        <textarea
                          value={detailFormData.address || ""}
                          onChange={(e) => setDetailFormData({ ...detailFormData, address: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">
                          Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={(() => {
                            if (!detailFormData.status) return "ACTIVE";
                            const statusStr = String(detailFormData.status).toUpperCase();
                            return statusStr === "ACTIVE" || statusStr === "INACTIVE" || statusStr === "SUSPENDED" ? statusStr : "ACTIVE";
                          })()}
                          onChange={(e) => {
                            const newStatus = e.target.value.toUpperCase() as OwnerStatus;
                            // Ensure only valid statuses can be selected
                            if (newStatus === "ACTIVE" || newStatus === "INACTIVE" || newStatus === "SUSPENDED") {
                              setDetailFormData({ ...detailFormData, status: newStatus });
                            }
                          }}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="SUSPENDED">Suspended</option>
                        </select>
                      </div>
                    </div>

                    {/* Units Section */}
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-base font-semibold text-neutral-900">Units</h3>
                            <p className="text-sm text-neutral-600 mt-0.5">Manage units for this owner</p>
                          </div>
                          <button
                            onClick={() => openUnitForm()}
                            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-[#7B0F2B] text-white hover:bg-[#8B1535] transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Unit
                          </button>
                        </div>

                        {loadingUnits ? (
                          <div className="py-8 flex items-center justify-center">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#7a0f1f]"></div>
                          </div>
                        ) : units.length === 0 ? (
                          <div className="py-8 text-center">
                            <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">No units added yet</p>
                          </div>
                        ) : (
                          <div>
                            <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-0 mb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-2 py-2 text-sm font-bold text-neutral-900">
                                    <div>Unit Name</div>
                                    <div>Property</div>
                                    <div>Status</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="w-20"></div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {units.map((unit) => (
                                <div
                                  key={unit.id}
                                  className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <div className="min-w-0">
                                          <div className="font-semibold text-neutral-900 truncate">{unit.unit_name}</div>
                                          <div className="text-xs text-neutral-500 mt-0.5">Unit Name</div>
                                        </div>
                                        <div className="min-w-0">
                                          <div className="text-sm text-neutral-900 truncate">{unit.property?.name || "—"}</div>
                                          <div className="text-xs text-neutral-500 mt-0.5">Property</div>
                                        </div>
                                        <div className="min-w-0">
                                          <div
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-block ${
                                              unit.status === "ACTIVE" ? "bg-green-100 text-green-700" : 
                                              unit.status === "INACTIVE" ? "bg-gray-100 text-gray-700" : 
                                              "bg-red-100 text-red-700"
                                            }`}
                                          >
                                            {unit.status}
                                          </div>
                                          <div className="text-xs text-neutral-500 mt-0.5">Status</div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <button
                                        onClick={() => openUnitForm(unit)}
                                        className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                                        title="View unit"
                                      >
                                        <Eye className="w-4 h-4 text-gray-600" />
                                      </button>
                                    </div>
                                  </div>
                                  {unit.notes && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                      <div className="text-xs text-neutral-500 mb-1">Notes:</div>
                                      <div className="text-sm text-neutral-700 whitespace-pre-wrap">{unit.notes}</div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                  </div>
                )}
              </div>
              {detailOwner && (
                <div className="sticky bottom-0 bg-white border-t border-gray-100 flex items-center justify-end gap-3 p-5 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                  <button
                    onClick={() => handleSaveOwner(detailFormData)}
                    disabled={savingOwner || !!nameError || !!emailError}
                    className="px-6 py-2.5 rounded-xl font-semibold bg-[#7B0F2B] text-white hover:bg-[#8B1535] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingOwner ? "Saving..." : "Save Changes"}
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
          title="Creating Owner" 
          message="Please wait while we create the owner..." 
        />
      )}

      {showSaveLoading && (
        <LoadingModal 
          isOpen={showSaveLoading} 
          title="Updating Owner" 
          message="Please wait while we update the owner..." 
        />
      )}

      {showUnitLoading && (
        <LoadingModal 
          isOpen={showUnitLoading} 
          title={editingUnit ? "Updating Unit" : "Creating Unit"} 
          message={editingUnit ? "Please wait while we update the unit..." : "Please wait while we create the unit..."} 
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
          title="Failed to Load Owner"
          message={detailLoadError}
          buttonText="Close"
        />
      )}


      <ConfirmationModal
        isOpen={showCreateUnitConfirm}
        onClose={() => setShowCreateUnitConfirm(false)}
        onConfirm={handleSaveUnitConfirm}
        title="Create Unit"
        message={`Are you sure you want to create the unit "${unitFormData.unit_name.trim()}"?`}
        confirmText="Create"
        isLoading={showUnitLoading}
      />

      {/* Unit Form Side Panel */}
      {showUnitForm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-[350ms] opacity-100"
            onClick={closeUnitForm}
            aria-hidden="true"
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-full max-w-md h-screen bg-white z-50 flex flex-col rounded-l-2xl overflow-hidden shadow-2xl"
            style={{
              animation: "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
              boxShadow: "-12px 0 40px rgba(123,15,43,0.12)",
            }}
          >
            <div className="flex-shrink-0 flex items-center justify-between p-5 bg-gradient-to-br from-[#7B0F2B] via-[#8B1535] to-[#5E0C20] text-white">
              <div>
                <h2 className="text-lg font-bold">{editingUnit ? "Edit Unit" : "Add New Unit"}</h2>
                <p className="text-sm text-white/90 mt-0.5">
                  {editingUnit ? "Update unit information" : "Fill in the details below to add a new unit."}
                </p>
              </div>
              <button
                onClick={closeUnitForm}
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
                    Unit Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={unitFormData.unit_name}
                    onChange={(e) => setUnitFormData({ ...unitFormData, unit_name: e.target.value.toUpperCase() })}
                    className="uppercase w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                    placeholder="Enter unit name"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-neutral-900 mb-2">Property</label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                      <input
                        type="text"
                        value={propertySearchQuery}
                        onChange={(e) => {
                          setPropertySearchQuery(e.target.value);
                          setShowPropertyDropdown(true);
                        }}
                        onFocus={() => setShowPropertyDropdown(true)}
                        className="w-full rounded-xl border border-gray-200 px-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                        placeholder="Search properties..."
                      />
                      {unitFormData.property_id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUnitFormData({ ...unitFormData, property_id: null });
                            setPropertySearchQuery("");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {showPropertyDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowPropertyDropdown(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                          {loadingProperties ? (
                            <div className="p-4 text-center text-sm text-gray-500">Loading properties...</div>
                          ) : filteredProperties.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">No properties found</div>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setUnitFormData({ ...unitFormData, property_id: null });
                                  setPropertySearchQuery("");
                                  setShowPropertyDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                  !unitFormData.property_id ? "bg-gray-50" : ""
                                }`}
                              >
                                <div className="font-medium">None (Optional)</div>
                              </button>
                              {filteredProperties.map((property) => (
                                <button
                                  key={property.id}
                                  onClick={() => {
                                    setUnitFormData({ ...unitFormData, property_id: property.id });
                                    setPropertySearchQuery(property.name);
                                    setShowPropertyDropdown(false);
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-t border-gray-100 ${
                                    unitFormData.property_id === property.id ? "bg-gray-50" : ""
                                  }`}
                                >
                                  <div className="font-medium">{property.name}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">{property.property_type}</div>
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {unitFormData.property_id && (
                    <div className="mt-2 text-xs text-gray-600">
                      Selected: {properties.find(p => p.id === unitFormData.property_id)?.name || "Loading..."}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={unitFormData.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as UnitStatus;
                      // Ensure only ACTIVE or INACTIVE can be selected
                      if (newStatus === "ACTIVE" || newStatus === "INACTIVE") {
                        setUnitFormData({ ...unitFormData, status: newStatus });
                      }
                    }}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">Notes</label>
                  <textarea
                    value={unitFormData.notes}
                    onChange={(e) => setUnitFormData({ ...unitFormData, notes: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                    placeholder="Enter any additional notes"
                    rows={3}
                  />
                </div>
                {!editingUnit && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-900 mb-2">Opening Balance (optional)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₱</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={unitFormData.opening_balance}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/,/g, "").replace(/[^\d.]/g, "");
                            if (raw === "" || /^\d*\.?\d{0,2}$/.test(raw)) {
                              setUnitFormData({ ...unitFormData, opening_balance: raw });
                            }
                          }}
                          className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    {unitFormData.opening_balance && parseFloat(String(unitFormData.opening_balance)) > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-900 mb-2">Opening Date</label>
                        <input
                          type="date"
                          value={unitFormData.opening_date}
                          onChange={(e) => setUnitFormData({ ...unitFormData, opening_date: e.target.value })}
                          max={new Date().toISOString().split("T")[0]}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center justify-end gap-3 p-5 border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
              <button
                onClick={closeUnitForm}
                className="px-6 py-2.5 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingUnit) {
                    handleSaveUnit();
                  } else {
                    setShowCreateUnitConfirm(true);
                  }
                }}
                disabled={savingUnit || !unitFormData.unit_name.trim()}
                className="px-6 py-2.5 rounded-xl font-semibold bg-[#7B0F2B] text-white hover:bg-[#8B1535] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingUnit ? "Saving..." : editingUnit ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </>
      )}

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
