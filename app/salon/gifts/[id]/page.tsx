// app/salon/gifts/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gift as GiftIcon,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  ReceiptText,
  Sparkles,
  UserRound,
  WalletCards,
} from "lucide-react";

import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

type GiftDetail = {
  id: string;
  code: string;
  amount_aed: number;
  subtotal_aed: number;
  gift_fee_aed: number;
  total_aed: number;
  currency: string;

  status:
    | "active"
    | "redeemed"
    | "expired"
    | "cancelled";

  sender_name?: string | null;
  sender_user_name?: string | null;
  sender_phone?: string | null;
  sender_email?: string | null;

  recipient_phone: string;

  salon_name?: string | null;

  message?: string | null;
  theme_id?: string | null;

  expires_at: string;
  redeemed_at?: string | null;
  seen_at?: string | null;

  sender_seen_rewarded: boolean;

  created_at: string;
};

type UsageBooking = {
  id: string;
  status: string;
  mode: string;
  scheduled_at: string;
  total_aed: number;
  created_at: string;
  salon_name?: string | null;
  branch_name?: string | null;
};

export default function GiftDetailPage() {
  const params = useParams();

  const giftId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [gift, setGift] =
    useState<GiftDetail | null>(null);

  const [usageBooking, setUsageBooking] =
    useState<UsageBooking | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadGift() {
      if (!giftId) return;

      try {
        setLoading(true);
        setError(null);

        const token = getToken();

        const res = await fetch(
          `${API_BASE}/dashboard/salon/gifts/${giftId}`,
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

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.error || "Failed to load gift"
          );
        }

        setGift(data.gift || null);

        setUsageBooking(
          data.usage_booking || null
        );
      } catch (e: any) {
        setError(
          e?.message || "Failed to load gift"
        );

        setGift(null);
        setUsageBooking(null);
      } finally {
        setLoading(false);
      }
    }

    loadGift();
  }, [giftId]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading gift...
          </p>
        </div>
      </div>
    );
  }

  if (error || !gift) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-6 w-6 text-red-500" />

          <p className="mt-3 text-sm font-medium text-red-800">
            {error || "Gift not found"}
          </p>

          <Link
            href="/salon/gifts"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary-600 transition hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to gifts
          </Link>
        </div>
      </div>
    );
  }

  const senderDisplay =
    gift.sender_name ||
    gift.sender_user_name ||
    "Not available";

  return (
    <div className="mx-auto max-w-6xl space-y-7 p-6 lg:p-8">
      {/* Back */}
      <Link
        href="/salon/gifts"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to gifts
      </Link>

      {/* Header */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <GiftIcon className="h-5 w-5" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Gift details
                  </h1>

                  <StatusBadge
                    status={gift.status}
                  />
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  Created{" "}
                  {gift.created_at
                    ? formatDate(
                        gift.created_at
                      )
                    : "-"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
              <DetailCode
                label="Gift code"
                value={gift.code}
              />

              <DetailCode
                label="Gift ID"
                value={gift.id}
                compact
              />
            </div>
          </div>

          <div className="md:text-right">
            <p className="text-xs font-medium text-gray-400">
              Total paid
            </p>

            <p className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {formatMoney(gift.total_aed)}
            </p>
          </div>
        </div>
      </section>

      {/* Money */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MoneyCard
          label="Gift value"
          value={formatMoney(
            gift.amount_aed
          )}
        />

        <MoneyCard
          label="Subtotal"
          value={formatMoney(
            gift.subtotal_aed
          )}
        />

        <MoneyCard
          label="Gift fee"
          value={formatMoney(
            gift.gift_fee_aed
          )}
        />
      </div>

      {/* People */}
      <div className="grid gap-6 md:grid-cols-2">
        <InfoCard
          icon={
            <UserRound className="h-5 w-5" />
          }
          title="Sender"
          description="Details for the person who sent the gift."
        >
          <InfoRow
            label="Name"
            value={senderDisplay}
          />

          {gift.sender_user_name &&
            gift.sender_user_name !==
              senderDisplay && (
              <InfoRow
                label="Account name"
                value={
                  gift.sender_user_name
                }
              />
            )}

          <InfoRow
            label="Phone"
            value={
              gift.sender_phone ||
              "Not available"
            }
            icon={
              <Phone className="h-4 w-4" />
            }
          />

          <InfoRow
            label="Email"
            value={
              gift.sender_email ||
              "Not available"
            }
            icon={
              <Mail className="h-4 w-4" />
            }
          />
        </InfoCard>

        <InfoCard
          icon={
            <GiftIcon className="h-5 w-5" />
          }
          title="Recipient"
          description="Recipient delivery and viewing information."
        >
          <InfoRow
            label="Phone"
            value={
              gift.recipient_phone ||
              "Not available"
            }
            icon={
              <Phone className="h-4 w-4" />
            }
          />

          <InfoRow
            label="Gift viewed"
            value={
              gift.seen_at
                ? formatDate(gift.seen_at)
                : "Not viewed yet"
            }
          />
        </InfoCard>
      </div>

      {/* Gift information + timeline */}
      <div className="grid gap-6 md:grid-cols-2">
        <InfoCard
          icon={
            <Sparkles className="h-5 w-5" />
          }
          title="Gift information"
          description="Gift destination and payment currency."
        >
          <InfoRow
            label="Business"
            value={
              gift.salon_name ||
              "Glowee Credit"
            }
          />

          <InfoRow
            label="Currency"
            value={gift.currency || "AED"}
          />
        </InfoCard>

        <InfoCard
          icon={
            <CalendarDays className="h-5 w-5" />
          }
          title="Timeline"
          description="Important dates for this gift."
        >
          <InfoRow
            label="Created"
            value={
              gift.created_at
                ? formatDate(
                    gift.created_at
                  )
                : "-"
            }
          />

          <InfoRow
            label="Expires"
            value={
              gift.expires_at
                ? formatDate(
                    gift.expires_at
                  )
                : "-"
            }
          />

          <InfoRow
            label="Redeemed"
            value={
              gift.redeemed_at
                ? formatDate(
                    gift.redeemed_at
                  )
                : "Not redeemed"
            }
          />
        </InfoCard>
      </div>

      {/* Message */}
      <section className="rounded-2xl border border-gray-200 bg-white">
        <SectionHeader
          icon={
            <MessageSquareText className="h-5 w-5" />
          }
          title="Gift message"
          description="Personal message included with this gift."
        />

        <div className="p-6">
          {gift.message ? (
            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
              “{gift.message}”
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              No message was included.
            </p>
          )}
        </div>
      </section>

      {/* Usage */}
      <section className="rounded-2xl border border-gray-200 bg-white">
        <SectionHeader
          icon={
            <ReceiptText className="h-5 w-5" />
          }
          title="Booking usage"
          description="See whether this gift has been applied to a Glowee booking."
        />

        <div className="p-6">
          {usageBooking ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-gray-400">
                    Booking
                  </p>

                  <p className="mt-1 font-mono text-sm font-medium text-gray-800">
                    #
                    {usageBooking.id
                      .slice(0, 8)
                      .toUpperCase()}
                  </p>
                </div>

                <Link
                  href={`/salon/bookings/${usageBooking.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 transition hover:text-primary-700"
                >
                  View booking
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <UsageItem
                  icon={
                    <CheckCircle2 className="h-4 w-4" />
                  }
                  label="Booking status"
                  value={formatLabel(
                    usageBooking.status
                  )}
                />

                <UsageItem
                  icon={
                    <WalletCards className="h-4 w-4" />
                  }
                  label="Mode"
                  value={formatLabel(
                    usageBooking.mode
                  )}
                />

                <UsageItem
                  icon={
                    <MapPin className="h-4 w-4" />
                  }
                  label="Location"
                  value={
                    usageBooking.branch_name ||
                    "Not available"
                  }
                />

                <UsageItem
                  icon={
                    <CalendarDays className="h-4 w-4" />
                  }
                  label="Scheduled"
                  value={
                    usageBooking.scheduled_at
                      ? formatDate(
                          usageBooking.scheduled_at
                        )
                      : "-"
                  }
                />

                <UsageItem
                  icon={
                    <ReceiptText className="h-4 w-4" />
                  }
                  label="Booking total"
                  value={formatMoney(
                    usageBooking.total_aed
                  )}
                />

                {usageBooking.salon_name && (
                  <UsageItem
                    icon={
                      <GiftIcon className="h-4 w-4" />
                    }
                    label="Business"
                    value={
                      usageBooking.salon_name
                    }
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                <Clock3 className="h-5 w-5 text-gray-400" />
              </div>

              <h3 className="mt-3 text-sm font-medium text-gray-800">
                Not used in a booking yet
              </h3>

              <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                Booking information will appear here once this gift is applied.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Internal activity */}
      <section className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Gift activity
        </p>

        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <span className="text-gray-500">
            Recipient viewed:{" "}
            <strong className="font-medium text-gray-700">
              {gift.seen_at ? "Yes" : "No"}
            </strong>
          </span>

          <span className="text-gray-500">
            Sender reward processed:{" "}
            <strong className="font-medium text-gray-700">
              {gift.sender_seen_rewarded
                ? "Yes"
                : "No"}
            </strong>
          </span>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-gray-100 px-6 py-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          {icon}
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">
            {title}
          </h2>

          <p className="mt-0.5 text-sm text-gray-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white">
      <SectionHeader
        icon={icon}
        title={title}
        description={description}
      />

      <div className="divide-y divide-gray-100 px-6">
        {children}
      </div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-5 py-4">
      <span className="text-sm text-gray-500">
        {label}
      </span>

      <span className="flex min-w-0 items-center gap-1.5 text-right text-sm font-medium text-gray-800">
        {icon && (
          <span className="shrink-0 text-gray-400">
            {icon}
          </span>
        )}

        <span className="break-all">
          {value}
        </span>
      </span>
    </div>
  );
}

function MoneyCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function DetailCode({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="mt-1 font-mono text-sm font-medium text-gray-700">
        {compact
          ? `${value.slice(0, 12)}...`
          : value}
      </p>
    </div>
  );
}

function UsageItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        {icon}
        {label}
      </div>

      <p className="mt-1.5 text-sm font-medium text-gray-800">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: GiftDetail["status"];
}) {
  const styles: Record<
    GiftDetail["status"],
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
      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function formatMoney(
  value: number | string | null | undefined
) {
  return `AED ${Number(value || 0).toFixed(
    2
  )}`;
}

function formatLabel(value?: string | null) {
  if (!value) return "-";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}