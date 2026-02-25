"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import SuccessModal from "@/components/ui/SuccessModal";
import LoadingModal from "@/components/ui/LoadingModal";
import FailModal from "@/components/ui/FailModal";

type OwnerType = "COMPANY" | "CLIENT" | "MAIN";

type Owner = {
  id: number;
  owner_code?: string | null;
  owner_type: OwnerType;
  name: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

// Format phone number - strips to digits only for storage/validation
const formatPhoneNumber = (value: string): string => {
  return value.replace(/[^\d+]/g, "");
};

// Validate email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const formatPeso = (value: string) => {
  if (!value) return "";

  const number = parseFloat(value);
  if (isNaN(number)) return "";

  return number.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

interface CreateOwnerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (owner: Owner) => void;
  initialOwnerType?: OwnerType;
  initialName?: string;
  refreshOwners?: () => Promise<void>;
}

export default function CreateOwnerPanel({
  isOpen,
  onClose,
  onSuccess,
  initialOwnerType = "CLIENT",
  initialName = "",
  refreshOwners,
}: CreateOwnerPanelProps) {
  const [panelClosing, setPanelClosing] = useState(false);
  const [formData, setFormData] = useState({
    owner_type: initialOwnerType as OwnerType,
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    opening_balance: "",
    opening_date: new Date().toISOString().split('T')[0],
  });

  // Validation states
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [openingBalanceError, setOpeningBalanceError] = useState<string | null>(null);
  const [openingDateError, setOpeningDateError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [checkingName, setCheckingName] = useState(false);

  // Modal states
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [showCreateLoading, setShowCreateLoading] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [showCreateFail, setShowCreateFail] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [successTitle, setSuccessTitle] = useState("");
  const [failMessage, setFailMessage] = useState("");
  const [failTitle, setFailTitle] = useState("");

  // Reset form when panel opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        owner_type: initialOwnerType,
        name: initialName ? initialName.toUpperCase() : "",
        description: "",
        phone: "",
        email: "",
        address: "",
        opening_balance: "",
        opening_date: new Date().toISOString().split('T')[0],
      });
      setNameError(null);
      setEmailError(null);
      setPhoneError(null);
      setOpeningBalanceError(null);
      setOpeningDateError(null);
      setDescriptionError(null);
      setAddressError(null);
      setCheckingName(false);
      setPanelClosing(false);
    }
  }, [isOpen, initialOwnerType, initialName]);

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

  const closePanel = () => {
    setPanelClosing(true);
    setTimeout(() => {
      onClose();
      setPanelClosing(false);
      setFormData({
        owner_type: initialOwnerType,
        name: "",
        description: "",
        phone: "",
        email: "",
        address: "",
        opening_balance: "",
        opening_date: new Date().toISOString().split('T')[0],
      });
      setNameError(null);
      setEmailError(null);
      setPhoneError(null);
      setOpeningBalanceError(null);
      setOpeningDateError(null);
      setDescriptionError(null);
      setAddressError(null);
      setCheckingName(false);
    }, 350);
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
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleanPhone.length > 20) {
      return "Phone number is too long";
    }
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
    today.setHours(23, 59, 59, 999);
    
    if (isNaN(selectedDate.getTime())) {
      return "Invalid date format";
    }
    if (selectedDate > today) {
      return "Opening date cannot be in the future";
    }
    return null;
  };

  const validateOwnerType = (ownerType: string): string | null => {
    const validTypes = ['CLIENT', 'COMPANY', 'MAIN'];
    if (!ownerType) {
      return "Owner type is required";
    }
    if (!validTypes.includes(ownerType)) {
      return "Invalid owner type selected";
    }
    return null;
  };

  const checkOwnerNameExists = async (name: string) => {
    if (!name.trim()) {
      setNameError(null);
      setCheckingName(false);
      return;
    }

    const nameValidationError = validateName(name);
    if (nameValidationError) {
      setNameError(nameValidationError);
      setCheckingName(false);
      return;
    }

    setCheckingName(true);
    try {
      const url = new URL("/api/accountant/maintenance/owners", window.location.origin);
      url.searchParams.append("search", name.trim());
      const res = await fetch(url.toString());
      const data = await res.json();
      
      if (res.ok && data.success) {
        const ownersList = data.data?.data || data.data || [];
        const matchingOwner = Array.isArray(ownersList) 
          ? ownersList.find((owner: Owner) => 
              owner.name.toLowerCase() === name.trim().toLowerCase()
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
    setShowCreateConfirm(false);
    handleCreateOwner();
  };

  const handleCreateOwner = async () => {
    // Comprehensive validation
    const nameValidationError = validateName(formData.name);
    if (nameValidationError) {
      setFailTitle("Failed to Create Owner");
      setFailMessage(nameValidationError);
      setShowCreateFail(true);
      return;
    }

    const ownerTypeError = validateOwnerType(formData.owner_type);
    if (ownerTypeError) {
      setFailTitle("Failed to Create Owner");
      setFailMessage(ownerTypeError);
      setShowCreateFail(true);
      return;
    }

    const emailValidationError = validateEmail(formData.email);
    if (emailValidationError) {
      setFailTitle("Failed to Create Owner");
      setFailMessage(emailValidationError);
      setShowCreateFail(true);
      return;
    }

    const phoneValidationError = validatePhone(formData.phone);
    if (phoneValidationError) {
      setFailTitle("Failed to Create Owner");
      setFailMessage(phoneValidationError);
      setShowCreateFail(true);
      return;
    }

    const descriptionValidationError = validateDescription(formData.description);
    if (descriptionValidationError) {
      setFailTitle("Failed to Create Owner");
      setFailMessage(descriptionValidationError);
      setShowCreateFail(true);
      return;
    }

    const addressValidationError = validateAddress(formData.address);
    if (addressValidationError) {
      setFailTitle("Failed to Create Owner");
      setFailMessage(addressValidationError);
      setShowCreateFail(true);
      return;
    }

    const openingBalanceValidationError = validateOpeningBalance(formData.opening_balance);
    if (openingBalanceValidationError) {
      setFailTitle("Failed to Create Owner");
      setFailMessage(openingBalanceValidationError);
      setShowCreateFail(true);
      return;
    }

    const hasOpeningBalance = !!(formData.opening_balance && parseFloat(formData.opening_balance) > 0);
    const openingDateValidationError = validateOpeningDate(formData.opening_date, hasOpeningBalance);
    if (openingDateValidationError) {
      setFailTitle("Failed to Create Owner");
      setFailMessage(openingDateValidationError);
      setShowCreateFail(true);
      return;
    }

    // Check for async validation errors
    if (nameError) {
      setFailTitle("Failed to Create Owner");
      setFailMessage(nameError);
      setShowCreateFail(true);
      return;
    }

    if (emailError) {
      setFailTitle("Failed to Create Owner");
      setFailMessage(emailError);
      setShowCreateFail(true);
      return;
    }

    if (checkingName) {
      setFailTitle("Failed to Create Owner");
      setFailMessage("Please wait while we verify the owner name");
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
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          email: formData.email?.trim() || null,
          phone: formData.phone?.trim() || null,
          address: formData.address?.trim() || null,
          opening_balance: formData.opening_balance && parseFloat(formData.opening_balance.replace(/,/g, "")) > 0 
            ? parseFloat(formData.opening_balance.replace(/,/g, "")) 
            : null,
          opening_date: formData.opening_balance && parseFloat(formData.opening_balance.replace(/,/g, "")) > 0 && formData.opening_date
            ? formData.opening_date
            : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh owners list if callback provided
        if (refreshOwners) {
          await refreshOwners();
        }
        
        // Call success callback with created owner
        if (onSuccess && data.data) {
          onSuccess(data.data);
        }
        
        // Close panel and show success
        closePanel();
        setSuccessTitle("Owner Created Successfully");
        setSuccessMessage("The owner has been created successfully.");
        setShowCreateSuccess(true);
      } else {
        setFailTitle("Failed to Create Owner");
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join(", ") 
          : data.message || "Failed to create owner";
        setFailMessage(errorMsg);
        setShowCreateFail(true);
      }
    } catch (error) {
      console.error("Error creating owner:", error);
      setFailTitle("Failed to Create Owner");
      setFailMessage("An error occurred while creating the owner");
      setShowCreateFail(true);
    } finally {
      setShowCreateLoading(false);
    }
  };

  if (!isOpen && !panelClosing) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
          panelClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={closePanel}
        aria-hidden="true"
      />
      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-lg h-screen bg-white z-50 flex flex-col overflow-hidden shadow-2xl"
        style={{
          animation: panelClosing
            ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
            : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "-12px 0 40px rgba(123,15,43,0.12)",
        }}
      >
        <div className="flex-shrink-0 flex items-center justify-between p-5 bg-gradient-to-br from-[#7B0F2B] via-[#8B1535] to-[#5E0C20] text-white">
          <div>
            <h2 className="text-lg font-bold">Create Owner</h2>
            <p className="text-sm text-white/80 mt-0.5">Add a new client, company, or main owner</p>
          </div>
          <button onClick={closePanel} className="p-2 rounded-xl hover:bg-white/20 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Owner Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.owner_type}
                onChange={(e) => setFormData({ ...formData, owner_type: e.target.value as OwnerType })}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all"
              >
                <option value="CLIENT">Client</option>
                <option value="COMPANY">Company</option>
                <option value="MAIN">Main</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Owner Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                className={`uppercase w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all ${
                  nameError ? "border-red-500" : "border-gray-200"
                }`}
                placeholder="e.g., John Doe"
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
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all ${
                  descriptionError ? "border-red-500" : "border-gray-200"
                }`}
                placeholder="Optional internal notes (e.g., Primary operational account)"
                rows={3}
              />
              {descriptionError && (
                <p className="text-xs text-red-500 mt-1">
                  {descriptionError}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all ${
                  emailError ? "border-red-500" : "border-gray-200"
                }`}
                placeholder="e.g., john@example.com"
              />
              {emailError && (
                <p className="text-xs text-red-500 mt-1">{emailError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all ${
                  phoneError ? "border-red-500" : "border-gray-200"
                }`}
                placeholder="e.g., +63 917 123 4567"
              />
              {phoneError && (
                <p className="text-xs text-red-500 mt-1">{phoneError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all ${
                  addressError ? "border-red-500" : "border-gray-200"
                }`}
                placeholder="Enter address"
                rows={3}
              />
              {addressError && (
                <p className="text-xs text-red-500 mt-1">{addressError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Opening Balance
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  ₱
                </span>

                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.opening_balance ? formatPeso(formData.opening_balance) : ""}
                  onChange={(e) => {
                    // Remove commas and peso if pasted
                    const raw = e.target.value.replace(/,/g, "").replace(/[^\d.]/g, "");

                    if (raw === "" || /^\d*\.?\d{0,2}$/.test(raw)) {
                      setFormData({ ...formData, opening_balance: raw });
                    }
                  }}
                  className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all ${
                    openingBalanceError ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="0.00"
                />
              </div>

              {openingBalanceError && (
                <p className="text-xs text-red-500 mt-1">{openingBalanceError}</p>
              )}
            </div>
            {formData.opening_balance && parseFloat(formData.opening_balance) > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  Opening Date
                </label>
                <input
                  type="date"
                  value={formData.opening_date}
                  onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all ${
                    openingDateError ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {openingDateError && (
                  <p className="text-xs text-red-500 mt-1">{openingDateError}</p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center justify-end gap-3 p-5 border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
          <button
            onClick={closePanel}
            className="px-6 py-2.5 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => setShowCreateConfirm(true)}
            disabled={
              showCreateLoading || 
              !!nameError || 
              !!emailError || 
              !!phoneError || 
              !!openingBalanceError || 
              !!openingDateError || 
              !!descriptionError || 
              !!addressError ||
              checkingName ||
              !formData.name.trim() ||
              !formData.owner_type
            }
            className="px-6 py-2.5 rounded-xl font-semibold bg-[#7B0F2B] text-white hover:bg-[#8B1535] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {showCreateLoading ? "Creating..." : "Create Owner"}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCreateConfirm}
        onClose={() => setShowCreateConfirm(false)}
        onConfirm={handleCreateOwnerConfirm}
        title="Create Owner"
        message="Are you sure you want to create this owner?"
        confirmText="Create"
        cancelText="Cancel"
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showCreateSuccess}
        onClose={() => setShowCreateSuccess(false)}
        title={successTitle}
        message={successMessage}
      />

      {/* Loading Modal */}
      <LoadingModal
        isOpen={showCreateLoading}
        title="Creating Owner"
        message="Please wait while we create the owner..."
      />

      {/* Fail Modal */}
      <FailModal
        isOpen={showCreateFail}
        onClose={() => setShowCreateFail(false)}
        title={failTitle}
        message={failMessage}
      />
    </>
  );
}
