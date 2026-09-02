// app/admin/profile/page.tsx
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { getAccount, logout } from "@/lib/auth";
import { DashboardAccount } from "@/lib/types";

export default function AdminProfilePage() {
  const [account, setAccount] = useState<DashboardAccount | null>(null);
  const [loading, setLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setAccount(getAccount());
  }, []);

  const validationError = useMemo(() => {
    if (!currentPassword) {
      return "Current password is required.";
    }

    if (newPassword.length < 6) {
      return "New password must be at least 6 characters.";
    }

    if (newPassword !== confirmPassword) {
      return "New passwords do not match.";
    }

    return "";
  }, [currentPassword, newPassword, confirmPassword]);

  const canSubmit =
    !loading &&
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();

    if (!canSubmit) return;

    try {
      setLoading(true);

      await api.post("/dashboard/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast.success("Password changed successfully");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Failed to change password"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!account) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-gray-500">
          Loading profile...
        </p>
      </div>
    );
  }

  const initial =
    account.email?.charAt(0)?.toUpperCase() || "A";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-primary-600">
          Settings
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
          Profile
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View your administrator account and manage account security.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Account */}
        <section className="h-fit rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-xl font-semibold text-primary-700">
                {initial}
              </div>

              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900">
                  Administrator
                </h2>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {account.email}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100 px-6">
            <AccountRow
              icon={Mail}
              label="Email"
              value={account.email}
            />

            <AccountRow
              icon={ShieldCheck}
              label="Role"
              value={
                account.role === "admin"
                  ? "Administrator"
                  : account.role
              }
            />

            <AccountRow
              icon={UserRound}
              label="Account ID"
              value={`${account.id.slice(0, 8)}...`}
              mono
            />
          </div>

          <div className="p-6">
            <button
              type="button"
              onClick={logout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </section>

        {/* Security */}
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <KeyRound className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Password & security
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update the password used to access your Glowee admin account.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleChangePassword}
            className="space-y-6 p-6"
          >
            <PasswordField
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Enter current password"
              visible={showCurrentPassword}
              onToggle={() =>
                setShowCurrentPassword((previous) => !previous)
              }
              disabled={loading}
            />

            <div className="grid gap-5 md:grid-cols-2">
              <PasswordField
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter new password"
                visible={showNewPassword}
                onToggle={() =>
                  setShowNewPassword((previous) => !previous)
                }
                disabled={loading}
              />

              <PasswordField
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm new password"
                visible={showConfirmPassword}
                onToggle={() =>
                  setShowConfirmPassword((previous) => !previous)
                }
                disabled={loading}
              />
            </div>

            {(currentPassword ||
              newPassword ||
              confirmPassword) &&
              validationError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {validationError}
                </div>
              )}

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Password guidance
                  </p>

                  <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                    <SecurityItem>
                      Minimum 6 characters
                    </SecurityItem>

                    <SecurityItem>
                      8+ characters recommended
                    </SecurityItem>

                    <SecurityItem>
                      Mix letters, numbers and symbols
                    </SecurityItem>

                    <SecurityItem>
                      Avoid passwords used elsewhere
                    </SecurityItem>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" />

                {loading
                  ? "Updating..."
                  : "Change password"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function AccountRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-4">
      <Icon className="h-4 w-4 shrink-0 text-gray-400" />

      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400">
          {label}
        </p>

        <p
          className={`mt-1 truncate text-sm font-medium text-gray-800 ${
            mono ? "font-mono" : ""
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  visible,
  onToggle,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-900">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-11 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:bg-gray-50 disabled:text-gray-400"
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 disabled:opacity-50"
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function SecurityItem({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-gray-400" />
      <span>{children}</span>
    </div>
  );
}