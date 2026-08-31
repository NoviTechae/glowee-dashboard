// app/salon/services/[serviceId]/availability/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  Clock3,
  Home,
  Info,
  MapPin,
  Save,
  Wallet,
} from "lucide-react";

import { api, branchApi, serviceApi } from "@/lib/api";

type BranchRow = {
  id: string;
  name: string;
  supports_home_services: boolean;
  is_active: boolean;
};

type AvailabilityRow = {
  id: string;
  branch_id: string;
  branch_name: string;
  mode: "in_salon" | "home";
  duration_mins: number;
  price_aed: number;
  travel_fee_aed: number;
  is_active: boolean;
};

function toNum(value: any, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function parseDurationToMinutes(input: string): number | null {
  const raw = String(input || "").trim().toLowerCase();

  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  if (/^\d+(\.\d+)?h$/.test(raw)) {
    const hours = Number(raw.replace("h", ""));

    if (!Number.isFinite(hours)) return null;

    return Math.round(hours * 60);
  }

  if (/^\d+m$/.test(raw)) {
    const minutes = Number(raw.replace("m", ""));

    if (!Number.isFinite(minutes)) return null;

    return minutes;
  }

  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [hours, minutes] = raw.split(":").map(Number);

    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes) ||
      minutes > 59
    ) {
      return null;
    }

    return hours * 60 + minutes;
  }

  return null;
}

function formatDurationInput(minutes?: number | null) {
  const value = Number(minutes || 0);

  if (!value) return "";

  if (value % 60 === 0) {
    return `${value / 60}h`;
  }

  if (value > 60) {
    const hours = Math.floor(value / 60);
    const mins = value % 60;

    return `${hours}:${String(mins).padStart(2, "0")}`;
  }

  return String(value);
}

function formatDurationPreview(minutes?: number | null) {
  const value = Number(minutes || 0);

  if (!value) return "—";

  const hours = Math.floor(value / 60);
  const mins = value % 60;

  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;

  return `${mins}m`;
}

export default function ServiceAvailabilityPage() {
  const params = useParams<{ serviceId: string }>();
  const serviceId = params?.serviceId;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [rows, setRows] = useState<AvailabilityRow[]>([]);

  async function loadAll() {
    try {
      setLoading(true);
      setErr(null);

      if (!serviceId) {
        throw new Error("Missing service ID");
      }

      const [resBranches, resAvailability] = await Promise.all([
        branchApi.getAll(),
        serviceApi.getAvailability(serviceId),
      ]);

      setBranches(
        Array.isArray(resBranches.data) ? resBranches.data : []
      );

      setRows(
        Array.isArray(resAvailability.data)
          ? resAvailability.data
          : []
      );
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load service setup");
      setBranches([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!serviceId) return;

    loadAll();
  }, [serviceId]);

  const existing = useMemo(() => {
    const map = new Map<string, AvailabilityRow>();

    for (const row of rows) {
      map.set(`${row.branch_id}:${row.mode}`, row);
    }

    return map;
  }, [rows]);

  async function upsert(
    branchId: string,
    mode: "in_salon" | "home",
    patch: any
  ) {
    try {
      setErr(null);

      if (!serviceId) {
        throw new Error("Missing service ID");
      }

      await api.put(
        `/dashboard/salon/branches/${branchId}/services/${serviceId}/availability`,
        {
          mode,
          duration_mins: toNum(patch.duration_mins, 30),
          price_aed: toNum(patch.price_aed, 0),
          travel_fee_aed: toNum(patch.travel_fee_aed, 0),
          is_active: !!patch.is_active,
        }
      );

      await loadAll();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save service setup");
      throw e;
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading service setup...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-7 p-6 lg:p-8">
      {/* Header */}
      <div>
        <Link
          href="/salon/services"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to services
        </Link>

        <div className="mt-5">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Pricing & availability
          </h1>

          <p className="mt-1.5 text-sm text-gray-500">
            Set where this service is available, its price and duration.
          </p>
        </div>
      </div>

      {/* Error */}
      {err && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

          <div>
            <p className="text-sm font-medium text-red-800">
              Something went wrong
            </p>

            <p className="mt-0.5 text-sm text-red-600">
              {err}
            </p>
          </div>
        </div>
      )}

      {/* Helper */}
      <div className="flex items-start gap-3 rounded-xl border border-primary-100 bg-primary-50/50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />

        <p className="text-sm leading-6 text-gray-600">
          You can offer the same service at a business location,
          as a home service, or both. Each option can have its own
          price and duration.
        </p>
      </div>

      {/* Locations */}
      {branches.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            No locations are set up yet
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            Your business location needs to be set up before pricing
            and availability can be configured.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {branches.map((branch) => (
            <LocationAvailabilityCard
              key={branch.id}
              branch={branch}
              existing={existing}
              onSave={upsert}
            />
          ))}
        </div>
      )}

      {branches.length > 0 && (
        <div className="flex justify-end">
          <Link
            href="/salon/services"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            <Check className="h-4 w-4" />
            Done
          </Link>
        </div>
      )}
    </div>
  );
}

function LocationAvailabilityCard({
  branch,
  existing,
  onSave,
}: {
  branch: BranchRow;
  existing: Map<string, AvailabilityRow>;
  onSave: (
    branchId: string,
    mode: "in_salon" | "home",
    patch: any
  ) => Promise<void>;
}) {
  const currentSalon = existing.get(`${branch.id}:in_salon`);
  const currentHome = existing.get(`${branch.id}:home`);

  const [salonActive, setSalonActive] = useState(
    currentSalon?.is_active ?? false
  );

  const [salonPrice, setSalonPrice] = useState(
    String(currentSalon?.price_aed ?? "")
  );

  const [salonDuration, setSalonDuration] = useState(
    formatDurationInput(currentSalon?.duration_mins ?? null)
  );

  const [homeActive, setHomeActive] = useState(
    currentHome?.is_active ?? false
  );

  const [homePrice, setHomePrice] = useState(
    String(currentHome?.price_aed ?? "")
  );

  const [homeDuration, setHomeDuration] = useState(
    formatDurationInput(currentHome?.duration_mins ?? null)
  );

  const [homeTravelFee, setHomeTravelFee] = useState(
    String(currentHome?.travel_fee_aed ?? 0)
  );

  const [savingSalon, setSavingSalon] = useState(false);
  const [savingHome, setSavingHome] = useState(false);

  const [savedSalon, setSavedSalon] = useState(false);
  const [savedHome, setSavedHome] = useState(false);

  const [localErr, setLocalErr] = useState<string | null>(null);

  useEffect(() => {
    setSalonActive(currentSalon?.is_active ?? false);
    setSalonPrice(String(currentSalon?.price_aed ?? ""));
    setSalonDuration(
      formatDurationInput(currentSalon?.duration_mins ?? null)
    );

    setHomeActive(currentHome?.is_active ?? false);
    setHomePrice(String(currentHome?.price_aed ?? ""));
    setHomeDuration(
      formatDurationInput(currentHome?.duration_mins ?? null)
    );
    setHomeTravelFee(
      String(currentHome?.travel_fee_aed ?? 0)
    );

    setLocalErr(null);
  }, [
    branch.id,
    currentSalon?.id,
    currentHome?.id,
  ]);

  function validatePrice(
    value: string,
    label: string
  ): number | null {
    if (value.trim() === "") {
      setLocalErr(`${label} is required.`);
      return null;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
      setLocalErr(`${label} must be a valid amount.`);
      return null;
    }

    return parsed;
  }

  async function saveSalon() {
    const duration = parseDurationToMinutes(salonDuration);

    if (duration == null || duration < 5) {
      setLocalErr(
        "Enter a valid duration. For example: 30, 1h or 1:30."
      );
      return;
    }

    const price = validatePrice(salonPrice, "Price");

    if (price == null) return;

    try {
      setSavingSalon(true);
      setSavedSalon(false);
      setLocalErr(null);

      await onSave(branch.id, "in_salon", {
        is_active: salonActive,
        price_aed: price,
        duration_mins: duration,
        travel_fee_aed: 0,
      });

      setSavedSalon(true);

      window.setTimeout(() => setSavedSalon(false), 2000);
    } catch {
      // Global error is handled by parent.
    } finally {
      setSavingSalon(false);
    }
  }

  async function saveHome() {
    const duration = parseDurationToMinutes(homeDuration);

    if (duration == null || duration < 5) {
      setLocalErr(
        "Enter a valid home service duration. For example: 30, 1h or 1:30."
      );
      return;
    }

    const price = validatePrice(
      homePrice,
      "Home service price"
    );

    if (price == null) return;

    const travelFee =
      homeTravelFee.trim() === ""
        ? 0
        : Number(homeTravelFee);

    if (
      !Number.isFinite(travelFee) ||
      travelFee < 0
    ) {
      setLocalErr(
        "Travel fee must be a valid amount."
      );
      return;
    }

    try {
      setSavingHome(true);
      setSavedHome(false);
      setLocalErr(null);

      await onSave(branch.id, "home", {
        is_active: homeActive,
        price_aed: price,
        duration_mins: duration,
        travel_fee_aed: travelFee,
      });

      setSavedHome(true);

      window.setTimeout(() => setSavedHome(false), 2000);
    } catch {
      // Global error is handled by parent.
    } finally {
      setSavingHome(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* Location header */}
      <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-500">
            <MapPin className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              {branch.name}
            </h2>

            <p className="mt-0.5 text-sm text-gray-500">
              {branch.supports_home_services
                ? "In-location and home services supported"
                : "Business location"}
            </p>
          </div>
        </div>

        <span
          className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
            branch.is_active
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {branch.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
        {/* In salon */}
        <ModeCard
          title="At business location"
          description="Customer visits your location for this service."
          icon={Building2}
          enabled={salonActive}
          onEnabledChange={setSalonActive}
          price={salonPrice}
          onPriceChange={setSalonPrice}
          duration={salonDuration}
          onDurationChange={setSalonDuration}
          current={currentSalon}
          onSave={saveSalon}
          saving={savingSalon}
          saved={savedSalon}
        />

        {/* Home service */}
        <ModeCard
          title="Home service"
          description="Your team travels to the customer's location."
          icon={Home}
          enabled={homeActive}
          onEnabledChange={setHomeActive}
          price={homePrice}
          onPriceChange={setHomePrice}
          duration={homeDuration}
          onDurationChange={setHomeDuration}
          travelFee={homeTravelFee}
          onTravelFeeChange={setHomeTravelFee}
          current={currentHome}
          onSave={saveHome}
          saving={savingHome}
          saved={savedHome}
          disabled={!branch.supports_home_services}
        />
      </div>

      {localErr && (
        <div className="border-t border-red-100 bg-red-50 px-5 py-3">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {localErr}
          </div>
        </div>
      )}
    </section>
  );
}

function ModeCard({
  title,
  description,
  icon: Icon,
  enabled,
  onEnabledChange,
  price,
  onPriceChange,
  duration,
  onDurationChange,
  travelFee,
  onTravelFeeChange,
  current,
  onSave,
  saving,
  saved,
  disabled = false,
}: {
  title: string;
  description: string;
  icon: React.ElementType;

  enabled: boolean;
  onEnabledChange: (value: boolean) => void;

  price: string;
  onPriceChange: (value: string) => void;

  duration: string;
  onDurationChange: (value: string) => void;

  travelFee?: string;
  onTravelFeeChange?: (value: string) => void;

  current?: AvailabilityRow;

  onSave: () => void;
  saving: boolean;
  saved: boolean;

  disabled?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 p-5 ${
        disabled ? "bg-gray-50 opacity-70" : "bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Icon className="h-5 w-5" />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">
              {title}
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              {description}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={disabled}
          onClick={() => onEnabledChange(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
            enabled && !disabled
              ? "bg-primary-600"
              : "bg-gray-300"
          } disabled:cursor-not-allowed`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
              enabled
                ? "translate-x-[22px] translate-y-0.5"
                : "translate-x-0.5 translate-y-0.5"
            }`}
          />
        </button>
      </div>

      {current && (
        <div className="mt-4 rounded-xl bg-gray-50 px-3.5 py-2.5 text-xs text-gray-500">
          Current:{" "}
          <span className="font-medium text-gray-700">
            AED {Number(current.price_aed || 0).toFixed(0)}
          </span>
          {" · "}
          {formatDurationPreview(current.duration_mins)}

          {current.mode === "home" && (
            <>
              {" · "}
              Travel AED{" "}
              {Number(
                current.travel_fee_aed || 0
              ).toFixed(0)}
            </>
          )}
        </div>
      )}

      {!current && (
        <p className="mt-4 text-xs text-gray-400">
          Not configured yet
        </p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <Wallet className="h-3.5 w-3.5" />
            Price
          </label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              AED
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) =>
                onPriceChange(e.target.value)
              }
              disabled={disabled}
              placeholder="0"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-12 pr-3 text-sm outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 disabled:bg-gray-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <Clock3 className="h-3.5 w-3.5" />
            Duration
          </label>

          <input
            value={duration}
            onChange={(e) =>
              onDurationChange(e.target.value)
            }
            disabled={disabled}
            placeholder="e.g. 45, 1h, 1:30"
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 disabled:bg-gray-100"
          />
        </div>
      </div>

      {onTravelFeeChange && (
        <div className="mt-4">
          <label className="mb-2 block text-xs font-medium text-gray-600">
            Travel fee
          </label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              AED
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={travelFee}
              onChange={(e) =>
                onTravelFeeChange(e.target.value)
              }
              disabled={disabled}
              placeholder="0"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-12 pr-3 text-sm outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 disabled:bg-gray-100"
            />
          </div>

          <p className="mt-1.5 text-xs text-gray-400">
            Set to AED 0 if there is no additional travel fee.
          </p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Duration examples: 30, 1h, 1.5h or 1:30
        </p>

        <button
          type="button"
          onClick={onSave}
          disabled={disabled || saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </>
          )}
        </button>
      </div>

      {disabled && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-xs leading-5 text-gray-500">
          Home services are not enabled for this business location.
        </div>
      )}
    </div>
  );
}