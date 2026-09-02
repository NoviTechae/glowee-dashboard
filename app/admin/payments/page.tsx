// app/admin/payments/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  CheckCircle2,
  Eye,
  RefreshCw,
  RotateCcw,
  Search,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import {
  API_BASE,
  authHeaders,
} from "@/lib/api";
import { getToken } from "@/lib/auth";

type PaymentStats = {
  total_revenue: number;
  today_revenue: number;
  month_revenue: number;
  successful_payments: number;
  failed_payments: number;
  refunded_amount: number;
};

type PaymentRow = {
  id: string;
  user_id: number;
  provider: string;
  type: string;
  status: string;

  amount_aed: number;
  fee_aed: number;
  net_amount_aed: number;

  provider_payment_id?: string | null;
  payment_method_type?: string | null;
  card_last4?: string | null;
  card_brand?: string | null;

  booking_id?: string | null;
  gift_id?: string | null;
  wallet_transaction_id?: string | null;

  error_message?: string | null;
  error_code?: string | null;

  created_at: string;
  succeeded_at?: string | null;
  failed_at?: string | null;
  refunded_at?: string | null;

  user_name?: string | null;
  user_phone?: string | null;
  user_email?: string | null;
  salon_name?: string | null;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "authorized", label: "Authorized" },
  { value: "captured", label: "Captured" },
  { value: "succeeded", label: "Succeeded" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  {
    value: "refunded_to_wallet",
    label: "Refunded to wallet",
  },
  { value: "cancelled", label: "Cancelled" },
];

const PROVIDER_OPTIONS = [
  { value: "all", label: "All providers" },
  { value: "tap", label: "Tap" },
  { value: "ziina", label: "Ziina" },
  { value: "apple_pay", label: "Apple Pay" },
  { value: "google_pay", label: "Google Pay" },
  { value: "mada", label: "Mada" },
  { value: "wallet", label: "Wallet" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  {
    value: "wallet_topup",
    label: "Wallet top-up",
  },
  {
    value: "booking_payment",
    label: "Booking payment",
  },
  {
    value: "gift_purchase",
    label: "Gift purchase",
  },
];

function money(value?: number | null) {
  return `AED ${Number(value || 0).toFixed(2)}`;
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

function prettify(value?: string | null) {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function statusClasses(status: string) {
  if (status === "succeeded") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "failed") {
    return "bg-red-50 text-red-700";
  }

  if (
    status === "refunded" ||
    status === "refunded_to_wallet"
  ) {
    return "bg-orange-50 text-orange-700";
  }

  if (status === "pending") {
    return "bg-amber-50 text-amber-700";
  }

  if (
    status === "authorized" ||
    status === "captured"
  ) {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-gray-100 text-gray-600";
}

export default function AdminPaymentsPage() {
  const [stats, setStats] =
    useState<PaymentStats | null>(null);

  const [rows, setRows] =
    useState<PaymentRow[]>([]);

  const [loadingStats, setLoadingStats] =
    useState(true);

  const [loadingRows, setLoadingRows] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [exporting, setExporting] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("all");

  const [provider, setProvider] =
    useState("all");

  const [type, setType] =
    useState("all");

  const [from, setFrom] =
    useState("");

  const [to, setTo] =
    useState("");

  async function loadStats() {
    try {
      setLoadingStats(true);

      const response = await fetch(
        `${API_BASE}/dashboard/admin/payments/stats`,
        {
          headers: authHeaders(),
        }
      );

      const json =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.error ||
            "Failed to load payment stats"
        );
      }

      setStats(json);
    } catch (error: any) {
      setStats(null);

      toast.error(
        error?.message ||
          "Failed to load payment stats"
      );
    } finally {
      setLoadingStats(false);
    }
  }

  async function loadRows() {
    try {
      setLoadingRows(true);

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

      if (provider !== "all") {
        params.set(
          "provider",
          provider
        );
      }

      if (type !== "all") {
        params.set("type", type);
      }

      if (from) {
        params.set("from", from);
      }

      if (to) {
        params.set("to", to);
      }

      params.set("limit", "100");

      const response = await fetch(
        `${API_BASE}/dashboard/admin/payments?${params.toString()}`,
        {
          headers: authHeaders(),
        }
      );

      const json =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.error ||
            "Failed to load payments"
        );
      }

      setRows(
        Array.isArray(json?.data)
          ? json.data
          : []
      );
    } catch (error: any) {
      setRows([]);

      toast.error(
        error?.message ||
          "Failed to load payments"
      );
    } finally {
      setLoadingRows(false);
    }
  }

  async function refreshAll() {
    try {
      setRefreshing(true);

      await Promise.all([
        loadStats(),
        loadRows(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  async function exportCsv() {
    try {
      setExporting(true);

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

      if (provider !== "all") {
        params.set(
          "provider",
          provider
        );
      }

      if (type !== "all") {
        params.set("type", type);
      }

      if (from) {
        params.set("from", from);
      }

      if (to) {
        params.set("to", to);
      }

      const token = getToken();

      const response = await fetch(
        `${API_BASE}/dashboard/admin/payments/export?${params.toString()}`,
        {
          headers: {
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      if (!response.ok) {
        const text =
          await response.text();

        throw new Error(
          text ||
            "Failed to export CSV"
        );
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement("a");

      anchor.href = url;
      anchor.download =
        "payments-export.csv";

      document.body.appendChild(
        anchor
      );

      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(
        url
      );

      toast.success(
        "Payments exported"
      );
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Export failed"
      );
    } finally {
      setExporting(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setStatus("all");
    setProvider("all");
    setType("all");
    setFrom("");
    setTo("");
  }

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    status,
    provider,
    type,
    from,
    to,
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary-600">
            Finance
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            Payments
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor customer transactions,
            payment status and processed volume.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowDownToLine className="h-4 w-4" />

            {exporting
              ? "Exporting..."
              : "Export CSV"}
          </button>

          <button
            type="button"
            onClick={refreshAll}
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Successful volume"
          value={
            loadingStats
              ? "..."
              : money(
                  stats?.total_revenue
                )
          }
          icon={WalletCards}
        />

        <StatCard
          label="This month"
          value={
            loadingStats
              ? "..."
              : money(
                  stats?.month_revenue
                )
          }
          icon={WalletCards}
        />

        <StatCard
          label="Successful payments"
          value={
            loadingStats
              ? "..."
              : String(
                  stats?.successful_payments ||
                    0
                )
          }
          icon={CheckCircle2}
        />

        <StatCard
          label="Refunded"
          value={
            loadingStats
              ? "..."
              : money(
                  stats?.refunded_amount
                )
          }
          icon={RotateCcw}
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(280px,2fr)_1fr_1fr_1fr_1fr_1fr]">
          <div className="flex gap-2">
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
                    loadRows();
                  }
                }}
                placeholder="Transaction, customer or business..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <button
              type="button"
              onClick={loadRows}
              className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
            >
              Search
            </button>
          </div>

          <FilterSelect
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
          />

          <FilterSelect
            value={provider}
            onChange={setProvider}
            options={PROVIDER_OPTIONS}
          />

          <FilterSelect
            value={type}
            onChange={setType}
            options={TYPE_OPTIONS}
          />

          <input
            type="date"
            value={from}
            onChange={(event) =>
              setFrom(
                event.target.value
              )
            }
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />

          <input
            type="date"
            value={to}
            onChange={(event) =>
              setTo(
                event.target.value
              )
            }
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">
            {loadingRows
              ? "Loading payments..."
              : `${rows.length} transaction${
                  rows.length === 1
                    ? ""
                    : "s"
                }`}
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
                  Transaction
                </th>

                <th className="px-5 py-3">
                  Customer
                </th>

                <th className="px-5 py-3">
                  Type
                </th>

                <th className="px-5 py-3">
                  Provider
                </th>

                <th className="px-5 py-3">
                  Amount
                </th>

                <th className="px-5 py-3">
                  Status
                </th>

                <th className="px-5 py-3">
                  Date
                </th>

                <th className="px-5 py-3">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loadingRows ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-16 text-center text-sm text-gray-500"
                  >
                    Loading payments...
                  </td>
                </tr>
              ) : rows.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-16"
                  >
                    <div className="text-center">
                      <WalletCards className="mx-auto h-7 w-7 text-gray-300" />

                      <p className="mt-3 text-sm font-medium text-gray-900">
                        No payments found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Payment transactions
                        will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="align-top"
                  >
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-semibold text-primary-600">
                        {row.id.slice(
                          0,
                          8
                        )}
                      </p>

                      <p className="mt-1 max-w-[170px] truncate text-xs text-gray-400">
                        {row.provider_payment_id ||
                          "No provider ID"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                          {(
                            row.user_name ||
                            "U"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {row.user_name ||
                              "Unknown"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {row.user_phone ||
                              "-"}
                          </p>

                          {row.salon_name && (
                            <p className="mt-1 text-xs text-gray-400">
                              {
                                row.salon_name
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        {prettify(
                          row.type
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {prettify(
                          row.provider
                        )}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {prettify(
                          row.card_brand ||
                            row.payment_method_type
                        )}

                        {row.card_last4
                          ? ` •••• ${row.card_last4}`
                          : ""}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {money(
                          row.amount_aed
                        )}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Fee{" "}
                        {money(
                          row.fee_aed
                        )}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                          row.status
                        )}`}
                      >
                        {prettify(
                          row.status
                        )}
                      </span>

                      {row.error_message && (
                        <p className="mt-2 max-w-[180px] text-xs text-red-600">
                          {
                            row.error_message
                          }
                        </p>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                      {formatDate(
                        row.created_at
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/payments/${row.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Payment refunds are currently not
        processed from this dashboard.
      </p>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
    >
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
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