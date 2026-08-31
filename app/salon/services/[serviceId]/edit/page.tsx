// app/salon/services/[serviceId]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  ImageIcon,
  Save,
  X,
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
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

        if (!row) {
          throw new Error("Service not found");
        }

        setCategories(cats);
        setService(row);

        setName(row.name || "");
        setDescription(row.description || "");
        setCategoryId(row.category_id || "");
        setIsActive(!!row.is_active);
        setCurrentImageUrl(row.image_url || null);
      } catch (e: any) {
        setError(e?.message || "Failed to load service");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [serviceId]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function handleImageChange(file: File | null) {
    setError(null);

    if (!file) {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

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

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Please enter a valid service name");
      return;
    }

    try {
      setSaving(true);

      await serviceApi.update(serviceId, {
        name: name.trim(),
        description: description.trim() || null,
        image_url: currentImageUrl,
        category_id: categoryId || null,
        is_active: isActive,
      });

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);

        await serviceApi.uploadImage(serviceId, formData);
      }

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
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
          <p className="mt-4 text-sm text-gray-500">Loading service...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-6 w-6 text-red-500" />

          <p className="mt-3 font-medium text-red-800">
            {error || "Service not found"}
          </p>

          <Link
            href="/salon/services"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7 p-6 lg:p-8">
      {/* Header */}
      <div>
        <Link
          href="/salon/services"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to services
        </Link>

        <div className="mt-5">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Edit service
          </h1>

          <p className="mt-1.5 text-sm text-gray-500">
            Update how this service appears to customers.
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
            <p className="mt-0.5 text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Service details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Edit the information customers see in Glowee.
            </p>
          </div>

          <div className="space-y-6 p-6">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Service name <span className="text-red-500">*</span>
              </label>

              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            {/* Category */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Category
                </label>

                <Link
                  href="/salon/categories"
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  Manage categories
                </Link>
              </div>

              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              >
                <option value="">No category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Tell customers what this service includes..."
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            {/* Image */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Service image
              </label>

              {imagePreview || currentImageUrl ? (
                <div className="overflow-hidden rounded-2xl border border-gray-200">
                  <div className="relative h-64 bg-gray-50">
                    <img
                      src={imagePreview || currentImageUrl || ""}
                      alt="Service preview"
                      className="h-full w-full object-cover"
                    />

                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => handleImageChange(null)}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-gray-500 shadow-sm transition hover:text-red-600"
                        aria-label="Cancel new image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                    <p className="text-xs text-gray-500">
                      {imagePreview ? "New image selected" : "Current image"}
                    </p>

                    <label className="cursor-pointer text-sm font-medium text-primary-600 hover:text-primary-700">
                      Change image

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) =>
                          handleImageChange(e.target.files?.[0] || null)
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center transition hover:border-primary-300 hover:bg-primary-50/30">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                    <ImageIcon className="h-5 w-5" />
                  </div>

                  <p className="mt-3 text-sm font-medium text-gray-700">
                    Upload service image
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    JPG, PNG or WEBP up to 6MB
                  </p>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) =>
                      handleImageChange(e.target.files?.[0] || null)
                    }
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </section>

        {/* Status */}
        <section className="rounded-2xl border border-gray-200 bg-white px-6 py-5">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Service status
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {isActive
                  ? "This service is active and can be available for booking."
                  : "This service is hidden from customers."}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((value) => !value)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
                isActive ? "bg-primary-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
                  isActive
                    ? "translate-x-[22px] translate-y-0.5"
                    : "translate-x-0.5 translate-y-0.5"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Link
            href={`/salon/services/${serviceId}/availability`}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Edit pricing & availability
          </Link>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/salon/services")}
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
        </div>
      </form>
    </div>
  );
}