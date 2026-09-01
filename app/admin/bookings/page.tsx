"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  Home,
  MapPin,
  RefreshCw,
  Search,
  Store,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import { api, API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

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
  status: BookingStatus;
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

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("all");

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
      `Cancel this booking?\n\n` +
        `Customer: ${booking.user_name || "Unknown"}\n` +
        `Business: ${booking.salon_name}\n` +
        `Date: ${new Date(booking.scheduled_at).toLocaleString()}\n\n` +
        `Continue?`
    );

    if (!confirmed) return;

    try {
      await api.post(`/dashboard/admin/bookings/${booking.id}/cancel`, {
        reason: "Cancelled by admin",
      });

      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to cancel booking");
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
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    load();
  }

  const hasFilters =
    searchTerm.trim() ||
    statusFilter !== "all" ||
    modeFilter !== "all" ||
    dateFilter;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary-600">Operations</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            Bookings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage bookings across Glowee.
          </p>
        </div>

        <div className="flex gap-2">
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
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard label="Total bookings" value={stats.total} icon={CalendarDays} />
          <SummaryCard label="Today" value={stats.today} icon={Clock3} />
          <SummaryCard label="Pending" value={stats.pending} icon={Clock3} />
          <SummaryCard label="Completed" value={stats.completed} icon={CheckCircle2} />
        </div>
      )}

      <form
        onSubmit={handleSearchSubmit}
        className="rounded-2xl border border-gray-200 bg-white p-4"
      >
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer, phone, business or booking ID..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
          >
            <option value="all">All modes</option>
            <option value="in_salon">In-salon</option>
            <option value="home">Home service</option>
          </select>

          <input
            type="date"
            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          <button
            type="submit"
            className="h-11 rounded-xl bg-primary-600 px-5 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            Search
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500" />
              <p className="mt-3 text-sm text-gray-500">Loading bookings...</p>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <CalendarDays className="h-6 w-6 text-gray-400" />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-gray-900">
              No bookings found
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Try changing your filters or search.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/70">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Booking
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Customer
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Business
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Appointment
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Mode
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Amount
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {bookings.map((booking) => {
                    const canCancel =
                      booking.status !== "cancelled" &&
                      booking.status !== "completed";

                    return (
                      <tr key={booking.id} className="transition hover:bg-gray-50/60">
                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="font-mono text-xs font-semibold text-primary-600 hover:text-primary-700"
                          >
                            #{booking.id.slice(0, 8)}
                          </Link>
                          <p className="mt-1 text-xs text-gray-400">
                            Created {new Date(booking.created_at).toLocaleDateString()}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                              <UserRound className="h-4 w-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {booking.user_name || `User #${booking.user_id}`}
                              </p>
                              {booking.user_phone && (
                                <p className="mt-0.5 text-xs text-gray-500">
                                  {booking.user_phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/salons/${booking.salon_id}`}
                            className="font-medium text-gray-900 transition hover:text-primary-600"
                          >
                            {booking.salon_name}
                          </Link>

                          {booking.branch_name && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="h-3.5 w-3.5" />
                              {booking.branch_name}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">
                            {new Date(booking.scheduled_at).toLocaleDateString(undefined, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {new Date(booking.scheduled_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <ModeBadge mode={booking.mode} />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={booking.status} />
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">
                            AED {Number(booking.total_aed || 0).toFixed(2)}
                          </p>
                          {booking.subtotal_aed != null && (
                            <p className="mt-0.5 text-xs text-gray-400">
                              Service AED {Number(booking.subtotal_aed).toFixed(2)}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/admin/bookings/${booking.id}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                              title="View booking"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>

                            {canCancel && (
                              <button
                                type="button"
                                onClick={() => handleCancelBooking(booking)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                title="Cancel booking"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
              Showing {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
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
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
      </div>
    </div>
  );
}

function ModeBadge({ mode }: { mode: "in_salon" | "home" }) {
  const isHome = mode === "home";
  const Icon = isHome ? Home : Store;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
      <Icon className="h-3.5 w-3.5" />
      {isHome ? "Home service" : "In-salon"}
    </span>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const variants: Record<
    BookingStatus,
    { label: string; className: string }
  > = {
    pending: {
      label: "Pending",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    confirmed: {
      label: "Confirmed",
      className: "border-blue-200 bg-blue-50 text-blue-700",
    },
    completed: {
      label: "Completed",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    cancelled: {
      label: "Cancelled",
      className: "border-red-200 bg-red-50 text-red-700",
    },
  };

  const variant = variants[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${variant.className}`}
    >
      {variant.label}
    </span>
  );
}
