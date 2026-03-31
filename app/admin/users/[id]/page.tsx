// app/admin/users/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, userApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type UserDetail = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  wallet_balance_aed: number;
  is_active: boolean;
  is_blocked: boolean;
  created_at: string;
  total_bookings: number;
  total_spent_aed: number;
  last_booking_at?: string | null;
};

type Booking = {
  id: string;
  scheduled_at: string;
  mode: "in_salon" | "home";
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  total_aed: number;
  salon_name: string;
  branch_name?: string | null;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  no_show:   "bg-gray-100 text-gray-600 border-gray-200",
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [user, setUser] = useState<UserDetail | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  async function load() {
    try {
      setError(null);
      setLoading(true);
      const data = await api.get(`/dashboard/admin/users/${userId}`);
      setUser(data.user);
      setBookings(data.bookings || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load user");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [userId]);

  async function handleToggleBlock() {
    if (!user) return;
    const action = user.is_blocked ? "unblock" : "block";
    if (!confirm(`Are you sure you want to ${action} ${user.name}?`)) return;

    setToggling(true);
    try {
await userApi.toggleBlock(userId);

setUser((prev) =>
  prev ? { ...prev, is_blocked: !prev.is_blocked } : prev
);
    } catch (e: any) {
      setError(e?.message || `Failed to ${action} user`);
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-semibold">{error || "User not found"}</p>
          <Link href="/admin/users" className="mt-4 inline-block text-pink-500 hover:underline">
            ← Back to users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/admin/users"
        className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to users
      </Link>

      {/* Header */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold">
<h1 className="text-2xl font-bold text-gray-900">{user.name || "Unnamed User"}</h1>            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-500">{user.phone}</p>
              {user.email && <p className="text-gray-500 text-sm">{user.email}</p>}
              <div className="mt-2 flex items-center gap-2">
                {user.is_blocked ? (
                  <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-red-50 text-red-700 border-red-200">
                    Blocked
                  </span>
                ) : user.is_active ? (
                  <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 border-gray-200">
                    Inactive
                  </span>
                )}
                <span className="text-xs text-gray-400">
Joined {user.created_at ? formatDate(user.created_at) : "-"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleToggleBlock}
            disabled={toggling}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
              user.is_blocked
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            {toggling ? "..." : user.is_blocked ? "Unblock User" : "Block User"}
          </button>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{user.total_bookings}</p>
            <p className="text-sm text-gray-500">Total Bookings</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">
              AED {Number(user.total_spent_aed).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">Total Spent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              AED {Number(user.wallet_balance_aed).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">Wallet Balance</p>
          </div>
        </div>
      </div>

      {/* Booking History */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Booking History
            {bookings.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                (last {bookings.length})
              </span>
            )}
          </h2>
        </div>

        {bookings.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium">No bookings yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Salon</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Mode</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{b.salon_name}</p>
                      {b.branch_name && (
                        <p className="text-xs text-gray-500">📍 {b.branch_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(b.scheduled_at).toLocaleDateString()}
                      <p className="text-xs text-gray-400">
                        {new Date(b.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                        b.mode === "home"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        {b.mode === "home" ? "Home" : "In-Salon"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[b.status] || STATUS_STYLES.pending}`}>
                        {b.status.charAt(0).toUpperCase() + b.status.slice(1).replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      AED {Number(b.total_aed).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}