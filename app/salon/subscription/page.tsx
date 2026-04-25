// app/salon/subscription/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Loading } from "@/app/components/ui/Loading";
import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type Subscription = {
  id: string;
  plan_code: string;
  plan_name: string;
  amount_aed: number;
  currency_code: string;
  interval_type: string;
  status: string;
  auto_renew: boolean;
  cancel_at_period_end: boolean;
  trial_starts_at?: string | null;
  trial_ends_at?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  started_at?: string | null;
  cancelled_at?: string | null;
  ended_at?: string | null;
};

type Plan = {
  id: string;
  code: string;
  name: string;
  price_aed: number;
  currency_code: string;
  interval_type: string;
  description?: string | null;
  features?: string[];
};

type Payment = {
  id: string;
  amount_aed: number;
  status: string;
  paid_at?: string | null;
  created_at: string;
};

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  async function request(
    path: string,
    method: string = "GET",
    body?: any
  ) {
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

  async function loadSubscription() {
    try {
      setLoading(true);

      const data = await request("/dashboard/salon/subscription");

      setSubscription(data.subscription || null);
      setPlans(Array.isArray(data.plans) ? data.plans : []);
      setPayments(Array.isArray(data.payments) ? data.payments : []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load subscription");
    } finally {
      setLoading(false);
    }
  }

  async function startTrial(planCode: string) {
    try {
      await request(
        "/dashboard/salon/subscription/start-trial",
        "POST",
        {
          plan_code: planCode,
          trial_days: 30,
        }
      );

      toast.success("Trial started successfully");
      loadSubscription();
    } catch (error: any) {
      toast.error(error.message || "Failed to start trial");
    }
  }

  async function payNow() {
    try {
      const data = await request(
        "/dashboard/salon/subscription/pay-now",
        "POST"
      );

      if (data.payment_url) {
        window.location.href = data.payment_url;
      }
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
    }
  }

  async function cancelSubscription() {
    try {
      await request(
        "/dashboard/salon/subscription/cancel",
        "POST"
      );

      toast.success("Subscription will cancel at the end of the current period"); loadSubscription();
    } catch (error: any) {
      toast.error(error.message || "Cancel failed");
    }
  }

  async function changePlan(planCode: string) {
    try {
      await request("/dashboard/salon/subscription/change-plan", "POST", {
        plan_code: planCode,
      });

      toast.success("Plan updated successfully");
      loadSubscription();
    } catch (error: any) {
      toast.error(error.message || "Failed to change plan");
    }
  }

  async function reactivateSubscription() {
    try {
      await request("/dashboard/salon/subscription/reactivate", "POST");

      toast.success("Subscription reactivated");
      loadSubscription();
    } catch (error: any) {
      toast.error(error.message || "Failed to reactivate");
    }
  }

  useEffect(() => {
    loadSubscription();
  }, []);

  if (loading) return <Loading size="lg" />;

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

      {subscription && (
        <>
          <Card>
            {subscription.cancel_at_period_end && (
              <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                Your subscription is scheduled to end on{" "}
                {subscription.current_period_end
                  ? formatDate(subscription.current_period_end)
                  : "the end of the current period"}.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard title="Current Plan" value={subscription.plan_name} />
              <InfoCard title="Status" value={subscription.status} />
              <InfoCard
                title="Price"
                value={`AED ${Number(subscription.amount_aed || 0).toFixed(2)}`}
              />
              <InfoCard
                title="Renewal Date"
                value={
                  subscription.current_period_end
                    ? formatDate(subscription.current_period_end)
                    : "-"
                }
              />
              <InfoCard
                title="Auto Renew"
                value={subscription.auto_renew ? "Enabled" : "Disabled"}
              />
              <InfoCard
                title="Trial Ends"
                value={
                  subscription.trial_ends_at
                    ? formatDate(subscription.trial_ends_at)
                    : "-"
                }
              />
            </div>
          </Card>

          <Card>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Recent Payments</h2>

              {payments.length === 0 ? (
                <p className="text-sm text-gray-500">No payments yet</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-lg border p-4 flex justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          AED {Number(payment.amount_aed).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">{payment.status}</p>
                      </div>

                      <div className="text-sm text-gray-500">
                        {payment.paid_at
                          ? formatDate(payment.paid_at)
                          : formatDate(payment.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      <Card>
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Available Plans</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => {
              const isCurrent = subscription?.plan_code === plan.code;

              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-5 bg-white ${isCurrent ? "border-pink-300 bg-pink-50" : ""
                    }`}
                >
                  <h3 className="text-lg font-bold">{plan.name}</h3>

                  <p className="text-2xl font-bold text-pink-600 mt-2">
                    AED {Number(plan.price_aed).toFixed(2)}
                  </p>

                  <p className="text-sm text-gray-500">per {plan.interval_type}</p>

                  {plan.description && (
                    <p className="mt-3 text-sm text-gray-600">
                      {plan.description}
                    </p>
                  )}

                  {plan.features && plan.features.length > 0 && (
                    <ul className="mt-4 space-y-1 text-sm text-gray-600">
                      {plan.features.map((feature, index) => (
                        <li key={index}>• {feature}</li>
                      ))}
                    </ul>
                  )}

                  {!subscription ? (
                    <Button
                      className="mt-5 w-full"
                      onClick={() => startTrial(plan.code)}
                    >
                      Start Free Trial
                    </Button>
                  ) : isCurrent ? (
                    <Button className="mt-5 w-full" variant="secondary" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className="mt-5 w-full"
                      onClick={() => changePlan(plan.code)}
                    >
                      {Number(plan.price_aed) > Number(subscription.amount_aed)
                        ? "Upgrade"
                        : "Downgrade"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {subscription && (
        <div className="flex gap-3">
          <Button onClick={payNow}>
            Pay Now
          </Button>

          {subscription.cancel_at_period_end ? (
            <Button variant="secondary" onClick={reactivateSubscription}>
              Reactivate
            </Button>
          ) : (
            <Button variant="secondary" onClick={cancelSubscription}>
              Cancel Subscription
            </Button>
          )}

          <Button variant="secondary" onClick={loadSubscription}>
            Refresh
          </Button>
        </div>
      )}
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

      <p className="mt-2 text-lg font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}