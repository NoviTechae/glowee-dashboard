// app/salon/staff/create/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function CreateStaffPage() {
  const router = useRouter();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [branchId, setBranchId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      try {
        setLoading(true);
        setErr(null);
        setSuccess(null);

        const [bRes, sRes] = await Promise.all([
          branchApi.getAll(),
          serviceApi.getAll(),
        ]);

        const b = Array.isArray(bRes.data) ? bRes.data : [];
        const s = Array.isArray(sRes.data) ? sRes.data : [];

        setBranches(b);
        setServices(s);

        if (b.length > 0) setBranchId(b[0].id);
      } catch (e: any) {
        setErr(e?.message || "Failed to load form data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);

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

      const created = await staffApi.create({
        name: name.trim(),
        phone: phone.trim() || null,
        branch_id: branchId,
        is_active: isActive,
      });

      const staffId = created?.staff?.id || created?.data?.id;
      if (!staffId) throw new Error("Staff create failed");

      await staffApi.updateServices(staffId, selectedServiceIds);

      setSuccess("Staff created successfully");

      router.push("/salon/staff");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Failed to create staff");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600" />
          <p className="mt-4 text-gray-600">Loading form...</p>
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
            Add Staff
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Create a new staff member and assign services
          </p>
        </div>

        <Link
          href="/salon/staff"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>
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

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Staff Details</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Staff Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                placeholder="e.g. Sara"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                placeholder="+971..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Branch *
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
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
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 transition-colors hover:bg-green-100">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div>
                  <span className="font-semibold text-green-900">Active</span>
                  <p className="mt-1 text-xs text-green-700">
                    Staff member is available for assignment and bookings
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Assign Services */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a4 4 0 00-5.656 0M14 10a2 2 0 11-4 0 2 2 0 014 0M12 2a10 10 0 100 20 10 10 0 000-20z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Assign Services *</h2>
          </div>

          {services.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm font-semibold text-gray-500">
              No services yet
            </div>
          ) : (
            <div className="space-y-4">
              {groupedServices.map(([cat, list]) => (
                <div key={cat} className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-3 font-bold text-gray-900">{cat}</div>

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
                          className={`rounded-full border px-4 py-2 text-sm font-bold transition-all ${
                            active
                              ? "border-pink-300 bg-pink-50 text-pink-700"
                              : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                          }`}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-6 w-6 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="mb-1 font-bold text-blue-900">Note</h3>
              <p className="text-sm text-blue-700">
                Each staff member must be assigned to at least one service so they can appear in availability and booking flows.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/salon/staff")}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Staff
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}