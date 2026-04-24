// app/salon/gifts/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { Loading } from "@/app/components/ui/Loading";
import { Badge } from "@/app/components/ui/Badge";

type GiftDetail = {
  id: string;
  code: string;
  amount_aed: number;
  subtotal_aed: number;
  gift_fee_aed: number;
  total_aed: number;
  currency: string;
  status: "active" | "redeemed" | "expired" | "cancelled";
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

const STATUS_VARIANT: Record<string, "success" | "danger" | "gray" | "warning"> = {
  active: "success",
  redeemed: "gray",
  expired: "warning",
  cancelled: "danger",
};

export default function GiftDetailPage() {
  const params = useParams();
  const giftId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [gift, setGift] = useState<GiftDetail | null>(null);
  const [usageBooking, setUsageBooking] = useState<UsageBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadGift() {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();

      const res = await fetch(`${API_BASE}/dashboard/salon/gifts/${giftId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load gift");
      }

      setGift(data.gift);
      setUsageBooking(data.usage_booking || null);
    } catch (e: any) {
      setError(e.message || "Failed to load gift");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGift();
  }, [giftId]);

  if (loading) return <Loading size="lg" />;

  if (error || !gift) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-semibold">{error || "Gift not found"}</p>
          <Link href="/salon/gifts" className="mt-4 inline-block text-pink-500 hover:underline">
            ← Back to gifts
          </Link>
        </div>
      </div>
    );
  }

  const senderDisplay = gift.sender_name || gift.sender_user_name || "-";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Link
        href="/salon/gifts"
        className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
      >
        ← Back to gifts
      </Link>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Gift Details</h1>
              <Badge variant={STATUS_VARIANT[gift.status] || "gray"}>
                {gift.status}
              </Badge>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              ID: <span className="font-mono">{gift.id}</span>
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Code: <span className="font-mono font-semibold text-gray-800">{gift.code}</span>
            </p>
          </div>

          <div className="text-left md:text-right">
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-3xl font-bold text-emerald-600">
              AED {Number(gift.total_aed || 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-6">
          <MiniStat title="Gift Amount" value={`AED ${Number(gift.amount_aed || 0).toFixed(2)}`} />
          <MiniStat title="Subtotal" value={`AED ${Number(gift.subtotal_aed || 0).toFixed(2)}`} />
          <MiniStat title="Gift Fee" value={`AED ${Number(gift.gift_fee_aed || 0).toFixed(2)}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard title="Sender">
          <InfoRow label="Display Name" value={senderDisplay} />
          <InfoRow label="Account Name" value={gift.sender_user_name || "-"} />
          <InfoRow label="Phone" value={gift.sender_phone || "-"} />
          <InfoRow label="Email" value={gift.sender_email || "-"} />
        </InfoCard>

        <InfoCard title="Recipient">
          <InfoRow label="Phone" value={gift.recipient_phone || "-"} />
          <InfoRow label="Seen At" value={gift.seen_at ? formatDate(gift.seen_at) : "-"} />
          <InfoRow
            label="Sender Rewarded"
            value={gift.sender_seen_rewarded ? "Yes" : "No"}
          />
        </InfoCard>

        <InfoCard title="Gift Info">
          <InfoRow label="Salon" value={gift.salon_name || "Glowee Credit"} />
          <InfoRow label="Theme" value={gift.theme_id || "-"} />
          <InfoRow label="Currency" value={gift.currency || "AED"} />
        </InfoCard>

        <InfoCard title="Timeline">
          <InfoRow label="Created" value={gift.created_at ? formatDate(gift.created_at) : "-"} />
          <InfoRow label="Expires" value={gift.expires_at ? formatDate(gift.expires_at) : "-"} />
          <InfoRow label="Redeemed" value={gift.redeemed_at ? formatDate(gift.redeemed_at) : "-"} />
        </InfoCard>
      </div>

      <InfoCard title="Message">
        {gift.message ? (
          <p className="text-gray-700 whitespace-pre-wrap">{gift.message}</p>
        ) : (
          <p className="text-gray-400">No message</p>
        )}
      </InfoCard>

      <InfoCard title="Usage Tracking">
  {usageBooking ? (
    <>
      <InfoRow label="Booking ID" value={usageBooking.id} />

      <InfoRow
        label="Booking Status"
        value={usageBooking.status}
      />

      <InfoRow
        label="Mode"
        value={usageBooking.mode}
      />

      <InfoRow
        label="Salon"
        value={usageBooking.salon_name || "-"}
      />

      <InfoRow
        label="Branch"
        value={usageBooking.branch_name || "-"}
      />

      <InfoRow
        label="Scheduled At"
        value={
          usageBooking.scheduled_at
            ? formatDate(usageBooking.scheduled_at)
            : "-"
        }
      />

      <InfoRow
        label="Booking Total"
        value={`AED ${Number(
          usageBooking.total_aed || 0
        ).toFixed(2)}`}
      />
    </>
  ) : (
    <p className="text-sm text-gray-400">
      Gift has not been used in a booking yet.
    </p>
  )}
</InfoCard>
    </div>
  );
}

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 border p-4">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right break-all">
        {value}
      </span>
    </div>
  );
}