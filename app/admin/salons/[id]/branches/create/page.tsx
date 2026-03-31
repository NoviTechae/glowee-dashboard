// app/admin/salons/[id]/branches/create/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import LocationPicker from "@/app/components/LocationPicker";
import Link from "next/link";

export default function CreateBranchPage() {
  const params = useParams();
  const router = useRouter();

  const salonId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  // Basic Info
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [addressLine, setAddressLine] = useState("");

  // Contact Info
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");

  // Location
  const [locOpen, setLocOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Settings
  const [supportsHomeServices, setSupportsHomeServices] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!salonId) {
      setError("Missing salon ID");
      return;
    }

    // ✅ Validation
    if (!name.trim()) {
      setError("Branch name is required");
      return;
    }

    if (!city.trim()) {
      setError("City is required");
      return;
    }

    if (!area.trim()) {
      setError("Area is required");
      return;
    }

    if (lat == null || lng == null) {
      setError("Please pick a location on the map");
      return;
    }

    if (email && !email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);

    try {
      // ✅ Clean API call
      await api.post(`/dashboard/admin/salons/${salonId}/branches`, {
        name: name.trim(),
        city: city.trim(),
        area: area.trim(),
        address_line: addressLine?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        whatsapp: whatsapp?.trim() || null,
        instagram: instagram?.trim() || null,
        lat,
        lng,
        supports_home_services: supportsHomeServices,
        is_active: isActive,
      });

      // Success - redirect
      router.push(`/admin/salons/${salonId}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to create branch");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link
          href={`/admin/salons/${salonId}`}
          className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to salon
        </Link>

        {/* Header */}
        <div className="mt-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Branch</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create a new branch location for this salon
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
          {/* Basic Info Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name *
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g., Glowee - Marina Branch"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setError(null);
                    }}
                    placeholder="Abu Dhabi"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                    value={area}
                    onChange={(e) => {
                      setArea(e.target.value);
                      setError(null);
                    }}
                    placeholder="Al Reem Island"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Building name, street, floor, unit..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Full address details for customers
                </p>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="pt-6 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location *</h2>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setLocOpen(true)}
                className="w-full md:w-auto flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-6 py-3 hover:border-pink-400 hover:bg-pink-50 transition"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  {lat && lng ? "Change Location" : "Pick Location on Map"}
                </span>
              </button>

              {/* Location Preview */}
              {lat != null && lng != null && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800">
                        Location Selected ✓
                      </p>
                      {address && (
                        <p className="text-sm text-green-700 mt-1">
                          <strong>Address:</strong> {address}
                        </p>
                      )}
                      <p className="text-xs text-green-600 mt-1 font-mono">
                        {lat.toFixed(6)}, {lng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Required Notice */}
              {!lat && !lng && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-blue-700">
                      Click "Pick Location on Map" to set the branch's GPS coordinates. 
                      This helps customers find your location.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info Section */}
          <div className="pt-6 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+971 50 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+971 50 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="branch@salon.ae"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-gray-500">@</span>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="glowee_marina"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="pt-6 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <input
                  id="home-services"
                  type="checkbox"
                  checked={supportsHomeServices}
                  onChange={(e) => setSupportsHomeServices(e.target.checked)}
                  className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-300 mt-0.5"
                />
                <div>
                  <label htmlFor="home-services" className="text-sm font-medium text-gray-700">
                    Supports Home Services
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Enable if this branch offers services at customer locations
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="active"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-300 mt-0.5"
                />
                <div>
                  <label htmlFor="active" className="text-sm font-medium text-gray-700">
                    Active (Visible to customers)
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Inactive branches are hidden from the app
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t flex gap-3">
            <button
              type="button"
              onClick={() => router.push(`/admin/salons/${salonId}`)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white rounded-lg px-4 py-2.5 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create Branch"
              )}
            </button>
          </div>
        </form>

        {/* Location Picker Modal */}
        <LocationPicker
          open={locOpen}
          onClose={() => setLocOpen(false)}
          onConfirm={(loc) => {
            setLat(loc.lat);
            setLng(loc.lng);
            setAddress(loc.address);
            setLocOpen(false);
          }}
        />
      </div>
    </div>
  );
}