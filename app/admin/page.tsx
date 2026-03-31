// app/admin/page.tsx  — FIXED VERSION
// Changes:
//   1. Removed debug block (process.env.NODE_ENV check + JSON.stringify pre)
//   2. Removed console.log("📊 Stats API Response:", data)
//   3. Switched raw api.get("/dashboard/admin/stats") → statsApi.getDashboard()

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { Loading } from "@/app/components/ui/Loading";
import { statsApi } from "@/lib/api";
import Link from "next/link";

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
  let mounted = true;

  const run = async () => {
    try {
      setError(null);
      const data = await statsApi.getDashboard();
      if (!mounted) return;
      setStats(data);
    } catch (error: any) {
      if (!mounted) return;
      setError(error.message || "Failed to load statistics");
    } finally {
      if (!mounted) return;
      setLoading(false);
    }
  };

  run();

  return () => {
    mounted = false;
  };
}, []);

  const loadStats = async () => {
    try {
      setError(null);
      const data = await statsApi.getDashboard();
      setStats(data);
    } catch (error: any) {
      setError(error.message || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading size="lg" />;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome to Glowee Admin Dashboard</p>
        </div>
        <Card>
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Stats</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadStats}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome to Glowee Admin Dashboard</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Total Salons</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.salons?.total || 0}
            </p>
            <p className="text-xs text-green-600">
              {stats?.salons?.active || 0} active
            </p>
          </div>
        </Card>

        <Card>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.users?.total || 0}
            </p>
            <p className="text-xs text-green-600">
              {stats?.users?.active || 0} active
            </p>
            {!stats?.users && (
              <p className="text-xs text-gray-400">No user data available</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Total Bookings</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.bookings?.total || 0}
            </p>
            <p className="text-xs text-blue-600">
              {stats?.bookings?.today || 0} today
            </p>
            {!stats?.bookings && (
              <p className="text-xs text-gray-400">No booking data available</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-3xl font-bold text-primary-600">
              {stats?.bookings?.thisMonth || 0}
            </p>
            <p className="text-xs text-gray-500">bookings</p>
          </div>
        </Card>
      </div>

      {/* Salon Types Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">In-Salon</p>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                Salons
              </span>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {stats?.types?.in_salon || 0}
            </p>
          </div>
        </Card>

        <Card>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Home Service</p>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">
                Salons
              </span>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {stats?.types?.home || 0}
            </p>
          </div>
        </Card>

        <Card>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Both Services</p>
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-semibold">
                Salons
              </span>
            </div>
            <p className="text-3xl font-bold text-pink-600">
              {stats?.types?.both || 0}
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Salon Overview">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Salons</span>
              <span className="font-semibold text-lg">
                {stats?.salons?.total || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Salons</span>
              <span className="font-semibold text-lg text-green-600">
                {stats?.salons?.active || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Inactive Salons</span>
              <span className="font-semibold text-lg text-gray-400">
                {(stats?.salons?.total || 0) - (stats?.salons?.active || 0)}
              </span>
            </div>
          </div>
        </Card>

        {stats?.users ? (
          <Card title="User Overview">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Users</span>
                <span className="font-semibold text-lg">{stats.users.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Users</span>
                <span className="font-semibold text-lg text-green-600">
                  {stats.users.active}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Activity Rate</span>
                <span className="font-semibold text-lg text-blue-600">
                  {stats.users.total > 0
                    ? Math.round((stats.users.active / stats.users.total) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </Card>
        ) : (
          <Card title="Users">
            <div className="text-center py-8">
              <div className="text-gray-400 mb-3">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 mb-1">No user data available</p>
              <p className="text-xs text-gray-400">
                Users table may not exist yet or no users registered
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Bookings Overview */}
      {stats?.bookings ? (
        <Card title="Booking Overview">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.bookings.total}</p>
              <p className="text-sm text-gray-600">Total Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.bookings.today}</p>
              <p className="text-sm text-gray-600">Today</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.bookings.thisMonth}</p>
              <p className="text-sm text-gray-600">This Month</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card title="Bookings">
          <div className="text-center py-8">
            <div className="text-gray-400 mb-3">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-1">No booking data available</p>
            <p className="text-xs text-gray-400">
              Bookings table may not exist yet or no bookings made
            </p>
          </div>
        </Card>
      )}

      {/* No Data State */}
      {stats && stats.salons.total === 0 && (
        <Card>
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Salons Yet</h3>
            <p className="text-gray-600 mb-4">
              Get started by adding your first salon to the platform
            </p>
<Link
  href="/admin/salons/create"
  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
>
  Add First Salon
</Link>
          </div>
        </Card>
      )}
    </div>
  );
}