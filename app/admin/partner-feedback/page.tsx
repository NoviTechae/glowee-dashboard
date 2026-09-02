// app/admin/partner-feedback/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Lightbulb,
  MessageSquareMore,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";

type FeedbackType =
  | "feature"
  | "improvement"
  | "problem"
  | "other";

type FeedbackStatus =
  | "new"
  | "reviewing"
  | "planned"
  | "completed"
  | "declined";

type PartnerFeedback = {
  id: string;
  salon_id: string;
  salon_name?: string | null;
  type: FeedbackType;
  title: string;
  message: string;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
};

const statusOptions: {
  value: FeedbackStatus;
  label: string;
}[] = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "planned", label: "Planned" },
  { value: "completed", label: "Completed" },
  { value: "declined", label: "Declined" },
];

const typeLabels: Record<FeedbackType, string> = {
  feature: "Feature",
  improvement: "Improvement",
  problem: "Problem",
  other: "Other",
};

function TypeIcon({
  type,
}: {
  type: FeedbackType;
}) {
  if (type === "feature") {
    return <Lightbulb className="h-4 w-4" />;
  }

  if (type === "improvement") {
    return <Wrench className="h-4 w-4" />;
  }

  if (type === "problem") {
    return <AlertCircle className="h-4 w-4" />;
  }

  return (
    <MessageSquareMore className="h-4 w-4" />
  );
}

export default function AdminPartnerFeedbackPage() {
  const [items, setItems] = useState<
    PartnerFeedback[]
  >([]);

  const [allItems, setAllItems] = useState<
    PartnerFeedback[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [error, setError] = useState<
    string | null
  >(null);

  const [statusFilter, setStatusFilter] =
    useState<FeedbackStatus | "all">("all");

  const [typeFilter, setTypeFilter] =
    useState<FeedbackType | "all">("all");

  async function loadFeedback(
    showRefresh = false
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const params = new URLSearchParams();

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      if (typeFilter !== "all") {
        params.set("type", typeFilter);
      }

      const query = params.toString();

      const [filteredResponse, allResponse] =
        await Promise.all([
          api.get(
            `/dashboard/admin/partner-feedback${
              query ? `?${query}` : ""
            }`
          ),

          api.get(
            "/dashboard/admin/partner-feedback"
          ),
        ]);

      setItems(
        Array.isArray(filteredResponse.data)
          ? filteredResponse.data
          : []
      );

      setAllItems(
        Array.isArray(allResponse.data)
          ? allResponse.data
          : []
      );
    } catch (e: any) {
      const message =
        e?.message ||
        "Failed to load partner feedback.";

      setError(message);
      setItems([]);
      setAllItems([]);

      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter]);

  async function updateStatus(
    id: string,
    status: FeedbackStatus
  ) {
    try {
      setUpdatingId(id);
      setError(null);

      await api.patch(
        `/dashboard/admin/partner-feedback/${id}/status`,
        { status }
      );

      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                updated_at:
                  new Date().toISOString(),
              }
            : item
        )
      );

      setAllItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                updated_at:
                  new Date().toISOString(),
              }
            : item
        )
      );

      toast.success(
        "Feedback status updated"
      );
    } catch (e: any) {
      const message =
        e?.message ||
        "Failed to update feedback status.";

      setError(message);
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  }

  const stats = useMemo(() => {
    return {
      total: allItems.length,

      new: allItems.filter(
        (item) => item.status === "new"
      ).length,

      reviewing: allItems.filter(
        (item) => item.status === "reviewing"
      ).length,

      completed: allItems.filter(
        (item) => item.status === "completed"
      ).length,
    };
  }, [allItems]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary-600">
            Customers
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            Partner Feedback
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Review suggestions,
            improvements and issues shared
            by Glowee partners.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadFeedback(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing
                ? "animate-spin"
                : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total feedback"
          value={stats.total}
          icon={MessageSquareMore}
        />

        <StatCard
          label="New"
          value={stats.new}
          icon={AlertCircle}
        />

        <StatCard
          label="Reviewing"
          value={stats.reviewing}
          icon={Clock3}
        />

        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target
                  .value as FeedbackStatus | "all"
              )
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          >
            <option value="all">
              All statuses
            </option>
            <option value="new">
              New
            </option>
            <option value="reviewing">
              Reviewing
            </option>
            <option value="planned">
              Planned
            </option>
            <option value="completed">
              Completed
            </option>
            <option value="declined">
              Declined
            </option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(
                e.target
                  .value as FeedbackType | "all"
              )
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          >
            <option value="all">
              All types
            </option>
            <option value="feature">
              Features
            </option>
            <option value="improvement">
              Improvements
            </option>
            <option value="problem">
              Problems
            </option>
            <option value="other">
              Other
            </option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <p className="text-sm text-red-800">
            {error}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <div className="text-center">
              <RefreshCw className="mx-auto h-7 w-7 animate-spin text-gray-400" />

              <p className="mt-3 text-sm text-gray-500">
                Loading partner feedback...
              </p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <MessageSquareMore className="h-6 w-6 text-gray-400" />
            </div>

            <h2 className="mt-4 text-sm font-semibold text-gray-900">
              No partner feedback found
            </h2>

            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Feedback submitted by Glowee
              businesses will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <FeedbackRow
                  key={item.id}
                  item={item}
                  updating={
                    updatingId === item.id
                  }
                  onStatusChange={(status) =>
                    updateStatus(
                      item.id,
                      status
                    )
                  }
                />
              ))}
            </div>

            <div className="border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
              Showing {items.length} feedback
              item
              {items.length !== 1 ? "s" : ""}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FeedbackRow({
  item,
  updating,
  onStatusChange,
}: {
  item: PartnerFeedback;
  updating: boolean;
  onStatusChange: (
    status: FeedbackStatus
  ) => void;
}) {
  return (
    <div className="px-5 py-5">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              <TypeIcon type={item.type} />
              {typeLabels[item.type]}
            </span>

            <span className="text-xs text-gray-400">
              {new Date(
                item.created_at
              ).toLocaleDateString()}
            </span>
          </div>

          <h2 className="mt-3 text-base font-semibold text-gray-900">
            {item.title}
          </h2>

          <p className="mt-2 max-w-4xl whitespace-pre-wrap text-sm leading-6 text-gray-600">
            {item.message}
          </p>

          <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
              {(item.salon_name || "B")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-800">
                {item.salon_name ||
                  "Business"}
              </p>

              <p className="text-xs text-gray-400">
                Glowee partner
              </p>
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-52">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
            Status
          </label>

          <select
            value={item.status}
            disabled={updating}
            onChange={(e) =>
              onStatusChange(
                e.target
                  .value as FeedbackStatus
              )
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {statusOptions.map(
              (status) => (
                <option
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </option>
              )
            )}
          </select>

          {updating && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
              <Clock3 className="h-3.5 w-3.5" />
              Updating...
            </p>
          )}

          {!updating &&
            item.status ===
              "completed" && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed
              </p>
            )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
      </div>
    </div>
  );
}