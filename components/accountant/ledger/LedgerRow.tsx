"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { formatCurrency, renderParticularsWithBoldUnit } from "./helpers";

/** Shows hover tooltip only when content is truncated */
function TruncateTooltip({
  content,
  tooltipContent,
  className = "",
  tooltipClassName = "whitespace-nowrap",
}: {
  content: React.ReactNode;
  tooltipContent: React.ReactNode;
  className?: string;
  tooltipClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const checkTruncation = () => {
    const el = ref.current;
    if (!el) return;
    setIsTruncated(el.scrollWidth > el.clientWidth);
  };

  useEffect(() => {
    checkTruncation();
    const ro = new ResizeObserver(checkTruncation);
    const el = ref.current;
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [content, tooltipContent]);

  return (
    <div className={`relative group w-full ${className}`}>
      <div ref={ref} className="truncate block w-full overflow-hidden">
        {content}
      </div>
      {isTruncated && (
        <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-[9999] ${tooltipClassName}`}>
          {tooltipContent}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

export type InstrumentAttachment = {
  instrumentNo: string;
  instrumentType: string;
  attachmentUrl: string;
};
      const popoverMinWidth = 180;

      const popoverMaxHeight = 280;
export type LedgerRow = {
  createdAt: string;
  voucherDate: string;
  isVoucherDate?: boolean;
  voucherNo: string;
  transType: string;
  owner: string;
  particulars: string;
  deposit: number;
  withdrawal: number;
  outsBalance: number;
  transferGroupId?: string | null;
  voucherAttachmentUrl?: string | null;
  instrumentAttachments?: InstrumentAttachment[];
  fundReference?: string | null;
  personInCharge?: string | null;
  otherOwnerId?: number | null;
  otherOwnerType?: string | null;
  transactionId?: number | null;
};

interface LedgerRowProps {
  row: LedgerRow;
  isHighlighted: boolean;
  showAdditionalColumns: boolean;
  onVoucherPreview: (label: string, attachmentUrl: string | null, isVoucher: boolean) => void;
  onOwnerClick: (e: React.MouseEvent, ownerId: number | null | undefined) => void;
  onCardClick?: (row: LedgerRow) => void;
  index?: number;
}

/** Dropdown popover for transaction instruments - white bg, below trigger, clickable items */
function TransactionInstrumentCell({
  row,
  onVoucherPreview,
}: {
  row: LedgerRow;
  onVoucherPreview: (label: string, attachmentUrl: string | null, isVoucher: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = () => {
    if (triggerRef.current && typeof document !== "undefined") {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverMaxWidth = 320;
      const gap = 4;
      let left = rect.left;
      if (left + popoverMaxWidth > window.innerWidth - 16) {
        left = window.innerWidth - popoverMaxWidth - 16;
      }
      if (left < 16) left = 16;
      const top = rect.bottom + gap;
      setPosition({ top, left });
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    updatePosition();
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  const hasInstruments = row.instrumentAttachments && row.instrumentAttachments.length > 0;
  const hasMultipleInstruments = hasInstruments && row.instrumentAttachments!.length > 1;
  const displayText = hasInstruments
    ? row.instrumentAttachments!.map((ia) => ia.instrumentNo).join(", ")
    : row.transType || "—";
  const showDropdown = hasMultipleInstruments;

  const popoverContent = open && showDropdown && typeof document !== "undefined" && createPortal(
    <div
      ref={(el) => { popoverRef.current = el; }}
      className="fixed min-w-[180px] max-w-[min(320px,90vw)] max-h-[min(70vh,280px)] overflow-y-auto py-2 px-2 rounded-lg bg-white shadow-xl border border-gray-200 z-[9999]"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-2 mb-1 border-b border-gray-100">
        <p className="text-xs font-semibold text-[#7B0F2B] uppercase tracking-wider">Transaction Type</p>
      </div>
      <div className="space-y-0.5">
        {hasInstruments ? (
          row.instrumentAttachments!.map((ia, i) => {
            const isClickable = (ia.instrumentType === "CHEQUE" || ia.instrumentType === "DEPOSIT SLIP") && ia.attachmentUrl;
            return (
              <div key={i}>
                {isClickable ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVoucherPreview(`${ia.instrumentType}: ${ia.instrumentNo}`, ia.attachmentUrl, false);
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                  >
                    {ia.instrumentType}: {ia.instrumentNo}
                  </button>
                ) : (
                  <div className="px-3 py-2.5 rounded-lg text-sm text-gray-700">
                    {ia.instrumentType}: {ia.instrumentNo}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="px-3 py-2.5 rounded-lg text-sm text-gray-700">
            {row.transType || "—"}
          </div>
        )}
      </div>
    </div>,
    document.body
  );

  // Single item or no instruments: render inline (no dropdown)
  if (!showDropdown) {
    if (hasInstruments && row.instrumentAttachments!.length === 1) {
      const ia = row.instrumentAttachments![0];
      const isClickable = (ia.instrumentType === "CHEQUE" || ia.instrumentType === "DEPOSIT SLIP") && ia.attachmentUrl;
      return (
        <div className="text-gray-900 truncate block w-full overflow-hidden">
          {isClickable ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onVoucherPreview(`${ia.instrumentType}: ${ia.instrumentNo}`, ia.attachmentUrl, false);
              }}
              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer truncate block w-full text-left"
            >
              {ia.instrumentNo}
            </button>
          ) : (
            <span className="truncate block w-full">{ia.instrumentNo}</span>
          )}
        </div>
      );
    }
    return (
      <span className="truncate block w-full text-gray-900">{row.transType || "—"}</span>
    );
  }

  // Multiple instruments: show dropdown
  return (
    <div
      ref={triggerRef}
      className="relative w-full"
    >
      <button
        type="button"
        onClick={handleTriggerClick}
        className="w-full text-left flex items-center gap-1 min-w-0 group/btn cursor-pointer"
      >
        <span className="truncate flex-1 min-w-0 text-gray-900">
          {displayText}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 group-hover/btn:text-[#7a0f1f] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {popoverContent}
    </div>
  );
}

export function LedgerRowComponent({
  row,
  isHighlighted,
  showAdditionalColumns,
  onVoucherPreview,
  onOwnerClick,
  onCardClick,
  index = 0,
}: LedgerRowProps) {
  const isCardClickable = Boolean(row.otherOwnerId) && Boolean(row.otherOwnerType);
  const isEvenRow = index % 2 === 0;
  const baseBgColor = isEvenRow ? "white" : "rgba(0, 0, 0, 0.02)";

  return (
    <tr
      className={`border-b border-gray-200 transition-colors text-xs ${
        isHighlighted ? "ring-2 ring-[#7a0f1f] ring-inset bg-[#7a0f1f]/5" : ""
      } ${isCardClickable ? "cursor-pointer hover:bg-[#7a0f1f]/5" : ""} ${
        !isHighlighted && !isCardClickable ? "hover:bg-gray-50/80" : ""
      }`}
      style={{
        backgroundColor: isHighlighted ? undefined : baseBgColor,
      }}
      onClick={() => {
        if (isCardClickable && onCardClick) {
          onCardClick(row);
        }
      }}
      ref={(el) => {
        if (isHighlighted && el) {
          setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
        }
      }}
    >
      {/* Voucher Date */}
      <td className="w-[110px] px-4 py-2.5 overflow-visible">
        <TruncateTooltip
          content={
            <>
              <span className={`font-semibold text-gray-900 ${row.isVoucherDate === false ? "italic text-gray-500" : ""}`}>
                {row.voucherDate}
              </span>
              {row.isVoucherDate === false && (
                <span className="ml-1 text-[9px] text-gray-400" title="Created date">*</span>
              )}
            </>
          }
          tooltipContent={row.voucherDate}
        />
      </td>

      {/* Voucher No */}
      <td className="w-[120px] px-4 py-2.5 border-l border-gray-200 overflow-visible">
        {row.voucherAttachmentUrl ? (
          <TruncateTooltip
            content={
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVoucherPreview(row.voucherNo, row.voucherAttachmentUrl!, true);
                }}
                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-semibold block w-full text-left"
              >
                {row.voucherNo}
              </button>
            }
            tooltipContent={row.voucherNo}
          />
        ) : (
          <TruncateTooltip
            content={<span className="font-semibold text-gray-900">{row.voucherNo || "—"}</span>}
            tooltipContent={row.voucherNo || "—"}
          />
        )}
      </td>

      {/* Transaction Instrument */}
      <td className="w-[140px] px-4 py-2.5 border-l border-gray-200 overflow-visible">
        <TransactionInstrumentCell
          row={row}
          onVoucherPreview={onVoucherPreview}
        />
      </td>

      {/* Owner */}
      <td className="w-[120px] px-4 py-2.5 border-l border-gray-200 overflow-visible">
        {row.otherOwnerId ? (
          <TruncateTooltip
            content={
              <button
                onClick={(e) => onOwnerClick(e, row.otherOwnerId)}
                className="text-gray-900 hover:text-[#7a0f1f] hover:underline font-medium cursor-pointer block w-full text-left"
              >
                {row.owner || "—"}
              </button>
            }
            tooltipContent={row.owner || "—"}
          />
        ) : (
          <TruncateTooltip
            content={<span className="text-gray-900">{row.owner || "—"}</span>}
            tooltipContent={row.owner || "—"}
          />
        )}
      </td>

      {/* Particulars or Additional Columns */}
      {showAdditionalColumns ? (
        <>
          <td className="px-4 py-2.5 border-l border-gray-200 overflow-visible">
            <TruncateTooltip
              content={<span className="text-gray-900">{row.fundReference || "—"}</span>}
              tooltipContent={row.fundReference || "—"}
            />
          </td>
          <td className="px-4 py-2.5 border-l border-gray-200 overflow-visible">
            <TruncateTooltip
              content={<span className="text-gray-900">{row.personInCharge || "—"}</span>}
              tooltipContent={row.personInCharge || "—"}
            />
          </td>
        </>
      ) : (
        <td className="px-4 py-2.5 border-l border-gray-200 overflow-visible">
          <TruncateTooltip
            content={<span className="text-gray-900">{renderParticularsWithBoldUnit(row.particulars) || "—"}</span>}
            tooltipContent={row.particulars || "—"}
            tooltipClassName="max-w-xs break-words"
          />
        </td>
      )}

      {/* Deposit */}
      <td className="w-[90px] px-4 py-2.5 text-right border-l border-gray-200 overflow-visible">
        <TruncateTooltip
          content={
            <span className={row.deposit > 0 ? "font-semibold text-green-700" : "text-gray-400"}>
              {row.deposit > 0 ? formatCurrency(row.deposit) : "—"}
            </span>
          }
          tooltipContent={row.deposit > 0 ? formatCurrency(row.deposit) : "—"}
        />
      </td>

      {/* Withdrawal */}
      <td className="w-[90px] px-4 py-2.5 text-right border-l border-gray-200 overflow-visible">
        <TruncateTooltip
          content={
            <span className={row.withdrawal > 0 ? "font-semibold text-red-700" : "text-gray-400"}>
              {row.withdrawal > 0 ? formatCurrency(row.withdrawal) : "—"}
            </span>
          }
          tooltipContent={row.withdrawal > 0 ? formatCurrency(row.withdrawal) : "—"}
        />
      </td>

      {/* Running Balance */}
      <td className="w-[110px] px-4 py-2.5 text-right border-l border-gray-200 overflow-visible">
        <TruncateTooltip
          content={
            <span className={`font-bold ${row.outsBalance < 0 ? "text-red-600" : "text-gray-900"}`}>
              {formatCurrency(row.outsBalance)}
            </span>
          }
          tooltipContent={formatCurrency(row.outsBalance)}
        />
      </td>
    </tr>
  );
}
