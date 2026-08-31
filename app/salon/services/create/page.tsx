// app/salon/services/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  ImageIcon,
  Info,
  Plus,
  X,
} from "lucide-react";

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

      router.push(`/salon/services/${serviceId}/availability`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to create service");
    } finally {
      setSaving(false);
    }
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
            Add service
          </h1>

          <p className="mt-1.5 text-sm text-gray-500">
            Create a service customers can discover and book through Glowee.
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
        {/* Main form */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Service details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add the basic information customers will see.
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
                placeholder="e.g. Hair Cut"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
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
                disabled={loadingCats}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">No category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {loadingCats && (
                <p className="mt-2 text-xs text-gray-400">
                  Loading categories...
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell customers what this service includes..."
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            {/* Image */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Service image
              </label>

              {!imagePreview ? (
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
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200">
                  <div className="relative h-64 bg-gray-50">
                    <img
                      src={imagePreview}
                      alt="Service preview"
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => handleImageChange(null)}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-gray-500 shadow-sm transition hover:text-red-600"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
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
                  ? "This service will be active after its booking setup is completed."
                  : "This service will remain hidden from customers."}
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

        {/* Next step */}
        <div className="flex items-start gap-3 rounded-xl border border-primary-100 bg-primary-50/50 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />

          <p className="text-sm leading-6 text-gray-600">
            After creating the service, you&apos;ll set its{" "}
            <span className="font-medium text-gray-800">
              price, duration and availability
            </span>
            .
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
            <Plus className="h-4 w-4" />

            {saving ? "Creating service..." : "Create & continue"}
          </button>
        </div>
      </form>
    </div>
  );
}