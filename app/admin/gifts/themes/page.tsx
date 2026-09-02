// app/admin/gifts/themes/page.tsx
"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CheckCircle2,
  Gift,
  ImageIcon,
  Layers3,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Modal } from "@/app/components/ui/Modal";
import { giftThemeApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

interface GiftTheme {
  id: string;
  title: string;
  category: string;
  front_image_url: string;
  back_image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

type StatusFilter =
  | "all"
  | "active"
  | "inactive";

const CATEGORIES = [
  "Welcome Back",
  "Birthday",
  "Love",
  "Wedding",
  "Thank You",
  "Congratulations",
  "Get Well",
  "Baby",
  "Eid",
  "Flowers",
  "Other",
];

export default function GiftThemesPage() {
  const [themes, setThemes] = useState<
    GiftTheme[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingTheme, setEditingTheme] =
    useState<GiftTheme | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [frontImageFile, setFrontImageFile] =
    useState<File | null>(null);

  const [backImageFile, setBackImageFile] =
    useState<File | null>(null);

  const [
    frontImagePreview,
    setFrontImagePreview,
  ] = useState<string | null>(null);

  const [
    backImagePreview,
    setBackImagePreview,
  ] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "Birthday",
    is_active: true,
  });

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("All");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  async function loadThemes(
    showRefresh = false
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response =
        await giftThemeApi.getAll();

      setThemes(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Failed to load gift themes"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadThemes();
  }, []);

  const themesByCategory = useMemo(() => {
    return themes.reduce(
      (acc, theme) => {
        const category =
          theme.category || "Other";

        acc[category] =
          (acc[category] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>
    );
  }, [themes]);

  const stats = useMemo(() => {
    return {
      total: themes.length,

      active: themes.filter(
        (theme) => theme.is_active
      ).length,

      inactive: themes.filter(
        (theme) => !theme.is_active
      ).length,

      categories: Object.keys(
        themesByCategory
      ).length,
    };
  }, [themes, themesByCategory]);

  const filteredThemes = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return themes.filter((theme) => {
      const matchesCategory =
        selectedCategory === "All" ||
        (theme.category || "")
          .trim()
          .toLowerCase() ===
          selectedCategory
            .trim()
            .toLowerCase();

      const matchesSearch =
        !searchValue ||
        (theme.title || "")
          .toLowerCase()
          .includes(searchValue) ||
        (theme.category || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          theme.is_active) ||
        (statusFilter === "inactive" &&
          !theme.is_active);

      return (
        matchesCategory &&
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    themes,
    search,
    selectedCategory,
    statusFilter,
  ]);

  function resetForm() {
    setFormData({
      title: "",
      category: "Birthday",
      is_active: true,
    });

    setFrontImageFile(null);
    setBackImageFile(null);
    setFrontImagePreview(null);
    setBackImagePreview(null);
  }

  function closeModal() {
    if (uploading) return;

    setIsModalOpen(false);
    setEditingTheme(null);
    resetForm();
  }

  function handleAddNew() {
    setEditingTheme(null);
    resetForm();
    setIsModalOpen(true);
  }

  function handleEdit(theme: GiftTheme) {
    setEditingTheme(theme);

    setFormData({
      title: theme.title,
      category: theme.category,
      is_active: theme.is_active,
    });

    setFrontImagePreview(
      getImageUrl(theme.front_image_url)
    );

    setBackImagePreview(
      getImageUrl(theme.back_image_url)
    );

    setFrontImageFile(null);
    setBackImageFile(null);

    setIsModalOpen(true);
  }

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back"
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const preview =
      URL.createObjectURL(file);

    if (side === "front") {
      setFrontImageFile(file);
      setFrontImagePreview(preview);
    } else {
      setBackImageFile(file);
      setBackImagePreview(preview);
    }
  }

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      !editingTheme &&
      (!frontImageFile ||
        !backImageFile)
    ) {
      toast.error(
        "Please upload both front and back card images"
      );
      return;
    }

    setUploading(true);

    try {
      let frontImageUrl =
        editingTheme?.front_image_url || "";

      let backImageUrl =
        editingTheme?.back_image_url || "";

      if (frontImageFile) {
        const uploadResponse =
          await giftThemeApi.upload(
            frontImageFile
          );

        frontImageUrl =
          uploadResponse.url;
      }

      if (backImageFile) {
        const uploadResponse =
          await giftThemeApi.upload(
            backImageFile
          );

        backImageUrl =
          uploadResponse.url;
      }

      const themeData = {
        title: formData.title.trim(),
        category: formData.category,
        front_image_url: frontImageUrl,
        back_image_url: backImageUrl,
        is_active: formData.is_active,
      };

      if (editingTheme) {
        await giftThemeApi.update(
          editingTheme.id,
          themeData
        );

        toast.success(
          "Theme updated successfully"
        );
      } else {
        await giftThemeApi.create(
          themeData
        );

        toast.success(
          "Theme created successfully"
        );
      }

      setIsModalOpen(false);
      setEditingTheme(null);
      resetForm();

      await loadThemes();
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Failed to save theme"
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleToggleActive(
    theme: GiftTheme
  ) {
    try {
      await giftThemeApi.update(
        theme.id,
        {
          is_active:
            !theme.is_active,
        }
      );

      toast.success(
        theme.is_active
          ? "Theme disabled"
          : "Theme enabled"
      );

      await loadThemes();
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Failed to update theme"
      );
    }
  }

  async function handleDelete(
    theme: GiftTheme
  ) {
    const confirmed = window.confirm(
      `Delete "${theme.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await giftThemeApi.delete(
        theme.id
      );

      toast.success(
        "Theme deleted successfully"
      );

      await loadThemes();
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Failed to delete theme"
      );
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary-600">
            Content
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            Gift Themes
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage the gift card designs available
            to Glowee customers.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              loadThemes(true)
            }
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Add theme
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total themes"
          value={stats.total}
          icon={Gift}
        />

        <StatCard
          label="Active"
          value={stats.active}
          icon={CheckCircle2}
        />

        <StatCard
          label="Inactive"
          value={stats.inactive}
          icon={XCircle}
        />

        <StatCard
          label="Categories"
          value={stats.categories}
          icon={Layers3}
        />
      </div>

      {/* Filters */}
      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <CategoryButton
            active={
              selectedCategory ===
              "All"
            }
            onClick={() =>
              setSelectedCategory(
                "All"
              )
            }
          >
            All ({themes.length})
          </CategoryButton>

          {CATEGORIES.map(
            (category) => {
              const count =
                themesByCategory[
                  category
                ] || 0;

              if (count === 0) {
                return null;
              }

              return (
                <CategoryButton
                  key={category}
                  active={
                    selectedCategory ===
                    category
                  }
                  onClick={() =>
                    setSelectedCategory(
                      category
                    )
                  }
                >
                  {category} ({count})
                </CategoryButton>
              );
            }
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              placeholder="Search themes..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as StatusFilter
              )
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 sm:min-w-44"
          >
            <option value="all">
              All statuses
            </option>
            <option value="active">
              Active
            </option>
            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <div className="text-center">
            <RefreshCw className="mx-auto h-7 w-7 animate-spin text-gray-400" />

            <p className="mt-3 text-sm text-gray-500">
              Loading gift themes...
            </p>
          </div>
        </div>
      ) : filteredThemes.length ===
        0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            <Gift className="h-6 w-6 text-gray-400" />
          </div>

          <h2 className="mt-4 text-sm font-semibold text-gray-900">
            No gift themes found
          </h2>

          <p className="mt-1 max-w-sm text-sm text-gray-500">
            {themes.length === 0
              ? "Create your first gift theme to make it available in Glowee."
              : "Try changing your category, search or status filters."}
          </p>

          {themes.length === 0 && (
            <button
              type="button"
              onClick={
                handleAddNew
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Add theme
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredThemes.map(
              (theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  onEdit={() =>
                    handleEdit(
                      theme
                    )
                  }
                  onToggle={() =>
                    handleToggleActive(
                      theme
                    )
                  }
                  onDelete={() =>
                    handleDelete(
                      theme
                    )
                  }
                />
              )
            )}
          </div>

          <p className="text-sm text-gray-500">
            Showing{" "}
            {
              filteredThemes.length
            }{" "}
            theme
            {filteredThemes.length !==
            1
              ? "s"
              : ""}
          </p>
        </>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          editingTheme
            ? "Edit Gift Theme"
            : "Add Gift Theme"
        }
        size="lg"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Theme title{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <Input
              value={formData.title}
              onChange={(event) =>
                setFormData(
                  (current) => ({
                    ...current,
                    title:
                      event.target
                        .value,
                  })
                )
              }
              required
              placeholder="e.g. Birthday Celebration"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Category{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <select
              value={
                formData.category
              }
              onChange={(event) =>
                setFormData(
                  (current) => ({
                    ...current,
                    category:
                      event.target
                        .value,
                  })
                )
              }
              required
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            >
              {CATEGORIES.map(
                (category) => (
                  <option
                    key={
                      category
                    }
                    value={
                      category
                    }
                  >
                    {category}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <ImageUploadField
              label="Front card image"
              preview={
                frontImagePreview
              }
              required={
                !editingTheme
              }
              onChange={(
                event
              ) =>
                handleImageChange(
                  event,
                  "front"
                )
              }
            />

            <ImageUploadField
              label="Back card image"
              preview={
                backImagePreview
              }
              required={
                !editingTheme
              }
              onChange={(
                event
              ) =>
                handleImageChange(
                  event,
                  "back"
                )
              }
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Active theme
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Active themes are
                visible to Glowee
                customers.
              </p>
            </div>

            <input
              type="checkbox"
              checked={
                formData.is_active
              }
              onChange={(event) =>
                setFormData(
                  (current) => ({
                    ...current,
                    is_active:
                      event.target
                        .checked,
                  })
                )
              }
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              disabled={uploading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              isLoading={
                uploading
              }
            >
              {uploading
                ? "Saving..."
                : editingTheme
                ? "Save changes"
                : "Create theme"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ThemeCard({
  theme,
  onEdit,
  onToggle,
  onDelete,
}: {
  theme: GiftTheme;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="grid grid-cols-2 gap-px bg-gray-200">
        <ThemeImage
          label="Front"
          url={
            theme.front_image_url
          }
          alt={`${theme.title} front`}
        />

        <ThemeImage
          label="Back"
          url={
            theme.back_image_url
          }
          alt={`${theme.title} back`}
        />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-gray-900">
              {theme.title}
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Display order #
              {theme.sort_order}
            </p>
          </div>

          <StatusBadge
            active={
              theme.is_active
            }
          />
        </div>

        <div className="mt-4">
          <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
            {theme.category}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>

          <button
            type="button"
            onClick={onToggle}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Power className="h-3.5 w-3.5" />
            {theme.is_active
              ? "Disable"
              : "Enable"}
          </button>

          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete theme"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-white text-red-500 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemeImage({
  label,
  url,
  alt,
}: {
  label: string;
  url: string;
  alt: string;
}) {
  const [failed, setFailed] =
    useState(false);

  const imageUrl =
    getImageUrl(url);

  return (
    <div className="relative aspect-[4/3] bg-gray-50">
      <span className="absolute left-3 top-3 z-10 rounded-full border border-white/70 bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-600 shadow-sm">
        {label}
      </span>

      {!failed && imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          onError={() =>
            setFailed(true)
          }
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon className="h-7 w-7 text-gray-300" />
        </div>
      )}
    </div>
  );
}

function ImageUploadField({
  label,
  preview,
  required,
  onChange,
}: {
  label: string;
  preview: string | null;
  required: boolean;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
        {preview ? (
          <img
            src={preview}
            alt={`${label} preview`}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center">
            <ImageIcon className="h-7 w-7 text-gray-300" />

            <span className="mt-2 text-xs text-gray-400">
              No image selected
            </span>
          </div>
        )}

        <label className="flex cursor-pointer items-center justify-center gap-2 border-t border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
          <Upload className="h-4 w-4" />

          {preview
            ? "Replace image"
            : "Choose image"}

          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={onChange}
            className="hidden"
          />
        </label>
      </div>

      <p className="mt-2 text-xs text-gray-400">
        JPG, PNG or WEBP · Max 6 MB
      </p>
    </div>
  );
}

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={
        active
          ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
          : "inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500"
      }
    >
      {active
        ? "Active"
        : "Inactive"}
    </span>
  );
}

function CategoryButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "shrink-0 whitespace-nowrap rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white"
          : "shrink-0 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
      }
    >
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
      </div>
    </div>
  );
}