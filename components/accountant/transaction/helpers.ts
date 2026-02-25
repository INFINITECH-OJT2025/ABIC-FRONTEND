/**
 * Format currency value with commas and decimal places
 */
export const formatCurrency = (value: string): string => {
  const numericValue = value.replace(/[^\d.]/g, "");
  const parts = numericValue.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.length > 1
    ? parts[0] + "." + parts[1].slice(0, 2)
    : parts[0];
};

/**
 * Fuzzy search function - matches characters in order (not necessarily consecutive)
 */
export const fuzzyMatch = (text: string, query: string): boolean => {
  if (!text || !query) return false;
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  let queryIndex = 0;
  
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }
  
  return queryIndex === queryLower.length;
};

/**
 * Format date for display
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Format amount for display (Philippine Peso)
 */
export const formatAmount = (amount: string): string => {
  if (!amount) return "₱ 0.00";
  const numericValue = parseFloat(amount.replace(/,/g, ''));
  if (isNaN(numericValue)) return "₱ 0.00";
  // Use Philippine locale for proper formatting
  return `₱ ${numericValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Get transaction type label
 */
export const getTransactionTypeLabel = (type: string): string => {
  switch (type) {
    case "CHEQUE": return "Cheque";
    case "DEPOSIT SLIP": return "Deposit Slip";
    case "CASH DEPOSIT": return "Cash Deposit";
    case "CHEQUE DEPOSIT": return "Cheque Deposit";
    case "BANK TRANSFER": return "Bank Transfer";
    case "OPENING": return "Opening";
    default: return type || "—";
  }
};
