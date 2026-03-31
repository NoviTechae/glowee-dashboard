// app/admin/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getAccount, logout } from "@/lib/auth";
import { DashboardAccount } from "@/lib/types";
import { api } from "@/lib/api";

export default function AdminProfilePage() {
  const [account, setAccount] = useState<DashboardAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setAccount(getAccount());
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!currentPassword) {
      setError("Current password is required");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await api.post("/dashboard/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      // Success
      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setError(e?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  if (!account) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account settings and security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-pink-600">
                  {account.email.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Admin Account
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {account.email}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">Role</span>
                <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs font-semibold uppercase">
                  {account.role}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">User ID</span>
                <span className="font-mono text-xs text-gray-500">
                  {account.id.slice(0, 8)}...
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full mt-6 border border-red-200 bg-red-50 text-red-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-100 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Change Password
            </h2>

            {/* Success Message */}
            {success && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password *
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter current password"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password * (min 6 characters)
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter new password"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Confirm new password"
                  disabled={loading}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto bg-pink-500 hover:bg-pink-600 text-white rounded-lg px-6 py-2.5 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    "Change Password"
                  )}
                </button>
              </div>
            </form>

            {/* Security Tips */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800 mb-1">
                    Password Security Tips
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Use at least 8 characters</li>
                    <li>• Mix uppercase, lowercase, numbers, and symbols</li>
                    <li>• Don't reuse passwords from other accounts</li>
                    <li>• Change your password regularly</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}