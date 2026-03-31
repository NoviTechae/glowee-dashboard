// app/salon/categories/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    if (!confirm("Delete this category?")) return;

    try {
      setErr(null);
      await categoryApi.delete(categoryId);
      setRows((prev) => prev.filter((c) => c.id !== categoryId));
    } catch (e: any) {
      setErr(e?.message ?? "Delete failed");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
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
            Categories
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Create categories to organize your services
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
            href="/salon/categories/create"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
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

      {/* Empty State */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No categories yet</h3>
            <p className="mb-6 text-gray-500">Add your first category to start organizing services</p>
            <Link
              href="/salon/categories/create"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Category
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Count Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Categories</div>
                <div className="text-lg font-bold text-gray-900">{rows.length}</div>
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg"
              >
                {/* Header */}
                <div className="border-b border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 transition-transform group-hover:scale-110">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"
                        />
                      </svg>
                    </div>

                    <span className="rounded-full border border-purple-200 bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                      Category
                    </span>
                  </div>

                  <h3 className="mb-1 text-xl font-bold text-gray-900">{row.name}</h3>
                  <p className="flex items-center gap-1 text-xs text-gray-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z"
                      />
                    </svg>
                    Ready to assign to services
                  </p>
                </div>

                {/* Info */}
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
                      <span className="text-xs font-semibold uppercase text-gray-500">Category ID</span>
                    </div>
                    <p className="break-all rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      {row.id}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 bg-gray-50 px-6 py-4">
                  <Link
                    href={`/salon/categories/${row.id}/edit`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </Link>

                  <button
                    onClick={() => deleteCategory(row.id)}
                    className="flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-semibold text-red-600 transition-colors hover:bg-red-100"
                    title="Delete category"
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
            ))}
          </div>
        </>
      )}
    </div>
  );
}