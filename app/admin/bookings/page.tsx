"use client";

import { useEffect, useState } from "react";
import { api, API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import Link from "next/link";

type Booking = {
  id: string;
  user_id: string;
  user_name?: string;
  user_phone?: string;
  salon_id: string;
  salon_name: string;
  branch_id?: string;
  branch_name?: string;
  scheduled_at: string;
  mode: "in_salon" | "home";
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  total_aed: number;
  subtotal_aed?: number;
  fees_aed?: number;
  customer_note?: string;
  created_at: string;
};

type Stats = {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  today: number;
  thisMonth: number;
};

export default function AdminBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (dateFilter) params.append("date", dateFilter);
      if (modeFilter !== "all") params.append("mode", modeFilter);

      const [bookingsData, statsData] = await Promise.all([
        api.get(`/dashboard/admin/bookings?${params.toString()}`),
        api.get("/dashboard/admin/bookings/stats"),
      ]);

      setBookings(bookingsData.data || []);
      setStats(statsData);
    } catch (e: any) {
      setError(e?.message || "Failed to load bookings");
      setBookings([]);
      setStats({
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        today: 0,
        thisMonth: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateFilter, modeFilter]);

  async function handleCancelBooking(booking: Booking) {
    const confirmed = confirm(
      `⚠️ Cancel Booking?\n\n` +
        `Customer: ${booking.user_name || "Unknown"}\n` +
        `Salon: ${booking.salon_name}\n` +
        `Date: ${new Date(booking.scheduled_at).toLocaleString()}\n\n` +
        `Continue?`
    );

    if (!confirmed) return;

    try {
      await api.post(`/dashboard/admin/bookings/${booking.id}/cancel`, {
        reason: "Cancelled by admin",
      });

      alert("✅ Booking cancelled successfully");
      await load();
    } catch (e: any) {
      alert(`❌ Failed to cancel: ${e?.message}`);
    }
  }

  async function exportCsv() {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (dateFilter) params.append("date", dateFilter);
      if (modeFilter !== "all") params.append("mode", modeFilter);

      const token = getToken();

      const res = await fetch(
        `${API_BASE}/dashboard/admin/bookings/export?${params.toString()}`,
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
      a.download = "bookings-export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || "Export failed");
    }
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setModeFilter("all");
    setDateFilter("");
    setTimeout(() => load(), 0);
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage all platform bookings
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
              onClick={load}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
            <StatCard title="Total" value={stats.total} color="text-gray-900" />
            <StatCard title="Today" value={stats.today} color="text-blue-600" />
            <StatCard title="This Month" value={stats.thisMonth} color="text-purple-600" />
            <StatCard title="Pending" value={stats.pending} color="text-yellow-600" />
            <StatCard title="Confirmed" value={stats.confirmed} color="text-blue-600" />
            <StatCard title="Completed" value={stats.completed} color="text-emerald-600" />
            <StatCard title="Cancelled" value={stats.cancelled} color="text-red-600" />
          </div>
        )}

        <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Search</label>
              <input
                type="text"
                placeholder="Customer, salon, booking ID..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Mode</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
              >
                <option value="all">All Modes</option>
                <option value="in_salon">In-Salon</option>
                <option value="home">Home Service</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={load}
                className="w-full rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
              >
                Search
              </button>
              <button
                onClick={clearFilters}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-pink-500" />
              <p className="mt-4 text-gray-600">Loading bookings...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Salon</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Scheduled At</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Mode</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Total</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="transition hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-semibold text-pink-600">
                          #{booking.id.slice(0, 8)}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {booking.user_name || `User #${booking.user_id}`}
                        </div>
                        {booking.user_phone && (
                          <div className="text-xs text-gray-500">{booking.user_phone}</div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/salons/${booking.salon_id}`}
                          className="text-gray-900 hover:text-pink-600 hover:underline"
                        >
                          {booking.salon_name}
                        </Link>
                        {booking.branch_name && (
                          <div className="text-xs text-gray-500">{booking.branch_name}</div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {new Date(booking.scheduled_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(booking.scheduled_at).toLocaleTimeString()}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <ModeBadge mode={booking.mode} />
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} />
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">
                          AED {Number(booking.total_aed || 0).toFixed(2)}
                        </div>
                        {booking.subtotal_aed != null && (
                          <div className="text-xs text-gray-500">
                            Subtotal: AED {Number(booking.subtotal_aed || 0).toFixed(2)}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            View
                          </Link>

                          {booking.status !== "cancelled" && booking.status !== "completed" && (
                            <button
                              onClick={() => handleCancelBooking(booking)}
                              className="text-xs font-semibold text-red-600 hover:text-red-800"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {bookings.length === 0 && (
                    <tr>
                      <td className="px-4 py-12 text-center" colSpan={8}>
                        <div className="flex flex-col items-center">
                          <svg
                            className="mb-3 h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-sm font-medium text-gray-500">No bookings found</p>
                          <p className="mt-1 text-xs text-gray-400">
                            Try adjusting your filters or wait for new bookings.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {bookings.length > 0 && (
              <div className="border-t bg-gray-50 px-4 py-3 text-sm text-gray-600">
                Showing {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-600">{title}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function ModeBadge({ mode }: { mode: "in_salon" | "home" }) {
  const variants = {
    in_salon: {
      label: "In-Salon",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    home: {
      label: "Home",
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
  };

  const variant = variants[mode] || variants.in_salon;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${variant.color}`}
    >
      {variant.label}
    </span>
  );
}

function StatusBadge({ status }: { status: Booking["status"] }) {
  const variants = {
    pending: {
      label: "Pending",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    confirmed: {
      label: "Confirmed",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    completed: {
      label: "Completed",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    cancelled: {
      label: "Cancelled",
      color: "bg-red-50 text-red-700 border-red-200",
    },
    no_show: {
      label: "No Show",
      color: "bg-gray-100 text-gray-700 border-gray-200",
    },
  };

  const variant = variants[status] || variants.pending;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${variant.color}`}
    >
      {variant.label}
    </span>
  );
}