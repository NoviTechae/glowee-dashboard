"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Search,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

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
  breakdown: {
    rating: number;
    count: number;
  }[];
};

type RatingFilter =
  | "all"
  | "5"
  | "4"
  | "3"
  | "2"
  | "1";

export default function SalonReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] =
    useState<ReviewStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] = useState("");
  const [rating, setRating] =
    useState<RatingFilter>("all");

  async function request(path: string) {
    const token = getToken();

    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || "Request failed"
      );
    }

    return data;
  }

  useEffect(() => {
    loadAll("", "all", true);
  }, []);

  async function loadAll(
    nextSearch = search,
    nextRating: RatingFilter = rating,
    initial = false
  ) {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const params = new URLSearchParams();

      if (nextSearch.trim()) {
        params.set(
          "search",
          nextSearch.trim()
        );
      }

      if (nextRating !== "all") {
        params.set("rating", nextRating);
      }

      const query = params.toString();

      const [reviewsRes, statsRes] =
        await Promise.all([
          request(
            `/dashboard/salon/reviews${
              query ? `?${query}` : ""
            }`
          ),
          request(
            "/dashboard/salon/reviews/stats"
          ),
        ]);

      setReviews(
        Array.isArray(reviewsRes.data)
          ? reviewsRes.data
          : []
      );

      setStats(statsRes);
    } catch (error: any) {
      toast.error(
        error.message ||
          "Failed to load reviews"
      );

      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleSearch() {
    loadAll(search, rating);
  }

  function handleRatingChange(
    nextRating: RatingFilter
  ) {
    setRating(nextRating);

    loadAll(search, nextRating);
  }

  function clearFilters() {
    setSearch("");
    setRating("all");

    loadAll("", "all");
  }

  function handleSearchKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      handleSearch();
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading reviews...
          </p>
        </div>
      </div>
    );
  }

  const averageRating = Number(
    stats?.avg_rating || 0
  );

  const fiveStarReviews =
    stats?.breakdown.find(
      (item) => item.rating === 5
    )?.count || 0;

  return (
    <div className="mx-auto max-w-7xl space-y-7 p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Reviews
        </h1>

        <p className="mt-1.5 max-w-2xl text-sm text-gray-500">
          See what customers are saying about your
          business and recent bookings.
        </p>
      </div>

      {/* Summary */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Average rating"
            value={
              stats.total_reviews > 0
                ? averageRating.toFixed(1)
                : "—"
            }
            icon={
              <Star
                className="h-5 w-5"
                fill="currentColor"
              />
            }
            footer={
              stats.total_reviews > 0
                ? "out of 5"
                : "No reviews yet"
            }
          />

          <SummaryCard
            label="Total reviews"
            value={stats.total_reviews}
            icon={
              <UserRound className="h-5 w-5" />
            }
            footer="Customer feedback received"
          />

          <SummaryCard
            label="5-star reviews"
            value={fiveStarReviews}
            icon={
              <Star
                className="h-5 w-5"
                fill="currentColor"
              />
            }
            footer={
              stats.total_reviews > 0
                ? `${Math.round(
                    (fiveStarReviews /
                      stats.total_reviews) *
                      100
                  )}% of all reviews`
                : "No reviews yet"
            }
          />
        </div>
      )}

      {/* Rating breakdown */}
      {stats && stats.total_reviews > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <div>
            <h2 className="font-semibold text-gray-900">
              Rating breakdown
            </h2>

            <p className="mt-0.5 text-sm text-gray-500">
              Distribution of customer ratings.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {[5, 4, 3, 2, 1].map(
              (star) => {
                const count =
                  stats.breakdown.find(
                    (item) =>
                      item.rating === star
                  )?.count || 0;

                const percentage =
                  stats.total_reviews > 0
                    ? (count /
                        stats.total_reviews) *
                      100
                    : 0;

                return (
                  <div
                    key={star}
                    className="grid grid-cols-[50px_1fr_45px] items-center gap-3"
                  >
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                      {star}

                      <Star
                        className="h-3.5 w-3.5 text-amber-400"
                        fill="currentColor"
                      />
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <p className="text-right text-xs text-gray-400">
                      {count}
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              onKeyDown={
                handleSearchKeyDown
              }
              placeholder="Search customer, phone, comment or location..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={rating}
              onChange={(e) =>
                handleRatingChange(
                  e.target
                    .value as RatingFilter
                )
              }
              className="min-w-[160px] rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            >
              <option value="all">
                All ratings
              </option>

              <option value="5">
                5 stars
              </option>

              <option value="4">
                4 stars
              </option>

              <option value="3">
                3 stars
              </option>

              <option value="2">
                2 stars
              </option>

              <option value="1">
                1 star
              </option>
            </select>

            <button
              type="button"
              onClick={handleSearch}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Search className="h-4 w-4" />
              )}

              Search
            </button>

            {(search ||
              rating !== "all") && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="font-semibold text-gray-900">
              Customer feedback
            </h2>

            <p className="mt-0.5 text-sm text-gray-500">
              {reviews.length}{" "}
              {reviews.length === 1
                ? "review"
                : "reviews"}{" "}
              in this view
            </p>
          </div>

          {refreshing && (
            <div className="inline-flex items-center gap-2 text-xs text-gray-400">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
              Updating
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Star className="h-5 w-5 text-gray-400" />
            </div>

            <h3 className="mt-4 text-sm font-medium text-gray-800">
              No reviews found
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
              {search ||
              rating !== "all"
                ? "Try changing or clearing your filters."
                : "Customer reviews will appear here after completed bookings."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="px-6 py-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  {/* Main */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <UserRound className="h-4 w-4 text-gray-500" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {review.user_name ||
                            "Customer"}
                        </p>

                        {review.user_phone && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            {
                              review.user_phone
                            }
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5 sm:ml-2">
                        {Array.from({
                          length: 5,
                        }).map((_, index) => {
                          const active =
                            index <
                            review.rating;

                          return (
                            <Star
                              key={index}
                              className={`h-4 w-4 ${
                                active
                                  ? "text-amber-400"
                                  : "text-gray-200"
                              }`}
                              fill="currentColor"
                            />
                          );
                        })}
                      </div>
                    </div>

                    {review.comment ? (
                      <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        “{review.comment}”
                      </p>
                    ) : (
                      <p className="mt-4 text-sm italic text-gray-400">
                        Rating submitted without a
                        written comment.
                      </p>
                    )}
                  </div>

                  {/* Booking context */}
                  <div className="grid min-w-[230px] gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1">
                    <MetaItem
                      icon={
                        <CalendarDays className="h-4 w-4" />
                      }
                      label="Reviewed"
                      value={
                        review.created_at
                          ? formatDate(
                              review.created_at
                            )
                          : "-"
                      }
                    />

                    {review.scheduled_at && (
                      <MetaItem
                        icon={
                          <CalendarDays className="h-4 w-4" />
                        }
                        label="Appointment"
                        value={formatDate(
                          review.scheduled_at
                        )}
                      />
                    )}

                    <MetaItem
                      icon={
                        <MapPin className="h-4 w-4" />
                      }
                      label="Location"
                      value={
                        review.branch_name ||
                        "Not available"
                      }
                    />

                    <MetaItem
                      label="Booking total"
                      value={formatMoney(
                        review.total_aed
                      )}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  footer,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  footer: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {footer}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        {icon}
        {label}
      </div>

      <p className="mt-1 text-sm font-medium text-gray-700">
        {value}
      </p>
    </div>
  );
}

function formatMoney(
  value: number | string | null | undefined
) {
  return `AED ${Number(value || 0).toFixed(
    2
  )}`;
}