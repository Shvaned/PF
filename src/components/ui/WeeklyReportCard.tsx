"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface ReportData {
  report: {
    weekStart: string; weekEnd: string;
    readinessBefore: number; readinessAfter: number;
    interviewConfidenceDelta: number;
    mockCount: number; challengeCount: number;
    wins: string[]; focusAreas: string[];
    recommendations: string[]; premiumInsights: any;
  } | null;
}

export default function WeeklyReportCard() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/weekly-report")
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
        </div>
      </Card>
    );
  }

  if (!data?.report) return null;

  const r = data.report;
  const delta = r.readinessAfter - r.readinessBefore;

  return (
    <Card className="mb-6 bg-gradient-to-br from-[#22C55E]/[0.03] to-[#2563EB]/[0.03] border border-green-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[16px] font-medium text-[#111827]">Your Weekly Report</h3>
        <span className="text-[10px] text-[#9CA3AF]">{r.weekStart} — {r.weekEnd}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-[10px] text-[#9CA3AF]">Readiness</p>
          <p className="text-lg font-bold text-[#111827]">{r.readinessAfter}</p>
          {delta !== 0 && (
            <span className={`text-[10px] font-medium ${delta > 0 ? "text-green-600" : "text-red-500"}`}>
              {delta > 0 ? "+" : ""}{delta}
            </span>
          )}
        </div>
        <div className="text-center">
          <p className="text-[10px] text-[#9CA3AF]">Confidence</p>
          <p className={`text-lg font-bold ${r.interviewConfidenceDelta > 0 ? "text-green-600" : "text-[#111827]"}`}>
            {r.interviewConfidenceDelta > 0 ? "+" : ""}{r.interviewConfidenceDelta}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-[#9CA3AF]">Activity</p>
          <p className="text-lg font-bold text-[#111827]">{r.mockCount + r.challengeCount}</p>
          <span className="text-[10px] text-[#9CA3AF]">sessions</span>
        </div>
      </div>

      {r.wins.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1">Biggest Wins</p>
          {r.wins.slice(0, 2).map((w, i) => (
            <p key={i} className="text-xs text-green-700 flex items-center gap-1">
              <span>✓</span> {w}
            </p>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button href="/career-reports" variant="secondary" className="text-xs">View Full Report</Button>
      </div>
    </Card>
  );
}
