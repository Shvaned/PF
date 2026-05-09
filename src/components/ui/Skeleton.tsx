export function SkeletonCard() {
  return (
    <div className="bg-white rounded-[16px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-gray-200 mb-4" />
      <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-full mb-4" />
      <div className="h-9 bg-gray-200 rounded-[12px] w-32" />
    </div>
  );
}

export function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width }} />;
}

export function SkeletonBlock({ height = "60px" }: { height?: string }) {
  return (
    <div className="bg-white rounded-[16px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="space-y-2">
        <SkeletonLine width="100%" />
        <SkeletonLine width="80%" />
        <SkeletonLine width="60%" />
      </div>
    </div>
  );
}
