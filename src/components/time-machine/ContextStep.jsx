import React from "react";
import { GraduationCap, Building2, Home, BookOpen, PenLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const contextOptions = [
  { id: "school", label: "School", icon: BookOpen, color: "bg-blue-50 border-blue-200 text-blue-700" },
  { id: "college", label: "College", icon: GraduationCap, color: "bg-purple-50 border-purple-200 text-purple-700" },
  { id: "company", label: "Company / Workplace", icon: Building2, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  { id: "society", label: "Society / Neighborhood", icon: Home, color: "bg-amber-50 border-amber-200 text-amber-700" },
  { id: "other", label: "Other", icon: PenLine, color: "bg-gray-50 border-gray-200 text-gray-700" },
];

export default function ContextStep({ data, onChange }) {
  const selected = data.contexts || [];

  const toggle = (id) => {
    const updated = selected.includes(id)
      ? selected.filter((c) => c !== id)
      : [...selected, id];
    onChange({ ...data, contexts: updated });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What were you doing?</h2>
        <p className="text-gray-500 text-sm">
          In {data.city || "that city"}, {data.year || "that year"} — what was your life about?
        </p>
      </div>

      <div className="space-y-3">
        {contextOptions.map((opt) => {
          const isSelected = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                isSelected
                  ? "border-violet-500 bg-violet-50 shadow-sm"
                  : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isSelected ? "bg-violet-100" : opt.color.split(" ")[0]
              }`}>
                <opt.icon className={`w-5 h-5 ${isSelected ? "text-violet-600" : opt.color.split(" ")[2]}`} />
              </div>
              <span className={`font-medium ${isSelected ? "text-violet-900" : "text-gray-700"}`}>
                {opt.label}
              </span>
              {isSelected && (
                <div className="ml-auto w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected.includes("other") && (
        <Input
          placeholder="Tell us more..."
          value={data.otherContext || ""}
          onChange={(e) => onChange({ ...data, otherContext: e.target.value })}
          className="h-14 rounded-2xl border-gray-200 bg-white text-base"
        />
      )}
    </motion.div>
  );
}