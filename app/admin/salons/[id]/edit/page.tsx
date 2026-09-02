// app/admin/salons/[id]/edit/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Check,
  Globe2,
  Home,
  Instagram,
  Mail,
  Phone,
  Save,
  Store,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";

type SalonType = "in_salon" | "home" | "both";

type Salon = {
  id: string;
  name: string;
  salon_type: SalonType;
  about?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  phone?: string | null;
  email?: string | null;
  instagram?: string | null;
  website?: string | null;
  is_active: boolean;
};

const clean = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

export default function EditSalonPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const salonId = String(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [originalSalon, setOriginalSalon] =
    useState<Salon | null>(null);

  const [name, setName] = useState("");
  const [salonType, setSalonType] =
    useState<SalonType>("in_salon");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [about, setAbout] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    loadSalon();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId]);

  async function loadSalon() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/dashboard/admin/salons/${salonId}`
      );

      const salon = response.salon as Salon;

      setOriginalSalon(salon);

      setName(salon.name || "");
      setSalonType(salon.salon_type || "in_salon");
      setPhone(salon.phone || "");
      setEmail(salon.email || "");
      setAbout(salon.about || "");
      setWebsite(salon.website || "");
      setInstagram(salon.instagram || "");
      setLogoUrl(salon.logo_url || "");
      setCoverUrl(salon.cover_url || "");
      setIsActive(Boolean(salon.is_active));
    } catch (e: any) {
      setError(
        e?.message || "Failed to load business"
      );
    } finally {
      setLoading(false);
    }
  }

  const canSave = useMemo(() => {
    if (name.trim().length < 2) return false;

    if (
      email.trim() &&
      !email.trim().includes("@")
    ) {
      return false;
    }

    return true;
  }, [name, email]);

  const hasChanges = useMemo(() => {
    if (!originalSalon) return false;

    return (
      name.trim() !==
      (originalSalon.name || "").trim() ||
      salonType !== originalSalon.salon_type ||
      clean(phone) !==
      (originalSalon.phone || null) ||
      clean(email) !==
      (originalSalon.email || null) ||
      clean(about) !==
      (originalSalon.about || null) ||
      clean(website) !==
      (originalSalon.website || null) ||
      clean(instagram) !==
      (originalSalon.instagram || null) ||
      clean(logoUrl) !==
      (originalSalon.logo_url || null) ||
      clean(coverUrl) !==
      (originalSalon.cover_url || null) ||
      isActive !== Boolean(originalSalon.is_active)
    );
  }, [
    originalSalon,
    name,
    salonType,
    phone,
    email,
    about,
    website,
    instagram,
    logoUrl,
    coverUrl,
    isActive,
  ]);

  async function handleSave() {
    setError("");

    if (name.trim().length < 2) {
      setError(
        "Business name must contain at least 2 characters."
      );
      return;
    }

    if (
      email.trim() &&
      !email.trim().includes("@")
    ) {
      setError(
        "Please enter a valid business email."
      );
      return;
    }

    setSaving(true);

    try {
      await api.put(
        `/dashboard/admin/salons/${salonId}`,
        {
          name: name.trim(),
          salon_type: salonType,
          phone: clean(phone),
          email: clean(email),
          about: clean(about),
          website: clean(website),
          instagram: clean(instagram),
          logo_url: clean(logoUrl),
          cover_url: clean(coverUrl),
          is_active: isActive,
        }
      );

      toast.success("Business updated");

      router.push(`/admin/salons/${salonId}`);
      router.refresh();
    } catch (e: any) {
      const message =
        e?.message || "Failed to update business";

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
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500" />
          <p className="mt-3 text-sm text-gray-500">
            Loading business...
          </p>
        </div>
      </div>
    );
  }

  if (!originalSalon) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-700">
            {error || "Business not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Back */}
      <Link
        href={`/admin/salons/${salonId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to business
      </Link>

      {/* Header */}
      <div>
        <p className="text-sm font-medium text-primary-600">
          Business details
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
          Edit business
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Update business information and availability on
          Glowee.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main details */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900">
            Business information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Core information shown across Glowee.
          </p>
        </div>

        <div className="space-y-7 p-6">
          <Field
            label="Business name"
            required
          >
            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className={inputClass}
              placeholder="Business name"
            />
          </Field>

          {/* Type */}
          <div>
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-800">
                Business type{" "}
                <span className="text-red-500">
                  *
                </span>
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Choose how customers receive services from
                this business.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <TypeCard
                icon={Store}
                title="In-salon"
                description="Customers visit a physical salon location."
                active={salonType === "in_salon"}
                onClick={() =>
                  setSalonType("in_salon")
                }
              />

              <TypeCard
                icon={Home}
                title="Home service"
                description="Services are delivered at the customer's location."
                active={salonType === "home"}
                onClick={() =>
                  setSalonType("home")
                }
              />

              <TypeCard
                icon={Building2}
                title="In-salon + home"
                description="The business can support both service modes."
                active={salonType === "both"}
                onClick={() =>
                  setSalonType("both")
                }
              />
            </div>

            {salonType !==
              originalSalon.salon_type && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Changing the business type does not
                  automatically create, delete, or update its
                  existing locations.
                </div>
              )}
          </div>

          {/* Contact */}
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Contact information
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Business contact details shown internally
                and across relevant Glowee experiences.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Phone">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                    className={`${inputClass} pl-10`}
                    placeholder="+971 50 000 0000"
                  />
                </div>
              </Field>

              <Field label="Business email">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className={`${inputClass} pl-10`}
                    placeholder="contact@business.ae"
                  />
                </div>
              </Field>
            </div>
          </div>

          {/* About */}
          <Field
            label="About"
            hint={`${about.length}/500`}
          >
            <textarea
              value={about}
              onChange={(e) =>
                setAbout(
                  e.target.value.slice(0, 500)
                )
              }
              rows={5}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              placeholder="Short description about this business..."
            />
          </Field>
        </div>
      </div>

      {/* Online presence */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900">
            Online presence
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Optional links and profile assets.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
          <Field label="Website">
            <div className="relative">
              <Globe2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                value={website}
                onChange={(e) =>
                  setWebsite(e.target.value)
                }
                className={`${inputClass} pl-10`}
                placeholder="https://business.ae"
              />
            </div>
          </Field>

          <Field label="Instagram">
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                value={instagram}
                onChange={(e) =>
                  setInstagram(e.target.value)
                }
                className={`${inputClass} pl-10`}
                placeholder="@business"
              />
            </div>
          </Field>

          <Field label="Logo URL">
            <input
              value={logoUrl}
              onChange={(e) =>
                setLogoUrl(e.target.value)
              }
              className={inputClass}
              placeholder="https://..."
            />
          </Field>

          <Field label="Cover URL">
            <input
              value={coverUrl}
              onChange={(e) =>
                setCoverUrl(e.target.value)
              }
              className={inputClass}
              placeholder="https://..."
            />
          </Field>
        </div>
      </div>

      {/* Status */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Business status
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Control whether this business is active on
              Glowee.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setIsActive((current) => !current)
            }
            className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${isActive
                ? "bg-primary-600"
                : "bg-gray-200"
              }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${isActive
                  ? "left-6"
                  : "left-1"
                }`}
            />
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Current status:{" "}
          <span className="font-medium text-gray-900">
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            router.push(`/admin/salons/${salonId}`)
          }
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={
            !canSave ||
            !hasChanges ||
            saving
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100";

function Field({
  label,
  children,
  required = false,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-800">
          {label}
          {required && (
            <span className="ml-1 text-red-500">
              *
            </span>
          )}
        </span>

        {hint && (
          <span className="text-xs text-gray-400">
            {hint}
          </span>
        )}
      </div>

      {children}
    </label>
  );
}

function TypeCard({
  icon: Icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl border p-4 text-left transition ${active
          ? "border-primary-300 bg-primary-50/50 ring-1 ring-primary-200"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
        }`}
    >
      {active && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white">
          <Check className="h-3 w-3" />
        </div>
      )}

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${active
            ? "bg-white text-primary-600"
            : "bg-gray-50 text-gray-500"
          }`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm font-semibold text-gray-900">
        {title}
      </p>

      <p className="mt-1 pr-4 text-xs leading-5 text-gray-500">
        {description}
      </p>
    </button>
  );
}