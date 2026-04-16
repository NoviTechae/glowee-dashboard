// app/admin/payments/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API_BASE, authHeaders } from "@/lib/api";
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
  { value: "cancelled", label: "Cancelled" },
];

const PROVIDER_OPTIONS = [
  { value: "all", label: "All providers" },
  { value: "tap", label: "Tap" },
  { value: "apple_pay", label: "Apple Pay" },
  { value: "google_pay", label: "Google Pay" },
  { value: "mada", label: "Mada" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "wallet_topup", label: "Wallet Topup" },
  { value: "booking_payment", label: "Booking Payment" },
  { value: "gift_purchase", label: "Gift Purchase" },
];

function money(value: number) {
  return `${Number(value || 0).toFixed(0)} AED`;
}

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function statusClasses(status: string) {
  if (status === "succeeded") return "bg-green-50 text-green-700 border-green-200";
  if (status === "failed") return "bg-red-50 text-red-700 border-red-200";
  if (status === "refunded") return "bg-orange-50 text-orange-700 border-orange-200";
  if (status === "pending") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (status === "authorized" || status === "captured") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "cancelled") return "bg-gray-100 text-gray-700 border-gray-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
      {hint ? <div className="mt-2 text-xs text-gray-500">{hint}</div> : null}
    </div>
  );
}

function prettify(value?: string | null) {
  if (!value) return "-";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}



export default function AdminPaymentsPage() {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRows, setLoadingRows] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [provider, setProvider] = useState("all");
  const [type, setType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [refundingId, setRefundingId] = useState<string | null>(null);

  async function loadStats() {
    try {
      setLoadingStats(true);
      const res = await fetch(`${API_BASE}/dashboard/admin/payments/stats`, {
        headers: authHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to load payment stats");
      setStats(json);
    } catch (err) {
      console.error(err);
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }

  async function loadRows() {
    try {
      setLoadingRows(true);

      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status !== "all") params.set("status", status);
      if (provider !== "all") params.set("provider", provider);
      if (type !== "all") params.set("type", type);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("limit", "100");

      const res = await fetch(`${API_BASE}/dashboard/admin/payments?${params.toString()}`, {
        headers: authHeaders(),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to load payments");
      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  }

  async function refundPayment(id: string) {
    const ok = window.confirm("Mark this payment as refunded?");
    if (!ok) return;

    try {
      setRefundingId(id);
      const res = await fetch(`${API_BASE}/dashboard/admin/payments/${id}/refund`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Refund failed");

      await Promise.all([loadStats(), loadRows()]);
    } catch (err: any) {
      alert(err?.message || "Refund failed");
    } finally {
      setRefundingId(null);
    }
  }

  async function exportCsv() {
  try {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status !== "all") params.set("status", status);
    if (provider !== "all") params.set("provider", provider);
    if (type !== "all") params.set("type", type);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const token = getToken();

    const res = await fetch(
      `${API_BASE}/dashboard/admin/payments/export?${params.toString()}`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to export CSV");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments-export.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    alert(err?.message || "Export failed");
  }
}

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadRows();
  }, [status, provider, type, from, to]);

  const totalCount = useMemo(() => rows.length, [rows]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payments</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor transactions, revenue, refunds, and payment health.
            </p>
          </div>

<div className="flex flex-wrap gap-2">
  <button
    onClick={exportCsv}
    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
  >
    Export CSV
  </button>

  <button
    onClick={() => {
      loadStats();
      loadRows();
    }}
    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
  >
    Refresh
  </button>
</div>
            <button
              onClick={() => {
                loadStats();
                loadRows();
              }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard
            label="Total Revenue"
            value={loadingStats ? "..." : money(stats?.total_revenue || 0)}
          />
          <StatCard
            label="Today Revenue"
            value={loadingStats ? "..." : money(stats?.today_revenue || 0)}
          />
          <StatCard
            label="This Month"
            value={loadingStats ? "..." : money(stats?.month_revenue || 0)}
          />
          <StatCard
            label="Successful"
            value={loadingStats ? "..." : String(stats?.successful_payments || 0)}
          />
          <StatCard
            label="Failed"
            value={loadingStats ? "..." : String(stats?.failed_payments || 0)}
          />
          <StatCard
            label="Refunded"
            value={loadingStats ? "..." : money(stats?.refunded_amount || 0)}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Search
              </label>
              <div className="flex gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Transaction, user, charge, salon..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
                />
                <button
                  onClick={loadRows}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Search
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
              >
                {STATUS_OPTIONS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
              >
                {PROVIDER_OPTIONS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
              >
                {TYPE_OPTIONS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                From
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                To
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              {loadingRows ? "Loading payments..." : `${totalCount} transactions`}
            </p>

            <button
              onClick={() => {
                setSearch("");
                setStatus("all");
                setProvider("all");
                setType("all");
                setFrom("");
                setTo("");
                setTimeout(() => loadRows(), 0);
              }}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Reset filters
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 font-semibold">Transaction</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Provider</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loadingRows ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">
                      Loading payments...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">
                      No payment transactions found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-t border-gray-100 align-top">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900">
                          {row.id.slice(0, 8)}...
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {row.provider_payment_id || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{row.user_name || "-"}</div>
                        <div className="mt-1 text-xs text-gray-500">{row.user_phone || "-"}</div>
                        <div className="mt-1 text-xs text-gray-400">{row.salon_name || ""}</div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold capitalize text-gray-700">
{prettify(row.type)}
{prettify(row.provider)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium capitalize text-gray-900">
                          {row.provider.replaceAll("_", " ")}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {row.card_brand || row.payment_method_type || "-"}
                          {row.card_last4 ? ` •••• ${row.card_last4}` : ""}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900">{money(row.amount_aed)}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          Fee: {money(row.fee_aed)} · Net: {money(row.net_amount_aed)}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                        {row.error_message ? (
                          <div className="mt-2 max-w-[220px] text-xs text-red-600">
                            {row.error_message}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        {fmtDate(row.created_at)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/admin/payments/${row.id}`}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            View
                          </Link>

                          {row.status === "succeeded" ? (
                            <button
                              onClick={() => refundPayment(row.id)}
                              disabled={refundingId === row.id}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                            >
                              {refundingId === row.id ? "Refunding..." : "Refund"}
                            </button>
                          ) : null}
                        </div>
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