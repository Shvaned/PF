"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";

interface PerformanceData {
  current: Record<string, number>;
  overallScore: number;
  previous7d: Record<string, number> | null;
  previous30d: Record<string, number> | null;
  allTime: Record<string, number> | null;
  snapshots: { overallScore: number; createdAt: string }[];
  strongestAreas: string[];
  weakestAreas: string[];
  recommendations: CoachingRec[];
}

interface CoachingRec {
  area: string;
  currentScore: number;
  change: number | null;
  suggestion: string;
  expectedGain: number;
}

const LABELS: Record<string, string> = {
  communication: "Communication",
  confidence: "Confidence",
  behavioral: "Behavioral Answers",
  technical: "Technical Depth",
  problemSolving: "Problem Solving",
  structure: "Answer Structure",
  clarity: "Clarity",
  relevance: "Relevance",
  leadership: "Leadership / Ownership",
  systemThinking: "System Thinking",
};

function scoreBar(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-gray-300";
}

function trendIcon(current: number, previous: number | null) {
  if (!previous) return null;
  const diff = current - previous;
  if (diff > 3) return { icon: "↑", color: "text-emerald-500" };
  if (diff < -3) return { icon: "↓", color: "text-red-500" };
  return { icon: "→", color: "text-gray-400" };
}

export default function PerformanceInsightsPage() {
  const router = useRouter();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/performance");
      if (res.status === 401) { router.push("/onboarding"); return; }
      const d = await res.json();
      if (d.error) { setError(d.error); return; }
      setData(d);
    } catch {
      setError("Could not load performance data.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function refresh() {
    setLoading(true);
    await fetch("/api/performance", { method: "POST" });
    await fetchData();
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-100 rounded-xl" />
        <div className="h-48 bg-gray-100 rounded-xl" />
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-[#111827]">Interview Performance</h1>
          <p className="text-sm text-[#6B7280] mt-1">Your improvement over time, measured across 10 dimensions.</p>
        </div>
        <button onClick={refresh} className="text-sm px-4 py-2 rounded-[10px] border border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB] transition-colors">
          Refresh
        </button>
      </div>

      {/* Heatmap */}
      <Card className="mb-6">
        <h3 className="text-[16px] font-medium text-[#111827] mb-5">Performance Heatmap</h3>
        <div className="space-y-3">
          {Object.entries(LABELS).map(([key, label]) => {
            const score = data.current[key] || 45;
            const previous = data.previous7d ? data.previous7d[key] : null;
            const trend = trendIcon(score, previous);
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[#111827]">{label}</span>
                  <div className="flex items-center gap-2">
                    {trend && <span className={`text-xs font-bold ${trend.color}`}>{trend.icon}</span>}
                    <span className="text-sm font-semibold text-[#111827]">{score}</span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${scoreBar(score)}`}
                    style={{ width: `${Math.max(score, 6)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Strengths + Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <Card>
          <h3 className="text-[16px] font-medium text-[#111827] mb-3">Strongest Areas</h3>
          <div className="space-y-2">
            {data.strongestAreas.map((key) => (
              <div key={key} className="flex items-center gap-2 text-sm p-2.5 bg-emerald-50 rounded-[8px]">
                <span className="text-emerald-500 shrink-0">&#x2713;</span>
                <span>{LABELS[key] || key}</span>
                <span className="ml-auto text-xs font-medium text-emerald-600">{data.current[key]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-[16px] font-medium text-[#111827] mb-3">Focus Areas</h3>
          <div className="space-y-2">
            {data.weakestAreas.map((key) => (
              <div key={key} className="flex items-center gap-2 text-sm p-2.5 bg-amber-50 rounded-[8px]">
                <span className="text-amber-500 shrink-0">&#x2191;</span>
                <span>{LABELS[key] || key}</span>
                <span className="ml-auto text-xs font-medium text-amber-600">{data.current[key]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Trend line(s) — simple SVG sparklines */}
      {data.snapshots.length > 1 && (
        <Card className="mb-6">
          <h3 className="text-[16px] font-medium text-[#111827] mb-4">Trend Over Time</h3>
          <div className="h-40">
            <svg className="w-full h-full" viewBox={`0 0 ${data.snapshots.length * 40} 100`} preserveAspectRatio="none">
              <polyline
                fill="none" stroke="#2563EB" strokeWidth="2"
                points={data.snapshots.map((s, i) =>
                  `${i * 40},${100 - (s.overallScore || 45)}`
                ).join(" ")}
              />
              {data.snapshots.map((s, i) => (
                <circle
                  key={i}
                  cx={i * 40} cy={100 - (s.overallScore || 45)} r="3"
                  fill="#2563EB"
                />
              ))}
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-2">
            <span>{new Date(data.snapshots[data.snapshots.length - 1]?.createdAt).toLocaleDateString()}</span>
            <span>{new Date(data.snapshots[0]?.createdAt).toLocaleDateString()}</span>
          </div>
        </Card>
      )}

      {/* AI Coaching */}
      {data.recommendations.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-[16px] font-medium text-[#111827] mb-4">Coaching Recommendations</h3>
          <div className="space-y-3">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-[10px]">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-[#111827]">{rec.area}</p>
                    {rec.change !== null && (
                      <p className="text-[11px] text-[#9CA3AF]">
                        {rec.change > 0 ? `Improved by ${rec.change}%` : rec.change < 0 ? `Declined by ${Math.abs(rec.change)}%` : "Stable"}
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] font-medium">
                    +{rec.expectedGain} readiness
                  </span>
                </div>
                <p className="text-sm text-[#6B7280]">{rec.suggestion}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-3">
        <Button href="/mock-interview">Practice Mock Interview</Button>
        <Button href="/readiness" variant="secondary">View Readiness Score</Button>
      </div>
    </div>
  );
}
