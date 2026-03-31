"use client";

import { useEffect, useMemo, useState } from "react";
import { reviewApi, branchApi } from "@/lib/api";

type ReviewRow = {
  id: string;
  booking_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  user_name?: string | null;
  user_phone?: string | null;
  branch_id?: string | null;
  branch_name?: string | null;
};

type ReviewStats = {
  total_reviews: number;
  avg_rating: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
};

type Branch = {
  id: string;
  name: string;
};

function formatDateTime(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? "text-yellow-500" : "text-gray-300"}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function SalonReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [ratingFilter, setRatingFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function loadAll() {
    try {
      setLoading(true);
      setErr(null);

      const [reviewsRes, statsRes, branchesRes] = await Promise.all([
        reviewApi.getAll(
          ratingFilter !== "all" ? ratingFilter : undefined,
          branchFilter !== "all" ? branchFilter : undefined
        ),
        reviewApi.getStats(),
        branchApi.getAll(),
      ]);

      setReviews(Array.isArray(reviewsRes?.data) ? reviewsRes.data : []);
      setStats(statsRes || null);
      setBranches(Array.isArray(branchesRes?.data) ? branchesRes.data : []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load reviews");
      setReviews([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [ratingFilter, branchFilter]);

  const filteredReviews = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reviews;

    return reviews.filter((r) => {
      return (
        String(r.user_name || "").toLowerCase().includes(q) ||
        String(r.user_phone || "").toLowerCase().includes(q) ||
        String(r.branch_name || "").toLowerCase().includes(q) ||
        String(r.comment || "").toLowerCase().includes(q) ||
        String(r.booking_id || "").toLowerCase().includes(q)
      );
    });
  }, [reviews, search]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-pink-500" />
          <p className="mt-4 text-sm text-gray-500">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Reviews</h1>
        <p className="mt-1 text-sm font-semibold text-gray-500">
          See customer ratings and feedback for your salon
        </p>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {err}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Reviews" value={stats?.total_reviews || 0} />
        <StatCard title="Average Rating" value={(stats?.avg_rating || 0).toFixed(1)} />
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-gray-500">Rating Overview</div>
          <div className="mt-3 space-y-2">
            {[5, 4, 3, 2, 1].map((n) => (
              <div key={n} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-semibold text-gray-700">
                  <span>{n}</span>
                  <span className="text-yellow-500">★</span>
                </div>
                <span className="font-black text-gray-900">
                  {stats?.breakdown?.[n as keyof typeof stats.breakdown] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, branch, comment..."
            className="rounded-xl border px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-pink-200"
          />

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-pink-200"
          >
            <option value="all">All ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-pink-200"
          >
            <option value="all">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <button
            onClick={loadAll}
            className="rounded-xl border bg-white px-4 py-3 text-sm font-black hover:bg-gray-50"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Reviews list */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4 text-lg font-black text-gray-900">
          Reviews ({filteredReviews.length})
        </div>

        {filteredReviews.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="text-sm font-bold text-gray-500">No reviews found</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReviews.map((review) => (
              <div key={review.id} className="px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="font-black text-gray-900">
                      {review.user_name || "Customer"}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-500">
                      {review.user_phone || "-"}
                    </div>
                    <div className="mt-2">
                      <StarRow rating={Number(review.rating || 0)} />
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-700">
                      {review.branch_name || "No branch"}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-gray-500">
                      {formatDateTime(review.created_at)}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-gray-400">
                      Booking #{String(review.booking_id || "").slice(0, 8)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border bg-gray-50 p-4">
                  <div className="text-sm font-semibold text-gray-700">
                    {review.comment?.trim() || "No comment provided."}
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

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-gray-500">{title}</div>
      <div className="mt-2 text-3xl font-black text-gray-900">{value}</div>
    </div>
  );
}