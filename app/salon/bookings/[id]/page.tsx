// app/salon/bookings/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageSquareText,
  Phone,
  ReceiptText,
  Scissors,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { api } from "@/lib/api";

type Booking = {
  id: string;
  status:
    | "pending"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "no_show";
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

function formatMoney(
  value: number | string | null | undefined
) {
  return `AED ${Number(value || 0).toFixed(2)}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (remaining === 0) {
    return `${hours} ${hours === 1 ? "hr" : "hrs"}`;
  }

  return `${hours}h ${remaining}m`;
}

function statusClasses(status: string) {
  if (status === "pending") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "confirmed") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "completed") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "cancelled") {
    return "bg-red-50 text-red-700";
  }

  if (status === "no_show") {
    return "bg-gray-100 text-gray-600";
  }

  return "bg-gray-100 text-gray-600";
}

export default function SalonBookingDetailPage() {
  const params = useParams();

  const bookingId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(
    null
  );

  const [booking, setBooking] = useState<Booking | null>(
    null
  );

  const [items, setItems] = useState<BookingItem[]>([]);

  useEffect(() => {
    async function load() {
      if (!bookingId) return;

      try {
        setLoading(true);
        setErr(null);

        const res = await api.get(
          `/dashboard/salon/bookings/${bookingId}`
        );

        setBooking(res.booking || null);

        setItems(
          Array.isArray(res.items) ? res.items : []
        );
      } catch (e: any) {
        setErr(
          e?.message || "Failed to load booking"
        );

        setBooking(null);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [bookingId]);

  async function updateStatus(status: string) {
    try {
      setSaving(true);
      setErr(null);
      setSuccess(null);

      const res = await api.put(
        `/dashboard/salon/bookings/${bookingId}/status`,
        { status }
      );

      setBooking((prev) =>
        prev
          ? {
              ...prev,
              status: (
                res?.booking?.status || status
              ) as Booking["status"],
            }
          : prev
      );

      setSuccess("Booking status updated.");
    } catch (e: any) {
      setErr(
        e?.message ||
          "Failed to update booking status"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading booking...
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-6 w-6 text-red-500" />

          <p className="mt-3 font-medium text-red-800">
            {err || "Booking not found"}
          </p>

          <Link
            href="/salon/bookings"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary-600 transition hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to bookings
          </Link>
        </div>
      </div>
    );
  }

  const totalDuration = items.reduce(
    (sum, item) =>
      sum +
      Number(item.duration_mins || 0) *
        Number(item.qty || 1),
    0
  );

  const displayedSubtotal =
    booking.subtotal_aed ??
    items.reduce(
      (sum, item) =>
        sum +
        Number(item.unit_price_aed || 0) *
          Number(item.qty || 1),
      0
    );

  return (
    <div className="mx-auto max-w-5xl space-y-7 p-6 lg:p-8">
      {/* Header */}
      <div>
        <Link
          href="/salon/bookings"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to bookings
        </Link>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                Booking details
              </h1>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClasses(
                  booking.status
                )}`}
              >
                {booking.status.replace("_", " ")}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
              <span>
                #{booking.id.slice(0, 8).toUpperCase()}
              </span>

              <span className="text-gray-300">•</span>

              <span>
                Created {formatDate(booking.created_at)}
              </span>
            </div>
          </div>

          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Booking status
            </label>

            <select
              value={booking.status}
              disabled={saving}
              onChange={(e) =>
                updateStatus(e.target.value)
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 disabled:opacity-50"
            >
              <option value="pending">
                Pending
              </option>

              <option value="confirmed">
                Confirmed
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="cancelled">
                Cancelled
              </option>

              <option value="no_show">
                No show
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages */}
      {err && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

          <div>
            <p className="text-sm font-medium text-red-800">
              Something went wrong
            </p>

            <p className="mt-0.5 text-sm text-red-600">
              {err}
            </p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />

          <p className="text-sm font-medium text-emerald-700">
            {success}
          </p>
        </div>
      )}

      {/* Main info */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Customer */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <UserRound className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Customer
                </h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  Customer contact information.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100 px-6">
            <InfoRow
              icon={<UserRound className="h-4 w-4" />}
              label="Name"
              value={booking.user_name || "Not available"}
            />

            <InfoRow
              icon={<Phone className="h-4 w-4" />}
              label="Phone"
              value={booking.user_phone || "Not available"}
            />
          </div>
        </section>

        {/* Appointment */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Appointment
                </h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  Booking schedule and location.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100 px-6">
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Location"
              value={
                booking.branch_name || "Not available"
              }
            />

            <InfoRow
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="Scheduled"
              value={formatDateTime(
                booking.scheduled_at
              )}
            />

            <InfoRow
              icon={<Clock3 className="h-4 w-4" />}
              label="Duration"
              value={formatDuration(totalDuration)}
            />
          </div>
        </section>
      </div>

      {/* Customer note */}
      {booking.customer_note && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
              <MessageSquareText className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900">
                Customer note
              </p>

              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                {booking.customer_note}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Scissors className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Services
              </h2>

              <p className="mt-0.5 text-sm text-gray-500">
                Services included in this booking.
              </p>
            </div>
          </div>

          <span className="text-sm text-gray-500">
            {items.length}{" "}
            {items.length === 1
              ? "service"
              : "services"}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Scissors className="mx-auto h-5 w-5 text-gray-400" />

            <p className="mt-3 text-sm font-medium text-gray-700">
              No services found
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const quantity = Number(item.qty || 1);

              const lineTotal =
                Number(item.unit_price_aed || 0) *
                quantity;

              return (
                <div
                  key={item.id}
                  className="px-6 py-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {item.service_name}
                        </h3>

                        {quantity > 1 && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            ×{quantity}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1.5">
                          <UsersRound className="h-3.5 w-3.5" />
                          {item.staff_name ||
                            "Not assigned"}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatDuration(
                            item.duration_mins
                          )}
                        </span>

                        <span>
                          {formatMoney(
                            item.unit_price_aed
                          )}{" "}
                          each
                        </span>
                      </div>
                    </div>

                    <p className="shrink-0 text-sm font-semibold text-gray-900">
                      {formatMoney(lineTotal)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Payment summary */}
      <section className="rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <WalletCards className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Payment summary
              </h2>

              <p className="mt-0.5 text-sm text-gray-500">
                Booking price breakdown.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="ml-auto max-w-md space-y-3">
            <SummaryRow
              label="Subtotal"
              value={formatMoney(displayedSubtotal)}
            />

            <SummaryRow
              label="Fees"
              value={formatMoney(
                booking.fees_aed || 0
              )}
            />

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-gray-900">
                  Total
                </span>

                <span className="text-xl font-semibold text-gray-900">
                  {formatMoney(
                    booking.total_aed
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-4">
      <span className="shrink-0 text-gray-400">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-xs text-gray-400">
          {label}
        </p>

        <p className="mt-0.5 break-words text-sm font-medium text-gray-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-500">
        {label}
      </span>

      <span className="text-sm font-medium text-gray-800">
        {value}
      </span>
    </div>
  );
}