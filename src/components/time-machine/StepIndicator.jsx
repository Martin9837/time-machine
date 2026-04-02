import React from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export default function StepIndicator({ currentStep, totalSteps, labels }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <div key={i} className="flex items-center gap-2">
            <motion.div
              initial={false}
              animate={{
                scale: isCurrent ? 1 : 0.85,
                backgroundColor: isCompleted ? "#5b21b6" : isCurrent ? "#4338ca" : "#e5e7eb",
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isCompleted || isCurrent ? "text-white" : "text-gray-400"
              }`}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
            </motion.div>
            {i < totalSteps - 1 && (
              <div className={`w-8 h-0.5 rounded-full ${isCompleted ? "bg-violet-600" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}