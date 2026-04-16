"use client";

import { AuthGuard } from "@/app/components/AuthGuard";
import { Sidebar } from "@/app/components/Sidebar";
import { getAccount, logout } from "@/lib/auth";
import { useEffect, useState } from "react";

export default function SalonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [email, setEmail] = useState("");

  useEffect(() => {
    const account = getAccount();
    setEmail(account?.email || "");
  }, []);

  return (
<AuthGuard requireRole="salon">
        <div className="min-h-screen bg-gray-50">
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-10">
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-primary-600">Glowee Salon</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{email}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <Sidebar role="salon" />

        <main className="ml-64 pt-16">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}