// app/admin/bookings/[id]/page.tsx  — NEW FILE
// Requires backend fix: fix-10a-backend-booking-detail.js

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Home,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  Store,
  UserRound,
  XCircle,
} from "lucide-react";

import { api } from "@/lib/api";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

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
  status: BookingStatus;

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

export default function BookingDetailPage() {
  const params = useParams();

  const bookingId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [items, setItems] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const data = await api.get(
        `/dashboard/admin/bookings/${bookingId}`
      );

      setBooking(data.booking);
      setItems(data.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (bookingId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  async function handleCancel() {
    if (!booking) return;

    const confirmed = confirm(
      `Cancel this booking?\n\n` +
        `Customer: ${booking.user_name || "Unknown"}\n` +
        `Business: ${booking.salon_name}\n` +
        `Date: ${new Date(
          booking.scheduled_at
        ).toLocaleString()}\n\n` +
        `Continue?`
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      setError(null);

      await api.post(
        `/dashboard/admin/bookings/${bookingId}/cancel`,
        {
          reason: "Cancelled by admin",
        }
      );

      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500" />

          <p className="mt-3 text-sm text-gray-500">
            Loading booking...
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-700">
            {error || "Booking not found"}
          </p>

          <Link
            href="/admin/bookings"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to bookings
          </Link>
        </div>
      </div>
    );
  }

  const canCancel =
    booking.status !== "cancelled" &&
    booking.status !== "completed";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Back */}
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bookings
      </Link>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-primary-600">
            Booking details
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Booking #{booking.id.slice(0, 8)}
            </h1>

            <StatusBadge status={booking.status} />
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Created{" "}
            {new Date(booking.created_at).toLocaleString()}
          </p>
        </div>

        {canCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />

            {cancelling
              ? "Cancelling..."
              : "Cancel booking"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer + Business */}
          <div className="grid gap-6 md:grid-cols-2">
            <InfoCard
              title="Customer"
              icon={UserRound}
            >
              <p className="text-lg font-semibold text-gray-900">
                {booking.user_name ||
                  `User #${booking.user_id}`}
              </p>

              <div className="mt-4 space-y-2">
                {booking.user_phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {booking.user_phone}
                  </div>
                )}

                {booking.user_email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {booking.user_email}
                  </div>
                )}
              </div>

              <Link
                href={`/admin/users/${booking.user_id}`}
                className="mt-5 inline-flex text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View user profile
              </Link>
            </InfoCard>

            <InfoCard
              title="Business"
              icon={Store}
            >
              <Link
                href={`/admin/salons/${booking.salon_id}`}
                className="text-lg font-semibold text-gray-900 transition hover:text-primary-600"
              >
                {booking.salon_name}
              </Link>

              <div className="mt-4 space-y-2">
                {booking.branch_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {booking.branch_name}
                  </div>
                )}

                {(booking.branch_area ||
                  booking.branch_city) && (
                  <p className="pl-6 text-sm text-gray-500">
                    {[
                      booking.branch_area,
                      booking.branch_city,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}

                {booking.branch_address && (
                  <p className="pl-6 text-sm text-gray-500">
                    {booking.branch_address}
                  </p>
                )}
              </div>
            </InfoCard>
          </div>

          {/* Appointment */}
          <InfoCard
            title="Appointment"
            icon={CalendarDays}
          >
            <div className="grid gap-5 sm:grid-cols-3">
              <DetailItem
                label="Date"
                value={new Date(
                  booking.scheduled_at
                ).toLocaleDateString(undefined, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              />

              <DetailItem
                label="Time"
                value={new Date(
                  booking.scheduled_at
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Mode
                </p>

                <div className="mt-2">
                  <ModeBadge mode={booking.mode} />
                </div>
              </div>
            </div>

            {booking.customer_note && (
              <div className="mt-6 border-t border-gray-100 pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Customer note
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {booking.customer_note}
                </p>
              </div>
            )}
          </InfoCard>

          {/* Services */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
                <ReceiptText className="h-4 w-4 text-primary-600" />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Services
                </h2>

                <p className="text-sm text-gray-500">
                  Services included in this booking.
                </p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                No services found for this booking.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50/70">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Service
                      </th>

                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Duration
                      </th>

                      <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Qty
                      </th>

                      <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Price
                      </th>

                      <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {item.service_name}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {item.duration_mins} min
                        </td>

                        <td className="px-6 py-4 text-center text-gray-600">
                          {item.qty}
                        </td>

                        <td className="px-6 py-4 text-right text-gray-600">
                          AED{" "}
                          {Number(
                            item.unit_price_aed || 0
                          ).toFixed(2)}
                        </td>

                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          AED{" "}
                          {(
                            Number(
                              item.unit_price_aed || 0
                            ) * Number(item.qty || 0)
                          ).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Payment sidebar */}
        <div>
          <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                <ReceiptText className="h-5 w-5 text-primary-600" />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Payment summary
                </h2>

                <p className="text-sm text-gray-500">
                  Booking amount breakdown
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <PaymentRow
                label="Service subtotal"
                value={booking.subtotal_aed}
              />

              <PaymentRow
                label="Glowee service fee"
                value={booking.fees_aed}
              />

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-end justify-between gap-4">
                  <span className="text-sm font-medium text-gray-900">
                    Customer total
                  </span>

                  <span className="text-xl font-semibold text-gray-900">
                    AED{" "}
                    {Number(
                      booking.total_aed || 0
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Booking ID
              </p>

              <p className="mt-1 break-all font-mono text-xs text-gray-600">
                {booking.id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
          <Icon className="h-4 w-4 text-primary-600" />
        </div>

        <h2 className="font-semibold text-gray-900">
          {title}
        </h2>
      </div>

      {children}
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-gray-900">
        {value}
      </p>
    </div>
  );
}

function PaymentRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-500">
        {label}
      </span>

      <span className="text-sm font-medium text-gray-900">
        AED {Number(value || 0).toFixed(2)}
      </span>
    </div>
  );
}

function ModeBadge({
  mode,
}: {
  mode: "in_salon" | "home";
}) {
  const isHome = mode === "home";
  const Icon = isHome ? Home : Store;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
      <Icon className="h-3.5 w-3.5" />
      {isHome ? "Home service" : "In-salon"}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: BookingStatus;
}) {
  const variants: Record<
    BookingStatus,
    {
      label: string;
      className: string;
    }
  > = {
    pending: {
      label: "Pending",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    },

    confirmed: {
      label: "Confirmed",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
    },

    completed: {
      label: "Completed",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    },

    cancelled: {
      label: "Cancelled",
      className:
        "border-red-200 bg-red-50 text-red-700",
    },
  };

  const variant = variants[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${variant.className}`}
    >
      {variant.label}
    </span>
  );
}