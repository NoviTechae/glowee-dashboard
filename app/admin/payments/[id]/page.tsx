// app/admin/payments/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  ExternalLink,
  RefreshCw,
  UserRound,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";

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

  metadata?: Record<string, any> | null;

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
  return `AED ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dubai",
  });
}

function prettify(value?: string | null) {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusClasses(status?: string | null) {
  if (status === "succeeded") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "failed") {
    return "bg-red-50 text-red-700";
  }

  if (
    status === "refunded" ||
    status === "refunded_to_wallet"
  ) {
    return "bg-orange-50 text-orange-700";
  }

  if (status === "pending") {
    return "bg-amber-50 text-amber-700";
  }

  if (
    status === "authorized" ||
    status === "captured"
  ) {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-gray-100 text-gray-600";
}

function hasMetadata(metadata: Record<string, any>) {
  return Object.keys(metadata).length > 0;
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
  const id = params.id as string;

  const [payment, setPayment] =
    useState<PaymentDetails | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  async function loadPayment(showRefreshing = false) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get(
        `/dashboard/admin/payments/${id}`
      );

      setPayment(response.payment);
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.message ||
          "Failed to load payment details"
      );

      setPayment(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const metadata =
    payment?.metadata &&
    typeof payment.metadata === "object"
      ? payment.metadata
      : {};

  const customerName = useMemo(() => {
    return (
      payment?.user_name ||
      metadata?.name ||
      "Unknown customer"
    );
  }, [payment, metadata]);

  const customerPhone = useMemo(() => {
    return (
      payment?.user_phone ||
      metadata?.phone ||
      metadata?.recipient_phone ||
      "-"
    );
  }, [payment, metadata]);

  const customerEmail = useMemo(() => {
    return (
      payment?.user_email ||
      metadata?.email ||
      "-"
    );
  }, [payment, metadata]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading payment details...
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <Link
          href="/admin/payments"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to payments
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-gray-900">
            Payment not found
          </p>

          <p className="mt-1 text-sm text-gray-500">
            This transaction may no longer be available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Back */}
      <Link
        href="/admin/payments"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to payments
      </Link>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-primary-600">
            Payment details
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold tracking-tight text-gray-900">
              {payment.id.slice(0, 8)}
            </h1>

            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                payment.status
              )}`}
            >
              {prettify(payment.status)}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Created {formatDate(payment.created_at)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadPayment(true)}
          disabled={refreshing}
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

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Customer paid"
          value={money(payment.amount_aed)}
          icon={CircleDollarSign}
        />

        <SummaryCard
          label="Payment fee"
          value={money(payment.fee_aed)}
          icon={CreditCard}
        />

        <SummaryCard
          label="Net amount"
          value={money(payment.net_amount_aed)}
          icon={WalletCards}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        {/* Left */}
        <div className="space-y-6">
          {/* Payment information */}
          <Section title="Payment information">
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <DetailRow
                label="Provider"
                value={prettify(payment.provider)}
              />

              <DetailRow
                label="Transaction type"
                value={prettify(payment.type)}
              />

              <DetailRow
                label="Payment method"
                value={prettify(
                  payment.payment_method_type
                )}
              />

              <DetailRow
                label="Card"
                value={
                  payment.card_brand ||
                  payment.card_last4
                    ? `${prettify(
                        payment.card_brand
                      )}${
                        payment.card_last4
                          ? ` •••• ${payment.card_last4}`
                          : ""
                      }`
                    : "-"
                }
              />

              <DetailRow
                label="Provider payment ID"
                value={
                  payment.provider_payment_id ||
                  "-"
                }
                mono
              />

              <DetailRow
                label="Provider customer ID"
                value={
                  payment.provider_customer_id ||
                  "-"
                }
                mono
              />

              <DetailRow
                label="Provider session ID"
                value={
                  payment.provider_session_id ||
                  "-"
                }
                mono
              />

              <DetailRow
                label="Transaction ID"
                value={payment.id}
                mono
              />
            </div>
          </Section>

          {/* Linked records */}
          <Section title="Linked records">
            <div className="space-y-5">
              {payment.booking_id ? (
                <LinkedRecord
                  icon={CalendarDays}
                  title="Booking"
                  subtitle={
                    payment.salon_name
                      ? `${payment.salon_name}${
                          payment.branch_name
                            ? ` · ${payment.branch_name}`
                            : ""
                        }`
                      : "Glowee booking"
                  }
                  details={[
                    payment.booking_status
                      ? prettify(
                          payment.booking_status
                        )
                      : null,
                    payment.booking_scheduled_at
                      ? formatDate(
                          payment.booking_scheduled_at
                        )
                      : null,
                  ]}
                  href={`/admin/bookings/${payment.booking_id}`}
                  id={payment.booking_id}
                />
              ) : null}

              {payment.gift_id ? (
                <LinkedRecord
                  icon={WalletCards}
                  title="Gift"
                  subtitle="Glowee gift purchase"
                  href={`/admin/gifts/${payment.gift_id}`}
                  id={payment.gift_id}
                />
              ) : null}

              {payment.wallet_transaction_id ? (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-500">
                      <WalletCards className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Wallet transaction
                      </p>

                      <p className="mt-1 break-all font-mono text-xs text-gray-500">
                        {
                          payment.wallet_transaction_id
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {!payment.booking_id &&
              !payment.gift_id &&
              !payment.wallet_transaction_id ? (
                <p className="text-sm text-gray-500">
                  No linked booking, gift or wallet
                  transaction.
                </p>
              ) : null}
            </div>
          </Section>

          {/* Error */}
          {payment.error_message ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-800">
                Payment error
              </p>

              <p className="mt-2 text-sm text-red-700">
                {payment.error_message}
              </p>

              {payment.error_code ? (
                <p className="mt-2 font-mono text-xs text-red-600">
                  Code: {payment.error_code}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Metadata */}
          {hasMetadata(metadata) ? (
            <Section title="Provider metadata">
              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {metadata?.gift_code ? (
                  <DetailRow
                    label="Gift code"
                    value={metadata.gift_code}
                  />
                ) : null}

                {metadata?.gift_type ? (
                  <DetailRow
                    label="Gift type"
                    value={prettify(
                      metadata.gift_type
                    )}
                  />
                ) : null}

                {metadata?.recipient_phone ? (
                  <DetailRow
                    label="Recipient phone"
                    value={
                      metadata.recipient_phone
                    }
                  />
                ) : null}

                {metadata?.phone ? (
                  <DetailRow
                    label="Phone"
                    value={metadata.phone}
                  />
                ) : null}
              </div>

              <details className="mt-5 rounded-xl border border-gray-200 bg-gray-50">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700">
                  View raw metadata
                </summary>

                <div className="border-t border-gray-200 p-4">
                  <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-all rounded-xl bg-gray-950 p-4 text-xs text-gray-100">
                    {prettyJson(metadata)}
                  </pre>
                </div>
              </details>
            </Section>
          ) : null}
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Customer */}
          <Section title="Customer">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                {customerName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {customerName}
                </p>

                <p className="mt-0.5 text-xs text-gray-500">
                  Glowee customer
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <InlineDetail
                label="Phone"
                value={customerPhone}
              />

              <InlineDetail
                label="Email"
                value={customerEmail}
              />

              <InlineDetail
                label="User ID"
                value={
                  payment.user_id
                    ? String(payment.user_id)
                    : "-"
                }
                mono
              />
            </div>

            {payment.user_id ? (
              <Link
                href={`/admin/users/${payment.user_id}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary-600 transition hover:text-primary-700"
              >
                <UserRound className="h-4 w-4" />
                View customer
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </Section>

          {/* Timeline */}
          <Section title="Payment timeline">
            <TimelineItem
              label="Created"
              value={formatDate(
                payment.created_at
              )}
              active
            />

            <TimelineItem
              label="Authorized"
              value={formatDate(
                payment.authorized_at
              )}
              active={
                !!payment.authorized_at
              }
            />

            <TimelineItem
              label="Succeeded"
              value={formatDate(
                payment.succeeded_at
              )}
              active={
                !!payment.succeeded_at
              }
            />

            <TimelineItem
              label="Failed"
              value={formatDate(
                payment.failed_at
              )}
              active={!!payment.failed_at}
            />

            <TimelineItem
              label="Refunded"
              value={formatDate(
                payment.refunded_at
              )}
              active={
                !!payment.refunded_at
              }
              last
            />
          </Section>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs leading-5 text-gray-500">
              Refunds are currently not processed
              from the Glowee Admin Dashboard.
              Payment records shown here are
              read-only.
            </p>
          </div>
        </div>
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

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-900">
          {title}
        </h2>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <div
        className={`mt-1.5 text-sm font-medium text-gray-900 ${
          mono
            ? "break-all font-mono text-xs"
            : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function InlineDetail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p
        className={`max-w-[65%] text-right text-sm font-medium text-gray-900 ${
          mono
            ? "break-all font-mono text-xs"
            : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TimelineItem({
  label,
  value,
  active,
  last = false,
}: {
  label: string;
  value: string;
  active: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-3">
      {!last ? (
        <div className="absolute left-[5px] top-4 h-full w-px bg-gray-200" />
      ) : null}

      <div
        className={`relative mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 ${
          active
            ? "border-primary-500 bg-primary-100"
            : "border-gray-300 bg-white"
        }`}
      />

      <div className={last ? "" : "pb-5"}>
        <p className="text-sm font-medium text-gray-900">
          {label}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          {value}
        </p>
      </div>
    </div>
  );
}

function LinkedRecord({
  icon: Icon,
  title,
  subtitle,
  details = [],
  href,
  id,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  subtitle: string;
  details?: (string | null)[];
  href: string;
  id: string;
}) {
  const visibleDetails = details.filter(
    Boolean
  ) as string[];

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-500">
            <Icon className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {title}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              {subtitle}
            </p>

            {visibleDetails.length ? (
              <p className="mt-1 text-xs text-gray-500">
                {visibleDetails.join(" · ")}
              </p>
            ) : null}

            <p className="mt-2 break-all font-mono text-[11px] text-gray-400">
              {id}
            </p>
          </div>
        </div>

        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          View
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}