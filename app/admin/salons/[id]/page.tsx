// app/admin/salons/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Edit3,
  Home,
  MapPin,
  Plus,
  Store,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";

type Branch = {
  id: string;
  name: string;
  city: string;
  area: string;
  supports_home_services: boolean;
  is_active: boolean;
};

type Salon = {
  id: string;
  name: string;
  salon_type: "in_salon" | "home" | "both";
};

export default function SalonDetailsPage() {
  const params = useParams<{ id: string }>();
  const salonId = String(params.id);

  const [salon, setSalon] = useState<Salon | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const [salonData, branchData] = await Promise.all([
        api.get(`/dashboard/admin/salons/${salonId}`),
        api.get(`/dashboard/admin/salons/${salonId}/branches`),
      ]);

      setSalon(salonData.salon || null);
      setBranches(
        Array.isArray(branchData.data) ? branchData.data : []
      );
    } catch (e: any) {
      const message =
        e?.message || "Failed to load salon";

      setError(message);
      setSalon(null);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId]);

  async function handleDeleteBranch(
    branchId: string,
    branchName: string
  ) {
    const confirmed = confirm(
      `Delete "${branchName}"?\n\n` +
        `This location will be permanently deleted and the action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/dashboard/admin/branches/${branchId}`
      );

      setBranches((current) =>
        current.filter(
          (branch) => branch.id !== branchId
        )
      );

      toast.success("Location deleted");
    } catch (e: any) {
      toast.error(
        e?.message || "Failed to delete location"
      );
    }
  }

  const isHomeOnly = salon?.salon_type === "home";
  const activeLocations = branches.filter(
    (branch) => branch.is_active
  ).length;

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500" />
          <p className="mt-3 text-sm text-gray-500">
            Loading business details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Back */}
      <Link
        href="/admin/salons"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to salons
      </Link>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}

      {salon && (
        <>
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-primary-600">
                Salon details
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                  {salon.name}
                </h1>

                <TypeBadge type={salon.salon_type} />
              </div>

              <p className="mt-2 text-sm text-gray-500">
                Manage this business and its service locations.
              </p>
            </div>

            <Link
              href={`/admin/salons/${salonId}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <Edit3 className="h-4 w-4" />
              Edit business
            </Link>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard
              label="Business type"
              value={getTypeLabel(salon.salon_type)}
              icon={Store}
            />

            <SummaryCard
              label="Locations"
              value={
                isHomeOnly
                  ? "Not required"
                  : String(branches.length)
              }
              icon={Building2}
            />

            <SummaryCard
              label="Active locations"
              value={
                isHomeOnly
                  ? "—"
                  : String(activeLocations)
              }
              icon={CheckCircle2}
            />
          </div>

          {/* Home only */}
          {isHomeOnly ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                  <Home className="h-5 w-5 text-primary-600" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Home-service business
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                    This business operates through home
                    services only, so a physical salon
                    location is not required.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Locations header */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Locations
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Manage the physical locations available
                    for this business.
                  </p>
                </div>

                <Link
                  href={`/admin/salons/${salonId}/branches/create`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4" />
                  Add location
                </Link>
              </div>

              {/* Locations */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                {branches.length === 0 ? (
                  <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                      <MapPin className="h-6 w-6 text-gray-400" />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-gray-900">
                      No locations yet
                    </h3>

                    <p className="mt-1 max-w-sm text-sm text-gray-500">
                      Add the first physical location for this
                      business.
                    </p>

                    <Link
                      href={`/admin/salons/${salonId}/branches/create`}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add location
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="hidden border-b border-gray-100 bg-gray-50/70 px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 md:grid md:grid-cols-[1.5fr_1.5fr_1fr_1fr_auto] md:gap-4">
                      <span>Location</span>
                      <span>Area</span>
                      <span>Home service</span>
                      <span>Status</span>
                      <span className="text-right">
                        Actions
                      </span>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {branches.map((branch) => (
                        <div
                          key={branch.id}
                          className="grid gap-4 px-5 py-5 md:grid-cols-[1.5fr_1.5fr_1fr_1fr_auto] md:items-center"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                              <MapPin className="h-4 w-4 text-gray-500" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {branch.name}
                              </p>

                              <p className="mt-0.5 text-xs text-gray-400 md:hidden">
                                Location
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-gray-700">
                              {[branch.area, branch.city]
                                .filter(Boolean)
                                .join(", ") || "—"}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400 md:hidden">
                              Area
                            </p>
                          </div>

                          <div>
                            <HomeServiceBadge
                              supported={
                                branch.supports_home_services
                              }
                            />
                          </div>

                          <div>
                            <StatusBadge
                              active={branch.is_active}
                            />
                          </div>

                          <div className="flex items-center gap-2 md:justify-end">
                            <Link
                              href={`/admin/salons/${salonId}/branches/${branch.id}/edit`}
                              className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Edit
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteBranch(
                                  branch.id,
                                  branch.name
                                )
                              }
                              title="Delete location"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
                      {branches.length} location
                      {branches.length !== 1 ? "s" : ""}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </>
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

function TypeBadge({
  type,
}: {
  type: Salon["salon_type"];
}) {
  return (
    <span className="inline-flex rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
      {getTypeLabel(type)}
    </span>
  );
}

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={
        active
          ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
          : "inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600"
      }
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function HomeServiceBadge({
  supported,
}: {
  supported: boolean;
}) {
  return (
    <span
      className={
        supported
          ? "inline-flex rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700"
          : "inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600"
      }
    >
      {supported ? "Available" : "Not available"}
    </span>
  );
}

function getTypeLabel(
  type: Salon["salon_type"]
) {
  if (type === "home") return "Home service";
  if (type === "both")
    return "In-salon + home";

  return "In-salon";
}