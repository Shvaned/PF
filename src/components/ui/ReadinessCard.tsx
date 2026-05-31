"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface ReadinessData {
  overallScore: number;
  level: string;
  strengths: string[];
  weaknesses: string[];
  resumeQualityScore: number;
  atsScore: number;
  interviewReadinessScore: number;
  behavioralConfidenceScore: number;
  technicalReadinessScore: number;
  marketCompetitivenessScore: number;
}

function levelGradient(level: string) {
  switch (level) {
    case "interview-ready": return "from-emerald-500 to-green-600";
    case "competitive": return "from-blue-500 to-indigo-600";
    case "developing": return "from-amber-500 to-orange-500";
    default: return "from-gray-400 to-gray-500";
  }
}

function levelColor(level: string) {
  switch (level) {
    case "interview-ready": return "text-emerald-600 bg-emerald-50";
    case "competitive": return "text-blue-600 bg-blue-50";
    case "developing": return "text-amber-600 bg-amber-50";
    default: return "text-gray-600 bg-gray-100";
  }
}

export default function ReadinessCard() {
  const [data, setData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/readiness")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="mb-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const progress = data.overallScore;
  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <Card className="mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Progress ring */}
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 84 84">
            <circle cx="42" cy="42" r="38" fill="none" stroke="#E5E7EB" strokeWidth="6" />
            <circle
              cx="42" cy="42" r="38" fill="none"
              stroke={`url(#readinessGradient)`}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="readinessGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[18px] font-bold text-[#111827]">{progress}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[16px] font-semibold text-[#111827]">Recruiter Readiness</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${levelColor(data.level)}`}>
              {data.level.replace("-", " ")}
            </span>
          </div>
          <p className="text-sm text-[#6B7280]">
            How ready you are to realistically get hired
          </p>
        </div>

        {/* CTA */}
        <Button href="/readiness" variant="secondary" className="shrink-0 text-sm">
          View Insights
        </Button>
      </div>

      {/* Mini breakdown */}
      <div className="mt-5 pt-4 border-t border-[#E5E7EB] grid grid-cols-2 gap-x-4 gap-y-1.5">
        {data.strengths?.map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            <span className="text-[#6B7280]">Strong in</span>
            <span className="text-[#111827] font-medium">{s}</span>
          </div>
        ))}
        {data.weaknesses?.map((w) => (
          <div key={w} className="flex items-center gap-1.5 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-[#6B7280]">Focus on</span>
            <span className="text-[#111827] font-medium">{w}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
