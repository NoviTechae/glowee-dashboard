// app/admin/feedback/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Eye,
  MapPin,
  MessageSquare,
  RefreshCw,
  Star,
  Store,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";

type RatingFilter =
  | "all"
  | "5"
  | "4"
  | "3"
  | "low";

type Feedback = {
  id: string;
  booking_id?: string | null;
  user_id?: string | null;
  user_name?: string | null;

  salon_id?: string | null;
  salon_name?: string | null;
  branch_name?: string | null;

  rating: number;
  comment?: string | null;
  created_at: string;
};

export default function AdminFeedbackPage() {
  const router = useRouter();

  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [filter, setFilter] =
    useState<RatingFilter>("all");

  async function load(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params = new URLSearchParams();

      if (filter !== "all") {
        params.set("rating", filter);
      }

      const [filteredResponse, allResponse] =
        await Promise.all([
          api.get(
            `/dashboard/admin/feedback${
              params.toString()
                ? `?${params.toString()}`
                : ""
            }`
          ),

          api.get("/dashboard/admin/feedback"),
        ]);

      setFeedback(
        Array.isArray(filteredResponse.data)
          ? filteredResponse.data
          : []
      );

      setAllFeedback(
        Array.isArray(allResponse.data)
          ? allResponse.data
          : []
      );
    } catch (e: any) {
      const message =
        e?.message || "Failed to load feedback";

      setError(message);
      setFeedback([]);
      setAllFeedback([]);

      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const stats = useMemo(() => {
    const total = allFeedback.length;

    const average =
      total > 0
        ? allFeedback.reduce(
            (sum, item) =>
              sum + Number(item.rating || 0),
            0
          ) / total
        : 0;

    const fiveStar = allFeedback.filter(
      (item) => item.rating === 5
    ).length;

    const low = allFeedback.filter(
      (item) => item.rating <= 2
    ).length;

    return {
      total,
      average,
      fiveStar,
      low,
    };
  }, [allFeedback]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary-600">
            Customers
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            Feedback
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Review customer ratings from completed Glowee
            bookings.
          </p>
        </div>

        <button
          type="button"
          disabled={refreshing}
          onClick={() => load(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total reviews"
          value={String(stats.total)}
          icon={MessageSquare}
        />

        <SummaryCard
          label="Average rating"
          value={`${stats.average.toFixed(1)} / 5`}
          icon={Star}
        />

        <SummaryCard
          label="5-star reviews"
          value={String(stats.fiveStar)}
          icon={Star}
        />

        <SummaryCard
          label="Low ratings"
          value={String(stats.low)}
          icon={MessageSquare}
        />
      </div>

      {/* Rating filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All
          </FilterButton>

          <FilterButton
            active={filter === "5"}
            onClick={() => setFilter("5")}
          >
            5 stars
          </FilterButton>

          <FilterButton
            active={filter === "4"}
            onClick={() => setFilter("4")}
          >
            4 stars
          </FilterButton>

          <FilterButton
            active={filter === "3"}
            onClick={() => setFilter("3")}
          >
            3 stars
          </FilterButton>

          <FilterButton
            active={filter === "low"}
            onClick={() => setFilter("low")}
          >
            Low ≤ 2
          </FilterButton>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Reviews */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500" />

              <p className="mt-3 text-sm text-gray-500">
                Loading feedback...
              </p>
            </div>
          </div>
        ) : feedback.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <MessageSquare className="h-6 w-6 text-gray-400" />
            </div>

            <h2 className="mt-4 text-sm font-semibold text-gray-900">
              No feedback found
            </h2>

            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Customer reviews will appear here after
              eligible bookings are rated.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {feedback.map((item) => (
                <ReviewRow
                  key={item.id}
                  item={item}
                  onViewBooking={() => {
                    if (item.booking_id) {
                      router.push(
                        `/admin/bookings/${item.booking_id}`
                      );
                    }
                  }}
                />
              ))}
            </div>

            <div className="border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
              Showing {feedback.length} review
              {feedback.length !== 1 ? "s" : ""}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReviewRow({
  item,
  onViewBooking,
}: {
  item: Feedback;
  onViewBooking: () => void;
}) {
  return (
    <div className="px-5 py-5">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
              {item.user_name
                ?.slice(0, 1)
                ?.toUpperCase() || "U"}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">
                {item.user_name || "Anonymous"}
              </p>

              <RatingStars rating={item.rating} />
            </div>
          </div>

          {item.comment && (
            <p className="mt-4 max-w-4xl text-sm leading-6 text-gray-700">
              {item.comment}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
            {item.salon_name && (
              <span className="inline-flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-gray-400" />
                {item.salon_name}
              </span>
            )}

            {item.branch_name && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                {item.branch_name}
              </span>
            )}

            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
              {new Date(
                item.created_at
              ).toLocaleDateString()}
            </span>
          </div>
        </div>

        {item.booking_id && (
          <button
            type="button"
            onClick={onViewBooking}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Eye className="h-3.5 w-3.5" />
            View booking
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white"
          : "rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
      }
    >
      {children}
    </button>
  );
}

function RatingStars({
  rating,
}: {
  rating: number;
}) {
  return (
    <div className="mt-1 flex items-center gap-0.5">
      {Array.from({ length: 5 }).map(
        (_, index) => {
          const filled = index < rating;

          return (
            <Star
              key={index}
              className={`h-3.5 w-3.5 ${
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-200"
              }`}
            />
          );
        }
      )}

      <span className="ml-1 text-xs font-medium text-gray-500">
        {rating}/5
      </span>
    </div>
  );
}