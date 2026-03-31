// app/salon/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { salonProfileApi, authApi } from "@/lib/api";
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

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}: {
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-gray-700">{label}</div>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-gray-700">{label}</div>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
      />
    </label>
  );
}

export default function SalonProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [salon, setSalon] = useState<Salon | null>(null);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setErr("");
      setSuccess("");

      const json = await salonProfileApi.get();
      setSalon(json?.salon ?? null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load profile");
      setSalon(null);
    } finally {
      setLoading(false);
    }
  }

  function validate() {
    if (!salon) return "Salon data is missing";
    if (!salon.name?.trim()) return "Salon name is required";

    if (salon.email && !salon.email.includes("@")) {
      return "Please enter a valid email";
    }

    return "";
  }

  async function save() {
    if (!salon) return;

    const validationError = validate();
    if (validationError) {
      setErr(validationError);
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setErr("");
      setSuccess("");

      const payload = {
        name: salon.name.trim(),
        phone: salon.phone?.trim() || null,
        email: salon.email?.trim() || null,
        about: salon.about?.trim() || null,
      };

      const json = await salonProfileApi.update(payload);
      setSalon(json?.salon ?? salon);
      setSuccess("Profile updated successfully");
    } catch (e: any) {
      setErr(e?.message ?? "Save failed");
      setSuccess("");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErr("Please fill all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErr("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }

    try {
      setChangingPassword(true);
      setErr("");
      setSuccess("");

      await authApi.changePassword(currentPassword, newPassword);
      
      setSuccess("Password changed successfully");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleLogoUpload(file: File) {
    if (!salon) return;

    if (file.size > 5 * 1024 * 1024) {
      setErr("Logo must be less than 5MB");
      return;
    }
    try {
      setUploadingLogo(true);
      setErr("");
      setSuccess("");

      const formData = new FormData();
      formData.append("file", file);

      const json = await salonProfileApi.uploadLogo(formData);

      setSalon((prev) =>
        prev ? { ...prev, logo_url: json?.logo_url || json?.salon?.logo_url || prev.logo_url } : prev
      );

      setSuccess("Logo uploaded successfully");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to upload logo");
      setSuccess("");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleCoverUpload(file: File) {
    if (!salon) return;

    if (file.size > 5 * 1024 * 1024) {
      setErr("Cover must be less than 5MB");
      return;
    }
    try {
      setUploadingCover(true);
      setErr("");
      setSuccess("");

      const formData = new FormData();
      formData.append("file", file);

      const json = await salonProfileApi.uploadCover(formData);

      setSalon((prev) =>
        prev ? { ...prev, cover_url: json?.cover_url || json?.salon?.cover_url || prev.cover_url } : prev
      );

      setSuccess("Cover uploaded successfully");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to upload cover");
      setSuccess("");
    } finally {
      setUploadingCover(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-xl font-bold text-gray-900">Salon not found</div>
        {err ? <div className="mt-2 text-sm text-red-600">{err}</div> : null}

        <div className="mt-4">
          <button
            onClick={load}
            className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Salon Profile
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage your salon information and settings
          </p>

          {err ? (
            <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600">
              {err}
            </div>
          ) : null}

          {success ? (
            <div className="mt-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm font-medium text-green-600">
              {success}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Change Password
          </button>
          <button
            onClick={save}
            disabled={saving || !salon.name?.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Profile Preview Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-64 bg-gradient-to-br from-purple-100 to-pink-100">
          {coverSrc ? (
            <img src={coverSrc} alt="cover" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-400 font-medium">No cover image</p>
              </div>
            </div>
          )}

          {/* Logo */}
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 rounded-2xl border-4 border-white bg-white shadow-xl overflow-hidden">
              {logoSrc ? (
                <img src={logoSrc} alt="logo" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                  <span className="text-5xl font-bold text-white">
                    {salon.name?.slice(0, 1)?.toUpperCase() || "S"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-8 pt-20 pb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{salon.name}</h2>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                {salon.phone && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {salon.phone}
                  </div>
                )}
                {salon.email && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {salon.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          {salon.about && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-700 leading-relaxed">{salon.about}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Edit Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Salon Name *"
            value={salon.name}
            onChange={(v) => setSalon({ ...salon, name: v })}
            placeholder="Enter salon name"
          />

          <Input
            label="Phone Number"
            value={salon.phone}
            onChange={(v) => setSalon({ ...salon, phone: v })}
            placeholder="+971 50 123 4567"
            type="tel"
          />

          <div className="md:col-span-2">
            <Input
              label="Email Address"
              value={salon.email}
              onChange={(v) => setSalon({ ...salon, email: v })}
              placeholder="salon@example.com"
              type="email"
              disabled={true}
            />
            <p className="mt-1 text-xs text-gray-500">
              Email is used for login and cannot be changed here
            </p>
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="About Your Salon"
              value={salon.about}
              onChange={(v) => setSalon({ ...salon, about: v })}
              placeholder="Tell customers about your salon, services, and what makes you special..."
            />
          </div>

          {/* Logo Upload */}
          <div>
            <div className="mb-2 text-sm font-semibold text-gray-700">Logo Image</div>
            <label className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all">
              <svg className="w-10 h-10 text-gray-400 group-hover:text-purple-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm font-medium text-gray-600 group-hover:text-purple-600">
                {uploadingLogo ? "Uploading..." : "Upload Logo"}
              </span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                disabled={uploadingLogo}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            {logoSrc && (
              <div className="mt-3">
                <img
                  src={logoSrc}
                  alt="Logo preview"
                  className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
                />
              </div>
            )}
          </div>

          {/* Cover Upload */}
          <div>
            <div className="mb-2 text-sm font-semibold text-gray-700">Cover Image</div>
            <label className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all">
              <svg className="w-10 h-10 text-gray-400 group-hover:text-purple-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-600 group-hover:text-purple-600">
                {uploadingCover ? "Uploading..." : "Upload Cover"}
              </span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={uploadingCover}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverUpload(file);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            {coverSrc && (
              <div className="mt-3">
                <img
                  src={coverSrc}
                  alt="Cover preview"
                  className="w-full h-32 rounded-xl object-cover border-2 border-gray-200"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Change Password</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setErr("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Enter current password"
              />

              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter new password (min 6 characters)"
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm new password"
              />

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setErr("");
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {changingPassword ? "Changing..." : "Change Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}