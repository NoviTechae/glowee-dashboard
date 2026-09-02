// app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  Download,
  Eye,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { userApi, API_BASE } from "@/lib/api";
import { User } from "@/lib/types";
import { getToken } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

type UserStats = {
  total_users: number;
  active_users: number;
  blocked_users: number;
  new_this_month: number;
};

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("created_desc");

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, sort]);

  async function loadAll(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [usersRes, statsRes] = await Promise.all([
        userApi.getAll({
          search: search.trim(),
          status,
          sort,
        }),
        userApi.getStats(),
      ]);

      setUsers(
        Array.isArray(usersRes.data)
          ? usersRes.data
          : []
      );

      setStats(statsRes || null);
    } catch (error: any) {
      toast.error(
        error?.message || "Failed to load users"
      );

      setUsers([]);
      setStats({
        total_users: 0,
        active_users: 0,
        blocked_users: 0,
        new_this_month: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function exportCsv() {
    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status !== "all") {
        params.set("status", status);
      }

      if (sort) {
        params.set("sort", sort);
      }

      const token = getToken();

      const res = await fetch(
        `${API_BASE}/dashboard/admin/users/export?${params.toString()}`,
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

      if (!res.ok) {
        throw new Error("Failed to export CSV");
      }

      const blob = await res.blob();
      const url =
        window.URL.createObjectURL(blob);

      const anchor =
        document.createElement("a");

      anchor.href = url;
      anchor.download = "users-export.csv";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(url);

      toast.success("CSV exported");
    } catch (error: any) {
      toast.error(
        error?.message || "Export failed"
      );
    }
  }

  async function handleToggleBlock(user: User) {
    const action = user.is_blocked
      ? "unblock"
      : "block";

    const confirmed = confirm(
      `${user.is_blocked ? "Unblock" : "Block"} "${user.name}"?\n\n` +
        `${
          user.is_blocked
            ? "This will restore the user's access."
            : "This will restrict the user's access to Glowee."
        }`
    );

    if (!confirmed) return;

    setTogglingId(user.id);

    try {
      await userApi.toggleBlock(user.id);

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                is_blocked:
                  !item.is_blocked,
              }
            : item
        )
      );

      setStats((current) => {
        if (!current) return current;

        const blocking = !user.is_blocked;

        return {
          ...current,
          blocked_users:
            current.blocked_users +
            (blocking ? 1 : -1),
        };
      });

      toast.success(
        user.is_blocked
          ? "User unblocked"
          : "User blocked"
      );
    } catch (error: any) {
      toast.error(
        error?.message ||
          `Failed to ${action} user`
      );
    } finally {
      setTogglingId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setSort("created_desc");

    setTimeout(() => {
      loadAll();
    }, 0);
  }

  const hasFilters =
    search.trim() ||
    status !== "all" ||
    sort !== "created_desc";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary-600">
            Operations
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            Users
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage registered Glowee customers and
            account access.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>

          <button
            type="button"
            disabled={refreshing}
            onClick={() => loadAll(true)}
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
        <SummaryCard
          label="Total users"
          value={stats?.total_users ?? 0}
          icon={Users}
        />

        <SummaryCard
          label="Active users"
          value={stats?.active_users ?? 0}
          icon={UserCheck}
        />

        <SummaryCard
          label="Blocked users"
          value={stats?.blocked_users ?? 0}
          icon={Ban}
        />

        <SummaryCard
          label="New this month"
          value={stats?.new_this_month ?? 0}
          icon={UserPlus}
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  loadAll();
                }
              }}
              placeholder="Search name, phone or email..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          >
            <option value="all">
              All statuses
            </option>
            <option value="active">
              Active
            </option>
            <option value="blocked">
              Blocked
            </option>
          </select>

          <select
            value={sort}
            onChange={(e) =>
              setSort(e.target.value)
            }
            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          >
            <option value="created_desc">
              Newest first
            </option>
            <option value="created_asc">
              Oldest first
            </option>
            <option value="name_asc">
              Name A–Z
            </option>
            <option value="bookings_desc">
              Most bookings
            </option>
            <option value="spent_desc">
              Highest spent
            </option>
          </select>

          <button
            type="button"
            onClick={() => loadAll()}
            className="h-11 rounded-xl bg-primary-600 px-5 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            Search
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Users */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500" />

              <p className="mt-3 text-sm text-gray-500">
                Loading users...
              </p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <Users className="h-6 w-6 text-gray-400" />
            </div>

            <h2 className="mt-4 text-sm font-semibold text-gray-900">
              No users found
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Try changing the search or filter options.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/70 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">
                      User
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Phone
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Wallet
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left font-medium">
                      Joined
                    </th>

                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-gray-50/60"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                            {user.name
                              ?.slice(0, 1)
                              ?.toUpperCase() ||
                              "U"}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">
                              {user.name ||
                                "Unnamed user"}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-gray-500">
                              {user.email ||
                                "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {user.phone || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">
                          AED{" "}
                          {Number(
                            user.wallet_balance_aed ||
                              0
                          ).toFixed(2)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <UserStatus user={user} />
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {user.created_at
                          ? formatDate(
                              user.created_at
                            )
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/admin/users/${user.id}`
                              )
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleToggleBlock(
                                user
                              )
                            }
                            disabled={
                              togglingId === user.id
                            }
                            className={
                              user.is_blocked
                                ? "inline-flex h-9 items-center gap-2 rounded-lg bg-primary-600 px-3 text-xs font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
                                : "inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            }
                          >
                            {user.is_blocked ? (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            ) : (
                              <Ban className="h-3.5 w-3.5" />
                            )}

                            {togglingId ===
                            user.id
                              ? "Updating..."
                              : user.is_blocked
                              ? "Unblock"
                              : "Block"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
              Showing {users.length} user
              {users.length !== 1 ? "s" : ""}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
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
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
      </div>
    </div>
  );
}

function UserStatus({
  user,
}: {
  user: User;
}) {
  if (user.is_blocked) {
    return (
      <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
        Blocked
      </span>
    );
  }

  if (user.is_active) {
    return (
      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
      Inactive
    </span>
  );
}