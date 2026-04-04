import React, { useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { MapPin, LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom marker icon
const customIcon = L.divIcon({
  className: "custom-marker",
  html: `
    <div style="
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #5b21b6, #4338ca);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(91, 33, 182, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 12px;
        height: 12px;
        background: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function LocationMarker({ position, onLocationSelect }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });

  return position ? <Marker position={position} icon={customIcon} /> : null;
}

function FlyToLocation({ coords }) {
  const map = useMap();
  if (coords) {
    map.flyTo(coords, 13, { animate: true });
  }
  return null;
}

export default function LocationMapPicker({ position, onLocationSelect, onClose }) {
  const [markerPos, setMarkerPos] = useState(position || null);
  const [flyTo, setFlyTo] = useState(null);
  const [locating, setLocating] = useState(false);
  const center = position || [20.5937, 78.9629];

  const handleLocationClick = async (lat, lng) => {
    setMarkerPos([lat, lng]);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();

      const city = data.address?.city ||
                   data.address?.town ||
                   data.address?.village ||
                   data.address?.state_district ||
                   data.address?.state || "";

      const area = data.address?.suburb ||
                   data.address?.neighbourhood ||
                   data.address?.quarter || "";

      onLocationSelect({ lat, lng, city, area });
    } catch (error) {
      console.error("Geocoding error:", error);
      onLocationSelect({ lat, lng, city: "", area: "" });
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setFlyTo([lat, lng]);
        handleLocationClick(lat, lng);
        setLocating(false);
      },
      () => {
        setLocating(false);
        alert("Could not get your location. Please allow location access.");
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Pick Your Location</h3>
              <p className="text-xs text-gray-500">Tap anywhere on the map</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUseMyLocation}
              disabled={locating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-700 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <LocateFixed className="w-4 h-4" />
              {locating ? "Locating..." : "Use My Location"}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="h-[460px] relative">
          <MapContainer
            center={center}
            zoom={position ? 12 : 5}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            <LocationMarker position={markerPos} onLocationSelect={handleLocationClick} />
            {flyTo && <FlyToLocation coords={flyTo} />}
          </MapContainer>
        </div>

        <div className="p-4 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            Click on the map to select your location. City and area will be detected automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
