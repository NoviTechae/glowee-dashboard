"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  MessageSquareMore,
  Send,
  Wrench,
} from "lucide-react";
import { api } from "@/lib/api";

type FeedbackType = "feature" | "improvement" | "problem" | "other";

type FeedbackItem = {
  id: string;
  type: FeedbackType;
  title: string;
  message: string;
  status: "new" | "reviewing" | "planned" | "completed" | "declined";
  created_at: string;
};

const typeOptions = [
  {
    value: "feature" as const,
    label: "Suggest a feature",
    description: "Share a feature you would like to see in Glowee.",
    icon: Lightbulb,
  },
  {
    value: "improvement" as const,
    label: "Improvement",
    description: "Tell us what could work better.",
    icon: Wrench,
  },
  {
    value: "problem" as const,
    label: "Report a problem",
    description: "Let us know about an issue you experienced.",
    icon: AlertCircle,
  },
  {
    value: "other" as const,
    label: "Other",
    description: "Share any other feedback with us.",
    icon: MessageSquareMore,
  },
];

const statusLabel: Record<FeedbackItem["status"], string> = {
  new: "New",
  reviewing: "Reviewing",
  planned: "Planned",
  completed: "Completed",
  declined: "Declined",
};

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>("feature");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadFeedback() {
    try {
      setLoading(true);
      const json = await api.get("/dashboard/salon/partner-feedback");
      setItems(json.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setSending(true);
      setError(null);
      setSuccess(null);

      await api.post("/dashboard/salon/partner-feedback", {
        type,
        title: title.trim(),
        message: message.trim(),
      });

      setTitle("");
      setMessage("");
      setType("feature");

      setSuccess(
        "Thank you. Your feedback has been sent to the Glowee team."
      );

      await loadFeedback();
    } catch (e: any) {
      setError(e?.message || "Failed to send feedback.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Feedback
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Help us improve Glowee. Share an idea, suggest an improvement,
          or report something that needs attention.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Share your feedback
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Your feedback helps shape future improvements to Glowee.
          </p>
        </div>

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />

            <p className="text-sm text-green-800">
              {success}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />

            <p className="text-sm text-red-800">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-800">
              Feedback type
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              {typeOptions.map((option) => {
                const Icon = option.icon;
                const selected = type === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={`rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-pink-400 bg-pink-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          selected
                            ? "bg-pink-100 text-pink-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {option.label}
                        </div>

                        <div className="mt-1 text-xs leading-5 text-gray-500">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="feedback-title"
              className="mb-2 block text-sm font-medium text-gray-800"
            >
              Title
            </label>

            <input
              id="feedback-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              minLength={3}
              maxLength={150}
              required
              placeholder="A short summary of your feedback"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="feedback-message"
                className="text-sm font-medium text-gray-800"
              >
                Tell us more
              </label>

              <span className="text-xs text-gray-400">
                {message.length}/5000
              </span>
            </div>

            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              minLength={5}
              maxLength={5000}
              required
              rows={6}
              placeholder="Describe your suggestion, improvement, or issue..."
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-xl bg-pink-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {sending ? "Sending..." : "Send feedback"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Your feedback
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Track the feedback you have shared with Glowee.
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            Loading feedback...
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <MessageSquareMore className="mx-auto h-10 w-10 text-gray-300" />

            <p className="mt-3 text-sm font-medium text-gray-700">
              No feedback submitted yet
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Anything you send will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="px-6 py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        {item.title}
                      </h3>

                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600">
                        {item.type}
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                      {item.message}
                    </p>

                    <p className="mt-3 text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                    {statusLabel[item.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}