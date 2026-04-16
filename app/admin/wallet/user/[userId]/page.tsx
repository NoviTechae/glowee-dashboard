"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";

type WalletUser = {
  id: number | string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
  is_blocked?: boolean;
  created_at?: string;
  balance_aed: number;
};

type WalletStats = {
  total_topups: number;
  total_spent: number;
  total_refunds: number;
  total_gifts_sent: number;
  total_gifts_received: number;
};

type WalletTransaction = {
  id: string;
  type: string;
  amount_aed: number;
  note?: string | null;
  ref_id?: string | null;
  created_at: string;
};

function money(value?: number | null) {
  return `${Number(value || 0).toFixed(0)} AED`;
}

function prettify(value?: string | null) {
  if (!value) return "-";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function typeClasses(type?: string | null) {
  if (type === "topup") return "bg-green-50 text-green-700 border-green-200";
  if (type === "spent") return "bg-red-50 text-red-700 border-red-200";
  if (type === "refund") return "bg-blue-50 text-blue-700 border-blue-200";
  if (type === "gift_sent") return "bg-orange-50 text-orange-700 border-orange-200";
  if (type === "gift_received") return "bg-purple-50 text-purple-700 border-purple-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

export default function WalletUserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<WalletUser | null>(null);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  const [adjusting, setAdjusting] = useState(false);
  const [adjustAction, setAdjustAction] = useState<"credit" | "debit">("credit");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  async function loadUserWallet() {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/admin/wallet/users/${userId}`);
      setUser(res.user || null);
      setStats(res.stats || null);
      setTransactions(Array.isArray(res.transactions) ? res.transactions : []);
    } catch (error) {
      console.error(error);
      alert("Failed to load wallet details");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdjustWallet() {
    const amount = Number(adjustAmount);

    if (!amount || amount <= 0) {
      alert("Enter a valid amount");
      return;
    }

    try {
      setAdjusting(true);

      await api.post(`/dashboard/admin/wallet/users/${userId}/adjust`, {
        action: adjustAction,
        amount_aed: amount,
        note: adjustNote,
      });

      setAdjustAmount("");
      setAdjustNote("");
      setAdjustAction("credit");

      await loadUserWallet();
      alert("Wallet updated successfully");
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Failed to adjust wallet");
    } finally {
      setAdjusting(false);
    }
  }

  useEffect(() => {
    if (userId) loadUserWallet();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-500 shadow-sm">
          Loading wallet details...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-500 shadow-sm">
          User not found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="mb-4 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                ← Back
              </button>

              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Wallet User Details
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Review wallet balance and full transaction history for this user.
              </p>
            </div>

            <button
              onClick={loadUserWallet}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-5">
                <h2 className="text-lg font-black text-gray-900">User Info</h2>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-2">
                <Info label="User ID" value={String(user.id)} mono />
                <Info label="Wallet Balance" value={money(user.balance_aed)} />
                <Info label="Name" value={user.name || "No name"} />
                <Info label="Phone" value={user.phone || "-"} />
                <Info label="Email" value={user.email || "No email"} />
                <Info label="Joined" value={fmtDate(user.created_at)} />
                <Info label="Active" value={user.is_active ? "Yes" : "No"} />
                <Info label="Blocked" value={user.is_blocked ? "Yes" : "No"} />
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-5">
                <h2 className="text-lg font-black text-gray-900">Wallet Transactions</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Note</th>
                      <th className="px-4 py-3 font-semibold">Reference</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                          No wallet transactions found.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="border-t border-gray-100 align-top">
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${typeClasses(
                                tx.type
                              )}`}
                            >
                              {prettify(tx.type)}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-semibold text-gray-900">
                            {money(tx.amount_aed)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">
                            {tx.note || "-"}
                          </td>
                          <td className="px-4 py-4 text-xs text-gray-500 break-all">
                            {tx.ref_id || "-"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {fmtDate(tx.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <StatCard title="Total Topups" value={money(stats?.total_topups)} />
              <StatCard title="Total Spent" value={money(stats?.total_spent)} />
              <StatCard title="Total Refunds" value={money(stats?.total_refunds)} />
              <StatCard title="Gifts Sent" value={money(stats?.total_gifts_sent)} />
              <StatCard title="Gifts Received" value={money(stats?.total_gifts_received)} />
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-5">
                <h2 className="text-lg font-black text-gray-900">Manual Wallet Adjustment</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add or deduct balance manually for support cases.
                </p>
              </div>

              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </label>
                  <select
                    value={adjustAction}
                    onChange={(e) => setAdjustAction(e.target.value as "credit" | "debit")}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
                  >
                    <option value="credit">Add Credit</option>
                    <option value="debit">Deduct Balance</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Note / Reason
                  </label>
                  <textarea
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    placeholder="Reason for adjustment..."
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
                  />
                </div>

                <button
                  onClick={handleAdjustWallet}
                  disabled={adjusting}
                  className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {adjusting
                    ? "Applying..."
                    : adjustAction === "credit"
                    ? "Add Credit"
                    : "Deduct Balance"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div className={`mt-2 font-medium text-gray-900 ${mono ? "break-all font-mono text-xs" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}