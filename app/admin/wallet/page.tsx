// app/admin/wallet/page.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "lucide-react";
import { API_BASE } from "@/lib/api";
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
  note?: string;
  ref_id?: string;
  created_at: string;
  user_name?: string;
  user_phone?: string;
};

function money(value: number) {
  return `${Number(value || 0).toFixed(0)} AED`;
}

function prettify(value?: string | null) {
  if (!value) return "-";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function WalletAdminPage() {
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [rows, setRows] = useState<WalletRow[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");

  async function loadData() {
    const statsRes = await api.get("/dashboard/admin/wallet/stats");
    setStats(statsRes);

    const rowsRes = await api.get(
      `/dashboard/admin/wallet?search=${search}&type=${type}`
    );
    setRows(rowsRes.data || []);
  }

  async function exportCsv() {
  try {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (type !== "all") params.set("type", type);

    const token = getToken();

    const res = await fetch(
      `${API_BASE}/dashboard/admin/wallet/export?${params.toString()}`,
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
    a.download = "wallet-export.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    alert(err?.message || "Export failed");
  }
}

  useEffect(() => {
    loadData();
  }, [type]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Wallet Ledger</h1>
<button
  onClick={exportCsv}
  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
>
  Export CSV
</button>

      <div className="grid grid-cols-5 gap-4">
        <Card title="Topups" value={money(stats?.total_topups || 0)} />
        <Card title="Spent" value={money(stats?.total_spent || 0)} />
        <Card title="Refunds" value={money(stats?.total_refunds || 0)} />
        <Card title="Gifts Sent" value={money(stats?.total_gifts_sent || 0)} />
        <Card
          title="Gifts Received"
          value={money(stats?.total_gifts_received || 0)}
        />
      </div>

      <div className="bg-white rounded-2xl border p-4 flex gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search user..."
          className="border rounded-xl px-3 py-2 w-full"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border rounded-xl px-3 py-2"
        >
          <option value="all">All</option>
          <option value="topup">Topup</option>
          <option value="spent">Spent</option>
          <option value="refund">Refund</option>
          <option value="gift_sent">Gift Sent</option>
          <option value="gift_received">Gift Received</option>
        </select>

        <button
          onClick={loadData}
          className="bg-violet-600 text-white px-4 rounded-xl"
        >
          Search
        </button>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 text-left text-sm text-gray-500">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Type</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Note</th>
              <th className="p-4">Reference</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
         <td className="p-4">
  <Link
    href={`/admin/wallet/users/${row.user_id}`}
    className="block hover:opacity-80"
  >
    <div className="font-semibold text-gray-900 hover:text-violet-600">
      {row.user_name || "Unknown User"}
    </div>
    <div className="text-xs text-gray-500">
      {row.user_phone || "-"}
    </div>
  </Link>
</td>
                <td className="p-4">{prettify(row.type)}</td>
                <td className="p-4 font-semibold">{money(row.amount_aed)}</td>
                <td className="p-4">{row.note || "-"}</td>
                <td className="p-4">{row.ref_id || "-"}</td>
                <td className="p-4">
                  {new Date(row.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-2xl border p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}