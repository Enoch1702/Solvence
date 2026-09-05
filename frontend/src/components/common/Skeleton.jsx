export function MetricCardSkeleton() {
  return (
    <div className="saas-card p-5 sm:p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-framer-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-24 animate-shimmer" />
        <div className="h-7 w-7 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg animate-shimmer" />
      </div>
      <div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-36 mb-2 animate-shimmer" />
      <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded-md w-44 animate-shimmer" />
    </div>
  );
}

export function RunwayHeroSkeleton() {
  return (
    <div className="saas-card p-6 sm:p-8 bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-framer-sm space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-[var(--border-subtle)]">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-40 animate-shimmer" />
        <div className="h-4 bg-zinc-100 dark:bg-zinc-800/60 rounded-md w-28 animate-shimmer" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-28 animate-shimmer" />
        <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-64 animate-shimmer" />
      </div>
      <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full w-full animate-shimmer" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3.5 px-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-1.5">
          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-32" />
          <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded w-20" />
        </div>
      </div>
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
    </div>
  );
}
