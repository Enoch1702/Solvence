export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-framer-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="h-3.5 bg-stone-200 rounded-lg w-24 animate-shimmer" />
        <div className="h-8 w-8 bg-stone-100 rounded-xl animate-shimmer" />
      </div>
      <div className="h-8 bg-stone-200 rounded-xl w-36 mb-2 animate-shimmer" />
      <div className="h-3 bg-stone-100 rounded-md w-44 animate-shimmer" />
    </div>
  );
}

export function RunwayHeroSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-framer-md p-6 sm:p-8 mb-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-5 bg-stone-200 rounded-full w-40 animate-shimmer" />
        <div className="h-5 bg-stone-100 rounded-full w-28 animate-shimmer" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-stone-100 rounded w-28 animate-shimmer" />
        <div className="h-14 bg-stone-200 rounded-2xl w-64 animate-shimmer" />
      </div>
      <div className="h-3.5 bg-stone-100 rounded-full w-full animate-shimmer" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3.5 px-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-stone-100" />
        <div className="space-y-1.5">
          <div className="h-3.5 bg-stone-200 rounded w-32" />
          <div className="h-2.5 bg-stone-100 rounded w-20" />
        </div>
      </div>
      <div className="h-4 bg-stone-200 rounded w-24" />
    </div>
  );
}
