// app/admin/subscriptions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Loading } from "@/app/components/ui/Loading";
import { Badge } from "@/app/components/ui/Badge";
import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type Subscription = {
  id: string;
  salon_id: string;
  salon_name?: string | null;
  salon_city?: string | null;
  plan_code: string;
  plan_name: string;
  amount_aed: number;
  status: string;
  auto_renew: boolean;
  cancel_at_period_end: boolean;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  started_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
};

type Stats = {
  total: number;
  active: number;
  trial: number;
  past_due: number;
  cancelled: number;
  mrr: number;
  paid_total: number;
};

const STATUS_VARIANT: Record<string, "success" | "danger" | "gray" | "warning"> = {
  active: "success",
  trial: "warning",
  past_due: "danger",
  cancelled: "gray",
  expired: "gray",
  inactive: "gray",
};

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("all");

  async function request(path: string, method = "GET", body?: any) {
    const token = getToken();

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
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
      if (plan !== "all") params.set("plan", plan);

      const [subsRes, statsRes] = await Promise.all([
        request(`/dashboard/admin/subscriptions?${params.toString()}`),
        request("/dashboard/admin/subscriptions/stats"),
      ]);

      setSubscriptions(Array.isArray(subsRes.data) ? subsRes.data : []);
      setStats(statsRes);
    } catch (error: any) {
      toast.error(error.message || "Failed to load subscriptions");
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }

  async function markPaid(id: string) {
    if (!confirm("Mark this subscription as paid for 1 month?")) return;

    try {
      setMarkingId(id);

      await request(`/dashboard/admin/subscriptions/${id}/mark-paid`, "POST", {
        months: 1,
      });

      toast.success("Subscription marked as paid");
      loadAll();
    } catch (error: any) {
      toast.error(error.message || "Failed to mark paid");
    } finally {
      setMarkingId(null);
    }
  }

  useEffect(() => {
    loadAll();
  }, [status, plan]);

  if (loading) return <Loading size="lg" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-600">Manage salon plans and billing status</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          <StatCard title="Total" value={stats.total} />
          <StatCard title="Active" value={stats.active} color="text-emerald-600" />
          <StatCard title="Trial" value={stats.trial} color="text-yellow-600" />
          <StatCard title="Past Due" value={stats.past_due} color="text-red-600" />
          <StatCard title="Cancelled" value={stats.cancelled} />
          <StatCard title="MRR" value={`AED ${stats.mrr.toFixed(2)}`} color="text-blue-600" />
          <StatCard title="Paid Total" value={`AED ${stats.paid_total.toFixed(2)}`} color="text-pink-600" />
        </div>
      )}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Search</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="Salon, plan, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Plan</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
            >
              <option value="all">All Plans</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <Button className="w-full" onClick={loadAll}>Search</Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setPlan("all");
                setTimeout(loadAll, 0);
              }}
            >
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
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Salon</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Plan</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Renewal</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Auto Renew</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>

            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">
                        {sub.salon_name || "-"}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-medium">{sub.plan_name}</p>
                      <p className="text-xs text-gray-500">{sub.plan_code}</p>
                    </td>

                    <td className="py-3 px-4 font-semibold">
                      AED {Number(sub.amount_aed || 0).toFixed(2)}
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant={STATUS_VARIANT[sub.status] || "gray"}>
                        {sub.status}
                      </Badge>
                      {sub.cancel_at_period_end && (
                        <p className="mt-1 text-xs text-yellow-600">Cancels at period end</p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-sm text-gray-600">
                      {sub.current_period_end ? formatDate(sub.current_period_end) : "-"}
                    </td>

                    <td className="py-3 px-4 text-sm">
                      {sub.auto_renew ? "Enabled" : "Disabled"}
                    </td>

                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => markPaid(sub.id)}
                        disabled={markingId === sub.id}
                      >
                        {markingId === sub.id ? "..." : "Mark Paid"}
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