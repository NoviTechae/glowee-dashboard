// app/salon/staff/create/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Home,
  Info,
  MapPin,
  Plus,
  Scissors,
  UserRound,
} from "lucide-react";

import {
  branchApi,
  serviceApi,
  staffApi,
  salonApi,
} from "@/lib/api";

type Branch = {
  id: string;
  name: string;
};

type Service = {
  id: string;
  name: string;
  category_name?: string | null;
};

export default function CreateStaffPage() {
  const router = useRouter();

  const [salonType, setSalonType] = useState<
    "in_salon" | "home" | "both" | null
  >(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [branchId, setBranchId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isHomeSalon = salonType === "home";

  const groupedServices = useMemo(() => {
    const map = new Map<string, Service[]>();

    for (const service of services) {
      const category = service.category_name || "Other";

      if (!map.has(category)) {
        map.set(category, []);
      }

      map.get(category)!.push(service);
    }

    return Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
  }, [services]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const [meRes, branchesRes, servicesRes] = await Promise.all([
          salonApi.getMe(),
          branchApi.getAll(),
          serviceApi.getAll(),
        ]);

        const me = meRes?.salon || meRes?.data || null;

        const loadedBranches = Array.isArray(branchesRes.data)
          ? branchesRes.data
          : [];

        const loadedServices = Array.isArray(servicesRes.data)
          ? servicesRes.data
          : [];

        setSalonType(me?.salon_type ?? null);
        setBranches(loadedBranches);
        setServices(loadedServices);

        if (loadedBranches.length > 0) {
          setBranchId(loadedBranches[0].id);
        }
      } catch (e: any) {
        setErr(e?.message || "Failed to load form data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function toggleService(serviceId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );

    setErr(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (name.trim().length < 2) {
      setErr("Please enter a valid team member name");
      return;
    }

    if (!branchId) {
      setErr(
        isHomeSalon
          ? "Your home-service location is not set up yet. Please contact support."
          : "Please select a location"
      );
      return;
    }

    if (selectedServiceIds.length === 0) {
      setErr("Select at least one service");
      return;
    }

    try {
      setSaving(true);

      const created = await staffApi.create({
        name: name.trim(),
        phone: phone.trim() || null,
        branch_id: branchId,
        is_active: isActive,
      });

      const staffId = created?.staff?.id || created?.data?.id;

      if (!staffId) {
        throw new Error("Team member could not be created");
      }

      await staffApi.updateServices(
        staffId,
        selectedServiceIds
      );

      router.push("/salon/staff");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Failed to create team member");
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
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7 p-6 lg:p-8">
      {/* Header */}
      <div>
        <Link
          href="/salon/staff"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to team
        </Link>

        <div className="mt-5">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Add team member
          </h1>

          <p className="mt-1.5 text-sm text-gray-500">
            Add a team member and choose the services they can provide.
          </p>
        </div>
      </div>

      {/* Error */}
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

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Member details */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <UserRound className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Team member details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add their basic information and location.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>

                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErr(null);
                  }}
                  placeholder="e.g. Sara"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+971..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            {/* Location */}
            {!isHomeSalon ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Location <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <select
                    value={branchId}
                    onChange={(e) => {
                      setBranchId(e.target.value);
                      setErr(null);
                    }}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="">Select location</option>

                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <Home className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />

                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Home service
                  </p>

                  <p className="mt-0.5 text-sm text-gray-500">
                    This team member will automatically use your home-service
                    setup.
                  </p>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center justify-between gap-6 rounded-xl border border-gray-200 px-4 py-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Active
                </p>

                <p className="mt-0.5 text-xs text-gray-500">
                  Active team members can be assigned to bookings.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive((value) => !value)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
                  isActive ? "bg-primary-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
                    isActive
                      ? "translate-x-[22px] translate-y-0.5"
                      : "translate-x-0.5 translate-y-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Scissors className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Services
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Select the services this team member can provide.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {services.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-6 text-center">
                <Scissors className="mx-auto h-5 w-5 text-gray-400" />

                <p className="mt-2 text-sm font-medium text-gray-700">
                  No services available
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Add services before creating a team member.
                </p>

                <Link
                  href="/salon/services/create"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  <Plus className="h-4 w-4" />
                  Add service
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedServices.map(([category, list]) => (
                  <div key={category}>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {category}
                    </p>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {list.map((service) => {
                        const selected =
                          selectedServiceIds.includes(service.id);

                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => toggleService(service.id)}
                            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                              selected
                                ? "border-primary-200 bg-primary-50"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                            }`}
                          >
                            <span
                              className={`text-sm font-medium ${
                                selected
                                  ? "text-primary-800"
                                  : "text-gray-700"
                              }`}
                            >
                              {service.name}
                            </span>

                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                selected
                                  ? "border-primary-600 bg-primary-600 text-white"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {selected && (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-500">
                    {selectedServiceIds.length === 0
                      ? "Select at least one service."
                      : `${selectedServiceIds.length} ${
                          selectedServiceIds.length === 1
                            ? "service"
                            : "services"
                        } selected.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Helper */}
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />

          <p className="text-sm text-gray-500">
            Team members must have at least one service assigned so Glowee can
            use them in availability and booking flows.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push("/salon/staff")}
            disabled={saving}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving || services.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />

            {saving ? "Creating..." : "Add team member"}
          </button>
        </div>
      </form>
    </div>
  );
}