"use client";

import { useState, useEffect, useCallback } from "react";

interface Question {
  id: string;
  type: "technical" | "behavioral" | "hr" | "mixed";
  question: string;
  relevance: "high" | "medium" | "low";
}

interface AnswerGuidance {
  questionId: string;
  keyPoints: string[];
  dontForget: string[];
}

interface Props {
  questions: Question[];
  guidance: AnswerGuidance[];
  showBookmarks?: boolean;
}

const typeColors: Record<string, string> = {
  technical: "bg-blue-100 text-blue-700",
  behavioral: "bg-green-100 text-green-700",
  hr: "bg-purple-100 text-purple-700",
  mixed: "bg-orange-100 text-orange-700",
};

const relevanceBadge: Record<string, string> = {
  high: "text-red-500",
  medium: "text-yellow-500",
  low: "text-gray-400",
};

export default function QuestionAccordion({ questions, guidance, showBookmarks = true }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loadingBookmark, setLoadingBookmark] = useState<string | null>(null);

  useEffect(() => {
    if (!showBookmarks) return;
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((data) => {
        if (data.bookmarks) {
          setBookmarkedIds(new Set(data.bookmarks.map((b: any) => b.question)));
        }
      })
      .catch(() => {});
  }, [showBookmarks]);

  const toggleBookmark = useCallback(async (q: Question) => {
    setLoadingBookmark(q.id);
    try {
      const guide = guidance.find((g) => g.questionId === q.id);
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question,
          guidance: guide ? JSON.stringify(guide) : null,
        }),
      });
      const data = await res.json();
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (data.bookmarked) {
          next.add(q.question);
        } else {
          next.delete(q.question);
        }
        return next;
      });
    } catch {
      // silently fail
    } finally {
      setLoadingBookmark(null);
    }
  }, [guidance]);

  return (
    <div className="space-y-2">
      {questions.map((q) => {
        const guide = guidance.find((g) => g.questionId === q.id);
        const isOpen = openId === q.id;
        const isBookmarked = bookmarkedIds.has(q.question);

        return (
          <div
            key={q.id}
            className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden transition-shadow duration-200 hover:shadow-sm"
          >
            <div className="flex items-center">
              <button
                onClick={() => setOpenId(isOpen ? null : q.id)}
                className="flex-1 text-left px-4 py-3.5 flex items-center gap-3 min-w-0"
              >
                <span className={`text-[10px] font-medium shrink-0 ${relevanceBadge[q.relevance]}`}>●</span>
                <span className="flex-1 text-sm text-[#111827] truncate">{q.question}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${typeColors[q.type]}`}>
                  {q.type}
                </span>
                <svg
                  className={`w-4 h-4 text-[#9CA3AF] transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showBookmarks && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleBookmark(q); }}
                  disabled={loadingBookmark === q.id}
                  className="p-2 mr-2 rounded-full hover:bg-gray-100 transition-colors shrink-0"
                  title={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
                >
                  {loadingBookmark === q.id ? (
                    <div className="w-4 h-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      className={`w-4 h-4 ${isBookmarked ? "text-[#2563EB] fill-[#2563EB]" : "text-[#9CA3AF]"}`}
                      fill={isBookmarked ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  )}
                </button>
              )}
            </div>

            {isOpen && guide && (
              <div className="px-4 pb-4 border-t border-[#E5E7EB] pt-3 space-y-3">
                <div>
                  <h4 className="text-xs font-medium text-[#111827] mb-1.5">Key points to mention</h4>
                  <ul className="space-y-1">
                    {guide.keyPoints.map((p, i) => (
                      <li key={i} className="text-sm text-[#6B7280] flex gap-2">
                        <span className="text-[#22C55E] mt-0.5">+</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-[#111827] mb-1.5">Don&apos;t forget</h4>
                  <ul className="space-y-1">
                    {guide.dontForget.map((p, i) => (
                      <li key={i} className="text-sm text-[#6B7280] flex gap-2">
                        <span className="text-[#EF4444] mt-0.5">!</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
