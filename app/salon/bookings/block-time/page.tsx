// app/salon/bookings/block-time/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Info,
  Lock,
  MapPin,
  MessageSquareText,
  Phone,
  Plus,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  blockedSlotsApi,
  branchApi,
  staffApi,
} from "@/lib/api";

type Branch = {
  id: string;
  name: string;
};

type Staff = {
  id: string;
  name: string;
  branch_id: string;
};

type BlockedSlot = {
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

function getLocalDateString() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  return value.substring(0, 5);
}

export default function BlockTimeSlotsPage() {
  const [branchId, setBranchId] = useState("");
  const [staffId, setStaffId] = useState("");

  const [blockedDate, setBlockedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [reason, setReason] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [branches, setBranches] = useState<Branch[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [viewDate, setViewDate] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const [branchesRes, staffRes] = await Promise.all([
          branchApi.getAll(),
          staffApi.getAll(),
        ]);

        setBranches(
          Array.isArray(branchesRes.data)
            ? branchesRes.data
            : []
        );

        setAllStaff(
          Array.isArray(staffRes.data)
            ? staffRes.data
            : []
        );

        const today = getLocalDateString();

        setBlockedDate(today);
        setViewDate(today);
      } catch (e: any) {
        setErr(e?.message || "Failed to load blocked time settings");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (!viewDate) return;

    async function loadBlockedSlots() {
      try {
        setLoadingSlots(true);

        const res = await blockedSlotsApi.getAll({
          date: viewDate,
          branch_id: branchId || undefined,
        });

        setBlockedSlots(
          Array.isArray(res.data) ? res.data : []
        );
      } catch (e: any) {
        setErr(
          e?.message || "Failed to load blocked times"
        );
      } finally {
        setLoadingSlots(false);
      }
    }

    loadBlockedSlots();
  }, [viewDate, branchId]);

  const branchStaff = useMemo(() => {
    if (!branchId) return [];

    return allStaff.filter(
      (member) => member.branch_id === branchId
    );
  }, [allStaff, branchId]);

  async function reloadSlots() {
    if (!viewDate) return;

    try {
      setLoadingSlots(true);

      const res = await blockedSlotsApi.getAll({
        date: viewDate,
        branch_id: branchId || undefined,
      });

      setBlockedSlots(
        Array.isArray(res.data) ? res.data : []
      );
    } catch (e: any) {
      setErr(
        e?.message || "Failed to load blocked times"
      );
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setErr(null);
    setSuccess(null);

    if (!branchId) {
      setErr("Please select a location");
      return;
    }

    if (!blockedDate) {
      setErr("Please select a date");
      return;
    }

    if (!startTime || !endTime) {
      setErr("Please select a start and end time");
      return;
    }

    if (startTime >= endTime) {
      setErr("End time must be after start time");
      return;
    }

    try {
      setSaving(true);

      await blockedSlotsApi.create({
        branch_id: branchId,
        staff_id: staffId || null,
        blocked_date: blockedDate,
        start_time: startTime,
        end_time: endTime,
        reason: reason || undefined,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
      });

      setSuccess("Time blocked successfully.");

      setStartTime("");
      setEndTime("");
      setReason("");
      setCustomerName("");
      setCustomerPhone("");
      setStaffId("");

      setViewDate(blockedDate);

      await reloadSlots();
    } catch (e: any) {
      setErr(
        e?.message || "Failed to block this time"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = confirm(
      "Remove this blocked time?"
    );

    if (!confirmed) return;

    try {
      setErr(null);
      setSuccess(null);

      await blockedSlotsApi.delete(id);

      setBlockedSlots((prev) =>
        prev.filter((slot) => slot.id !== id)
      );

      setSuccess("Blocked time removed.");
    } catch (e: any) {
      setErr(
        e?.message || "Failed to remove blocked time"
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7 p-6 lg:p-8">
      {/* Header */}
      <div>
        <Link
          href="/salon/bookings"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to bookings
        </Link>

        <div className="mt-5">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Block time
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm text-gray-500">
            Mark periods as unavailable to prevent customers from booking
            those times through Glowee.
          </p>
        </div>
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

      <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
        {/* Create block */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Lock className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  New blocked time
                </h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  Choose when bookings should be unavailable.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 p-6"
          >
            {/* Location */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Location{" "}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <select
                  value={branchId}
                  onChange={(e) => {
                    setBranchId(e.target.value);
                    setStaffId("");
                    setErr(null);
                  }}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
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
            </div>

            {/* Team */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Team member
              </label>

              <select
                value={staffId}
                onChange={(e) =>
                  setStaffId(e.target.value)
                }
                disabled={!branchId}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">
                  All team members
                </option>

                {branchStaff.map((member) => (
                  <option
                    key={member.id}
                    value={member.id}
                  >
                    {member.name}
                  </option>
                ))}
              </select>

              <p className="mt-1.5 text-xs text-gray-400">
                Leave empty to block the time for the whole location.
              </p>
            </div>

            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Date{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="date"
                value={blockedDate}
                onChange={(e) =>
                  setBlockedDate(e.target.value)
                }
                min={getLocalDateString()}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                required
              />
            </div>

            {/* Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Start time{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="time"
                  value={startTime}
                  onChange={(e) =>
                    setStartTime(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  End time{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="time"
                  value={endTime}
                  onChange={(e) =>
                    setEndTime(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Reason
              </label>

              <input
                type="text"
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value)
                }
                placeholder="e.g. Break, maintenance, unavailable"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            {/* Optional customer */}
            <div className="border-t border-gray-100 pt-5">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Customer details
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Only add these if this blocked time represents an
                  offline customer booking.
                </p>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Customer name
                  </label>

                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) =>
                      setCustomerName(e.target.value)
                    }
                    placeholder="Optional"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Phone
                  </label>

                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) =>
                      setCustomerPhone(e.target.value)
                    }
                    placeholder="+971..."
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {saving ? "Blocking time..." : "Block time"}
            </button>
          </form>
        </section>

        {/* Blocked slots */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">
                  Blocked times
                </h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  Review unavailable periods for a selected date.
                </p>
              </div>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="date"
                  value={viewDate}
                  onChange={(e) =>
                    setViewDate(e.target.value)
                  }
                  className="rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            {loadingSlots ? (
              <div className="py-14 text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />

                <p className="mt-3 text-sm text-gray-500">
                  Loading blocked times...
                </p>
              </div>
            ) : blockedSlots.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <CalendarDays className="h-5 w-5 text-gray-400" />
                </div>

                <h3 className="mt-4 text-sm font-medium text-gray-800">
                  No blocked times
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  This date is currently open for bookings.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {blockedSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="py-5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                            <Clock3 className="h-4 w-4 text-gray-400" />

                            {formatTime(slot.start_time)}
                            <span className="text-gray-300">–</span>
                            {formatTime(slot.end_time)}
                          </div>

                          {slot.customer_name && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                              Manual booking
                            </span>
                          )}
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-gray-500 sm:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0 text-gray-400" />

                            <span className="truncate">
                              {slot.branch_name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <UsersRound className="h-4 w-4 shrink-0 text-gray-400" />

                            <span className="truncate">
                              {slot.staff_name ||
                                "All team members"}
                            </span>
                          </div>

                          {slot.reason && (
                            <div className="flex items-center gap-2 sm:col-span-2">
                              <MessageSquareText className="h-4 w-4 shrink-0 text-gray-400" />

                              <span>
                                {slot.reason}
                              </span>
                            </div>
                          )}

                          {slot.customer_name && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:col-span-2">
                              <span className="inline-flex items-center gap-1.5">
                                <UserRound className="h-4 w-4 text-gray-400" />
                                {slot.customer_name}
                              </span>

                              {slot.customer_phone && (
                                <span className="inline-flex items-center gap-1.5">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  {slot.customer_phone}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(slot.id)
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        title="Remove blocked time"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Explanation */}
      <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />

        <div>
          <p className="text-sm font-medium text-gray-800">
            How blocked time works
          </p>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            Glowee will treat these periods as unavailable and prevent
            customers from booking over them. Use this for breaks,
            maintenance, unavailable team members, or reservations received
            outside Glowee.
          </p>
        </div>
      </div>
    </div>
  );
}