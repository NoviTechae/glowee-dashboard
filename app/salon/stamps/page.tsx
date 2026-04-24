// app/salon/stamps/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Loading } from "@/app/components/ui/Loading";
import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";

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
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  async function loadSettings() {
    try {
      setLoading(true);

      const res = await request("/dashboard/salon/stamps");

      if (res?.data) {
        setForm({
          stamps_required: Number(res.data.stamps_required || 6),
          reward_text: res.data.reward_text || "Free Reward",
          stamp_images: Array.isArray(res.data.stamp_images)
            ? res.data.stamp_images
            : [],
          is_active: Boolean(res.data.is_active),
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);

      await request("/dashboard/salon/stamps", "PUT", form);

      toast.success("Stamp settings updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) return <Loading size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Loyalty Stamp Settings
        </h1>
        <p className="text-gray-600">
          Control how your customers earn rewards and loyalty stamps
        </p>
      </div>

      <Card>
        <div className="space-y-6">
          {/* Enable */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Enable Loyalty Program
              </h2>
              <p className="text-sm text-gray-500">
                Turn stamp rewards on or off for your salon
              </p>
            </div>

            <button
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  is_active: !prev.is_active,
                }))
              }
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                form.is_active ? "bg-pink-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                  form.is_active ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Stamps Required */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Number of Stamps Required
            </label>

            <input
              type="number"
              min={1}
              max={20}
              value={form.stamps_required}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  stamps_required: Number(e.target.value || 1),
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            />

            <p className="mt-2 text-xs text-gray-500">
              Example: 6 means customer gets reward after collecting 6 stamps
            </p>
          </div>

          {/* Reward Text */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Reward Description
            </label>

            <input
              type="text"
              placeholder="Example: Free Blow Dry"
              value={form.reward_text}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  reward_text: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            />

            <p className="mt-2 text-xs text-gray-500">
              This is what customers will see as their reward
            </p>
          </div>

          {/* Preview */}
          <div className="rounded-xl border bg-gray-50 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">
              Customer Preview
            </h3>

            <div className="space-y-2 text-sm">
              <p>
                Collect{" "}
                <span className="font-bold text-pink-600">
                  {form.stamps_required}
                </span>{" "}
                stamps
              </p>

              <p>
                Reward:{" "}
                <span className="font-bold text-emerald-600">
                  {form.reward_text || "Free Reward"}
                </span>
              </p>

              <p>
                Status:{" "}
                <span
                  className={`font-semibold ${
                    form.is_active
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {form.is_active ? "Active" : "Disabled"}
                </span>
              </p>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}