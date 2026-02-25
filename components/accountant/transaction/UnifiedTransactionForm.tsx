"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Search, X, Upload, Info, Eye, Trash2, FileImage, Plus, FileText, Printer, Calendar } from "lucide-react";
import TransactionSuccessModal from "@/components/ui/TransactionSuccessModal";
import LoadingModal from "@/components/ui/LoadingModal";
import FailModal from "@/components/ui/FailModal";
import SuccessModal from "@/components/ui/SuccessModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import CreateOwnerPanel from "@/components/accountant/CreateOwnerPanel";
import {
  OwnerSearchableDropdown,
  TransactionFormFields,
  TransactionTypeUploadSection,
  UnitSearchCreateSection,
  saveReceiptAsImage,
  generateReceiptPDF,
  formatCurrency,
  fuzzyMatch,
  formatDate,
  formatAmount,
  getTransactionTypeLabel,
  type TransactionType,
  type Owner,
  type Unit,
  type Property,
  type TransactionFormData,
  type FieldErrors,
  type SuccessTransactionData,
} from "@/components/accountant/transaction";
import { ImagePreviewPanel } from "@/components/accountant/ledger";
import { compressImage, compressImages } from "./imageCompression";

const BORDER = "rgba(0,0,0,0.12)";

type TransactionMode = "DEPOSIT" | "WITHDRAWAL";

interface UnifiedTransactionFormProps {
  initialMode?: TransactionMode;
}

export default function UnifiedTransactionForm({ initialMode = "DEPOSIT" }: UnifiedTransactionFormProps) {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const [mode, setMode] = useState<TransactionMode>(
    modeParam === "withdrawal" ? "WITHDRAWAL" : initialMode
  );

  useEffect(() => {
    const m = modeParam === "withdrawal" ? "WITHDRAWAL" : initialMode;
    setMode(m);
  }, [modeParam, initialMode]);

  const handleModeChange = (newMode: TransactionMode) => {
    setMode(newMode);
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", newMode === "DEPOSIT" ? "deposit" : "withdrawal");
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  const [voucherMode, setVoucherMode] = useState<"WITH_VOUCHER" | "NO_VOUCHER">("WITH_VOUCHER");
  
  const [formData, setFormData] = useState<TransactionFormData>({
    voucher_date: "",
    voucher_no: "",
    transaction_type: mode === "DEPOSIT" ? "CASH DEPOSIT" : "CASH DEPOSIT",
    instrument_type: "",
    instrument_no: "",
    fund_reference: "",
    person_in_charge: "",
    from_owner_id: null,
    to_owner_id: null,
    unit_id: null,
    unit_name: "",
    particulars: "",
    amount: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [fromOwners, setFromOwners] = useState<Owner[]>([]);
  const [toOwners, setToOwners] = useState<Owner[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [fromOwnerSearchQuery, setFromOwnerSearchQuery] = useState("");
  const [toOwnerSearchQuery, setToOwnerSearchQuery] = useState("");
  const [unitSearchQuery, setUnitSearchQuery] = useState("");
  const [showFromOwnerDropdown, setShowFromOwnerDropdown] = useState(false);
  const [showToOwnerDropdown, setShowToOwnerDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [loadingFromOwners, setLoadingFromOwners] = useState(false);
  const [loadingToOwners, setLoadingToOwners] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);
  const [duplicateFileNames, setDuplicateFileNames] = useState<string[]>([]);
  const [voucherDuplicateError, setVoucherDuplicateError] = useState<string | null>(null);

  // Create Owner Panel State
  const [showCreateOwnerPanel, setShowCreateOwnerPanel] = useState(false);
  const [createOwnerPanelClosing, setCreateOwnerPanelClosing] = useState(false);
  const [createOwnerInitialName, setCreateOwnerInitialName] = useState("");

  // Create Unit Panel State
  const [showCreateUnitPanel, setShowCreateUnitPanel] = useState(false);
  const [showCreateUnitConfirmation, setShowCreateUnitConfirmation] = useState(false);
  const [showCreateUnitLoading, setShowCreateUnitLoading] = useState(false);
  const [showCreateUnitSuccess, setShowCreateUnitSuccess] = useState(false);
  const [showCreateUnitFail, setShowCreateUnitFail] = useState(false);
  const [createUnitFailMessage, setCreateUnitFailMessage] = useState("");
  const [lastCreatedUnitName, setLastCreatedUnitName] = useState("");
  const [createUnitForm, setCreateUnitForm] = useState({
    unit_name: "",
    property_id: null as number | null,
    status: "ACTIVE" as string,
    notes: "",
  });
  const [propertySearchQuery, setPropertySearchQuery] = useState("");

  // Modal States
  const [showCreateTransactionLoading, setShowCreateTransactionLoading] = useState(false);
  const [showCreateTransactionSuccess, setShowCreateTransactionSuccess] = useState(false);
  const [successPanelClosing, setSuccessPanelClosing] = useState(false);
  const [showCreateTransactionFail, setShowCreateTransactionFail] = useState(false);
  const [createTransactionFailMessage, setCreateTransactionFailMessage] = useState("");
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showCreateTransactionConfirmation, setShowCreateTransactionConfirmation] = useState(false);
  const [successTransactionData, setSuccessTransactionData] = useState<SuccessTransactionData | null>(null);
  const [successTransactionId, setSuccessTransactionId] = useState<number | null>(null);
  const [showFilePreviewPanel, setShowFilePreviewPanel] = useState(false);
  const [filePreviewPanelClosing, setFilePreviewPanelClosing] = useState(false);
  const [previewingFileIndex, setPreviewingFileIndex] = useState<number | null>(null);

  // Constants for labels
  const title = mode === "DEPOSIT" ? "Deposit" : "Withdrawal";
  const typeLabel = mode === "DEPOSIT" ? "Deposit Type" : "Withdrawal Type";
  const recordDescription = `Record a new ${title.toLowerCase()} transaction`;
  const noVoucherLabel = mode === "DEPOSIT" ? "No Voucher Deposit" : "No Voucher Withdrawal";
  const actionLabel = mode === "DEPOSIT" ? "Create Deposit" : "Create Withdrawal";

  /* ================= FILTERS ================= */

  const filteredFromOwners = useMemo(() => {
    if (!fromOwnerSearchQuery.trim()) {
      return fromOwners.filter((owner) => {
        const status = typeof owner.status === "string" ? owner.status.toUpperCase() : "ACTIVE";
        return status === "ACTIVE" && owner.owner_type === "MAIN";
      });
    }
    const q = fromOwnerSearchQuery.toLowerCase();
    return fromOwners.filter(
      (owner) => {
        const status = typeof owner.status === "string" ? owner.status.toUpperCase() : "ACTIVE";
        return status === "ACTIVE" &&
          owner.owner_type === "MAIN" &&
          (owner.name?.toLowerCase().includes(q) ||
            owner.email?.toLowerCase().includes(q) ||
            owner.phone?.toLowerCase().includes(q));
      }
    );
  }, [fromOwners, fromOwnerSearchQuery]);

  const filteredToOwners = useMemo(() => {
    let filtered = toOwners.filter((owner) => {
      const status = typeof owner.status === "string" ? owner.status.toUpperCase() : "ACTIVE";
      return status === "ACTIVE" && owner.owner_type !== "MAIN";
    });
    
    if (!toOwnerSearchQuery.trim()) {
      return filtered;
    }
    
    const q = toOwnerSearchQuery.trim();
    return filtered.filter(
      (owner) =>
        fuzzyMatch(owner.name || "", q) ||
        fuzzyMatch(owner.email || "", q) ||
        fuzzyMatch(owner.phone || "", q) ||
        owner.name?.toLowerCase().includes(q.toLowerCase()) ||
        owner.email?.toLowerCase().includes(q.toLowerCase()) ||
        owner.phone?.toLowerCase().includes(q.toLowerCase())
    );
  }, [toOwners, toOwnerSearchQuery]);

  const filteredUnits = useMemo(() => {
    if (!unitSearchQuery.trim()) {
      return units.filter((unit) => unit.status === "ACTIVE");
    }
    
    const q = unitSearchQuery.trim();
    return units.filter(
      (unit) =>
        unit.status === "ACTIVE" &&
        (fuzzyMatch(unit.unit_name || "", q) ||
        unit.unit_name?.toLowerCase().includes(q.toLowerCase()))
    );
  }, [units, unitSearchQuery]);

  /* ================= API FETCHING ================= */

  const fetchFromOwners = async () => {
    setLoadingFromOwners(true);
    try {
      const res = await fetch("/api/accountant/maintenance/owners?status=ACTIVE&per_page=all&owner_type=MAIN");
      const data = await res.json();
      if (res.ok && data.success) {
        const ownersList = data.data?.data || data.data || [];
        const filteredOwners = Array.isArray(ownersList) 
          ? ownersList.filter((owner: Owner) => owner.owner_type !== "SYSTEM")
          : [];
        setFromOwners(filteredOwners);
      } else {
        setFromOwners([]);
      }
    } catch (error) {
      console.error("Error fetching from owners:", error);
      setFromOwners([]);
    } finally {
      setLoadingFromOwners(false);
    }
  };

  const fetchToOwners = async (fromOwnerId?: number | null) => {
    setLoadingToOwners(true);
    try {
      const res = await fetch("/api/accountant/maintenance/owners?status=ACTIVE&per_page=all");
      const data = await res.json();
      if (res.ok && data.success) {
        const ownersList = data.data?.data || data.data || [];
        let filteredOwners = Array.isArray(ownersList) ? ownersList : [];
        
        filteredOwners = filteredOwners.filter((owner: Owner) => {
          return owner.owner_type !== "SYSTEM" && owner.owner_type !== "MAIN";
        });
        
        if (fromOwnerId) {
          filteredOwners = filteredOwners.filter((owner: Owner) => owner.id !== fromOwnerId);
        }
        
        setToOwners(filteredOwners);
      } else {
        setToOwners([]);
      }
    } catch (error) {
      console.error("Error fetching to owners:", error);
      setToOwners([]);
    } finally {
      setLoadingToOwners(false);
    }
  };

  const fetchUnits = async (ownerId?: number | null) => {
    if (!ownerId) {
      setUnits([]);
      return;
    }
    setLoadingUnits(true);
    try {
      const res = await fetch(`/api/accountant/maintenance/units?owner_id=${ownerId}&status=ACTIVE`);
      const data = await res.json();
      if (res.ok && data.success) {
        const unitsList = data.data?.data || data.data || [];
        setUnits(Array.isArray(unitsList) ? unitsList : []);
      } else {
        setUnits([]);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
      setUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  };

  useEffect(() => {
    fetchFromOwners();
    fetchToOwners();
  }, []);

  useEffect(() => {
    fetchToOwners(formData.from_owner_id);
  }, [formData.from_owner_id]);

  useEffect(() => {
    fetchUnits(formData.to_owner_id);
  }, [formData.to_owner_id]);

  useEffect(() => {
    if (formData.from_owner_id && fromOwners.length > 0) {
      const selectedOwner = fromOwners.find(owner => owner.id === formData.from_owner_id);
      if (selectedOwner && fromOwnerSearchQuery !== selectedOwner.name) {
        setFromOwnerSearchQuery(selectedOwner.name);
      }
    } else if (!formData.from_owner_id) {
      setFromOwnerSearchQuery("");
    }
  }, [formData.from_owner_id, fromOwners]);

  useEffect(() => {
    if (formData.to_owner_id && toOwners.length > 0) {
      const selectedOwner = toOwners.find(owner => owner.id === formData.to_owner_id);
      if (selectedOwner && toOwnerSearchQuery !== selectedOwner.name) {
        setToOwnerSearchQuery(selectedOwner.name);
      }
    } else if (!formData.to_owner_id) {
      setToOwnerSearchQuery("");
      setFormData({ ...formData, unit_id: null, unit_name: "" });
      setUnitSearchQuery("");
      setUnits([]);
    }
  }, [formData.to_owner_id, toOwners]);

  useEffect(() => {
    if (formData.unit_id && units.length > 0) {
      const selectedUnit = units.find(unit => unit.id === formData.unit_id);
      if (selectedUnit && unitSearchQuery !== selectedUnit.unit_name) {
        setUnitSearchQuery(selectedUnit.unit_name);
        setFormData({ ...formData, unit_name: selectedUnit.unit_name });
      }
    } else if (!formData.unit_id) {
      setUnitSearchQuery("");
      setFormData({ ...formData, unit_name: "" });
    }
  }, [formData.unit_id, units]);

  /* ================= CONDITIONS ================= */

  const requiresFileUpload =
    formData.transaction_type === "CHEQUE" ||
    formData.transaction_type === "DEPOSIT SLIP";

  const shouldShowAttachments =
    voucherMode === "WITH_VOUCHER" ||
    (voucherMode === "NO_VOUCHER" && requiresFileUpload);

  const shouldShowUploadSection = requiresFileUpload;

  /* ================= HANDLERS ================= */

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setFormData({ ...formData, amount: formatted });
    if (fieldErrors.amount) {
      setFieldErrors({ ...fieldErrors, amount: undefined });
    }
  };

  const handleTransactionTypeChange = (transactionType: TransactionType) => {
    const newFormData = { ...formData, transaction_type: transactionType };
    
    if (transactionType === "CHEQUE" || transactionType === "DEPOSIT SLIP") {
      newFormData.instrument_type = transactionType;
    } else {
      newFormData.instrument_type = "";
      newFormData.instrument_no = "";
      setUploadedFiles([]);
      setFilePreviews([]);
    }
    
    setFormData(newFormData);
  };

  const checkDuplicateFileNames = async (fileNames: string[]): Promise<string[]> => {
    try {
      const res = await fetch("/api/accountant/transactions/check-duplicate-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_names: fileNames }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.has_duplicates) {
        return data.duplicates || [];
      }
      return [];
    } catch (error) {
      console.error("Error checking duplicate file names:", error);
      return [];
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate each file BEFORE processing (1. file type, 2. file size)
    const validFilesToProcess: File[] = [];
    const validationErrors: string[] = [];

    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(`${file.name}: ${error}`);
      } else {
        validFilesToProcess.push(file);
      }
    }

    if (validationErrors.length > 0) {
      setFieldErrors((prev) => ({
        ...prev,
        fileUpload: validationErrors[0], // Show first error
      } as any));
    }

    if (validFilesToProcess.length === 0) return;

    // Clear fileUpload error only when all files passed validation
    if (validationErrors.length === 0) {
      setFieldErrors((prev) => ({ ...prev, fileUpload: undefined } as any));
    }

    // Compress images before processing (optimize upload size)
    const compressedFiles = await compressImages(validFilesToProcess);

    // Check for duplicates immediately after upload
    const fileNames = compressedFiles.map((file) => file.name);
    const duplicates = await checkDuplicateFileNames(fileNames);

    // Separate duplicate and non-duplicate files
    const duplicateFileNamesSet = new Set(duplicates);
    const validFiles: File[] = [];
    const duplicateFiles: File[] = [];

    compressedFiles.forEach((file) => {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      if (duplicateFileNamesSet.has(fileNameWithoutExt)) {
        duplicateFiles.push(file);
      } else {
        validFiles.push(file);
      }
    });

    // Update duplicate file names state (merge with existing duplicates)
    if (duplicateFiles.length > 0) {
      const newDuplicateNames = duplicateFiles.map((file) => file.name.replace(/\.[^/.]+$/, ""));
      setDuplicateFileNames((prev) => [...new Set([...prev, ...newDuplicateNames])]);
    }

    // Add ALL files (both valid and duplicates) so they show in UI with error indicators
    const allFiles = [...validFiles, ...duplicateFiles];
    if (allFiles.length > 0) {
      const newFiles = [...uploadedFiles, ...allFiles];
      setUploadedFiles(newFiles);

      // Generate previews for all files (in order)
      const previewPromises = allFiles.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target?.result as string) || "");
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
          })
      );
      const newPreviews = await Promise.all(previewPromises);
      setFilePreviews((prev) => [...prev, ...newPreviews]);
    }

    // Clear the input
    if (e.target) {
      e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = uploadedFiles[index];
    const fileNameWithoutExt = fileToRemove.name.replace(/\.[^/.]+$/, "");
    
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
    
    // Remove from duplicate list if it was there
    setDuplicateFileNames((prev) => prev.filter((name) => name !== fileNameWithoutExt));
  };

  const openFilePreview = (index: number) => {
    setPreviewingFileIndex(index);
    setShowFilePreviewPanel(true);
  };

  const closeFilePreviewPanel = () => {
    setFilePreviewPanelClosing(true);
    setTimeout(() => {
      setShowFilePreviewPanel(false);
      setPreviewingFileIndex(null);
      setFilePreviewPanelClosing(false);
    }, 200);
  };

  const validateFile = (file: File): string | null => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const ALLOWED_EXTENSIONS = ['jpeg', 'jpg', 'png', 'pdf'];

    // 1. File type first
    const mimeType = file.type.toLowerCase();
    const extension = file.name.toLowerCase().split('.').pop() || '';
    const isValidMimeType = ALLOWED_MIME_TYPES.includes(mimeType);
    const isValidExtension = ALLOWED_EXTENSIONS.includes(extension);
    const isImageMimeType = mimeType.startsWith('image/') && extension === 'png';

    if (!isValidMimeType && !isValidExtension && !isImageMimeType) {
      return "Invalid file type. Only JPEG, JPG, PNG, and PDF files are allowed.";
    }

    // 2. File size
    if (file.size > MAX_FILE_SIZE) {
      return "File exceeds maximum size of 10MB";
    }

    return null;
  };

  const handleVoucherUpload = async (file: File) => {
    // Validate file BEFORE processing (1. file type, 2. file size)
    const validationError = validateFile(file);
    if (validationError) {
      setVoucherDuplicateError(validationError);
      setFieldErrors((prev) => ({ ...prev, voucher_no: validationError }));
      return;
    }

    // Clear any previous errors
    setVoucherDuplicateError(null);
    setFieldErrors((prev) => ({ ...prev, voucher_no: undefined }));
    
    // Compress image before processing (optimize upload size)
    const compressedFile = await compressImage(file);
    
    // Check for duplicates
    const duplicates = await checkDuplicateFileNames([compressedFile.name]);
    
    if (duplicates.length > 0) {
      setVoucherDuplicateError(`File "${compressedFile.name.replace(/\.[^/.]+$/, "")}" already exists`);
      setFieldErrors((prev) => ({ ...prev, voucher_no: `File "${compressedFile.name.replace(/\.[^/.]+$/, "")}" already exists` }));
      return;
    }

    setVoucherFile(compressedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setVoucherPreview(result);
      const fileNameWithoutExt = compressedFile.name.replace(/\.[^/.]+$/, "");
      setFormData((prev) => ({ ...prev, voucher_no: fileNameWithoutExt }));
    };
    reader.readAsDataURL(compressedFile);
  };

  const removeVoucherImage = () => {
    setVoucherFile(null);
    setVoucherPreview(null);
    setVoucherDuplicateError(null);
    setFormData((prev) => ({ ...prev, voucher_no: "" }));
  };

  const prepareTransactionInstrumentsPayload = () => {
    if (!requiresFileUpload) return [];
    
    return uploadedFiles.map((file) => {
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      return {
        instrument_type: formData.transaction_type,
        instrument_no: fileName,
        notes: null,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: FieldErrors = {};

    // Re-check for duplicates before submission (as a final validation)
    if (voucherFile) {
      const voucherDuplicates = await checkDuplicateFileNames([voucherFile.name]);
      if (voucherDuplicates.length > 0) {
        setVoucherDuplicateError(`File "${voucherFile.name.replace(/\.[^/.]+$/, "")}" already exists`);
        errors.voucher_no = `File "${voucherFile.name.replace(/\.[^/.]+$/, "")}" already exists`;
      }
    }

    const requiresFileUpload =
      formData.transaction_type === "CHEQUE" ||
      formData.transaction_type === "DEPOSIT SLIP";

    // Re-check all uploaded files for duplicates before submission
    if (requiresFileUpload && uploadedFiles.length > 0) {
      const fileNames = uploadedFiles.map((file) => file.name);
      const fileDuplicates = await checkDuplicateFileNames(fileNames);
      if (fileDuplicates.length > 0) {
        setDuplicateFileNames(fileDuplicates);
        (errors as any).fileUpload = `Duplicate file names detected: ${fileDuplicates.join(", ")}. Please remove duplicate files before submitting.`;
      }
    }

    if (!formData.from_owner_id) {
      errors.from_owner_id = "Main is required";
    }
    if (!formData.to_owner_id) {
      errors.to_owner_id = "Owner is required";
    }
    if (!formData.amount || parseFloat(formData.amount.replace(/,/g, "")) <= 0) {
      errors.amount = "Amount must be greater than 0";
    }
    if (!formData.particulars.trim()) {
      errors.particulars = "Particulars is required";
    }
    if (formData.particulars.length > 500) {
      errors.particulars = "Particulars must not exceed 500 characters";
    }
    // Validate voucher requirements
    if (voucherMode === "WITH_VOUCHER") {
      if (!voucherFile) {
        errors.voucher_no = "Voucher file is required when voucher mode is selected";
      }
      if (!formData.voucher_date) {
        errors.voucher_date = "Voucher date is required when voucher mode is selected";
      }
    }

    // Validate file upload requirements for CHEQUE and DEPOSIT SLIP
    if (requiresFileUpload && uploadedFiles.length === 0) {
      // Use a custom error key for file upload
      (errors as any).fileUpload = `${formData.transaction_type === "CHEQUE" ? "Cheque" : "Deposit slip"} numbers upload is required`;
    }
    
    // Check for duplicate file names (from state - already checked on upload)
    if (duplicateFileNames.length > 0) {
      (errors as any).fileUpload = `Duplicate file names detected: ${duplicateFileNames.join(", ")}. Please remove duplicate files before submitting.`;
    }

    // Check for voucher duplicate (from state)
    if (voucherDuplicateError) {
      errors.voucher_no = voucherDuplicateError;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Scroll to first error field
      setTimeout(() => {
        // Try to find file upload error first (most important)
        const fileUploadError = document.querySelector('[data-file-upload-error="true"]');
        if (fileUploadError) {
          fileUploadError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          const firstErrorField = document.querySelector('[data-field-error="true"]');
          if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
      return;
    }

    // Show confirmation modal before creating transaction
    setShowCreateTransactionConfirmation(true);
  };

  const handleSubmitConfirm = async () => {
    setShowCreateTransactionConfirmation(false);
    setShowCreateTransactionLoading(true);

    try {
      const endpoint = mode === "DEPOSIT" 
        ? "/api/accountant/transactions/deposit"
        : "/api/accountant/transactions/withdrawal";

      const formDataToSend = new FormData();
      
      const transactionPayload = {
        voucher_date: voucherMode === "WITH_VOUCHER" && formData.voucher_date ? formData.voucher_date : null,
        voucher_no: voucherMode === "WITH_VOUCHER" && formData.voucher_no ? formData.voucher_no : null,
        trans_type: formData.transaction_type,
        from_owner_id: formData.from_owner_id,
        to_owner_id: formData.to_owner_id,
        unit_id: formData.unit_id || null,
        amount: parseFloat(formData.amount.replace(/,/g, "")),
        fund_reference: formData.fund_reference.trim() || null,
        particulars: formData.particulars.trim(),
        person_in_charge: formData.person_in_charge.trim() || null,
      };

      formDataToSend.append("transaction", JSON.stringify(transactionPayload));

      const instruments = prepareTransactionInstrumentsPayload();
      if (instruments.length > 0) {
        formDataToSend.append("instruments", JSON.stringify(instruments));
      }

      const attachments = uploadedFiles.map((file) => ({
        file_name: file.name,
        file_type: file.type,
      }));
      if (attachments.length > 0) {
        formDataToSend.append("attachments", JSON.stringify(attachments));
      }

      if (voucherMode === "WITH_VOUCHER" && voucherFile) {
        formDataToSend.append("voucher", voucherFile);
      }

      // Append uploaded files with proper error handling
      uploadedFiles.forEach((file, index) => {
        try {
          if (file && file instanceof File) {
            formDataToSend.append(`file_${index}`, file);
          } else {
            console.warn(`Invalid file at index ${index}:`, file);
          }
        } catch (error) {
          console.error(`Error appending file at index ${index}:`, error);
        }
      });

      // Log FormData contents for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('FormData contents:', {
          hasTransaction: formDataToSend.has('transaction'),
          hasInstruments: formDataToSend.has('instruments'),
          hasAttachments: formDataToSend.has('attachments'),
          hasVoucher: formDataToSend.has('voucher'),
          fileCount: uploadedFiles.length,
        });
      }

      let res: Response;
      try {
        res = await fetch(endpoint, {
          method: "POST",
          body: formDataToSend,
        });
      } catch (fetchError) {
        console.error('Network error during transaction creation:', fetchError);
        const msg = `Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to server'}`;
        setCreateTransactionFailMessage(msg);
        setShowCreateTransactionFail(true);
        setShowCreateTransactionLoading(false);
        toast.error("Transaction creation failed", { description: msg });
        return;
      }

      let data: any;
      try {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('Failed to parse response:', text);
          const msg = 'Invalid response from server. Please check console for details.';
          setCreateTransactionFailMessage(msg);
          setShowCreateTransactionFail(true);
          setShowCreateTransactionLoading(false);
          toast.error("Transaction creation failed", { description: msg });
          return;
        }
      } catch (error) {
        console.error('Error reading response:', error);
        const msg = 'Failed to read server response.';
        setCreateTransactionFailMessage(msg);
        setShowCreateTransactionFail(true);
        setShowCreateTransactionLoading(false);
        toast.error("Transaction creation failed", { description: msg });
        return;
      }

      if (res.ok && data.success) {
        const transactionId = data.data?.id;
        const fromOwner = fromOwners.find((o) => o.id === formData.from_owner_id);
        const toOwner = toOwners.find((o) => o.id === formData.to_owner_id);

        const successData: SuccessTransactionData = {
          voucherMode,
          voucher_date: formData.voucher_date || undefined,
          voucher_no: formData.voucher_no || undefined,
          transaction_type: formData.transaction_type,
          instrument_no: formData.instrument_no || undefined,
          instrumentNumbers: uploadedFiles.map((f) => f.name.replace(/\.[^/.]+$/, "")),
          fromOwnerName: fromOwner?.name || "",
          toOwnerName: toOwner?.name || "",
          unit_name: formData.unit_name || undefined,
          particulars: formData.particulars || undefined,
          fund_reference: formData.fund_reference || undefined,
          person_in_charge: formData.person_in_charge || undefined,
          attachmentsCount: uploadedFiles.length + (voucherFile ? 1 : 0),
          amount: formData.amount,
        };

        setSuccessTransactionData(successData);
        setSuccessTransactionId(transactionId);
        
        // Hide loading and show success immediately (don't wait for image saving)
        setShowCreateTransactionLoading(false);
        setShowCreateTransactionSuccess(true);

        toast.success("Transaction created successfully", {
          description: `Voucher ${formData.voucher_no || "—"} • ${formatAmount(formData.amount)}`,
        });

        // Save receipt asynchronously in background (don't block UI)
        if (transactionId) {
          // Use setTimeout to ensure it runs after state updates
          setTimeout(() => {
            saveReceiptAsImage(successData, transactionId, mode).catch((error) => {
              console.error("Error saving receipt (non-blocking):", error);
              // Receipt saving failure doesn't affect transaction creation success
            });
          }, 100);
        }
      } else {
        // Log error details for debugging
        console.error('Transaction creation failed:', {
          status: res.status,
          statusText: res.statusText,
          data: data,
          hasFiles: uploadedFiles.length > 0,
          hasVoucher: !!voucherFile,
        });

        // Handle backend validation errors
        if (data.errors) {
          const backendErrors: FieldErrors = {};
          Object.keys(data.errors).forEach((key) => {
            const errorMessages = Array.isArray(data.errors[key]) 
              ? data.errors[key] 
              : [data.errors[key]];
            const errorMsg = errorMessages.join(", ");
            
            // Map backend field names to frontend field names
            if (key === "from_owner_id" || key === "to_owner_id" || key === "amount" || 
                key === "particulars" || key === "voucher_date" || key === "voucher_no") {
              backendErrors[key as keyof FieldErrors] = errorMsg;
            }
          });
          
          if (Object.keys(backendErrors).length > 0) {
            setFieldErrors(backendErrors);
            // Scroll to first error field
            setTimeout(() => {
              const firstErrorField = document.querySelector('[data-field-error="true"]');
              if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          }
        }
        
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join(", ") 
          : data.message || `Failed to create ${title.toLowerCase()}. Status: ${res.status}`;
        setCreateTransactionFailMessage(errorMsg);
        setShowCreateTransactionFail(true);
        toast.error("Transaction creation failed", { description: errorMsg });
      }
    } catch (error) {
      console.error(`Error creating ${title.toLowerCase()}:`, error);
      const msg = `An error occurred while creating the ${title.toLowerCase()}.`;
      setCreateTransactionFailMessage(msg);
      setShowCreateTransactionFail(true);
      toast.error("Transaction creation failed", { description: msg });
    } finally {
      setShowCreateTransactionLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      // Use successTransactionData if available (from success modal), otherwise use current form data
      const dataToPrint = successTransactionData || {
        voucherMode,
        voucher_date: formData.voucher_date || undefined,
        voucher_no: formData.voucher_no || undefined,
        transaction_type: formData.transaction_type,
        instrument_no: formData.instrument_no || undefined,
        instrumentNumbers: getAllInstrumentNumbers(),
        fromOwnerName: fromOwners.find((o) => o.id === formData.from_owner_id)?.name || "",
        toOwnerName: toOwners.find((o) => o.id === formData.to_owner_id)?.name || "",
        unit_name: formData.unit_name || undefined,
        particulars: formData.particulars || undefined,
        fund_reference: formData.fund_reference || undefined,
        person_in_charge: formData.person_in_charge || undefined,
        attachmentsCount: uploadedFiles.length + (voucherFile ? 1 : 0),
        amount: formData.amount,
      };

      // Generate PDF blob
      const pdfBlob = await generateReceiptPDF(dataToPrint, mode);

      // Create object URL and open in new window for printing
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, "_blank");
      
      if (!printWindow) {
        // If popup blocked, try downloading instead
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `transaction-receipt-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pdfUrl);
        return;
      }

      // Wait for PDF to load, then trigger print
      printWindow.addEventListener("load", () => {
        setTimeout(() => {
          try {
            printWindow.print();
          } catch (error) {
            console.error("Error printing PDF:", error);
          }
          // Clean up object URL after a delay
          setTimeout(() => {
            URL.revokeObjectURL(pdfUrl);
          }, 1000);
        }, 500);
      }, { once: true });

      // Fallback: if window doesn't load, clean up after timeout
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 30000);
    } catch (error) {
      console.error("Error generating PDF for print:", error);
      setCreateTransactionFailMessage("Failed to generate PDF for printing. Please try again.");
      setShowCreateTransactionFail(true);
    }
  };

  const handleCreateUnitConfirm = async () => {
    setShowCreateUnitConfirmation(false);
    if (!createUnitForm.unit_name.trim() || !formData.to_owner_id) return;

    setShowCreateUnitLoading(true);
    try {
      const res = await fetch("/api/accountant/maintenance/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: formData.to_owner_id,
          property_id: createUnitForm.property_id || null,
          unit_name: createUnitForm.unit_name.trim().toUpperCase(),
          status: "ACTIVE",
          notes: createUnitForm.notes?.trim() ? createUnitForm.notes.trim().toUpperCase() : null,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const unitName = createUnitForm.unit_name.trim().toUpperCase();
        setLastCreatedUnitName(unitName);
        await fetchUnits(formData.to_owner_id);
        if (data.data?.id) {
          setFormData({ ...formData, unit_id: data.data.id, unit_name: data.data.unit_name });
          setUnitSearchQuery(data.data.unit_name);
        }
        setShowCreateUnitPanel(false);
        setCreateUnitForm({
          unit_name: "",
          property_id: null,
          status: "ACTIVE",
          notes: "",
        });
        setPropertySearchQuery("");
        setShowCreateUnitSuccess(true);
      } else {
        const errorMsg = data.message
          || (data.errors ? (Array.isArray(data.errors) ? data.errors.join(", ") : Object.values(data.errors).flat().join(", ")) : null)
          || "Failed to create unit.";
        setCreateUnitFailMessage(errorMsg);
        setShowCreateUnitFail(true);
      }
    } catch (error) {
      console.error("Error creating unit:", error);
      setCreateUnitFailMessage(error instanceof Error ? error.message : "An error occurred while creating the unit.");
      setShowCreateUnitFail(true);
    } finally {
      setShowCreateUnitLoading(false);
    }
  };

  const resetForm = () => {
    // Close any open dropdowns before resetting
    setShowFromOwnerDropdown(false);
    setShowToOwnerDropdown(false);
    setShowUnitDropdown(false);
    
    setFormData({
      voucher_date: "",
      voucher_no: "",
      transaction_type: "CASH DEPOSIT",
      instrument_type: "",
      instrument_no: "",
      fund_reference: "",
      person_in_charge: "",
      from_owner_id: null,
      to_owner_id: null,
      unit_id: null,
      unit_name: "",
      particulars: "",
      amount: "",
    });
    setFieldErrors({});
    setSuccessTransactionId(null);
    setUploadedFiles([]);
    setFilePreviews([]);
    setVoucherFile(null);
    setVoucherPreview(null);
    setDuplicateFileNames([]);
    setVoucherDuplicateError(null);
    setFromOwnerSearchQuery("");
    setToOwnerSearchQuery("");
    setUnitSearchQuery("");
  };

  const handleResetConfirm = () => {
    resetForm();
    setShowResetConfirmation(false);
  };

  // Get all instrument numbers from uploaded files
  const getAllInstrumentNumbers = (): string[] => {
    const instrumentNumbers: string[] = [];
    uploadedFiles.forEach((file) => {
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      instrumentNumbers.push(fileName);
    });
    if (instrumentNumbers.length === 0 && formData.instrument_no.trim()) {
      instrumentNumbers.push(formData.instrument_no);
    }
    return instrumentNumbers;
  };

  const instrumentNumbers = getAllInstrumentNumbers();
  const fromOwnerName = fromOwners.find((o) => o.id === formData.from_owner_id)?.name || "—";
  const toOwnerName = toOwners.find((o) => o.id === formData.to_owner_id)?.name || "—";

  return (
    <>
      <form onSubmit={handleSubmit} className="h-full flex flex-col relative">
        <div className="flex-1 overflow-y-auto min-h-0 pb-20">
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="grid lg:grid-cols-3 gap-4 lg:gap-6 max-w-[1920px] mx-auto">
              {/* LEFT SIDE - Form Fields */}
              <div className="lg:col-span-2 space-y-4 lg:space-y-6">
                {/* Transaction Type & Voucher Mode Toggles - Compact Side by Side */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Transaction Type Toggle */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <label className="block text-sm font-medium mb-2.5 text-gray-900">
                      Transaction Type <span className="text-red-500">*</span>
                    </label>
                    <div className="inline-flex rounded-md border border-gray-200 overflow-hidden w-full">
                      <button
                        type="button"
                        onClick={() => handleModeChange("DEPOSIT")}
                        className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                          mode === "DEPOSIT"
                            ? "bg-[#7a0f1f] text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Deposit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModeChange("WITHDRAWAL")}
                        className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
                          mode === "WITHDRAWAL"
                            ? "bg-[#7a0f1f] text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Withdrawal
                      </button>
                    </div>
                  </div>

                  {/* Voucher Mode Toggle */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <label className="block text-sm font-medium mb-2.5 text-gray-900">
                      {typeLabel} <span className="text-red-500">*</span>
                    </label>
                    <div className="inline-flex rounded-md border border-gray-200 overflow-hidden w-full">
                      <button
                        type="button"
                        onClick={() => setVoucherMode("WITH_VOUCHER")}
                        className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                          voucherMode === "WITH_VOUCHER"
                            ? "bg-[#7a0f1f] text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        With Voucher
                      </button>
                      <button
                        type="button"
                        onClick={() => setVoucherMode("NO_VOUCHER")}
                        className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
                          voucherMode === "NO_VOUCHER"
                            ? "bg-[#7a0f1f] text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {noVoucherLabel}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Voucher Upload Section */}
                {voucherMode === "WITH_VOUCHER" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Voucher Information</h3>
                    <div className="space-y-6">
                      {/* Voucher Date */}
                      <div data-field-error={fieldErrors.voucher_date ? true : undefined}>
                        <label className="block text-sm font-medium mb-2 text-gray-900">
                          Voucher Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={formData.voucher_date}
                            onChange={(e) => {
                              setFormData({ ...formData, voucher_date: e.target.value });
                              if (fieldErrors.voucher_date) {
                                setFieldErrors({ ...fieldErrors, voucher_date: undefined });
                              }
                            }}
                            className={`w-full rounded-md border pl-10 pr-3 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 disabled:opacity-60 transition-all ${
                              fieldErrors.voucher_date
                                ? "border-red-500 bg-red-50 focus:ring-red-500/20 focus:border-red-500"
                                : "border-gray-200 bg-white focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f]"
                            }`}
                            style={{
                              position: 'relative',
                              zIndex: 1,
                            }}
                            onClick={(e) => {
                              // Ensure calendar opens near the input
                              const input = e.currentTarget;
                              const rect = input.getBoundingClientRect();
                              // Browser will position calendar, but we ensure input is focused
                              input.focus();
                            }}
                          />
                          <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <style jsx>{`
                          input[type="date"]::-webkit-calendar-picker-indicator {
                            cursor: pointer;
                            position: absolute;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            opacity: 0;
                          }
                        `}</style>
                        {fieldErrors.voucher_date && (
                          <p className="mt-1 text-sm text-red-600">{fieldErrors.voucher_date}</p>
                        )}
                      </div>

                      {/* Voucher Upload */}
                      <div data-field-error={fieldErrors.voucher_no || voucherDuplicateError ? true : undefined}>
                        <label className="block text-sm font-medium mb-2 text-gray-900">
                          Voucher Upload <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-4">
                          {voucherFile ? (
                            <div className={`flex items-center gap-4 p-4 border rounded-md ${
                              voucherDuplicateError ? "border-red-500 bg-red-50" : "border-gray-200"
                            }`}>
                              <div className="w-12 h-12 rounded-md border overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                                {voucherPreview ? (
                                  <img src={voucherPreview} alt="Voucher" className="w-full h-full object-cover" />
                                ) : (
                                  <FileText className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`font-semibold truncate ${voucherDuplicateError ? "text-red-700" : "text-neutral-900"}`}>
                                  {voucherFile.name.replace(/\.[^/.]+$/, "")}
                                </div>
                                {voucherDuplicateError && (
                                  <p className="text-xs text-red-600 mt-1">This file already exists</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={removeVoucherImage}
                                className="p-2 rounded-md hover:bg-red-50 transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          ) : (
                            <label
                              htmlFor="voucher-upload"
                              className={`flex flex-col items-center justify-center gap-2 w-full px-4 py-8 rounded-md cursor-pointer border-2 border-dashed transition-colors ${
                                fieldErrors.voucher_no || voucherDuplicateError
                                  ? "border-red-500 bg-red-50 hover:border-red-600 hover:bg-red-100"
                                  : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                              } text-gray-600`}
                            >
                              <Upload className={`w-5 h-5 ${fieldErrors.voucher_no || voucherDuplicateError ? 'text-red-600' : ''}`} />
                              <span className={`text-sm font-medium ${fieldErrors.voucher_no || voucherDuplicateError ? 'text-red-700' : ''}`}>Upload Voucher</span>
                              <span className={`text-xs ${fieldErrors.voucher_no || voucherDuplicateError ? 'text-red-600' : 'text-gray-500'}`}>
                                {fieldErrors.voucher_no || voucherDuplicateError || "Click to browse or drag and drop"}
                              </span>
                              <input
                                id="voucher-upload"
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,application/pdf,.jpeg,.jpg,.png,.pdf"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    await handleVoucherUpload(file);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                        {(fieldErrors.voucher_no || voucherDuplicateError) && (
                          <p className="mt-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                            {fieldErrors.voucher_no || voucherDuplicateError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Details */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                  <h3 className="text-sm font-semibold text-gray-900">Payment Details</h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <TransactionTypeUploadSection
                      formData={formData}
                      shouldShowUploadSection={shouldShowUploadSection}
                      uploadedFiles={uploadedFiles}
                      filePreviews={filePreviews}
                      onTransactionTypeChange={handleTransactionTypeChange}
                      onFileUpload={async (e) => {
                        await handleFileUpload(e);
                        if ((fieldErrors as any).fileUpload) {
                          setFieldErrors({ ...fieldErrors, fileUpload: undefined } as any);
                        }
                      }}
                      onRemoveFile={removeFile}
                      onOpenFilePreview={openFilePreview}
                      fileInputId={`${mode.toLowerCase()}-file-upload`}
                      fileUploadError={(fieldErrors as any).fileUpload}
                      duplicateFileNames={duplicateFileNames}
                    />

                    {/* Main */}
                    <div className="md:col-span-2">
                      <OwnerSearchableDropdown
                  label="Main"
                  placeholder="Search main..."
                  value={formData.from_owner_id}
                  searchQuery={fromOwnerSearchQuery}
                  owners={fromOwners}
                  filteredOwners={filteredFromOwners}
                  loading={loadingFromOwners}
                  error={fieldErrors.from_owner_id}
                  onSelect={(ownerId) => {
                    setFormData({ ...formData, from_owner_id: ownerId });
                    if (fieldErrors.from_owner_id) {
                      setFieldErrors({ ...fieldErrors, from_owner_id: undefined });
                    }
                  }}
                  onClear={() => {
                    setFormData({ ...formData, from_owner_id: null });
                    setFromOwnerSearchQuery("");
                  }}
                  onSearchChange={(query) => {
                    setFromOwnerSearchQuery(query);
                    if (fieldErrors.from_owner_id) {
                      setFieldErrors({ ...fieldErrors, from_owner_id: undefined });
                    }
                  }}
                  onShowDropdown={setShowFromOwnerDropdown}
                  showDropdown={showFromOwnerDropdown}
                        emptyMessage="No main found."
                        noResultsMessage="No main found."
                      />
                    </div>

                    {/* Owner */}
                    <OwnerSearchableDropdown
                label="Owner"
                placeholder="Search owner..."
                value={formData.to_owner_id}
                searchQuery={toOwnerSearchQuery}
                owners={toOwners}
                filteredOwners={filteredToOwners}
                loading={loadingToOwners}
                error={fieldErrors.to_owner_id}
                onSelect={(ownerId) => {
                  setFormData({ ...formData, to_owner_id: ownerId });
                  if (fieldErrors.to_owner_id) {
                    setFieldErrors({ ...fieldErrors, to_owner_id: undefined });
                  }
                }}
                onClear={() => {
                  setFormData({ ...formData, to_owner_id: null });
                  setToOwnerSearchQuery("");
                }}
                onSearchChange={(query) => {
                  setToOwnerSearchQuery(query);
                  if (fieldErrors.to_owner_id) {
                    setFieldErrors({ ...fieldErrors, to_owner_id: undefined });
                  }
                }}
                onShowDropdown={setShowToOwnerDropdown}
                showDropdown={showToOwnerDropdown}
                onCreateOwner={(name) => {
                  setCreateOwnerInitialName(name);
                  setShowCreateOwnerPanel(true);
                }}
                      emptyMessage="No owners found"
                      noResultsMessage="No owners found"
                    />

                    <UnitSearchCreateSection
                formData={formData}
                unitSearchQuery={unitSearchQuery}
                showUnitDropdown={showUnitDropdown}
                loadingUnits={loadingUnits}
                filteredUnits={filteredUnits}
                borderColor={BORDER}
                unitRowBorderClass="border-t"
                onUnitSearchChange={setUnitSearchQuery}
                onShowUnitDropdown={setShowUnitDropdown}
                onClearUnit={() => {
                  setFormData({ ...formData, unit_id: null, unit_name: "" });
                  setUnitSearchQuery("");
                }}
                onSelectUnit={(unit) => {
                  setFormData({ ...formData, unit_id: unit.id, unit_name: unit.unit_name });
                  setUnitSearchQuery(unit.unit_name);
                }}
                onCreateUnit={(unitName) => {
                  setCreateUnitForm({
                    unit_name: unitName,
                    property_id: null,
                    status: "ACTIVE",
                    notes: "",
                  });
                  setPropertySearchQuery("");
                      setShowCreateUnitPanel(true);
                    }}
                  />

                  {/* Amount, Particulars, and Additional Info Fields */}
                  <TransactionFormFields
                    formData={formData}
                    fieldErrors={fieldErrors}
                    voucherMode={voucherMode}
                    excludeVoucherFields={true}
                    onFormDataChange={(data) => setFormData({ ...formData, ...data })}
                    onFieldErrorChange={(errors) => setFieldErrors({ ...fieldErrors, ...errors })}
                    onAmountChange={handleAmountChange}
                  />
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE - Transaction Summary (Floating) */}
              <div className="lg:col-span-1 flex flex-col">
                {/* Uploaded Attachments Section - Not Sticky */}
                {shouldShowAttachments && (uploadedFiles.length > 0 || voucherFile) && (
                  <div className="rounded-md border p-6 bg-white mb-6" style={{ borderColor: BORDER }}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                        Uploaded Attachments
                      </h3>
                      <span className="text-xs text-gray-500">
                        {(uploadedFiles.length + (voucherFile ? 1 : 0))} file{(uploadedFiles.length + (voucherFile ? 1 : 0)) !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Voucher File */}
                      {voucherFile && (
                        <>
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Voucher
                            </p>
                          </div>
                          <div className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow" style={{ borderColor: BORDER }}>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-md border overflow-hidden bg-gray-50 flex items-center justify-center shrink-0" style={{ borderColor: BORDER }}>
                                {voucherPreview && voucherPreview.trim() !== "" ? (
                                  <img src={voucherPreview} alt="Voucher Preview" className="w-full h-full object-cover" />
                                ) : (
                                  <FileText className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-neutral-900 truncate">{voucherFile.name.replace(/\.[^/.]+$/, "")}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewingFileIndex(null);
                                    setShowFilePreviewPanel(true);
                                  }}
                                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                                  title="Preview"
                                >
                                  <Eye className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={removeVoucherImage}
                                  className="p-2 rounded-md hover:bg-red-50 transition-colors"
                                  title="Remove"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Separator */}
                      {voucherFile && uploadedFiles.length > 0 && (
                        <div className="my-4 border-t" style={{ borderColor: BORDER }}></div>
                      )}

                      {/* Payment Attachments */}
                      {uploadedFiles.length > 0 && (
                        <>
                          {voucherFile && (
                            <div className="mb-2">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Payment Attachments
                              </p>
                            </div>
                          )}
                          {uploadedFiles.map((file, index) => {
                            const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                            return (
                              <div
                                key={index}
                                className="rounded-md bg-white border shadow-sm p-4 hover:shadow-md transition-shadow"
                                style={{ borderColor: BORDER }}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-md border overflow-hidden bg-gray-50 flex items-center justify-center shrink-0" style={{ borderColor: BORDER }}>
                                    {filePreviews[index] && filePreviews[index].trim() !== "" ? (
                                      <img src={filePreviews[index]} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                    ) : (
                                      <FileText className="w-6 h-6 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-neutral-900 truncate">{fileNameWithoutExt}</div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => openFilePreview(index)}
                                      className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                                      title="Preview"
                                    >
                                      <Eye className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeFile(index)}
                                      className="p-2 rounded-md hover:bg-red-50 transition-colors"
                                      title="Remove"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Transaction Summary - Sticky */}
                <div className="lg:sticky lg:top-4 lg:self-start lg:w-full">
                  <div
                    className="rounded-md border border-gray-200 overflow-hidden shadow-lg bg-white w-full"
                    data-summary-container
                  >
                    <div className="lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f1f1' }}>
                      {/* Header */}
                      <div className="bg-gradient-to-r from-[#7B0F2B] via-[#8B1535] to-[#A4163A] text-white px-6 py-4 flex items-center justify-between">
                        <h3 className="text-base font-bold text-white uppercase tracking-wide">
                          Transaction Summary
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handlePrint();
                          }}
                          className="p-2 rounded-md hover:bg-white/20 transition-colors cursor-pointer"
                          title="Print"
                        >
                          <Printer className="w-4 h-4 text-white" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="bg-white p-6" data-summary-content>
                        <div className="space-y-4">
                          {/* Deposit/Withdrawal Type */}
                          <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-gray-700 shrink-0">{typeLabel}</span>
                              <span className="text-sm font-semibold text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                {voucherMode === "WITH_VOUCHER" ? "With Voucher" : "No Voucher"}
                              </span>
                            </div>
                          </div>

                          {/* Voucher Information */}
                          {voucherMode === "WITH_VOUCHER" && (formData.voucher_date || formData.voucher_no) && (
                            <div className="space-y-2 pb-3 border-b" style={{ borderColor: BORDER }}>
                              {formData.voucher_date && (
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-xs text-gray-600 shrink-0">Voucher Date</span>
                                  <span className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                    {formatDate(formData.voucher_date)}
                                  </span>
                                </div>
                              )}
                              {formData.voucher_no && (
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-xs text-gray-600 shrink-0">Voucher No.</span>
                                  <span className="text-sm font-medium text-gray-900 font-mono text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                    {formData.voucher_no}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Transaction Type */}
                          <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-gray-700 shrink-0">Transaction Type</span>
                              <span className="text-sm font-semibold text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                {getTransactionTypeLabel(formData.transaction_type)}
                              </span>
                            </div>
                            {(formData.transaction_type === "CHEQUE" || formData.transaction_type === "DEPOSIT SLIP") && instrumentNumbers.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs text-gray-600 mb-1">
                                  {formData.transaction_type === "CHEQUE" ? "Cheque Numbers" : "Deposit Slip Numbers"}
                                </div>
                                <div className="space-y-1">
                                  {instrumentNumbers.map((num, index) => (
                                    <div key={index} className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0">
                                      {num}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Owners */}
                          <div className="space-y-2 pb-3 border-b" style={{ borderColor: BORDER }}>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-gray-700 shrink-0">Main</span>
                              <span className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                {fromOwnerName}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-gray-700 shrink-0">Owner</span>
                              <span className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                {toOwnerName}
                              </span>
                            </div>
                          </div>

                          {/* Unit */}
                          {formData.unit_name && (
                            <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-semibold text-gray-700 shrink-0">Unit</span>
                                <span className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                  {formData.unit_name}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Particulars */}
                          {formData.particulars && (
                            <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                              <div className="space-y-1">
                                <span className="text-xs font-semibold text-gray-700 block">Particulars</span>
                                <p className="text-sm text-gray-900 text-right break-words whitespace-pre-wrap leading-relaxed min-w-0">
                                  {formData.particulars}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Fund Reference */}
                          {formData.fund_reference && (
                            <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-semibold text-gray-700 shrink-0">Fund Reference</span>
                                <span className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                  {formData.fund_reference}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Person in Charge */}
                          {formData.person_in_charge && (
                            <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-semibold text-gray-700 shrink-0">Person in Charge</span>
                                <span className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                  {formData.person_in_charge}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Attachments */}
                          {(uploadedFiles.length > 0 || voucherFile) && (
                            <div className="pb-3 border-b" style={{ borderColor: BORDER }}>
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-semibold text-gray-700 shrink-0">Attachments</span>
                                <span className="text-sm font-medium text-gray-900 text-right break-words whitespace-normal min-w-0 max-w-[65%]">
                                  {(uploadedFiles.length + (voucherFile ? 1 : 0))} file{(uploadedFiles.length + (voucherFile ? 1 : 0)) !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Total Amount */}
                          <div className="pb-3">
                            <div className="bg-gray-100 rounded-md p-4">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-sm font-bold text-gray-900 uppercase tracking-wide shrink-0">
                                  Total Amount
                                </span>
                                <span className="text-2xl font-bold text-right break-words whitespace-normal min-w-0 max-w-[65%]" style={{ color: "#4A081A" }}>
                                  {formatAmount(formData.amount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sticky Footer - Action Buttons */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg z-30 px-4 sm:px-6 py-3 sm:py-4">
          <div className="max-w-[1920px] mx-auto flex justify-end gap-3 relative z-30">
            <button
              type="button"
              onClick={(e) => {
                // Close any open dropdowns
                setShowFromOwnerDropdown(false);
                setShowToOwnerDropdown(false);
                setShowUnitDropdown(false);
                // Show confirmation modal
                setShowResetConfirmation(true);
              }}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm relative z-30"
            >
              Reset
            </button>
            <button
              type="submit"
              onClick={(e) => {
                // Close any open dropdowns before submitting
                setShowFromOwnerDropdown(false);
                setShowToOwnerDropdown(false);
                setShowUnitDropdown(false);
              }}
              className="px-8 py-2.5 text-sm font-semibold text-white bg-[#7a0f1f] rounded-md hover:bg-[#8b1535] transition-all shadow-md hover:shadow-lg relative z-30"
            >
              {actionLabel}
            </button>
          </div>
        </div>
      </form>

      {/* Modals */}
      <ConfirmationModal
        isOpen={showResetConfirmation}
        onClose={() => setShowResetConfirmation(false)}
        onConfirm={handleResetConfirm}
        title="Reset Transaction Form"
        message="Are you sure you want to reset the form? All entered data will be cleared."
        confirmText="Reset"
        cancelText="Cancel"
      />
      <ConfirmationModal
        isOpen={showCreateTransactionConfirmation}
        onClose={() => setShowCreateTransactionConfirmation(false)}
        onConfirm={handleSubmitConfirm}
        title={`Confirm ${title}`}
        message={`Are you sure you want to create this ${title.toLowerCase()} transaction? This action cannot be undone.`}
        confirmText={`Create ${title}`}
        cancelText="Cancel"
      />
      <LoadingModal
        isOpen={showCreateTransactionLoading}
        title={`Creating ${title}...`}
        message={`Please wait while we create the ${title.toLowerCase()}...`}
      />

      <TransactionSuccessModal
        isOpen={showCreateTransactionSuccess}
        isClosing={successPanelClosing}
        onClose={() => {
          setSuccessPanelClosing(true);
          setTimeout(() => {
            setShowCreateTransactionSuccess(false);
            setSuccessPanelClosing(false);
            resetForm();
          }, 350);
        }}
        title={`${title} Created Successfully`}
        message={`The ${title.toLowerCase()} has been created successfully.`}
        voucherTypeLabel={voucherMode === "WITH_VOUCHER" ? "With Voucher" : noVoucherLabel}
        transactionData={successTransactionData!}
        onPrint={handlePrint}
      />

      <FailModal
        isOpen={showCreateTransactionFail}
        onClose={() => setShowCreateTransactionFail(false)}
        title={`Failed to Create ${title}`}
        message={createTransactionFailMessage}
      />

      {/* Unit creation modals */}
      <ConfirmationModal
        isOpen={showCreateUnitConfirmation}
        onClose={() => setShowCreateUnitConfirmation(false)}
        onConfirm={handleCreateUnitConfirm}
        title="Confirm Create Unit"
        message={`Are you sure you want to create unit "${createUnitForm.unit_name.trim().toUpperCase()}"?`}
        confirmText="Create Unit"
        cancelText="Cancel"
      />
      <LoadingModal
        isOpen={showCreateUnitLoading}
        title="Creating Unit..."
        message="Please wait while we create the unit..."
      />
      <SuccessModal
        isOpen={showCreateUnitSuccess}
        onClose={() => setShowCreateUnitSuccess(false)}
        title="Unit Created Successfully"
        message={`Unit "${lastCreatedUnitName}" has been created and added to the form.`}
        buttonText="OK"
      />
      <FailModal
        isOpen={showCreateUnitFail}
        onClose={() => setShowCreateUnitFail(false)}
        title="Failed to Create Unit"
        message={createUnitFailMessage}
      />

      {/* Create Owner Panel */}
      {showCreateOwnerPanel && (
        <CreateOwnerPanel
          isOpen={showCreateOwnerPanel}
          onClose={() => {
            setCreateOwnerPanelClosing(true);
            setTimeout(() => {
              setShowCreateOwnerPanel(false);
              setCreateOwnerPanelClosing(false);
            }, 350);
          }}
          initialName={createOwnerInitialName}
          onSuccess={async (owner) => {
            await fetchToOwners(formData.from_owner_id);
            setFormData({ ...formData, to_owner_id: owner.id });
            setToOwnerSearchQuery(owner.name);
          }}
        />
      )}

      {/* Create Unit Panel - Simplified inline version */}
      {showCreateUnitPanel && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-end">
          <div className="w-full max-w-md h-screen bg-white flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
              <h2 className="text-lg font-bold">Create Unit</h2>
              <button
                onClick={() => {
                  setShowCreateUnitPanel(false);
                  setCreateUnitForm({
                    unit_name: "",
                    property_id: null,
                    status: "ACTIVE",
                    notes: "",
                  });
                  setPropertySearchQuery("");
                }}
                className="p-2 rounded-md hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Unit Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createUnitForm.unit_name}
                    onChange={(e) => setCreateUnitForm({ ...createUnitForm, unit_name: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                    style={{ borderColor: BORDER }}
                    placeholder="Enter unit name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={createUnitForm.notes}
                    onChange={(e) => setCreateUnitForm({ ...createUnitForm, notes: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
                    style={{ borderColor: BORDER }}
                    placeholder="Enter any additional notes"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: BORDER }}>
              <button
                onClick={() => {
                  setShowCreateUnitPanel(false);
                  setCreateUnitForm({
                    unit_name: "",
                    property_id: null,
                    status: "ACTIVE",
                    notes: "",
                  });
                  setPropertySearchQuery("");
                }}
                className="px-6 py-2.5 rounded-md font-semibold border-2 hover:bg-slate-50 transition-colors"
                style={{ borderColor: BORDER }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!createUnitForm.unit_name.trim() || !formData.to_owner_id) return;
                  setShowCreateUnitConfirmation(true);
                }}
                disabled={!createUnitForm.unit_name.trim() || !formData.to_owner_id}
                className="px-6 py-2.5 rounded-md font-bold text-white hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "#7a0f1f" }}
              >
                Create Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Panel */}
      <ImagePreviewPanel
        open={showFilePreviewPanel}
        closing={filePreviewPanelClosing}
        onClose={closeFilePreviewPanel}
        imageUrl={
          previewingFileIndex === null
            ? voucherPreview
            : previewingFileIndex >= 0 && filePreviews[previewingFileIndex]
              ? filePreviews[previewingFileIndex]
              : null
        }
        imageName={
          previewingFileIndex === null
            ? voucherFile?.name ?? "Voucher"
            : previewingFileIndex >= 0 && uploadedFiles[previewingFileIndex]
              ? uploadedFiles[previewingFileIndex].name
              : "Attachment"
        }
        isVoucher={previewingFileIndex === null}
        loading={false}
        error={null}
        fileType={null}
        attachmentUrl={
          previewingFileIndex === null
            ? voucherPreview
            : previewingFileIndex >= 0 && filePreviews[previewingFileIndex]
              ? filePreviews[previewingFileIndex]
              : null
        }
      />
    </>
  );
}
