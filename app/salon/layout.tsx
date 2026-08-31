"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ChevronDown,
  LogOut,
  UserRound,
} from "lucide-react";

import { AuthGuard } from "@/app/components/AuthGuard";
import { Sidebar } from "@/app/components/Sidebar";
import { getAccount, logout } from "@/lib/auth";

function getInitial(email: string) {
  const value = email.trim();

  return value
    ? value.charAt(0).toUpperCase()
    : "A";
}

export default function SalonLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [email, setEmail] = useState("");
  const [accountOpen, setAccountOpen] =
    useState(false);

  const accountRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const account = getAccount();
    setEmail(account?.email || "");
  }, []);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        accountRef.current &&
        !accountRef.current.contains(
          event.target as Node
        )
      ) {
        setAccountOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  return (
    <AuthGuard requireRole="salon">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="fixed left-0 right-0 top-0 z-40 h-16 border-b border-gray-200 bg-white">
          <div className="flex h-full items-center justify-between px-6">
            {/* Brand */}
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-gray-900">
                Glowee
              </h1>

              <p className="text-[11px] text-gray-400">
                Business Dashboard
              </p>
            </div>

            {/* Account */}
            <div
              ref={accountRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setAccountOpen(
                    (current) => !current
                  )
                }
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-gray-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-sm font-semibold text-primary-600">
                  {getInitial(email)}
                </div>

                <div className="hidden max-w-[220px] text-left sm:block">
                  <p className="truncate text-sm font-medium text-gray-700">
                    {email || "Account"}
                  </p>

                  <p className="mt-0.5 text-[11px] text-gray-400">
                    Business account
                  </p>
                </div>

                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    accountOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {/* Dropdown */}
              {accountOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
                >
                  <div className="border-b border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                        <UserRound className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">
                          Signed in as
                        </p>

                        <p className="mt-0.5 truncate text-sm font-medium text-gray-800">
                          {email || "Account"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={logout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
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

        {/* Sidebar */}
        <Sidebar role="salon" />

        {/* Content */}
        <main className="ml-64 pt-16">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}