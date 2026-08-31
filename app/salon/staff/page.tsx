// app/salon/staff/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Scissors,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";

import { staffApi } from "@/lib/api";

type Staff = {
  id: string;
  name: string;
  phone: string | null;
  branch_id: string;
  branch_name: string;
  is_active: boolean;
  created_at: string;
  services: { service_id: string; service_name: string }[];
};

export default function SalonStaffPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);

  async function loadAll() {
    try {
      setLoading(true);
      setErr(null);

      const res = await staffApi.getAll();
      setStaff(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load team");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function toggleActive(member: Staff) {
    try {
      setErr(null);

      await staffApi.update(member.id, {
        is_active: !member.is_active,
      });

      setStaff((prev) =>
        prev.map((item) =>
          item.id === member.id
            ? { ...item, is_active: !item.is_active }
            : item
        )
      );
    } catch (e: any) {
      setErr(e?.message || "Failed to update team member");
    }
  }

  async function deleteStaff(staffId: string) {
    const confirmed = confirm(
      "Delete this team member? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setErr(null);

      await staffApi.delete(staffId);

      setStaff((prev) =>
        prev.filter((member) => member.id !== staffId)
      );
    } catch (e: any) {
      setErr(e?.message || "Failed to delete team member");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading team...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Team
          </h1>

          <p className="mt-1.5 text-sm text-gray-500">
            Manage your team members and the services they provide.
          </p>
        </div>

        <Link
          href="/salon/staff/create"
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add team member
        </Link>
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
      {staff.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <UsersRound className="h-5 w-5 text-gray-400" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            No team members yet
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            Add the people who provide services for your business and assign
            the services they can perform.
          </p>

          <Link
            href="/salon/staff/create"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Add first team member
          </Link>
        </div>
      ) : (
        <>
          {/* Count */}
          <div className="text-sm text-gray-500">
            {staff.length} {staff.length === 1 ? "team member" : "team members"}
          </div>

          {/* Team grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {staff.map((member) => (
              <article
                key={member.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                {/* Member header */}
                <div className="border-b border-gray-100 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                        <UserRound className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-gray-900">
                          {member.name}
                        </h2>

                        <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {member.branch_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        member.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {member.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Member info */}
                <div className="space-y-5 p-5">
                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{member.phone}</span>
                    </div>
                  )}

                  {/* Services */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-gray-400" />

                      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Services
                      </span>
                    </div>

                    {member.services.length === 0 ? (
                      <p className="text-sm text-gray-400">
                        No services assigned
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {member.services.map((service) => (
                          <span
                            key={service.service_id}
                            className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700"
                          >
                            {service.service_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-3">
                  <button
                    type="button"
                    onClick={() => toggleActive(member)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      member.is_active
                        ? "bg-white text-gray-600 hover:bg-gray-100"
                        : "bg-primary-600 text-white hover:bg-primary-700"
                    }`}
                  >
                    {member.is_active ? "Set inactive" : "Set active"}
                  </button>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/salon/staff/${member.id}/edit`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                      title="Edit team member"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => deleteStaff(member.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Delete team member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}