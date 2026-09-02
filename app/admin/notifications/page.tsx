// app/admin/notifications/page.tsx
"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";

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
    label: "Launch announcement",
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
    label: "Gift received",
    title: "You received a gift 🎁",
    body: "Open Glowee to view your gift and claim it.",
    type: "gift_received",
  },
  {
    key: "booking_reminder",
    label: "Booking reminder",
    title: "Appointment reminder ⏰",
    body: "Your appointment is coming up soon. Check Glowee for details.",
    type: "reminder",
  },
  {
    key: "booking_confirmed",
    label: "Booking confirmed",
    title: "Booking confirmed ✅",
    body: "Your appointment has been confirmed. See you soon!",
    type: "booking_confirmed",
  },
];

const SEGMENTS = [
  { value: "", label: "Select segment" },
  { value: "active_users", label: "Active users · last 7 days" },
  { value: "inactive_users", label: "Inactive users · 30+ days" },
  { value: "with_bookings", label: "Users with bookings" },
  { value: "with_gifts", label: "Users with gifts" },
  { value: "with_streak", label: "Users with streak" },
];

const TYPES = [
  { value: "general", label: "General" },
  { value: "promotion", label: "Promotion" },
  { value: "reminder", label: "Reminder" },
  { value: "announcement", label: "Announcement" },
  { value: "gift_received", label: "Gift received" },
  { value: "booking_confirmed", label: "Booking confirmed" },
  { value: "booking_cancelled", label: "Booking cancelled" },
];

const TITLE_LIMIT = 60;
const BODY_LIMIT = 160;

const EMPTY_FORM: FormState = {
  title: "",
  body: "",
  targetType: "all",
  userId: "",
  segment: "",
  type: "general",
  deepLink: "",
  imageUrl: "",
  promoCode: "",
};

function buildTargetLabel(form: FormState) {
  if (form.targetType === "all") return "All Glowee users";

  if (form.targetType === "specific_user") {
    return form.userId
      ? `User #${form.userId}`
      : "Specific user";
  }

  const segment = SEGMENTS.find(
    (item) => item.value === form.segment
  );

  return segment?.label || "User segment";
}

function buildDataPayload(form: FormState) {
  const payload: Record<string, string> = {};

  if (form.deepLink.trim()) {
    payload.deep_link = form.deepLink.trim();
  }

  if (form.imageUrl.trim()) {
    payload.image_url = form.imageUrl.trim();
  }

  if (form.promoCode.trim()) {
    payload.promo_code = form.promoCode.trim();
  }

  return Object.keys(payload).length
    ? payload
    : undefined;
}

export default function NotificationsPage() {
  const [loading, setLoading] =
    useState(false);

  const [selectedTemplate, setSelectedTemplate] =
    useState("custom");

  const [showAdvanced, setShowAdvanced] =
    useState(false);

  const [form, setForm] =
    useState<FormState>(EMPTY_FORM);

  const titleCount = form.title.length;
  const bodyCount = form.body.length;

  const validationError = useMemo(() => {
    if (!form.title.trim()) {
      return "Title is required.";
    }

    if (!form.body.trim()) {
      return "Message is required.";
    }

    if (titleCount > TITLE_LIMIT) {
      return `Title must be ${TITLE_LIMIT} characters or less.`;
    }

    if (bodyCount > BODY_LIMIT) {
      return `Message must be ${BODY_LIMIT} characters or less.`;
    }

    if (
      form.targetType === "specific_user" &&
      !form.userId.trim()
    ) {
      return "User ID is required for a specific user.";
    }

    if (
      form.targetType === "user_segment" &&
      !form.segment
    ) {
      return "Please select a user segment.";
    }

    return "";
  }, [form, titleCount, bodyCount]);

  const canSend =
    !loading && !validationError;

  function resetForm() {
    setSelectedTemplate("custom");
    setShowAdvanced(false);
    setForm({ ...EMPTY_FORM });
  }

  function applyTemplate(templateKey: string) {
    setSelectedTemplate(templateKey);

    const template =
      NOTIFICATION_TEMPLATES.find(
        (item) =>
          item.key === templateKey
      );

    if (!template) return;

    setForm((previous) => ({
      ...previous,
      title: template.title,
      body: template.body,
      type: template.type,
    }));
  }

  async function handleSend() {
    if (!canSend) return;

    const audience =
      buildTargetLabel(form);

    const confirmed = window.confirm(
      `Send this notification to ${audience}?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      const result =
        await notificationApi.send({
          title: form.title.trim(),
          body: form.body.trim(),
          targetType:
            form.targetType,
          userId:
            form.userId.trim() ||
            undefined,
          segment:
            form.segment ||
            undefined,
          type: form.type,
          data:
            buildDataPayload(form),
        });

      toast.success(
        `Delivered to ${result.count} Glowee inbox${
          result.count === 1 ? "" : "es"
        }`
      );

      resetForm();
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Failed to send notification"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-primary-600">
          Content
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
          Notifications
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Create inbox and push notifications for Glowee customers.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Composer */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <Bell className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Compose notification
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Choose an audience, write the message and review it before sending.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-7 p-6">
            {/* Templates */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gray-400" />

                <label className="text-sm font-medium text-gray-900">
                  Quick template
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {NOTIFICATION_TEMPLATES.map(
                  (template) => (
                    <button
                      key={template.key}
                      type="button"
                      onClick={() =>
                        applyTemplate(
                          template.key
                        )
                      }
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        selectedTemplate ===
                        template.key
                          ? "border-primary-300 bg-primary-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {template.label}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {TYPES.find(
                          (item) =>
                            item.value ===
                            template.type
                        )?.label ||
                          template.type}
                      </p>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Message */}
            <div className="grid gap-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-900">
                    Title
                  </label>

                  <span
                    className={`text-xs ${
                      titleCount >
                      TITLE_LIMIT
                        ? "text-red-500"
                        : "text-gray-400"
                    }`}
                  >
                    {titleCount}/
                    {TITLE_LIMIT}
                  </span>
                </div>

                <input
                  type="text"
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
                  placeholder="Notification title"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-900">
                    Message
                  </label>

                  <span
                    className={`text-xs ${
                      bodyCount >
                      BODY_LIMIT
                        ? "text-red-500"
                        : "text-gray-400"
                    }`}
                  >
                    {bodyCount}/
                    {BODY_LIMIT}
                  </span>
                </div>

                <textarea
                  value={form.body}
                  onChange={(event) =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        body:
                          event.target
                            .value,
                      })
                    )
                  }
                  rows={4}
                  placeholder="Write the notification message..."
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            {/* Audience */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />

                  <label className="text-sm font-medium text-gray-900">
                    Audience
                  </label>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      value: "all",
                      label: "All users",
                      description:
                        "Everyone receives it in the Glowee inbox.",
                    },
                    {
                      value:
                        "specific_user",
                      label:
                        "Specific user",
                      description:
                        "Send to one customer account.",
                    },
                    {
                      value:
                        "user_segment",
                      label:
                        "User segment",
                      description:
                        "Target customers matching a selected segment.",
                    },
                  ].map((item) => (
                    <label
                      key={item.value}
                      className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 transition ${
                        form.targetType ===
                        item.value
                          ? "border-primary-300 bg-primary-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        value={
                          item.value
                        }
                        checked={
                          form.targetType ===
                          item.value
                        }
                        onChange={(
                          event
                        ) =>
                          setForm(
                            (
                              previous
                            ) => ({
                              ...previous,
                              targetType:
                                event
                                  .target
                                  .value as TargetType,
                            })
                          )
                        }
                        className="mt-1 h-4 w-4 accent-primary-600"
                      />

                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.label}
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-gray-500">
                          {
                            item.description
                          }
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Notification type
                  </label>

                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm(
                        (previous) => ({
                          ...previous,
                          type:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  >
                    {TYPES.map(
                      (item) => (
                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {item.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {form.targetType ===
                "specific_user" ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                      User ID
                    </label>

                    <input
                      type="text"
                      value={
                        form.userId
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            userId:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Enter user ID"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                ) : null}

                {form.targetType ===
                "user_segment" ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                      Segment
                    </label>

                    <select
                      value={
                        form.segment
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            segment:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    >
                      {SEGMENTS.map(
                        (segment) => (
                          <option
                            key={
                              segment.value ||
                              "empty"
                            }
                            value={
                              segment.value
                            }
                          >
                            {
                              segment.label
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>
                ) : null}

                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-400">
                    Selected audience
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {buildTargetLabel(
                      form
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced */}
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() =>
                  setShowAdvanced(
                    (previous) =>
                      !previous
                  )
                }
                className="flex w-full items-center justify-between bg-gray-50 px-4 py-3.5 text-left transition hover:bg-gray-100"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Advanced options
                  </p>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Optional navigation and campaign metadata.
                  </p>
                </div>

                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {showAdvanced ? (
                <div className="grid gap-4 border-t border-gray-100 p-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-700">
                      Deep link
                    </label>

                    <input
                      value={
                        form.deepLink
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            deepLink:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="glowee://..."
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-700">
                      Image URL
                    </label>

                    <input
                      value={
                        form.imageUrl
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            imageUrl:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Optional image URL"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-700">
                      Promo code
                    </label>

                    <input
                      value={
                        form.promoCode
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            promoCode:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Optional code"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {validationError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {validationError}
              </div>
            ) : null}

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>

              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />

                {loading
                  ? "Sending..."
                  : "Send notification"}
              </button>
            </div>
          </div>
        </section>

        {/* Preview */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">
              Preview
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Approximate customer notification appearance.
            </p>

            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-sm font-semibold text-white">
                    G
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-900">
                        Glowee
                      </p>

                      <span className="text-[11px] text-gray-400">
                        now
                      </span>
                    </div>

                    <p className="mt-2 break-words text-sm font-medium text-gray-900">
                      {form.title ||
                        "Notification title"}
                    </p>

                    <p className="mt-1 break-words text-sm leading-5 text-gray-600">
                      {form.body ||
                        "Your notification message will appear here."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 divide-y divide-gray-100 rounded-xl border border-gray-200">
              <PreviewRow
                label="Audience"
                value={buildTargetLabel(
                  form
                )}
              />

              <PreviewRow
                label="Type"
                value={
                  TYPES.find(
                    (item) =>
                      item.value ===
                      form.type
                  )?.label ||
                  form.type
                }
              />

              <PreviewRow
                label="Deep link"
                value={
                  form.deepLink ||
                  "None"
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">
              Delivery
            </h3>

            <div className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
              <p>
                Every selected customer receives the notification in the Glowee inbox.
              </p>

              <p>
                Customers with a valid push token also receive an Expo push notification on their device.
              </p>

              <p>
                The delivery count confirms Glowee inbox creation; it does not guarantee device push delivery.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="text-xs text-gray-400">
        {label}
      </span>

      <span className="max-w-[220px] break-all text-right text-xs font-medium text-gray-700">
        {value}
      </span>
    </div>
  );
}