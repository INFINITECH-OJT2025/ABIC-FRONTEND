"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Receipt,
  Users,
  Building2,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Activity,
  ScrollText,
} from "lucide-react";
import {
  MaintenancePageLayout,
  MaintenanceFilterCard,
  MaintenanceSectionCard,
  MaintenanceEmptyState,
  MaintenancePagination,
} from "@/components/accountant/maintenance";

interface ActivityLogEntry {
  id: number;
  activity_type: string;
  action: string;
  status: string;
  title: string;
  description: string;
  user_name: string | null;
  user_email: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface Filters {
  activity_type: string;
  action: string;
  status: string;
  date_from: string;
  date_to: string;
}

const getActivityIcon = (type: string) => {
  switch (type?.toUpperCase()) {
    case "TRANSACTION":
      return <Receipt className="w-5 h-5" />;
    case "OWNER":
      return <Users className="w-5 h-5" />;
    case "UNIT":
      return <Building2 className="w-5 h-5" />;
    default:
      return <FileText className="w-5 h-5" />;
  }
};

const getActivityBg = (type: string) =>
  "bg-[#7B0F2B]/15 text-[#7B0F2B] border border-[#7B0F2B]/30";

const getActionIcon = (action: string) => {
  switch (action?.toUpperCase()) {
    case "CREATE":
      return <Plus className="w-3.5 h-3.5" />;
    case "UPDATE":
      return <Pencil className="w-3.5 h-3.5" />;
    case "DELETE":
      return <Trash2 className="w-3.5 h-3.5" />;
    default:
      return <Activity className="w-3.5 h-3.5" />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toUpperCase()) {
    case "SUCCESS":
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case "FAILED":
      return <XCircle className="w-4 h-4 text-red-600" />;
    case "PENDING":
      return <Clock className="w-4 h-4 text-amber-600" />;
    default:
      return <Activity className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status?.toUpperCase()) {
    case "SUCCESS":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "FAILED":
      return "bg-red-50 text-red-700 border-red-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const formatDateTime = (s: string) =>
  new Date(s).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatRelative = (s: string) => {
  const d = new Date(s);
  const now = new Date();
  const ms = now.getTime() - d.getTime();
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDateTime(s);
};

const inputClass =
  "w-full rounded-xl border border-gray-200 px-4 py-2.5 h-10 text-sm outline-none focus:ring-2 focus:ring-[#7B0F2B]/20 focus:border-[#7B0F2B] transition-all";

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    activity_type: "",
    action: "",
    status: "",
    date_from: "",
    date_to: "",
  });

  const hasFilters = useMemo(
    () =>
      !!(
        filters.activity_type ||
        filters.action ||
        filters.status ||
        filters.date_from ||
        filters.date_to
      ),
    [filters]
  );

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), per_page: String(perPage) });
      if (filters.activity_type) params.append("activity_type", filters.activity_type);
      if (filters.action) params.append("action", filters.action);
      if (filters.status) params.append("status", filters.status);
      if (filters.date_from) params.append("date_from", filters.date_from);
      if (filters.date_to) params.append("date_to", filters.date_to);

      const res = await fetch(`/api/accountant/activity-logs?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data ?? []);
        setPagination(data.pagination ?? null);
      } else {
        setLogs([]);
        setPagination(null);
      }
    } catch {
      setLogs([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filters]);

  const handleReset = () => {
    setFilters({
      activity_type: "",
      action: "",
      status: "",
      date_from: "",
      date_to: "",
    });
    setCurrentPage(1);
  };

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  return (
    <MaintenancePageLayout
      header={{
        icon: ScrollText,
        title: "Accountant Log",
        subtitle: "Activity logs across transactions, owners, and units",
      }}
    >
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="sticky top-0 z-20 bg-gray-50 shrink-0 pb-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="px-4 sm:px-6 lg:px-8 mt-6">
            <MaintenanceFilterCard
              title="Activity Logs"
              description="Filter and view system activity"
              hasFilters={hasFilters}
              onReset={handleReset}
              filtersOpen={filtersOpen}
              onToggleFilters={() => setFiltersOpen(!filtersOpen)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Activity Type</label>
                  <select
                    value={filters.activity_type}
                    onChange={(e) => setFilter("activity_type", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">All</option>
                    <option value="TRANSACTION">Transaction</option>
                    <option value="OWNER">Owner</option>
                    <option value="UNIT">Unit</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Action</label>
                  <select
                    value={filters.action}
                    onChange={(e) => setFilter("action", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">All</option>
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilter("status", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">All</option>
                    <option value="SUCCESS">Success</option>
                    <option value="FAILED">Failed</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Date From</label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => setFilter("date_from", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium mb-2 text-gray-900">Date To</label>
                  <input
                    type="date"
                    value={filters.date_to}
                    min={filters.date_from || undefined}
                    onChange={(e) => setFilter("date_to", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </MaintenanceFilterCard>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 mt-6 pb-6">
          <MaintenanceSectionCard>
            <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-5 hover:bg-[#7B0F2B]/5 transition-colors border-l-4 border-l-[#7B0F2B]"
                >
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${getActivityBg(
                      log.activity_type
                    )}`}
                  >
                    {getActivityIcon(log.activity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{log.title}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(
                          log.status
                        )}`}
                      >
                        {getStatusIcon(log.status)}
                        {log.status}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-gray-100 text-gray-600">
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{log.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                      {log.user_name && <span className="font-medium text-gray-600">{log.user_name}</span>}
                      <span>{formatRelative(log.created_at)}</span>
                      <span>{formatDateTime(log.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <MaintenanceEmptyState
                icon={Activity}
                title="No activity logs found"
                description={
                  hasFilters
                    ? "No logs match your current filters. Try adjusting your search criteria."
                    : "Activity logs will appear here when transactions, owners, or units are created or updated."
                }
              />
            )}
            </div>

            {pagination && pagination.last_page > 1 && logs.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <MaintenancePagination
                  paginationMeta={{
                    ...pagination,
                    from: pagination.from ?? 0,
                    to: pagination.to ?? 0,
                  }}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  itemName="entries"
                  variant="simple"
                />
              </div>
            )}
          </MaintenanceSectionCard>
        </div>
      </div>
    </MaintenancePageLayout>
  );
}
