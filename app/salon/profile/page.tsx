// app/salon/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ImageIcon,
  Lock,
  Mail,
  Phone,
  Save,
  Store,
  Upload,
  X,
} from "lucide-react";

import {
  authApi,
  salonProfileApi,
} from "@/lib/api";

import { getImageUrl } from "@/lib/utils";

type Salon = {
  id: string;
  name: string;
  about?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  phone?: string | null;
  email?: string | null;
};

export default function SalonProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploadingLogo, setUploadingLogo] =
    useState(false);

  const [uploadingCover, setUploadingCover] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [salon, setSalon] = useState<Salon | null>(
    null
  );

  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] =
    useState<string | null>(null);

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr(null);
        setSuccess(null);

        const json = await salonProfileApi.get();

        setSalon(json?.salon ?? null);
      } catch (e: any) {
        setErr(
          e?.message ?? "Failed to load profile"
        );

        setSalon(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function validateProfile() {
    if (!salon) {
      return "Business data is missing";
    }

    if (!salon.name?.trim()) {
      return "Business name is required";
    }

    if (
      salon.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        salon.email
      )
    ) {
      return "Please enter a valid email address";
    }

    return "";
  }

  async function save() {
    if (!salon) return;

    const validationError = validateProfile();

    if (validationError) {
      setErr(validationError);
      setSuccess(null);
      return;
    }

    try {
      setSaving(true);
      setErr(null);
      setSuccess(null);

      const payload = {
        name: salon.name.trim(),
        phone: salon.phone?.trim() || null,
        email: salon.email?.trim() || null,
        about: salon.about?.trim() || null,
      };

      const json =
        await salonProfileApi.update(payload);

      setSalon(json?.salon ?? salon);

      setSuccess("Business profile updated.");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  function closePasswordModal() {
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handlePasswordChange() {
    setErr(null);
    setSuccess(null);

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setErr("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErr("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setErr(
        "Password must be at least 6 characters"
      );
      return;
    }

    try {
      setChangingPassword(true);

      await authApi.changePassword(
        currentPassword,
        newPassword
      );

      closePasswordModal();

      setSuccess("Password changed successfully.");
    } catch (e: any) {
      setErr(
        e?.message ?? "Failed to change password"
      );
    } finally {
      setChangingPassword(false);
    }
  }

  function validateImage(file: File) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return "Please upload a JPG, PNG or WEBP image";
    }

    if (file.size > 5 * 1024 * 1024) {
      return "Image must be less than 5MB";
    }

    return "";
  }

  async function handleLogoUpload(file: File) {
    if (!salon) return;

    const validationError = validateImage(file);

    if (validationError) {
      setErr(validationError);
      setSuccess(null);
      return;
    }

    try {
      setUploadingLogo(true);
      setErr(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append("file", file);

      const json =
        await salonProfileApi.uploadLogo(formData);

      setSalon((prev) =>
        prev
          ? {
              ...prev,
              logo_url:
                json?.logo_url ||
                json?.salon?.logo_url ||
                prev.logo_url,
            }
          : prev
      );

      setSuccess("Logo updated.");
    } catch (e: any) {
      setErr(
        e?.message ?? "Failed to upload logo"
      );
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleCoverUpload(file: File) {
    if (!salon) return;

    const validationError = validateImage(file);

    if (validationError) {
      setErr(validationError);
      setSuccess(null);
      return;
    }

    try {
      setUploadingCover(true);
      setErr(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append("file", file);

      const json =
        await salonProfileApi.uploadCover(formData);

      setSalon((prev) =>
        prev
          ? {
              ...prev,
              cover_url:
                json?.cover_url ||
                json?.salon?.cover_url ||
                prev.cover_url,
            }
          : prev
      );

      setSuccess("Cover image updated.");
    } catch (e: any) {
      setErr(
        e?.message ??
          "Failed to upload cover image"
      );
    } finally {
      setUploadingCover(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-6 w-6 text-red-500" />

          <h1 className="mt-3 text-lg font-semibold text-red-800">
            Business profile unavailable
          </h1>

          <p className="mt-1 text-sm text-red-600">
            {err || "Profile could not be loaded"}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const coverSrc = getImageUrl(salon.cover_url);
  const logoSrc = getImageUrl(salon.logo_url);

  return (
    <div className="mx-auto max-w-6xl space-y-7 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Business profile
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm text-gray-500">
            Manage the information and branding customers
            see on Glowee.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setErr(null);
              setSuccess(null);
              setShowPasswordModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Lock className="h-4 w-4" />
            Change password
          </button>

          <button
            type="button"
            onClick={save}
            disabled={
              saving || !salon.name?.trim()
            }
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {err && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

          <div>
            <p className="text-sm font-medium text-red-800">
              Something went wrong
            </p>

            <p className="mt-0.5 text-sm text-red-600">
              {err}
            </p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />

          <p className="text-sm font-medium text-emerald-700">
            {success}
          </p>
        </div>
      )}

      {/* Profile preview */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="relative h-56 bg-gray-100 sm:h-64">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={`${salon.name} cover`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <ImageIcon className="mx-auto h-7 w-7 text-gray-300" />

                <p className="mt-2 text-sm text-gray-400">
                  No cover image
                </p>
              </div>
            </div>
          )}

          <label className="absolute right-4 top-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-black/5 transition hover:bg-white">
            {uploadingCover ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}

            {uploadingCover
              ? "Uploading..."
              : coverSrc
              ? "Change cover"
              : "Add cover"}

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={uploadingCover}
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  handleCoverUpload(file);
                }

                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>

        <div className="relative px-6 pb-6 pt-16 sm:px-8">
          {/* Logo */}
          <div className="absolute -top-14 left-6 sm:left-8">
            <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-sm">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={`${salon.name} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary-50">
                  <span className="text-3xl font-semibold text-primary-600">
                    {salon.name
                      ?.slice(0, 1)
                      ?.toUpperCase() || "B"}
                  </span>
                </div>
              )}

              {uploadingLogo && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
                </div>
              )}
            </div>

            <label className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50">
              <Camera className="h-3.5 w-3.5" />

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={uploadingLogo}
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    handleLogoUpload(file);
                  }

                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {salon.name}
              </h2>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
                {salon.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {salon.phone}
                  </span>
                )}

                {salon.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {salon.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {salon.about ? (
            <p className="mt-5 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-gray-600">
              {salon.about}
            </p>
          ) : (
            <p className="mt-5 text-sm text-gray-400">
              No business description added yet.
            </p>
          )}
        </div>
      </section>

      {/* Business information */}
      <section className="rounded-2xl border border-gray-200 bg-white">
        <SectionHeader
          icon={<Store className="h-5 w-5" />}
          title="Business information"
          description="Update the main customer-facing details for your business."
        />

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <Field
            label="Business name"
            required
          >
            <input
              value={salon.name}
              onChange={(e) =>
                setSalon({
                  ...salon,
                  name: e.target.value,
                })
              }
              placeholder="Business name"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
          </Field>

          <Field label="Phone">
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="tel"
                value={salon.phone ?? ""}
                onChange={(e) =>
                  setSalon({
                    ...salon,
                    phone: e.target.value,
                  })
                }
                placeholder="+971..."
                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </Field>

          <div className="md:col-span-2">
            <Field
              label="Email"
              hint="This email is used for login and cannot be changed here."
            >
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="email"
                  value={salon.email ?? ""}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-500 outline-none"
                />
              </div>
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field
              label="About"
              hint="Tell customers what makes your business special."
            >
              <textarea
                value={salon.about ?? ""}
                onChange={(e) =>
                  setSalon({
                    ...salon,
                    about: e.target.value,
                  })
                }
                placeholder="Tell customers about your business, services and experience..."
                rows={5}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm leading-6 text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Branding */}
      <section className="rounded-2xl border border-gray-200 bg-white">
        <SectionHeader
          icon={<ImageIcon className="h-5 w-5" />}
          title="Branding"
          description="Manage the logo and cover image shown to Glowee customers."
        />

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <UploadCard
            title="Logo"
            description="Square images work best."
            preview={
              logoSrc ? (
                <img
                  src={logoSrc}
                  alt="Logo preview"
                  className="h-20 w-20 rounded-xl border border-gray-200 object-cover"
                />
              ) : null
            }
            uploading={uploadingLogo}
            onFile={handleLogoUpload}
          />

          <UploadCard
            title="Cover image"
            description="Use a wide image that represents your business."
            preview={
              coverSrc ? (
                <img
                  src={coverSrc}
                  alt="Cover preview"
                  className="h-20 w-32 rounded-xl border border-gray-200 object-cover"
                />
              ) : null
            }
            uploading={uploadingCover}
            onFile={handleCoverUpload}
          />
        </div>
      </section>

      {/* Password modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Change password
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter your current password before setting a new one.
                </p>
              </div>

              <button
                type="button"
                onClick={closePasswordModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <PasswordField
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Enter current password"
              />

              <PasswordField
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="At least 6 characters"
              />

              <PasswordField
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Enter new password again"
              />

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {changingPassword ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Change password
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-gray-100 px-6 py-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          {icon}
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">
            {title}
          </h2>

          <p className="mt-0.5 text-sm text-gray-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      {children}

      {hint && (
        <p className="mt-1.5 text-xs text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
}

function UploadCard({
  title,
  description,
  preview,
  uploading,
  onFile,
}: {
  title: string;
  description: string;
  preview: React.ReactNode;
  uploading: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            {title}
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            {description}
          </p>
        </div>

        {preview}
      </div>

      <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700">
        {uploading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
        ) : (
          <Upload className="h-4 w-4" />
        )}

        {uploading ? "Uploading..." : `Upload ${title.toLowerCase()}`}

        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={uploading}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (file) {
              onFile(file);
            }

            e.currentTarget.value = "";
          }}
        />
      </label>

      <p className="mt-2 text-xs text-gray-400">
        JPG, PNG or WEBP · Maximum 5MB
      </p>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type="password"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        autoComplete="new-password"
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
      />
    </div>
  );
}