// app/salon/gifts/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { Loading } from "@/app/components/ui/Loading";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


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

const STATUS_VARIANT: Record<string, "success" | "danger" | "gray" | "warning"> = {
    active: "success",
    redeemed: "gray",
    expired: "warning",
    cancelled: "danger",
};

export default function GiftsPage() {
    const router = useRouter();
    const [gifts, setGifts] = useState<Gift[]>([]);
    const [stats, setStats] = useState<GiftStats | null>(null);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");

    useEffect(() => {
        loadAll();
    }, [status]);

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
            if (status !== "all") params.set("status", status);

            const [giftsRes, statsRes] = await Promise.all([
                request(`/dashboard/salon/gifts?${params.toString()}`),
                request("/dashboard/salon/gifts/stats"),
            ]);

            setGifts(Array.isArray(giftsRes.data) ? giftsRes.data : []);
            setStats(statsRes);
        } catch (error: any) {
            toast.error(error.message || "Failed to load gifts");
            setGifts([]);
        } finally {
            setLoading(false);
        }
    }

    async function exportCsv() {
        try {
            const params = new URLSearchParams();
            if (search.trim()) params.set("search", search.trim());
            if (status !== "all") params.set("status", status);

            const token = getToken();

            const res = await fetch(
                `${API_BASE}/dashboard/salon/gifts/export?${params.toString()}`,
                {
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            if (!res.ok) throw new Error("Failed to export CSV");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "gifts-export.csv";
            a.click();

            window.URL.revokeObjectURL(url);
            toast.success("CSV exported successfully");
        } catch (error: any) {
            toast.error(error.message || "Export failed");
        }
    }

    function clearFilters() {
        setSearch("");
        setStatus("all");
        setTimeout(() => loadAll(), 0);
    }

    if (loading) return <Loading size="lg" />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gifts</h1>
                    <p className="text-gray-600">Track all gift cards and gift statuses</p>
                </div>

                <div className="flex gap-2">
                    <Button variant="secondary" onClick={exportCsv}>
                        Export CSV
                    </Button>
                    <Button variant="secondary" onClick={loadAll}>
                        Refresh
                    </Button>
                </div>
            </div>

            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <StatCard title="Total Gifts" value={stats.total_gifts} />
                    <StatCard title="Active" value={stats.active_gifts} color="text-emerald-600" />
                    <StatCard title="Redeemed" value={stats.redeemed_gifts} color="text-blue-600" />
                    <StatCard title="Expired" value={stats.expired_gifts} color="text-yellow-600" />
                    <StatCard title="Cancelled" value={stats.cancelled_gifts} color="text-red-600" />
                    <StatCard
                        title="Total Amount"
                        value={`AED ${Number(stats.total_amount || 0).toFixed(2)}`}
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
                            placeholder="Sender, receiver, phone, gift ID..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Status
                        </label>
                        <select
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="all">All Gifts</option>
                            <option value="active">Active</option>
                            <option value="redeemed">Redeemed</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="flex items-end gap-2">
                        <Button className="w-full" onClick={loadAll}>
                            Search
                        </Button>
                        <Button variant="secondary" className="w-full" onClick={clearFilters}>
                            Clear
                        </Button>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Gift</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Sender</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Receiver</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Salon</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Redeemed</th>
                            </tr>
                        </thead>

                        <tbody>
                            {gifts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-gray-500">
                                        No gifts found
                                    </td>
                                </tr>
                            ) : (
                                gifts.map((gift) => (
                                    <tr key={gift.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <p className="font-medium text-gray-900">
                                                {gift.type || "Gift"}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {gift.id.slice(0, 8)}...
                                            </p>
                                            {gift.message && (
                                                <p className="mt-1 text-xs text-gray-500 max-w-[220px] truncate">
                                                    “{gift.message}”
                                                </p>
                                            )}
                                        </td>

                                        <td className="py-3 px-4 text-sm">
                                            <p className="font-medium text-gray-900">
                                                {gift.sender_name || "-"}
                                            </p>
                                            <p className="text-gray-500">{gift.sender_phone || "-"}</p>
                                        </td>

                                        <td className="py-3 px-4 text-sm">
                                            <p className="font-medium text-gray-900">
                                                {gift.receiver_name || gift.recipient_name || "-"}
                                            </p>
                                            <p className="text-gray-500">
                                                {gift.receiver_phone || gift.recipient_phone || "-"}
                                            </p>
                                        </td>

                                        <td className="py-3 px-4 font-semibold text-emerald-600">
                                            AED {Number(gift.amount_aed || 0).toFixed(2)}
                                        </td>

                                        <td className="py-3 px-4 text-gray-600">
                                            {gift.salon_name || "Glowee Credit"}
                                        </td>

                                        <td className="py-3 px-4">
                                            <Badge variant={STATUS_VARIANT[gift.status] || "gray"}>
                                                {gift.status}
                                            </Badge>
                                        </td>

                                        <td className="py-3 px-4 text-sm text-gray-600">
                                            {gift.created_at ? formatDate(gift.created_at) : "-"}
                                        </td>

                                        <td className="py-3 px-4 text-sm text-gray-600">
                                            {gift.redeemed_at ? formatDate(gift.redeemed_at) : "-"}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => router.push(`/salon/gifts/${gift.id}`)}
                                            >
                                                View
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
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
            <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
        </div>
    );
}