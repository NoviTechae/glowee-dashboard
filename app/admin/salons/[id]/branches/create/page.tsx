// app/admin/salons/[id]/branches/create/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Home,
  MapPin,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import LocationPicker from "@/app/components/LocationPicker";

export default function CreateLocationPage() {
  const params = useParams();
  const router = useRouter();

  const salonId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [addressLine, setAddressLine] = useState("");

  const [locOpen, setLocOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [supportsHomeServices, setSupportsHomeServices] =
    useState(false);
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      city.trim().length >= 2 &&
      area.trim().length >= 2 &&
      lat !== null &&
      lng !== null
    );
  }, [name, city, area, lat, lng]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!salonId) {
      setError("Missing business ID.");
      return;
    }

    if (name.trim().length < 2) {
      setError(
        "Location name must contain at least 2 characters."
      );
      return;
    }

    if (city.trim().length < 2) {
      setError("Please enter a valid city.");
      return;
    }

    if (area.trim().length < 2) {
      setError("Please enter a valid area.");
      return;
    }

    if (lat === null || lng === null) {
      setError("Please select the location on the map.");
      return;
    }

    setLoading(true);

    try {
      await api.post(
        `/dashboard/admin/salons/${salonId}/branches`,
        {
          name: name.trim(),
          country: "United Arab Emirates",
          city: city.trim(),
          area: area.trim(),
          address_line:
            addressLine.trim() || null,
          lat,
          lng,
          supports_home_services:
            supportsHomeServices,
          is_active: isActive,
        }
      );

      toast.success("Location created");

      router.push(`/admin/salons/${salonId}`);
      router.refresh();
    } catch (e: any) {
      const message =
        e?.message || "Failed to create location";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/admin/salons/${salonId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to business
      </Link>

      <div>
        <p className="text-sm font-medium text-primary-600">
          Business location
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
          Add location
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Add a physical location and configure how it
          operates on Glowee.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-6"
      >
        {/* Basic information */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900">
              Location information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Enter the name and address customers will
              associate with this location.
            </p>
          </div>

          <div className="space-y-5 p-6">
            <Field
              label="Location name"
              required
            >
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="e.g. Al Ain"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="City" required>
                <input
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setError("");
                  }}
                  placeholder="Al Ain"
                  className={inputClass}
                />
              </Field>

              <Field label="Area" required>
                <input
                  value={area}
                  onChange={(e) => {
                    setArea(e.target.value);
                    setError("");
                  }}
                  placeholder="Al Jimi"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field
              label="Address line"
              hint="Optional"
            >
              <input
                value={addressLine}
                onChange={(e) =>
                  setAddressLine(e.target.value)
                }
                placeholder="Building, street, floor or unit"
                className={inputClass}
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
              Select the exact location used by Glowee for
              discovery and directions.
            </p>
          </div>

          <div className="p-6">
            {lat !== null && lng !== null ? (
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

                      {address && (
                        <p className="mt-1 text-sm text-gray-600">
                          {address}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-gray-500">
                        {lat.toFixed(6)},{" "}
                        {lng.toFixed(6)}
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

                <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">
                  Choose the exact GPS location so Glowee
                  can use it for location-based experiences.
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
              Configure service availability and location
              status.
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            <SettingRow
              icon={Home}
              title="Home services"
              description="Allow this location to support services delivered at the customer's address."
              enabled={supportsHomeServices}
              onToggle={() =>
                setSupportsHomeServices(
                  (current) => !current
                )
              }
            />

            <SettingRow
              icon={CheckCircle2}
              title="Active location"
              description="Active locations can be used by the business and shown in relevant Glowee experiences."
              enabled={isActive}
              onToggle={() =>
                setIsActive(
                  (current) => !current
                )
              }
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button
            type="button"
            disabled={loading}
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
            disabled={!canSubmit || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add location
              </>
            )}
          </button>
        </div>
      </form>

      <LocationPicker
        open={locOpen}
        onClose={() => setLocOpen(false)}
        onConfirm={(loc) => {
          setLat(loc.lat);
          setLng(loc.lng);
          setAddress(loc.address);
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