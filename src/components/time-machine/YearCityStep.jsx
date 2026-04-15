import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calendar, Map } from "lucide-react";
import { motion } from "framer-motion";
import LocationMapPicker from "./LocationMapPicker";

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function YearCityStep({ data, onChange }) {
  const [showMap, setShowMap] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);

  const handleMapSelect = (locationData) => {
    onChange({
      ...data,
      city: locationData.city || data.city,
      area: locationData.area || data.area,
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Where were you?</h2>
        <p className="text-gray-500 text-sm">Pick a year and place from your past</p>
      </div>

      <div className="mb-5">
        <Button
          type="button"
          onClick={() => setShowMap(true)}
          variant="outline"
          className="w-full h-14 rounded-2xl border-2 border-dashed border-violet-300 hover:border-violet-400 hover:bg-violet-50 gap-2 text-violet-600 font-semibold"
        >
          <Map className="w-5 h-5" />
          Select Location from Map
        </Button>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">From Year</Label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
              <Input
                type="number"
                min={1940}
                max={new Date().getFullYear()}
                placeholder="1990"
                value={data.year || ""}
                onChange={(e) => onChange({ ...data, year: parseInt(e.target.value) || "" })}
                className="pl-12 h-14 rounded-2xl border-gray-200 bg-white text-lg font-semibold focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">To Year</Label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
              <Input
                type="number"
                min={data.year || 1940}
                max={new Date().getFullYear()}
                placeholder="1995"
                value={data.year_end || ""}
                onChange={(e) => onChange({ ...data, year_end: parseInt(e.target.value) || "" })}
                className={`pl-12 h-14 rounded-2xl border-gray-200 bg-white text-lg font-semibold focus:ring-violet-500 focus:border-violet-500 ${
                  data.year_end && data.year && data.year_end < data.year ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""
                }`}
              />
            </div>
            {data.year_end && data.year && data.year_end < data.year && (
              <p className="text-xs text-red-500 mt-1 ml-1">&#34;To Year&#34; must be ≥ &#34;From Year&#34;</p>
            )}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Month <span className="text-gray-400 font-normal">(optional)</span>
          </Label>
          <Select
            value={data.month?.toString() || ""}
            onValueChange={(val) => onChange({ ...data, month: parseInt(val) })}
          >
            <SelectTrigger className="h-14 rounded-2xl border-gray-200 bg-white text-base focus:ring-violet-500">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">City</Label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
            <Input
              placeholder=""
              value={data.city || ""}
              onChange={(e) => onChange({ ...data, city: e.target.value })}
              className="pl-12 h-14 rounded-2xl border-gray-200 bg-white text-lg focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Area / Locality <span className="text-gray-400 font-normal">(optional)</span>
          </Label>
          <Input
            placeholder=""
            value={data.area || ""}
            onChange={(e) => onChange({ ...data, area: e.target.value })}
            className="h-14 rounded-2xl border-gray-200 bg-white text-lg focus:ring-violet-500 focus:border-violet-500"
          />
        </div>
      </div>

      {showMap && (
        <LocationMapPicker
          position={mapPosition}
          cityHint={data.city || ""}
          onLocationSelect={handleMapSelect}
          onClose={() => setShowMap(false)}
        />
      )}
    </motion.div>
  );
}