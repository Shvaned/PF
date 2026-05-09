"use client";

import { useState } from "react";

interface Template {
  id: string;
  name: string;
  description: string;
  steps: { label: string; detail: string }[];
}

const templates: Template[] = [
  {
    id: "star",
    name: "STAR Method",
    description: "Best for behavioral questions",
    steps: [
      { label: "Situation", detail: "Set the context — where, when, what was happening" },
      { label: "Task", detail: "What was your specific responsibility or goal?" },
      { label: "Action", detail: "What did you do? Be specific about your contribution" },
      { label: "Result", detail: "What happened? Quantify the outcome if possible" },
    ],
  },
  {
    id: "par",
    name: "Problem-Action-Result",
    description: "Good for problem-solving questions",
    steps: [
      { label: "Problem", detail: "Describe the challenge you faced clearly" },
      { label: "Action", detail: "Explain the steps you took to address it" },
      { label: "Result", detail: "Share what you achieved and what you learned" },
    ],
  },
  {
    id: "tell-me",
    name: "Tell Me About Yourself",
    description: "Your 60-second introduction",
    steps: [
      { label: "Present", detail: "What you're doing now — your current role or recent education" },
      { label: "Past", detail: "Key experiences that led you here — 1-2 highlights" },
      { label: "Future", detail: "Why you're excited about this role and what you bring" },
    ],
  },
];

export default function AnswerTemplates() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-[14px] p-4 border border-[#E5E7EB]">
      <h3 className="text-[14px] font-medium text-[#111827] mb-3">Answer Frameworks</h3>
      <div className="space-y-2">
        {templates.map((t) => {
          const isOpen = activeId === t.id;
          return (
            <div key={t.id} className="border border-[#E5E7EB] rounded-[10px] overflow-hidden">
              <button
                onClick={() => setActiveId(isOpen ? null : t.id)}
                className="w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div>
                  <span className="text-sm font-medium text-[#111827]">{t.name}</span>
                  <span className="text-xs text-[#9CA3AF] ml-2">{t.description}</span>
                </div>
                <svg
                  className={`w-4 h-4 text-[#9CA3AF] transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                  {t.steps.map((step, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-xs font-medium text-[#2563EB] shrink-0 w-16">{step.label}</span>
                      <span className="text-xs text-[#6B7280]">{step.detail}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
