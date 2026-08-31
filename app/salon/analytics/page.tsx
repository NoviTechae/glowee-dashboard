// app/salon/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Scissors,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";

type TopService = {
  service_name: string;
  total_bookings: number;
};

type AnalyticsData = {
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
  top_services: TopService[];
};

export default function SalonAnalyticsPage() {
  const [data, setData] =
    useState<AnalyticsData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);

        const token = getToken();

        const res = await fetch(
          `${API_BASE}/dashboard/salon/analytics`,
          {
            headers: {
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
          }
        );

        const json = await res.json();

        if (!res.ok) {
          throw new Error(
            json.error ||
              "Failed to load analytics"
          );
        }

        setData(json);
      } catch (error: any) {
        const message =
          error.message ||
          "Failed to load analytics";

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
          <AlertCircle className="mx-auto h-6 w-6 text-gray-400" />

          <h2 className="mt-3 text-sm font-medium text-gray-800">
            Analytics unavailable
          </h2>

          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
            {error ||
              "No analytics data is available yet."}
          </p>
        </div>
      </div>
    );
  }

  const totalBookings = Number(
    data.total_bookings || 0
  );

  const completedBookings = Number(
    data.completed_bookings || 0
  );

  const cancelledBookings = Number(
    data.cancelled_bookings || 0
  );

  const completionRate =
    totalBookings > 0
      ? Math.round(
          (completedBookings /
            totalBookings) *
            100
        )
      : 0;

  const cancellationRate =
    totalBookings > 0
      ? Math.round(
          (cancelledBookings /
            totalBookings) *
            100
        )
      : 0;

  const highestServiceBookings =
    data.top_services?.length > 0
      ? Math.max(
          ...data.top_services.map(
            (service) =>
              Number(
                service.total_bookings || 0
              )
          )
        )
      : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-7 p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Analytics
        </h1>

        <p className="mt-1.5 max-w-2xl text-sm text-gray-500">
          Understand your booking performance,
          revenue and most requested services.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total bookings"
          value={totalBookings}
          icon={
            <BarChart3 className="h-5 w-5" />
          }
        />

        <SummaryCard
          label="Completed"
          value={completedBookings}
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
        />

        <SummaryCard
          label="Cancelled"
          value={cancelledBookings}
          icon={
            <XCircle className="h-5 w-5" />
          }
        />

        <SummaryCard
          label="Revenue"
          value={formatMoney(
            data.total_revenue
          )}
          icon={
            <CircleDollarSign className="h-5 w-5" />
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Booking performance */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <SectionHeader
            icon={
              <BarChart3 className="h-5 w-5" />
            }
            title="Booking performance"
            description="A snapshot of completed and cancelled bookings."
          />

          <div className="space-y-7 p-6">
            <ProgressRow
              label="Completion rate"
              value={completionRate}
              helper={`${completedBookings} of ${totalBookings} bookings completed`}
            />

            <ProgressRow
              label="Cancellation rate"
              value={cancellationRate}
              helper={`${cancelledBookings} of ${totalBookings} bookings cancelled`}
            />

            {totalBookings === 0 && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-sm text-gray-500">
                  Booking performance will appear
                  once your business starts receiving
                  bookings.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Top services */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <SectionHeader
            icon={
              <Scissors className="h-5 w-5" />
            }
            title="Top services"
            description="Your most requested services based on booking count."
          />

          {data.top_services.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                <Scissors className="h-5 w-5 text-gray-400" />
              </div>

              <h3 className="mt-3 text-sm font-medium text-gray-800">
                No service data yet
              </h3>

              <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                Service performance will appear
                after customers start making
                bookings.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.top_services.map(
                (service, index) => {
                  const bookingCount =
                    Number(
                      service.total_bookings ||
                        0
                    );

                  const relativeWidth =
                    highestServiceBookings > 0
                      ? Math.round(
                          (bookingCount /
                            highestServiceBookings) *
                            100
                        )
                      : 0;

                  return (
                    <div
                      key={`${service.service_name}-${index}`}
                      className="px-6 py-5"
                    >
                      <div className="flex items-start justify-between gap-5">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-600">
                            {index + 1}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {service.service_name}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {bookingCount}{" "}
                              {bookingCount === 1
                                ? "booking"
                                : "bookings"}
                            </p>
                          </div>
                        </div>

                        <span className="text-sm font-semibold text-gray-900">
                          {bookingCount}
                        </span>
                      </div>

                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{
                            width: `${relativeWidth}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {value}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-gray-100 px-6 py-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          {icon}
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">
            {title}
          </h2>

          <p className="mt-0.5 text-sm text-gray-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  const safeValue = Math.min(
    Math.max(value, 0),
    100
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-gray-700">
          {label}
        </p>

        <p className="text-sm font-semibold text-gray-900">
          {safeValue}%
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-primary-500 transition-all"
          style={{
            width: `${safeValue}%`,
          }}
        />
      </div>

      <p className="mt-2 text-xs text-gray-400">
        {helper}
      </p>
    </div>
  );
}

function formatMoney(
  value: number | string | null | undefined
) {
  return `AED ${Number(value || 0).toFixed(
    2
  )}`;
}