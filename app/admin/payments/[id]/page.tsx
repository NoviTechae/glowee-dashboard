// app/admin/payments/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

type PaymentDetails = {
  id: string;
  user_id?: string | number;
  provider: string;
  type: string;
  status: string;
  amount_aed: number;
  fee_aed?: number;
  net_amount_aed?: number;
  provider_payment_id?: string | null;
  provider_customer_id?: string | null;
  provider_session_id?: string | null;
  payment_method_type?: string | null;
  card_last4?: string | null;
  card_brand?: string | null;
  error_message?: string | null;
  error_code?: string | null;
  metadata?: any;
  created_at: string;
  updated_at?: string | null;
  authorized_at?: string | null;
  succeeded_at?: string | null;
  failed_at?: string | null;
  refunded_at?: string | null;
  booking_id?: string | null;
  gift_id?: string | null;
  wallet_transaction_id?: string | null;
  user_name?: string | null;
  user_phone?: string | null;
  user_email?: string | null;
  salon_name?: string | null;
  branch_name?: string | null;
  booking_scheduled_at?: string | null;
  booking_status?: string | null;
};

function money(value?: number | null) {
  return `${Number(value || 0).toFixed(0)} AED`;
}

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function prettify(value?: string | null) {
  if (!value) return "-";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusClasses(status?: string | null) {
  if (status === "succeeded") return "bg-green-50 text-green-700 border-green-200";
  if (status === "failed") return "bg-red-50 text-red-700 border-red-200";
  if (status === "refunded") return "bg-orange-50 text-orange-700 border-orange-200";
  if (status === "pending") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (status === "authorized" || status === "captured") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (status === "cancelled") return "bg-gray-100 text-gray-700 border-gray-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

function prettyJson(value: any) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

export default function PaymentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayment();
  }, []);

  async function loadPayment() {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/admin/payments/${id}`);
      setPayment(res.payment);
    } catch (error) {
      console.error(error);
      alert("Failed to load payment details");
    } finally {
      setLoading(false);
    }
  }

  const metadata = payment?.metadata || {};

  const customerName = useMemo(() => {
    return payment?.user_name || metadata?.name || "No name";
  }, [payment, metadata]);

  const customerPhone = useMemo(() => {
    return payment?.user_phone || metadata?.phone || metadata?.recipient_phone || "-";
  }, [payment, metadata]);

  const customerEmail = useMemo(() => {
    return payment?.user_email || metadata?.email || "No email";
  }, [payment, metadata]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-500 shadow-sm">
          Loading payment details...
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-500 shadow-sm">
          Payment not found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="mb-4 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                ← Back
              </button>

              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Payment Details
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Review transaction details, linked booking info, and provider metadata.
              </p>
            </div>

            <button
              onClick={loadPayment}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-5">
                <h2 className="text-lg font-black text-gray-900">Transaction Overview</h2>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-2">
                <Info label="Transaction ID" value={payment.id} mono />
                <Info label="Provider Payment ID" value={payment.provider_payment_id || "-"} mono />
                <Info label="Provider Customer ID" value={payment.provider_customer_id || "-"} mono />
                <Info label="Provider Session ID" value={payment.provider_session_id || "-"} mono />

                <Info label="Provider" value={prettify(payment.provider)} />
                <Info label="Type" value={prettify(payment.type)} />
                <Info
                  label="Status"
                  value={
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(
                        payment.status
                      )}`}
                    >
                      {prettify(payment.status)}
                    </span>
                  }
                />
                <Info label="Payment Method" value={prettify(payment.payment_method_type)} />

                <Info label="Card Brand" value={prettify(payment.card_brand)} />
                <Info label="Card Last4" value={payment.card_last4 ? `•••• ${payment.card_last4}` : "-"} />
                <Info label="Amount" value={money(payment.amount_aed)} />
                <Info label="Fee" value={money(payment.fee_aed)} />
                <Info label="Net Amount" value={money(payment.net_amount_aed)} />
                <Info label="Created At" value={fmtDate(payment.created_at)} />
                <Info label="Authorized At" value={fmtDate(payment.authorized_at)} />
                <Info label="Succeeded At" value={fmtDate(payment.succeeded_at)} />
                <Info label="Failed At" value={fmtDate(payment.failed_at)} />
                <Info label="Refunded At" value={fmtDate(payment.refunded_at)} />
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-5">
                <h2 className="text-lg font-black text-gray-900">Linked References</h2>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-2">
                <Info label="Booking ID" value={payment.booking_id || "-"} mono />
                <Info label="Gift ID" value={payment.gift_id || "-"} mono />
                <Info label="Wallet Transaction ID" value={payment.wallet_transaction_id || "-"} mono />
                <Info label="Booking Status" value={prettify(payment.booking_status)} />
                <Info label="Salon" value={payment.salon_name || "-"} />
                <Info label="Branch" value={payment.branch_name || "-"} />
                <Info label="Scheduled Booking Time" value={fmtDate(payment.booking_scheduled_at)} />
              </div>
            </div>

            {payment.error_message ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 shadow-sm">
                <div className="border-b border-red-100 px-6 py-5">
                  <h2 className="text-lg font-black text-red-700">Error Details</h2>
                </div>

                <div className="space-y-2 p-6">
                  <p className="text-sm font-medium text-red-700">{payment.error_message}</p>
                  <p className="text-xs font-semibold text-red-500">
                    Code: {payment.error_code || "-"}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-5">
                <h2 className="text-lg font-black text-gray-900">Metadata</h2>
              </div>

              <div className="space-y-4 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Info label="Gift Code" value={metadata?.gift_code || "-"} />
                  <Info label="Gift Type" value={metadata?.gift_type || "-"} />
                  <Info label="Recipient Phone" value={metadata?.recipient_phone || "-"} />
                  <Info label="Phone" value={metadata?.phone || "-"} />
                </div>

                <div className="rounded-2xl bg-gray-950 p-4">
                  <pre className="overflow-x-auto text-xs text-gray-100">
                    {prettyJson(metadata)}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-5">
                <h2 className="text-lg font-black text-gray-900">Customer</h2>
              </div>

              <div className="space-y-4 p-6">
                <InlineInfo label="Name" value={customerName} />
                <InlineInfo label="Phone" value={customerPhone} />
                <InlineInfo label="Email" value={customerEmail} />
                <InlineInfo label="User ID" value={payment.user_id ? String(payment.user_id) : "-"} mono />
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-5">
                <h2 className="text-lg font-black text-gray-900">Quick Actions</h2>
              </div>

              <div className="space-y-3 p-6">
                {payment.user_id ? (
                  <Link
                    href={`/admin/users/${payment.user_id}`}
                    className="block rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    View User
                  </Link>
                ) : null}

                {payment.booking_id ? (
                  <Link
                    href={`/admin/bookings/${payment.booking_id}`}
                    className="block rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    View Booking
                  </Link>
                ) : null}

                <button
                  onClick={loadPayment}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
                >
                  Refresh Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div className={`mt-2 font-medium text-gray-900 ${mono ? "break-all font-mono text-xs" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function InlineInfo({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`max-w-[65%] text-right font-semibold text-gray-900 ${mono ? "break-all font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}