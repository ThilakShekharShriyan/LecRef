export function SkeletonCard() {
  return (
    <div className="bg-[#ffffff] border border-[#e5e5e5] border-l-2 border-l-[#d4d4d4] p-4">
      {/* Title skeleton */}
      <div className="flex items-center gap-3 mb-2">
        <div className="h-4 bg-[#f0f0f0] shimmer flex-1 max-w-[180px]" />
        <div className="h-5 w-14 bg-[#f0f0f0] shimmer" />
      </div>

      {/* Text skeleton */}
      <div className="space-y-1.5 mb-3">
        <div className="h-2.5 bg-[#f0f0f0] shimmer" />
        <div className="h-2.5 bg-[#f0f0f0] shimmer" style={{ width: '95%' }} />
        <div className="h-2.5 bg-[#f0f0f0] shimmer" style={{ width: '90%' }} />
      </div>

      {/* Citation chips skeleton */}
      <div className="flex gap-1.5">
        <div className="h-5 w-20 bg-[#f0f0f0] shimmer" />
        <div className="h-5 w-24 bg-[#f0f0f0] shimmer" />
        <div className="h-5 w-16 bg-[#f0f0f0] shimmer" />
      </div>
    </div>
  );
}
