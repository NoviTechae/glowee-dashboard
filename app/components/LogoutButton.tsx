// components/LogoutButton.tsx
"use client";

import { logout } from "@/lib/auth";

export function LogoutButton({ className = "" }: { className?: string }) {
  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ${className}`}
    >
      <svg 
        className="w-5 h-5" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
        />
      </svg>
      Logout
    </button>
  );
}