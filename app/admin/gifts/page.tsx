// app/admin/gifts/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    CircleDollarSign,
    Eye,
    Gift as GiftIcon,
    RefreshCw,
    Search,
    Sparkles,
    TimerOff,
    WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

type GiftStatus =
    | "pending"
    | "active"
    | "redeemed"
    | "expired"
    | "cancelled";

type Gift = {
    id: string;
    code?: string | null;

    amount_aed: number;
    subtotal_aed?: number;
    gift_fee_aed?: number;
    total_aed?: number;

    currency?: string | null;
    status: GiftStatus;

    sender_name?: string | null;
    sender_user_name?: string | null;
    sender_phone?: string | null;
    sender_email?: string | null;

    recipient_phone?: string | null;

    message?: string | null;
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
    total_fees: number;
};

export default function GiftsPage() {
    const router = useRouter();

    const [gifts, setGifts] = useState<Gift[]>([]);
    const [stats, setStats] = useState<GiftStats | null>(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

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
            throw new Error(data.error || "Request failed");
        }

        return data;
    }

    async function loadAll(showRefresh = false) {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const params = new URLSearchParams();

            if (search.trim()) {
                params.set("search", search.trim());
            }

            if (status !== "all") {
                params.set("status", status);
            }

            const [giftsRes, statsRes] = await Promise.all([
                request(
                    `/dashboard/admin/gifts?${params.toString()}`
                ),
                request("/dashboard/admin/gifts/stats"),
            ]);

            setGifts(
                Array.isArray(giftsRes.data)
                    ? giftsRes.data
                    : []
            );

            setStats(statsRes || null);
        } catch (error: any) {
            toast.error(
                error?.message || "Failed to load gifts"
            );

            setGifts([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    //   async function exportCsv() {
    //     try {
    //       const params = new URLSearchParams();

    //       if (search.trim()) {
    //         params.set("search", search.trim());
    //       }

    //       if (status !== "all") {
    //         params.set("status", status);
    //       }

    //       const token = getToken();

    //       const res = await fetch(
    //         `${API_BASE}/dashboard/admin/gifts/export?${params.toString()}`,
    //         {
    //           headers: {
    //             ...(token
    //               ? {
    //                   Authorization: `Bearer ${token}`,
    //                 }
    //               : {}),
    //           },
    //         }
    //       );

    //       if (!res.ok) {
    //         throw new Error("Failed to export CSV");
    //       }

    //       const blob = await res.blob();
    //       const url =
    //         window.URL.createObjectURL(blob);

    //       const anchor =
    //         document.createElement("a");

    //       anchor.href = url;
    //       anchor.download = "gifts-export.csv";

    //       document.body.appendChild(anchor);
    //       anchor.click();
    //       anchor.remove();

    //       window.URL.revokeObjectURL(url);

    //       toast.success("CSV exported");
    //     } catch (error: any) {
    //       toast.error(
    //         error?.message || "Export failed"
    //       );
    //     }
    //   }

    function clearFilters() {
        setSearch("");
        setStatus("all");

        setTimeout(() => {
            loadAll();
        }, 0);
    }

    const hasFilters =
        search.trim() || status !== "all";

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-medium text-primary-600">
                        Customers
                    </p>

                    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                        Gifts
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Track gift purchases, redemption and customer
                        gift activity.
                    </p>
                </div>

                <button
                    type="button"
                    disabled={refreshing}
                    onClick={() => loadAll(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                <SummaryCard
                    label="Total gifts"
                    value={String(stats?.total_gifts ?? 0)}
                    icon={GiftIcon}
                />

                <SummaryCard
                    label="Active"
                    value={String(stats?.active_gifts ?? 0)}
                    icon={Sparkles}
                />

                <SummaryCard
                    label="Redeemed"
                    value={String(stats?.redeemed_gifts ?? 0)}
                    icon={WalletCards}
                />

                <SummaryCard
                    label="Expired"
                    value={String(stats?.expired_gifts ?? 0)}
                    icon={TimerOff}
                />

                <SummaryCard
                    label="Customer paid"
                    value={`AED ${Number(
                        stats?.total_amount || 0
                    ).toFixed(2)}`}
                    icon={CircleDollarSign}
                />

                <SummaryCard
                    label="Glowee fees"
                    value={`AED ${Number(
                        stats?.total_fees || 0
                    ).toFixed(2)}`}
                    icon={CircleDollarSign}
                />
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                        <input
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    loadAll();
                                }
                            }}
                            placeholder="Search code, sender, recipient phone or business..."
                            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(e) =>
                            setStatus(e.target.value)
                        }
                        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                    >
                        <option value="all">
                            All statuses
                        </option>
                        <option value="pending">
                            Pending
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

                    <button
                        type="button"
                        onClick={() => loadAll()}
                        className="h-11 rounded-xl bg-primary-600 px-5 text-sm font-medium text-white transition hover:bg-primary-700"
                    >
                        Search
                    </button>

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                {loading ? (
                    <div className="flex min-h-[360px] items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500" />

                            <p className="mt-3 text-sm text-gray-500">
                                Loading gifts...
                            </p>
                        </div>
                    </div>
                ) : gifts.length === 0 ? (
                    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                            <GiftIcon className="h-6 w-6 text-gray-400" />
                        </div>

                        <h2 className="mt-4 text-sm font-semibold text-gray-900">
                            No gifts found
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Try changing the search or status filter.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1180px] text-sm">
                                <thead className="border-b border-gray-100 bg-gray-50/70 text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3 text-left font-medium">
                                            Gift
                                        </th>

                                        <th className="px-5 py-3 text-left font-medium">
                                            Sender
                                        </th>

                                        <th className="px-5 py-3 text-left font-medium">
                                            Recipient
                                        </th>

                                        <th className="px-5 py-3 text-left font-medium">
                                            Business
                                        </th>

                                        <th className="px-5 py-3 text-left font-medium">
                                            Gift value
                                        </th>

                                        <th className="px-5 py-3 text-left font-medium">
                                            Customer paid
                                        </th>

                                        <th className="px-5 py-3 text-left font-medium">
                                            Status
                                        </th>

                                        <th className="px-5 py-3 text-left font-medium">
                                            Created
                                        </th>

                                        <th className="px-5 py-3 text-right font-medium">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {gifts.map((gift) => (
                                        <tr
                                            key={gift.id}
                                            className="transition hover:bg-gray-50/60"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-gray-900">
                                                    {gift.code ||
                                                        `#${gift.id.slice(0, 8)}`}
                                                </p>

                                                <p className="mt-1 text-xs text-gray-400">
                                                    {gift.id.slice(0, 8)}
                                                </p>

                                                {gift.message && (
                                                    <p className="mt-1 max-w-[200px] truncate text-xs text-gray-500">
                                                        “{gift.message}”
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-medium text-gray-900">
                                                    {gift.sender_name ||
                                                        gift.sender_user_name ||
                                                        "—"}
                                                </p>

                                                <p className="mt-1 text-xs text-gray-500">
                                                    {gift.sender_phone || "—"}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4 text-gray-600">
                                                {gift.recipient_phone || "—"}
                                            </td>

                                            <td className="px-5 py-4 text-gray-600">
                                                {gift.salon_name ||
                                                    "Glowee"}
                                            </td>

                                            <td className="px-5 py-4 font-medium text-gray-900">
                                                AED{" "}
                                                {Number(
                                                    gift.amount_aed || 0
                                                ).toFixed(2)}
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-medium text-gray-900">
                                                    AED{" "}
                                                    {Number(
                                                        gift.total_aed || 0
                                                    ).toFixed(2)}
                                                </p>

                                                <p className="mt-1 text-xs text-gray-400">
                                                    Fee AED{" "}
                                                    {Number(
                                                        gift.gift_fee_aed || 0
                                                    ).toFixed(2)}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <GiftStatusBadge
                                                    status={gift.status}
                                                />
                                            </td>

                                            <td className="px-5 py-4 text-gray-500">
                                                {gift.created_at
                                                    ? formatDate(
                                                        gift.created_at
                                                    )
                                                    : "—"}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            router.push(
                                                                `/admin/gifts/${gift.id}`
                                                            )
                                                        }
                                                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
                            Showing {gifts.length} gift
                            {gifts.length !== 1 ? "s" : ""}
                        </div>
                    </>
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

                    <p className="mt-2 text-xl font-semibold text-gray-900">
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

function GiftStatusBadge({
    status,
}: {
    status: GiftStatus;
}) {
    const styles: Record<GiftStatus, string> = {
        pending:
            "border-amber-200 bg-amber-50 text-amber-700",

        active:
            "border-emerald-200 bg-emerald-50 text-emerald-700",

        redeemed:
            "border-blue-200 bg-blue-50 text-blue-700",

        expired:
            "border-gray-200 bg-gray-50 text-gray-600",

        cancelled:
            "border-red-200 bg-red-50 text-red-700",
    };

    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}
        >
            {status.charAt(0).toUpperCase() +
                status.slice(1)}
        </span>
    );
}