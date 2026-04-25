"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Loading } from "@/app/components/ui/Loading";
import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type Review = {
  id: string;
  booking_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  user_name?: string | null;
  user_phone?: string | null;
  branch_name?: string | null;
  scheduled_at?: string | null;
  total_aed: number;
};

type ReviewStats = {
  avg_rating: number;
  total_reviews: number;
  breakdown: { rating: number; count: number }[];
};

export default function SalonReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("all");

  async function request(path: string) {
    const token = getToken();

    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  async function loadAll() {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (rating !== "all") params.set("rating", rating);

      const [reviewsRes, statsRes] = await Promise.all([
        request(`/dashboard/salon/reviews?${params.toString()}`),
        request("/dashboard/salon/reviews/stats"),
      ]);

      setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
      setStats(statsRes);
    } catch (error: any) {
      toast.error(error.message || "Failed to load reviews");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [rating]);

  if (loading) return <Loading size="lg" />;

  const avg = Number(stats?.avg_rating || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-600">
          View customer ratings and feedback for your salon
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Average Rating"
            value={`${avg.toFixed(1)} ★`}
            color="text-yellow-600"
          />
          <StatCard title="Total Reviews" value={stats.total_reviews} />
          <StatCard
            title="5-Star Reviews"
            value={
              stats.breakdown.find((b) => b.rating === 5)?.count || 0
            }
            color="text-emerald-600"
          />
        </div>
      )}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              placeholder="Customer, phone, comment, branch..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Rating
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <Button className="w-full" onClick={loadAll}>
              Search
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setSearch("");
                setRating("all");
                setTimeout(() => loadAll(), 0);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        {reviews.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No reviews found
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {review.user_name || "Customer"}
                      </p>
                      <span className="text-sm text-yellow-600">
                        {"★".repeat(review.rating)}
                        <span className="text-gray-300">
                          {"★".repeat(5 - review.rating)}
                        </span>
                      </span>
                    </div>

                    <p className="text-sm text-gray-500">
                      {review.user_phone || "-"}
                    </p>

                    {review.comment ? (
                      <p className="mt-3 text-gray-700">
                        “{review.comment}”
                      </p>
                    ) : (
                      <p className="mt-3 text-gray-400">
                        No comment provided
                      </p>
                    )}
                  </div>

                  <div className="text-sm text-gray-500 md:text-right">
                    <p>{review.created_at ? formatDate(review.created_at) : "-"}</p>
                    <p>{review.branch_name || "Branch"}</p>
                    <p>AED {Number(review.total_aed || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
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