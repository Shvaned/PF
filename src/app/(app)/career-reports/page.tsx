"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Report {
  weekStart: string; weekEnd: string;
  readinessBefore: number; readinessAfter: number;
  interviewConfidenceDelta: number;
  resumeScoreDelta: number; atsScoreDelta: number;
  mockCount: number; challengeCount: number;
  jobApplicationsCount: number; resumeTailorsCount: number;
  wins: string[]; focusAreas: string[];
  recommendations: string[];
  premiumInsights: any;
}

export default function CareerReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<{ report: Report | null; history: Report[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/weekly-report");
      if (res.status === 401) { router.push("/onboarding"); return; }
      const d = await res.json();
      if (d.error) { setError(d.error); return; }
      setData(d);
    } catch { setError("Could not load reports."); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-100 rounded-xl" />
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

  if (!data?.report) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <div className="text-5xl mb-4">📊</div>
        <h1 className="text-[24px] font-semibold text-[#111827] mb-2">Career Reports</h1>
        <p className="text-sm text-[#6B7280] mb-6">Your first weekly report will be ready soon. Come back after using PrepFit for a few days.</p>
        <Button href="/dashboard">Back to Dashboard</Button>
      </div>
    );
  }

  const report = data.report;
  const history = data.history;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-[#111827]">Career Reports</h1>
        <p className="text-sm text-[#6B7280] mt-1">Your weekly progress and coaching intelligence.</p>
      </div>

      {/* Current week */}
      <Card className="mb-6 bg-gradient-to-br from-[#22C55E]/[0.04] to-[#2563EB]/[0.04] border border-green-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-semibold text-[#111827]">This Week</h3>
          <span className="text-xs text-[#9CA3AF]">{report.weekStart} — {report.weekEnd}</span>
        </div>

        {/* Score deltas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div className="text-center p-3 bg-white rounded-[10px]">
            <p className="text-[10px] text-[#9CA3AF] uppercase">Readiness</p>
            <p className="text-xl font-bold text-[#111827]">{report.readinessAfter}</p>
            <span className={`text-xs font-medium ${report.readinessAfter > report.readinessBefore ? "text-green-600" : "text-red-500"}`}>
              {report.readinessAfter > report.readinessBefore ? "+" : ""}{report.readinessAfter - report.readinessBefore}
            </span>
          </div>
          <div className="text-center p-3 bg-white rounded-[10px]">
            <p className="text-[10px] text-[#9CA3AF] uppercase">Confidence</p>
            <p className={`text-xl font-bold ${report.interviewConfidenceDelta > 0 ? "text-green-600" : "text-[#111827]"}`}>
              {report.interviewConfidenceDelta > 0 ? "+" : ""}{report.interviewConfidenceDelta}
            </p>
          </div>
          <div className="text-center p-3 bg-white rounded-[10px]">
            <p className="text-[10px] text-[#9CA3AF] uppercase">ATS Score</p>
            <p className={`text-xl font-bold ${report.atsScoreDelta > 0 ? "text-green-600" : "text-[#111827]"}`}>
              {report.atsScoreDelta > 0 ? "+" : ""}{report.atsScoreDelta}
            </p>
          </div>
          <div className="text-center p-3 bg-white rounded-[10px]">
            <p className="text-[10px] text-[#9CA3AF] uppercase">Resume Score</p>
            <p className={`text-xl font-bold ${report.resumeScoreDelta > 0 ? "text-green-600" : "text-[#111827]"}`}>
              {report.resumeScoreDelta > 0 ? "+" : ""}{report.resumeScoreDelta}
            </p>
          </div>
        </div>

        {/* Activity */}
        <div className="grid grid-cols-4 gap-2 mb-5 text-xs text-center">
          <div className="bg-white rounded-[8px] p-2">
            <p className="text-[#9CA3AF]">Mocks</p><p className="font-semibold">{report.mockCount}</p>
          </div>
          <div className="bg-white rounded-[8px] p-2">
            <p className="text-[#9CA3AF]">Challenges</p><p className="font-semibold">{report.challengeCount}</p>
          </div>
          <div className="bg-white rounded-[8px] p-2">
            <p className="text-[#9CA3AF]">Job Searches</p><p className="font-semibold">{report.jobApplicationsCount}</p>
          </div>
          <div className="bg-white rounded-[8px] p-2">
            <p className="text-[#9CA3AF]">Tailored</p><p className="font-semibold">{report.resumeTailorsCount}</p>
          </div>
        </div>

        {/* Wins + Focus */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">Biggest Wins</p>
            {report.wins.map((w, i) => (
              <p key={i} className="text-sm text-green-700 flex gap-1.5">
                <span className="shrink-0">✓</span> {w}
              </p>
            ))}
          </div>
          <div>
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">Focus Areas</p>
            {report.focusAreas.map((f, i) => (
              <p key={i} className="text-sm text-amber-700 flex gap-1.5">
                <span className="shrink-0">↑</span> {f}
              </p>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">This Week's Plan</p>
          {report.recommendations.map((r, i) => (
            <p key={i} className="text-sm text-[#374151] flex gap-1.5">
              <span className="text-[#2563EB]">{i + 1}.</span> {r}
            </p>
          ))}
        </div>

        {/* Premium insights */}
        {report.premiumInsights && (
          <div className="mt-4 p-3 bg-purple-50 rounded-[10px] border border-purple-100">
            <p className="text-[10px] text-purple-500 uppercase tracking-wide mb-1">Premium Insights</p>
            <p className="text-xs text-purple-800">
              {report.premiumInsights.trend} — next milestone: {report.premiumInsights.nextMilestone}.
              Estimated {report.premiumInsights.estimatedWeeksToGoal} week{report.premiumInsights.estimatedWeeksToGoal !== 1 ? "s" : ""} to interview-ready.
            </p>
          </div>
        )}
      </Card>

      {/* History */}
      {history.length > 1 && (
        <div>
          <h3 className="text-[18px] font-semibold text-[#111827] mb-3">Past Reports</h3>
          <div className="space-y-3">
            {history.slice(1).map((r, i) => {
              const delta = r.readinessAfter - r.readinessBefore;
              return (
                <Card key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-[#111827]">Week of {r.weekStart}</h4>
                    <span className={`text-sm font-bold ${delta > 0 ? "text-green-600" : "text-[#6B7280]"}`}>
                      {delta > 0 ? "+" : ""}{delta} readiness
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-[#6B7280]">
                    <span>{r.mockCount + r.challengeCount} sessions</span>
                    {r.wins.length > 0 && <span className="text-green-600 truncate">{r.wins[0]}</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
