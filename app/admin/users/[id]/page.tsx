// app/admin/users/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Eye,
  MapPin,
  ShieldCheck,
  UserCheck,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { api, userApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type UserDetail = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  wallet_balance_aed: number;
  is_active: boolean;
  is_blocked: boolean;
  created_at: string;
  total_bookings: number;
  total_spent_aed: number;
  last_booking_at?: string | null;
};

type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

type Booking = {
  id: string;
  scheduled_at: string;
  mode: "in_salon" | "home";
  status: BookingStatus;
  total_aed: number;
  salon_name: string;
  branch_name?: string | null;
  created_at: string;
};

export default function UserDetailPage() {
  const params = useParams();

  const userId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [user, setUser] = useState<UserDetail | null>(
    null
  );

  const [bookings, setBookings] = useState<Booking[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get(
        `/dashboard/admin/users/${userId}`
      );

      setUser(data.user || null);

      setBookings(
        Array.isArray(data.bookings)
          ? data.bookings
          : []
      );
    } catch (e: any) {
      setError(
        e?.message || "Failed to load user"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleToggleBlock() {
    if (!user) return;

    const nextBlocked = !user.is_blocked;

    const confirmed = confirm(
      `${nextBlocked ? "Block" : "Unblock"} "${user.name}"?\n\n` +
        `${
          nextBlocked
            ? "This will restrict the user's access to Glowee."
            : "This will restore the user's access."
        }`
    );

    if (!confirmed) return;

    setToggling(true);

    try {
      await userApi.toggleBlock(userId);

      setUser((current) =>
        current
          ? {
              ...current,
              is_blocked: nextBlocked,
            }
          : current
      );

      toast.success(
        nextBlocked
          ? "User blocked"
          : "User unblocked"
      );
    } catch (e: any) {
      toast.error(
        e?.message ||
          "Failed to update user access"
      );
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500" />

          <p className="mt-3 text-sm text-gray-500">
            Loading user...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-700">
            {error || "User not found"}
          </p>

          <Link
            href="/admin/users"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Back */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </Link>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary-600">
            User details
          </p>

          <div className="mt-2 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-50 text-lg font-semibold text-primary-700">
              {getInitials(user.name)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                  {user.name}
                </h1>

                <UserStatus user={user} />
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {user.phone}
                {user.email
                  ? ` • ${user.email}`
                  : ""}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleBlock}
          disabled={toggling}
          className={
            user.is_blocked
              ? "inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
              : "inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          }
        >
          {user.is_blocked ? (
            <ShieldCheck className="h-4 w-4" />
          ) : (
            <Ban className="h-4 w-4" />
          )}

          {toggling
            ? "Updating..."
            : user.is_blocked
            ? "Unblock user"
            : "Block user"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total bookings"
          value={String(user.total_bookings || 0)}
          icon={CalendarDays}
        />

        <SummaryCard
          label="Total spent"
          value={`AED ${Number(
            user.total_spent_aed || 0
          ).toFixed(2)}`}
          icon={WalletCards}
        />

        <SummaryCard
          label="Wallet balance"
          value={`AED ${Number(
            user.wallet_balance_aed || 0
          ).toFixed(2)}`}
          icon={WalletCards}
        />

        <SummaryCard
          label="Joined"
          value={
            user.created_at
              ? formatDate(user.created_at)
              : "—"
          }
          icon={UserCheck}
        />
      </div>

      {/* Account info */}
      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900">
            Account information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Customer account details and recent activity.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
          <InfoItem
            label="Phone"
            value={user.phone || "—"}
          />

          <InfoItem
            label="Email"
            value={user.email || "No email"}
          />

          <InfoItem
            label="Last booking"
            value={
              user.last_booking_at
                ? new Date(
                    user.last_booking_at
                  ).toLocaleString()
                : "No bookings yet"
            }
          />
        </div>
      </div>

      {/* Booking history */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Booking history
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Recent bookings made by this customer.
            </p>
          </div>

          {bookings.length > 0 && (
            <span className="text-sm text-gray-400">
              {bookings.length} booking
              {bookings.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {bookings.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <CalendarDays className="h-6 w-6 text-gray-400" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-gray-900">
              No bookings yet
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              This customer has not made any bookings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/70 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">
                    Business
                  </th>

                  <th className="px-5 py-3 text-left font-medium">
                    Appointment
                  </th>

                  <th className="px-5 py-3 text-left font-medium">
                    Mode
                  </th>

                  <th className="px-5 py-3 text-left font-medium">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left font-medium">
                    Total
                  </th>

                  <th className="px-5 py-3 text-right font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="transition hover:bg-gray-50/60"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {booking.salon_name ||
                          "Business"}
                      </p>

                      {booking.branch_name && (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {booking.branch_name}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      <p>
                        {new Date(
                          booking.scheduled_at
                        ).toLocaleDateString()}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-400">
                        {new Date(
                          booking.scheduled_at
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <ModeBadge
                        mode={booking.mode}
                      />
                    </td>

                    <td className="px-5 py-4">
                      <BookingStatusBadge
                        status={booking.status}
                      />
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-900">
                      AED{" "}
                      {Number(
                        booking.total_aed || 0
                      ).toFixed(2)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

function UserStatus({
  user,
}: {
  user: UserDetail;
}) {
  if (user.is_blocked) {
    return (
      <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
        Blocked
      </span>
    );
  }

  if (user.is_active) {
    return (
      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
      Inactive
    </span>
  );
}

function ModeBadge({
  mode,
}: {
  mode: Booking["mode"];
}) {
  return (
    <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
      {mode === "home"
        ? "Home service"
        : "In-salon"}
    </span>
  );
}

function BookingStatusBadge({
  status,
}: {
  status: BookingStatus;
}) {
  const classes: Record<
    BookingStatus,
    string
  > = {
    pending:
      "border-amber-200 bg-amber-50 text-amber-700",
    confirmed:
      "border-blue-200 bg-blue-50 text-blue-700",
    completed:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    cancelled:
      "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${classes[status]}`}
    >
      {status.charAt(0).toUpperCase() +
        status.slice(1)}
    </span>
  );
}

function getInitials(name: string) {
  return (name || "U")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}