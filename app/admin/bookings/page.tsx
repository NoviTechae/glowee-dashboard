// app/admin/bookings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
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
  scheduled_at: string; // ✅ Your actual column
  mode: "in_salon" | "home"; // ✅ Your actual column
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  total_aed: number; // ✅ Your actual column
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

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");

  async function load() {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);
      if (dateFilter) params.append("date", dateFilter);
      if (modeFilter !== "all") params.append("mode", modeFilter);

      // Load bookings and stats
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
      `This action will notify the customer and salon.\n\n` +
      `Continue?`
    );

    if (!confirmed) return;

    try {
      await api.post(`/dashboard/admin/bookings/${booking.id}/cancel`, {
        reason: "Cancelled by admin",
      });

      alert(`✅ Booking cancelled successfully`);
      await load();
    } catch (e: any) {
      alert(`❌ Failed to cancel: ${e?.message}`);
    }
  }

  // Filter bookings by search term
  const filteredBookings = bookings.filter((b) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.id.toLowerCase().includes(term) ||
      b.user_name?.toLowerCase().includes(term) ||
      b.salon_name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and manage all platform bookings
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-600">Total</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
            </div>

            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-600">Today</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{stats.today}</div>
            </div>

            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-600">This Month</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">{stats.thisMonth}</div>
            </div>

            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</div>
            </div>

            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-600">Confirmed</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{stats.confirmed}</div>
            </div>

            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-600">Completed</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</div>
            </div>

            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-600">Cancelled</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{stats.cancelled}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border rounded-xl p-4 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Customer, salon..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
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

            {/* Mode Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
              >
                <option value="all">All Modes</option>
                <option value="in_salon">In-Salon</option>
                <option value="home">Home Service</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setModeFilter("all");
                  setDateFilter("");
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading bookings...</p>
            </div>
          </div>
        )}

        {/* Bookings Table */}
        {!loading && (
          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Salon</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Scheduled At
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Mode</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Total</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-semibold text-pink-600">
                          #{booking.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {booking.user_name || `User #${booking.user_id}`}
                        </div>
                        {booking.user_phone && (
                          <div className="text-xs text-gray-500">📱 {booking.user_phone}</div>
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
                          <div className="text-xs text-gray-500">📍 {booking.branch_name}</div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {new Date(booking.scheduled_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          🕐 {new Date(booking.scheduled_at).toLocaleTimeString()}
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
                        {booking.subtotal_aed && (
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

                  {/* Empty State */}
                  {filteredBookings.length === 0 && (
                    <tr>
                      <td className="px-4 py-12 text-center" colSpan={8}>
                        <div className="flex flex-col items-center">
                          <svg
                            className="w-12 h-12 text-gray-400 mb-3"
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
                          <p className="text-xs text-gray-400 mt-1">
                            {searchTerm || statusFilter !== "all"
                              ? "Try adjusting your filters"
                              : "Bookings will appear here once customers start booking"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Results Count */}
            {filteredBookings.length > 0 && (
              <div className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-600">
                Showing {filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""}
                {(searchTerm || statusFilter !== "all") && ` (filtered)`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Mode Badge Component
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

// Status Badge Component
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