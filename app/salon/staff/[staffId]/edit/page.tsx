// app/salon/staff/[staffId]/edit/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { branchApi, serviceApi, staffApi } from "@/lib/api";

type Branch = {
  id: string;
  name: string;
};

type Service = {
  id: string;
  name: string;
  category_name?: string | null;
};

type StaffDetail = {
  id: string;
  name: string;
  phone: string | null;
  branch_id: string;
  is_active: boolean;
  services?: { service_id: string; service_name: string }[];
};

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = Array.isArray(params.staffId)
    ? params.staffId[0]
    : (params.staffId as string);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffDetail | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [branchId, setBranchId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const groupedServices = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of services) {
      const key = s.category_name || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [services]);

  useEffect(() => {
    async function load() {
      if (!staffId) return;

      try {
        setLoading(true);
        setErr(null);

        const [bRes, sRes, stRes] = await Promise.all([
          branchApi.getAll(),
          serviceApi.getAll(),
          staffApi.getById(staffId),
        ]);

        const b = Array.isArray(bRes.data) ? bRes.data : [];
        const s = Array.isArray(sRes.data) ? sRes.data : [];
        const st = stRes.staff || stRes.data || null;

        if (!st) throw new Error("Staff not found");

        setBranches(b);
        setServices(s);
        setStaff(st);

        setName(st.name || "");
        setPhone(st.phone || "");
        setBranchId(st.branch_id || "");
        setIsActive(!!st.is_active);
        setSelectedServiceIds(
          Array.isArray(st.services) ? st.services.map((x: any) => x.service_id) : []
        );
      } catch (e: any) {
        setErr(e?.message || "Failed to load staff");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [staffId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (name.trim().length < 2) {
      setErr("Staff name is too short");
      return;
    }

    if (!branchId) {
      setErr("Please select a branch");
      return;
    }

    if (selectedServiceIds.length === 0) {
      setErr("Pick at least one service");
      return;
    }

    try {
      setSaving(true);

      await staffApi.update(staffId, {
        name: name.trim(),
        phone: phone.trim() || null,
        branch_id: branchId,
        is_active: isActive,
      });

      await staffApi.updateServices(staffId, selectedServiceIds);

      router.push("/salon/staff");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Failed to update staff");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading staff details...</p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-semibold text-red-700 mb-4">{err || "Staff not found"}</p>
          <Link 
            href="/salon/staff" 
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to staff
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <Link 
          href="/salon/staff" 
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to staff
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Edit Staff Member
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Update staff information and assign services
          </p>
        </div>

        {/* Error Message */}
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

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Staff Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter staff name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="+971 50 123 4567"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Branch *
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">Select branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div>
                    <span className="font-semibold text-green-900">Active</span>
                    <p className="text-xs text-green-700 mt-1">Staff member is visible and can accept bookings</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Assigned Services *</h2>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Select the services this staff member can provide. You must select at least one service.
            </p>

            <div className="space-y-4">
              {groupedServices.map(([cat, list]) => (
                <div key={cat} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <h3 className="font-bold text-gray-900">{cat}</h3>
                    <span className="text-xs text-gray-500">
                      ({list.filter(s => selectedServiceIds.includes(s.id)).length} selected)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {list.map((s) => {
                      const active = selectedServiceIds.includes(s.id);

                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() =>
                            setSelectedServiceIds((prev) =>
                              active ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                            )
                          }
                          className={`rounded-full px-4 py-2.5 text-sm font-semibold border-2 transition-all ${
                            active
                              ? "border-purple-300 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                              : "border-gray-200 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-50"
                          }`}
                        >
                          {active && (
                            <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Count */}
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-purple-900">
                  {selectedServiceIds.length} service{selectedServiceIds.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/salon/staff")}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        </form>
      </div>
    </div>
  );
}