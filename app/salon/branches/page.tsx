// app/salon/branches/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Home,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { branchApi, api } from "@/lib/api";

type Branch = {
  id: string;
  name: string;
  city: string;
  area: string;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  supports_home_services: boolean;
  is_active: boolean;
};

type SalonMe = {
  id: string;
  name: string;
  salon_type?: "in_salon" | "home" | "both";
};

export default function SalonBranchesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [salon, setSalon] = useState<SalonMe | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const [meRes, branchesRes] = await Promise.all([
          api.get("/dashboard/salon/me"),
          branchApi.getAll(),
        ]);

        const salonData = meRes?.salon ?? null;

        const branchData = Array.isArray(branchesRes.data)
          ? branchesRes.data
          : [];

        setSalon(salonData);
        setBranches(branchData);

        // Home-only businesses use an internal branch record,
        // so send them directly to its settings page.
        if (
          salonData?.salon_type === "home" &&
          branchData.length > 0
        ) {
          router.replace(
            `/salon/branches/${branchData[0].id}`
          );
        }
      } catch (e: any) {
        setErr(
          e?.message || "Failed to load locations"
        );

        setBranches([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading locations...
          </p>
        </div>
      </div>
    );
  }

  if (salon?.salon_type === "home") {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7 p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Locations
        </h1>

        <p className="mt-1.5 max-w-2xl text-sm text-gray-500">
          Manage your business locations, contact details and home-service
          availability.
        </p>
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

      {/* Empty */}
      {branches.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            No locations yet
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            Your business locations will appear here once they have been set
            up.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            {branches.length}{" "}
            {branches.length === 1
              ? "location"
              : "locations"}
          </p>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {branches.map((branch) => (
              <article
                key={branch.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:border-gray-300 hover:shadow-sm"
              >
                {/* Main */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        branch.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {branch.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-5">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {branch.name}
                    </h2>

                    <div className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin className="h-4 w-4 shrink-0" />

                      <span className="truncate">
                        {[branch.area, branch.city]
                          .filter(Boolean)
                          .join(", ") || "Location not set"}
                      </span>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="mt-5 space-y-3">
                    {branch.phone && (
                      <ContactRow
                        icon={
                          <Phone className="h-4 w-4" />
                        }
                        value={branch.phone}
                      />
                    )}

                    {branch.email && (
                      <ContactRow
                        icon={
                          <Mail className="h-4 w-4" />
                        }
                        value={branch.email}
                      />
                    )}

                    {branch.whatsapp && (
                      <ContactRow
                        icon={
                          <Phone className="h-4 w-4" />
                        }
                        label="WhatsApp"
                        value={branch.whatsapp}
                      />
                    )}

                    {!branch.phone &&
                      !branch.email &&
                      !branch.whatsapp && (
                        <p className="text-sm text-gray-400">
                          No contact details added
                        </p>
                      )}
                  </div>

                  {/* Home services */}
                  {branch.supports_home_services && (
                    <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-primary-50 px-3.5 py-3">
                      <Home className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />

                      <div>
                        <p className="text-xs font-medium text-primary-700">
                          Home services enabled
                        </p>

                        <p className="mt-0.5 text-xs text-primary-600/80">
                          This location can provide services at customers&apos;
                          addresses.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-4">
                  <Link
                    href={`/salon/branches/${branch.id}`}
                    className="inline-flex w-full items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 transition hover:bg-gray-50"
                  >
                    Manage location

                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ContactRow({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 text-sm text-gray-600">
      <span className="shrink-0 text-gray-400">
        {icon}
      </span>

      <div className="min-w-0">
        {label && (
          <span className="mr-1 text-xs text-gray-400">
            {label}
          </span>
        )}

        <span className="break-all">
          {value}
        </span>
      </div>
    </div>
  );
}