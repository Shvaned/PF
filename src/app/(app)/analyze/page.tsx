"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";

export default function AnalyzePage() {
  const [tab, setTab] = useState<"paste" | "upload">("paste");
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [roleCategory, setRoleCategory] = useState("general");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handlePdfUpload(f: File) {
    setParsingPdf(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", f);
      const res = await fetch("/api/resume/parse", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to parse PDF");
      const data = await res.json();
      setResumeText(data.text);
    } catch {
      setError("Could not parse the PDF. Try pasting your resume text instead.");
    } finally {
      setParsingPdf(false);
    }
  }

  async function handleAnalyze() {
    if (!resumeText.trim() || resumeText.length < 50) {
      setError("Please enter your full resume text (at least 50 characters).");
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await res.json();
      router.push(`/analyze/results/${data.analysisId}`);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-[#111827]">Analyze Resume</h1>
        <p className="text-sm text-[#6B7280] mt-1">Compare your resume with a job description</p>
      </div>

      {/* Resume Input */}
      <Card className="mb-5">
        <h3 className="text-[16px] font-medium text-[#111827] mb-4">Your Resume</h3>

        <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-[10px]">
          <button
            onClick={() => setTab("paste")}
            className={`flex-1 text-sm py-1.5 rounded-[8px] transition-colors ${
              tab === "paste" ? "bg-white shadow-sm font-medium text-[#111827]" : "text-[#6B7280]"
            }`}
          >
            Paste Resume
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`flex-1 text-sm py-1.5 rounded-[8px] transition-colors ${
              tab === "upload" ? "bg-white shadow-sm font-medium text-[#111827]" : "text-[#6B7280]"
            }`}
          >
            Upload PDF
          </button>
        </div>

        {tab === "paste" ? (
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your full resume here..."
            rows={10}
            className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 resize-y"
          />
        ) : (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  handlePdfUpload(f);
                }
              }}
            />
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-[#E5E7EB] rounded-[12px] p-8 text-center cursor-pointer hover:border-[#2563EB] transition-colors"
            >
              {parsingPdf ? (
                <div>
                  <div className="w-8 h-8 mx-auto mb-2 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[#6B7280]">Parsing PDF...</p>
                </div>
              ) : resumeText && tab === "upload" ? (
                <div>
                  <svg className="w-8 h-8 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-600 font-medium">PDF parsed</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">{file?.name}</p>
                </div>
              ) : (
                <div>
                  <svg className="w-8 h-8 mx-auto mb-2 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-[#6B7280]">Click to upload PDF</p>
                  <p className="text-xs text-[#9CA3AF]">or drag and drop</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Job Description */}
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

      {/* Role Selector */}
      <Card className="mb-5">
        <h3 className="text-[16px] font-medium text-[#111827] mb-3">Target Role</h3>
        <p className="text-xs text-[#9CA3AF] mb-3">Choose a category to improve analysis and question relevance</p>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "general", label: "General" },
            { value: "software", label: "Software" },
            { value: "data", label: "Data" },
            { value: "marketing", label: "Marketing" },
            { value: "sales", label: "Sales" },
            { value: "operations", label: "Operations" },
            { value: "finance", label: "Finance" },
          ].map((r) => (
            <button
              key={r.value}
              onClick={() => setRoleCategory(r.value)}
              className={`px-3 py-1.5 text-sm rounded-[10px] border transition-colors ${
                roleCategory === r.value
                  ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] font-medium"
                  : "border-[#E5E7EB] text-[#6B7280] hover:border-gray-300"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Card>

      {error && <ErrorState message={error} onRetry={handleAnalyze} />}

      <Button onClick={handleAnalyze} loading={loading} className="w-full py-3">
        {loading ? "Analyzing..." : "Analyze Now"}
      </Button>
    </div>
  );
}
