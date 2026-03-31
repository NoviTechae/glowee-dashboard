// app/admin/salons/create/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

type Step = 1 | 2;
type SalonType = "in_salon" | "home" | "both";

const clean = (v: string) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

export default function AdminCreateSalonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialType = (["in_salon", "home", "both"].includes(searchParams.get("type") ?? "")
    ? searchParams.get("type")
    : "in_salon") as SalonType;

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [salonType, setSalonType] = useState<SalonType>(initialType);

  // Step 1 - basic salon info only
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Step 2 - account
  const [accountEmail, setAccountEmail] = useState("");
  const [password, setPassword] = useState("");

  const canGoNext = useMemo(() => name.trim().length >= 2, [name]);
  const canSubmit = useMemo(
    () => accountEmail.trim().includes("@") && password.length >= 6,
    [accountEmail, password]
  );

  function nextStep() {
    setErr("");

    if (!canGoNext) {
      setErr("Please enter a salon name (min 2 chars).");
      return;
    }

    if (email.trim() && !email.includes("@")) {
      setErr("Please enter a valid salon email.");
      return;
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
      setErr("Account email must be valid and password min 6 chars.");
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
      });

      router.replace("/admin/salons");
    } catch (e: any) {
      setErr(e?.message || "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Add Salon</h1>
            <p className="text-sm text-gray-500">
              Create salon account first — owner can complete profile later
            </p>
          </div>

          <Link href="/admin/salons" className="text-sm underline">
            ← Back
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <StepPill active={step === 1} title="1" label="Basic Info" />
          <div className="h-px flex-1 bg-gray-200" />
          <StepPill active={step === 2} title="2" label="Account" />
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}

        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          {step === 1 ? (
            <div className="space-y-5">
              <Field label="Salon Name *">
                <input
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Glowee Salon"
                />
              </Field>

              <Field label="Salon Type *">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <TypeCard
                    title="In-Salon"
                    desc="Customer visits a branch"
                    active={salonType === "in_salon"}
                    onClick={() => setSalonType("in_salon")}
                  />
                  <TypeCard
                    title="Home Service"
                    desc="Home-based / mobile service"
                    active={salonType === "home"}
                    onClick={() => setSalonType("home")}
                  />
                  <TypeCard
                    title="Both"
                    desc="Branches + home services"
                    active={salonType === "both"}
                    onClick={() => setSalonType("both")}
                  />
                </div>

                <div className="mt-3 rounded-xl border bg-gray-50 p-3 text-xs text-gray-700">
                  <b>Logic:</b>{" "}
                  {salonType === "in_salon"
                    ? "Salon will manage branches."
                    : salonType === "home"
                    ? "No branches needed. Owner can manage home services directly."
                    : "Salon can manage both branches and home services."}
                </div>
              </Field>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Phone">
                  <input
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+9715..."
                  />
                </Field>

                <Field label="Salon Email">
                  <input
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@salon.ae"
                  />
                </Field>
              </div>

              <div className="rounded-xl border bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Profile details like logo, cover, about, website, and Instagram will be completed later by the salon owner inside the salon dashboard.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={nextStep}
                  disabled={!canGoNext}
                  className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Next →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
                This will create the salon dashboard login (role: <b>salon</b>).
              </div>

              <Field label="Account Email *">
                <input
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  placeholder="owner@salon.ae"
                />
              </Field>

              <Field label="Password * (min 6)">
                <input
                  type="password"
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-pink-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                />
              </Field>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={prevStep}
                  className="rounded-xl border px-5 py-2.5 text-sm font-semibold hover:bg-gray-50"
                >
                  ← Back
                </button>

                <button
                  onClick={submit}
                  disabled={!canSubmit || loading}
                  className="rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-pink-200"
                >
                  {loading ? "Creating..." : "Create Salon"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-gray-800">{label}</div>
      {children}
    </label>
  );
}

function StepPill({ active, title, label }: { active: boolean; title: string; label: string }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${
        active
          ? "border border-pink-200 bg-pink-50 text-pink-700"
          : "border border-gray-200 bg-gray-50 text-gray-600"
      }`}
    >
      <span
        className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
          active ? "bg-pink-500 text-white" : "bg-gray-300 text-white"
        }`}
      >
        {title}
      </span>
      <span className="font-semibold">{label}</span>
    </div>
  );
}

function TypeCard({
  title,
  desc,
  active,
  onClick,
}: {
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active ? "border-pink-300 bg-pink-50" : "border-black/10 bg-white hover:bg-black/5"
      }`}
    >
      <div className="font-extrabold">{title}</div>
      <div className="mt-1 text-xs text-black/60">{desc}</div>
    </button>
  );
}