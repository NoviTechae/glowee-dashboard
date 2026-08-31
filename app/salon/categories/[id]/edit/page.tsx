// app/salon/categories/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Save,
  Tags,
} from "lucide-react";

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

  const categoryId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

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

    const categoryName = name.trim();

    if (categoryName.length < 2) {
      setError("Please enter a valid category name");
      return;
    }

    try {
      setSaving(true);

      await categoryApi.update(categoryId, {
        name: categoryName,
      });

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
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading category...
          </p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-6 w-6 text-red-500" />

          <p className="mt-3 font-medium text-red-800">
            {error || "Category not found"}
          </p>

          <Link
            href="/salon/categories"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary-600 transition hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7 p-6 lg:p-8">
      {/* Header */}
      <div>
        <Link
          href="/salon/categories"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to categories
        </Link>

        <div className="mt-5">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Edit category
          </h1>

          <p className="mt-1.5 text-sm text-gray-500">
            Update how this category appears when organizing services.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

          <div>
            <p className="text-sm font-medium text-red-800">
              Something went wrong
            </p>

            <p className="mt-0.5 text-sm text-red-600">
              {error}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Details */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Tags className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Category details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Change the category name customers see.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Category name{" "}
              <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Hair, Nails, Facial"
              autoFocus
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />

            <p className="mt-2 text-xs text-gray-400">
              Keep category names short and easy for customers to understand.
            </p>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push("/salon/categories")}
            disabled={saving}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />

            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}