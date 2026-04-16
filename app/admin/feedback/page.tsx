// app/admin/feedback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Feedback = {
  id: string;
  user_id?: string;
  user_name?: string;
  booking_id?: string;
  salon_name?: string;
  branch_name?: string;
  rating: number;
  comment?: string;
  created_at: string;
};

export default function AdminFeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "5" | "4" | "3" | "low">("all");

  async function load() {
    try {
      setLoading(true);
      setError(null);

      // ✅ This endpoint needs to be created in backend
      const json = await api.get("/dashboard/admin/feedback");
      setFeedback(json.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load feedback");
      // For now, show sample data since endpoint doesn't exist yet
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredFeedback = feedback.filter((f) => {
    if (filter === "all") return true;
    if (filter === "5") return f.rating === 5;
    if (filter === "4") return f.rating === 4;
    if (filter === "3") return f.rating === 3;
    if (filter === "low") return f.rating <= 2;
    return true;
  });

  const stats = {
    total: feedback.length,
    average: feedback.length > 0
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
      : "0",
    fiveStar: feedback.filter((f) => f.rating === 5).length,
    fourStar: feedback.filter((f) => f.rating === 4).length,
    threeStar: feedback.filter((f) => f.rating === 3).length,
    low: feedback.filter((f) => f.rating <= 2).length,
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ratings & Feedback</h1>
          <p className="text-sm text-gray-500 mt-1">
            Customer reviews and ratings from completed bookings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-600">Total Reviews</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {stats.total}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-600">Average Rating</div>
            <div className="flex items-baseline mt-1">
              <div className="text-2xl font-bold text-gray-900">
                {stats.average}
              </div>
              <div className="text-yellow-500 ml-2">★</div>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-600">5 Stars</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {stats.fiveStar}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-600">4 Stars</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {stats.fourStar}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-600">Low (≤2)</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {stats.low}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === "all"
                ? "bg-pink-500 text-white"
                : "bg-white border text-gray-700 hover:bg-gray-50"
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter("5")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === "5"
                ? "bg-emerald-500 text-white"
                : "bg-white border text-gray-700 hover:bg-gray-50"
            }`}
          >
            5 ★ ({stats.fiveStar})
          </button>
          <button
            onClick={() => setFilter("4")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === "4"
                ? "bg-blue-500 text-white"
                : "bg-white border text-gray-700 hover:bg-gray-50"
            }`}
          >
            4 ★ ({stats.fourStar})
          </button>
          <button
            onClick={() => setFilter("3")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === "3"
                ? "bg-yellow-500 text-white"
                : "bg-white border text-gray-700 hover:bg-gray-50"
            }`}
          >
            3 ★ ({stats.threeStar})
          </button>
          <button
            onClick={() => setFilter("low")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === "low"
                ? "bg-red-500 text-white"
                : "bg-white border text-gray-700 hover:bg-gray-50"
            }`}
          >
            Low ≤2 ★ ({stats.low})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading feedback...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
<p className="text-sm font-semibold text-yellow-800">
  Failed to load feedback
</p>
<p className="text-sm text-yellow-700 mt-1">
  Please try refreshing the page or check the backend response.
</p>
              </div>
            </div>
          </div>
        )}

        {/* Feedback List */}
        {!loading && (
          <div className="space-y-4">
            {filteredFeedback.length === 0 && (
              <div className="bg-white border rounded-2xl p-12 text-center">
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
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-500">No feedback yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Customer reviews will appear here after bookings are completed
                </p>
              </div>
            )}

            {filteredFeedback.map((item) => (
              <div
                key={item.id}
                className="bg-white border rounded-xl p-4 shadow-sm hover:shadow transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-900">
                        {item.user_name || "Anonymous"}
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${
                              i < item.rating ? "text-yellow-400" : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    {item.comment && (
                      <p className="text-sm text-gray-700 mt-2">{item.comment}</p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      {item.salon_name && (
                        <span>🏢 {item.salon_name}</span>
                      )}
                      {item.branch_name && (
                        <span>📍 {item.branch_name}</span>
                      )}
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}