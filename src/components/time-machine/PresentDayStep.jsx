import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Heart, HeartOff, Map } from "lucide-react";
import { motion } from "framer-motion";
import LocationMapPicker from "./LocationMapPicker";

export default function PresentDayStep({ data, onChange }) {
  const [showMap, setShowMap] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);

  const handleMapSelect = (locationData) => {
    onChange({
      ...data,
      current_city: locationData.city || data.current_city,
    });
    setMapPosition([locationData.lat, locationData.lng]);
    setShowMap(false);
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Back to the present</h2>
        <p className="text-gray-500 text-sm">Just a couple more things about you today</p>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">Your nickname</Label>
        <Input
          placeholder="How should people know you?"
          value={data.nickname || ""}
          onChange={(e) => onChange({ ...data, nickname: e.target.value })}
          className="h-14 rounded-2xl border-gray-200 bg-white text-lg focus:ring-violet-500 focus:border-violet-500"
        />
        <p className="text-xs text-gray-400 mt-1.5 ml-1">This is how you'll appear to matches</p>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">Current city</Label>
        <Button
          type="button"
          onClick={() => setShowMap(true)}
          variant="outline"
          className="w-full h-12 rounded-2xl border-2 border-dashed border-violet-300 hover:border-violet-400 hover:bg-violet-50 gap-2 text-violet-600 font-medium mb-3"
        >
          <Map className="w-4 h-4" />
          Pick from Map
        </Button>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
          <Input
            placeholder="Where do you live now?"
            value={data.current_city || ""}
            onChange={(e) => onChange({ ...data, current_city: e.target.value })}
            className="pl-12 h-14 rounded-2xl border-gray-200 bg-white text-lg focus:ring-violet-500 focus:border-violet-500"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Open to connecting with people from your past?
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onChange({ ...data, open_to_connect: true })}
            className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
              data.open_to_connect === true
                ? "border-violet-500 bg-violet-50"
                : "border-gray-100 bg-white hover:border-gray-200"
            }`}
          >
            <Heart className={`w-5 h-5 ${data.open_to_connect === true ? "text-violet-600" : "text-gray-400"}`} />
            <span className={`font-semibold ${data.open_to_connect === true ? "text-violet-700" : "text-gray-600"}`}>
              Yes!
            </span>
          </button>
          <button
            onClick={() => onChange({ ...data, open_to_connect: false })}
            className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
              data.open_to_connect === false
                ? "border-gray-500 bg-gray-50"
                : "border-gray-100 bg-white hover:border-gray-200"
            }`}
          >
            <HeartOff className={`w-5 h-5 ${data.open_to_connect === false ? "text-gray-600" : "text-gray-400"}`} />
            <span className={`font-semibold ${data.open_to_connect === false ? "text-gray-700" : "text-gray-600"}`}>
              Not now
            </span>
          </button>
        </div>
      </div>

      {showMap && (
        <LocationMapPicker
          position={mapPosition}
          cityHint={data.current_city || ""}
          onLocationSelect={handleMapSelect}
          onClose={() => setShowMap(false)}
        />
      )}
    </motion.div>
  );
}