// app/admin/wallet/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  Eye,
  Gift,
  RefreshCw,
  RotateCcw,
  Search,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { api, API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";

type WalletStats = {
  total_topups: number;
  total_spent: number;
  total_refunds: number;
  total_gifts_sent: number;
  total_gifts_received: number;
};

type WalletRow = {
  id: string;
  user_id: number;
  type: string;
  amount_aed: number;
  note?: string | null;
  ref_id?: string | null;
  created_at: string;
  user_name?: string | null;
  user_phone?: string | null;
  user_email?: string | null;
};

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "topup", label: "Top-up" },
  { value: "spent", label: "Spent" },
  { value: "refund", label: "Refund" },
  { value: "gift_sent", label: "Gift sent" },
  { value: "gift_received", label: "Gift received" },
];

function money(value?: number | null) {
  return `AED ${Number(value || 0).toFixed(2)}`;
}

function prettify(value?: string | null) {
  if (!value) return "-";

  if (value === "topup") return "Top-up";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
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

function typeClasses(type: string) {
  if (type === "topup") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (type === "spent") {
    return "bg-red-50 text-red-700";
  }

  if (type === "refund") {
    return "bg-blue-50 text-blue-700";
  }

  if (type === "gift_sent") {
    return "bg-orange-50 text-orange-700";
  }

  if (type === "gift_received") {
    return "bg-purple-50 text-purple-700";
  }

  return "bg-gray-100 text-gray-600";
}

export default function WalletAdminPage() {
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [rows, setRows] = useState<WalletRow[]>([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRows, setLoadingRows] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");

  async function loadStats() {
    try {
      setLoadingStats(true);

      const response = await api.get(
        "/dashboard/admin/wallet/stats"
      );

      setStats(response);
    } catch (error: any) {
      setStats(null);

      toast.error(
        error?.message || "Failed to load wallet stats"
      );
    } finally {
      setLoadingStats(false);
    }
  }

  async function loadRows() {
    try {
      setLoadingRows(true);

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (type !== "all") {
        params.set("type", type);
      }

      params.set("limit", "100");

      const response = await api.get(
        `/dashboard/admin/wallet?${params.toString()}`
      );

      setRows(
        Array.isArray(response?.data)
          ? response.data
          : []
      );
    } catch (error: any) {
      setRows([]);

      toast.error(
        error?.message || "Failed to load wallet transactions"
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

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (type !== "all") {
        params.set("type", type);
      }

      const token = getToken();

      const response = await fetch(
        `${API_BASE}/dashboard/admin/wallet/export?${params.toString()}`,
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
        const text = await response.text();

        throw new Error(
          text || "Failed to export wallet CSV"
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = "wallet-export.csv";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Wallet exported");
    } catch (error: any) {
      toast.error(
        error?.message || "Export failed"
      );
    } finally {
      setExporting(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setType("all");
  }

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary-600">
            Finance
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            Wallet
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor customer wallet activity,
            credits, spending and gift transfers.
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
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Top-ups"
          value={
            loadingStats
              ? "..."
              : money(stats?.total_topups)
          }
          icon={WalletCards}
        />

        <StatCard
          label="Spent"
          value={
            loadingStats
              ? "..."
              : money(stats?.total_spent)
          }
          icon={WalletCards}
        />

        <StatCard
          label="Refunds"
          value={
            loadingStats
              ? "..."
              : money(stats?.total_refunds)
          }
          icon={RotateCcw}
        />

        <StatCard
          label="Gifts sent"
          value={
            loadingStats
              ? "..."
              : money(stats?.total_gifts_sent)
          }
          icon={Gift}
        />

        <StatCard
          label="Gifts received"
          value={
            loadingStats
              ? "..."
              : money(stats?.total_gifts_received)
          }
          icon={Gift}
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    loadRows();
                  }
                }}
                placeholder="Search customer or transaction ID..."
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

          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value)
            }
            className="min-w-[190px] rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          >
            {TYPE_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">
            {loadingRows
              ? "Loading wallet transactions..."
              : `${rows.length} transaction${
                  rows.length === 1 ? "" : "s"
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

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">
                  Customer
                </th>

                <th className="px-5 py-3">
                  Type
                </th>

                <th className="px-5 py-3">
                  Amount
                </th>

                <th className="px-5 py-3">
                  Note
                </th>

                <th className="px-5 py-3">
                  Reference
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
                    colSpan={7}
                    className="px-5 py-16 text-center text-sm text-gray-500"
                  >
                    Loading wallet transactions...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16"
                  >
                    <div className="text-center">
                      <WalletCards className="mx-auto h-7 w-7 text-gray-300" />

                      <p className="mt-3 text-sm font-medium text-gray-900">
                        No wallet transactions found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Wallet activity will appear here.
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
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                          {(row.user_name || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {row.user_name ||
                              "Unknown customer"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {row.user_phone || "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${typeClasses(
                          row.type
                        )}`}
                      >
                        {prettify(row.type)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {money(row.amount_aed)}
                      </p>
                    </td>

                    <td className="max-w-[240px] px-5 py-4 text-sm text-gray-600">
                      {row.note || "-"}
                    </td>

                    <td className="max-w-[220px] px-5 py-4">
                      <p className="truncate font-mono text-xs text-gray-500">
                        {row.ref_id || "-"}
                      </p>

                      <p className="mt-1 font-mono text-[11px] text-gray-400">
                        {row.id.slice(0, 8)}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                      {formatDate(row.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/wallet/user/${row.user_id}`}
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