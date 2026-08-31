// app/salon/stamps/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Gift,
  Save,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";

type StampSettings = {
  stamps_required: number;
  reward_text: string;
  stamp_images: string[];
  is_active: boolean;
};

export default function SalonStampsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<StampSettings>({
    stamps_required: 6,
    reward_text: "Free Reward",
    stamp_images: [],
    is_active: true,
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function request(
    path: string,
    method: "GET" | "PUT" = "GET",
    body?: any
  ) {
    const token = getToken();

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },
      ...(body
        ? {
            body: JSON.stringify(body),
          }
        : {}),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || "Request failed"
      );
    }

    return data;
  }

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError(null);

        const res = await request(
          "/dashboard/salon/stamps"
        );

        if (res?.data) {
          setForm({
            stamps_required: Number(
              res.data.stamps_required || 6
            ),
            reward_text:
              res.data.reward_text ||
              "Free Reward",
            stamp_images: Array.isArray(
              res.data.stamp_images
            )
              ? res.data.stamp_images
              : [],
            is_active: Boolean(
              res.data.is_active
            ),
          });
        }
      } catch (error: any) {
        const message =
          error.message ||
          "Failed to load loyalty settings";

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function handleSave() {
    setError(null);
    setSuccess(null);

    if (
      !Number.isFinite(form.stamps_required) ||
      form.stamps_required < 1 ||
      form.stamps_required > 20
    ) {
      setError(
        "Stamps required must be between 1 and 20."
      );
      return;
    }

    if (!form.reward_text.trim()) {
      setError(
        "Please enter a reward description."
      );
      return;
    }

    try {
      setSaving(true);

      await request(
        "/dashboard/salon/stamps",
        "PUT",
        {
          ...form,
          stamps_required: Number(
            form.stamps_required
          ),
          reward_text:
            form.reward_text.trim(),
        }
      );

      setSuccess(
        "Loyalty settings updated."
      );

      toast.success(
        "Loyalty settings updated successfully"
      );
    } catch (error: any) {
      const message =
        error.message ||
        "Failed to save loyalty settings";

      setError(message);
      toast.error(message);
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
            Loading loyalty settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Loyalty
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm text-gray-500">
            Create a simple stamp-based reward
            program that encourages customers to
            return.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save changes
            </>
          )}
        </button>
      </div>

      {/* Messages */}
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

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <Check className="h-5 w-5 shrink-0 text-emerald-600" />

          <p className="text-sm font-medium text-emerald-700">
            {success}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        {/* Settings */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Loyalty program
                </h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  Set how many stamps customers need
                  and what they receive as a reward.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6">
            {/* Enable */}
            <SettingToggle
              title="Loyalty program active"
              description="Customers can collect stamps and earn rewards."
              checked={form.is_active}
              onChange={(checked) =>
                setForm((prev) => ({
                  ...prev,
                  is_active: checked,
                }))
              }
            />

            {/* Stamps */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Stamps required
              </label>

              <input
                type="number"
                min={1}
                max={20}
                value={form.stamps_required}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    stamps_required: Number(
                      e.target.value || 1
                    ),
                  }))
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />

              <p className="mt-1.5 text-xs text-gray-400">
                Example: 6 means the reward becomes
                available after 6 stamps.
              </p>
            </div>

            {/* Reward */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Reward description
              </label>

              <input
                type="text"
                value={form.reward_text}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    reward_text: e.target.value,
                  }))
                }
                placeholder="e.g. Free Blow Dry"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />

              <p className="mt-1.5 text-xs text-gray-400">
                This is the reward customers will see
                in Glowee.
              </p>
            </div>
          </div>
        </section>

        {/* Preview */}
        <section>
          <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Customer preview
              </p>

              <h2 className="mt-1 text-lg font-semibold text-gray-900">
                Loyalty card
              </h2>
            </div>

            <div className="mt-5 rounded-2xl border border-primary-100 bg-primary-50/50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-primary-600">
                    Glowee Loyalty
                  </p>

                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    Collect{" "}
                    {form.stamps_required}{" "}
                    {form.stamps_required === 1
                      ? "stamp"
                      : "stamps"}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm">
                  <Gift className="h-5 w-5" />
                </div>
              </div>

              {/* Stamps */}
              <div className="mt-6 flex flex-wrap gap-2">
                {Array.from({
                  length: Math.min(
                    form.stamps_required,
                    20
                  ),
                }).map((_, index) => (
                  <div
                    key={index}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-200 bg-white text-xs font-medium text-primary-500"
                  >
                    {index + 1}
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-primary-100 pt-4">
                <p className="text-xs text-gray-500">
                  Reward
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {form.reward_text.trim() ||
                    "Free Reward"}
                </p>
              </div>

              {!form.is_active && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-500">
                  Loyalty program currently disabled
                </div>
              )}
            </div>

            <p className="mt-4 text-xs leading-5 text-gray-400">
              The exact customer app design may differ,
              but these are the settings that control
              the loyalty experience.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function SettingToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-4">
      <div>
        <p className="text-sm font-medium text-gray-900">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? "bg-primary-600"
            : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked
              ? "left-[22px]"
              : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}