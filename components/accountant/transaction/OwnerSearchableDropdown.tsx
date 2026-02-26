"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, X, Plus } from "lucide-react";
import { Owner } from "./types";

const BORDER = "rgba(0,0,0,0.12)";

interface OwnerSearchableDropdownProps {
  label: string;
  placeholder: string;
  value: number | null;
  searchQuery: string;
  owners: Owner[];
  filteredOwners: Owner[];
  loading: boolean;
  error?: string;
  onSelect: (ownerId: number) => void;
  onClear: () => void;
  onSearchChange: (query: string) => void;
  onShowDropdown: (show: boolean) => void;
  showDropdown: boolean;
  onCreateOwner?: (name: string) => void;
  emptyMessage?: string;
  noResultsMessage?: string;
  required?: boolean;
  /** When "above", dropdown opens upward to avoid being clipped by containers below */
  dropdownPosition?: "below" | "above";
}

export default function OwnerSearchableDropdown({
  label,
  placeholder,
  value,
  searchQuery,
  owners,
  filteredOwners,
  loading,
  error,
  onSelect,
  onClear,
  onSearchChange,
  onShowDropdown,
  showDropdown,
  onCreateOwner,
  emptyMessage = "No owners found",
  noResultsMessage = "No owners found",
  required = true,
  dropdownPosition = "below",
}: OwnerSearchableDropdownProps) {
  const selectedOwner = useMemo(() => {
    return owners.find((o) => o.id === value) || null;
  }, [owners, value]);

  // Update search query when value changes
  useEffect(() => {
    if (selectedOwner && searchQuery !== selectedOwner.name) {
      onSearchChange(selectedOwner.name);
    }
  }, [value, selectedOwner]);

  return (
    <div className="relative" data-field-error={error ? true : undefined}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-gray-900">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            onShowDropdown(true);
          }}
          onFocus={() => onShowDropdown(true)}
          className={`w-full rounded-xl border px-10 py-2.5 h-10 text-sm text-gray-900 outline-none focus:ring-2 disabled:opacity-60 transition-all ${
            error
              ? "border-red-500 bg-red-50 focus:ring-red-500/20 focus:border-red-500"
              : "border-gray-200 bg-white focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B]"
          }`}
        />
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => onShowDropdown(false)}
            />
            <div className={`absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto ${dropdownPosition === "above" ? "bottom-full mb-1" : "mt-1"}`}>
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500">Loading owners...</div>
              ) : filteredOwners.length === 0 ? (
                <div className="p-4">
                  <div className="text-center text-sm text-gray-500 mb-3">
                    {noResultsMessage}
                  </div>
                  {searchQuery.trim() && onCreateOwner && (
                    <button
                      onClick={() => {
                        onCreateOwner(searchQuery.trim());
                        onShowDropdown(false);
                      }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl bg-[#7B0F2B] hover:bg-[#8B1535] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create "{searchQuery.trim()}"
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {filteredOwners.map((owner) => (
                    <button
                      key={owner.id}
                      onClick={() => {
                        onSelect(owner.id);
                        onSearchChange(owner.name);
                        onShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                        value === owner.id ? "bg-[#7a0f1f]/5" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{owner.name}</span>
                        <span className="text-xs text-gray-400 uppercase">{owner.owner_type}</span>
                      </div>
                      {owner.email && (
                        <div className="text-xs text-gray-500 mt-0.5">{owner.email}</div>
                      )}
                    </button>
                  ))}
                  {searchQuery.trim() && onCreateOwner && (
                    <>
                      <div className="border-t" style={{ borderColor: BORDER }}></div>
                      <button
                        onClick={() => {
                          onCreateOwner(searchQuery.trim());
                          onShowDropdown(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#7B0F2B] hover:bg-[#7B0F2B]/10 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Create "{searchQuery.trim()}"
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
