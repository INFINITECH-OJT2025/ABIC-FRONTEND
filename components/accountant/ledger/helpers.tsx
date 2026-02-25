/**
 * Shared helper functions for ledger pages
 */

import React from "react";

export const formatCurrency = (amount: number, currency: string = "PHP") => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const renderParticularsWithBoldUnit = (particulars: string) => {
  const text = particulars?.trim();
  if (!text) return "";

  const sep = " - ";
  const i = text.indexOf(sep);
  if (i <= 0) return text;

  const unit = text.slice(0, i);
  const rest = text.slice(i);

  return (
    <>
      <span className="font-bold">{unit}</span>
      {rest}
    </>
  );
};

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
