// app/salon/services/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Tags,
  Sparkles,
  ImageIcon,
  Clock3,
  Pencil,
  Trash2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

import { categoryApi, serviceApi } from "@/lib/api";

type CategoryRow = {
  id: string;
  name: string;
};

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category_id: string | null;
  category_name?: string | null;
  is_active: boolean;
  created_at?: string;
};

export default function SalonServicesUnifiedPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);

  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");

  async function loadAll() {
    try {
      setLoading(true);
      setErr(null);

      const [resCats, resSvcs] = await Promise.all([
        categoryApi.getAll(),
        serviceApi.getAll(),
      ]);

      setCategories(Array.isArray(resCats.data) ? resCats.data : []);
      setServices(Array.isArray(resSvcs.data) ? resSvcs.data : []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load services");
      setCategories([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function deleteService(id: string) {
    if (
      !confirm(
        "Are you sure you want to delete this service? This action cannot be undone unless the service has booking history."
      )
    ) {
      return;
    }

    try {
      setErr(null);

      const res = await serviceApi.delete(id);

      await loadAll();

      if (res?.mode === "archived") {
        alert(
          "This service has booking history, so it was archived instead of permanently deleted."
        );
      }
    } catch (e: any) {
      setErr(e?.message ?? "Failed to delete service");
    }
  }

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();

    for (const category of categories) {
      map.set(category.id, category.name);
    }

    return map;
  }, [categories]);

  const filteredServices = useMemo(() => {
    const query = q.trim().toLowerCase();

    let data = [...services];

    if (query) {
      data = data.filter((service) =>
        (service.name ?? "").toLowerCase().includes(query)
      );
    }

    if (catFilter === "uncategorized") {
      data = data.filter((service) => !service.category_id);
    } else if (catFilter !== "all") {
      data = data.filter((service) => service.category_id === catFilter);
    }

    data.sort((a, b) =>
      String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
    );

    return data;
  }, [services, q, catFilter]);

  const groupedServices = useMemo(() => {
    const map = new Map<string, ServiceRow[]>();

    for (const service of filteredServices) {
      const key = service.category_id ?? "uncategorized";

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key)!.push(service);
    }

    return Array.from(map.entries()).sort((a, b) => {
      const aLabel =
        a[0] === "uncategorized"
          ? "Uncategorized"
          : categoryMap.get(a[0]) ?? "";

      const bLabel =
        b[0] === "uncategorized"
          ? "Uncategorized"
          : categoryMap.get(b[0]) ?? "";

      return aLabel.localeCompare(bLabel);
    });
  }, [filteredServices, categoryMap]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
          <p className="mt-4 text-sm text-gray-500">Loading services...</p>
        </div>
      </div>
    );
  }

  const hasFilters = q.trim() !== "" || catFilter !== "all";

  return (
    <div className="mx-auto max-w-[1500px] space-y-7 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Services
          </h1>

          <p className="mt-1.5 text-sm text-gray-500">
            Manage the services customers can discover and book.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/salon/categories"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Tags className="h-4 w-4" />
            Manage categories
          </Link>

          <Link
            href="/salon/services/create"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Add service
          </Link>
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
            <p className="mt-0.5 text-sm text-red-600">{err}</p>
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search services..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="min-w-[190px] rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          >
            <option value="all">All categories</option>
            <option value="uncategorized">Uncategorized</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <div className="whitespace-nowrap px-2 text-sm text-gray-500">
            {filteredServices.length}{" "}
            {filteredServices.length === 1 ? "service" : "services"}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {filteredServices.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
            <Sparkles className="h-5 w-5 text-primary-600" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            {services.length === 0
              ? "Add your first service"
              : "No matching services"}
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            {services.length === 0
              ? "Create the services your customers can discover and book through Glowee."
              : "Try changing your search or category filter."}
          </p>

          {services.length === 0 ? (
            <Link
              href="/salon/services/create"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Add service
            </Link>
          ) : (
            hasFilters && (
              <button
                onClick={() => {
                  setQ("");
                  setCatFilter("all");
                }}
                className="mt-5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear filters
              </button>
            )
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedServices.map(([catId, list]) => {
            const title =
              catId === "uncategorized"
                ? "Uncategorized"
                : categoryMap.get(catId) ?? "Category";

            return (
              <section key={catId}>
                {/* Category heading */}
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {title}
                    </h2>

                    <p className="mt-0.5 text-sm text-gray-400">
                      {list.length} {list.length === 1 ? "service" : "services"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {list.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      categoryMap={categoryMap}
                      onDelete={deleteService}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  service,
  categoryMap,
  onDelete,
}: {
  service: ServiceRow;
  categoryMap: Map<string, string>;
  onDelete: (id: string) => void;
}) {
  const categoryLabel = service.category_id
    ? categoryMap.get(service.category_id) || "Unknown category"
    : "Uncategorized";

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:border-gray-300">
      <div className="flex gap-4 p-5">
        {/* Image */}
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
          {service.image_url ? (
            <img
              src={service.image_url}
              alt={service.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-5 w-5 text-gray-300" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-gray-900">
                {service.name}
              </h3>

              <p className="mt-1 text-sm text-gray-500">{categoryLabel}</p>
            </div>

            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                service.is_active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {service.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500">
            {service.description || "No description added yet."}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
        <Link
          href={`/salon/services/${service.id}/availability`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-primary-600"
        >
          <Clock3 className="h-4 w-4" />
          Availability
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href={`/salon/services/${service.id}/edit`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            title="Edit service"
          >
            <Pencil className="h-4 w-4" />
          </Link>

          <button
            onClick={() => onDelete(service.id)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
            title="Delete service"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}