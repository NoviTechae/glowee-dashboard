"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Loading } from "@/app/components/ui/Loading";
import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";

type Subscription = {
  plan: string;
  status: string;
  current_period_end: string;
  auto_renew: boolean;
};

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadSubscription() {
    try {
      setLoading(true);

      const token = getToken();

      const res = await fetch(
        `${API_BASE}/dashboard/salon/subscription`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load subscription");
      }

      setSubscription(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load subscription");
    } finally {
      setLoading(false);
    }
  }

  async function cancelSubscription() {
    try {
      const token = getToken();

      const res = await fetch(
        `${API_BASE}/dashboard/salon/subscription/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Cancel failed");
      }

      toast.success(data.message || "Subscription cancelled");
      loadSubscription();
    } catch (error: any) {
      toast.error(error.message || "Cancel failed");
    }
  }

  useEffect(() => {
    loadSubscription();
  }, []);

  if (loading) return <Loading size="lg" />;

  if (!subscription) {
    return (
      <div className="text-center py-20 text-gray-500">
        No subscription found
      </div>
    );
  }

  const planPrice =
    subscription.plan === "basic"
      ? "AED 399 / month"
      : subscription.plan === "pro"
      ? "AED 699 / month"
      : "Custom Plan";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Subscription
        </h1>
        <p className="text-gray-600">
          Manage your salon plan and billing
        </p>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoCard
            title="Current Plan"
            value={subscription.plan.toUpperCase()}
          />

          <InfoCard
            title="Status"
            value={subscription.status}
          />

          <InfoCard
            title="Price"
            value={planPrice}
          />

          <InfoCard
            title="Renewal Date"
            value={subscription.current_period_end}
          />

          <InfoCard
            title="Auto Renew"
            value={subscription.auto_renew ? "Enabled" : "Disabled"}
          />
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Founding Salon Benefits
          </h2>

          <div className="rounded-xl bg-pink-50 border border-pink-100 p-4">
            <p className="font-medium text-pink-700">
              Lifetime Founding Discount
            </p>

            <p className="text-sm text-gray-600 mt-2">
              Early partner salons receive exclusive lifetime pricing,
              priority support, and premium visibility inside Glowee.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={loadSubscription}
        >
          Refresh
        </Button>

        <Button
          variant="secondary"
          onClick={cancelSubscription}
        >
          Cancel Subscription
        </Button>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}