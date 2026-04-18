"use client";

import { useMemo, useState } from "react";
import { notificationApi } from "@/lib/api";

type TargetType = "all" | "specific_user" | "user_segment";

type FormState = {
  title: string;
  body: string;
  targetType: TargetType;
  userId: string;
  segment: string;
  type: string;
  deepLink: string;
  imageUrl: string;
  promoCode: string;
};

const NOTIFICATION_TEMPLATES = [
  {
    key: "custom",
    label: "Custom",
    title: "",
    body: "",
    type: "general",
  },
  {
    key: "launch",
    label: "Launch Announcement",
    title: "Glowee is here ✨",
    body: "Book. Gift. Earn. Everything in one place.",
    type: "announcement",
  },
  {
    key: "promotion",
    label: "Promotion",
    title: "Special offer just dropped 💖",
    body: "Open Glowee to discover today’s offers.",
    type: "promotion",
  },
  {
    key: "gift_received",
    label: "Gift Received",
    title: "You received a gift 🎁",
    body: "Open Glowee to view your gift and claim it.",
    type: "gift_received",
  },
  {
    key: "booking_reminder",
    label: "Booking Reminder",
    title: "Appointment reminder ⏰",
    body: "Your appointment is coming up soon. Check Glowee for details.",
    type: "reminder",
  },
  {
    key: "booking_confirmed",
    label: "Booking Confirmed",
    title: "Booking confirmed ✅",
    body: "Your appointment has been confirmed. See you soon!",
    type: "booking_confirmed",
  },
];

const SEGMENTS = [
  { value: "", label: "Select segment" },
  { value: "active_users", label: "Active Users (last 7 days)" },
  { value: "inactive_users", label: "Inactive Users (30+ days)" },
  { value: "with_bookings", label: "Users with Bookings" },
  { value: "with_gifts", label: "Users with Gifts" },
  { value: "with_streak", label: "Users with Streak" },
];

const TYPES = [
  { value: "general", label: "General" },
  { value: "promotion", label: "Promotion" },
  { value: "reminder", label: "Reminder" },
  { value: "announcement", label: "Announcement" },
  { value: "gift_received", label: "Gift Received" },
  { value: "booking_confirmed", label: "Booking Confirmed" },
  { value: "booking_cancelled", label: "Booking Cancelled" },
];

const TITLE_LIMIT = 60;
const BODY_LIMIT = 160;

function buildTargetLabel(form: FormState) {
  if (form.targetType === "all") return "All users";
  if (form.targetType === "specific_user") return form.userId ? `User #${form.userId}` : "Specific user";
  return form.segment || "User segment";
}

function buildDataPayload(form: FormState) {
  const payload: Record<string, any> = {};

  if (form.deepLink.trim()) payload.deep_link = form.deepLink.trim();
  if (form.imageUrl.trim()) payload.image_url = form.imageUrl.trim();
  if (form.promoCode.trim()) payload.promo_code = form.promoCode.trim();

  return Object.keys(payload).length ? payload : undefined;
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [form, setForm] = useState<FormState>({
    title: "",
    body: "",
    targetType: "all",
    userId: "",
    segment: "",
    type: "general",
    deepLink: "",
    imageUrl: "",
    promoCode: "",
  });

  const titleCount = form.title.length;
  const bodyCount = form.body.length;

  const validationError = useMemo(() => {
    if (!form.title.trim()) return "Title is required.";
    if (!form.body.trim()) return "Message is required.";
    if (titleCount > TITLE_LIMIT) return `Title must be ${TITLE_LIMIT} characters or less.`;
    if (bodyCount > BODY_LIMIT) return `Message must be ${BODY_LIMIT} characters or less.`;

    if (form.targetType === "specific_user" && !form.userId.trim()) {
      return "User ID is required for specific user.";
    }

    if (form.targetType === "user_segment" && !form.segment) {
      return "Please select a user segment.";
    }

    return "";
  }, [form, titleCount, bodyCount]);

  const canSend = !loading && !validationError;

  const applyTemplate = (templateKey: string) => {
    setSelectedTemplate(templateKey);

    const template = NOTIFICATION_TEMPLATES.find((t) => t.key === templateKey);
    if (!template) return;

    setForm((prev) => ({
      ...prev,
      title: template.title,
      body: template.body,
      type: template.type,
    }));
  };

  const handleSend = async () => {
    if (!canSend) return;

    try {
      setLoading(true);

      const result = await notificationApi.send({
        title: form.title.trim(),
        body: form.body.trim(),
        targetType: form.targetType,
        userId: form.userId.trim() || undefined,
        segment: form.segment || undefined,
        type: form.type,
        data: buildDataPayload(form),
      });

      alert(`✅ Notification sent to ${result.count} users!`);

      setSelectedTemplate("custom");
      setShowAdvanced(false);
      setForm({
        title: "",
        body: "",
        targetType: "all",
        userId: "",
        segment: "",
        type: "general",
        deepLink: "",
        imageUrl: "",
        promoCode: "",
      });
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500 mt-1">
          Send push notifications to all users, one user, or a selected segment.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Compose */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Compose Notification</h2>
            <p className="text-sm text-gray-500 mt-1">
              Keep it short, clear, and action-driven.
            </p>
          </div>

          {/* Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Template
            </label>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {NOTIFICATION_TEMPLATES.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => applyTemplate(template.key)}
                  className={`text-left rounded-xl border px-4 py-3 transition ${
                    selectedTemplate === template.key
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <p className="font-medium text-sm text-gray-900">{template.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{template.type}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <span
                className={`text-xs ${
                  titleCount > TITLE_LIMIT ? "text-red-500" : "text-gray-400"
                }`}
              >
                {titleCount}/{TITLE_LIMIT}
              </span>
            </div>
            <input
              type="text"
              placeholder="e.g. Glowee is here ✨"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <span
                className={`text-xs ${
                  bodyCount > BODY_LIMIT ? "text-red-500" : "text-gray-400"
                }`}
              >
                {bodyCount}/{BODY_LIMIT}
              </span>
            </div>
            <textarea
              placeholder="e.g. Book. Gift. Earn. Everything in one place."
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={4}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Target */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Audience</label>
              <div className="space-y-2">
                {[
                  { value: "all", label: "All Users" },
                  { value: "specific_user", label: "Specific User" },
                  { value: "user_segment", label: "User Segment" },
                ].map((item) => (
                  <label
                    key={item.value}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      value={item.value}
                      checked={form.targetType === item.value}
                      onChange={(e) =>
                        setForm({ ...form, targetType: e.target.value as TargetType })
                      }
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-800">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                {TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">Selected audience</p>
                <p className="text-sm font-semibold text-gray-900">{buildTargetLabel(form)}</p>
              </div>
            </div>
          </div>

          {/* Specific User */}
          {form.targetType === "specific_user" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
              <input
                type="text"
                placeholder="Enter user ID"
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          {/* Segment */}
          {form.targetType === "user_segment" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Segment</label>
              <select
                value={form.segment}
                onChange={(e) => setForm({ ...form, segment: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                {SEGMENTS.map((segment) => (
                  <option key={segment.value} value={segment.value}>
                    {segment.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Advanced */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-4 bg-gray-50 hover:bg-gray-100 text-left"
            >
              <span className="font-medium text-gray-800">Advanced Options</span>
              <span className="text-sm text-gray-500">{showAdvanced ? "Hide" : "Show"}</span>
            </button>

            {showAdvanced && (
              <div className="p-4 grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deep Link
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. glowee://offers"
                    value={form.deepLink}
                    onChange={(e) => setForm({ ...form, deepLink: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="Optional image"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promo Code
                  </label>
                  <input
                    type="text"
                    placeholder="Optional promo code"
                    value={form.promoCode}
                    onChange={(e) => setForm({ ...form, promoCode: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {!!validationError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {validationError}
            </div>
          )}

          {/* Send */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedTemplate("custom");
                setShowAdvanced(false);
                setForm({
                  title: "",
                  body: "",
                  targetType: "all",
                  userId: "",
                  segment: "",
                  type: "general",
                  deepLink: "",
                  imageUrl: "",
                  promoCode: "",
                });
              }}
              className="px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>

            <button
              onClick={handleSend}
              disabled={!canSend}
              className={`px-5 py-3 rounded-xl font-semibold text-white transition ${
                canSend
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>

            <div className="rounded-[28px] border border-gray-200 bg-black p-3 max-w-sm mx-auto">
              <div className="rounded-[22px] bg-white min-h-[300px] p-4 flex flex-col">
                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-4">
                  <span>9:41</span>
                  <span>Glowee Preview</span>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                      G
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm text-gray-900 truncate">Glowee</p>
                        <span className="text-[10px] text-gray-400">now</span>
                      </div>

                      <p className="font-semibold text-sm text-gray-900 mt-1 break-words">
                        {form.title || "Notification Title"}
                      </p>

                      <p className="text-sm text-gray-600 mt-1 break-words">
                        {form.body || "Notification message will appear here..."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Audience</span>
                    <span className="font-medium text-gray-900">{buildTargetLabel(form)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium text-gray-900 capitalize">{form.type}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Deep link</span>
                    <span className="font-medium text-gray-900 truncate max-w-[180px] text-right">
                      {form.deepLink || "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-5">
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                    <p className="text-sm font-medium text-blue-900">Delivery notes</p>
                    <ul className="mt-2 text-xs text-blue-800 space-y-1">
                      <li>• Push is sent only to users with a valid push token.</li>
                      <li>• Notification is also saved inside the app inbox.</li>
                      <li>• Keep title short and message action-focused.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Good practices</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Use 3–6 words in the title when possible.</li>
              <li>• Make the body clear and direct.</li>
              <li>• Promotions should feel useful, not spammy.</li>
              <li>• Use deep links when the notification should open a specific screen.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}