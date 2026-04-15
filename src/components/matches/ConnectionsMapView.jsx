import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MessageCircle, MapPin, Loader2, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { base44 } from "@/api/base44Client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const COLORS = ["#7c3aed", "#2563eb", "#059669", "#dc2626", "#d97706", "#db2777", "#0891b2"];

function avatarIcon(nickname, colorIdx) {
  const color = COLORS[colorIdx % COLORS.length];
  const letter = (nickname?.[0] || "?").toUpperCase();
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:44px; height:44px; border-radius:50%;
        background:${color}; border:3px solid white;
        box-shadow:0 4px 14px rgba(0,0,0,0.25);
        display:flex; align-items:center; justify-content:center;
        font-size:18px; font-weight:700; color:white;
        font-family:system-ui,sans-serif;
      ">${letter}</div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
}

async function geocodeCity(city) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`
    );
    const data = await res.json();
    if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {}
  return null;
}

// Auto-fit map to all pins
function FitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 1) {
      map.setView(coords[0], 8);
    } else if (coords.length > 1) {
      map.fitBounds(coords, { padding: [40, 40], maxZoom: 8 });
    }
  }, [coords, map]);
  return null;
}

export default function ConnectionsMapView({ accepted, user }) {
  const [pins, setPins]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accepted.length) { setLoading(false); return; }

    async function load() {
      const results = [];
      for (const match of accepted) {
        const otherEmail =
          match.from_user === user.email ? match.to_user : match.from_user;
        try {
          const memories = await base44.entities.TimeMemory.filter({
            created_by: otherEmail,
          });
          if (!memories?.length) continue;
          // Pick the memory with the highest year (most recent life stage)
          const latest = [...memories].sort(
            (a, b) => (b.year || 0) - (a.year || 0)
          )[0];
          if (!latest.current_city) continue;
          const coords = await geocodeCity(latest.current_city);
          if (!coords) continue;
          results.push({
            matchId: match.id,
            email: otherEmail,
            nickname: latest.nickname || otherEmail.split("@")[0],
            currentCity: latest.current_city,
            coords,
          });
        } catch {}
      }
      setPins(results);
      setLoading(false);
    }

    load();
  }, [accepted, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <p className="text-sm text-gray-500">Locating your connections…</p>
      </div>
    );
  }

  if (!pins.length) {
    return (
      <div className="text-center py-14">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <p className="font-semibold text-gray-800 mb-1">No locations yet</p>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          Once your connections have added a current city to their profile it will appear here.
        </p>
      </div>
    );
  }

  const allCoords = pins.map((p) => p.coords);

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="h-[380px] rounded-3xl overflow-hidden border border-gray-200 shadow-md">
        <MapContainer
          center={allCoords[0]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          zoomControl
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <FitBounds coords={allCoords} />
          {pins.map((pin, i) => (
            <Marker key={pin.matchId} position={pin.coords} icon={avatarIcon(pin.nickname, i)}>
              <Popup maxWidth={220} closeButton={false}>
                <div className="p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      style={{ background: COLORS[i % COLORS.length] }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    >
                      {pin.nickname[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm leading-tight">{pin.nickname}</p>
                      <p className="text-[11px] text-gray-500 flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" /> {pin.currentCity}
                      </p>
                    </div>
                  </div>
                  <Link to={createPageUrl(`Messages?matchId=${pin.matchId}`)}>
                    <button
                      style={{ background: "#1e1144" }}
                      className="w-full text-white text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-semibold"
                    >
                      <MessageCircle className="w-3 h-3" /> Open Chat
                    </button>
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Connection list below map */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
        {pins.length} connection{pins.length !== 1 ? "s" : ""} on the map
      </p>
      <div className="space-y-2">
        {pins.map((pin, i) => (
          <Link key={pin.matchId} to={createPageUrl(`Messages?matchId=${pin.matchId}`)}>
            <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-sm transition-all">
              <div
                style={{ background: COLORS[i % COLORS.length] }}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
              >
                {pin.nickname[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{pin.nickname}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {pin.currentCity}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-violet-600" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
