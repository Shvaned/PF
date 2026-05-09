"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UpgradeModal from "@/components/ui/UpgradeModal";

function SetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysisId");

  const [difficulty, setDifficulty] = useState("standard");
  const [questionTypes, setQuestionTypes] = useState("mixed");
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch("/api/mock-interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: analysisId || undefined,
          difficulty,
          questionTypes,
          questionCount,
        }),
      });

      if (res.status === 403) {
        setLoading(false);
        setShowUpgradeModal(true);
        return;
      }

      if (!res.ok) throw new Error("Failed to start interview");

      const data = await res.json();
      router.push(`/mock-interview/${data.interviewId}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-[#111827]">Mock Interview</h1>
        <p className="text-sm text-[#6B7280] mt-1">Configure your practice session</p>
      </div>

      <Card className="mb-5">
        <h3 className="text-[16px] font-medium text-[#111827] mb-4">Difficulty Level</h3>
        <div className="flex gap-2">
          {["beginner", "standard", "hard"].map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`flex-1 py-2 text-sm rounded-[10px] border transition-colors ${
                difficulty === d
                  ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] font-medium"
                  : "border-[#E5E7EB] text-[#6B7280] hover:border-gray-300"
              }`}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-5">
        <h3 className="text-[16px] font-medium text-[#111827] mb-4">Question Types</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "technical", label: "Technical" },
            { value: "behavioral", label: "Behavioral" },
            { value: "hr", label: "HR" },
            { value: "mixed", label: "Mixed" },
          ].map((qt) => (
            <button
              key={qt.value}
              onClick={() => setQuestionTypes(qt.value)}
              className={`px-4 py-2 text-sm rounded-[10px] border transition-colors ${
                questionTypes === qt.value
                  ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] font-medium"
                  : "border-[#E5E7EB] text-[#6B7280] hover:border-gray-300"
              }`}
            >
              {qt.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-6">
        <h3 className="text-[16px] font-medium text-[#111827] mb-4">Number of Questions</h3>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={3}
            max={15}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-medium text-[#111827] w-8 text-center">{questionCount}</span>
        </div>
      </Card>

      <Button onClick={handleStart} loading={loading} className="w-full py-3">
        Start Mock Interview
      </Button>

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Unlock Mock Interviews"
        description="Practice AI interviews with scoring, track your weak areas, and get a final report."
      />
    </div>
  );
}

export default function MockInterviewPage() {
  return (
    <Suspense>
      <SetupForm />
    </Suspense>
  );
}
