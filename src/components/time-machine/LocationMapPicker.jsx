import React, { useState, useEffect } from "react";
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

// Default fallback — Sweden instead of India
const SWEDEN_CENTER = [59.33, 18.07];

/**
 * Extract the best "area/locality" string from a Nominatim address object.
 * Priority: suburb > village > city_district > neighbourhood > quarter
 * We deliberately skip amenity/building/road fields which contain POI names.
 */
function extractArea(address) {
  return (
    address?.suburb ||
    address?.village ||
    address?.city_district ||
    address?.neighbourhood ||
    address?.quarter ||
    ""
  );
}

/**
 * Reverse-geocode with zoom=14 so we get building-level address detail,
 * but still extract the correct suburb/neighbourhood — not the building name.
 */
async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=14`
  );
  const data = await res.json();

  const city =
    data.address?.city ||
    data.address?.town ||
    data.address?.municipality ||
    data.address?.village ||
    data.address?.state_district ||
    data.address?.state ||
    "";

  const area = extractArea(data.address);

  return { city, area };
}

/**
 * Forward-geocode a city name → [lat, lng].
 * Used to pre-center the map on the city the user already typed.
 */
async function geocodeCity(cityName) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`
    );
    const data = await res.json();
    if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {}
  return null;
}

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
  useEffect(() => {
    if (coords) map.flyTo(coords, 13, { animate: true });
  }, [coords, map]);
  return null;
}

export default function LocationMapPicker({ position, cityHint, onLocationSelect, onClose }) {
  const [markerPos, setMarkerPos]   = useState(position || null);
  const [flyTo, setFlyTo]           = useState(null);
  const [locating, setLocating]     = useState(false);
  // Start at the passed position, or Sweden — resolved below via geocode / geolocation
  const [center, setCenter]         = useState(position || SWEDEN_CENTER);
  const [initialZoom, setInitialZoom] = useState(position ? 13 : 5);

  // On mount: try to set a sensible initial map center
  useEffect(() => {
    if (position) return; // already have coordinates — nothing to do

    // 1. If a city name was typed, geocode it for a precise center
    if (cityHint) {
      geocodeCity(cityHint).then((coords) => {
        if (coords) {
          setCenter(coords);
          setInitialZoom(12);
        }
      });
      return;
    }

    // 2. Try silent geolocation (no prompt — browser may serve from cache)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setCenter(coords);
          setInitialZoom(12);
        },
        () => {
          // Permission denied or unavailable — stay on Sweden default
        },
        { timeout: 4000, maximumAge: 60000 }
      );
    }
  }, []); // intentionally empty — runs once on mount only

  const handleLocationClick = async (lat, lng) => {
    setMarkerPos([lat, lng]);
    try {
      const { city, area } = await reverseGeocode(lat, lng);
      onLocationSelect({ lat, lng, city, area });
    } catch {
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
            zoom={initialZoom}
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
            Click on the map to select your location. City and neighbourhood will be detected automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
