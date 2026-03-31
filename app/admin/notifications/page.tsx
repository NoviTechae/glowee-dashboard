// app/admin/notifications/page.tsx
"use client";

import { useState } from "react";
import { notificationApi } from "@/lib/api";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    targetType: "all" as "all" | "specific_user" | "user_segment",
    userId: "",
    segment: "",
    type: "general",
  });

  const handleSend = async () => {
    try {
      setLoading(true);

      const result = await notificationApi.send({
        title: form.title,
        body: form.body,
        targetType: form.targetType,
        userId: form.userId || undefined,
        segment: form.segment || undefined,
        type: form.type,
      });

      alert(`✅ Notification sent to ${result.count} users!`);
      
      // Reset form
      setForm({
        title: "",
        body: "",
        targetType: "all",
        userId: "",
        segment: "",
        type: "general",
      });
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Send Notifications</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Form Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Compose Notification</h2>
          
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                placeholder="e.g., Special Offer!"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                placeholder="e.g., Get 20% off on all services today!"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Target Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Send To</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="all"
                    checked={form.targetType === "all"}
                    onChange={(e) => setForm({ ...form, targetType: e.target.value as any })}
                    className="mr-2"
                  />
                  <span>All Users</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="specific_user"
                    checked={form.targetType === "specific_user"}
                    onChange={(e) => setForm({ ...form, targetType: e.target.value as any })}
                    className="mr-2"
                  />
                  <span>Specific User</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="user_segment"
                    checked={form.targetType === "user_segment"}
                    onChange={(e) => setForm({ ...form, targetType: e.target.value as any })}
                    className="mr-2"
                  />
                  <span>User Segment</span>
                </label>
              </div>
            </div>

            {/* Specific User ID */}
            {form.targetType === "specific_user" && (
              <div>
                <label className="block text-sm font-medium mb-2">User ID</label>
                <input
                  type="text"
                  placeholder="Enter user ID"
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            )}

            {/* User Segment */}
            {form.targetType === "user_segment" && (
              <div>
                <label className="block text-sm font-medium mb-2">Segment</label>
                <select
                  value={form.segment}
                  onChange={(e) => setForm({ ...form, segment: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="">Select segment</option>
                  <option value="active_users">Active Users (last 7 days)</option>
                  <option value="inactive_users">Inactive Users (30+ days)</option>
                  <option value="with_bookings">Users with Bookings</option>
                  <option value="with_gifts">Users with Gifts</option>
                  <option value="with_streak">Users with Streak</option>
                </select>
              </div>
            )}

            {/* Notification Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="general">General</option>
                <option value="promotion">Promotion</option>
                <option value="reminder">Reminder</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={loading || !form.title || !form.body}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                loading || !form.title || !form.body
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </div>

        {/* Preview Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          
          {/* Notification Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                G
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">
                  {form.title || "Notification Title"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {form.body || "Notification message will appear here..."}
                </p>
                <p className="text-xs text-gray-400 mt-2">Just now</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Target:</span>
              <span className="font-semibold">
                {form.targetType === "all"
                  ? "All Users"
                  : form.targetType === "specific_user"
                  ? "1 User"
                  : form.segment || "Select Segment"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Type:</span>
              <span className="font-semibold capitalize">{form.type}</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📲 Note:</strong> Notifications will be sent to users who have:
            </p>
            <ul className="mt-2 text-xs text-blue-700 space-y-1">
              <li>• Enabled push notifications</li>
              <li>• Valid push token saved</li>
              <li>• Active account</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}