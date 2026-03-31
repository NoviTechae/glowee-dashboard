// app/admin/home-services/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Salon = {
  id: string;
  name: string;
  salon_type: "in_salon" | "home" | "both";
  is_active: boolean;
  created_at?: string;
  email?: string;
  phone?: string;
};

function TypeBadge({ type }: { type: Salon["salon_type"] }) {
  const map: Record<Salon["salon_type"], { label: string; cls: string }> = {
    home: { label: "Home Service", cls: "bg-purple-50 text-purple-700 border-purple-200" },
    in_salon: { label: "In-Salon", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    both: { label: "Both", cls: "bg-pink-50 text-pink-700 border-pink-200" },
  };

  const x = map[type];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${x.cls}`}>
      {x.label}
    </span>
  );
}

export default function AdminHomeServicesPage() {
  const [loading, setLoading] = useState(true);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      // ✅ Clean API call
      const json = await api.get("/dashboard/admin/salons?type=home_only");
      setSalons(json.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load home services");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleToggleStatus(id: string, name: string, currentStatus: boolean) {
    const newStatus = !currentStatus;
    const action = newStatus ? "activate" : "deactivate";

    const confirmed = confirm(
      `${action.charAt(0).toUpperCase() + action.slice(1)} "${name}"?\n\n` +
        `This will ${action} the home service salon.`
    );

    if (!confirmed) return;

    try {
      await api.put(`/dashboard/admin/salons/${id}`, {
        is_active: newStatus,
      });

      // Update local state
      setSalons((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: newStatus } : s))
      );

      alert(`✅ Successfully ${action}d "${name}"`);
    } catch (e: any) {
      alert(`❌ Failed to ${action}: ${e?.message}`);
    }
  }

  async function onDelete(id: string, name: string) {
    const confirmed = confirm(
      `⚠️ PERMANENT DELETE\n\n` +
        `This will permanently delete "${name}" and all related data:\n` +
        `• Services\n` +
        `• Staff\n` +
        `• Dashboard account\n\n` +
        `This action CANNOT be undone.\n\n` +
        `Continue?`
    );

    if (!confirmed) return;

    try {
      // ✅ Clean API call
      await api.delete(`/dashboard/admin/salons/${id}`);

      alert(`✅ "${name}" deleted successfully`);
      await load();
    } catch (e: any) {
      alert(`❌ Delete failed: ${e?.message}`);
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Home Service Salons</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage home-based beauty service providers
            </p>
          </div>

          <Link
            href="/admin/salons/create?type=home"
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black transition"
          >
            + Add Home Service
          </Link>
        </div>

        {/* Info Box */}
        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-purple-600 mr-3 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-purple-800">About Home Service Salons</p>
              <p className="text-sm text-purple-700 mt-1">
                Home service salons provide beauty services at customer locations. They don't have
                physical branches and services are delivered on-demand.
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading home services...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-500 mr-2 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-700">
                <strong className="font-semibold">Error:</strong> {error}
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Contact</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Created</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salons.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/admin/salons/${s.id}`}
                        className="text-gray-900 hover:text-pink-600 hover:underline"
                      >
                        {s.name}
                      </Link>
                      <div className="mt-1">
                        <TypeBadge type={s.salon_type} />
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {s.email && <div className="text-xs">📧 {s.email}</div>}
                      {s.phone && <div className="text-xs mt-1">📱 {s.phone}</div>}
                      {!s.email && !s.phone && (
                        <span className="text-gray-400 text-xs">No contact info</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(s.id, s.name, s.is_active)}
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border transition ${
                          s.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            s.is_active ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                        />
                        {s.is_active ? "Active" : "Disabled"}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/salons/${s.id}/edit`}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                        >
                          ✏️ Edit
                        </Link>

                        <button
                          onClick={() => onDelete(s.id, s.name)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Empty State */}
                {salons.length === 0 && (
                  <tr>
                    <td className="px-4 py-12 text-center text-gray-500" colSpan={5}>
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
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                        <p className="text-sm font-medium">No home service salons yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Create a salon with "Home Service" type to see it here
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}