// app/salon/bookings/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import {
  api,
  blockedSlotsApi,
  branchApi,
  staffApi,
} from "@/lib/api";

type BookingRow = {
  id: string;
  status:
    | "pending"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "no_show";
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
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No show" },
];

const EMPTY_ADD_FORM = {
  branch_id: "",
  staff_id: "",
  blocked_date: "",
  start_time: "",
  end_time: "",
  reason: "",
  customer_name: "",
  customer_phone: "",
};

function statusClasses(status: string) {
  if (status === "pending") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "confirmed") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "completed") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "cancelled") {
    return "bg-red-50 text-red-700";
  }

  if (status === "no_show") {
    return "bg-gray-100 text-gray-600";
  }

  return "bg-gray-100 text-gray-600";
}

function formatMoney(value: number | string | null | undefined) {
  return `AED ${Number(value || 0).toFixed(2)}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "-";

  return value.substring(0, 5);
}

function getLocalDateString() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function SalonBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "all" | "app" | "external"
  >("all");

  const [appBookings, setAppBookings] = useState<BookingRow[]>([]);
  const [externalBookings, setExternalBookings] = useState<
    ExternalBooking[]
  >([]);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);

  const [addForm, setAddForm] =
    useState(EMPTY_ADD_FORM);

  async function loadAll() {
    try {
      setLoading(true);
      setErr(null);

      const [appRes, extRes, branchRes, staffRes] =
        await Promise.all([
          api.get("/dashboard/salon/bookings"),
          blockedSlotsApi.getAll({}),
          branchApi.getAll(),
          staffApi.getAll(),
        ]);

      const app = Array.isArray(appRes?.data)
        ? appRes.data
        : [];

      setAppBookings(
        app.map((booking: any) => ({
          ...booking,
          source: "app" as const,
        }))
      );

      setExternalBookings(
        Array.isArray(extRes?.data)
          ? extRes.data
          : []
      );

      setBranches(
        Array.isArray(branchRes?.data)
          ? branchRes.data
          : []
      );

      setAllStaff(
        Array.isArray(staffRes?.data)
          ? staffRes.data
          : []
      );
    } catch (e: any) {
      setErr(e?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function updateStatus(
    bookingId: string,
    status: string
  ) {
    try {
      setSavingId(bookingId);
      setErr(null);
      setSuccess(null);

      const res = await api.put(
        `/dashboard/salon/bookings/${bookingId}/status`,
        { status }
      );

      setAppBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                status: (
                  res?.booking?.status || status
                ) as BookingRow["status"],
              }
            : booking
        )
      );

      setSuccess("Booking status updated.");
    } catch (e: any) {
      setErr(
        e?.message || "Failed to update booking"
      );
    } finally {
      setSavingId(null);
    }
  }

  async function deleteExternalBooking(id: string) {
    const confirmed = confirm(
      "Remove this manual booking?"
    );

    if (!confirmed) return;

    try {
      setErr(null);
      setSuccess(null);

      await blockedSlotsApi.delete(id);

      setExternalBookings((prev) =>
        prev.filter((booking) => booking.id !== id)
      );

      setSuccess("Manual booking removed.");
    } catch (e: any) {
      setErr(
        e?.message ||
          "Failed to remove manual booking"
      );
    }
  }

  async function handleAddExternal(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setErr(null);
    setSuccess(null);

    if (
      !addForm.branch_id ||
      !addForm.blocked_date ||
      !addForm.start_time ||
      !addForm.end_time
    ) {
      setErr("Please fill in all required fields");
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
        customer_name:
          addForm.customer_name || undefined,
        customer_phone:
          addForm.customer_phone || undefined,
      });

      setShowAddModal(false);
      setAddForm(EMPTY_ADD_FORM);

      setSuccess("Manual booking added.");

      await loadAll();
    } catch (e: any) {
      setErr(
        e?.message ||
          "Failed to add manual booking"
      );
    }
  }

  function closeAddModal() {
    setShowAddModal(false);
    setAddForm(EMPTY_ADD_FORM);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("");
  }

  const allBookings = useMemo(() => {
    const combined: CombinedBooking[] = [
      ...appBookings.map((booking) => ({
        ...booking,
        type: "app" as const,
        time: booking.scheduled_at,
      })),

      ...externalBookings.map((booking) => ({
        id: booking.id,
        type: "external" as const,
        customer_name:
          booking.customer_name || "Walk-in",
        customer_phone:
          booking.customer_phone,
        branch_name: booking.branch_name,
        staff_name: booking.staff_name,
        time: `${booking.blocked_date}T${booking.start_time}`,
        start_time: booking.start_time,
        end_time: booking.end_time,
        blocked_date: booking.blocked_date,
        reason: booking.reason,
        source: "external" as const,
      })),
    ];

    return combined.sort(
      (a, b) =>
        new Date(b.time).getTime() -
        new Date(a.time).getTime()
    );
  }, [appBookings, externalBookings]);

  const filteredBookings = useMemo(() => {
    let data: CombinedBooking[];

    if (activeTab === "app") {
      data = appBookings.map((booking) => ({
        ...booking,
        type: "app" as const,
        time: booking.scheduled_at,
      }));
    } else if (activeTab === "external") {
      data = externalBookings.map((booking) => ({
        id: booking.id,
        type: "external" as const,
        customer_name:
          booking.customer_name || "Walk-in",
        customer_phone:
          booking.customer_phone,
        branch_name: booking.branch_name,
        staff_name: booking.staff_name,
        time: `${booking.blocked_date}T${booking.start_time}`,
        start_time: booking.start_time,
        end_time: booking.end_time,
        blocked_date: booking.blocked_date,
        reason: booking.reason,
        source: "external" as const,
      }));
    } else {
      data = allBookings;
    }

    const query = search.trim().toLowerCase();

    return data.filter((booking) => {
      if (
        booking.type === "app" &&
        statusFilter !== "all" &&
        booking.status !== statusFilter
      ) {
        return false;
      }

      if (dateFilter) {
        const bookingDate =
          booking.type === "app"
            ? booking.scheduled_at?.split("T")[0]
            : booking.blocked_date;

        if (bookingDate !== dateFilter) {
          return false;
        }
      }

      if (query) {
        const searchable = [
          booking.customer_name,
          booking.customer_phone,
          booking.branch_name,
          booking.staff_name,
          booking.id,
        ]
          .map((value) =>
            String(value || "").toLowerCase()
          )
          .join(" ");

        if (!searchable.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [
    activeTab,
    appBookings,
    externalBookings,
    allBookings,
    search,
    statusFilter,
    dateFilter,
  ]);

  const todayCount = useMemo(() => {
    const today = getLocalDateString();

    return allBookings.filter((booking) => {
      const bookingDate =
        booking.type === "app"
          ? booking.scheduled_at?.split("T")[0]
          : booking.blocked_date;

      return bookingDate === today;
    }).length;
  }, [allBookings]);

  const branchStaff = addForm.branch_id
    ? allStaff.filter(
        (member) =>
          member.branch_id === addForm.branch_id
      )
    : [];

  const hasFilters =
    search.trim().length > 0 ||
    statusFilter !== "all" ||
    dateFilter.length > 0;

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading bookings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Bookings
            </h1>

            {todayCount > 0 && (
              <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                {todayCount} today
              </span>
            )}
          </div>

          <p className="mt-1.5 text-sm text-gray-500">
            Manage Glowee bookings and reservations received outside the
            platform.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setErr(null);
            setSuccess(null);
            setShowAddModal(true);
          }}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add manual booking
        </button>
      </div>

      {/* Messages */}
      {err && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

          <div>
            <p className="text-sm font-medium text-red-800">
              Something went wrong
            </p>

            <p className="mt-0.5 text-sm text-red-600">
              {err}
            </p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />

          <p className="text-sm font-medium text-emerald-700">
            {success}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6 overflow-x-auto">
          <TabButton
            active={activeTab === "all"}
            onClick={() => setActiveTab("all")}
            label="All"
            count={
              appBookings.length +
              externalBookings.length
            }
          />

          <TabButton
            active={activeTab === "app"}
            onClick={() => setActiveTab("app")}
            label="Glowee"
            count={appBookings.length}
          />

          <TabButton
            active={activeTab === "external"}
            onClick={() => setActiveTab("external")}
            label="Manual"
            count={externalBookings.length}
          />
        </div>
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search customer, phone, location or team member..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* Date */}
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="date"
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value)
              }
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 lg:w-auto"
            />
          </div>

          {/* Status */}
          {activeTab !== "external" && (
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            >
              {STATUS_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {filteredBookings.length}{" "}
          {filteredBookings.length === 1
            ? "booking"
            : "bookings"}
        </p>
      </div>

      {/* Booking list */}
      {filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <CalendarDays className="h-5 w-5 text-gray-400" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            No bookings found
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            {hasFilters
              ? "Try changing or clearing your filters."
              : "New Glowee bookings and manual reservations will appear here."}
          </p>

          {!hasFilters && (
            <button
              type="button"
              onClick={() =>
                setShowAddModal(true)
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Add manual booking
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="divide-y divide-gray-100">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="px-5 py-5 transition hover:bg-gray-50/60"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  {/* Left */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Source */}
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          booking.type === "app"
                            ? "bg-primary-50 text-primary-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {booking.type === "app"
                          ? "Glowee"
                          : "Manual"}
                      </span>

                      {/* Status */}
                      {booking.type === "app" &&
                        booking.status && (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClasses(
                              booking.status
                            )}`}
                          >
                            {booking.status.replace(
                              "_",
                              " "
                            )}
                          </span>
                        )}

                      <span className="text-xs text-gray-400">
                        #{booking.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {/* Customer */}
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                          <UserRound className="h-4 w-4 text-gray-500" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {booking.customer_name ||
                              "Customer"}
                          </p>

                          {booking.customer_phone ? (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                              <Phone className="h-3 w-3" />
                              {booking.customer_phone}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-xs text-gray-400">
                              No phone
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Location */}
                      <BookingInfo
                        icon={
                          <MapPin className="h-4 w-4" />
                        }
                        label="Location"
                        value={
                          booking.branch_name || "-"
                        }
                      />

                      {/* Date & time */}
                      <BookingInfo
                        icon={
                          <Clock3 className="h-4 w-4" />
                        }
                        label="Date & time"
                        value={
                          booking.type === "app"
                            ? formatDateTime(
                                booking.scheduled_at
                              )
                            : `${formatDate(
                                booking.blocked_date
                              )} · ${formatTime(
                                booking.start_time
                              )}–${formatTime(
                                booking.end_time
                              )}`
                        }
                      />

                      {/* Fourth info */}
                      {booking.type === "app" ? (
                        <BookingInfo
                          label="Total"
                          value={formatMoney(
                            booking.total_aed
                          )}
                        />
                      ) : booking.staff_name ? (
                        <BookingInfo
                          icon={
                            <UsersRound className="h-4 w-4" />
                          }
                          label="Team member"
                          value={booking.staff_name}
                        />
                      ) : (
                        <BookingInfo
                          label="Note"
                          value={
                            booking.reason ||
                            "Manual reservation"
                          }
                        />
                      )}
                    </div>

                    {/* Manual reason if team exists */}
                    {booking.type === "external" &&
                      booking.staff_name &&
                      booking.reason && (
                        <p className="mt-3 text-xs text-gray-500">
                          Note: {booking.reason}
                        </p>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2 border-t border-gray-100 pt-4 xl:border-0 xl:pt-0">
                    {booking.type === "app" ? (
                      <>
                        {booking.status &&
                          booking.status !==
                            "cancelled" &&
                          booking.status !==
                            "completed" && (
                            <select
                              value={booking.status}
                              disabled={
                                savingId === booking.id
                              }
                              onChange={(e) =>
                                updateStatus(
                                  booking.id,
                                  e.target.value
                                )
                              }
                              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-none transition hover:bg-gray-50 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 disabled:opacity-50"
                            >
                              <option value="pending">
                                Pending
                              </option>

                              <option value="confirmed">
                                Confirmed
                              </option>

                              <option value="completed">
                                Completed
                              </option>

                              <option value="cancelled">
                                Cancelled
                              </option>

                              <option value="no_show">
                                No show
                              </option>
                            </select>
                          )}

                        <Link
                          href={`/salon/bookings/${booking.id}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          View
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          deleteExternalBooking(
                            booking.id
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        title="Remove manual booking"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add manual booking */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Add manual booking
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add a reservation received by phone,
                  WhatsApp or walk-in.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddExternal}
              className="space-y-6 p-6"
            >
              {/* Location */}
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Location{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={addForm.branch_id}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        branch_id:
                          e.target.value,
                        staff_id: "",
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                    required
                  >
                    <option value="">
                      Select location
                    </option>

                    {branches.map((branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Team member
                  </label>

                  <select
                    value={addForm.staff_id}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        staff_id:
                          e.target.value,
                      })
                    }
                    disabled={
                      !addForm.branch_id
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">
                      No specific member
                    </option>

                    {branchStaff.map(
                      (member) => (
                        <option
                          key={member.id}
                          value={member.id}
                        >
                          {member.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Date{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="date"
                  value={addForm.blocked_date}
                  onChange={(e) =>
                    setAddForm({
                      ...addForm,
                      blocked_date:
                        e.target.value,
                    })
                  }
                  min={getLocalDateString()}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                  required
                />
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Start time{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="time"
                    value={addForm.start_time}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        start_time:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    End time{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="time"
                    value={addForm.end_time}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        end_time:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                    required
                  />
                </div>
              </div>

              {/* Customer */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-900">
                  Customer details
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Optional, but useful for keeping
                  reservations organized.
                </p>

                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Customer name
                    </label>

                    <input
                      type="text"
                      value={
                        addForm.customer_name
                      }
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          customer_name:
                            e.target.value,
                        })
                      }
                      placeholder="Customer name"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Phone
                    </label>

                    <input
                      type="tel"
                      value={
                        addForm.customer_phone
                      }
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          customer_phone:
                            e.target.value,
                        })
                      }
                      placeholder="+971..."
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Note
                </label>

                <input
                  type="text"
                  value={addForm.reason}
                  onChange={(e) =>
                    setAddForm({
                      ...addForm,
                      reason:
                        e.target.value,
                    })
                  }
                  placeholder="e.g. WhatsApp booking, walk-in"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4" />
                  Add booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative whitespace-nowrap pb-3 text-sm font-medium transition ${
        active
          ? "text-primary-700"
          : "text-gray-500 hover:text-gray-800"
      }`}
    >
      <span className="flex items-center gap-2">
        {label}

        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            active
              ? "bg-primary-50 text-primary-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {count}
        </span>
      </span>

      {active && (
        <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary-600" />
      )}
    </button>
  );
}

function BookingInfo({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-400">
        {label}
      </p>

      <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-800">
        {icon && (
          <span className="shrink-0 text-gray-400">
            {icon}
          </span>
        )}

        <span className="truncate">
          {value}
        </span>
      </div>
    </div>
  );
}