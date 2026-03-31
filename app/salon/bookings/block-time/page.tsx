// app/salon/bookings/block-time/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { blockedSlotsApi, branchApi, staffApi } from "@/lib/api";

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

export default function BlockTimeSlotsPage() {
  const router = useRouter();

  // Form state
  const [branchId, setBranchId] = useState("");
  const [staffId, setStaffId] = useState(""); // empty = all staff
  const [blockedDate, setBlockedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Data
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter for viewing slots
  const [viewDate, setViewDate] = useState("");

  // Load branches and staff
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const [bRes, sRes] = await Promise.all([
          branchApi.getAll(),
          staffApi.getAll(),
        ]);

        setBranches(Array.isArray(bRes.data) ? bRes.data : []);
        setAllStaff(Array.isArray(sRes.data) ? sRes.data : []);

        // Set today as default date
        const today = new Date().toISOString().split("T")[0];
        setBlockedDate(today);
        setViewDate(today);
      } catch (e: any) {
        setErr(e?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Load blocked slots when date or branch changes
  useEffect(() => {
    if (viewDate) {
      loadBlockedSlots();
    }
  }, [viewDate, branchId]);

  async function loadBlockedSlots() {
    try {
      const res = await blockedSlotsApi.getAll({
        date: viewDate,
        branch_id: branchId || undefined,
      });

      setBlockedSlots(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      console.error("Failed to load blocked slots:", e);
    }
  }

  // Get staff for selected branch
  const branchStaff = branchId
    ? allStaff.filter((s) => s.branch_id === branchId)
    : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);

    // Validation
    if (!branchId) {
      setErr("Please select a branch");
      return;
    }

    if (!blockedDate) {
      setErr("Please select a date");
      return;
    }

    if (!startTime || !endTime) {
      setErr("Please select start and end times");
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

      setSuccess("Time slot blocked successfully!");

      // Reset form
      setStartTime("");
      setEndTime("");
      setReason("");
      setCustomerName("");
      setCustomerPhone("");
      setStaffId("");

      // Reload blocked slots
      loadBlockedSlots();
    } catch (e: any) {
      setErr(e?.message || "Failed to block time slot");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this blocked time slot?")) {
      return;
    }

    try {
      setErr(null);
      await blockedSlotsApi.delete(id);
      setSuccess("Blocked slot removed successfully");
      loadBlockedSlots();
    } catch (e: any) {
      setErr(e?.message || "Failed to delete blocked slot");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <Link
          href="/salon/bookings"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to bookings
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Block Time Slots
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Reserve time slots for walk-in customers or external bookings to prevent app booking conflicts
          </p>
        </div>

        {/* Messages */}
        {err && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 font-medium">{err}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-700 font-medium">{success}</span>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Create Block Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Create Block</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Branch *
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Select branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Staff (Optional - Leave empty to block for all staff)
                </label>
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  disabled={!branchId}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:bg-gray-100"
                >
                  <option value="">All staff at this branch</option>
                  {branchStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={blockedDate}
                  onChange={(e) => setBlockedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Walk-in customer, Phone booking, Maintenance"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Blocking...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Block Time Slot
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Blocked Slots List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Blocked Slots</h2>
              </div>

              <input
                type="date"
                value={viewDate}
                onChange={(e) => setViewDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {blockedSlots.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 font-semibold">No blocked slots for this date</p>
                </div>
              ) : (
                blockedSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-4 border-2 border-orange-200 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-bold text-orange-900">
                          {slot.start_time} - {slot.end_time}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDelete(slot.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Remove block"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-1 text-sm text-orange-800">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="font-semibold">{slot.branch_name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{slot.staff_name || "All staff"}</span>
                      </div>

                      {slot.reason && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          <span>{slot.reason}</span>
                        </div>
                      )}

                      {slot.customer_name && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{slot.customer_name}</span>
                          {slot.customer_phone && (
                            <span className="text-orange-600">• {slot.customer_phone}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold text-blue-900 mb-1">How it works</h3>
              <p className="text-sm text-blue-800">
                Blocked time slots prevent customers from booking those specific times in the mobile app. 
                Use this feature when you have bookings from walk-ins, phone calls, or other external sources 
                to avoid double-booking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}