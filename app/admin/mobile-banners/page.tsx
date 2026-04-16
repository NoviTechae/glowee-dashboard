"use client";

import { useEffect, useMemo, useState } from "react";
import { bannerApi } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

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

function absoluteImageUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

function toDatetimeLocalValue(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function MobileBannersAdminPage() {
  const [rows, setRows] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [filterPlacement, setFilterPlacement] = useState("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const filteredRows = useMemo(() => {
    if (filterPlacement === "all") return rows;
    return rows.filter((x) => x.placement === filterPlacement);
  }, [rows, filterPlacement]);

  useEffect(() => {
    loadRows();
  }, []);

  async function loadRows() {
    try {
      setLoading(true);
      setError(null);

      const json = await bannerApi.getAll();
      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load banners");
    } finally {
      setLoading(false);
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
      placement: row.placement ?? "home",
      is_active: Boolean(row.is_active),
      starts_at: toDatetimeLocalValue(row.starts_at),
      ends_at: toDatetimeLocalValue(row.ends_at),
      action_type: row.action_type ?? "",
      action_value: row.action_value ?? "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleUpload(file?: File | null) {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      const res = await bannerApi.upload(file);

      setForm((prev) => ({
        ...prev,
        image_url: res?.image_url || "",
      }));
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      if (!form.image_url?.trim()) {
        throw new Error("Please upload banner image first");
      }

      const payload = {
        title: form.title?.trim() || null,
        image_url: form.image_url.trim(),
        placement: form.placement || "home",
        is_active: Boolean(form.is_active),

        // لو تبين بدون وقت، خليه null
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,

        action_type: form.action_type || null,
        action_value: form.action_value || null,
      };

      if (editingId) {
        await bannerApi.update(editingId, payload);
      } else {
        await bannerApi.create(payload);
      }

      resetForm();
      await loadRows();
    } catch (e: any) {
      setError(e?.message || "Failed to save banner");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Delete this banner?");
    if (!ok) return;

    try {
      setError(null);
      await bannerApi.delete(id);

      if (editingId === id) resetForm();
      await loadRows();
    } catch (e: any) {
      setError(e?.message || "Failed to delete banner");
    }
  }

  async function toggleActive(row: BannerRow) {
    try {
      setError(null);
      await bannerApi.update(row.id, {
        is_active: !row.is_active,
      });
      await loadRows();
    } catch (e: any) {
      setError(e?.message || "Failed to update banner");
    }
  }

  async function changeSort(row: BannerRow, nextSort: number) {
    try {
      setError(null);
      await bannerApi.update(row.id, {
        sort_order: nextSort,
      });
      await loadRows();
    } catch (e: any) {
      setError(e?.message || "Failed to update sort order");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mobile Banners</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage app banners from dashboard instead of hardcoded images.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <div className="rounded-3xl border bg-white p-5 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              {editingId ? "Edit Banner" : "Create Banner"}
            </h2>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-semibold text-gray-500 hover:text-black"
              >
                Cancel
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-2">Title</label>
              <input
                value={form.title ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                placeholder="Optional banner title"
              />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Placement</label>
              <select
                value={form.placement ?? "home"}
                onChange={(e) => setForm((p) => ({ ...p, placement: e.target.value }))}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
              >
                <option value="home">home</option>
                <option value="home_services">home_services</option>
                <option value="salon">salon</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Upload Image</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleUpload(e.target.files?.[0] || null)}
                className="block w-full text-sm"
              />
              {uploading ? (
                <p className="text-xs text-gray-500 mt-2">Uploading...</p>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Uploaded Image</label>
              <input
                value={form.image_url ?? ""}
                readOnly
                className="w-full rounded-2xl border px-4 py-3 outline-none bg-gray-50 text-gray-500"
                placeholder="Image will appear here after upload"
              />
            </div>

            {form.image_url ? (
              <div className="rounded-2xl overflow-hidden border bg-gray-50">
                <div className="relative w-full h-44">
                  <img
                    src={absoluteImageUrl(form.image_url)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Starts At</label>
                <input
                  type="datetime-local"
                  value={form.starts_at ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))}
                  className="w-full rounded-2xl border px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Ends At</label>
                <input
                  type="datetime-local"
                  value={form.ends_at ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, ends_at: e.target.value }))}
                  className="w-full rounded-2xl border px-4 py-3 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Action Type</label>
              <select
                value={form.action_type ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, action_type: e.target.value }))}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
              >
                <option value="">none</option>
                <option value="salon">salon</option>
                <option value="category">category</option>
                <option value="url">url</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Action Value</label>
              <input
                value={form.action_value ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, action_value: e.target.value }))}
                className="w-full rounded-2xl border px-4 py-3 outline-none"
                placeholder="salon id / category / url"
              />
            </div>

            <label className="flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(form.is_active)}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              />
              <span className="text-sm font-semibold">Active</span>
            </label>

            <button
              type="submit"
              disabled={saving || uploading || !form.image_url}
              className="w-full rounded-2xl bg-black text-white py-3 font-bold disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update Banner" : "Create Banner"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold">Banners</h2>

            <div className="flex items-center gap-2">
              <select
                value={filterPlacement}
                onChange={(e) => setFilterPlacement(e.target.value)}
                className="rounded-2xl border px-4 py-2 outline-none"
              >
                <option value="all">All placements</option>
                <option value="home">home</option>
                <option value="home_services">home_services</option>
                <option value="salon">salon</option>
              </select>

              <button
                onClick={loadRows}
                className="rounded-2xl border px-4 py-2 font-semibold hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-500">Loading banners...</div>
          ) : filteredRows.length === 0 ? (
            <div className="py-16 text-center text-gray-500">No banners found</div>
          ) : (
            <div className="space-y-4">
              {filteredRows.map((row) => (
                <div key={row.id} className="rounded-3xl border overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
                    <div className="relative min-h-[180px] bg-gray-100">
                      <img
                        src={absoluteImageUrl(row.image_url)}
                        alt={row.title || "banner"}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold">{row.title || "Untitled Banner"}</h3>

                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                              {row.placement}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                row.is_active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {row.is_active ? "Active" : "Inactive"}
                            </span>

                            <span className="rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold">
                              Sort: {row.sort_order}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => startEdit(row)}
                            className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => toggleActive(row)}
                            className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                          >
                            {row.is_active ? "Disable" : "Enable"}
                          </button>

                          <button
                            onClick={() => handleDelete(row.id)}
                            className="rounded-2xl border border-red-200 text-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-semibold text-gray-500">Image:</span>
                          <div className="break-all">{row.image_url}</div>
                        </div>

                        <div>
                          <span className="font-semibold text-gray-500">Action:</span>
                          <div>
                            {row.action_type || "none"}
                            {row.action_value ? ` · ${row.action_value}` : ""}
                          </div>
                        </div>

                        <div>
                          <span className="font-semibold text-gray-500">Starts:</span>
                          <div>{row.starts_at || "-"}</div>
                        </div>

                        <div>
                          <span className="font-semibold text-gray-500">Ends:</span>
                          <div>{row.ends_at || "-"}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-sm font-semibold text-gray-500">Sort order:</span>

                        <button
                          onClick={() =>
                            changeSort(row, Math.max(1, Number(row.sort_order || 1) - 1))
                          }
                          className="rounded-xl border px-3 py-1 text-sm font-semibold"
                        >
                          -1
                        </button>

                        <button
                          onClick={() => changeSort(row, Number(row.sort_order || 0) + 1)}
                          className="rounded-xl border px-3 py-1 text-sm font-semibold"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}