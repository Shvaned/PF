"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface RoadmapData {
  roadmap: {
    id: string;
    title: string;
    currentReadiness: number;
    targetReadiness: number;
    startDate: string;
    endDate: string;
    tasks: any[];
  } | null;
  progress: {
    total: number;
    completed: number;
    progress: number;
    currentDay: number;
    today: any[];
    streak: number;
  } | null;
}

export default function RoadmapCard() {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/roadmap")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function generate() {
    setLoading(true);
    await fetch("/api/roadmap", { method: "POST" });
    const res = await fetch("/api/roadmap");
    const d = await res.json();
    setData(d);
    setLoading(false);
  }

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

  // No roadmap yet — prompt to generate
  if (!data?.roadmap) {
    return (
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-medium text-[#111827] mb-1">Your 30-Day Hiring Plan</h3>
            <p className="text-sm text-[#6B7280]">Get a personalized roadmap to improve your hiring readiness.</p>
          </div>
          <button onClick={generate}
            className="px-4 py-2 bg-[#2563EB] text-white text-sm font-semibold rounded-[10px] hover:bg-[#1D4ED8] transition-colors">
            Generate Plan
          </button>
        </div>
      </Card>
    );
  }

  const p = data.progress!;
  const r = data.roadmap;

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[16px] font-medium text-[#111827]">Your 30-Day Hiring Plan</h3>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Day {p.currentDay} / 30 · {p.progress}% complete
          </p>
        </div>
        <Button href="/roadmap" variant="secondary" className="text-xs">Continue</Button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-full transition-all duration-500"
          style={{ width: `${Math.max(p.progress, 4)}%` }}
        />
      </div>

      {/* Today's tasks */}
      <div className="space-y-2">
        <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide font-medium">Today's Tasks</p>
        {p.today.length === 0 && (
          <p className="text-xs text-[#9CA3AF]">All done for today! 🎉</p>
        )}
        {p.today.map((t: any) => (
          <div key={t.id} className="flex items-center gap-2 text-sm py-1">
            <span className={t.completed ? "text-green-500" : "text-[#D1D5DB]"}>
              {t.completed ? "✓" : "○"}
            </span>
            <span className={t.completed ? "text-[#9CA3AF] line-through" : "text-[#111827]"}>{t.title}</span>
            {t.premium && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 ml-auto">PRO</span>}
          </div>
        ))}
      </div>

      {p.streak > 2 && (
        <p className="mt-3 text-xs text-[#22C55E] font-medium">{p.streak} days consistent — keep it up</p>
      )}
    </Card>
  );
}
