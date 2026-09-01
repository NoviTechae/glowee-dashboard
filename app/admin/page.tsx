// app/admin/page.tsx  — FIXED VERSION
// Changes:
//   1. Removed debug block (process.env.NODE_ENV check + JSON.stringify pre)
//   2. Removed console.log("📊 Stats API Response:", data)
//   3. Switched raw api.get("/dashboard/admin/stats") → statsApi.getDashboard()
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  House,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";

import { Card } from "@/app/components/ui/Card";
import { Loading } from "@/app/components/ui/Loading";
import { adminBookingApi, statsApi } from "@/lib/api";

interface AdminStats {
  salons: {
    total: number;
    active: number;
  };
  types: {
    in_salon: number;
    home: number;
    both: number;
  };
  users?: {
    total: number;
    active: number;
  };
  bookings?: {
    total: number;
    today: number;
    thisMonth: number;
  };
}

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  today: number;
  thisMonth: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);

      const [dashboardData, bookingData] = await Promise.all([
        statsApi.getDashboard(),
        adminBookingApi.getStats(),
      ]);

      setStats(dashboardData);
      setBookingStats(bookingData);
    } catch (error: any) {
      setError(error.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <Loading size="lg" />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Platform overview and operational activity.
          </p>
        </div>

        <Card>
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>

            <h2 className="text-base font-semibold text-gray-900">
              Unable to load dashboard
            </h2>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              {error}
            </p>

            <button
              type="button"
              onClick={loadData}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const totalBusinesses = stats?.salons.total || 0;
  const activeBusinesses = stats?.salons.active || 0;
  const totalUsers = stats?.users?.total || 0;
  const totalBookings = bookingStats?.total || 0;

  const businessTypes = [
    {
      label: "In-salon",
      value: stats?.types.in_salon || 0,
      icon: Building2,
    },
    {
      label: "Home service",
      value: stats?.types.home || 0,
      icon: House,
    },
    {
      label: "Both",
      value: stats?.types.both || 0,
      icon: RefreshCw,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary-600">
            Glowee platform
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            Admin Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor businesses, users and booking activity from one place.
          </p>
        </div>

        <Link
          href="/admin/bookings"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <CalendarDays className="h-4 w-4" />
          View bookings
        </Link>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Businesses</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {totalBusinesses}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {activeBusinesses} active
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
              <Building2 className="h-5 w-5 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Users</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {totalUsers}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {stats?.users?.active || 0} active
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Bookings</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {totalBookings}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {bookingStats?.today || 0} today
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
              <CalendarDays className="h-5 w-5 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">This month</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {bookingStats?.thisMonth || 0}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                bookings scheduled
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
              <Clock3 className="h-5 w-5 text-primary-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Business Mix */}
        <Card>
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Business mix
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Active businesses by service type.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {businessTypes.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                      <Icon className="h-4 w-4 text-gray-500" />
                    </div>

                    <span className="text-sm font-medium text-gray-700">
                      {item.label}
                    </span>
                  </div>

                  <span className="text-lg font-semibold text-gray-900">
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Booking Activity */}
        <Card>
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Booking activity
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Current booking status across Glowee.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock3 className="h-4 w-4" />
                Pending
              </div>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {bookingStats?.pending || 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle2 className="h-4 w-4" />
                Confirmed
              </div>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {bookingStats?.confirmed || 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </div>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {bookingStats?.completed || 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <XCircle className="h-4 w-4" />
                Cancelled
              </div>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {bookingStats?.cancelled || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {totalBusinesses === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-gray-900">
              No businesses yet
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add your first business to start managing it through Glowee.
            </p>

            <Link
              href="/admin/salons/create"
              className="mt-5 inline-flex rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
            >
              Add business
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}