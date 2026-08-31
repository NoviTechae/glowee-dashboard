"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";

import { authApi } from "@/lib/api";
import {
  getRole,
  isAuthenticated,
  saveLoginData,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [showPassword, setShowPassword] =
    useState(false);
  const [rememberMe, setRememberMe] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const justLoggedOut =
      sessionStorage.getItem(
        "justLoggedOut"
      );

    if (justLoggedOut) {
      sessionStorage.removeItem(
        "justLoggedOut"
      );
      return;
    }

    if (!isAuthenticated()) {
      return;
    }

    const role = getRole();

    router.replace(
      role === "admin"
        ? "/admin"
        : "/salon"
    );
  }, [router]);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError(
        "Enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await authApi.login(
        cleanEmail,
        password
      );

      saveLoginData(data);

      const maxAge = rememberMe
        ? 7 * 24 * 60 * 60
        : 24 * 60 * 60;

      document.cookie =
        `dashboardToken=${data.token}; ` +
        `path=/; max-age=${maxAge}; SameSite=Strict`;

      sessionStorage.removeItem(
        "justLoggedOut"
      );

      router.push(
        data.account.role === "admin"
          ? "/admin"
          : "/salon"
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
          {/* Brand panel */}
          <section className="hidden border-r border-gray-100 bg-primary-50/60 p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>

              <h1 className="mt-6 text-3xl font-semibold tracking-tight text-gray-900">
                Glowee
              </h1>

              <p className="mt-2 text-sm font-medium text-primary-700">
                Business Dashboard
              </p>

              <p className="mt-5 max-w-sm text-sm leading-6 text-gray-600">
                Manage bookings, services,
                gifts, loyalty and your
                business operations from one
                place.
              </p>
            </div>

            <p className="text-xs text-gray-400">
              Built for beauty businesses
              across the UAE.
            </p>
          </section>

          {/* Login */}
          <section className="p-7 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-sm">
              <div className="lg:hidden">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>

                <p className="mt-3 text-lg font-semibold text-gray-900">
                  Glowee
                </p>
              </div>

              <div className="mt-7 lg:mt-0">
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Sign in to your Glowee
                  dashboard.
                </p>
              </div>

              <form
                onSubmit={handleLogin}
                className="mt-8 space-y-5"
              >
                {error && (
                  <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

                    <p className="text-sm leading-5 text-red-700">
                      {error}
                    </p>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      disabled={loading}
                      className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                  </div>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                      className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) =>
                            !current
                        )
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(
                        event.target.checked
                      )
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />

                  <span className="text-sm text-gray-600">
                    Remember me
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {loading
                    ? "Signing in..."
                    : "Sign in"}
                </button>
              </form>

              <div className="mt-8 border-t border-gray-100 pt-5">
                <p className="text-center text-xs leading-5 text-gray-400">
                  Secure access to your
                  Glowee business account.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}