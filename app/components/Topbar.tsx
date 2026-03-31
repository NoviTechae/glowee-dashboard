// app/components/Topbar.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getAccount, logout } from "@/lib/auth";
import { DashboardAccount } from "@/lib/types";
import { usePathname } from "next/navigation";

function initialFromEmail(email?: string | null) {
  const x = (email ?? "").trim();
  return x ? x.charAt(0).toUpperCase() : "A";
}

export default function Topbar({ title }: { title: string }) {
  const [account, setAccount] = useState<DashboardAccount | null>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setAccount(getAccount());
  }, []);

  // close dropdown when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const roleLabel = useMemo(() => (account?.role ?? "").toUpperCase(), [account?.role]);

  return (
    <header className="bg-white border-b">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-gray-900">{title}</h1>
          <p className="text-xs text-gray-500 mt-1">Premium dashboard · Glowee</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 rounded-full border bg-white px-3 py-2 hover:bg-gray-50 transition"
          >
            <div className="w-9 h-9 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-black">
              {initialFromEmail(account?.email)}
            </div>

            <div className="text-left leading-tight hidden sm:block">
              <div className="text-sm font-black text-gray-900">{account?.email || "Account"}</div>
              <div className="text-xs text-gray-500">Signed in</div>
            </div>

            <span className="ml-1 px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 text-[10px] font-black tracking-wide">
              {roleLabel || "ROLE"}
            </span>

            <span className="ml-1 text-gray-400 font-black">{open ? "▲" : "▼"}</span>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border bg-white shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b">
                <div className="text-xs text-gray-500">Logged in as</div>
                <div className="text-sm font-black text-gray-900 truncate">{account?.email}</div>
              </div>

              <button
                onClick={logout}
                className="w-full text-left px-4 py-3 text-sm font-black text-gray-800 hover:bg-gray-50 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}