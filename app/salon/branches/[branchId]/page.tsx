// app/salon/branches/[branchId]/page.tsx
"use client";

import { api } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Branch = {
  id: string;
  name: string;
  city: string;
  area: string;
  address_line?: string | null;
  lat: number | string;
  lng: number | string;
  supports_home_services: boolean;
  is_active: boolean;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
};

type HourRow = {
  id?: string;
  branch_id?: string;
  day_of_week: number;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
};

const days = [
  { d: 0, label: "Sunday" },
  { d: 1, label: "Monday" },
  { d: 2, label: "Tuesday" },
  { d: 3, label: "Wednesday" },
  { d: 4, label: "Thursday" },
  { d: 5, label: "Friday" },
  { d: 6, label: "Saturday" },
];

function normalizeHours(apiRows: HourRow[]): HourRow[] {
  const map = new Map<number, HourRow>();
  for (const r of apiRows || []) map.set(r.day_of_week, r);

  return days.map(({ d }) => {
    const r = map.get(d);
    if (r) return { ...r };
    return {
      day_of_week: d,
      is_closed: false,
      open_time: "09:00",
      close_time: "22:00",
    };
  });
}

export default function SalonBranchManagePage() {
  const router = useRouter();
  const params = useParams<{ branchId: string }>();
  const branchId = params.branchId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [branch, setBranch] = useState<Branch | null>(null);
  const [hours, setHours] = useState<HourRow[]>([]);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      setSuccess(null);

      const bJson = await api.get(`/dashboard/salon/branches/${branchId}`);
      const hJson = await api.get(`/dashboard/salon/branches/${branchId}/hours`);

      setBranch(bJson.branch);
      setHours(normalizeHours(hJson.data || []));
    } catch (e: any) {
      setErr(e?.message || "Failed to load branch");
      setBranch(null);
      setHours([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (branchId) load();
  }, [branchId]);

  const canSave = useMemo(() => {
    if (!branch || saving) return false;
    if (!branch.name?.trim()) return false;
    if (!branch.city?.trim()) return false;
    if (!branch.area?.trim()) return false;
    if (String(branch.lat).trim() === "") return false;
    if (String(branch.lng).trim() === "") return false;
    return true;
  }, [branch, saving]);

  async function saveAll() {
    if (!branch) return;

    try {
      setSaving(true);
      setErr(null);
      setSuccess(null);

      await api.put(`/dashboard/salon/branches/${branchId}`, {
        name: branch.name.trim(),
        city: branch.city.trim(),
        area: branch.area.trim(),
        address_line: branch.address_line?.trim() || null,
        lat: Number(branch.lat),
        lng: Number(branch.lng),
        supports_home_services: !!branch.supports_home_services,
        is_active: !!branch.is_active,
        phone: branch.phone?.trim() || null,
        whatsapp: branch.whatsapp?.trim() || null,
        email: branch.email?.trim() || null,
        instagram: branch.instagram?.trim() || null,
      });

      await api.put(
        `/dashboard/salon/branches/${branchId}/hours`,
        hours.map((h) => ({
          day_of_week: h.day_of_week,
          is_closed: !!h.is_closed,
          open_time: h.is_closed ? null : h.open_time || null,
          close_time: h.is_closed ? null : h.close_time || null,
        }))
      );

      await load();
      setSuccess("Branch updated successfully");
    } catch (e: any) {
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading branch...</p>
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-700 font-medium">{err || "Branch not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {branch.name}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Manage branch details, contact info, and working hours
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>

          <button
            disabled={!canSave}
            onClick={saveAll}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {err && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 font-medium">{err}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-700 font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Branch Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Branch Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Branch Name *
            </label>
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={branch.name}
              onChange={(e) => setBranch({ ...branch, name: e.target.value })}
              placeholder="Downtown Branch"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address Line
            </label>
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={branch.address_line ?? ""}
              onChange={(e) =>
                setBranch({ ...branch, address_line: e.target.value || null })
              }
              placeholder="Building 123, Street XYZ"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              City *
            </label>
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={branch.city}
              onChange={(e) => setBranch({ ...branch, city: e.target.value })}
              placeholder="Dubai"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Area *
            </label>
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={branch.area}
              onChange={(e) => setBranch({ ...branch, area: e.target.value })}
              placeholder="Marina"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Latitude *
            </label>
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={String(branch.lat)}
              onChange={(e) => setBranch({ ...branch, lat: e.target.value })}
              placeholder="25.0772"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Longitude *
            </label>
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={String(branch.lng)}
              onChange={(e) => setBranch({ ...branch, lng: e.target.value })}
              placeholder="55.1304"
            />
          </div>

          <div className="md:col-span-2 space-y-3">
            <label className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors">
              <input
                type="checkbox"
                checked={!!branch.supports_home_services}
                onChange={(e) =>
                  setBranch({
                    ...branch,
                    supports_home_services: e.target.checked,
                  })
                }
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <div>
                <span className="font-semibold text-purple-900">Supports Home Services</span>
                <p className="text-xs text-purple-700 mt-1">Enable services at customer's location</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
              <input
                type="checkbox"
                checked={!!branch.is_active}
                onChange={(e) =>
                  setBranch({
                    ...branch,
                    is_active: e.target.checked,
                  })
                }
                className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <div>
                <span className="font-semibold text-green-900">Active</span>
                <p className="text-xs text-green-700 mt-1">Branch is visible to customers</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={branch.phone ?? ""}
              onChange={(e) =>
                setBranch({ ...branch, phone: e.target.value || null })
              }
              placeholder="+971 50 123 4567"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              WhatsApp
            </label>
            <input
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={branch.whatsapp ?? ""}
              onChange={(e) =>
                setBranch({ ...branch, whatsapp: e.target.value || null })
              }
              placeholder="+971 50 123 4567"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={branch.email ?? ""}
              onChange={(e) =>
                setBranch({ ...branch, email: e.target.value || null })
              }
              placeholder="branch@salon.com"
            />
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Working Hours</h2>
        </div>

        <div className="space-y-3">
          {hours.map((h) => {
            const day =
              days.find((x) => x.d === h.day_of_week)?.label ??
              `Day ${h.day_of_week}`;

            return (
              <div
                key={h.day_of_week}
                className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border-2 transition-all ${
                  h.is_closed
                    ? "bg-gray-50 border-gray-200"
                    : "bg-white border-purple-200 hover:border-purple-300"
                }`}
              >
                <div className="w-32">
                  <span className="font-bold text-gray-900">{day}</span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!h.is_closed}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setHours((prev) =>
                        prev.map((x) =>
                          x.day_of_week === h.day_of_week
                            ? {
                                ...x,
                                is_closed: v,
                                open_time: v ? null : x.open_time || "09:00",
                                close_time: v ? null : x.close_time || "22:00",
                              }
                            : x
                        )
                      );
                    }}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">Closed</span>
                </label>

                <div className="flex items-center gap-3">
                  <input
                    disabled={!!h.is_closed}
                    className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-center outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-400"
                    value={h.open_time ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setHours((prev) =>
                        prev.map((x) =>
                          x.day_of_week === h.day_of_week
                            ? { ...x, open_time: v }
                            : x
                        )
                      );
                    }}
                    placeholder="09:00"
                    type="time"
                  />
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <input
                    disabled={!!h.is_closed}
                    className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-center outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-400"
                    value={h.close_time ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setHours((prev) =>
                        prev.map((x) =>
                          x.day_of_week === h.day_of_week
                            ? { ...x, close_time: v }
                            : x
                        )
                      );
                    }}
                    placeholder="22:00"
                    type="time"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold text-blue-900 mb-1">Note</h3>
            <p className="text-sm text-blue-700">
              Branch creation and deletion are managed by admin. As a salon owner, you can edit branch details, contact information, and working hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}