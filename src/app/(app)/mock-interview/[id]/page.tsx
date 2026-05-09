"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import MockChat from "@/components/interview/MockChat";

interface Message {
  role: "ai" | "user";
  content: string;
  feedback?: {
    clarity: number;
    relevance: number;
    confidence: number;
    structure: number;
    feedback: string;
    missingPoints: string[];
  };
}

export default function ActiveMockInterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/mock-interview/${id}/answer`)
      .then((r) => r.json())
      .then((data) => {
        if (data.questions) {
          setQuestions(typeof data.questions === "string" ? JSON.parse(data.questions) : data.questions);
        }
      })
      .catch(() => setError("Failed to load interview"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleComplete(messages: Message[]) {
    const res = await fetch(`/api/mock-interview/${id}/answer`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (res.ok) {
      router.push(`/mock-interview/${id}/report`);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-20 bg-gray-100 rounded" />
          </div>
        </Card>
      </div>
    );
  }

  if (error || !questions.length) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-sm text-[#6B7280] mb-4">{error || "No questions found"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4">
        <h1 className="text-[24px] font-semibold text-[#111827]">Mock Interview</h1>
        <p className="text-sm text-[#6B7280]">{questions.length} questions • Answer each one aloud or type</p>
      </div>
      <Card>
        <MockChat interviewId={id} questions={questions} onComplete={handleComplete} />
      </Card>
    </div>
  );
}
