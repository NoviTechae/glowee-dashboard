"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { categoryApi } from "@/lib/api";

export default function CreateCategoryPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await categoryApi.create({ name: nm });
      router.push("/salon/categories");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to create category");
    } finally {
      setSaving(false);
    }
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
            Add Category
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Create a new category to organize your services
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">

          {/* Category Card */}
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
              {saving ? "Creating..." : "Create Category"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}