"use client";

import { useEffect, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

type PickedLocation = {
  lat: number;
  lng: number;
  address: string;
};

export default function LocationPicker({
  open,
  onClose,
  onConfirm,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (loc: PickedLocation) => void;
  initial?: { lat: number; lng: number };
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  const [center, setCenter] = useState<{ lat: number; lng: number }>(
    initial ?? { lat: 24.4539, lng: 54.3773 }
  );
  const [marker, setMarker] = useState(center);
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (initial) {
      setCenter(initial);
      setMarker(initial);
    }
  }, [initial]);

  if (!open) return null;

  const reverseGeocode = async (lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder();
    const res = await geocoder.geocode({ location: { lat, lng } });
    const formatted = res.results?.[0]?.formatted_address ?? "";
    setAddress(formatted);
  };

  const setPoint = async (lat: number, lng: number) => {
    setMarker({ lat, lng });
    setCenter({ lat, lng });
    await reverseGeocode(lat, lng);
  };

  const confirm = () => {
    onConfirm({
      lat: marker.lat,
      lng: marker.lng,
      address: address || `${marker.lat}, ${marker.lng}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">Select Location</div>
          <button className="px-3 py-1 border rounded" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="p-4 space-y-3">
          {!isLoaded ? (
            <div className="p-6">Loading map...</div>
          ) : (
            <>
              <div className="h-[420px] w-full border rounded overflow-hidden">
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={center}
                  zoom={14}
                  onClick={async (e) => {
                    if (!e.latLng) return;
                    await setPoint(e.latLng.lat(), e.latLng.lng());
                  }}
                >
                  <Marker
                    position={marker}
                    draggable
                    onDragEnd={async (e) => {
                      if (!e.latLng) return;
                      await setPoint(e.latLng.lat(), e.latLng.lng());
                    }}
                  />
                </GoogleMap>
              </div>

              <div className="text-sm text-gray-700">
                <div>
                  <b>Address:</b> {address || "—"}
                </div>
                <div>
                  <b>Lat/Lng:</b> {marker.lat.toFixed(6)} , {marker.lng.toFixed(6)}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 border rounded" onClick={onClose}>
                  Cancel
                </button>
                <button className="px-4 py-2 bg-black text-white rounded" onClick={confirm}>
                  Confirm Location
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}