"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";

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
  lastCalculatedAt: string;
}

const DIMENSIONS = [
  { key: "resumeQualityScore", label: "Resume Quality", weight: "20%" },
  { key: "atsScore", label: "ATS Optimization", weight: "15%" },
  { key: "interviewReadinessScore", label: "Interview Readiness", weight: "20%" },
  { key: "behavioralConfidenceScore", label: "Behavioral Confidence", weight: "15%" },
  { key: "technicalReadinessScore", label: "Technical Readiness", weight: "15%" },
  { key: "marketCompetitivenessScore", label: "Market Competitiveness", weight: "15%" },
];

function scoreBar(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-gray-400";
}

function levelLabel(level: string) {
  switch (level) {
    case "interview-ready": return "Interview Ready";
    case "competitive": return "Competitive";
    case "developing": return "Developing";
    default: return "Beginner";
  }
}

export default function ReadinessPage() {
  const router = useRouter();
  const [data, setData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/readiness");
      if (res.status === 401) { router.push("/onboarding"); return; }
      const d = await res.json();
      if (d.error) { setError(d.error); return; }
      setData(d);
    } catch {
      setError("Could not load readiness data.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function recalc() {
    setRecalculating(true);
    try {
      const res = await fetch("/api/readiness", { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      // silent
    } finally {
      setRecalculating(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 animate-pulse space-y-3">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
        <Card className="animate-pulse">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-sm text-[#6B7280] mb-4">{error}</p>
        <Button onClick={fetchData} variant="secondary">Try Again</Button>
      </div>
    );
  }

  if (!data) return null;

  const progress = data.overallScore;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-[#111827]">Recruiter Readiness</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Last updated: {new Date(data.lastCalculatedAt).toLocaleDateString()}
          </p>
        </div>
        <button onClick={recalc} disabled={recalculating}
          className="text-sm px-4 py-2 rounded-[10px] border border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB] transition-colors disabled:opacity-50">
          {recalculating ? "Calculating..." : "Recalculate"}
        </button>
      </div>

      {/* Overall score card */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-32 h-32 shrink-0">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#E5E7EB" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke="url(#detailGradient)"
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="detailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[28px] font-bold text-[#111827]">{progress}</span>
              <span className="text-[10px] text-[#9CA3AF]">/ 100</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                data.level === "interview-ready" ? "text-emerald-600 bg-emerald-50" :
                data.level === "competitive" ? "text-blue-600 bg-blue-50" :
                data.level === "developing" ? "text-amber-600 bg-amber-50" :
                "text-gray-600 bg-gray-100"
              }`}>
                {levelLabel(data.level)}
              </span>
            </div>
            <p className="text-base font-medium text-[#111827] mb-1">
              {data.level === "interview-ready"
                ? "You're well-prepared for real interviews."
                : data.level === "competitive"
                ? "You're getting close to interview-ready."
                : data.level === "developing"
                ? "You're building your foundation — keep practicing."
                : "Start by uploading your resume and completing your first analysis."}
            </p>
            <p className="text-sm text-[#6B7280]">
              Your recruiter readiness score represents how prepared you are to realistically get hired.
            </p>
          </div>
        </div>
      </Card>

      {/* Category breakdown */}
      <Card className="mb-6">
        <h3 className="text-[16px] font-medium text-[#111827] mb-5">Category Breakdown</h3>
        <div className="space-y-4">
          {DIMENSIONS.map((dim) => {
            const score = (data as any)[dim.key] || 0;
            return (
              <div key={dim.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[#111827] font-medium">{dim.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#9CA3AF]">weight: {dim.weight}</span>
                    <span className="text-sm font-semibold text-[#111827]">{score}</span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${scoreBar(score)}`}
                    style={{ width: `${Math.max(score, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Strengths + Focus areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <Card>
          <h3 className="text-[16px] font-medium text-[#111827] mb-3">Top Strengths</h3>
          <div className="space-y-2">
            {data.strengths?.map((s) => (
              <div key={s} className="flex items-center gap-2 text-sm text-[#374151] p-2.5 bg-green-50 rounded-[8px]">
                <span className="text-green-500 shrink-0">&#x2713;</span>
                {s}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-[16px] font-medium text-[#111827] mb-3">Focus Areas</h3>
          <div className="space-y-2">
            {data.weaknesses?.map((w) => (
              <div key={w} className="flex items-center gap-2 text-sm text-[#374151] p-2.5 bg-amber-50 rounded-[8px]">
                <span className="text-amber-500 shrink-0">&#8593;</span>
                {w}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Improvement suggestions */}
      <Card className="mb-6">
        <h3 className="text-[16px] font-medium text-[#111827] mb-4">How to Improve</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-[10px]">
            <span className="text-sm font-bold text-[#2563EB] shrink-0">+3-5</span>
            <div>
              <p className="text-sm font-medium text-[#111827]">Complete a mock interview</p>
              <p className="text-xs text-[#6B7280]">Each completed mock improves interview readiness and behavioral confidence.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-[10px]">
            <span className="text-sm font-bold text-[#2563EB] shrink-0">+2-4</span>
            <div>
              <p className="text-sm font-medium text-[#111827]">Add quantified achievements to your resume</p>
              <p className="text-xs text-[#6B7280]">Metrics and numbers in your resume improve ATS optimization and resume quality.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-[10px]">
            <span className="text-sm font-bold text-[#2563EB] shrink-0">+3-6</span>
            <div>
              <p className="text-sm font-medium text-[#111827]">Practice behavioral questions using STAR method</p>
              <p className="text-xs text-[#6B7280]">Structured answers boost your behavioral confidence score.</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button href="/analyze">New Analysis</Button>
        <Button href="/mock-interview" variant="secondary">Practice Interview</Button>
      </div>
    </div>
  );
}
