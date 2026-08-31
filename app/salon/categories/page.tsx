// app/salon/categories/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Pencil,
  Plus,
  Tags,
  Trash2,
} from "lucide-react";

import { categoryApi } from "@/lib/api";

type CategoryRow = {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
};

export default function SalonCategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<CategoryRow[]>([]);

  async function loadAll() {
    try {
      setLoading(true);
      setErr(null);

      const res = await categoryApi.getAll();
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load categories");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function deleteCategory(categoryId: string) {
    const confirmed = confirm(
      "Delete this category? Services using it may become uncategorized."
    );

    if (!confirmed) return;

    try {
      setErr(null);

      await categoryApi.delete(categoryId);

      setRows((prev) =>
        prev.filter((category) => category.id !== categoryId)
      );
    } catch (e: any) {
      setErr(e?.message ?? "Failed to delete category");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading categories...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7 p-6 lg:p-8">
      {/* Header */}
      <div>
        <Link
          href="/salon/services"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to services
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Categories
            </h1>

            <p className="mt-1.5 text-sm text-gray-500">
              Organize your services into simple groups customers can browse.
            </p>
          </div>

          <Link
            href="/salon/categories/create"
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Add category
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

      {/* Empty */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Tags className="h-5 w-5 text-gray-400" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            No categories yet
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            Create categories such as Hair, Nails or Facial to keep your
            services organized.
          </p>

          <Link
            href="/salon/categories/create"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Add first category
          </Link>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {/* Section Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h2 className="font-semibold text-gray-900">
                Service categories
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {rows.length} {rows.length === 1 ? "category" : "categories"}
              </p>
            </div>
          </div>

          {/* Category rows */}
          <div className="divide-y divide-gray-100">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-gray-50/70"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Tags className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {row.name}
                    </p>

                    <p className="mt-0.5 text-xs text-gray-400">
                      Available for service organization
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/salon/categories/${row.id}/edit`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    title="Edit category"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => deleteCategory(row.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    title="Delete category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}