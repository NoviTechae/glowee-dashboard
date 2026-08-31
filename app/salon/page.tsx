// app/salon/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  Wallet,
  ArrowRight,
  Plus,
  Sparkles,
  Users,
  Gift,
  TrendingUp,
} from "lucide-react";

import { Loading } from "@/app/components/ui/Loading";
import { statsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface SalonStats {
  total_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  pending_bookings: number;
  today_bookings: number;
  total_revenue: number;
  this_month_revenue: number;
}

export default function SalonDashboard() {
  const [stats, setStats] = useState<SalonStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await statsApi.getSalonStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading size="lg" />;
  }

  const todayBookings = stats?.today_bookings || 0;
  const pendingBookings = stats?.pending_bookings || 0;
  const completedBookings = stats?.completed_bookings || 0;
  const monthlyRevenue = stats?.this_month_revenue || 0;

  const averageBookingValue =
    completedBookings > 0
      ? (stats?.total_revenue || 0) / completedBookings
      : 0;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600 mb-1">
            {today}
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Welcome back
          </h1>

          <p className="mt-1.5 text-sm text-gray-500">
            {todayBookings === 0
              ? "Your business is all set. New bookings will appear here."
              : `You have ${todayBookings} booking${
                  todayBookings === 1 ? "" : "s"
                } today.`}
          </p>
        </div>

        <Link
          href="/salon/bookings"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          View bookings
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's bookings"
          value={todayBookings.toString()}
          icon={CalendarDays}
        />

        <StatCard
          title="Pending"
          value={pendingBookings.toString()}
          icon={Clock3}
          tone="warning"
        />

        <StatCard
          title="Completed"
          value={completedBookings.toString()}
          icon={CheckCircle2}
          tone="success"
        />

        <StatCard
          title="Revenue this month"
          value={
            monthlyRevenue > 0
              ? formatCurrency(monthlyRevenue)
              : formatCurrency(0)
          }
          icon={Wallet}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Booking Activity */}
        <section className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Booking activity
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                A quick overview of your current bookings.
              </p>
            </div>

            <Link
              href="/salon/bookings"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <ActivityItem
              label="Today"
              value={todayBookings}
              description="Bookings scheduled today"
            />

            <ActivityItem
              label="Active"
              value={stats?.active_bookings || 0}
              description="Current active bookings"
            />

            <ActivityItem
              label="Pending"
              value={pendingBookings}
              description="Waiting for action"
            />
          </div>

          {todayBookings === 0 && pendingBookings === 0 && (
            <div className="border-t border-gray-100 px-6 py-10 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary-50">
                <CalendarDays className="h-5 w-5 text-primary-600" />
              </div>

              <p className="font-medium text-gray-900">
                No bookings need your attention
              </p>

              <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                New and upcoming appointments will appear here as customers
                start booking.
              </p>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Quick actions
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage the essentials of your business.
            </p>
          </div>

          <div className="mt-5 space-y-2">
            <QuickAction
              href="/salon/services"
              icon={Sparkles}
              label="Manage services"
            />

            <QuickAction
              href="/salon/staff"
              icon={Users}
              label="Manage team"
            />

            <QuickAction
              href="/salon/bookings"
              icon={CalendarDays}
              label="View bookings"
            />

            <QuickAction
              href="/salon/gifts"
              icon={Gift}
              label="View gifts"
            />
          </div>
        </section>
      </div>

      {/* Business Summary */}
      <section className="rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Business overview
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Your performance at a glance.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <SummaryItem
            label="Total bookings"
            value={(stats?.total_bookings || 0).toString()}
          />

          <SummaryItem
            label="Total revenue"
            value={formatCurrency(stats?.total_revenue || 0)}
          />

          <SummaryItem
            label="Average booking value"
            value={
              averageBookingValue > 0
                ? formatCurrency(averageBookingValue)
                : "—"
            }
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  tone?: "default" | "success" | "warning";
}) {
  const iconStyle = {
    default: "bg-primary-50 text-primary-600",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
  }[tone];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ActivityItem({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="px-6 py-6">
      <p className="text-sm font-medium text-gray-500">{label}</p>

      <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-400">{description}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3.5 transition hover:border-primary-200 hover:bg-primary-50/40"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500 transition group-hover:bg-white group-hover:text-primary-600">
          <Icon className="h-[18px] w-[18px]" />
        </div>

        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
          {label}
        </span>
      </div>

      <ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-primary-500" />
    </Link>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="px-6 py-6">
      <p className="text-sm text-gray-500">{label}</p>

      <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}