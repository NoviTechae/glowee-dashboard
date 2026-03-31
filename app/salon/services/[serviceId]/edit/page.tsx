// app/salon/services/[serviceId]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  is_active: boolean;
};

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();

  const serviceId = Array.isArray(params.serviceId)
    ? params.serviceId[0]
    : (params.serviceId as string);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [service, setService] = useState<ServiceRow | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!serviceId) return;

      try {
        setLoading(true);
        setError(null);

        const [catsRes, svcRes] = await Promise.all([
          categoryApi.getAll(),
          serviceApi.getById(serviceId),
        ]);

        const cats = Array.isArray(catsRes.data) ? catsRes.data : [];
        const row = svcRes.service || svcRes.data || null;

        if (!row) throw new Error("Service not found");

        setCategories(cats);
        setService(row);

        setName(row.name || "");
        setDescription(row.description || "");
        setImageUrl(row.image_url || "");
        setCategoryId(row.category_id || "");
        setIsActive(!!row.is_active);
      } catch (e: any) {
        setError(e?.message || "Failed to load service");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [serviceId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Service name is too short");
      return;
    }

    if (imageUrl && !imageUrl.startsWith("http")) {
      setError("Image URL must start with http:// or https://");
      return;
    }

    try {
      setSaving(true);

      await serviceApi.update(serviceId, {
        name: name.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        category_id: categoryId || null,
        is_active: isActive,
      });

      router.push("/salon/services");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to update service");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading service...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-semibold text-red-700">
            {error || "Service not found"}
          </p>

          <Link
            href="/salon/services"
            className="mt-4 inline-block text-purple-600 hover:underline"
          >
            ← Back to services
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
          href="/salon/services"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to services
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent">
            Edit Service
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Update service details
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <span className="font-medium text-red-700">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-gray-900">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 gap-6">
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Service Name *
                </label>

                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Category
                </label>

                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">No category</option>

                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Image URL
                </label>

                <input
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setError(null);
                  }}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Active */}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-5 w-5"
                />

                <div>
                  <span className="font-semibold text-green-900">Active</span>
                  <p className="text-xs text-green-700">
                    Service will be visible for booking
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/salon/services")}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}