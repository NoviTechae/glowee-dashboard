// app/admin/gifts/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Eye,
  Gift as GiftIcon,
  MessageSquare,
  Phone,
  Store,
  UserRound,
  WalletCards,
} from "lucide-react";

import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

type GiftStatus =
  | "pending"
  | "active"
  | "redeemed"
  | "expired"
  | "cancelled";

type GiftDetail = {
  id: string;
  code: string;
  amount_aed: number;
  subtotal_aed: number;
  gift_fee_aed: number;
  total_aed: number;
  currency: string;
  status: GiftStatus;

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
  status:
    | "pending"
    | "confirmed"
    | "completed"
    | "cancelled";
  mode: "in_salon" | "home";
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
  const [error, setError] = useState("");

  async function loadGift() {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const res = await fetch(
        `${API_BASE}/dashboard/admin/gifts/${giftId}`,
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
      setUsageBooking(data.usage_booking || null);
    } catch (e: any) {
      setError(
        e?.message || "Failed to load gift"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGift();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giftId]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500" />

          <p className="mt-3 text-sm text-gray-500">
            Loading gift...
          </p>
        </div>
      </div>
    );
  }

  if (!gift) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-700">
            {error || "Gift not found"}
          </p>

          <Link
            href="/admin/gifts"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-700"
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
    "—";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Back */}
      <Link
        href="/admin/gifts"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to gifts
      </Link>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary-600">
            Gift details
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              {gift.code || `Gift #${gift.id.slice(0, 8)}`}
            </h1>

            <GiftStatusBadge status={gift.status} />
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Created{" "}
            {gift.created_at
              ? formatDate(gift.created_at)
              : "—"}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-sm text-gray-500">
            Customer paid
          </p>

          <p className="mt-1 text-3xl font-semibold text-gray-900">
            AED{" "}
            {Number(
              gift.total_aed || 0
            ).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Gift value"
          value={`AED ${Number(
            gift.amount_aed || 0
          ).toFixed(2)}`}
          icon={GiftIcon}
        />

        <SummaryCard
          label="Glowee fee"
          value={`AED ${Number(
            gift.gift_fee_aed || 0
          ).toFixed(2)}`}
          icon={WalletCards}
        />

        <SummaryCard
          label="Customer paid"
          value={`AED ${Number(
            gift.total_aed || 0
          ).toFixed(2)}`}
          icon={WalletCards}
        />
      </div>

      {/* Sender / Recipient */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InfoCard
          title="Sender"
          icon={UserRound}
          description="Customer who sent the gift."
        >
          <InfoRow
            label="Display name"
            value={senderDisplay}
          />

          <InfoRow
            label="Account name"
            value={
              gift.sender_user_name || "—"
            }
          />

          <InfoRow
            label="Phone"
            value={gift.sender_phone || "—"}
          />

          <InfoRow
            label="Email"
            value={gift.sender_email || "—"}
          />
        </InfoCard>

        <InfoCard
          title="Recipient"
          icon={Phone}
          description="Recipient and delivery activity."
        >
          <InfoRow
            label="Phone"
            value={gift.recipient_phone || "—"}
          />

          <InfoRow
            label="Seen"
            value={
              gift.seen_at
                ? formatDate(gift.seen_at)
                : "Not seen yet"
            }
          />

          <InfoRow
            label="Sender reward"
            value={
              gift.sender_seen_rewarded
                ? "Rewarded"
                : "Not rewarded"
            }
          />
        </InfoCard>
      </div>

      {/* Gift + Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InfoCard
          title="Gift information"
          icon={Store}
          description="Business and gift configuration."
        >
          <InfoRow
            label="Business"
            value={
              gift.salon_name || "Glowee"
            }
          />

          <InfoRow
            label="Theme ID"
            value={gift.theme_id || "—"}
          />

          <InfoRow
            label="Currency"
            value={gift.currency || "AED"}
          />

          <InfoRow
            label="Gift ID"
            value={gift.id}
            mono
          />
        </InfoCard>

        <InfoCard
          title="Timeline"
          icon={CalendarDays}
          description="Gift lifecycle and expiry."
        >
          <InfoRow
            label="Created"
            value={
              gift.created_at
                ? formatDate(gift.created_at)
                : "—"
            }
          />

          <InfoRow
            label="Expires"
            value={
              gift.expires_at
                ? formatDate(gift.expires_at)
                : "—"
            }
          />

          <InfoRow
            label="Redeemed"
            value={
              gift.redeemed_at
                ? formatDate(gift.redeemed_at)
                : "Not redeemed"
            }
          />
        </InfoCard>
      </div>

      {/* Message */}
      <InfoCard
        title="Message"
        icon={MessageSquare}
        description="Message included with this gift."
      >
        {gift.message ? (
          <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
            {gift.message}
          </p>
        ) : (
          <p className="text-sm text-gray-400">
            No message included.
          </p>
        )}
      </InfoCard>

      {/* Usage booking */}
      {usageBooking && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-col justify-between gap-4 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Gift usage
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Booking associated with this gift.
              </p>
            </div>

            <Link
              href={`/admin/bookings/${usageBooking.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <Eye className="h-4 w-4" />
              View booking
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-5">
            <InfoItem
              label="Business"
              value={
                usageBooking.salon_name || "—"
              }
            />

            <InfoItem
              label="Location"
              value={
                usageBooking.branch_name || "—"
              }
            />

            <InfoItem
              label="Mode"
              value={
                usageBooking.mode === "home"
                  ? "Home service"
                  : "In-salon"
              }
            />

            <InfoItem
              label="Status"
              value={capitalize(
                usageBooking.status
              )}
            />

            <InfoItem
              label="Customer total"
              value={`AED ${Number(
                usageBooking.total_aed || 0
              ).toFixed(2)}`}
            />
          </div>
        </div>
      )}
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

function InfoCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
            <Icon className="h-5 w-5 text-gray-500" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {title}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100 px-6">
        {children}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col justify-between gap-2 py-4 sm:flex-row sm:items-start">
      <span className="text-sm text-gray-500">
        {label}
      </span>

      <span
        className={`max-w-[70%] break-all text-right text-sm font-medium text-gray-900 ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-gray-900">
        {value}
      </p>
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
      {capitalize(status)}
    </span>
  );
}

function capitalize(value: string) {
  return (
    value.charAt(0).toUpperCase() +
    value.slice(1).replace(/_/g, " ")
  );
}