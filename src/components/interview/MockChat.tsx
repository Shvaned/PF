"use client";

import { useState, useRef, useEffect } from "react";
import Button from "@/components/ui/Button";

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

interface Props {
  interviewId: string;
  questions: { id: string; question: string; type: string }[];
  onComplete: (messages: Message[]) => void;
}

export default function MockChat({ interviewId, questions, onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: questions[0]?.question || "Let's begin." },
  ]);
  const [input, setInput] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const answer = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: answer }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/mock-interview/${interviewId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questions[currentQ].question,
          answer,
        }),
      });

      if (!res.ok) throw new Error("Evaluation failed");

      const feedback = await res.json();

      setMessages((m) => [
        ...m,
        {
          role: "ai",
          content: feedback.feedback,
          feedback: {
            clarity: feedback.clarity,
            relevance: feedback.relevance,
            confidence: feedback.confidence,
            structure: feedback.structure,
            feedback: feedback.feedback,
            missingPoints: feedback.missingPoints,
          },
        },
      ]);

      const next = currentQ + 1;
      if (next < questions.length) {
        setCurrentQ(next);
        setMessages((m) => [
          ...m,
          { role: "ai", content: questions[next].question },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "ai", content: "You've completed all the questions! Let me generate your final report." },
        ]);
        onComplete(messages);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "ai", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] max-h-[600px]">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div key={i}>
            <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-[12px] px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-[#2563EB] text-white"
                    : "bg-white border border-[#E5E7EB] text-[#111827]"
                }`}
              >
                {msg.content}
              </div>
            </div>
            {msg.feedback && (
              <div className="mt-2 ml-2 grid grid-cols-4 gap-2 max-w-xs">
                {(["clarity", "relevance", "confidence", "structure"] as const).map((dim) => (
                  <div key={dim} className="text-center">
                    <div className="text-[10px] text-[#9CA3AF] capitalize">{dim}</div>
                    <div className="text-sm font-medium text-[#111827]">{msg.feedback![dim]}/10</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-2.5">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[#9CA3AF] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#9CA3AF] animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 rounded-full bg-[#9CA3AF] animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 pt-3 border-t border-[#E5E7EB]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your answer..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 disabled:opacity-50"
        />
        <Button onClick={handleSend} disabled={!input.trim() || loading} loading={loading}>
          Send
        </Button>
      </div>
    </div>
  );
}
