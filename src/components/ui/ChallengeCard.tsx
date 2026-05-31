"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface ChallengeData {
  challenge: {
    id: string;
    question: string;
    questionType: string;
    difficulty: string;
    completed: boolean;
    answerText: string | null;
    score: number | null;
    feedback: string | null;
  };
  streak: number;
}

const TYPE_LABELS: Record<string, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  resume: "Resume",
  confidence: "Confidence",
  system_design: "System Design",
};

export default function ChallengeCard() {
  const [data, setData] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenge")
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
          <div className="h-10 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </Card>
    );
  }

  if (!data?.challenge) return null;

  const c = data.challenge;

  return (
    <Card className="mb-6 bg-gradient-to-br from-[#2563EB]/[0.03] to-[#7C3AED]/[0.03] border border-[#2563EB]/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-medium text-[#111827]">Daily Interview Challenge</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] font-medium">
            {TYPE_LABELS[c.questionType] || c.questionType}
          </span>
        </div>
        {data.streak > 1 && (
          <span className="text-[11px] text-[#9CA3AF]">{data.streak}-day streak</span>
        )}
      </div>

      {c.completed ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-500 text-lg">✓</span>
            <p className="text-sm text-[#111827] line-through opacity-60">{c.question}</p>
          </div>
          {c.score !== null && (
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-[#111827]">{c.score}/100</span>
              {c.feedback && (() => {
                try {
                  const fb = JSON.parse(c.feedback);
                  return (
                    <span className="text-xs text-[#6B7280]">
                      {fb.strengths?.[0] || "Great effort today"}
                    </span>
                  );
                } catch { return null; }
              })()}
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-[#111827] font-medium mb-3 leading-relaxed">{c.question}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#9CA3AF]">~5 mins</span>
            <span className="text-[10px] text-[#9CA3AF]">· {c.difficulty}</span>
          </div>
          <div className="flex gap-2 mt-3">
            <Button href={`/daily-challenge?id=${c.id}`} className="text-xs">
              Start Challenge
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
