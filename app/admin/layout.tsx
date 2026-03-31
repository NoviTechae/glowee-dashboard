// app/admin/layout.tsx
"use client";

import { AuthGuard } from "@/app/components/AuthGuard";
import { Sidebar } from "@/app/components/Sidebar";
import { getAccount, logout } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const account = getAccount();

const handleLogout = () => {
  logout();
};

  return (
    <AuthGuard requireRole="admin">
      <div className="min-h-screen bg-gray-50">
        {/* Top Bar */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-10">
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-primary-600">Glowee Admin</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{account?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Sidebar */}
        <Sidebar role="admin" />

        {/* Main Content */}
        <main className="ml-64 pt-16">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}