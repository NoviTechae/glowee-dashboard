// app/admin/salons/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

type Branch = {
  id: string;
  name: string;
  city: string;
  area: string;
  supports_home_services: boolean;
  is_active: boolean;
};

type Salon = {
  id: string;
  name: string;
  salon_type: "in_salon" | "home" | "both";
};

export default function SalonDetailsPage() {
  const params = useParams<{ id: string }>();
  const salonId = String(params.id);

  const [salon, setSalon] = useState<Salon | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      setLoading(true);

      // ✅ Load salon info - clean API call
      const salonData = await api.get(`/dashboard/admin/salons/${salonId}`);
      setSalon(salonData.salon);

      // ✅ Load branches - clean API call
      const branchData = await api.get(`/dashboard/admin/salons/${salonId}/branches`);
      setBranches(branchData.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load salon");
      setSalon(null);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId]);

  async function handleDeleteBranch(branchId: string, branchName: string) {
    const confirmed = confirm(
      `⚠️ Delete Branch?\n\nAre you sure you want to delete "${branchName}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      // ✅ Clean delete call
      await api.delete(`/dashboard/admin/branches/${branchId}`);
      
      // Show success & reload
      alert(`✅ Branch "${branchName}" deleted successfully`);
      await load();
    } catch (e: any) {
      alert(`❌ Failed to delete branch: ${e?.message}`);
    }
  }

  const isHomeOnly = salon?.salon_type === "home";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link 
        href="/admin/salons" 
        className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to salons
      </Link>

      {/* Header */}
      <div className="mt-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {loading ? "Loading..." : salon?.name || "Salon"}
        </h1>
        {salon && (
          <div className="mt-2">
            <TypeBadge type={salon.salon_type} />
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Error loading salon</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Branches Section Header */}
      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Branches</h2>

        {/* Add Branch Button - Hidden for home-only */}
        {!isHomeOnly && !loading && (
          <Link
            href={`/admin/salons/${salonId}/branches/create`}
            className="rounded-xl bg-gray-900 hover:bg-black text-white px-4 py-2 text-sm font-semibold transition"
          >
            + Add Branch
          </Link>
        )}
      </div>

      {/* Home-Only Notice */}
      {isHomeOnly && !loading && (
        <div className="rounded-xl bg-purple-50 border border-purple-200 px-4 py-3 flex items-start">
          <svg className="w-5 h-5 text-purple-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-purple-800">Home Service Salon</p>
            <p className="text-sm text-purple-700 mt-1">
              This salon provides home services only. No physical branches are required.
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading branches...</p>
          </div>
        </div>
      )}

      {/* Branches Table */}
      {!loading && !isHomeOnly && (
        <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Location</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Home Service</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {branches.map((branch) => (
                <tr key={branch.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {branch.name}
                  </td>
                  
                  <td className="px-4 py-3 text-gray-600">
                    {branch.city} · {branch.area}
                  </td>
                  
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        branch.supports_home_services
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-gray-50 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {branch.supports_home_services ? "Yes" : "No"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        branch.is_active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          branch.is_active ? "bg-emerald-500" : "bg-gray-400"
                        }`}
                      />
                      {branch.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/salons/${salonId}/branches/${branch.id}/edit`}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                      >
                        ✏️ Edit
                      </Link>

                      <button
                        onClick={() => handleDeleteBranch(branch.id, branch.name)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Empty State */}
              {branches.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
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
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-500">No branches yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Click "Add Branch" to create your first branch
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
  );
}

/* ---------- TYPE BADGE ---------- */
function TypeBadge({ type }: { type: "in_salon" | "home" | "both" }) {
  const variants = {
    in_salon: { 
      label: "In-Salon", 
      color: "bg-blue-50 text-blue-700 border-blue-200" 
    },
    home: { 
      label: "Home Service", 
      color: "bg-purple-50 text-purple-700 border-purple-200" 
    },
    both: { 
      label: "In-Salon + Home", 
      color: "bg-pink-50 text-pink-700 border-pink-200" 
    },
  };

  const variant = variants[type] ?? variants.in_salon;

  return (
    <span 
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${variant.color}`}
    >
      {variant.label}
    </span>
  );
}