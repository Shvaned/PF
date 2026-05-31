"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface TailorSection {
  section: string;
  original: string;
  improved: string;
  reason: string;
}

interface TailorResult {
  tailoredResume: string;
  sections: TailorSection[];
  atsImprovement: number;
  matchImprovement: number;
  appliedKeywords: string[];
  warnings: string[];
  resumeId: string;
}

const SECTION_LABELS: Record<string, string> = {
  summary: "Summary",
  experience: "Experience",
  skills: "Skills",
  education: "Education",
  projects: "Projects",
};

export default function TailorDiff({ result, onClose }: { result: TailorResult; onClose: () => void }) {
  const [view, setView] = useState<"diff" | "full">("diff");
  const [acceptedSections, setAcceptedSections] = useState<Set<number>>(new Set());

  function toggleSection(i: number) {
    const next = new Set(acceptedSections);
    if (next.has(i)) next.delete(i); else next.add(i);
    setAcceptedSections(next);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[3vh] overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[24px] shadow-2xl max-w-3xl w-full p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[20px] font-semibold text-[#111827]">Tailored Resume</h2>
            <p className="text-sm text-[#6B7280]">
              AI-optimized for ATS and role alignment. Review each change — nothing is saved until you accept.
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-[#9CA3AF]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Impact summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-green-50 rounded-[10px] p-3 text-center">
            <p className="text-[10px] text-[#9CA3AF] uppercase">ATS Improvement</p>
            <p className="text-xl font-bold text-green-600">+{result.atsImprovement}</p>
          </div>
          <div className="bg-blue-50 rounded-[10px] p-3 text-center">
            <p className="text-[10px] text-[#9CA3AF] uppercase">Match Improvement</p>
            <p className="text-xl font-bold text-[#2563EB]">+{result.matchImprovement}</p>
          </div>
          <div className="bg-purple-50 rounded-[10px] p-3 text-center">
            <p className="text-[10px] text-[#9CA3AF] uppercase">Keywords Added</p>
            <p className="text-xl font-bold text-purple-600">{result.appliedKeywords.length}</p>
          </div>
        </div>

        {/* Applied keywords */}
        {result.appliedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {result.appliedKeywords.map((k) => (
              <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB]">{k}</span>
            ))}
          </div>
        )}

        {/* View toggle */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setView("diff")}
            className={`text-xs px-3 py-1.5 rounded-[8px] ${view === "diff" ? "bg-[#2563EB] text-white" : "bg-gray-100 text-[#6B7280]"}`}>
            Changes ({result.sections.length})
          </button>
          <button onClick={() => setView("full")}
            className={`text-xs px-3 py-1.5 rounded-[8px] ${view === "full" ? "bg-[#2563EB] text-white" : "bg-gray-100 text-[#6B7280]"}`}>
            Full Resume
          </button>
        </div>

        {/* Diff view */}
        {view === "diff" && (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto mb-6">
            {result.sections.map((s, i) => (
              <div key={i} className={`border rounded-[12px] p-4 transition-colors ${
                acceptedSections.has(i) ? "border-green-300 bg-green-50/50" : "border-[#E5E7EB]"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">
                    {SECTION_LABELS[s.section] || s.section}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#6B7280]">{s.reason}</span>
                    <button onClick={() => toggleSection(i)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        acceptedSections.has(i)
                          ? "border-green-300 bg-green-100 text-green-700"
                          : "border-[#D1D5DB] text-[#6B7280] hover:border-[#2563EB]"
                      }`}>
                      {acceptedSections.has(i) ? "Accepted" : "Accept"}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="bg-red-50 rounded-[6px] p-2">
                    <span className="text-red-400 font-medium text-[10px]">Before</span>
                    <p className="text-[#374151] mt-0.5">{s.original}</p>
                  </div>
                  <div className="bg-green-50 rounded-[6px] p-2">
                    <span className="text-green-500 font-medium text-[10px]">Improved</span>
                    <p className="text-[#374151] mt-0.5">{s.improved}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full view */}
        {view === "full" && (
          <div className="max-h-[50vh] overflow-y-auto mb-6">
            <Card className="p-4">
              <pre className="text-sm text-[#374151] whitespace-pre-wrap font-sans leading-relaxed">
                {result.tailoredResume}
              </pre>
            </Card>
          </div>
        )}

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 rounded-[10px] border border-amber-200">
            {result.warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-700">⚠ {w}</p>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button href={`/resume-lab`} className="flex-1 text-sm">
            View in Resume Lab
          </Button>
          <button onClick={onClose} className="flex-1 py-3 border border-[#E5E7EB] text-[#6B7280] text-sm font-semibold rounded-[14px] hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
