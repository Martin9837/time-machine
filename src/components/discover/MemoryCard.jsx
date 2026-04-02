import React from "react";
import { Calendar, MapPin, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function MemoryCard({ memory, onClick, index = 0 }) {
  const gradients = [
    "from-violet-600 to-indigo-600",
    "from-rose-500 to-orange-500",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-yellow-500",
    "from-blue-500 to-cyan-500",
  ];

  const gradient = gradients[index % gradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      <div className={`bg-gradient-to-br ${gradient} rounded-3xl p-5 text-white relative overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-white/70" />
            <span className="text-2xl font-bold">
              {memory.month ? `${monthNames[memory.month - 1]} ` : ""}{memory.year}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-white/70" />
            <span className="font-medium">
              {memory.city}
              {memory.area ? `, ${memory.area}` : ""}
            </span>
          </div>

          {memory.institution_name && (
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-white/70" />
              <span className="text-sm text-white/90">{memory.institution_name}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {memory.contexts?.map((ctx) => (
              <Badge
                key={ctx}
                className="bg-white/20 border-white/20 text-white text-xs capitalize hover:bg-white/30"
              >
                {ctx}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}