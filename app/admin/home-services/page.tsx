// app/admin/home-services/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  Home,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";

type HomeService = {
  id: string;
  name: string;
  salon_type: "home";
  is_active: boolean;
  created_at?: string;
  email?: string | null;
  phone?: string | null;
  about?: string | null;
};

type StatusFilter = "all" | "active" | "inactive";

export default function AdminHomeServicesPage() {
  const router = useRouter();

  const [businesses, setBusinesses] = useState<HomeService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/dashboard/admin/salons?type=home_only"
      );

      setBusinesses(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (e: any) {
      const message =
        e?.message || "Failed to load home services";

      setError(message);
      setBusinesses([]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredBusinesses = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return businesses.filter((business) => {
      const matchesSearch =
        !search ||
        business.name?.toLowerCase().includes(search) ||
        business.email?.toLowerCase().includes(search) ||
        business.phone?.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          business.is_active) ||
        (statusFilter === "inactive" &&
          !business.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [businesses, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const active = businesses.filter(
      (business) => business.is_active
    ).length;

    return {
      total: businesses.length,
      active,
      inactive: businesses.length - active,
    };
  }, [businesses]);

  async function handleToggleStatus(
    business: HomeService
  ) {
    const nextActive = !business.is_active;

    const confirmed = confirm(
      `${nextActive ? "Approve" : "Disable"} "${business.name}"?\n\n` +
        `${
          nextActive
            ? "This will make the business active on Glowee."
            : "This will disable the business on Glowee."
        }`
    );

    if (!confirmed) return;

    try {
      await api.put(
        `/dashboard/admin/salons/${business.id}`,
        {
          is_active: nextActive,
        }
      );

      setBusinesses((current) =>
        current.map((item) =>
          item.id === business.id
            ? {
                ...item,
                is_active: nextActive,
              }
            : item
        )
      );

      toast.success(
        nextActive
          ? "Home service approved"
          : "Home service disabled"
      );
    } catch (e: any) {
      toast.error(
        e?.message || "Failed to update status"
      );
    }
  }

  async function handleDelete(
    business: HomeService
  ) {
    const confirmed = confirm(
      `Permanently delete "${business.name}"?\n\n` +
        `This may delete related services, locations and dashboard access.\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/dashboard/admin/salons/${business.id}`
      );

      setBusinesses((current) =>
        current.filter(
          (item) => item.id !== business.id
        )
      );

      toast.success("Home service deleted");
    } catch (e: any) {
      toast.error(
        e?.message || "Failed to delete home service"
      );
    }
  }

  const hasFilters =
    searchTerm.trim() ||
    statusFilter !== "all";

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary-600">
            Operations
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            Home Services
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage beauty businesses that provide services
            at customer locations.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/salons/create?type=home"
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add home service
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total home services"
          value={stats.total}
          icon={Home}
        />

        <SummaryCard
          label="Active"
          value={stats.active}
          icon={CheckCircle2}
        />

        <SummaryCard
          label="Inactive"
          value={stats.inactive}
          icon={UserCheck}
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              placeholder="Search business, email or phone..."
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
            <option value="active">
              Active
            </option>
            <option value="inactive">
              Inactive
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
                Loading home services...
              </p>
            </div>
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <Home className="h-6 w-6 text-gray-400" />
            </div>

            <h2 className="mt-4 text-sm font-semibold text-gray-900">
              {businesses.length === 0
                ? "No home services yet"
                : "No home services found"}
            </h2>

            <p className="mt-1 max-w-sm text-sm text-gray-500">
              {businesses.length === 0
                ? "Add your first home-service beauty business to Glowee."
                : "Try changing your search or status filter."}
            </p>

            {businesses.length === 0 && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/admin/salons/create?type=home"
                  )
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                Add home service
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {filteredBusinesses.map(
                (business) => (
                  <HomeServiceRow
                    key={business.id}
                    business={business}
                    onView={() =>
                      router.push(
                        `/admin/salons/${business.id}`
                      )
                    }
                    onToggle={() =>
                      handleToggleStatus(
                        business
                      )
                    }
                    onDelete={() =>
                      handleDelete(business)
                    }
                  />
                )
              )}
            </div>

            <div className="border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
              Showing {filteredBusinesses.length} of{" "}
              {businesses.length} home service
              {businesses.length !== 1 ? "s" : ""}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function HomeServiceRow({
  business,
  onView,
  onToggle,
  onDelete,
}: {
  business: HomeService;
  onView: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
          <Home className="h-5 w-5 text-gray-500" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-gray-900">
              {business.name}
            </h3>

            <StatusBadge
              active={business.is_active}
            />

            <span className="inline-flex rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
              Home service
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
            {business.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                {business.email}
              </span>
            )}

            {business.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                {business.phone}
              </span>
            )}

            {business.created_at && (
              <span>
                Added{" "}
                {new Date(
                  business.created_at
                ).toLocaleDateString()}
              </span>
            )}
          </div>

          {business.about && (
            <p className="mt-3 max-w-3xl truncate text-sm text-gray-500">
              {business.about}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-[72px] lg:pl-0">
        <button
          type="button"
          onClick={onToggle}
          className={
            business.is_active
              ? "inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
              : "inline-flex h-9 items-center gap-2 rounded-lg bg-primary-600 px-3 text-xs font-medium text-white transition hover:bg-primary-700"
          }
        >
          <UserCheck className="h-3.5 w-3.5" />
          {business.is_active
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
          title="Delete home service"
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