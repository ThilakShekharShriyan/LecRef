export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 border-l-[3px] border-[#e8e8f0]">
      {/* Title skeleton */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-5 bg-[#e8e8f0] rounded shimmer flex-1 max-w-[200px]" />
        <div className="h-6 w-16 bg-[#e8e8f0] rounded-full shimmer" />
      </div>

      {/* Text skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-[#e8e8f0] rounded shimmer" />
        <div className="h-3 bg-[#e8e8f0] rounded shimmer" style={{ width: '95%' }} />
        <div className="h-3 bg-[#e8e8f0] rounded shimmer" style={{ width: '90%' }} />
      </div>

      {/* Citation chips skeleton */}
      <div className="flex gap-2">
        <div className="h-7 w-24 bg-[#e8e8f0] rounded-full shimmer" />
        <div className="h-7 w-28 bg-[#e8e8f0] rounded-full shimmer" />
        <div className="h-7 w-20 bg-[#e8e8f0] rounded-full shimmer" />
      </div>
    </div>
  );
}
