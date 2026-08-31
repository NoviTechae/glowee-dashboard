"use client";

import { api } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Home,
  Info,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Save,
  Store,
} from "lucide-react";

type Branch = {
  id: string;
  name: string;
  city: string;
  area: string;
  address_line?: string | null;
  lat: number | string;
  lng: number | string;
  supports_home_services: boolean;
  is_active: boolean;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
};

type HourRow = {
  id?: string;
  branch_id?: string;
  day_of_week: number;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
};

type SalonType = "in_salon" | "home" | "both";

const days = [
  { d: 0, label: "Sunday" },
  { d: 1, label: "Monday" },
  { d: 2, label: "Tuesday" },
  { d: 3, label: "Wednesday" },
  { d: 4, label: "Thursday" },
  { d: 5, label: "Friday" },
  { d: 6, label: "Saturday" },
];

function normalizeHours(apiRows: HourRow[]): HourRow[] {
  const map = new Map<number, HourRow>();

  for (const row of apiRows || []) {
    map.set(row.day_of_week, row);
  }

  return days.map(({ d }) => {
    const row = map.get(d);

    if (row) {
      return { ...row };
    }

    return {
      day_of_week: d,
      is_closed: false,
      open_time: "09:00",
      close_time: "22:00",
    };
  });
}

export default function SalonBranchManagePage() {
  const router = useRouter();

  const params = useParams<{ branchId: string }>();
  const branchId = params.branchId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(
    null
  );

  const [branch, setBranch] = useState<Branch | null>(
    null
  );

  const [hours, setHours] = useState<HourRow[]>([]);

  const [salonType, setSalonType] =
    useState<SalonType | null>(null);

  useEffect(() => {
    async function load() {
      if (!branchId) return;

      try {
        setLoading(true);
        setErr(null);
        setSuccess(null);

        const [meJson, branchJson, hoursJson] =
          await Promise.all([
            api.get("/dashboard/salon/me"),
            api.get(
              `/dashboard/salon/branches/${branchId}`
            ),
            api.get(
              `/dashboard/salon/branches/${branchId}/hours`
            ),
          ]);

        setSalonType(
          meJson?.salon?.salon_type ?? null
        );

        setBranch(branchJson.branch || null);

        setHours(
          normalizeHours(hoursJson.data || [])
        );
      } catch (e: any) {
        setErr(
          e?.message ||
            "Failed to load location settings"
        );

        setBranch(null);
        setHours([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [branchId]);

  const isHomeOnly = salonType === "home";

  const canSave = useMemo(() => {
    if (!branch || saving) {
      return false;
    }

    if (!branch.name?.trim()) {
      return false;
    }

    if (!branch.city?.trim()) {
      return false;
    }

    if (!branch.area?.trim()) {
      return false;
    }

    if (
      String(branch.lat).trim() === "" ||
      !Number.isFinite(Number(branch.lat))
    ) {
      return false;
    }

    if (
      String(branch.lng).trim() === "" ||
      !Number.isFinite(Number(branch.lng))
    ) {
      return false;
    }

    const invalidHours = hours.some((row) => {
      if (row.is_closed) return false;

      if (!row.open_time || !row.close_time) {
        return true;
      }

      return row.open_time >= row.close_time;
    });

    return !invalidHours;
  }, [branch, hours, saving]);

  const pageTitle = isHomeOnly
    ? "Home service setup"
    : branch?.name || "Location";

  const pageSubtitle = isHomeOnly
    ? "Manage your service area, contact details and customer availability."
    : "Manage location details, contact information and working hours.";

  const detailsTitle = isHomeOnly
    ? "Service details"
    : "Location details";

  const nameLabel = isHomeOnly
    ? "Service name"
    : "Location name";

  const hoursTitle = isHomeOnly
    ? "Available hours"
    : "Working hours";

  function handleBack() {
    if (isHomeOnly) {
      router.push("/salon/profile");
      return;
    }

    router.push("/salon/branches");
  }

  function updateHour(
    dayOfWeek: number,
    patch: Partial<HourRow>
  ) {
    setHours((prev) =>
      prev.map((row) =>
        row.day_of_week === dayOfWeek
          ? { ...row, ...patch }
          : row
      )
    );
  }

  async function saveAll() {
    if (!branch) return;

    setErr(null);
    setSuccess(null);

    if (!branch.name.trim()) {
      setErr(
        isHomeOnly
          ? "Please enter a service name"
          : "Please enter a location name"
      );
      return;
    }

    if (!branch.city.trim()) {
      setErr("Please enter a city");
      return;
    }

    if (!branch.area.trim()) {
      setErr("Please enter an area");
      return;
    }

    if (
      !Number.isFinite(Number(branch.lat)) ||
      !Number.isFinite(Number(branch.lng))
    ) {
      setErr(
        "Latitude and longitude must be valid numbers"
      );
      return;
    }

    const invalidDay = hours.find(
      (row) =>
        !row.is_closed &&
        (!row.open_time ||
          !row.close_time ||
          row.open_time >= row.close_time)
    );

    if (invalidDay) {
      const dayName =
        days.find(
          (day) =>
            day.d === invalidDay.day_of_week
        )?.label || "Selected day";

      setErr(
        `${dayName}: closing time must be after opening time`
      );
      return;
    }

    try {
      setSaving(true);

      await api.put(
        `/dashboard/salon/branches/${branchId}`,
        {
          name: branch.name.trim(),
          city: branch.city.trim(),
          area: branch.area.trim(),
          address_line:
            branch.address_line?.trim() || null,
          lat: Number(branch.lat),
          lng: Number(branch.lng),
          supports_home_services: isHomeOnly
            ? true
            : !!branch.supports_home_services,
          is_active: !!branch.is_active,
          phone: branch.phone?.trim() || null,
          whatsapp:
            branch.whatsapp?.trim() || null,
          email: branch.email?.trim() || null,
          instagram:
            branch.instagram?.trim() || null,
        }
      );

      await api.put(
        `/dashboard/salon/branches/${branchId}/hours`,
        hours.map((row) => ({
          day_of_week: row.day_of_week,
          is_closed: !!row.is_closed,
          open_time: row.is_closed
            ? null
            : row.open_time || null,
          close_time: row.is_closed
            ? null
            : row.close_time || null,
        }))
      );

      setSuccess(
        isHomeOnly
          ? "Home service settings updated."
          : "Location updated."
      );
    } catch (e: any) {
      setErr(
        e?.message || "Failed to save changes"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-6 w-6 text-red-500" />

          <p className="mt-3 text-sm font-medium text-red-800">
            {err || "Location not found"}
          </p>

          <button
            type="button"
            onClick={handleBack}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary-600 transition hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7 p-6 lg:p-8">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />

          {isHomeOnly
            ? "Back to profile"
            : "Back to locations"}
        </button>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              {pageTitle}
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm text-gray-500">
              {pageSubtitle}
            </p>
          </div>

          <button
            type="button"
            disabled={!canSave}
            onClick={saveAll}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {err && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

          <div>
            <p className="text-sm font-medium text-red-800">
              Something went wrong
            </p>

            <p className="mt-0.5 text-sm text-red-600">
              {err}
            </p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />

          <p className="text-sm font-medium text-emerald-700">
            {success}
          </p>
        </div>
      )}

      {/* Details */}
      <section className="rounded-2xl border border-gray-200 bg-white">
        <SectionHeader
          icon={
            isHomeOnly ? (
              <Home className="h-5 w-5" />
            ) : (
              <MapPin className="h-5 w-5" />
            )
          }
          title={detailsTitle}
          description={
            isHomeOnly
              ? "The main information used for your home-service setup."
              : "Customer-facing information for this business location."
          }
        />

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <Field
            label={nameLabel}
            required
          >
            <input
              value={branch.name}
              onChange={(e) =>
                setBranch({
                  ...branch,
                  name: e.target.value,
                })
              }
              placeholder={
                isHomeOnly
                  ? "e.g. Glow Beauty Home Service"
                  : "e.g. Al Ain Mall"
              }
              className="input-field"
            />
          </Field>

          <Field label="Address">
            <input
              value={branch.address_line ?? ""}
              onChange={(e) =>
                setBranch({
                  ...branch,
                  address_line:
                    e.target.value || null,
                })
              }
              placeholder={
                isHomeOnly
                  ? "Optional base address or coverage note"
                  : "Building, street or landmark"
              }
              className="input-field"
            />
          </Field>

          <Field
            label="City"
            required
          >
            <input
              value={branch.city}
              onChange={(e) =>
                setBranch({
                  ...branch,
                  city: e.target.value,
                })
              }
              placeholder="Al Ain"
              className="input-field"
            />
          </Field>

          <Field
            label={
              isHomeOnly ? "Service area" : "Area"
            }
            required
          >
            <input
              value={branch.area}
              onChange={(e) =>
                setBranch({
                  ...branch,
                  area: e.target.value,
                })
              }
              placeholder={
                isHomeOnly
                  ? "e.g. Al Ain"
                  : "e.g. Al Jimi"
              }
              className="input-field"
            />
          </Field>

          <Field
            label="Latitude"
            required
            hint="Used by Glowee for location-based services."
          >
            <input
              inputMode="decimal"
              value={String(branch.lat)}
              onChange={(e) =>
                setBranch({
                  ...branch,
                  lat: e.target.value,
                })
              }
              placeholder="24.2075"
              className="input-field"
            />
          </Field>

          <Field
            label="Longitude"
            required
            hint="Used by Glowee for location-based services."
          >
            <input
              inputMode="decimal"
              value={String(branch.lng)}
              onChange={(e) =>
                setBranch({
                  ...branch,
                  lng: e.target.value,
                })
              }
              placeholder="55.7447"
              className="input-field"
            />
          </Field>
        </div>

        {/* Toggles */}
        <div className="space-y-3 border-t border-gray-100 p-6">
          {!isHomeOnly && (
            <SettingToggle
              icon={<Home className="h-5 w-5" />}
              title="Home services"
              description="Allow customers to book services at their own address from this location."
              checked={
                !!branch.supports_home_services
              }
              onChange={(checked) =>
                setBranch({
                  ...branch,
                  supports_home_services:
                    checked,
                })
              }
            />
          )}

          {isHomeOnly && (
            <div className="flex items-start gap-3 rounded-xl bg-primary-50 px-4 py-3.5">
              <Home className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />

              <div>
                <p className="text-sm font-medium text-primary-800">
                  Home service enabled
                </p>

                <p className="mt-0.5 text-xs leading-5 text-primary-600">
                  Customers can book this business
                  for at-home visits.
                </p>
              </div>
            </div>
          )}

          <SettingToggle
            icon={<Store className="h-5 w-5" />}
            title={
              isHomeOnly
                ? "Home service active"
                : "Location active"
            }
            description={
              isHomeOnly
                ? "When inactive, customers cannot book this home-service business."
                : "When inactive, this location will not be available to customers."
            }
            checked={!!branch.is_active}
            onChange={(checked) =>
              setBranch({
                ...branch,
                is_active: checked,
              })
            }
          />
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-2xl border border-gray-200 bg-white">
        <SectionHeader
          icon={<Phone className="h-5 w-5" />}
          title="Contact information"
          description="Contact details customers may use for this location."
        />

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <Field label="Phone">
            <div className="relative">
              <Phone className="field-icon" />

              <input
                type="tel"
                value={branch.phone ?? ""}
                onChange={(e) =>
                  setBranch({
                    ...branch,
                    phone:
                      e.target.value || null,
                  })
                }
                placeholder="+971..."
                className="input-field input-with-icon"
              />
            </div>
          </Field>

          <Field label="WhatsApp">
            <div className="relative">
              <Phone className="field-icon" />

              <input
                type="tel"
                value={branch.whatsapp ?? ""}
                onChange={(e) =>
                  setBranch({
                    ...branch,
                    whatsapp:
                      e.target.value || null,
                  })
                }
                placeholder="+971..."
                className="input-field input-with-icon"
              />
            </div>
          </Field>

          <Field label="Email">
            <div className="relative">
              <Mail className="field-icon" />

              <input
                type="email"
                value={branch.email ?? ""}
                onChange={(e) =>
                  setBranch({
                    ...branch,
                    email:
                      e.target.value || null,
                  })
                }
                placeholder="hello@business.com"
                className="input-field input-with-icon"
              />
            </div>
          </Field>

          <Field label="Instagram">
            <div className="relative">
              <Instagram className="field-icon" />

              <input
                type="text"
                value={branch.instagram ?? ""}
                onChange={(e) =>
                  setBranch({
                    ...branch,
                    instagram:
                      e.target.value || null,
                  })
                }
                placeholder="@yourbusiness"
                className="input-field input-with-icon"
              />
            </div>
          </Field>
        </div>
      </section>

      {/* Hours */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <SectionHeader
          icon={<Clock3 className="h-5 w-5" />}
          title={hoursTitle}
          description={
            isHomeOnly
              ? "Set when customers can book home-service appointments."
              : "Set when customers can book appointments at this location."
          }
        />

        <div className="divide-y divide-gray-100">
          {hours.map((row) => {
            const day =
              days.find(
                (item) =>
                  item.d === row.day_of_week
              )?.label ||
              `Day ${row.day_of_week}`;

            return (
              <div
                key={row.day_of_week}
                className="grid gap-4 px-6 py-4 sm:grid-cols-[150px_120px_1fr] sm:items-center"
              >
                <p className="text-sm font-medium text-gray-900">
                  {day}
                </p>

                <label className="inline-flex w-fit cursor-pointer items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!row.is_closed}
                    onClick={() => {
                      const nextClosed =
                        !row.is_closed;

                      updateHour(
                        row.day_of_week,
                        {
                          is_closed:
                            nextClosed,
                          open_time:
                            nextClosed
                              ? null
                              : row.open_time ||
                                "09:00",
                          close_time:
                            nextClosed
                              ? null
                              : row.close_time ||
                                "22:00",
                        }
                      );
                    }}
                    className={`relative h-5 w-9 rounded-full transition ${
                      !row.is_closed
                        ? "bg-primary-600"
                        : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                        !row.is_closed
                          ? "left-[18px]"
                          : "left-0.5"
                      }`}
                    />
                  </button>

                  <span
                    className={`text-xs font-medium ${
                      row.is_closed
                        ? "text-gray-400"
                        : "text-gray-600"
                    }`}
                  >
                    {row.is_closed
                      ? "Closed"
                      : "Open"}
                  </span>
                </label>

                {row.is_closed ? (
                  <p className="text-sm text-gray-400">
                    Not available
                  </p>
                ) : (
                  <div className="flex max-w-sm items-center gap-3">
                    <input
                      type="time"
                      value={
                        row.open_time ?? ""
                      }
                      onChange={(e) =>
                        updateHour(
                          row.day_of_week,
                          {
                            open_time:
                              e.target.value,
                          }
                        )
                      }
                      className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                    />

                    <span className="text-xs text-gray-400">
                      to
                    </span>

                    <input
                      type="time"
                      value={
                        row.close_time ?? ""
                      }
                      onChange={(e) =>
                        updateHour(
                          row.day_of_week,
                          {
                            close_time:
                              e.target.value,
                          }
                        )
                      }
                      className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Info */}
      <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />

        <div>
          <p className="text-sm font-medium text-gray-800">
            {isHomeOnly
              ? "Home-service setup"
              : "Location settings"}
          </p>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            {isHomeOnly
              ? "Glowee uses an internal location record for home-service businesses so services, team members, availability and bookings continue to work through the same system."
              : "Changes to availability, contact details and working hours are reflected in the booking experience for this location."}
          </p>
        </div>
      </div>

      {/* Local utility classes */}
      <style jsx>{`
        .input-field {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(229 231 235);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: rgb(55 65 81);
          outline: none;
          transition: 150ms;
        }

        .input-field:focus {
          border-color: rgb(216 180 254);
          box-shadow: 0 0 0 2px rgb(243 232 255);
        }

        .input-with-icon {
          padding-left: 2.5rem;
        }

        .field-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          width: 1rem;
          height: 1rem;
          transform: translateY(-50%);
          color: rgb(156 163 175);
          pointer-events: none;
        }
      `}</style>
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

function Field({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}

      {hint && (
        <p className="mt-1.5 text-xs text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
}

function SettingToggle({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 text-gray-400">
          {icon}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-900">
            {title}
          </p>

          <p className="mt-0.5 text-xs leading-5 text-gray-500">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? "bg-primary-600"
            : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked
              ? "left-[22px]"
              : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}