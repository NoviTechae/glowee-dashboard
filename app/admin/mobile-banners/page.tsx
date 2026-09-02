// app/admin/mobile-banners/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Image as ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { bannerApi } from "@/lib/api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "";

type BannerRow = {
  id: string;
  title: string | null;
  image_url: string;
  placement: string;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  action_type: string | null;
  action_value: string | null;
  created_at?: string;
  updated_at?: string;
};

type FormState = {
  title: string;
  image_url: string;
  placement: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  action_type: string;
  action_value: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  image_url: "",
  placement: "home",
  is_active: true,
  starts_at: "",
  ends_at: "",
  action_type: "",
  action_value: "",
};

const PLACEMENT_OPTIONS = [
  { value: "home", label: "Home" },
  {
    value: "home_services",
    label: "Home Services",
  },
  { value: "salon", label: "Salon" },
];

const ACTION_OPTIONS = [
  { value: "", label: "No action" },
  { value: "salon", label: "Open salon" },
  {
    value: "category",
    label: "Open category",
  },
  { value: "url", label: "Open URL" },
];

function prettify(value?: string | null) {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function absoluteImageUrl(
  path?: string | null
) {
  if (!path) return "";

  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  return `${API_BASE}${path.startsWith("/")
      ? path
      : `/${path}`
    }`;
}

function formatDate(
  value?: string | null
) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dubai",
  });
}

function toDatetimeLocalValue(
  value?: string | null
) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const formatter =
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Dubai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const parts =
    formatter.formatToParts(date);

  const values: Record<string, string> =
    {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export default function MobileBannersAdminPage() {
  const [rows, setRows] =
    useState<BannerRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [
    filterPlacement,
    setFilterPlacement,
  ] = useState("all");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<FormState>(EMPTY_FORM);

  const filteredRows = useMemo(() => {
    if (filterPlacement === "all") {
      return rows;
    }

    return rows.filter(
      (row) =>
        row.placement === filterPlacement
    );
  }, [rows, filterPlacement]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      active: rows.filter(
        (row) => row.is_active
      ).length,
      inactive: rows.filter(
        (row) => !row.is_active
      ).length,
      placements: new Set(
        rows.map((row) => row.placement)
      ).size,
    };
  }, [rows]);

  useEffect(() => {
    loadRows();
  }, []);

  async function loadRows(
    showRefreshing = false
  ) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response =
        await bannerApi.getAll();

      setRows(
        Array.isArray(response?.data)
          ? response.data
          : []
      );
    } catch (error: any) {
      toast.error(
        error?.message ||
        "Failed to load banners"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  function startEdit(row: BannerRow) {
    setEditingId(row.id);

    setForm({
      title: row.title ?? "",
      image_url: row.image_url ?? "",
      placement:
        row.placement ?? "home",
      is_active: Boolean(
        row.is_active
      ),
      starts_at:
        toDatetimeLocalValue(
          row.starts_at
        ),
      ends_at:
        toDatetimeLocalValue(
          row.ends_at
        ),
      action_type:
        row.action_type ?? "",
      action_value:
        row.action_value ?? "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleUpload(
    file?: File | null
  ) {
    if (!file) return;

    try {
      setUploading(true);

      const response =
        await bannerApi.upload(file);

      setForm((previous) => ({
        ...previous,
        image_url:
          response?.image_url || "",
      }));

      toast.success(
        "Banner image uploaded"
      );
    } catch (error: any) {
      toast.error(
        error?.message ||
        "Image upload failed"
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(
    event: React.FormEvent
  ) {
    event.preventDefault();

    try {
      setSaving(true);

      if (!form.image_url.trim()) {
        throw new Error(
          "Please upload a banner image first"
        );
      }

      const payload = {
        title:
          form.title.trim() || null,

        image_url:
          form.image_url.trim(),

        placement:
          form.placement || "home",

        is_active:
          Boolean(form.is_active),

        starts_at: form.starts_at
          ? new Date(
            form.starts_at
          ).toISOString()
          : null,

        ends_at: form.ends_at
          ? new Date(
            form.ends_at
          ).toISOString()
          : null,

        action_type:
          form.action_type || null,

        action_value:
          form.action_value.trim() ||
          null,
      };

      if (editingId) {
        await bannerApi.update(
          editingId,
          payload
        );

        toast.success(
          "Banner updated"
        );
      } else {
        await bannerApi.create(payload);

        toast.success(
          "Banner created"
        );
      }

      resetForm();
      await loadRows();
    } catch (error: any) {
      toast.error(
        error?.message ||
        "Failed to save banner"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    row: BannerRow
  ) {
    const confirmed =
      window.confirm(
        `Delete "${row.title ||
        "Untitled banner"
        }"?`
      );

    if (!confirmed) return;

    try {
      setDeletingId(row.id);

      await bannerApi.delete(row.id);

      if (editingId === row.id) {
        resetForm();
      }

      toast.success(
        "Banner deleted"
      );

      await loadRows();
    } catch (error: any) {
      toast.error(
        error?.message ||
        "Failed to delete banner"
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleActive(
    row: BannerRow
  ) {
    try {
      setUpdatingId(row.id);

      await bannerApi.update(row.id, {
        is_active: !row.is_active,
      });

      toast.success(
        row.is_active
          ? "Banner disabled"
          : "Banner enabled"
      );

      await loadRows();
    } catch (error: any) {
      toast.error(
        error?.message ||
        "Failed to update banner"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function moveBanner(
    row: BannerRow,
    direction: "up" | "down"
  ) {
    const placementRows = rows
      .filter(
        (item) =>
          item.placement ===
          row.placement
      )
      .sort(
        (a, b) =>
          a.sort_order -
          b.sort_order
      );

    const currentIndex =
      placementRows.findIndex(
        (item) => item.id === row.id
      );

    if (currentIndex === -1) return;

    const nextIndex =
      direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;

    if (
      nextIndex < 0 ||
      nextIndex >=
      placementRows.length
    ) {
      return;
    }

    const reordered = [
      ...placementRows,
    ];

    const [moved] = reordered.splice(
      currentIndex,
      1
    );

    reordered.splice(
      nextIndex,
      0,
      moved
    );

    const items = reordered.map(
      (item, index) => ({
        id: item.id,
        sort_order: index + 1,
      })
    );

    try {
      setUpdatingId(row.id);

      await bannerApi.reorder(items);

      toast.success(
        "Banner order updated"
      );

      await loadRows();
    } catch (error: any) {
      toast.error(
        error?.message ||
        "Failed to reorder banners"
      );
    } finally {
      setUpdatingId(null);
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
            Banners
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage promotional banners
            displayed across the Glowee app.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadRows(true)
          }
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing
                ? "animate-spin"
                : ""
              }`}
          />

          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total banners"
          value={String(stats.total)}
        />

        <StatCard
          label="Active"
          value={String(stats.active)}
        />

        <StatCard
          label="Inactive"
          value={String(stats.inactive)}
        />

        <StatCard
          label="Placements"
          value={String(
            stats.placements
          )}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        {/* Form */}
        <section className="h-fit rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {editingId
                  ? "Edit banner"
                  : "Create banner"}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {editingId
                  ? "Update banner content and visibility."
                  : "Add a new banner to the mobile app."}
              </p>
            </div>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-medium text-gray-500 transition hover:text-gray-900"
              >
                Cancel
              </button>
            ) : null}
          </div>

          <form
            onSubmit={handleSave}
            className="space-y-5 p-5"
          >
            <Field
              label="Title"
              optional
            >
              <input
                value={form.title}
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,
                      title:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="Banner title"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
            </Field>

            <Field label="Placement">
              <select
                value={form.placement}
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,
                      placement:
                        event.target
                          .value,
                    })
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                {PLACEMENT_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field label="Banner image">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm font-medium text-gray-600 transition hover:border-primary-300 hover:bg-primary-50/40">
                <Upload className="h-4 w-4" />

                {uploading
                  ? "Uploading..."
                  : "Upload image"}

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={uploading}
                  onChange={(
                    event
                  ) =>
                    handleUpload(
                      event.target
                        .files?.[0] ||
                      null
                    )
                  }
                  className="hidden"
                />
              </label>

              <p className="mt-2 text-xs text-gray-400">
                JPG, PNG or WEBP · max 8 MB
              </p>
            </Field>

            {form.image_url ? (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <div className="aspect-[16/7] w-full">
                  <img
                    src={absoluteImageUrl(
                      form.image_url
                    )}
                    alt="Banner preview"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="border-t border-gray-100 px-3 py-2">
                  <p className="truncate font-mono text-[11px] text-gray-400">
                    {form.image_url}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Field
                label="Starts at"
                optional
              >
                <input
                  type="datetime-local"
                  value={
                    form.starts_at
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        starts_at:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </Field>

              <Field
                label="Ends at"
                optional
              >
                <input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        ends_at:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </Field>
            </div>

            <Field
              label="Action"
              optional
            >
              <select
                value={form.action_type}
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,
                      action_type:
                        event.target
                          .value,
                    })
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                {ACTION_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value ||
                        "none"
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  )
                )}
              </select>
            </Field>

            {form.action_type ? (
              <Field label="Action value">
                <input
                  value={
                    form.action_value
                  }
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        action_value:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder={
                    form.action_type ===
                      "url"
                      ? "https://..."
                      : form.action_type ===
                        "salon"
                        ? "Business ID"
                        : "Category"
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </Field>
            ) : null}

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Active banner
                </p>

                <p className="mt-0.5 text-xs text-gray-500">
                  Allow this banner to appear in the app.
                </p>
              </div>

              <input
                type="checkbox"
                checked={
                  form.is_active
                }
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,
                      is_active:
                        event.target
                          .checked,
                    })
                  )
                }
                className="h-4 w-4 accent-primary-600"
              />
            </label>

            <button
              type="submit"
              disabled={
                saving ||
                uploading ||
                !form.image_url
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
            >
              {editingId ? (
                <Pencil className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}

              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Create banner"}
            </button>
          </form>
        </section>

        {/* Banner list */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-col justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Banner library
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {filteredRows.length} banner
                {filteredRows.length === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            <select
              value={filterPlacement}
              onChange={(event) =>
                setFilterPlacement(
                  event.target.value
                )
              }
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            >
              <option value="all">
                All placements
              </option>

              {PLACEMENT_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          {loading ? (
            <div className="px-5 py-16 text-center text-sm text-gray-500">
              Loading banners...
            </div>
          ) : filteredRows.length ===
            0 ? (
            <div className="px-5 py-16 text-center">
              <ImageIcon className="mx-auto h-7 w-7 text-gray-300" />

              <p className="mt-3 text-sm font-medium text-gray-900">
                No banners found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Create your first mobile banner to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredRows.map(
                (row) => (
                  <BannerItem
                    key={row.id}
                    row={row}
                    busy={
                      updatingId ===
                      row.id ||
                      deletingId ===
                      row.id
                    }
                    onEdit={() =>
                      startEdit(row)
                    }
                    onToggle={() =>
                      toggleActive(row)
                    }
                    onDelete={() =>
                      handleDelete(row)
                    }
                    onMoveUp={() =>
                      moveBanner(
                        row,
                        "up"
                      )
                    }
                    onMoveDown={() =>
                      moveBanner(
                        row,
                        "down"
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function BannerItem({
  row,
  busy,
  onEdit,
  onToggle,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  row: BannerRow;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="p-5">
      <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          <div className="aspect-[16/8] w-full">
            <img
              src={absoluteImageUrl(
                row.image_url
              )}
              alt={
                row.title ||
                "Glowee banner"
              }
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900">
                  {row.title ||
                    "Untitled banner"}
                </h3>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.is_active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-gray-600"
                    }`}
                >
                  {row.is_active
                    ? "Active"
                    : "Inactive"}
                </span>

                <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                  {prettify(
                    row.placement
                  )}
                </span>
              </div>

              <p className="mt-2 text-xs text-gray-400">
                Order #{row.sort_order}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onEdit}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>

              <button
                type="button"
                onClick={onToggle}
                disabled={busy}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {row.is_active
                  ? "Disable"
                  : "Enable"}
              </button>

              <button
                type="button"
                onClick={onDelete}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Detail
              label="Action"
              value={
                row.action_type
                  ? `${prettify(
                    row.action_type
                  )}${row.action_value
                    ? ` · ${row.action_value}`
                    : ""
                  }`
                  : "No action"
              }
            />

            <Detail
              label="Schedule"
              value={
                row.starts_at ||
                  row.ends_at
                  ? `${formatDate(
                    row.starts_at
                  )} → ${formatDate(
                    row.ends_at
                  )}`
                  : "Always available"
              }
            />

            <Detail
              label="Image path"
              value={row.image_url}
              mono
            />

            <Detail
              label="Banner ID"
              value={row.id}
              mono
            />
          </div>

          <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4">
            <span className="mr-1 text-xs font-medium text-gray-500">
              Display order
            </span>

            <button
              type="button"
              onClick={onMoveUp}
              disabled={busy}
              title="Move up"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onMoveDown}
              disabled={busy}
              title="Move down"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>

            <span className="ml-1 text-xs text-gray-400">
              #{row.sort_order}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  optional = false,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-gray-900">
          {label}
        </label>

        {optional ? (
          <span className="text-xs text-gray-400">
            Optional
          </span>
        ) : null}
      </div>

      {children}
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p
        className={`mt-1.5 text-sm text-gray-700 ${mono
            ? "break-all font-mono text-xs"
            : ""
          }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}