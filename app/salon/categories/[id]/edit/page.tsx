// app/salon/categories/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { categoryApi } from "@/lib/api";

type CategoryRow = {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
};

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryRow | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    async function load() {
      if (!categoryId) return;

      try {
        setLoading(true);
        setError(null);

        const res = await categoryApi.getById(categoryId);
        const row = res.category || res.data || null;

        if (!row) {
          throw new Error("Category not found");
        }

        setCategory(row);
        setName(row.name || "");
      } catch (e: any) {
        setError(e?.message || "Failed to load category");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [categoryId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nm = name.trim();

    if (nm.length < 2) {
      setError("Category name is too short");
      return;
    }

    try {
      setSaving(true);
      await categoryApi.update(categoryId, { name: nm });
      router.push("/salon/categories");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to update category");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading category...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-lg font-semibold text-red-700 mb-4">
            {error || "Category not found"}
          </p>
          <Link
            href="/salon/categories"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mx-auto max-w-3xl">

        {/* Back */}
        <Link
          href="/salon/categories"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          ← Back to categories
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Edit Category
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Update the category name used to organize services
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">

          {/* Category Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">

            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Category Information
              </h2>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category Name *
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. Hair, Nails, Makeup"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

          </div>

          {/* Actions */}
          <div className="flex gap-4">

            <button
              type="button"
              onClick={() => router.push("/salon/categories")}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}