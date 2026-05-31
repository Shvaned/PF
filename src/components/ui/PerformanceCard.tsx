"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface PerformanceData {
  current: Record<string, number>;
  overallScore: number;
  strongestAreas: string[];
  weakestAreas: string[];
}

const LABELS: Record<string, string> = {
  communication: "Communication",
  confidence: "Confidence",
  behavioral: "Behavioral",
  technical: "Technical",
  problemSolving: "Problem Solving",
  structure: "Structure",
  clarity: "Clarity",
  relevance: "Relevance",
  leadership: "Leadership",
  systemThinking: "System Thinking",
};

function scoreBar(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-gray-300";
}

export default function PerformanceCard() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/performance")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="mb-6 animate-pulse">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
          <div className="h-2 bg-gray-100 rounded w-full" />
        </div>
      </Card>
    );
  }

  if (!data || data.weakestAreas.length === 0) return null;

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-medium text-[#111827]">Focus Areas</h3>
        <Button href="/performance-insights" variant="secondary" className="text-xs">
          View Full Insights
        </Button>
      </div>

      <div className="space-y-2.5">
        {data.weakestAreas.slice(0, 3).map((key) => {
          const score = data.current[key] || 45;
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[#111827]">{LABELS[key] || key}</span>
                <span className="text-xs font-medium text-[#6B7280]">{score}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
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
  );
}
