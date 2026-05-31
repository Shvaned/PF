"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface ChallengeData {
  challenge: {
    id: string; question: string; questionType: string;
    difficulty: string; completed: boolean;
    answerText: string | null; score: number | null; feedback: string | null;
    personalizationReason: string | null;
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

const HINTS: Record<string, string[]> = {
  behavioral: ["Use the STAR method: Situation, Task, Action, Result.", "Keep your answer under 2 minutes.", "Focus on YOUR specific actions, not the team."],
  technical: ["Start with a high-level overview, then go deeper.", "Use concrete examples or analogies.", "If you're unsure, explain how you'd find the answer."],
  resume: ["Be concise — this should feel like an elevator pitch.", "Connect your experience to the role you want.", "Practice out loud before typing."],
  confidence: ["Speak as if you're already in the role.", "Back up claims with specific examples.", "End with a clear, confident conclusion."],
  system_design: ["Start with requirements and constraints.", "Draw or mentally sketch the architecture.", "Discuss trade-offs, not just one solution."],
};

export default function DailyChallengePage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto animate-pulse"><div className="h-64 bg-gray-100 rounded-xl" /></div>}>
      <ChallengeContent />
    </Suspense>
  );
}

function ChallengeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeId = searchParams.get("id");

  const [data, setData] = useState<ChallengeData | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchChallenge = useCallback(async () => {
    try {
      const res = await fetch("/api/challenge");
      if (res.status === 401) { router.push("/onboarding"); return; }
      const d = await res.json();
      if (d.error) { setError(d.error); return; }
      setData(d);
      if (d.challenge?.answerText) setAnswer(d.challenge.answerText);
    } catch { setError("Could not load your challenge."); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchChallenge(); }, [fetchChallenge]);

  async function handleSubmit() {
    if (!answer.trim() || !data?.challenge) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/challenge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: data.challenge.id, answerText: answer.trim() }),
      });
      if (res.ok) await fetchChallenge();
    } catch {} finally { setSubmitting(false); }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-sm text-[#6B7280] mb-4">{error}</p>
        <Button onClick={fetchChallenge} variant="secondary">Try Again</Button>
      </div>
    );
  }

  if (!data?.challenge) return null;

  const c = data.challenge;
  const feedback = c.feedback ? (() => { try { return JSON.parse(c.feedback); } catch { return null; } })() : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold text-[#111827]">Daily Interview Challenge</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          {c.completed ? "Challenge completed" : "5 minutes today improves your chances of getting hired."}
        </p>
      </div>

      {/* Question card */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] font-medium">
            {TYPE_LABELS[c.questionType] || c.questionType}
          </span>
          <span className="text-[10px] text-[#9CA3AF] capitalize">· {c.difficulty}</span>
          <span className="text-[10px] text-[#9CA3AF]">· ~5 mins</span>
        </div>

        <h2 className="text-[18px] font-medium text-[#111827] leading-relaxed mb-4">{c.question}</h2>

        {c.personalizationReason && (
          <p className="text-xs text-[#9CA3AF] italic">
            Why this question: {c.personalizationReason}
          </p>
        )}
      </Card>

      {/* Hints */}
      {!c.completed && (
        <Card className="mb-6">
          <h3 className="text-sm font-medium text-[#111827] mb-2">Tips for this question</h3>
          <ul className="space-y-1.5">
            {(HINTS[c.questionType] || HINTS.behavioral).map((h, i) => (
              <li key={i} className="text-xs text-[#6B7280] flex gap-2">
                <span className="text-[#2563EB] shrink-0">{i + 1}.</span>
                {h}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Answer area or feedback */}
      {c.completed ? (
        <>
          {/* Score */}
          {c.score !== null && (
            <Card className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-medium text-[#111827]">Your Score</h3>
                <span className="text-3xl font-bold text-[#2563EB]">{c.score}/100</span>
              </div>
              {feedback && (
                <div className="space-y-4">
                  {/* Strengths */}
                  <div>
                    <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">Strengths</p>
                    <div className="space-y-1">
                      {feedback.strengths?.map((s: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-[#374151] p-2 bg-green-50 rounded-[6px]">
                          <span className="text-green-500">✓</span>{s}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Improvements */}
                  <div>
                    <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">Improve</p>
                    <div className="space-y-1">
                      {feedback.improvements?.map((s: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-[#374151] p-2 bg-amber-50 rounded-[6px]">
                          <span className="text-amber-500">↑</span>{s}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Dimension scores */}
                  {feedback.scores && (
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {Object.entries(feedback.scores as Record<string, number>).map(([key, val]) => (
                        <div key={key} className="text-center p-2 bg-gray-50 rounded-[8px]">
                          <p className="text-[10px] text-[#9CA3AF] capitalize">{key}</p>
                          <p className="text-lg font-semibold text-[#111827]">{val}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Your answer */}
          <Card className="mb-6">
            <h3 className="text-sm font-medium text-[#111827] mb-2">Your Answer</h3>
            <p className="text-sm text-[#374151] whitespace-pre-wrap bg-gray-50 rounded-[10px] p-4">{c.answerText}</p>
          </Card>

          <div className="flex gap-3">
            <Button href="/dashboard" variant="secondary">Back to Dashboard</Button>
            <Button href="/performance-insights" variant="secondary">View Progress</Button>
          </div>
        </>
      ) : (
        <>
          {/* Answer textarea */}
          <Card className="mb-6">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here... Aim for 1-2 minutes of spoken content."
              rows={8}
              className="w-full text-sm p-4 rounded-[12px] border border-[#E5E7EB] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none resize-y"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-[#9CA3AF]">
                {answer.length === 0 ? "Start typing..." : `${answer.length} characters`}
              </span>
            </div>
          </Card>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!answer.trim() || submitting}
              className="flex-1 py-3 bg-[#2563EB] text-white text-sm font-semibold rounded-[14px] hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? "Submitting..." : "Submit Answer"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
