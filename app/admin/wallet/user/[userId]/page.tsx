// app/admin/wallet/user/[userId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Gift,
  RefreshCw,
  RotateCcw,
  UserRound,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";

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
  return `AED ${Number(value || 0).toFixed(2)}`;
}

function prettify(value?: string | null) {
  if (!value) return "-";

  if (value === "topup") return "Top-up";

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

function typeClasses(type?: string | null) {
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

export default function WalletUserDetailsPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [user, setUser] =
    useState<WalletUser | null>(null);

  const [stats, setStats] =
    useState<WalletStats | null>(null);

  const [transactions, setTransactions] =
    useState<WalletTransaction[]>([]);

  async function loadUserWallet(
    showRefreshing = false
  ) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get(
        `/dashboard/admin/wallet/users/${userId}`
      );

      setUser(response.user || null);
      setStats(response.stats || null);

      setTransactions(
        Array.isArray(response.transactions)
          ? response.transactions
          : []
      );
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.message ||
          "Failed to load wallet details"
      );

      setUser(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (userId) {
      loadUserWallet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading wallet details...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <Link
          href="/admin/wallet"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to wallet
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-gray-900">
            Customer wallet not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        href="/admin/wallet"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to wallet
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-primary-600">
            Customer wallet
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              {user.name || "Unknown customer"}
            </h1>

            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                user.is_blocked
                  ? "bg-red-50 text-red-700"
                  : user.is_active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {user.is_blocked
                ? "Blocked"
                : user.is_active
                ? "Active"
                : "Inactive"}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Review wallet balance and complete transaction history.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadUserWallet(true)
          }
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          label="Wallet balance"
          value={money(user.balance_aed)}
          icon={WalletCards}
          featured
        />

        <SummaryCard
          label="Top-ups"
          value={money(stats?.total_topups)}
          icon={WalletCards}
        />

        <SummaryCard
          label="Spent"
          value={money(stats?.total_spent)}
          icon={WalletCards}
        />

        <SummaryCard
          label="Refunds"
          value={money(stats?.total_refunds)}
          icon={RotateCcw}
        />

        <SummaryCard
          label="Gifts sent"
          value={money(stats?.total_gifts_sent)}
          icon={Gift}
        />

        <SummaryCard
          label="Gifts received"
          value={money(stats?.total_gifts_received)}
          icon={Gift}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.7fr]">
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Customer information
            </h2>
          </div>

          <div className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                {(user.name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {user.name ||
                    "Unknown customer"}
                </p>

                <p className="mt-0.5 text-xs text-gray-500">
                  Glowee customer
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <InlineDetail
                label="Phone"
                value={user.phone || "-"}
              />

              <InlineDetail
                label="Email"
                value={user.email || "-"}
              />

              <InlineDetail
                label="User ID"
                value={String(user.id)}
                mono
              />

              <InlineDetail
                label="Joined"
                value={formatDate(
                  user.created_at
                )}
              />
            </div>

            <Link
              href={`/admin/users/${user.id}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary-600 transition hover:text-primary-700"
            >
              <UserRound className="h-4 w-4" />
              View customer profile
            </Link>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Wallet transactions
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {transactions.length} transaction
                  {transactions.length === 1
                    ? ""
                    : "s"}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
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
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-14 text-center"
                    >
                      <WalletCards className="mx-auto h-7 w-7 text-gray-300" />

                      <p className="mt-3 text-sm font-medium text-gray-900">
                        No wallet transactions
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Wallet activity for this
                        customer will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${typeClasses(
                            tx.type
                          )}`}
                        >
                          {prettify(tx.type)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                        {money(tx.amount_aed)}
                      </td>

                      <td className="max-w-[240px] px-5 py-4 text-sm text-gray-600">
                        {tx.note || "-"}
                      </td>

                      <td className="max-w-[220px] px-5 py-4">
                        <p className="truncate font-mono text-xs text-gray-500">
                          {tx.ref_id || "-"}
                        </p>

                        <p className="mt-1 font-mono text-[11px] text-gray-400">
                          {tx.id.slice(0, 8)}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {formatDate(
                          tx.created_at
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <p className="text-xs text-gray-400">
        Wallet balances are read-only from this dashboard.
        Manual balance adjustments are not currently available.
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  featured = false,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 ${
        featured
          ? "border-primary-200"
          : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            {label}
          </p>

          <p className="mt-2 text-lg font-semibold text-gray-900">
            {value}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50">
          <Icon className="h-4.5 w-4.5 text-primary-600" />
        </div>
      </div>
    </div>
  );
}

function InlineDetail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p
        className={`max-w-[65%] text-right text-sm font-medium text-gray-900 ${
          mono
            ? "break-all font-mono text-xs"
            : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}