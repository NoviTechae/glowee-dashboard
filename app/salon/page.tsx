// app/salon/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/app/components/ui/Card";
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

  if (loading) return <Loading size="lg" />;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your salon overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">Today</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Bookings */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-200 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-200 px-3 py-1 rounded-full">
              All Time
            </span>
          </div>
          <p className="text-sm font-medium text-blue-900 mb-1">Total Bookings</p>
          <p className="text-3xl font-bold text-blue-600">
            {stats?.total_bookings || 0}
          </p>
        </div>

        {/* Active Bookings */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-200 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-200 px-3 py-1 rounded-full">
              Active
            </span>
          </div>
          <p className="text-sm font-medium text-purple-900 mb-1">Active Bookings</p>
          <p className="text-3xl font-bold text-purple-600">
            {stats?.active_bookings || 0}
          </p>
        </div>

        {/* Completed */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 hover:shadow-lg transition-all duration-200 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-200 px-3 py-1 rounded-full">
              Done
            </span>
          </div>
          <p className="text-sm font-medium text-green-900 mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-600">
            {stats?.completed_bookings || 0}
          </p>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 border border-pink-200 hover:shadow-lg transition-all duration-200 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-pink-600 bg-pink-200 px-3 py-1 rounded-full">
              Revenue
            </span>
          </div>
          <p className="text-sm font-medium text-pink-900 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-pink-600">
            {formatCurrency(stats?.total_revenue || 0)}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/salon/services"
            className="group p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:from-purple-50 hover:to-purple-100 border border-gray-200 hover:border-purple-300 transition-all duration-200 hover:shadow-md"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">✂️</div>
            <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
              Services
            </p>
            <p className="text-xs text-gray-500 mt-1">Manage your services</p>
          </Link>
          
          <Link
            href="/salon/staff"
            className="group p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:from-blue-50 hover:to-blue-100 border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">👥</div>
            <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              Staff
            </p>
            <p className="text-xs text-gray-500 mt-1">Manage your team</p>
          </Link>
          
          <Link
            href="/salon/branches"
            className="group p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:from-green-50 hover:to-green-100 border border-gray-200 hover:border-green-300 transition-all duration-200 hover:shadow-md"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📍</div>
            <p className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
              Branches
            </p>
            <p className="text-xs text-gray-500 mt-1">Manage locations</p>
          </Link>
          
          <Link
            href="/salon/bookings"
            className="group p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:from-pink-50 hover:to-pink-100 border border-gray-200 hover:border-pink-300 transition-all duration-200 hover:shadow-md"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📅</div>
            <p className="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
              Bookings
            </p>
            <p className="text-xs text-gray-500 mt-1">View all bookings</p>
          </Link>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card - Today's Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Today's Activity</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Bookings Today</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{stats?.today_bookings || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Pending Bookings</span>
              </div>
              <span className="text-2xl font-bold text-yellow-600">{stats?.pending_bookings || 0}</span>
            </div>
          </div>
        </div>

        {/* Right Card - Monthly Revenue */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">This Month</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-white/80 text-sm mb-2">Revenue This Month</p>
              <p className="text-5xl font-bold">
                {formatCurrency(stats?.this_month_revenue || 0)}
              </p>
            </div>
            
            <div className="pt-4 border-t border-white/20">
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Average per booking</span>
                <span className="font-semibold">
                  {stats?.completed_bookings ? 
                    formatCurrency((stats.total_revenue || 0) / stats.completed_bookings) : 
                    formatCurrency(0)
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}