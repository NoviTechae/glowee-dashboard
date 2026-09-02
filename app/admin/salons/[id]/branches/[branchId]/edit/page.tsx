// app/admin/salons/[id]/branches/[branchId]/edit/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Home,
  MapPin,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import LocationPicker from "@/app/components/LocationPicker";

type BranchForm = {
  id: string;
  name: string;
  country?: string | null;
  city: string;
  area: string;
  address_line?: string | null;
  supports_home_services?: boolean;
  is_active?: boolean;
  lat?: number | null;
  lng?: number | null;
};

export default function EditLocationPage() {
  const params = useParams();
  const router = useRouter();

  const salonId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const branchId = Array.isArray(params.branchId)
    ? params.branchId[0]
    : (params.branchId as string);

  const [form, setForm] = useState<BranchForm | null>(null);
  const [original, setOriginal] = useState<BranchForm | null>(null);

  const [locOpen, setLocOpen] = useState(false);
  const [mapAddress, setMapAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!branchId) return;

      try {
        setLoading(true);
        setError("");

        const data = await api.get(
          `/dashboard/admin/branches/${branchId}`
        );

        const branch = data.branch as BranchForm;

        setForm(branch);
        setOriginal(branch);
      } catch (e: any) {
        setError(
          e?.message || "Failed to load location"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [branchId]);

  const canSave = useMemo(() => {
    if (!form) return false;

    return (
      form.name.trim().length >= 2 &&
      form.city.trim().length >= 2 &&
      form.area.trim().length >= 2 &&
      form.lat != null &&
      form.lng != null
    );
  }, [form]);

  const hasChanges = useMemo(() => {
    if (!form || !original) return false;

    return (
      form.name.trim() !== original.name.trim() ||
      form.city.trim() !== original.city.trim() ||
      form.area.trim() !== original.area.trim() ||
      (form.address_line || "").trim() !==
        (original.address_line || "").trim() ||
      Number(form.lat) !== Number(original.lat) ||
      Number(form.lng) !== Number(original.lng) ||
      Boolean(form.supports_home_services) !==
        Boolean(original.supports_home_services) ||
      Boolean(form.is_active) !==
        Boolean(original.is_active)
    );
  }, [form, original]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();

    if (!form) return;

    setError("");

    if (form.name.trim().length < 2) {
      setError(
        "Location name must contain at least 2 characters."
      );
      return;
    }

    if (form.city.trim().length < 2) {
      setError("Please enter a valid city.");
      return;
    }

    if (form.area.trim().length < 2) {
      setError("Please enter a valid area.");
      return;
    }

    if (form.lat == null || form.lng == null) {
      setError("Please select a location on the map.");
      return;
    }

    try {
      setSaving(true);

      await api.put(
        `/dashboard/admin/branches/${branchId}`,
        {
          name: form.name.trim(),
          country:
            form.country?.trim() ||
            "United Arab Emirates",
          city: form.city.trim(),
          area: form.area.trim(),
          address_line:
            form.address_line?.trim() || null,
          lat: Number(form.lat),
          lng: Number(form.lng),
          supports_home_services:
            Boolean(form.supports_home_services),
          is_active: Boolean(form.is_active),
        }
      );

      toast.success("Location updated");

      router.push(`/admin/salons/${salonId}`);
      router.refresh();
    } catch (e: any) {
      const message =
        e?.message || "Failed to update location";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500" />

          <p className="mt-3 text-sm text-gray-500">
            Loading location...
          </p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-700">
            {error || "Location not found"}
          </p>

          <Link
            href={`/admin/salons/${salonId}`}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to business
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Back */}
      <Link
        href={`/admin/salons/${salonId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to business
      </Link>

      {/* Header */}
      <div>
        <p className="text-sm font-medium text-primary-600">
          Business location
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
          Edit location
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Update location information and service
          availability.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={onSave}
        className="space-y-6"
      >
        {/* Information */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900">
              Location information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update the name and address associated with
              this location.
            </p>
          </div>

          <div className="space-y-5 p-6">
            <Field
              label="Location name"
              required
            >
              <input
                value={form.name}
                onChange={(e) => {
                  setForm({
                    ...form,
                    name: e.target.value,
                  });
                  setError("");
                }}
                className={inputClass}
                placeholder="e.g. Al Ain"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="City" required>
                <input
                  value={form.city}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      city: e.target.value,
                    });
                    setError("");
                  }}
                  className={inputClass}
                  placeholder="Al Ain"
                />
              </Field>

              <Field label="Area" required>
                <input
                  value={form.area}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      area: e.target.value,
                    });
                    setError("");
                  }}
                  className={inputClass}
                  placeholder="Al Jimi"
                />
              </Field>
            </div>

            <Field
              label="Address line"
              hint="Optional"
            >
              <input
                value={form.address_line || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address_line: e.target.value,
                  })
                }
                className={inputClass}
                placeholder="Building, street, floor or unit"
              />
            </Field>
          </div>
        </div>

        {/* Map */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900">
              Map location
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update the exact GPS location used by
              Glowee.
            </p>
          </div>

          <div className="p-6">
            {form.lat != null &&
            form.lng != null ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Location selected
                      </p>

                      {mapAddress && (
                        <p className="mt-1 text-sm text-gray-600">
                          {mapAddress}
                        </p>
                      )}

                      {!mapAddress &&
                        form.address_line && (
                          <p className="mt-1 text-sm text-gray-600">
                            {form.address_line}
                          </p>
                        )}

                      <p className="mt-2 text-xs text-gray-500">
                        {Number(form.lat).toFixed(6)},{" "}
                        {Number(form.lng).toFixed(6)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setLocOpen(true)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <MapPin className="h-4 w-4" />
                    Change location
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setLocOpen(true)}
                className="flex min-h-[170px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 px-6 text-center transition hover:border-primary-300 hover:bg-primary-50/30"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
                  <MapPin className="h-5 w-5 text-primary-600" />
                </div>

                <p className="mt-3 text-sm font-semibold text-gray-900">
                  Pick location on map
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Select the GPS coordinates for this
                  location.
                </p>
              </button>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900">
              Location settings
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Control service modes and location status.
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            <SettingRow
              icon={Home}
              title="Home services"
              description="Allow this location to support services delivered at the customer's address."
              enabled={Boolean(
                form.supports_home_services
              )}
              onToggle={() =>
                setForm({
                  ...form,
                  supports_home_services:
                    !form.supports_home_services,
                })
              }
            />

            <SettingRow
              icon={CheckCircle2}
              title="Active location"
              description="Active locations can be used by the business and shown in relevant Glowee experiences."
              enabled={Boolean(form.is_active)}
              onToggle={() =>
                setForm({
                  ...form,
                  is_active: !form.is_active,
                })
              }
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              router.push(
                `/admin/salons/${salonId}`
              )
            }
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              !canSave ||
              !hasChanges ||
              saving
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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
      </form>

      <LocationPicker
        open={locOpen}
        onClose={() => setLocOpen(false)}
        onConfirm={(loc) => {
          setForm({
            ...form,
            lat: loc.lat,
            lng: loc.lng,
          });

          setMapAddress(loc.address);
          setLocOpen(false);
          setError("");
        }}
      />
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100";

function Field({
  label,
  children,
  required = false,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-800">
          {label}

          {required && (
            <span className="ml-1 text-red-500">
              *
            </span>
          )}
        </span>

        {hint && (
          <span className="text-xs text-gray-400">
            {hint}
          </span>
        )}
      </div>

      {children}
    </label>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 px-6 py-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
          <Icon className="h-5 w-5 text-gray-500" />
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900">
            {title}
          </p>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-500">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
          enabled
            ? "bg-primary-600"
            : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}