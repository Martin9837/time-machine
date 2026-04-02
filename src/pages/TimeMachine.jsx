import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Rocket, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StepIndicator from "../components/time-machine/StepIndicator";
import YearCityStep from "../components/time-machine/YearCityStep";
import ContextStep from "../components/time-machine/ContextStep";
import MemoryQuestionsStep from "../components/time-machine/MemoryQuestionsStep";
import PresentDayStep from "../components/time-machine/PresentDayStep";

export default function TimeMachine() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    year: "",
    month: null,
    city: "",
    area: "",
    contexts: [],
    memory_answers: {},
    nickname: "",
    current_city: "",
    open_to_connect: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then((user) => {
      if (user.full_name) {
        setData((d) => ({ ...d, nickname: d.nickname || user.full_name.split(" ")[0] }));
      }
    });
  }, []);

  const canNext = () => {
    if (step === 0) return data.year && data.city;
    if (step === 1) return data.contexts.length > 0;
    if (step === 2) return true;
    if (step === 3) return data.nickname && data.current_city && data.open_to_connect !== null;
    return false;
  };

  const handleSave = async () => {
    setSaving(true);
    const user = await base44.auth.me();

    // Extract keywords from answers
    const keywords = Object.values(data.memory_answers || {})
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    // Find institution name from answers
    const institutionKey = Object.keys(data.memory_answers || {}).find((k) =>
      k.includes("institution_name")
    );
    const institutionName = institutionKey ? data.memory_answers[institutionKey] : "";

    // Build memory_answers as array
    const memoryAnswersArr = Object.entries(data.memory_answers || {}).map(([key, value]) => ({
      question: key,
      answer: value,
    }));

    await base44.entities.TimeMemory.create({
      year: data.year,
      month: data.month || null,
      city: data.city,
      area: data.area || "",
      contexts: data.contexts,
      institution_name: institutionName,
      memory_answers: memoryAnswersArr,
      current_city: data.current_city,
      open_to_connect: data.open_to_connect,
      nickname: data.nickname,
      keywords: [...new Set(keywords)],
    });

    setSaving(false);
    navigate(createPageUrl("Discover"));
  };

  const steps = [
    <YearCityStep data={data} onChange={setData} />,
    <ContextStep data={data} onChange={setData} />,
    <MemoryQuestionsStep data={data} onChange={setData} />,
    <PresentDayStep data={data} onChange={setData} />,
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          ) : (
            <div className="w-10" />
          )}
          <StepIndicator currentStep={step} totalSteps={4} />
          <div className="w-10" />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <div key={step}>{steps[step]}</div>
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-8 pb-6">
          {step < 3 ? (
            <Button
              disabled={!canNext()}
              onClick={() => setStep(step + 1)}
              className="w-full h-14 rounded-2xl bg-[#1e1144] hover:bg-[#2d1a6b] text-white font-semibold text-base gap-2 disabled:opacity-40"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              disabled={!canNext() || saving}
              onClick={handleSave}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold text-base gap-2 disabled:opacity-40 shadow-lg shadow-violet-200"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Launch Time Machine
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}