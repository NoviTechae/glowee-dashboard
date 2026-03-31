// app/salon/bookings/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, blockedSlotsApi, branchApi, staffApi } from "@/lib/api";

type BookingRow = {
  id: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  total_aed: number;
  scheduled_at: string;
  created_at: string;
  branch_name?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  source: "app" | "external";
};

type ExternalBooking = {
  id: string;
  branch_id: string;
  branch_name: string;
  staff_id?: string | null;
  staff_name?: string | null;
  blocked_date: string;
  start_time: string;
  end_time: string;
  reason?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
};

type CombinedBooking = {
  id: string;
  type: "app" | "external";
  customer_name?: string | null;
  customer_phone?: string | null;
  branch_name?: string | null;
  staff_name?: string | null;
  time: string;
  status?: string;
  total_aed?: number;
  scheduled_at?: string;
  created_at?: string;
  start_time?: string;
  end_time?: string;
  blocked_date?: string;
  reason?: string | null;
  source?: string;
};

type Branch = {
  id: string;
  name: string;
};

type Staff = {
  id: string;
  name: string;
  branch_id: string;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Bookings" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

function statusClasses(status: string) {
  if (status === "pending") return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (status === "confirmed") return "bg-blue-100 text-blue-800 border-blue-300";
  if (status === "completed") return "bg-green-100 text-green-800 border-green-300";
  if (status === "cancelled") return "bg-red-100 text-red-800 border-red-300";
  if (status === "no_show") return "bg-gray-100 text-gray-800 border-gray-300";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

function formatMoney(v: number | string | null | undefined) {
  return `AED ${Number(v || 0).toFixed(2)}`;
}

function formatDateTime(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(time: string) {
  return time.substring(0, 5); // HH:MM
}

export default function SalonBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<"all" | "app" | "external">("all");

  // Data
  const [appBookings, setAppBookings] = useState<BookingRow[]>([]);
  const [externalBookings, setExternalBookings] = useState<ExternalBooking[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // Add External Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    branch_id: "",
    staff_id: "",
    blocked_date: "",
    start_time: "",
    end_time: "",
    reason: "",
    customer_name: "",
    customer_phone: "",
  });

  async function loadAll() {
    try {
      setLoading(true);
      setErr(null);

      const [appRes, extRes, branchRes, staffRes] = await Promise.all([
        api.get("/dashboard/salon/bookings"),
        blockedSlotsApi.getAll({}),
        branchApi.getAll(),
        staffApi.getAll(),
      ]);

      const app = Array.isArray(appRes?.data) ? appRes.data : [];
      setAppBookings(app.map((b: any) => ({ ...b, source: "app" as const })));

      setExternalBookings(Array.isArray(extRes?.data) ? extRes.data : []);
      setBranches(Array.isArray(branchRes?.data) ? branchRes.data : []);
      setAllStaff(Array.isArray(staffRes?.data) ? staffRes.data : []);

      // Don't auto-filter by date - show all bookings by default
    } catch (e: any) {
      setErr(e?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function updateStatus(bookingId: string, status: string) {
    try {
      setSavingId(bookingId);
      setErr(null);

      const res = await api.put(`/dashboard/salon/bookings/${bookingId}/status`, { status });

      setAppBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, status: (res?.booking?.status || status) as BookingRow["status"] }
            : b
        )
      );
    } catch (e: any) {
      setErr(e?.message || "Failed to update booking");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteExternalBooking(id: string) {
    if (!confirm("Are you sure you want to remove this external booking?")) return;

    try {
      setErr(null);
      await blockedSlotsApi.delete(id);
      setSuccess("External booking removed successfully");
      loadAll();
    } catch (e: any) {
      setErr(e?.message || "Failed to delete external booking");
    }
  }

  async function handleAddExternal(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);

    if (!addForm.branch_id || !addForm.blocked_date || !addForm.start_time || !addForm.end_time) {
      setErr("Please fill all required fields");
      return;
    }

    if (addForm.start_time >= addForm.end_time) {
      setErr("End time must be after start time");
      return;
    }

    try {
      await blockedSlotsApi.create({
        branch_id: addForm.branch_id,
        staff_id: addForm.staff_id || null,
        blocked_date: addForm.blocked_date,
        start_time: addForm.start_time,
        end_time: addForm.end_time,
        reason: addForm.reason || undefined,
        customer_name: addForm.customer_name || undefined,
        customer_phone: addForm.customer_phone || undefined,
      });

      setSuccess("External booking added successfully!");
      setShowAddModal(false);
      setAddForm({
        branch_id: "",
        staff_id: "",
        blocked_date: "",
        start_time: "",
        end_time: "",
        reason: "",
        customer_name: "",
        customer_phone: "",
      });
      loadAll();
    } catch (e: any) {
      setErr(e?.message || "Failed to add external booking");
    }
  }

  // Combined bookings for "All" tab
  const allBookings = useMemo(() => {
    const combined: CombinedBooking[] = [
      ...appBookings.map(b => ({
        ...b,
        type: "app" as const,
        time: b.scheduled_at,
      })),
      ...externalBookings.map(e => ({
        id: e.id,
        type: "external" as const,
        customer_name: e.customer_name || "Walk-in",
        customer_phone: e.customer_phone,
        branch_name: e.branch_name,
        staff_name: e.staff_name,
        time: `${e.blocked_date}T${e.start_time}`,
        start_time: e.start_time,
        end_time: e.end_time,
        blocked_date: e.blocked_date,
        reason: e.reason,
        source: "external" as const,
      })),
    ];

    return combined.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [appBookings, externalBookings]);

  const filteredBookings = useMemo(() => {
    let data: CombinedBooking[] = activeTab === "app" 
      ? appBookings.map(b => ({
          ...b,
          type: "app" as const,
          time: b.scheduled_at,
        }))
      : activeTab === "external" 
      ? externalBookings.map(e => ({
          id: e.id,
          type: "external" as const,
          customer_name: e.customer_name || "Walk-in",
          customer_phone: e.customer_phone,
          branch_name: e.branch_name,
          staff_name: e.staff_name,
          time: `${e.blocked_date}T${e.start_time}`,
          start_time: e.start_time,
          end_time: e.end_time,
          blocked_date: e.blocked_date,
          reason: e.reason,
          source: "external" as const,
        }))
      : allBookings;

    console.log("🔍 DEBUG - activeTab:", activeTab);
    console.log("🔍 DEBUG - data before filtering:", data.length);
    console.log("🔍 DEBUG - appBookings:", appBookings.length);
    console.log("🔍 DEBUG - externalBookings:", externalBookings.length);
    console.log("🔍 DEBUG - allBookings:", allBookings.length);

    const q = search.trim().toLowerCase();

    const result = data.filter((b: CombinedBooking) => {
      // Status filter (app bookings only)
      if (activeTab !== "external" && b.type === "app" && b.status) {
        const matchStatus = statusFilter === "all" || b.status === statusFilter;
        if (!matchStatus) return false;
      }

      // Date filter
      if (dateFilter) {
        const bookingDate = b.type === "app" 
          ? b.scheduled_at?.split("T")[0]
          : b.blocked_date || b.time?.split("T")[0];
        
        if (bookingDate !== dateFilter) return false;
      }

      // Search
      const matchSearch =
        !q ||
        String(b.customer_name || "").toLowerCase().includes(q) ||
        String(b.customer_phone || "").toLowerCase().includes(q) ||
        String(b.branch_name || "").toLowerCase().includes(q) ||
        String(b.staff_name || "").toLowerCase().includes(q) ||
        String(b.id || "").toLowerCase().includes(q);

      return matchSearch;
    });

    console.log("🔍 DEBUG - filtered result:", result.length);
    console.log("🔍 DEBUG - filtered items:", result);
    
    return result;
  }, [activeTab, appBookings, externalBookings, allBookings, search, statusFilter, dateFilter]);

  const stats = useMemo(() => {
    return {
      total: appBookings.length + externalBookings.length,
      app: appBookings.length,
      external: externalBookings.length,
      today: allBookings.filter((b: CombinedBooking) => {
        const today = new Date().toISOString().split("T")[0];
        const bookingDate = b.type === "app"
          ? b.scheduled_at?.split("T")[0]
          : b.blocked_date || b.time?.split("T")[0];
        return bookingDate === today;
      }).length,
    };
  }, [appBookings, externalBookings, allBookings]);

  const branchStaff = addForm.branch_id
    ? allStaff.filter(s => s.branch_id === addForm.branch_id)
    : [];

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent">
            All Bookings
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage app bookings and external reservations in one place
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2.5 font-semibold text-orange-700 transition-colors hover:bg-orange-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add External
          </button>

          <button
            onClick={loadAll}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Messages */}
      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-red-700">{err}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-green-700">{success}</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total" value={stats.total} icon="📊" />
        <StatCard title="App Bookings" value={stats.app} icon="📱" tone="blue" />
        <StatCard title="External" value={stats.external} icon="🚶" tone="orange" />
        <StatCard title="Today" value={stats.today} icon="📅" tone="green" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "all"
              ? "border-b-2 border-purple-600 text-purple-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setActiveTab("app")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "app"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📱 App ({stats.app})
        </button>
        <button
          onClick={() => setActiveTab("external")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "external"
              ? "border-b-2 border-orange-600 text-orange-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          🚶 External ({stats.external})
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Customer, branch, phone..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter("")}
                  className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                  title="Clear date filter"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div> */}

          {activeTab !== "external" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 font-semibold mb-2">No bookings found</p>
            <p className="text-gray-400 text-sm">Try adjusting your filters or add a new booking</p>
          </div>
        ) : (
          filteredBookings.map((b: CombinedBooking) => (
            <div
              key={b.id}
              className={`rounded-2xl border-2 p-6 transition-all hover:shadow-md ${
                b.type === "external"
                  ? "border-orange-200 bg-orange-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {/* Source Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        b.type === "app"
                          ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                          : "bg-orange-100 text-orange-700 border-2 border-orange-300"
                      }`}
                    >
                      {b.type === "app" ? "📱 App" : "🚶 External"}
                    </span>

                    {/* Status Badge (App only) */}
                    {b.type === "app" && b.status && (
                      <span className={`inline-flex items-center rounded-full border-2 px-3 py-1 text-xs font-bold capitalize ${statusClasses(b.status)}`}>
                        {b.status.replace("_", " ")}
                      </span>
                    )}

                    {/* ID */}
                    <span className="font-mono text-xs font-bold text-gray-500">
                      #{b.id.slice(0, 8)}
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {/* Customer */}
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                        {(b.customer_name || "C").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{b.customer_name || "Customer"}</div>
                        <div className="text-xs text-gray-500">{b.customer_phone || "-"}</div>
                      </div>
                    </div>

                    {/* Branch */}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Branch</div>
                      <div className="text-sm font-semibold text-gray-900">{b.branch_name || "-"}</div>
                    </div>

                    {/* Staff */}
                    {b.staff_name && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Staff</div>
                        <div className="text-sm font-semibold text-gray-900">{b.staff_name}</div>
                      </div>
                    )}

                    {/* Time */}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Time</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {b.type === "app" 
                          ? formatDateTime(b.scheduled_at)
                          : `${formatTime(b.start_time || "00:00:00")} - ${formatTime(b.end_time || "00:00:00")}`
                        }
                      </div>
                    </div>

                    {/* Total (App only) */}
                    {b.type === "app" && b.total_aed !== undefined && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Total</div>
                        <div className="text-sm font-bold text-gray-900">{formatMoney(b.total_aed)}</div>
                      </div>
                    )}

                    {/* Reason (External only) */}
                    {b.type === "external" && b.reason && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Reason</div>
                        <div className="text-sm font-semibold text-gray-900">{b.reason}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {b.type === "app" ? (
                    <>
                      <Link
                        href={`/salon/bookings/${b.id}`}
                        className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </Link>

                      {b.status && b.status !== "cancelled" && b.status !== "completed" && (
                        <select
                          value={b.status}
                          disabled={savingId === b.id}
                          onChange={(e) => updateStatus(b.id, e.target.value)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="no_show">No Show</option>
                        </select>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => deleteExternalBooking(b.id)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                      title="Remove booking"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add External Booking Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Add External Booking</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddExternal} className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Branch *</label>
                  <select
                    value={addForm.branch_id}
                    onChange={(e) => setAddForm({ ...addForm, branch_id: e.target.value, staff_id: "" })}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Staff (Optional)</label>
                  <select
                    value={addForm.staff_id}
                    onChange={(e) => setAddForm({ ...addForm, staff_id: e.target.value })}
                    disabled={!addForm.branch_id}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                  >
                    <option value="">All staff</option>
                    {branchStaff.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={addForm.blocked_date}
                  onChange={(e) => setAddForm({ ...addForm, blocked_date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time *</label>
                  <input
                    type="time"
                    value={addForm.start_time}
                    onChange={(e) => setAddForm({ ...addForm, start_time: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Time *</label>
                  <input
                    type="time"
                    value={addForm.end_time}
                    onChange={(e) => setAddForm({ ...addForm, end_time: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                <input
                  type="text"
                  value={addForm.reason}
                  onChange={(e) => setAddForm({ ...addForm, reason: e.target.value })}
                  placeholder="e.g., Walk-in, Phone booking"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name</label>
                  <input
                    type="text"
                    value={addForm.customer_name}
                    onChange={(e) => setAddForm({ ...addForm, customer_name: e.target.value })}
                    placeholder="Customer name"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Phone</label>
                  <input
                    type="tel"
                    value={addForm.customer_phone}
                    onChange={(e) => setAddForm({ ...addForm, customer_phone: e.target.value })}
                    placeholder="+971 50 123 4567"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Add Booking
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  tone = "default",
}: {
  title: string;
  value: number;
  icon: string;
  tone?: "default" | "yellow" | "blue" | "green" | "orange";
}) {
  const colorClass =
    tone === "yellow"
      ? "from-yellow-400 to-orange-400"
      : tone === "blue"
      ? "from-blue-400 to-purple-400"
      : tone === "green"
      ? "from-green-400 to-emerald-400"
      : tone === "orange"
      ? "from-orange-400 to-red-400"
      : "from-gray-400 to-gray-500";

  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-500 mb-2">{title}</div>
          <div className="text-3xl font-bold text-gray-900 group-hover:scale-105 transition-transform">
            {value}
          </div>
        </div>

        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${colorClass} shadow-md group-hover:scale-110 transition-transform`}>
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}