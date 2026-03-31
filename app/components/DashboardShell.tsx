// app/components/DashboardShell.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated, getRole, logout as doLogout } from "@/lib/auth";

type NavItem = { href: string; label: string };

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function DashboardShell({
  title,
  nav,
  children,
  roleGuard, // "admin" | "salon_owner"
}: {
  title: string;
  nav: NavItem[];
  children: React.ReactNode;
  roleGuard: "admin" | "salon_owner";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // ✅ FIXED: Check auth once on mount, not on every render
  useEffect(() => {
    const checkAuth = () => {
      // Check if just logged out
      const justLoggedOut = sessionStorage.getItem('justLoggedOut');
      if (justLoggedOut) {
        router.replace("/login");
        return;
      }

      // Check authentication
      if (!isAuthenticated()) {
        router.replace("/login");
        return;
      }

      // Check role
      const userRole = getRole();
      if (roleGuard && userRole !== roleGuard) {
        // Redirect to appropriate dashboard
        router.replace(userRole === "admin" ? "/admin" : "/salon");
        return;
      }

      // All checks passed
      setIsChecking(false);
    };

    checkAuth();
  }, []); // ✅ Empty dependency array - run once on mount

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      doLogout();
    }
  };

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf5f6]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-black/10">
          <div className="px-6 py-6">
            <div className="text-xl font-extrabold tracking-tight">Glowee</div>
            <div className="text-xs text-black/50 mt-1">Dashboard</div>
          </div>

          <nav className="px-3 pb-6">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-xl px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "bg-black text-white shadow-sm"
                      : "text-black/70 hover:bg-black/5"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-6 pb-6">
            <button
              onClick={handleLogout}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-black/5 transition-colors"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">
          {/* Topbar */}
          <div className="sticky top-0 z-10 bg-[#fbf5f6]/80 backdrop-blur border-b border-black/5">
            <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
              <div>
                <div className="text-lg font-extrabold">{title}</div>
                <div className="text-xs text-black/50">Manage everything from one place</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-white border border-black/10 flex items-center justify-center font-bold">
                  G
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}