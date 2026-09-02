// app/admin/subscriptions/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  RefreshCw,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Subscription = {
  id: string;
  salon_id: string;
  salon_name?: string | null;

  plan_code: string;
  plan_name: string;

  amount_aed: number;
  currency_code?: string | null;
  interval_type?: string | null;

  status: string;

  auto_renew: boolean;
  cancel_at_period_end: boolean;

  trial_ends_at?: string | null;

  current_period_start?: string | null;
  current_period_end?: string | null;

  started_at?: string | null;
  cancelled_at?: string | null;
  ended_at?: string | null;

  created_at: string;
};

type Stats = {
  total: number;
  active: number;
  trial: number;
  past_due: number;
  cancelled: number;
  mrr: number;
  paid_total: number;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "trial", label: "Trial" },
  { value: "active", label: "Active" },
  { value: "past_due", label: "Past due" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
  { value: "inactive", label: "Inactive" },
];

const PLAN_OPTIONS = [
  { value: "all", label: "All plans" },
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
];

function money(value?: number | null) {
  return `AED ${Number(value || 0).toFixed(2)}`;
}

function prettify(value?: string | null) {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dubai",
  });
}

function statusClasses(status: string) {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "trial") {
    return "bg-purple-50 text-purple-700";
  }

  if (status === "past_due") {
    return "bg-red-50 text-red-700";
  }

  if (status === "cancelled") {
    return "bg-gray-100 text-gray-600";
  }

  if (status === "expired") {
    return "bg-orange-50 text-orange-700";
  }

  return "bg-gray-100 text-gray-600";
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>([]);

  const [stats, setStats] =
    useState<Stats | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [markingId, setMarkingId] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("all");

  const [plan, setPlan] =
    useState("all");

  async function request(
    path: string,
    method = "GET",
    body?: any
  ) {
    const token = getToken();

    const response = await fetch(
      `${API_BASE}${path}`,
      {
        method,
        headers: {
          "Content-Type":
            "application/json",

          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },

        ...(body
          ? {
              body: JSON.stringify(body),
            }
          : {}),
      }
    );

    const data = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data?.error || "Request failed"
      );
    }

    return data;
  }

  async function loadAll(
    showRefreshing = false
  ) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params =
        new URLSearchParams();

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      if (status !== "all") {
        params.set("status", status);
      }

      if (plan !== "all") {
        params.set("plan", plan);
      }

      const [subscriptionsResponse, statsResponse] =
        await Promise.all([
          request(
            `/dashboard/admin/subscriptions?${params.toString()}`
          ),

          request(
            "/dashboard/admin/subscriptions/stats"
          ),
        ]);

      setSubscriptions(
        Array.isArray(
          subscriptionsResponse?.data
        )
          ? subscriptionsResponse.data
          : []
      );

      setStats(statsResponse);
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Failed to load subscriptions"
      );

      setSubscriptions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function recordManualPayment(
    subscription: Subscription
  ) {
    const confirmed = window.confirm(
      `Record a manual payment for ${subscription.salon_name || "this business"}?\n\nThis will mark the subscription active for 1 month and create a paid subscription record.\n\nNo money will be charged automatically.`
    );

    if (!confirmed) return;

    try {
      setMarkingId(subscription.id);

      await request(
        `/dashboard/admin/subscriptions/${subscription.id}/mark-paid`,
        "POST",
        {
          months: 1,
          note:
            "Admin recorded manual payment",
        }
      );

      toast.success(
        "Manual payment recorded"
      );

      await loadAll();
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Failed to record manual payment"
      );
    } finally {
      setMarkingId(null);
    }
  }

  function resetFilters() {
    setSearch("");
    setStatus("all");
    setPlan("all");
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, plan]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading subscriptions...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary-600">
            Finance
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            Subscriptions
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor business plans, billing status
            and subscription periods.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAll(true)}
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total subscriptions"
          value={String(
            stats?.total || 0
          )}
          icon={Sparkles}
        />

        <StatCard
          label="Active"
          value={String(
            stats?.active || 0
          )}
          icon={CheckCircle2}
        />

        <StatCard
          label="Trial"
          value={String(
            stats?.trial || 0
          )}
          icon={Clock3}
        />

        <StatCard
          label="Past due"
          value={String(
            stats?.past_due || 0
          )}
          icon={XCircle}
        />

        <StatCard
          label="Recorded payments"
          value={money(
            stats?.paid_total
          )}
          icon={CircleDollarSign}
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    loadAll();
                  }
                }}
                placeholder="Search business, plan or status..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                loadAll()
              }
              className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
            >
              Search
            </button>
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
            className="min-w-[180px] rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          >
            {STATUS_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>

          <select
            value={plan}
            onChange={(event) =>
              setPlan(
                event.target.value
              )
            }
            className="min-w-[180px] rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          >
            {PLAN_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">
            {subscriptions.length} subscription
            {subscriptions.length === 1
              ? ""
              : "s"}
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            Reset filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">
                  Business
                </th>

                <th className="px-5 py-3">
                  Plan
                </th>

                <th className="px-5 py-3">
                  Amount
                </th>

                <th className="px-5 py-3">
                  Status
                </th>

                <th className="px-5 py-3">
                  Period end
                </th>

                <th className="px-5 py-3">
                  Renewal
                </th>

                <th className="px-5 py-3">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {subscriptions.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16"
                  >
                    <div className="text-center">
                      <Sparkles className="mx-auto h-7 w-7 text-gray-300" />

                      <p className="mt-3 text-sm font-medium text-gray-900">
                        No subscriptions found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Business subscription
                        records will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                subscriptions.map(
                  (subscription) => (
                    <tr
                      key={
                        subscription.id
                      }
                      className="align-top"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {subscription.salon_name ||
                            "Unknown business"}
                        </p>

                        <p className="mt-1 font-mono text-[11px] text-gray-400">
                          {subscription.salon_id.slice(
                            0,
                            8
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {subscription.plan_name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {prettify(
                            subscription.plan_code
                          )}

                          {subscription.interval_type
                            ? ` · ${prettify(
                                subscription.interval_type
                              )}`
                            : ""}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-900">
                          {money(
                            subscription.amount_aed
                          )}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {subscription.currency_code ||
                            "AED"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                            subscription.status
                          )}`}
                        >
                          {prettify(
                            subscription.status
                          )}
                        </span>

                        {subscription.cancel_at_period_end ? (
                          <p className="mt-2 text-xs text-orange-600">
                            Cancels at period end
                          </p>
                        ) : null}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {formatDate(
                          subscription.current_period_end
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {subscription.auto_renew
                            ? "Enabled"
                            : "Disabled"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            recordManualPayment(
                              subscription
                            )
                          }
                          disabled={
                            markingId ===
                            subscription.id
                          }
                          className="inline-flex whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                        >
                          {markingId ===
                          subscription.id
                            ? "Recording..."
                            : "Record payment"}
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs leading-5 text-gray-500">
          “Record payment” is for payments collected
          outside the Glowee payment flow. It does not
          charge the business automatically.
        </p>
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
  value: string;
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

          <p className="mt-2 text-xl font-semibold text-gray-900">
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