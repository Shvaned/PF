interface FeedbackCardProps {
  label: string;
  score: number;
  maxScore?: number;
}

export default function FeedbackCard({ label, score, maxScore = 10 }: FeedbackCardProps) {
  const pct = (score / maxScore) * 100;
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="text-center">
      <div className="text-2xl font-semibold text-[#111827] mb-1">
        {score}<span className="text-sm text-[#9CA3AF]">/{maxScore}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full mb-1.5">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-[#6B7280]">{label}</p>
    </div>
  );
}
