// app/salon/bookings/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

type Booking = {
  id: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  total_aed: number;
  subtotal_aed?: number;
  fees_aed?: number;
  scheduled_at: string;
  created_at: string;
  customer_note?: string | null;
  user_name?: string | null;
  user_phone?: string | null;
  branch_name?: string | null;
};

type BookingItem = {
  id: string;
  service_name: string;
  staff_name?: string | null;
  unit_price_aed: number;
  duration_mins: number;
  qty: number;
};

function formatMoney(v: number | string | null | undefined) {
  return `AED ${Number(v || 0).toFixed(2)}`;
}

function statusClasses(status: string) {
  if (status === "pending") return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (status === "confirmed") return "bg-blue-100 text-blue-800 border-blue-300";
  if (status === "completed") return "bg-green-100 text-green-800 border-green-300";
  if (status === "cancelled") return "bg-red-100 text-red-800 border-red-300";
  if (status === "no_show") return "bg-gray-100 text-gray-800 border-gray-300";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

export default function SalonBookingDetailPage() {
  const params = useParams();
  const bookingId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [items, setItems] = useState<BookingItem[]>([]);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const res = await api.get(`/dashboard/salon/bookings/${bookingId}`);
      setBooking(res.booking || null);
      setItems(Array.isArray(res.items) ? res.items : []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load booking");
      setBooking(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (bookingId) load();
  }, [bookingId]);

  async function updateStatus(status: string) {
    try {
      setSaving(true);
      setErr(null);
      setSuccess(null);

      const res = await api.put(`/dashboard/salon/bookings/${bookingId}/status`, { status });
      setBooking((prev) =>
        prev
          ? {
              ...prev,
              status: (res?.booking?.status || status) as Booking["status"],
            }
          : prev
      );
      setSuccess("Status updated successfully");
    } catch (e: any) {
      setErr(e?.message || "Failed to update booking");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-semibold text-red-700 mb-4">{err || "Booking not found"}</p>
          <Link 
            href="/salon/bookings" 
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to bookings
          </Link>
        </div>
      </div>
    );
  }

  const totalDuration = items.reduce((sum, item) => sum + (item.duration_mins * item.qty), 0);

  return (
    <div className="space-y-6 p-6">
      <div className="max-w-5xl mx-auto">
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

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Booking Details
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <span className="font-mono text-sm font-bold text-gray-600">
                  #{booking.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600">
                  Created {new Date(booking.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full border-2 px-4 py-2 text-sm font-bold capitalize ${statusClasses(
                  booking.status
                )}`}
              >
                {booking.status.replace("_", " ")}
              </span>

              <select
                value={booking.status}
                disabled={saving}
                onChange={(e) => updateStatus(e.target.value)}
                className="rounded-xl border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Customer</h2>
            </div>

            <div className="space-y-4">
              <InfoRow icon="👤" label="Name" value={booking.user_name || "N/A"} />
              <InfoRow icon="📱" label="Phone" value={booking.user_phone || "N/A"} />
            </div>
          </div>

          {/* Appointment Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Appointment</h2>
            </div>

            <div className="space-y-4">
              <InfoRow 
                icon="📍" 
                label="Branch" 
                value={booking.branch_name || "N/A"} 
              />
              <InfoRow 
                icon="📅" 
                label="Scheduled" 
                value={new Date(booking.scheduled_at).toLocaleString()} 
              />
              <InfoRow 
                icon="⏱️" 
                label="Duration" 
                value={`${totalDuration} mins`} 
              />
            </div>
          </div>
        </div>

        {/* Customer Note */}
        {booking.customer_note && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span className="font-bold text-blue-900">Customer Note</span>
            </div>
            <p className="text-blue-800">{booking.customer_note}</p>
          </div>
        )}

        {/* Services */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900">Services</h2>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 font-semibold">No services found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((item) => {
                const lineTotal = Number(item.unit_price_aed || 0) * Number(item.qty || 1);

                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 text-lg">{item.service_name}</h3>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                          x{item.qty || 1}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{item.staff_name || "Not assigned"}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{item.duration_mins} mins</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatMoney(item.unit_price_aed)} each</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{formatMoney(lineTotal)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Payment Summary</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">{formatMoney(booking.subtotal_aed)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Fees</span>
              <span className="font-semibold text-gray-900">{formatMoney(booking.fees_aed)}</span>
            </div>
            <div className="border-t-2 border-gray-200 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {formatMoney(booking.total_aed)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <div className="text-xs font-semibold text-gray-500 uppercase">{label}</div>
        <div className="text-sm font-bold text-gray-900 mt-1">{value}</div>
      </div>
    </div>
  );
}