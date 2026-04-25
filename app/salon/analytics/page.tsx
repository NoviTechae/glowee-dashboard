// app/salon/analytics/page.tsx

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { Loading } from "@/app/components/ui/Loading";
import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";

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
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
    try {
      setLoading(true);

      const token = getToken();

      const res = await fetch(`${API_BASE}/dashboard/salon/analytics`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to load analytics");
      }

      setData(json);
    } catch (error: any) {
      toast.error(error.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) return <Loading size="lg" />;

  if (!data) {
    return (
      <div className="text-center text-gray-500 py-12">
        No analytics available
      </div>
    );
  }

  const completionRate =
    data.total_bookings > 0
      ? Math.round((data.completed_bookings / data.total_bookings) * 100)
      : 0;

  const cancellationRate =
    data.total_bookings > 0
      ? Math.round((data.cancelled_bookings / data.total_bookings) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">
          Track your salon performance and customer demand
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Bookings" value={data.total_bookings} />
        <StatCard
          title="Completed"
          value={data.completed_bookings}
          color="text-emerald-600"
        />
        <StatCard
          title="Cancelled"
          value={data.cancelled_bookings}
          color="text-red-600"
        />
        <StatCard
          title="Revenue"
          value={`AED ${Number(data.total_revenue || 0).toFixed(2)}`}
          color="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Booking Health
          </h2>

          <div className="space-y-4">
            <ProgressRow
              label="Completion Rate"
              value={completionRate}
              helper={`${data.completed_bookings} completed bookings`}
            />

            <ProgressRow
              label="Cancellation Rate"
              value={cancellationRate}
              helper={`${data.cancelled_bookings} cancelled bookings`}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Services
          </h2>

          {data.top_services.length === 0 ? (
            <p className="text-sm text-gray-500">No service data yet</p>
          ) : (
            <div className="space-y-3">
              {data.top_services.map((service, index) => (
                <div
                  key={`${service.service_name}-${index}`}
                  className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {service.service_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      #{index + 1} most requested
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {service.total_bookings}
                    </p>
                    <p className="text-xs text-gray-500">bookings</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color = "text-gray-900",
}: {
  title: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-600">{title}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
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
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value}%</p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-pink-500"
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>

      <p className="mt-1 text-xs text-gray-500">{helper}</p>
    </div>
  );
}