// app/admin/layout.tsx
"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, ShieldCheck } from "lucide-react";

import { AuthGuard } from "@/app/components/AuthGuard";
import { Sidebar } from "@/app/components/Sidebar";
import { getAccount, logout } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const account = getAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const email = account?.email || "Admin";
  const initial = email.charAt(0).toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <AuthGuard requireRole="admin">
      <div className="min-h-screen bg-gray-50">
        <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-gray-200 bg-white">
          <div className="flex h-full items-center justify-between px-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">
                  Glowee
                </h1>

                <span className="text-gray-300">/</span>

                <span className="text-sm font-medium text-gray-500">
                  Admin Dashboard
                </span>
              </div>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-gray-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                  {initial}
                </div>

                <div className="hidden text-left sm:block">
                  <p className="max-w-[220px] truncate text-sm font-medium text-gray-800">
                    {email}
                  </p>
                  <p className="text-xs text-gray-400">
                    Administrator
                  </p>
                </div>

                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                      <ShieldCheck className="h-4 w-4" />
                      Admin account
                    </div>

                    <p className="mt-1 truncate text-sm font-medium text-gray-800">
                      {email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <Sidebar role="admin" />

        <main className="ml-64 pt-16">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}