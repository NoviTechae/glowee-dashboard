// app/salon/services/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { categoryApi, serviceApi } from "@/lib/api";

type CategoryRow = {
  id: string;
  name: string;
};

export default function CreateServicePage() {
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCats(true);
        const res = await categoryApi.getAll();
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (e: any) {
        setError(e?.message || "Failed to load categories");
      } finally {
        setLoadingCats(false);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function handleImageChange(file: File | null) {
    setError(null);

    if (!file) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Only JPG, PNG, or WEBP images are allowed");
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setError("Image must be smaller than 6MB");
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Service name is too short");
      return;
    }

    try {
      setSaving(true);

      const created = await serviceApi.create({
        name: name.trim(),
        description: description.trim() || null,
        image_url: null,
        category_id: categoryId || null,
        is_active: isActive,
      });

      const serviceId =
        created?.service?.id ||
        created?.data?.id ||
        created?.id;

      if (!serviceId) {
        throw new Error("Service created but missing service ID");
      }

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        await serviceApi.uploadImage(serviceId, formData);
      }

      router.push("/salon/services");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to create service");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/salon/services"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to services
        </Link>

        <div className="mb-8">
          <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent">
            Add Service
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Create a new service for your salon
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium text-red-700">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
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
              <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
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
                  placeholder="e.g. Hair Cut"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  disabled={loadingCats}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {loadingCats && (
                  <p className="mt-2 text-xs text-gray-500">Loading categories...</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description..."
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Service Image
                </label>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                  className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all file:mr-4 file:rounded-lg file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-purple-700 hover:file:bg-purple-100 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Upload JPG, PNG, or WEBP. Max size 6MB.
                </p>

                {imagePreview && (
                  <div className="mt-4">
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-48 w-full rounded-xl object-cover"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleImageChange(null)}
                      className="mt-3 text-sm font-semibold text-red-600 hover:text-red-700"
                    >
                      Remove image
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 transition-colors hover:bg-green-100">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <span className="font-semibold text-green-900">Active</span>
                    <p className="mt-1 text-xs text-green-700">
                      Service will be visible and available for setup
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-6 w-6 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="mb-1 font-bold text-blue-900">Next Step</h3>
                <p className="text-sm text-blue-700">
                  After creating the service, you can set availability, pricing, and duration for each branch.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/salon/services")}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-6 py-3.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3.5 font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}