"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";

const tips = [
  "Tailoring resume keywords to the job description improves match scores.",
  "Structuring answers with the STAR method impresses interviewers.",
  "Quantify achievements — numbers catch attention faster than words.",
  "Practice behavioral questions — they appear in nearly every interview.",
  "Research the company before the interview. It shows preparation.",
];

function AnalyzeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const descParam = searchParams.get("description");
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState(descParam || "");
  const [roleCategory, setRoleCategory] = useState(roleParam || "general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Loading UX stages
  const [stage, setStage] = useState(0);
  const stages = [
    "Parsing resume...",
    "Analyzing skills & keywords...",
    "Matching against job description...",
    "Generating interview questions...",
    "Finalizing report...",
  ];
  const [tipIndex] = useState(Math.floor(Math.random() * tips.length));

  useEffect(() => {
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((data) => {
        if (data.resumes) setResumes(data.resumes);
        if (data.selectedId) {
          setSelectedId(data.selectedId);
          const sel = data.resumes.find((r: any) => r.id === data.selectedId);
          if (sel) setResumeText(sel.content);
        }
      })
      .finally(() => setPageLoading(false));
  }, []);

  // Progress the loading stages
  useEffect(() => {
    if (!loading) { setStage(0); return; }
    let i = 0;
    const timer = setInterval(() => {
      i++;
      if (i < stages.length) setStage(i);
    }, 2000);
    return () => clearInterval(timer);
  }, [loading]);

  async function handleSelectResume(id: string) {
    await fetch(`/api/resumes/${id}`, { method: "PATCH" });
    setSelectedId(id);
    const sel = resumes.find((r) => r.id === id);
    if (sel) setResumeText(sel.content);
  }

  async function handleAnalyze() {
    if (!resumeText.trim() || resumeText.length < 50) {
      setError("Please select a resume with enough content (at least 50 characters).");
      return;
    }
    if (!jobDescription.trim() || jobDescription.length < 30) {
      setError("Please enter the full job description (at least 30 characters).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: resumeText.trim(), jobDescription: jobDescription.trim(), roleCategory }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Analysis failed");
      router.push(`/analyze/results/${(await res.json()).analysisId}`);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (pageLoading) {
    return <div className="max-w-2xl mx-auto"><div className="h-60 bg-gray-50 rounded-[16px] animate-pulse" /></div>;
  }

  const selectedResume = resumes.find((r) => r.id === selectedId);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-[#111827]">Analyze Resume</h1>
        <p className="text-sm text-[#6B7280] mt-1">Compare your resume with a job description</p>
      </div>

      {/* Selected Resume */}
      {resumes.length === 0 ? (
        <Card className="mb-5 text-center py-8">
          <div className="text-3xl mb-3">📄</div>
          <h3 className="text-[16px] font-medium text-[#111827] mb-2">Add a resume to begin</h3>
          <p className="text-sm text-[#6B7280] mb-4">Upload a PDF or paste your resume before analyzing.</p>
          <Button href="/manage-resume">Manage Resume</Button>
        </Card>
      ) : (
        <>
          {selectedResume ? (
            <Card className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[16px] font-medium text-[#111827]">Selected Resume</h3>
                <div className="flex items-center gap-2">
                  <Link href="/manage-resume" className="text-xs text-[#2563EB] hover:underline">Change</Link>
                  <Link href="/manage-resume" className="text-xs text-[#2563EB] hover:underline">Add New</Link>
                </div>
              </div>
              <div className="p-3 bg-[#EFF6FF] rounded-[10px] border border-[#2563EB]/10">
                <p className="text-sm font-medium text-[#111827]">{selectedResume.title}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {selectedResume.uploadType === "pdf" ? "PDF" : "Paste"} · {selectedResume.content.length} chars · {new Date(selectedResume.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1 truncate">{selectedResume.content.slice(0, 120)}...</p>
              </div>

              {resumes.length > 1 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-[#6B7280] mb-2">Other resumes</p>
                  <div className="flex flex-wrap gap-2">
                    {resumes.filter((r) => r.id !== selectedId).map((r) => (
                      <button key={r.id} onClick={() => handleSelectResume(r.id)}
                        className="px-3 py-1.5 text-xs bg-gray-100 rounded-[8px] hover:bg-[#EFF6FF] transition-colors text-[#374151]">
                        {r.title.slice(0, 40)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="mb-5">
              <h3 className="text-[16px] font-medium text-[#111827] mb-3">Your Resumes</h3>
              <p className="text-sm text-[#6B7280] mb-3">Select a resume to analyze:</p>
              <div className="space-y-2">
                {resumes.map((r) => (
                  <button key={r.id} onClick={() => handleSelectResume(r.id)}
                    className="w-full text-left p-3 bg-gray-50 rounded-[10px] hover:bg-[#EFF6FF] transition-colors">
                    <p className="text-sm font-medium text-[#111827]">{r.title}</p>
                    <p className="text-xs text-[#6B7280]">{r.content.length} chars · {new Date(r.createdAt).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Job Description */}
      {resumes.length > 0 && (
        <Card className="mb-5">
          <h3 className="text-[16px] font-medium text-[#111827] mb-4">Job Description</h3>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            rows={8}
            className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 resize-y"
          />
        </Card>
      )}

      {/* Role Selector */}
      {resumes.length > 0 && (
        <Card className="mb-5">
          <h3 className="text-[16px] font-medium text-[#111827] mb-3">Target Role</h3>
          <div className="flex flex-wrap gap-2">
            {["general","software","data","marketing","sales","operations","finance"].map((r) => (
              <button key={r} onClick={() => setRoleCategory(r)}
                className={`px-3 py-1.5 text-sm rounded-[10px] border transition-colors capitalize ${
                  roleCategory === r ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] font-medium" : "border-[#E5E7EB] text-[#6B7280] hover:border-gray-300"
                }`}>{r}</button>
            ))}
          </div>
        </Card>
      )}

      {error && <ErrorState message={error} onRetry={handleAnalyze} />}

      {/* Analyze button with loading UX */}
      {resumes.length > 0 && (
        <div>
          {loading ? (
            <div className="bg-white rounded-[16px] p-6 border border-[#E5E7EB] shadow-sm">
              <p className="text-sm font-medium text-[#111827] text-center mb-4">{stages[stage]}</p>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${((stage + 1) / stages.length) * 100}%` }}
                />
              </div>
              <p className="text-xs text-[#9CA3AF] text-center mt-3">💡 {tips[tipIndex]}</p>
            </div>
          ) : (
            <Button onClick={handleAnalyze} className="w-full py-3">
              Analyze Now
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto"><div className="h-60 bg-gray-50 rounded-[16px] animate-pulse" /></div>}>
      <AnalyzeContent />
    </Suspense>
  );
}
