// app/salon/subscription/page.tsx

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type SubscriptionPlan = {
  code: string;
  name: string;
  price_aed: number;
  interval_type: "month" | "year";
  description?: string;
  features: string[];
};

type PaymentMethod = {
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
};

type SubscriptionData = {
  subscription: {
    id: string;
    plan_code: string;
    plan_name: string;
    amount_aed: number;
    currency_code: string;
    interval_type: "month" | "year";
    status: "inactive" | "active" | "trialing" | "past_due" | "cancelled" | "expired" | "unpaid";
    auto_renew: boolean;
    cancel_at_period_end: boolean;
    current_period_end?: string | null;
  } | null;
  payment_method?: PaymentMethod | null;
  plans: SubscriptionPlan[];
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusBadge(status?: string) {
  switch (status) {
    case "active":
      return "bg-green-50 text-green-700 border-green-200";
    case "trialing":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "past_due":
    case "unpaid":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "cancelled":
    case "expired":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

export default function SalonSubscriptionPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);

      // عدلي هذا endpoint حسب اللي بتسوينه في backend
      const result = await api.get("/dashboard/salon/subscription");
      setData(result);
    } catch (error: any) {
      alert(error.message || "Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSelectPlan(planCode: string) {
    try {
      setActionLoading(planCode);

      // هذا endpoint يفترض يرجع checkout_url أو subscription intent
      const result = await api.post("/dashboard/salon/subscription/select-plan", {
        plan_code: planCode,
      });

      if (result?.checkout_url) {
        window.location.href = result.checkout_url;
        return;
      }

      alert("Plan request created successfully.");
      await loadData();
    } catch (error: any) {
      alert(error.message || "Failed to select plan");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelAtPeriodEnd() {
    if (!confirm("Are you sure you want to cancel auto-renew?")) return;

    try {
      setActionLoading("cancel");
      await api.post("/dashboard/salon/subscription/cancel", {});
      await loadData();
    } catch (error: any) {
      alert(error.message || "Failed to cancel subscription");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResumeAutoRenew() {
    try {
      setActionLoading("resume");
      await api.post("/dashboard/salon/subscription/resume", {});
      await loadData();
    } catch (error: any) {
      alert(error.message || "Failed to resume auto-renew");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 bg-gray-200 rounded" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-64 bg-gray-100 rounded-2xl" />
            <div className="h-64 bg-gray-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const subscription = data?.subscription ?? null;
  const plans = data?.plans ?? [];
  const paymentMethod = data?.payment_method ?? null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-500 mt-1">
          Manage your salon plan, billing, and auto-renew settings.
        </p>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                {subscription?.plan_name || "No Active Plan"}
              </h2>
              <p className="text-gray-500 mt-1">
                {subscription
                  ? `AED ${Number(subscription.amount_aed).toFixed(2)} / ${subscription.interval_type}`
                  : "Choose a plan to start accepting salon subscriptions."}
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full border text-sm font-medium ${statusBadge(
                subscription?.status
              )}`}
            >
              {subscription?.status || "inactive"}
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-sm text-gray-500">Next Renewal</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {formatDate(subscription?.current_period_end)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-sm text-gray-500">Auto Renew</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {subscription?.auto_renew ? "On" : "Off"}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {paymentMethod?.brand && paymentMethod?.last4
                  ? `${paymentMethod.brand.toUpperCase()} •••• ${paymentMethod.last4}`
                  : "Not added"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            {subscription?.auto_renew && !subscription?.cancel_at_period_end && (
              <button
                onClick={handleCancelAtPeriodEnd}
                disabled={actionLoading === "cancel"}
                className="px-4 py-2 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
              >
                {actionLoading === "cancel" ? "Cancelling..." : "Cancel Auto Renew"}
              </button>
            )}

            {subscription?.cancel_at_period_end && (
              <button
                onClick={handleResumeAutoRenew}
                disabled={actionLoading === "resume"}
                className="px-4 py-2 rounded-xl border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
              >
                {actionLoading === "resume" ? "Resuming..." : "Resume Auto Renew"}
              </button>
            )}

            <button
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => alert("Connect this later to update card flow")}
            >
              Update Payment Method
            </button>
          </div>

          {subscription?.cancel_at_period_end && (
            <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 text-sm">
              Your subscription will remain active until{" "}
              <span className="font-semibold">
                {formatDate(subscription.current_period_end)}
              </span>{" "}
              and will not renew after that.
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Billing Summary</h3>
          <div className="space-y-4 mt-5">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Current status</span>
              <span className="font-semibold text-gray-900">
                {subscription?.status || "inactive"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Current plan</span>
              <span className="font-semibold text-gray-900">
                {subscription?.plan_name || "-"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Recurring amount</span>
              <span className="font-semibold text-gray-900">
                {subscription
                  ? `AED ${Number(subscription.amount_aed).toFixed(2)}`
                  : "-"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Billing cycle</span>
              <span className="font-semibold text-gray-900">
                {subscription?.interval_type || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-gray-900">Available Plans</h3>
          <p className="text-gray-500 mt-1">
            Choose the best plan for your salon. Auto-pay continues until cancelled.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const isCurrent = subscription?.plan_code === plan.code;

            return (
              <div
                key={plan.code}
                className={`rounded-2xl border p-6 ${
                  isCurrent
                    ? "border-purple-300 bg-purple-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{plan.name}</h4>
                    <p className="text-gray-500 mt-1">{plan.description}</p>
                  </div>

                  {isCurrent && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-700">
                      Current
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  <p className="text-3xl font-bold text-gray-900">
                    AED {Number(plan.price_aed).toFixed(0)}
                  </p>
                  <p className="text-gray-500">per {plan.interval_type}</p>
                </div>

                <ul className="mt-5 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-700">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.code)}
                  disabled={isCurrent || actionLoading === plan.code}
                  className={`w-full mt-6 py-3 rounded-xl font-semibold transition ${
                    isCurrent
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-95"
                  }`}
                >
                  {actionLoading === plan.code
                    ? "Processing..."
                    : isCurrent
                    ? "Current Plan"
                    : `Choose ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Billing History</h3>
            <p className="text-gray-500 mt-1">Recent subscription payments and invoices.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-3">Date</th>
                <th className="py-3">Description</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Status</th>
                <th className="py-3">Invoice</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-4 text-gray-400" colSpan={5}>
                  No billing records yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}