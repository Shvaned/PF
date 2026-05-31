"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface RoadmapData {
  roadmap: {
    id: string; title: string; goalRole: string;
    currentReadiness: number; targetReadiness: number;
    startDate: string; endDate: string;
    generatedReasoning: string;
    tasks: Task[];
  } | null;
  progress: {
    total: number; completed: number; progress: number;
    currentDay: number; today: Task[]; streak: number;
  } | null;
}

interface Task {
  id: string; dayNumber: number; weekNumber: number;
  title: string; description: string; category: string;
  priority: string; estimatedMinutes: number;
  completed: boolean; premium: boolean;
  improvementImpact: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  resume: "bg-blue-100 text-blue-700",
  ats: "bg-green-100 text-green-700",
  behavioral: "bg-purple-100 text-purple-700",
  mock: "bg-orange-100 text-orange-700",
  technical: "bg-cyan-100 text-cyan-700",
  jobhunt: "bg-pink-100 text-pink-700",
};

export default function RoadmapPage() {
  const router = useRouter();
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedWeek, setExpandedWeek] = useState(1);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchRoadmap = useCallback(async () => {
    try {
      const res = await fetch("/api/roadmap");
      if (res.status === 401) { router.push("/onboarding"); return; }
      const d = await res.json();
      if (d.error) { setError(d.error); return; }
      setData(d);
    } catch { setError("Could not load roadmap."); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchRoadmap(); }, [fetchRoadmap]);

  async function generate() {
    setLoading(true);
    try {
      await fetch("/api/roadmap", { method: "POST" });
      await fetchRoadmap();
    } catch { setLoading(false); }
  }

  async function toggle(taskId: string) {
    setToggling(taskId);
    try {
      const res = await fetch("/api/roadmap/task", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (res.ok) await fetchRoadmap();
    } catch {} finally { setToggling(null); }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-sm text-[#6B7280] mb-4">{error}</p>
        <Button onClick={fetchRoadmap} variant="secondary">Try Again</Button>
      </div>
    );
  }

  // No roadmap yet
  if (!data?.roadmap) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-5xl mb-4">🗓️</div>
        <h1 className="text-[24px] font-semibold text-[#111827] mb-2">Your 30-Day Hiring Plan</h1>
        <p className="text-sm text-[#6B7280] mb-6">
          We'll create a personalized roadmap based on your readiness score, weak areas, and career target.
          Each day has 2-3 actionable tasks designed to improve your hiring readiness.
        </p>
        <button onClick={generate}
          className="px-6 py-3 bg-[#2563EB] text-white text-sm font-semibold rounded-[14px] hover:bg-[#1D4ED8] transition-colors">
          Generate My Plan
        </button>
      </div>
    );
  }

  const p = data.progress!;
  const r = data.roadmap;
  const reasoning = r.generatedReasoning ? (() => { try { return JSON.parse(r.generatedReasoning); } catch { return null; } })() : null;

  // Group tasks by week
  const weeks: Task[][] = [];
  for (let w = 1; w <= 5; w++) {
    weeks.push(r.tasks.filter((t) => t.weekNumber === w));
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-[#111827]">{r.title}</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {r.goalRole} · {r.currentReadiness} → {r.targetReadiness} target readiness
          </p>
        </div>
        <button onClick={generate}
          className="text-sm px-4 py-2 rounded-[10px] border border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB] transition-colors">
          Regenerate
        </button>
      </div>

      {/* Overall progress */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[16px] font-medium text-[#111827]">Day {p.currentDay} of 30</h3>
            <p className="text-sm text-[#6B7280]">{p.completed} of {p.total} tasks complete</p>
          </div>
          <span className="text-2xl font-bold text-[#2563EB]">{p.progress}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-full transition-all duration-700"
            style={{ width: `${Math.max(p.progress, 2)}%` }}
          />
        </div>
        {p.streak > 2 && (
          <p className="mt-3 text-xs text-[#22C55E] font-medium">{p.streak} days consistent — keep the momentum</p>
        )}
      </Card>

      {/* Today's tasks */}
      <Card className="mb-6">
        <h3 className="text-[16px] font-medium text-[#111827] mb-4">Today's Tasks</h3>
        {p.today.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-[#9CA3AF]">All tasks completed for today!</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Jump ahead to the next day or review your progress.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {p.today.map((t) => (
              <div key={t.id}
                className={`flex items-start gap-3 p-3 rounded-[10px] transition-colors ${
                  t.completed ? "bg-green-50/50" : "bg-white border border-[#E5E7EB]"
                }`}>
                <button
                  onClick={() => toggle(t.id)}
                  disabled={toggling === t.id}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    t.completed
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-[#D1D5DB] hover:border-[#2563EB]"
                  }`}>
                  {t.completed && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm font-medium ${t.completed ? "text-[#9CA3AF] line-through" : "text-[#111827]"}`}>
                      {t.title}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[t.category] || "bg-gray-100 text-gray-600"}`}>
                      {t.category}
                    </span>
                    {t.premium && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">PRO</span>}
                  </div>
                  <p className="text-xs text-[#6B7280]">{t.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#9CA3AF]">
                    <span>{t.estimatedMinutes} min</span>
                    <span>· {t.priority} priority</span>
                    {t.improvementImpact && (() => {
                      try { const imp = JSON.parse(t.improvementImpact); return <span>· +{imp.points} readiness</span>; }
                      catch { return null; }
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Weekly view */}
      {weeks.map((weekTasks, wi) => (
        <Card key={wi} className="mb-4">
          <button
            onClick={() => setExpandedWeek(expandedWeek === wi + 1 ? 0 : wi + 1)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-[16px] font-medium text-[#111827]">
              Week {wi + 1}: {["Foundation", "Interview Readiness", "Technical Depth", "Application Readiness", "Final Review"][wi] || `Week ${wi + 1}`}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#9CA3AF]">
                {weekTasks.filter((t) => t.completed).length}/{weekTasks.length}
              </span>
              <svg className={`w-4 h-4 text-[#9CA3AF] transition-transform ${expandedWeek === wi + 1 ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {expandedWeek === wi + 1 && (
            <div className="mt-4 space-y-2">
              {weekTasks.map((t) => (
                <div key={t.id}
                  className={`flex items-center gap-3 py-1.5 px-2 rounded-[6px] text-sm ${
                    t.completed ? "text-[#9CA3AF]" : "text-[#111827]"
                  }`}>
                  <span className={t.completed ? "text-green-500" : "text-[#D1D5DB]"}>
                    {t.completed ? "✓" : "○"}
                  </span>
                  <span className="flex-1">Day {t.dayNumber}: {t.title}</span>
                  {t.premium && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">PRO</span>}
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      {/* Expected impact summary */}
      {reasoning && (
        <Card className="mb-6">
          <h3 className="text-[16px] font-medium text-[#111827] mb-3">Generated For Your Profile</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[#9CA3AF]">Current readiness:</span>
              <span className="ml-2 font-medium text-[#111827]">{reasoning.currentScore}</span>
            </div>
            <div>
              <span className="text-[#9CA3AF]">Target:</span>
              <span className="ml-2 font-medium text-[#22C55E]">+30 points</span>
            </div>
            {reasoning.focusAreas?.length > 0 && (
              <div className="col-span-2">
                <span className="text-[#9CA3AF]">Focus areas:</span>
                <span className="ml-2 font-medium text-[#111827]">{reasoning.focusAreas.join(", ")}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="flex gap-3">
        <Button href="/readiness" variant="secondary">View Readiness Score</Button>
        <Button href="/performance-insights" variant="secondary">View Performance</Button>
      </div>
    </div>
  );
}
