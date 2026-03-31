// app/admin/bookings/[id]/page.tsx  — NEW FILE
// Requires backend fix: fix-10a-backend-booking-detail.js

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

type BookingDetail = {
  id: string;
  user_id: string;
  user_name?: string;
  user_phone?: string;
  user_email?: string;
  salon_id: string;
  salon_name: string;
  branch_id?: string;
  branch_name?: string;
  branch_city?: string;
  branch_area?: string;
  branch_address?: string;
  scheduled_at: string;
  mode: "in_salon" | "home";
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  total_aed: number;
  subtotal_aed: number;
  fees_aed: number;
  customer_note?: string;
  created_at: string;
  updated_at: string;
};

type BookingItem = {
  id: string;
  service_name: string;
  qty: number;
  unit_price_aed: number;
  duration_mins: number;
};

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  no_show:   "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending:   "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show:   "No Show",
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [items, setItems] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    try {
      setError(null);
      setLoading(true);
      const data = await api.get(`/dashboard/admin/bookings/${bookingId}`);
      setBooking(data.booking);
      setItems(data.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [bookingId]);

  async function handleCancel() {
    if (!booking) return;
    if (!confirm(
      `Cancel this booking?\n\nCustomer: ${booking.user_name || "Unknown"}\nSalon: ${booking.salon_name}\nDate: ${new Date(booking.scheduled_at).toLocaleString()}`
    )) return;

    setCancelling(true);
    try {
      await api.post(`/dashboard/admin/bookings/${bookingId}/cancel`, {
        reason: "Cancelled by admin",
      });
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading booking...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-semibold">{error || "Booking not found"}</p>
          <Link href="/admin/bookings" className="mt-4 inline-block text-pink-500 hover:underline">
            ← Back to bookings
          </Link>
        </div>
      </div>
    );
  }

  const canCancel = booking.status !== "cancelled" && booking.status !== "completed";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/admin/bookings"
        className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to bookings
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Booking #{booking.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Created {new Date(booking.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${STATUS_STYLES[booking.status]}`}>
            {STATUS_LABELS[booking.status]}
          </span>
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              {cancelling ? "Cancelling..." : "Cancel Booking"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer */}
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Customer</h2>
          <div>
            <p className="font-semibold text-gray-900 text-lg">
              {booking.user_name || "Unknown"}
            </p>
            {booking.user_phone && (
              <p className="text-gray-600 text-sm">📱 {booking.user_phone}</p>
            )}
            {booking.user_email && (
              <p className="text-gray-600 text-sm">✉️ {booking.user_email}</p>
            )}
            <Link
              href={`/admin/users/${booking.user_id}`}
              className="mt-2 inline-block text-xs text-pink-600 hover:underline"
            >
              View user profile →
            </Link>
          </div>
        </div>

        {/* Salon */}
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Salon</h2>
          <div>
            <Link
              href={`/admin/salons/${booking.salon_id}`}
              className="font-semibold text-gray-900 text-lg hover:text-pink-600 hover:underline"
            >
              {booking.salon_name}
            </Link>
            {booking.branch_name && (
              <p className="text-gray-600 text-sm mt-1">📍 {booking.branch_name}</p>
            )}
            {(booking.branch_city || booking.branch_area) && (
              <p className="text-gray-500 text-sm">
                {[booking.branch_area, booking.branch_city].filter(Boolean).join(", ")}
              </p>
            )}
            {booking.branch_address && (
              <p className="text-gray-500 text-xs mt-1">{booking.branch_address}</p>
            )}
          </div>
        </div>

        {/* Appointment */}
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Appointment</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">
                {new Date(booking.scheduled_at).toLocaleDateString(undefined, {
                  weekday: "short", year: "numeric", month: "short", day: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Time</span>
              <span className="font-medium text-gray-900">
                {new Date(booking.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Mode</span>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                booking.mode === "home"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}>
                {booking.mode === "home" ? "Home Service" : "In-Salon"}
              </span>
            </div>
            {booking.customer_note && (
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500 mb-1">Customer Note</p>
                <p className="text-sm text-gray-700 italic">"{booking.customer_note}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Payment</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">AED {Number(booking.subtotal_aed).toFixed(2)}</span>
            </div>
            {booking.fees_aed > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fees</span>
                <span className="text-gray-900">AED {Number(booking.fees_aed).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold pt-2 border-t">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900 text-base">AED {Number(booking.total_aed).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      {items.length > 0 && (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Services</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Service</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Duration</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Qty</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Unit Price</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.service_name}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.duration_mins} min</td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.qty}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    AED {item.unit_price_aed.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    AED {(item.unit_price_aed * item.qty).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}