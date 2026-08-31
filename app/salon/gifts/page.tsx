// app/salon/gifts/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Download,
  Gift as GiftIcon,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

type Gift = {
  id: string;
  type?: string | null;
  amount_aed: number;
  status: "active" | "redeemed" | "expired" | "cancelled";
  message?: string | null;

  recipient_name?: string | null;
  recipient_phone?: string | null;

  sender_name?: string | null;
  sender_phone?: string | null;

  receiver_name?: string | null;
  receiver_phone?: string | null;

  salon_name?: string | null;

  expires_at?: string | null;
  redeemed_at?: string | null;
  created_at: string;
};

type GiftStats = {
  total_gifts: number;
  active_gifts: number;
  redeemed_gifts: number;
  expired_gifts: number;
  cancelled_gifts: number;
  total_amount: number;
};

type GiftStatus =
  | "all"
  | "active"
  | "redeemed"
  | "expired"
  | "cancelled";

export default function GiftsPage() {
  const router = useRouter();

  const [gifts, setGifts] = useState<Gift[]>([]);
  const [stats, setStats] = useState<GiftStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<GiftStatus>("all");

  useEffect(() => {
    loadAll("", "all", true);
  }, []);

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

  async function loadAll(
    nextSearch = search,
    nextStatus: GiftStatus = status,
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

      if (nextStatus !== "all") {
        params.set("status", nextStatus);
      }

      const query = params.toString();

      const [giftsRes, statsRes] =
        await Promise.all([
          request(
            `/dashboard/salon/gifts${
              query ? `?${query}` : ""
            }`
          ),
          request(
            "/dashboard/salon/gifts/stats"
          ),
        ]);

      setGifts(
        Array.isArray(giftsRes.data)
          ? giftsRes.data
          : []
      );

      setStats(statsRes);
    } catch (error: any) {
      toast.error(
        error.message ||
          "Failed to load gifts"
      );

      setGifts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleStatusChange(
    nextStatus: GiftStatus
  ) {
    setStatus(nextStatus);

    loadAll(search, nextStatus);
  }

  function handleSearch() {
    loadAll(search, status);
  }

  function handleSearchKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      handleSearch();
    }
  }

  function clearFilters() {
    setSearch("");
    setStatus("all");

    loadAll("", "all");
  }

  async function exportCsv() {
    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      if (status !== "all") {
        params.set("status", status);
      }

      const token = getToken();

      const query = params.toString();

      const res = await fetch(
        `${API_BASE}/dashboard/salon/gifts/export${
          query ? `?${query}` : ""
        }`,
        {
          headers: {
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      if (!res.ok) {
        throw new Error(
          "Failed to export CSV"
        );
      }

      const blob = await res.blob();

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = "gifts-export.csv";

      document.body.appendChild(link);

      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success(
        "CSV exported successfully"
      );
    } catch (error: any) {
      toast.error(
        error.message || "Export failed"
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading gifts...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Gifts
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm text-gray-500">
            Track gifts connected to your business
            and follow their redemption status.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Summary */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={
              <GiftIcon className="h-5 w-5" />
            }
            label="Total gifts"
            value={stats.total_gifts}
          />

          <SummaryCard
            icon={
              <Sparkles className="h-5 w-5" />
            }
            label="Active"
            value={stats.active_gifts}
          />

          <SummaryCard
            icon={
              <GiftIcon className="h-5 w-5" />
            }
            label="Redeemed"
            value={stats.redeemed_gifts}
          />

          <SummaryCard
            icon={
              <span className="text-sm font-semibold">
                AED
              </span>
            }
            label="Total gift value"
            value={formatMoney(
              stats.total_amount
            )}
          />
        </div>
      )}

      {/* Filters */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              placeholder="Search by sender, receiver, phone or gift ID..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              onKeyDown={
                handleSearchKeyDown
              }
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <select
                value={status}
                onChange={(e) =>
                  handleStatusChange(
                    e.target
                      .value as GiftStatus
                  )
                }
                className="w-full min-w-[170px] appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-8 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              >
                <option value="all">
                  All statuses
                </option>

                <option value="active">
                  Active
                </option>

                <option value="redeemed">
                  Redeemed
                </option>

                <option value="expired">
                  Expired
                </option>

                <option value="cancelled">
                  Cancelled
                </option>
              </select>
            </div>

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
              status !== "all") && (
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

      {/* Gifts */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="font-semibold text-gray-900">
              Gift activity
            </h2>

            <p className="mt-0.5 text-sm text-gray-500">
              {gifts.length}{" "}
              {gifts.length === 1
                ? "gift"
                : "gifts"}{" "}
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

        {gifts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <GiftIcon className="h-5 w-5 text-gray-400" />
            </div>

            <h3 className="mt-4 text-sm font-medium text-gray-800">
              No gifts found
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
              {search ||
              status !== "all"
                ? "Try changing or clearing your filters."
                : "Gifts connected to your business will appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {gifts.map((gift) => {
              const receiverName =
                gift.receiver_name ||
                gift.recipient_name ||
                "Not available";

              const receiverPhone =
                gift.receiver_phone ||
                gift.recipient_phone ||
                null;

              return (
                <button
                  type="button"
                  key={gift.id}
                  onClick={() =>
                    router.push(
                      `/salon/gifts/${gift.id}`
                    )
                  }
                  className="grid w-full gap-4 px-6 py-5 text-left transition hover:bg-gray-50 lg:grid-cols-[1.3fr_1fr_1fr_150px_120px_30px] lg:items-center"
                >
                  {/* Gift */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {formatGiftType(
                          gift.type
                        )}
                      </p>

                      <StatusBadge
                        status={gift.status}
                      />
                    </div>

                    <p className="mt-1 font-mono text-xs text-gray-400">
                      #
                      {gift.id
                        .slice(0, 8)
                        .toUpperCase()}
                    </p>

                    {gift.message && (
                      <p className="mt-2 max-w-sm truncate text-xs text-gray-500">
                        “{gift.message}”
                      </p>
                    )}
                  </div>

                  {/* Sender */}
                  <PersonCell
                    label="From"
                    name={
                      gift.sender_name ||
                      "Not available"
                    }
                    phone={gift.sender_phone}
                  />

                  {/* Receiver */}
                  <PersonCell
                    label="To"
                    name={receiverName}
                    phone={receiverPhone}
                  />

                  {/* Amount */}
                  <div>
                    <p className="text-xs text-gray-400 lg:hidden">
                      Amount
                    </p>

                    <p className="mt-0.5 text-sm font-semibold text-gray-900">
                      {formatMoney(
                        gift.amount_aed
                      )}
                    </p>

                    {gift.salon_name && (
                      <p className="mt-1 truncate text-xs text-gray-400">
                        {gift.salon_name}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <p className="text-xs text-gray-400 lg:hidden">
                      Created
                    </p>

                    <p className="mt-0.5 text-sm text-gray-600">
                      {gift.created_at
                        ? formatDate(
                            gift.created_at
                          )
                        : "-"}
                    </p>

                    {gift.status ===
                      "redeemed" &&
                      gift.redeemed_at && (
                        <p className="mt-1 text-xs text-gray-400">
                          Redeemed{" "}
                          {formatDate(
                            gift.redeemed_at
                          )}
                        </p>
                      )}
                  </div>

                  <ArrowRight className="hidden h-4 w-4 text-gray-300 lg:block" />
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Secondary stats */}
      {stats &&
        (stats.expired_gifts > 0 ||
          stats.cancelled_gifts > 0) && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-400">
            <span>
              Expired:{" "}
              <strong className="font-medium text-gray-600">
                {stats.expired_gifts}
              </strong>
            </span>

            <span>
              Cancelled:{" "}
              <strong className="font-medium text-gray-600">
                {stats.cancelled_gifts}
              </strong>
            </span>
          </div>
        )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
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
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function PersonCell({
  label,
  name,
  phone,
}: {
  label: string;
  name: string;
  phone?: string | null;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="mt-0.5 truncate text-sm font-medium text-gray-800">
        {name}
      </p>

      {phone && (
        <p className="mt-0.5 truncate text-xs text-gray-400">
          {phone}
        </p>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: Gift["status"];
}) {
  const classes: Record<
    Gift["status"],
    string
  > = {
    active:
      "bg-emerald-50 text-emerald-700",
    redeemed:
      "bg-blue-50 text-blue-700",
    expired:
      "bg-amber-50 text-amber-700",
    cancelled:
      "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${classes[status]}`}
    >
      {status}
    </span>
  );
}

function formatGiftType(
  type?: string | null
) {
  if (!type) {
    return "Gift";
  }

  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatMoney(
  value: number | string | null | undefined
) {
  return `AED ${Number(value || 0).toFixed(
    2
  )}`;
}