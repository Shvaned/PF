interface MatchScoreProps {
  score: number;
  size?: "sm" | "lg";
}

export default function MatchScore({ score, size = "lg" }: MatchScoreProps) {
  const radius = size === "lg" ? 48 : 36;
  const stroke = size === "lg" ? 6 : 4;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? "#22C55E" : score >= 40 ? "#F59E0B" : "#EF4444";

  const fontSize = size === "lg" ? "text-3xl" : "text-xl";

  return (
    <div className="flex items-center gap-4">
      <svg width={radius * 2 + stroke * 2} height={radius * 2 + stroke * 2} className="shrink-0">
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={stroke}
        />
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          transform={`rotate(-90 ${radius + stroke} ${radius + stroke})`}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div>
        <span className={`${fontSize} font-semibold text-[#111827]`}>{score}%</span>
        <p className="text-xs text-[#6B7280]">Match Score</p>
      </div>
    </div>
  );
}
