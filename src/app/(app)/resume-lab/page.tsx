"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface ResumeData {
  id: string; title: string; resumeLabel: string | null; resumeType: string | null;
  averageMatchScore: number; bestMatchScore: number; totalAnalyses: number;
  timesUsed: number; lastUsedAt: string | null; isArchived: boolean;
  createdAt: string; uploadType: string;
  performanceSnapshots: { matchScore: number; createdAt: string }[];
}

const TYPE_COLORS: Record<string, string> = {
  backend: "bg-blue-100 text-blue-700",
  fullstack: "bg-purple-100 text-purple-700",
  ml: "bg-green-100 text-green-700",
  startup: "bg-orange-100 text-orange-700",
  general: "bg-gray-100 text-gray-700",
  custom: "bg-pink-100 text-pink-700",
};

export default function ResumeLabPage() {
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [comparison, setComparison] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editType, setEditType] = useState("");

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/resumes?mode=lab");
    const data = await res.json();
    setResumes(data.resumes || []);
    setSelectedId(data.selectedId);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function selectResume(id: string) {
    await fetch(`/api/resumes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setSelectedId(id);
    fetchData();
  }

  async function duplicateResume(id: string, label?: string) {
    await fetch(`/api/resumes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "duplicate", label }),
    });
    fetchData();
  }

  async function archiveResume(id: string, archive: boolean) {
    await fetch(`/api/resumes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateMeta", isArchived: archive }),
    });
    fetchData();
  }

  async function saveMeta(id: string) {
    await fetch(`/api/resumes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateMeta", resumeLabel: editLabel, resumeType: editType }),
    });
    setEditingId(null);
    fetchData();
  }

  async function compareResumes() {
    if (!compareA || !compareB) return;
    const res = await fetch("/api/resumes/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeIdA: compareA, resumeIdB: compareB }),
    });
    const data = await res.json();
    setComparison(data);
  }

  const activeResumes = resumes.filter((r) => !r.isArchived);
  const archivedResumes = resumes.filter((r) => r.isArchived);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-[#111827]">Resume Lab</h1>
          <p className="text-sm text-[#6B7280] mt-1">Optimize, compare, and track your resume performance.</p>
        </div>
        <Button href="/manage-resume">Add Resume</Button>
      </div>

      {/* Compare mode */}
      {compareA && (
        <Card className="mb-6">
          <h3 className="text-[16px] font-medium text-[#111827] mb-3">Compare Resumes</h3>
          <div className="flex items-center gap-3 mb-3">
            <select value={compareA} onChange={(e) => setCompareA(e.target.value)}
              className="flex-1 text-sm px-3 py-2 rounded-[8px] border border-[#E5E7EB]">
              <option value="">Resume A</option>
              {resumes.map((r) => <option key={r.id} value={r.id}>{r.resumeLabel || r.title}</option>)}
            </select>
            <span className="text-[#9CA3AF] text-sm">vs</span>
            <select value={compareB} onChange={(e) => setCompareB(e.target.value)}
              className="flex-1 text-sm px-3 py-2 rounded-[8px] border border-[#E5E7EB]">
              <option value="">Resume B</option>
              {resumes.filter((r) => r.id !== compareA).map((r) => <option key={r.id} value={r.id}>{r.resumeLabel || r.title}</option>)}
            </select>
            <button onClick={compareResumes} disabled={!compareA || !compareB}
              className="px-4 py-2 bg-[#2563EB] text-white text-sm rounded-[8px] disabled:opacity-50">
              Compare
            </button>
            <button onClick={() => { setCompareA(""); setCompareB(""); setComparison(null); }}
              className="text-xs text-[#6B7280] hover:text-[#111827]">Cancel</button>
          </div>
          {comparison && (
            <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-[10px]">
              <div className="text-center p-3 bg-white rounded-[8px]">
                <p className="text-sm font-medium text-[#111827]">{comparison.a.label || comparison.a.title}</p>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                  <span className="text-[#9CA3AF]">Avg Match</span><span className="font-medium">{comparison.a.avgMatch}%</span>
                  <span className="text-[#9CA3AF]">Best</span><span className="font-medium text-green-600">{comparison.a.bestMatch}%</span>
                  <span className="text-[#9CA3AF]">Analyses</span><span>{comparison.a.totalAnalyses}</span>
                  <span className="text-[#9CA3AF]">Times Used</span><span>{comparison.a.timesUsed}</span>
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-[8px]">
                <p className="text-sm font-medium text-[#111827]">{comparison.b.label || comparison.b.title}</p>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                  <span className="text-[#9CA3AF]">Avg Match</span><span className="font-medium">{comparison.b.avgMatch}%</span>
                  <span className="text-[#9CA3AF]">Best</span><span className="font-medium text-green-600">{comparison.b.bestMatch}%</span>
                  <span className="text-[#9CA3AF]">Analyses</span><span>{comparison.b.totalAnalyses}</span>
                  <span className="text-[#9CA3AF]">Times Used</span><span>{comparison.b.timesUsed}</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Active resumes */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[18px] font-semibold text-[#111827]">
            Active Resumes ({activeResumes.length})
          </h2>
          <button onClick={() => setCompareA(compareA ? "" : (resumes[0]?.id || ""))}
            className="text-xs text-[#2563EB] hover:underline">{compareA ? "Cancel Compare" : "Compare Resumes"}</button>
        </div>

        {activeResumes.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-sm text-[#6B7280] mb-4">No resumes yet. Start by adding your first resume.</p>
            <Button href="/manage-resume">Add Resume</Button>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeResumes.map((r) => (
            <div key={r.id}
              className={`bg-white rounded-[16px] p-5 border transition-all duration-200 ${
                r.id === selectedId ? "border-[#2563EB] ring-1 ring-[#2563EB]/20 shadow-md" : "border-[#E5E7EB] hover:shadow-md"
              }`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  {editingId === r.id ? (
                    <div className="space-y-2">
                      <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                        className="w-full text-sm px-2 py-1 rounded border border-[#E5E7EB]" placeholder="Label" />
                      <select value={editType} onChange={(e) => setEditType(e.target.value)}
                        className="w-full text-xs px-2 py-1 rounded border border-[#E5E7EB]">
                        {["backend", "fullstack", "ml", "startup", "general", "custom"].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <div className="flex gap-1">
                        <button onClick={() => saveMeta(r.id)} className="text-[10px] px-2 py-1 bg-[#2563EB] text-white rounded">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-[10px] px-2 py-1 text-[#6B7280]">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-sm font-semibold text-[#111827] truncate">{r.resumeLabel || r.title}</h3>
                      {r.resumeType && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${TYPE_COLORS[r.resumeType] || "bg-gray-100 text-gray-600"}`}>
                          {r.resumeType}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {r.id === selectedId && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium shrink-0">Selected</span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="bg-gray-50 rounded-[6px] p-2 text-center">
                  <p className="text-[#9CA3AF]">Avg Match</p>
                  <p className="font-semibold text-[#111827]">{r.averageMatchScore}%</p>
                </div>
                <div className="bg-gray-50 rounded-[6px] p-2 text-center">
                  <p className="text-[#9CA3AF]">Best</p>
                  <p className="font-semibold text-green-600">{r.bestMatchScore}%</p>
                </div>
                <div className="bg-gray-50 rounded-[6px] p-2 text-center">
                  <p className="text-[#9CA3AF]">Analyses</p>
                  <p className="font-semibold text-[#111827]">{r.totalAnalyses}</p>
                </div>
                <div className="bg-gray-50 rounded-[6px] p-2 text-center">
                  <p className="text-[#9CA3AF]">Used</p>
                  <p className="font-semibold text-[#111827]">{r.timesUsed}</p>
                </div>
              </div>

              {/* Trend sparkline */}
              {r.performanceSnapshots.length > 1 && (
                <div className="h-8 mb-3">
                  <svg className="w-full h-full" viewBox={`0 0 ${r.performanceSnapshots.length * 20} 30`} preserveAspectRatio="none">
                    <polyline fill="none" stroke="#2563EB" strokeWidth="1.5"
                      points={r.performanceSnapshots.map((s, i) => `${i * 20},${30 - (s.matchScore / 100) * 25}`).join(" ")} />
                  </svg>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-1.5">
                {r.id !== selectedId && (
                  <button onClick={() => selectResume(r.id)}
                    className="text-[10px] px-2 py-1 rounded-[6px] bg-[#EFF6FF] text-[#2563EB] hover:bg-blue-100">Use</button>
                )}
                <button onClick={() => duplicateResume(r.id)}
                  className="text-[10px] px-2 py-1 rounded-[6px] bg-gray-100 text-[#6B7280] hover:bg-gray-200">Duplicate</button>
                <button onClick={() => { setEditingId(r.id); setEditLabel(r.resumeLabel || r.title); setEditType(r.resumeType || "custom"); }}
                  className="text-[10px] px-2 py-1 rounded-[6px] bg-gray-100 text-[#6B7280] hover:bg-gray-200">Edit</button>
                <button onClick={() => archiveResume(r.id, true)}
                  className="text-[10px] px-2 py-1 rounded-[6px] bg-gray-100 text-[#6B7280] hover:bg-gray-200">Archive</button>
                <Button href={`/manage-resume?edit=${r.id}`} className="text-[10px] px-2 py-1 !rounded-[6px]">Compare Analyzes</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Archived resumes */}
      {archivedResumes.length > 0 && (
        <div>
          <h2 className="text-[18px] font-semibold text-[#111827] mb-3">Archived ({archivedResumes.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {archivedResumes.map((r) => (
              <div key={r.id} className="bg-white rounded-[16px] p-4 border border-[#E5E7EB]">
                <h3 className="text-sm font-medium text-[#111827]">{r.resumeLabel || r.title}</h3>
                <p className="text-[10px] text-[#9CA3AF] mt-1">Avg: {r.averageMatchScore}% · {r.totalAnalyses} analyses</p>
                <button onClick={() => archiveResume(r.id, false)}
                  className="mt-2 text-[10px] text-[#2563EB] hover:underline">Unarchive</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
