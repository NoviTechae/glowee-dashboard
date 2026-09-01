// app/admin/salons/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  Mail,
  Phone,
  Plus,
  Search,
  Store,
  Trash2,
  UserCheck,
  UserRoundCheck,
} from "lucide-react";
import { toast } from "sonner";

import { api, salonApi } from "@/lib/api";
import { Salon } from "@/lib/types";
import { formatDate, getImageUrl } from "@/lib/utils";

type SalonRow = Salon & {
  setup_completed?: boolean;
  onboarding_completed?: boolean;
};

type StatusFilter = "all" | "active" | "inactive";
type SetupFilter = "all" | "complete" | "pending";

export default function SalonsPage() {
  const router = useRouter();

  const [salons, setSalons] = useState<SalonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");
  const [setupFilter, setSetupFilter] =
    useState<SetupFilter>("all");

  async function loadSalons() {
    try {
      setLoading(true);
      setError(null);

      // In-salon businesses + businesses that offer both modes.
      const response = await api.get(
        "/dashboard/admin/salons?type=salons_only"
      );

      setSalons(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (e: any) {
      const message =
        e?.message || "Failed to load salons";

      setError(message);
      setSalons([]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSalons();
  }, []);

  function isSetupDone(salon: SalonRow) {
    return (
      salon.setup_completed === true ||
      salon.onboarding_completed === true
    );
  }

  const filteredSalons = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return salons.filter((salon) => {
      const matchesSearch =
        !search ||
        salon.name?.toLowerCase().includes(search) ||
        salon.email?.toLowerCase().includes(search) ||
        salon.phone?.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && salon.is_active) ||
        (statusFilter === "inactive" && !salon.is_active);

      const setupDone = isSetupDone(salon);

      const matchesSetup =
        setupFilter === "all" ||
        (setupFilter === "complete" && setupDone) ||
        (setupFilter === "pending" && !setupDone);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSetup
      );
    });
  }, [salons, searchTerm, statusFilter, setupFilter]);

  const stats = useMemo(() => {
    const active = salons.filter(
      (salon) => salon.is_active
    ).length;

    const pendingSetup = salons.filter(
      (salon) => !isSetupDone(salon)
    ).length;

    return {
      total: salons.length,
      active,
      pendingSetup,
    };
  }, [salons]);

  async function handleToggleStatus(salon: SalonRow) {
    const nextActive = !salon.is_active;

    const confirmed = confirm(
      `${nextActive ? "Approve" : "Disable"} "${salon.name}"?\n\n` +
        `${
          nextActive
            ? "This will make the business active on Glowee."
            : "This will disable the business on Glowee."
        }`
    );

    if (!confirmed) return;

    try {
      await api.put(
        `/dashboard/admin/salons/${salon.id}`,
        {
          is_active: nextActive,
        }
      );

      setSalons((current) =>
        current.map((item) =>
          item.id === salon.id
            ? { ...item, is_active: nextActive }
            : item
        )
      );

      toast.success(
        nextActive
          ? "Business approved"
          : "Business disabled"
      );
    } catch (e: any) {
      toast.error(
        e?.message || "Failed to update status"
      );
    }
  }

  async function handleDelete(salon: SalonRow) {
    const confirmed = confirm(
      `Permanently delete "${salon.name}"?\n\n` +
        `This may delete related business data and cannot be undone.\n\n` +
        `Continue?`
    );

    if (!confirmed) return;

    try {
      await salonApi.delete(salon.id);

      setSalons((current) =>
        current.filter(
          (item) => item.id !== salon.id
        )
      );

      toast.success("Business deleted");
    } catch (e: any) {
      toast.error(
        e?.message || "Failed to delete business"
      );
    }
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setSetupFilter("all");
  }

  const hasFilters =
    searchTerm.trim() ||
    statusFilter !== "all" ||
    setupFilter !== "all";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary-600">
            Operations
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            Salons
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage in-salon beauty businesses and their
            Glowee access.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push("/admin/salons/create")
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add salon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total salons"
          value={stats.total}
          icon={Store}
        />

        <SummaryCard
          label="Active"
          value={stats.active}
          icon={CheckCircle2}
        />

        <SummaryCard
          label="Pending setup"
          value={stats.pendingSetup}
          icon={UserRoundCheck}
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              placeholder="Search salon, email or phone..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as StatusFilter
              )
            }
            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          >
            <option value="all">
              All statuses
            </option>
            <option value="active">Active</option>
            <option value="inactive">
              Inactive
            </option>
          </select>

          <select
            value={setupFilter}
            onChange={(e) =>
              setSetupFilter(
                e.target.value as SetupFilter
              )
            }
            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          >
            <option value="all">
              All setup statuses
            </option>
            <option value="complete">
              Setup complete
            </option>
            <option value="pending">
              Pending setup
            </option>
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500" />

              <p className="mt-3 text-sm text-gray-500">
                Loading salons...
              </p>
            </div>
          </div>
        ) : filteredSalons.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <Store className="h-6 w-6 text-gray-400" />
            </div>

            <h2 className="mt-4 text-sm font-semibold text-gray-900">
              {salons.length === 0
                ? "No salons yet"
                : "No salons found"}
            </h2>

            <p className="mt-1 max-w-sm text-sm text-gray-500">
              {salons.length === 0
                ? "Add your first salon and create its Glowee business account."
                : "Try changing your search or filters."}
            </p>

            {salons.length === 0 && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/admin/salons/create"
                  )
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                Add salon
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {filteredSalons.map((salon) => (
                <SalonItem
                  key={salon.id}
                  salon={salon}
                  setupDone={isSetupDone(salon)}
                  onView={() =>
                    router.push(
                      `/admin/salons/${salon.id}`
                    )
                  }
                  onToggle={() =>
                    handleToggleStatus(salon)
                  }
                  onDelete={() =>
                    handleDelete(salon)
                  }
                />
              ))}
            </div>

            <div className="border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
              Showing {filteredSalons.length} of{" "}
              {salons.length} salon
              {salons.length !== 1 ? "s" : ""}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SalonItem({
  salon,
  setupDone,
  onView,
  onToggle,
  onDelete,
}: {
  salon: SalonRow;
  setupDone: boolean;
  onView: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const logoSrc = getImageUrl(salon.logo_url);

  return (
    <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={salon.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-lg font-semibold text-gray-500">
              {salon.name
                ?.slice(0, 1)
                ?.toUpperCase() || "S"}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-gray-900">
              {salon.name}
            </h3>

            <StatusBadge active={salon.is_active} />

            <SetupBadge complete={setupDone} />

            {salon.salon_type === "both" && (
              <span className="inline-flex rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                In-salon + home
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
            {salon.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                {salon.email}
              </span>
            )}

            {salon.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                {salon.phone}
              </span>
            )}

            <span>
              Added {formatDate(salon.created_at)}
            </span>
          </div>

          {salon.about && (
            <p className="mt-3 max-w-3xl truncate text-sm text-gray-500">
              {salon.about}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-[72px] lg:pl-0">
        <button
          type="button"
          onClick={onToggle}
          className={
            salon.is_active
              ? "inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
              : "inline-flex h-9 items-center gap-2 rounded-lg bg-primary-600 px-3 text-xs font-medium text-white transition hover:bg-primary-700"
          }
        >
          <UserCheck className="h-3.5 w-3.5" />
          {salon.is_active
            ? "Disable"
            : "Approve"}
        </button>

        <button
          type="button"
          onClick={onView}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>

        <button
          type="button"
          onClick={onDelete}
          title="Delete salon"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
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
  value: number;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-semibold text-gray-900">
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

function SetupBadge({
  complete,
}: {
  complete: boolean;
}) {
  return (
    <span
      className={
        complete
          ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
          : "inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
      }
    >
      {complete
        ? "Setup complete"
        : "Pending setup"}
    </span>
  );
}