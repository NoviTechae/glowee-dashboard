// app/admin/partner-feedback/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Lightbulb,
  MessageSquareMore,
  RefreshCw,
  Wrench,
} from "lucide-react";
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
  salon_name?: string;
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

function TypeIcon({ type }: { type: FeedbackType }) {
  if (type === "feature") {
    return <Lightbulb className="h-4 w-4" />;
  }

  if (type === "improvement") {
    return <Wrench className="h-4 w-4" />;
  }

  if (type === "problem") {
    return <AlertCircle className="h-4 w-4" />;
  }

  return <MessageSquareMore className="h-4 w-4" />;
}

export default function AdminPartnerFeedbackPage() {
  const [items, setItems] = useState<PartnerFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] =
    useState<FeedbackStatus | "all">("all");

  const [typeFilter, setTypeFilter] =
    useState<FeedbackType | "all">("all");

  async function loadFeedback() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      if (typeFilter !== "all") {
        params.set("type", typeFilter);
      }

      const query = params.toString();

      const json = await api.get(
        `/dashboard/admin/partner-feedback${query ? `?${query}` : ""}`
      );

      setItems(json.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load partner feedback.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedback();
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
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (e: any) {
      setError(e?.message || "Failed to update feedback status.");
    } finally {
      setUpdatingId(null);
    }
  }

  const stats = {
    total: items.length,
    new: items.filter((item) => item.status === "new").length,
    reviewing: items.filter((item) => item.status === "reviewing").length,
    planned: items.filter((item) => item.status === "planned").length,
    completed: items.filter((item) => item.status === "completed").length,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Partner Feedback
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Review suggestions, improvements, and issues shared by Glowee partners.
          </p>
        </div>

        <button
          type="button"
          onClick={loadFeedback}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="New" value={stats.new} />
        <StatCard label="Reviewing" value={stats.reviewing} />
        <StatCard label="Planned" value={stats.planned} />
        <StatCard label="Completed" value={stats.completed} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row">
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value as FeedbackStatus | "all"
            )
          }
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-pink-400"
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="reviewing">Reviewing</option>
          <option value="planned">Planned</option>
          <option value="completed">Completed</option>
          <option value="declined">Declined</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(
              e.target.value as FeedbackType | "all"
            )
          }
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-pink-400"
        >
          <option value="all">All types</option>
          <option value="feature">Features</option>
          <option value="improvement">Improvements</option>
          <option value="problem">Problems</option>
          <option value="other">Other</option>
        </select>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-gray-400" />
          <p className="mt-3 text-sm text-gray-500">
            Loading partner feedback...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
          <MessageSquareMore className="mx-auto h-10 w-10 text-gray-300" />

          <p className="mt-3 text-sm font-medium text-gray-700">
            No partner feedback found
          </p>

          <p className="mt-1 text-sm text-gray-400">
            Feedback submitted by businesses will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-200 bg-white p-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                      <TypeIcon type={item.type} />
                      {typeLabels[item.type]}
                    </span>

                    <span className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-semibold text-gray-900">
                    {item.title}
                  </h2>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                    {item.message}
                  </p>

                  <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-50 text-sm font-semibold text-pink-600">
                      {(item.salon_name || "B").charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {item.salon_name || "Business"}
                      </p>

                      <p className="text-xs text-gray-400">
                        Glowee partner
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full shrink-0 lg:w-48">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                    Status
                  </label>

                  <select
                    value={item.status}
                    disabled={updatingId === item.id}
                    onChange={(e) =>
                      updateStatus(
                        item.id,
                        e.target.value as FeedbackStatus
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-pink-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {statusOptions.map((status) => (
                      <option
                        key={status.value}
                        value={status.value}
                      >
                        {status.label}
                      </option>
                    ))}
                  </select>

                  {updatingId === item.id && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock3 className="h-3.5 w-3.5" />
                      Updating...
                    </p>
                  )}

                  {item.status === "completed" && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completed
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}