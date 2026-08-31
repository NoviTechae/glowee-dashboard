// app/components/Topbar.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

import { getAccount, logout } from "@/lib/auth";
import { DashboardAccount } from "@/lib/types";

function initialFromEmail(email?: string | null) {
  const value = (email ?? "").trim();

  return value
    ? value.charAt(0).toUpperCase()
    : "A";
}

function formatRole(role?: string | null) {
  if (!role) return "Account";

  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

export default function Topbar({
  title,
}: {
  title: string;
}) {
  const [account, setAccount] =
    useState<DashboardAccount | null>(null);

  const [open, setOpen] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    setAccount(getAccount());
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const roleLabel = useMemo(
    () => formatRole(account?.role),
    [account?.role]
  );

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex min-h-[72px] items-center justify-between gap-4 px-6 lg:px-8">
        {/* Page title */}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-gray-900">
            {title}
          </h1>

          <p className="mt-0.5 text-xs text-gray-400">
            Glowee Business Dashboard
          </p>
        </div>

        {/* Account */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpen((current) => !current)
            }
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-2.5 py-2 transition hover:bg-gray-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-sm font-semibold text-primary-600">
              {initialFromEmail(account?.email)}
            </div>

            <div className="hidden min-w-0 text-left sm:block">
              <p className="max-w-[190px] truncate text-sm font-medium text-gray-800">
                {account?.email || "Account"}
              </p>

              <p className="mt-0.5 text-xs text-gray-400">
                {roleLabel}
              </p>
            </div>

            <ChevronDown
              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
            >
              {/* Account info */}
              <div className="border-b border-gray-100 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <UserRound className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">
                      Signed in as
                    </p>

                    <p className="mt-0.5 truncate text-sm font-medium text-gray-800">
                      {account?.email ||
                        "Account"}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                    {roleLabel}
                  </span>
                </div>
              </div>

              {/* Logout */}
              <div className="p-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4 text-gray-400" />

                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}