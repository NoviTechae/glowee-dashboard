// app/salon/services/[serviceId]/availability/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

function toNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// يقبل:
// 30      => 30 mins
// 1h      => 60 mins
// 1.5h    => 90 mins
// 2:30    => 150 mins
// 90m     => 90 mins
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
    const mins = Number(raw.replace("m", ""));
    if (!Number.isFinite(mins)) return null;
    return mins;
  }

  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [h, m] = raw.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  }

  return null;
}

function formatDurationInput(mins?: number | null) {
  const n = Number(mins || 0);
  if (!n) return "";

  if (n % 60 === 0) {
    return `${n / 60}h`;
  }

  if (n > 60) {
    const h = Math.floor(n / 60);
    const m = n % 60;
    return `${h}:${String(m).padStart(2, "0")}`;
  }

  return String(n);
}

function formatDurationPreview(mins?: number | null) {
  const n = Number(mins || 0);
  if (!n) return "—";

  const h = Math.floor(n / 60);
  const m = n % 60;

  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
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

      if (!serviceId) throw new Error("Missing serviceId");

      const [resBranches, resAvail] = await Promise.all([
        branchApi.getAll(),
        serviceApi.getAvailability(serviceId),
      ]);

      setBranches(Array.isArray(resBranches.data) ? resBranches.data : []);
      setRows(Array.isArray(resAvail.data) ? resAvail.data : []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load availability");
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
    const m = new Map<string, AvailabilityRow>();
    for (const r of rows) m.set(`${r.branch_id}:${r.mode}`, r);
    return m;
  }, [rows]);

  async function upsert(branchId: string, mode: "in_salon" | "home", patch: any) {
    try {
      setErr(null);
      if (!serviceId) throw new Error("Missing serviceId");

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
      setErr(e?.message ?? "Save failed");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent">
            Service Availability
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Set price and duration per branch. Home mode supports travel fee.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/salon/services"
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to services
          </Link>

          <button
            onClick={loadAll}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-red-700">{err}</span>
          </div>
        </div>
      )}

      {/* Branches */}
      {branches.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4 9-4V7M9 11l3 1 3-1"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No branches yet</h3>
            <p className="text-gray-500">Create a branch first to configure availability.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {branches.map((b) => (
            <BranchAvailabilityCard
              key={b.id}
              branch={b}
              existing={existing}
              onSave={upsert}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BranchAvailabilityCard({
  branch,
  existing,
  onSave,
}: {
  branch: BranchRow;
  existing: Map<string, AvailabilityRow>;
  onSave: (branchId: string, mode: "in_salon" | "home", patch: any) => Promise<void>;
}) {
  const curIn = existing.get(`${branch.id}:in_salon`);
  const curHome = existing.get(`${branch.id}:home`);

  const [inActive, setInActive] = useState(curIn?.is_active ?? false);
  const [inPrice, setInPrice] = useState(String(curIn?.price_aed ?? ""));
  const [inDuration, setInDuration] = useState(formatDurationInput(curIn?.duration_mins ?? null));

  const [homeActive, setHomeActive] = useState(curHome?.is_active ?? false);
  const [homePrice, setHomePrice] = useState(String(curHome?.price_aed ?? ""));
  const [homeDuration, setHomeDuration] = useState(formatDurationInput(curHome?.duration_mins ?? null));
  const [homeTravelFee, setHomeTravelFee] = useState(String(curHome?.travel_fee_aed ?? 0));

  const [savingIn, setSavingIn] = useState(false);
  const [savingHome, setSavingHome] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  useEffect(() => {
    setInActive(curIn?.is_active ?? false);
    setInPrice(String(curIn?.price_aed ?? ""));
    setInDuration(formatDurationInput(curIn?.duration_mins ?? null));

    setHomeActive(curHome?.is_active ?? false);
    setHomePrice(String(curHome?.price_aed ?? ""));
    setHomeDuration(formatDurationInput(curHome?.duration_mins ?? null));
    setHomeTravelFee(String(curHome?.travel_fee_aed ?? 0));

    setLocalErr(null);
  }, [branch.id, curIn?.id, curHome?.id]);

  async function saveInSalon() {
    const mins = parseDurationToMinutes(inDuration);
    if (mins == null || mins < 5) {
      setLocalErr("In-salon duration is invalid. Examples: 30, 90, 1h, 1.5h, 2:30");
      return;
    }

    try {
      setSavingIn(true);
      setLocalErr(null);

      await onSave(branch.id, "in_salon", {
        is_active: inActive,
        price_aed: inPrice === "" ? 0 : Number(inPrice),
        duration_mins: mins,
        travel_fee_aed: 0,
      });
    } finally {
      setSavingIn(false);
    }
  }

  async function saveHomeMode() {
    const mins = parseDurationToMinutes(homeDuration);
    if (mins == null || mins < 5) {
      setLocalErr("Home duration is invalid. Examples: 30, 90, 1h, 1.5h, 2:30");
      return;
    }

    try {
      setSavingHome(true);
      setLocalErr(null);

      await onSave(branch.id, "home", {
        is_active: homeActive,
        price_aed: homePrice === "" ? 0 : Number(homePrice),
        duration_mins: mins,
        travel_fee_aed: homeTravelFee === "" ? 0 : Number(homeTravelFee),
      });
    } finally {
      setSavingHome(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Branch Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 21h18M5 21V7l8-4 8 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900">{branch.name}</h2>
            <p className="text-sm text-gray-500">
              {branch.supports_home_services ? "Supports home services" : "Home services disabled"}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            branch.is_active
              ? "border border-green-200 bg-green-100 text-green-700"
              : "border border-gray-200 bg-gray-100 text-gray-600"
          }`}
        >
          {branch.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="space-y-6 p-6">
        {localErr && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {localErr}
          </div>
        )}

        {/* In-salon */}
        <div className="rounded-2xl border border-gray-200 p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">In-salon</h3>
              {curIn ? (
                <p className="mt-1 text-sm text-gray-500">
                  Current: {formatDurationPreview(curIn.duration_mins)} · AED{" "}
                  {Number(curIn.price_aed || 0).toFixed(0)}
                </p>
              ) : (
                <p className="mt-1 text-sm text-gray-500">No in-salon setup yet</p>
              )}
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-900">
              <input
                type="checkbox"
                checked={inActive}
                onChange={(e) => setInActive(e.target.checked)}
                className="h-4 w-4"
              />
              Enabled
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Price AED
              </label>
              <input
                value={inPrice}
                onChange={(e) => setInPrice(e.target.value)}
                placeholder="Price AED"
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Duration
              </label>
              <input
                value={inDuration}
                onChange={(e) => setInDuration(e.target.value)}
                placeholder="30, 90, 1h, 1.5h, 2:30"
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
              />
            </div>
          </div>

          <div className="mt-3 text-xs font-semibold text-gray-500">
            Examples: 30 = 30 mins, 1h = 60 mins, 1.5h = 90 mins, 2:30 = 150 mins
          </div>

          <button
            onClick={saveInSalon}
            disabled={savingIn}
            className="mt-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
          >
            {savingIn ? "Saving..." : "Save In-salon"}
          </button>
        </div>

        {/* Home */}
        <div
          className={`rounded-2xl border border-gray-200 p-5 ${
            branch.supports_home_services ? "" : "opacity-60"
          }`}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Home</h3>
              {curHome ? (
                <p className="mt-1 text-sm text-gray-500">
                  Current: {formatDurationPreview(curHome.duration_mins)} · AED{" "}
                  {Number(curHome.price_aed || 0).toFixed(0)} · Travel AED{" "}
                  {Number(curHome.travel_fee_aed || 0).toFixed(0)}
                </p>
              ) : (
                <p className="mt-1 text-sm text-gray-500">No home setup yet</p>
              )}
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-900">
              <input
                type="checkbox"
                checked={homeActive}
                onChange={(e) => setHomeActive(e.target.checked)}
                disabled={!branch.supports_home_services}
                className="h-4 w-4"
              />
              Enabled
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Price AED
              </label>
              <input
                value={homePrice}
                onChange={(e) => setHomePrice(e.target.value)}
                placeholder="Price AED"
                disabled={!branch.supports_home_services}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Duration
              </label>
              <input
                value={homeDuration}
                onChange={(e) => setHomeDuration(e.target.value)}
                placeholder="30, 90, 1h, 1.5h, 2:30"
                disabled={!branch.supports_home_services}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Travel Fee AED
              </label>
              <input
                value={homeTravelFee}
                onChange={(e) => setHomeTravelFee(e.target.value)}
                placeholder="Travel fee AED"
                disabled={!branch.supports_home_services}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="mt-3 text-xs font-semibold text-gray-500">
            Examples: 30 = 30 mins, 1h = 60 mins, 1.5h = 90 mins, 2:30 = 150 mins
          </div>

          <button
            onClick={saveHomeMode}
            disabled={!branch.supports_home_services || savingHome}
            className="mt-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingHome ? "Saving..." : "Save Home"}
          </button>

          {!branch.supports_home_services && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
              This branch does not support home services. Enable it from Branch settings first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}