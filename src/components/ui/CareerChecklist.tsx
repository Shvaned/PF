"use client";

import { useState, useEffect } from "react";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
}

const items: ChecklistItem[] = [
  { id: "resume", label: "Resume ready", description: "Your resume is updated and tailored for the role" },
  { id: "linkedin", label: "LinkedIn ready", description: "Your profile is complete with a photo, headline, and summary" },
  { id: "interview", label: "Interview prep ready", description: "You've practiced common questions and answers" },
  { id: "portfolio", label: "Portfolio ready", description: "Your work samples or projects are organized and accessible" },
];

const STORAGE_KEY = "prepfit_career_checklist";

function loadState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export default function CareerChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setChecked(loadState());
    setHydrated(true);
  }, []);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveState(next);
      return next;
    });
  }

  if (!hydrated) {
    return <div className="h-20 bg-gray-50 rounded-[14px] animate-pulse" />;
  }

  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div className="bg-white rounded-[14px] p-4 border border-[#E5E7EB]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-medium text-[#111827]">Career Readiness</h3>
        <span className="text-xs text-[#6B7280]">{done}/{items.length}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-300"
          style={{ width: `${(done / items.length) * 100}%` }}
        />
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            className="w-full flex items-start gap-2.5 text-left group"
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                checked[item.id]
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300 group-hover:border-green-400"
              }`}
            >
              {checked[item.id] && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <p className={`text-sm ${checked[item.id] ? "text-[#9CA3AF] line-through" : "text-[#374151]"}`}>
                {item.label}
              </p>
              <p className="text-xs text-[#9CA3AF]">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
