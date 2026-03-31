// app/salon/staff/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { staffApi } from "@/lib/api";

type Staff = {
  id: string;
  name: string;
  phone: string | null;
  branch_id: string;
  branch_name: string;
  is_active: boolean;
  created_at: string;
  services: { service_id: string; service_name: string }[];
};

export default function SalonStaffPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);

  async function loadAll() {
    try {
      setLoading(true);
      setErr(null);

      const res = await staffApi.getAll();
      setStaff(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load staff");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function toggleActive(st: Staff) {
    try {
      setErr(null);
      await staffApi.update(st.id, { is_active: !st.is_active });
      await loadAll();
    } catch (e: any) {
      setErr(e?.message || "Failed to update staff");
    }
  }

  async function deleteStaff(staffId: string) {
    if (!confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) return;

    try {
      setErr(null);
      await staffApi.delete(staffId);
      setStaff((prev) => prev.filter((x) => x.id !== staffId));
    } catch (e: any) {
      setErr(e?.message || "Failed to delete staff");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Staff Management
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Manage your team members and assign services
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>

          <Link
            href="/salon/staff/create"
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Staff
          </Link>
        </div>
      </div>

      {/* Error Message */}
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

      {/* Staff List */}
      {staff.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No staff members yet</h3>
            <p className="text-gray-500 mb-6">Add your first team member to get started</p>
            <Link
              href="/salon/staff/create"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Staff Member
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      member.is_active
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                  >
                    {member.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {member.branch_name}
                </p>
              </div>

              {/* Info */}
              <div className="p-6 space-y-4">
                {member.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{member.phone}</span>
                  </div>
                )}

                {/* Services */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Services</span>
                  </div>
                  {member.services.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No services assigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {member.services.map((service) => (
                        <span
                          key={service.service_id}
                          className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-200"
                        >
                          {service.service_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gray-50 px-6 py-4 flex gap-2">
                <Link
                  href={`/salon/staff/${member.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Link>

                <button
                  onClick={() => toggleActive(member)}
                  className={`flex-1 px-3 py-2 rounded-xl font-semibold transition-colors text-sm ${
                    member.is_active
                      ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                      : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  {member.is_active ? "Active" : "Inactive"}
                </button>

                <button
                  onClick={() => deleteStaff(member.id)}
                  className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl font-semibold hover:bg-red-100 transition-colors"
                  title="Delete staff member"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}