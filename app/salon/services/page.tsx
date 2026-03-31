// app/salon/services/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
      setErr(e?.message ?? "Failed to load data");
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
    if (!confirm("Delete this service?")) return;

    try {
      setErr(null);
      const res = await serviceApi.delete(id);
      await loadAll();

      if (res?.mode === "archived") {
        alert("Service archived because it has booking history.");
      }
    } catch (e: any) {
      setErr(e?.message ?? "Delete service failed");
    }
  }

  const categoryMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  const filteredServices = useMemo(() => {
    const query = q.trim().toLowerCase();
    let data = [...services];

    if (query) {
      data = data.filter((s) => (s.name ?? "").toLowerCase().includes(query));
    }

    if (catFilter === "uncategorized") {
      data = data.filter((s) => !s.category_id);
    } else if (catFilter !== "all") {
      data = data.filter((s) => s.category_id === catFilter);
    }

    data.sort((a, b) =>
      String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
    );

    return data;
  }, [services, q, catFilter]);

  const groupedServices = useMemo(() => {
    const map = new Map<string, ServiceRow[]>();

    for (const s of filteredServices) {
      const key = s.category_id ?? "uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }

    return Array.from(map.entries()).sort((a, b) => {
      const aLabel =
        a[0] === "uncategorized" ? "Uncategorized" : categoryMap.get(a[0]) ?? "";
      const bLabel =
        b[0] === "uncategorized" ? "Uncategorized" : categoryMap.get(b[0]) ?? "";
      return aLabel.localeCompare(bLabel);
    });
  }, [filteredServices, categoryMap]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent">
            Services
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage your salon services and organize them by category
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadAll}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>

          <Link
            href="/salon/services/create"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Service
          </Link>
        </div>
      </div>

      {/* Error */}
      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-red-700">{err}</span>
          </div>
        </div>
      )}

      {/* Filters / Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-3">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Search
              </label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search service..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Category
              </label>
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All categories</option>
                <option value="uncategorized">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3">
              <div className="text-sm font-semibold text-purple-700">Results</div>
              <div className="mt-1 text-2xl font-bold text-purple-900">
                {filteredServices.length}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Services</div>
              <div className="text-lg font-bold text-gray-900">{services.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty */}
      {filteredServices.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No services found</h3>
            <p className="mb-6 text-gray-500">
              {services.length === 0
                ? "Add your first service to get started"
                : "Try changing your search or category filter"}
            </p>
            {services.length === 0 && (
              <Link
                href="/salon/services/create"
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Service
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedServices.map(([catId, list]) => {
            const title =
              catId === "uncategorized"
                ? "Uncategorized"
                : categoryMap.get(catId) ?? "Category";

            return (
              <div
                key={catId}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                      <p className="text-sm text-gray-500">
                        {list.length} service{list.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Services in category */}
                <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
                  {list.map((s) => (
                    <ServiceCard
                      key={s.id}
                      s={s}
                      categoryMap={categoryMap}
                      onDelete={deleteService}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  s,
  categoryMap,
  onDelete,
}: {
  s: ServiceRow;
  categoryMap: Map<string, string>;
  onDelete: (id: string) => void;
}) {
  const categoryLabel = s.category_id
    ? categoryMap.get(s.category_id) || "Unknown category"
    : "Uncategorized";

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {s.image_url ? (
                <img
                  src={s.image_url}
                  alt={s.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400">
                  IMG
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900">{s.name}</h3>
              <p className="mt-1 text-sm text-gray-600">{categoryLabel}</p>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              s.is_active
                ? "border border-green-200 bg-green-100 text-green-700"
                : "border border-gray-200 bg-gray-100 text-gray-600"
            }`}
          >
            {s.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-4 p-6">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs font-semibold uppercase text-gray-500">
              Description
            </span>
          </div>

          {s.description ? (
            <p className="text-sm text-gray-600">{s.description}</p>
          ) : (
            <p className="text-sm italic text-gray-400">No description</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 bg-gray-50 px-6 py-4">
        <Link
          href={`/salon/services/${s.id}/availability`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Availability
        </Link>

        <Link
          href={`/salon/services/${s.id}/edit`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Edit
        </Link>

        <button
          onClick={() => onDelete(s.id)}
          className="flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-semibold text-red-600 transition-colors hover:bg-red-100"
          title="Delete service"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}