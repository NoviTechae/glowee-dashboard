"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Loading } from "@/app/components/ui/Loading";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { userApi } from "@/lib/api";
import { User } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";

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
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("created_desc");

  useEffect(() => {
    loadAll();
  }, [status, sort]);

  async function loadAll() {
    try {
      setLoading(true);

      const [usersRes, statsRes] = await Promise.all([
        userApi.getAll({
          search,
          status,
          sort,
        }),
        userApi.getStats(),
      ]);

      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setStats(statsRes || null);
    } catch (error: any) {
      toast.error(error.message || "Failed to load users");
      setUsers([]);
      setStats({
        total_users: 0,
        active_users: 0,
        blocked_users: 0,
        new_this_month: 0,
      });
    } finally {
      setLoading(false);
    }

  }

      async function exportCsv() {
  try {
    const params = new URLSearchParams();

    if (search.trim()) params.set("search", search.trim());
    if (status !== "all") params.set("status", status);
    if (sort) params.set("sort", sort);

    const token = getToken();

    const res = await fetch(
      `${API_BASE}/dashboard/admin/users/export?${params.toString()}`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to export CSV");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "users-export.csv";
    a.click();

    window.URL.revokeObjectURL(url);

    toast.success("CSV exported successfully");
  } catch (error: any) {
    toast.error(error.message || "Export failed");
  }
}
  const handleToggleBlock = async (user: User) => {
    const action = user.is_blocked ? "unblock" : "block";

    if (!confirm(`Are you sure you want to ${action} ${user.name}?`)) return;

    setTogglingId(user.id);

    try {
      await userApi.toggleBlock(user.id);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_blocked: !u.is_blocked } : u
        )
      );

      toast.success(`User ${action}ed successfully`);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} user`);
    } finally {
      setTogglingId(null);
    }
  };

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setSort("created_desc");
    setTimeout(() => loadAll(), 0);
  }

  if (loading) return <Loading size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage all registered users</p>
        </div>

<div className="flex gap-2">
  <Button variant="secondary" onClick={exportCsv}>
    Export CSV
  </Button>

  <Button variant="secondary" onClick={loadAll}>
    Refresh
  </Button>
</div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats.total_users} />
          <StatCard
            title="Active Users"
            value={stats.active_users}
            color="text-emerald-600"
          />
          <StatCard
            title="Blocked Users"
            value={stats.blocked_users}
            color="text-red-600"
          />
          <StatCard
            title="New This Month"
            value={stats.new_this_month}
            color="text-blue-600"
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              placeholder="Name, phone, email..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Sort By
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="name_asc">Name A-Z</option>
              <option value="bookings_desc">Most Bookings</option>
              <option value="spent_desc">Highest Spent</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex items-end gap-2">
            <Button className="w-full" onClick={loadAll}>
              Search
            </Button>
            <Button variant="secondary" className="w-full" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Wallet</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 font-medium">{user.name}</td>
                    <td className="py-3 px-4 text-gray-600">{user.phone}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {user.email || "-"}
                    </td>
                    <td className="py-3 px-4 text-green-600 font-semibold">
                      AED {Number(user.wallet_balance_aed || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {user.is_blocked ? (
                        <Badge variant="danger">Blocked</Badge>
                      ) : user.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="gray">Inactive</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user.created_at ? formatDate(user.created_at) : "-"}
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                      >
                        View
                      </Button>

                      <Button
                        variant={user.is_blocked ? "primary" : "danger"}
                        size="sm"
                        onClick={() => handleToggleBlock(user)}
                        disabled={togglingId === user.id}
                      >
                        {togglingId === user.id
                          ? "..."
                          : user.is_blocked
                          ? "Unblock"
                          : "Block"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  color = "text-gray-900",
}: {
  title: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-600">{title}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}