interface UsageBarProps {
  remaining: number;
  limit: number;
  isPremium: boolean;
}

export default function UsageBar({ remaining, limit, isPremium }: UsageBarProps) {
  if (isPremium) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-xs font-medium text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Premium
      </div>
    );
  }

  const used = limit - remaining;
  const pct = (used / limit) * 100;

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#2563EB] rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[#6B7280] whitespace-nowrap">
        {remaining} / {limit} left
      </span>
    </div>
  );
}
