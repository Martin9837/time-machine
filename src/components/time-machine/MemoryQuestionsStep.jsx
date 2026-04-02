import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

const questionBank = {
  school: [
    { key: "institution_name", label: "What was the name of your school?", type: "text" },
    { key: "favorite_memory", label: "Who was your favorite teacher or subject?", type: "text" },
    { key: "memorable_incident", label: "One memorable incident from that time?", type: "textarea" },
  ],
  college: [
    { key: "institution_name", label: "What was the name of your college?", type: "text" },
    { key: "favorite_memory", label: "What was your favorite hangout spot on campus?", type: "text" },
    { key: "memorable_incident", label: "One unforgettable moment from college?", type: "textarea" },
  ],
  company: [
    { key: "institution_name", label: "Company name and your role?", type: "text" },
    { key: "favorite_memory", label: "How did you commute to work?", type: "text" },
    { key: "memorable_incident", label: "One thing you miss about that job?", type: "textarea" },
  ],
  society: [
    { key: "institution_name", label: "Society or area name?", type: "text" },
    { key: "favorite_memory", label: "Common hangout place?", type: "text" },
    { key: "memorable_incident", label: "Any festival or event you remember clearly?", type: "textarea" },
  ],
  other: [
    { key: "institution_name", label: "What was it about?", type: "text" },
    { key: "favorite_memory", label: "What do you remember most?", type: "text" },
    { key: "memorable_incident", label: "Share a vivid memory from that time", type: "textarea" },
  ],
};

export default function MemoryQuestionsStep({ data, onChange }) {
  const contexts = data.contexts || [];
  const answers = data.memory_answers || {};

  const questions = useMemo(() => {
    const qs = [];
    contexts.forEach((ctx) => {
      if (questionBank[ctx]) {
        questionBank[ctx].forEach((q) => {
          qs.push({ ...q, context: ctx, id: `${ctx}_${q.key}` });
        });
      }
    });
    return qs;
  }, [contexts]);

  const handleChange = (id, value) => {
    onChange({
      ...data,
      memory_answers: { ...answers, [id]: value },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Share your memories</h2>
        <p className="text-gray-500 text-sm">These help us find people who were part of your story</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Your answers are never shown publicly. They're only used to find meaningful matches.
        </p>
      </div>

      <div className="space-y-5">
        {questions.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              <span className="inline-block px-2 py-0.5 bg-violet-100 text-violet-700 rounded-md text-xs font-semibold mr-2 capitalize">
                {q.context}
              </span>
              {q.label}
            </Label>
            {q.type === "textarea" ? (
              <Textarea
                placeholder="Type your answer..."
                value={answers[q.id] || ""}
                onChange={(e) => handleChange(q.id, e.target.value)}
                className="rounded-2xl border-gray-200 bg-white min-h-[80px] focus:ring-violet-500 focus:border-violet-500"
              />
            ) : (
              <Input
                placeholder="Type your answer..."
                value={answers[q.id] || ""}
                onChange={(e) => handleChange(q.id, e.target.value)}
                className="h-14 rounded-2xl border-gray-200 bg-white focus:ring-violet-500 focus:border-violet-500"
              />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}