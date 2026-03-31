// app/admin/salons/[id]/branches/[branchId]/edit/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

type BranchForm = {
  id: string;
  name: string;
  city: string;
  area: string;
  address_line?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  supports_home_services?: boolean;
  is_active?: boolean;
  lat?: number;
  lng?: number;
};

export default function EditBranchPage() {
  const params = useParams();
  const router = useRouter();

  const salonId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const branchId = Array.isArray(params.branchId) 
    ? params.branchId[0] 
    : (params.branchId as string);

  const [form, setForm] = useState<BranchForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!branchId) return;

      try {
        setLoading(true);
        setError(null);

        // ✅ Clean API call
        const data = await api.get(`/dashboard/admin/branches/${branchId}`);
        setForm(data.branch ?? null);
      } catch (e: any) {
        setError(e?.message || "Failed to load branch");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [branchId]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    // ✅ Validation
    setError(null);

    if (!form.name?.trim()) {
      setError("Branch name is required");
      return;
    }

    if (!form.city?.trim()) {
      setError("City is required");
      return;
    }

    if (!form.area?.trim()) {
      setError("Area is required");
      return;
    }

    if (form.email && !form.email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    try {
      setSaving(true);

      // ✅ Clean API call with all fields
      await api.put(`/dashboard/admin/branches/${branchId}`, {
        name: form.name.trim(),
        city: form.city.trim(),
        area: form.area.trim(),
        address_line: form.address_line?.trim() || null,
        phone: form.phone?.trim() || null,
        email: form.email?.trim() || null,
        whatsapp: form.whatsapp?.trim() || null,
        instagram: form.instagram?.trim() || null,
        supports_home_services: form.supports_home_services ?? false,
        is_active: form.is_active ?? true,
      });

      // Success - redirect
      router.push(`/admin/salons/${salonId}`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to update branch");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading branch...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-semibold">Branch not found</p>
          <Link
            href={`/admin/salons/${salonId}`}
            className="mt-4 inline-block text-pink-500 hover:underline"
          >
            ← Back to salon
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link
          href={`/admin/salons/${salonId}`}
          className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to salon
        </Link>

        {/* Header */}
        <div className="mt-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Branch</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update branch information and settings
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSave} className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
          {/* Basic Info Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name *
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setError(null);
                  }}
                  placeholder="e.g., Glowee - Marina Branch"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                    value={form.city}
                    onChange={(e) => {
                      setForm({ ...form, city: e.target.value });
                      setError(null);
                    }}
                    placeholder="Abu Dhabi"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                    value={form.area}
                    onChange={(e) => {
                      setForm({ ...form, area: e.target.value });
                      setError(null);
                    }}
                    placeholder="Al Reem Island"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                  value={form.address_line ?? ""}
                  onChange={(e) => setForm({ ...form, address_line: e.target.value })}
                  placeholder="Building name, street, floor, unit..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Full address details for customers
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info Section */}
          <div className="pt-6 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                  value={form.phone ?? ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+971 50 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                  value={form.whatsapp ?? ""}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="+971 50 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                  value={form.email ?? ""}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    setError(null);
                  }}
                  placeholder="branch@salon.ae"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-gray-500">@</span>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                    value={form.instagram ?? ""}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                    placeholder="glowee_marina"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="pt-6 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <input
                  id="home-services"
                  type="checkbox"
                  checked={!!form.supports_home_services}
                  onChange={(e) =>
                    setForm({ ...form, supports_home_services: e.target.checked })
                  }
                  className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-300 mt-0.5"
                />
                <div>
                  <label htmlFor="home-services" className="text-sm font-medium text-gray-700">
                    Supports Home Services
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Enable if this branch offers services at customer locations
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="active"
                  type="checkbox"
                  checked={!!form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-300 mt-0.5"
                />
                <div>
                  <label htmlFor="active" className="text-sm font-medium text-gray-700">
                    Active (Visible to customers)
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Inactive branches are hidden from the app
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Location Info (Read-only) */}
          {form.lat && form.lng && (
            <div className="pt-6 border-t">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Latitude:</span>
                    <span className="ml-2 font-mono text-gray-900">
                      {Number(form.lat).toFixed(6)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Longitude:</span>
                    <span className="ml-2 font-mono text-gray-900">
                      {Number(form.lng).toFixed(6)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Location was set during branch creation
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-6 border-t flex gap-3">
            <button
              type="button"
              onClick={() => router.push(`/admin/salons/${salonId}`)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white rounded-lg px-4 py-2.5 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}