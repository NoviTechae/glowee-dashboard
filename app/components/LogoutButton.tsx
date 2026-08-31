// components/LogoutButton.tsx
"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/lib/auth";

export function LogoutButton({
  className = "",
}: {
  className?: string;
}) {
  function handleLogout() {
    const confirmed = window.confirm(
      "Are you sure you want to log out?"
    );

    if (!confirmed) return;

    logout();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 ${className}`}
    >
      <LogOut className="h-4 w-4" />
      <span>Log out</span>
    </button>
  );
}