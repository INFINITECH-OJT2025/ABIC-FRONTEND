"use client";

import React from "react";
import { Search, X, Plus } from "lucide-react";
import type { Unit, TransactionFormData } from "./types";

interface UnitSearchCreateSectionProps {
  formData: TransactionFormData;
  unitSearchQuery: string;
  showUnitDropdown: boolean;
  loadingUnits: boolean;
  filteredUnits: Unit[];
  borderColor: string;
  unitRowBorderClass?: "border-t" | "border-b";
  onUnitSearchChange: (query: string) => void;
  onShowUnitDropdown: (show: boolean) => void;
  onClearUnit: () => void;
  onSelectUnit: (unit: Unit) => void;
  onCreateUnit: (unitName: string) => void;
}

export default function UnitSearchCreateSection({
  formData,
  unitSearchQuery,
  showUnitDropdown,
  loadingUnits,
  filteredUnits,
  borderColor,
  unitRowBorderClass = "border-b",
  onUnitSearchChange,
  onShowUnitDropdown,
  onClearUnit,
  onSelectUnit,
  onCreateUnit,
}: UnitSearchCreateSectionProps) {
  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-2 text-gray-900">Unit</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
        <input
          type="text"
          placeholder={formData.to_owner_id ? "Search unit..." : "Select Owner first"}
          value={unitSearchQuery}
          onChange={(e) => {
            onUnitSearchChange(e.target.value);
            onShowUnitDropdown(true);
          }}
          onFocus={() => {
            if (formData.to_owner_id) onShowUnitDropdown(true);
          }}
          disabled={!formData.to_owner_id}
          className="w-full rounded-md border px-10 py-2 h-10 text-sm text-gray-900 outline-none focus:ring-2 disabled:opacity-60 transition-all border-gray-200 bg-white focus:ring-[#7a0f1f]/20 focus:border-[#7a0f1f] disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        {formData.unit_id && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearUnit();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {showUnitDropdown && formData.to_owner_id && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => onShowUnitDropdown(false)} />
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
              {loadingUnits ? (
                <div className="p-4 text-center text-sm text-gray-500">Loading units...</div>
              ) : filteredUnits.length === 0 ? (
                <div className="p-4">
                  <div className="text-center text-sm text-gray-500 mb-3">No units found</div>
                  {unitSearchQuery.trim() && (
                    <button
                      onClick={() => {
                        onCreateUnit(unitSearchQuery.trim());
                        onShowUnitDropdown(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-95 transition-opacity"
                      style={{ backgroundColor: "#7a0f1f" }}
                    >
                      <Plus className="w-4 h-4" />
                      Create "{unitSearchQuery.trim()}"
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {filteredUnits.map((unit) => (
                    <button
                      key={unit.id}
                      onClick={() => {
                        onSelectUnit(unit);
                        onShowUnitDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#7a0f1f]/10 transition-colors ${unitRowBorderClass} ${
                        formData.unit_id === unit.id ? "bg-[#7a0f1f]/5" : ""
                      }`}
                      style={{ borderColor }}
                    >
                      <div className="font-medium">{unit.unit_name}</div>
                      {unit.notes && <div className="text-xs text-gray-500 mt-0.5">{unit.notes}</div>}
                    </button>
                  ))}
                  {unitSearchQuery.trim() && (
                    <>
                      <div className="border-t" style={{ borderColor }}></div>
                      <button
                        onClick={() => {
                          onCreateUnit(unitSearchQuery.trim());
                          onShowUnitDropdown(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#7a0f1f] hover:bg-[#7a0f1f]/10 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Create "{unitSearchQuery.trim()}"
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
