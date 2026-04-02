import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Send, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Fix for default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// City coordinates mapping (approximations)
const cityCoordinates = {
  mumbai: [19.0760, 72.8777],
  delhi: [28.6139, 77.2090],
  bangalore: [12.9716, 77.5946],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  hyderabad: [17.3850, 78.4867],
  pune: [18.5204, 73.8567],
  ahmedabad: [23.0225, 72.5714],
  jaipur: [26.9124, 75.7873],
  lucknow: [26.8467, 80.9462],
  chandigarh: [30.7333, 76.7794],
  kochi: [9.9312, 76.2673],
  bhopal: [23.2599, 77.4126],
  indore: [22.7196, 75.8577],
  coimbatore: [11.0168, 76.9558],
  default: [20.5937, 78.9629], // Center of India
};

function MapBounds({ matches }) {
  const map = useMap();

  useMemo(() => {
    if (matches.length > 0) {
      const bounds = matches.map((m) => {
        const city = m.city.toLowerCase().replace(/\s+/g, "");
        return cityCoordinates[city] || cityCoordinates.default;
      });
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
      }
    }
  }, [matches, map]);

  return null;
}

export default function MapView({ matches, onSendRequest, sendingTo }) {
  // Create custom icon with gradient
  const createCustomIcon = (score) => {
    const color = score >= 70 ? "#5b21b6" : score >= 50 ? "#4338ca" : "#6366f1";
    return L.divIcon({
      className: "custom-pin",
      html: `
        <div style="position: relative;">
          <div style="
            width: 32px;
            height: 32px;
            background: ${color};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          "></div>
          <div style="
            position: absolute;
            top: 6px;
            left: 6px;
            width: 14px;
            height: 14px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  return (
    <div className="h-[calc(100vh-200px)] rounded-3xl overflow-hidden border border-gray-200 shadow-lg">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapBounds matches={matches} />
        {matches.map((match, i) => {
          const city = match.city.toLowerCase().replace(/\s+/g, "");
          const coords = cityCoordinates[city] || cityCoordinates.default;

          return (
            <Marker key={i} position={coords} icon={createCustomIcon(match.score)}>
              <Popup maxWidth={280} className="custom-popup">
                <div className="p-2">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">
                        {match.nickname || "Someone"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {match.month ? monthNames[match.month - 1] + " " : ""}
                            {match.year}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>{match.city}{match.area ? `, ${match.area}` : ""}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-lg">
                      {match.score}%
                    </div>
                  </div>

                  {match.institution_name && (
                    <div className="bg-violet-50 rounded-lg p-2 mb-2">
                      <p className="text-violet-800 text-xs">
                        <span className="font-semibold">Connection:</span> {match.institution_name}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mb-3">
                    {match.contexts?.slice(0, 3).map((c) => (
                      <Badge
                        key={c}
                        variant="secondary"
                        className="text-[10px] capitalize rounded-md py-0"
                      >
                        {c}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    onClick={() => onSendRequest(match)}
                    disabled={sendingTo === match.id}
                    size="sm"
                    className="w-full h-9 rounded-xl bg-[#1e1144] hover:bg-[#2d1a6b] gap-1.5 text-xs font-semibold"
                  >
                    {sendingTo === match.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        Send Request
                      </>
                    )}
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}