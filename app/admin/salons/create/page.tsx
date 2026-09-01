// app/admin/salons/create/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Home,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
  Plus,
  Store,
  Phone
} from "lucide-react";

import { api } from "@/lib/api";

type Step = 1 | 2;
type SalonType = "in_salon" | "home" | "both";

const clean = (value: string) => {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
};

export default function AdminCreateSalonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedType = searchParams.get("type");

  const initialType: SalonType = (
    ["in_salon", "home", "both"].includes(requestedType ?? "")
      ? requestedType
      : "in_salon"
  ) as SalonType;

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [salonType, setSalonType] =
    useState<SalonType>(initialType);

  // Business information
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Internal home-service location
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  // Dashboard account
  const [accountEmail, setAccountEmail] = useState("");
  const [password, setPassword] = useState("");

  const isHomeOnly = salonType === "home";

  const backHref =
    initialType === "home"
      ? "/admin/home-services"
      : "/admin/salons";

  const pageLabel =
    initialType === "home"
      ? "Home Services"
      : "Salons";

  const canGoNext = useMemo(() => {
    if (name.trim().length < 2) return false;

    if (isHomeOnly) {
      if (!city.trim()) return false;
      if (!area.trim()) return false;

      if (
        lat.trim() === "" ||
        lng.trim() === "" ||
        Number.isNaN(Number(lat)) ||
        Number.isNaN(Number(lng))
      ) {
        return false;
      }
    }

    return true;
  }, [name, isHomeOnly, city, area, lat, lng]);

  const canSubmit = useMemo(() => {
    return (
      accountEmail.trim().includes("@") &&
      password.length >= 6
    );
  }, [accountEmail, password]);

  function nextStep() {
    setErr("");

    if (name.trim().length < 2) {
      setErr(
        "Please enter a business name with at least 2 characters."
      );
      return;
    }

    if (email.trim() && !email.includes("@")) {
      setErr("Please enter a valid business email.");
      return;
    }

    if (isHomeOnly) {
      if (!city.trim()) {
        setErr(
          "Please enter the city for this home-service business."
        );
        return;
      }

      if (!area.trim()) {
        setErr(
          "Please enter the area for this home-service business."
        );
        return;
      }

      if (
        lat.trim() === "" ||
        Number.isNaN(Number(lat))
      ) {
        setErr("Please enter a valid latitude.");
        return;
      }

      if (
        lng.trim() === "" ||
        Number.isNaN(Number(lng))
      ) {
        setErr("Please enter a valid longitude.");
        return;
      }
    }

    if (
      !accountEmail &&
      email.trim() &&
      email.includes("@")
    ) {
      setAccountEmail(email.trim().toLowerCase());
    }

    setStep(2);
  }

  function prevStep() {
    setErr("");
    setStep(1);
  }

  async function submit() {
    setErr("");

    if (!canSubmit) {
      setErr(
        "Enter a valid dashboard email and a password with at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      await api.post("/dashboard/admin/salons", {
        salon: {
          name: name.trim(),
          salon_type: salonType,
          phone: clean(phone),
          email: clean(email),
          about: null,
          logo_url: null,
          cover_url: null,
          website: null,
        },

        account: {
          email: accountEmail.trim().toLowerCase(),
          password,
        },

        home_branch:
          salonType === "home"
            ? {
              name: `${name.trim()} Home`,
              country: "United Arab Emirates",
              city: city.trim(),
              area: area.trim(),
              address_line: clean(addressLine),
              lat: Number(lat),
              lng: Number(lng),
              supports_home_services: true,
              is_active: true,
            }
            : null,
      });

      router.replace(
        salonType === "home"
          ? "/admin/home-services"
          : "/admin/salons"
      );
    } catch (e: any) {
      setErr(e?.message || "Failed to create business");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Back */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {pageLabel.toLowerCase()}
      </Link>

      {/* Header */}
      <div>
        <p className="text-sm font-medium text-primary-600">
          Operations
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
          Add business
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Create the business and its Glowee dashboard
          account.
        </p>
      </div>

      {/* Progress */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
          <StepItem
            number={1}
            label="Business details"
            active={step === 1}
            complete={step > 1}
          />

          <div className="h-px bg-gray-200" />

          <StepItem
            number={2}
            label="Dashboard account"
            active={step === 2}
            complete={false}
          />
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {step === 1 ? (
        <div className="rounded-2xl border border-gray-200 bg-white">
          {/* Section header */}
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900">
              Business details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add the basic information needed to create
              this business on Glowee.
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
                placeholder="e.g. Clouds Beauty"
                className={inputClass}
              />
            </Field>

            {/* Business type */}
            <div>
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-800">
                  Business type{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Choose how customers receive services
                  from this business.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <TypeCard
                  icon={Store}
                  title="In-salon"
                  description="Customers visit a physical salon location."
                  active={
                    salonType === "in_salon"
                  }
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
            </div>

            {/* Contact */}
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Contact information
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Optional business contact details.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Phone">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />                    <input
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value)
                      }
                      placeholder="+971 50 000 0000"
                      className={`${inputClass} pl-10`}
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
                      placeholder="contact@business.ae"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </Field>
              </div>
            </div>

            {/* Home location */}
            {isHomeOnly && (
              <div className="rounded-2xl border border-primary-100 bg-primary-50/40 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                    <MapPin className="h-5 w-5 text-primary-600" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Home-service location
                    </h3>

                    <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-500">
                      Glowee uses an internal location for
                      city and area discovery, services and
                      working hours. Customers do not visit
                      this location.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="City" required>
                    <input
                      value={city}
                      onChange={(e) =>
                        setCity(e.target.value)
                      }
                      placeholder="Abu Dhabi"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Area" required>
                    <input
                      value={area}
                      onChange={(e) =>
                        setArea(e.target.value)
                      }
                      placeholder="Khalidiya"
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Latitude"
                    required
                  >
                    <input
                      inputMode="decimal"
                      value={lat}
                      onChange={(e) =>
                        setLat(e.target.value)
                      }
                      placeholder="24.4539"
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Longitude"
                    required
                  >
                    <input
                      inputMode="decimal"
                      value={lng}
                      onChange={(e) =>
                        setLng(e.target.value)
                      }
                      placeholder="54.3773"
                      className={inputClass}
                    />
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Internal address note">
                      <input
                        value={addressLine}
                        onChange={(e) =>
                          setAddressLine(
                            e.target.value
                          )
                        }
                        placeholder="Optional internal location note"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* Owner completion */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-600">
                Logo, cover image, about, website and
                other profile details can be completed
                later from the business dashboard.
              </p>
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={nextStep}
              disabled={!canGoNext}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                <KeyRound className="h-5 w-5 text-primary-600" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Dashboard account
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Create the login the business will use
                  to access its Glowee dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6">
            {/* Business preview */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                  <Store className="h-5 w-5 text-gray-500" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {name}
                  </p>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {getTypeLabel(salonType)}
                  </p>
                </div>
              </div>
            </div>

            <Field
              label="Dashboard email"
              required
            >
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="email"
                  autoComplete="off"
                  value={accountEmail}
                  onChange={(e) =>
                    setAccountEmail(e.target.value)
                  }
                  placeholder="owner@business.ae"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </Field>

            <Field
              label="Temporary password"
              required
              hint="Minimum 6 characters"
            >
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter password"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </Field>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              This account will be created with business
              dashboard access.
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={prevStep}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create business
                </>
              )}
            </button>
          </div>
        </div>
      )}
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

function StepItem({
  number,
  label,
  active,
  complete,
}: {
  number: number;
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${active || complete
            ? "bg-primary-600 text-white"
            : "bg-gray-100 text-gray-500"
          }`}
      >
        {complete ? (
          <Check className="h-4 w-4" />
        ) : (
          number
        )}
      </div>

      <span
        className={`hidden text-sm font-medium sm:block ${active
            ? "text-gray-900"
            : "text-gray-500"
          }`}
      >
        {label}
      </span>
    </div>
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

function getTypeLabel(type: SalonType) {
  if (type === "home") return "Home service";
  if (type === "both")
    return "In-salon + home";

  return "In-salon";
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}