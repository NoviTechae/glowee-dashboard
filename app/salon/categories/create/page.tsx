// app/salon/categories/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Plus,
  Tags,
} from "lucide-react";

import { categoryApi } from "@/lib/api";

export default function CreateCategoryPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      await categoryApi.create({
        name: categoryName,
      });

      router.push("/salon/categories");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to create category");
    } finally {
      setSaving(false);
    }
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
            Add category
          </h1>

          <p className="mt-1.5 text-sm text-gray-500">
            Create a category to keep your services organized.
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
                  Customers will see this category when browsing services.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Category name <span className="text-red-500">*</span>
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
            <Plus className="h-4 w-4" />

            {saving ? "Creating..." : "Create category"}
          </button>
        </div>
      </form>
    </div>
  );
}