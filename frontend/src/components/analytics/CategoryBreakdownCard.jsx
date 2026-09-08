import { useMemo } from 'react';
import { PieChart } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

// Deterministic semantic colors for known Solvence categories
const KNOWN_CATEGORY_COLORS = {
  food: {
    bg: 'bg-blue-500',
    bar: '#3b82f6',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  transport: {
    bg: 'bg-cyan-500',
    bar: '#06b6d4',
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  },
  rent: {
    bg: 'bg-amber-500',
    bar: '#f59e0b',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  utilities: {
    bg: 'bg-violet-500',
    bar: '#8b5cf6',
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  },
  entertainment: {
    bg: 'bg-rose-500',
    bar: '#f43f5e',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
};

// Deterministic fallback jewel palette for custom categories
const FALLBACK_PALETTE = [
  { bg: 'bg-teal-500', bar: '#14b8a6', badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
  { bg: 'bg-emerald-500', bar: '#10b981', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { bg: 'bg-orange-500', bar: '#f97316', badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  { bg: 'bg-fuchsia-500', bar: '#d946ef', badge: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20' },
  { bg: 'bg-teal-500', bar: '#14b8a6', badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
  { bg: 'bg-slate-500', bar: '#64748b', badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
];

function getCategoryColor(name = '') {
  const slug = name.toLowerCase().trim();
  if (KNOWN_CATEGORY_COLORS[slug]) {
    return KNOWN_CATEGORY_COLORS[slug];
  }

  // Deterministic hash code for custom categories
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[index];
}

export function CategoryBreakdownCard({ categories = [], loading = false }) {
  const totalAmount = useMemo(() => {
    return categories.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [categories]);

  if (loading) {
    return (
      <div className="saas-card p-5 sm:p-6 shadow-framer-md animate-pulse">
        <div className="h-5 w-48 bg-[var(--bg-card-subtle)] rounded mb-2" />
        <div className="h-3.5 w-60 bg-[var(--bg-card-subtle)] rounded mb-6" />
        <div className="space-y-4">
          <div className="h-10 w-full bg-[var(--bg-card-subtle)] rounded-xl" />
          <div className="h-10 w-full bg-[var(--bg-card-subtle)] rounded-xl" />
          <div className="h-10 w-full bg-[var(--bg-card-subtle)] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="saas-card-violet p-5 sm:p-6 shadow-framer-md flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <PieChart className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Where Your Money Goes
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Current pay cycle expense distribution
            </p>
          </div>

          {categories.length > 0 && (
            <span className="text-xs font-bold font-display-num text-[var(--text-secondary)]">
              {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mt-4 flex-1">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6 bg-[var(--bg-card-subtle)] rounded-xl border border-[var(--border-subtle)]">
            <div className="p-3 rounded-full bg-violet-500/10 text-violet-500 mb-2">
              <PieChart className="w-5 h-5 opacity-60" />
            </div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              No spending recorded in this pay cycle
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-sm">
              As you record expenses, Solvence automatically breaks down and ranks your spending by category.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((item) => {
              const colorInfo = getCategoryColor(item.categoryName);
              const percentageNum = Number(item.percentage) || 0;
              const barWidth = Math.min(100, Math.max(2, percentageNum));

              return (
                <div key={item.categoryId || item.categoryName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorInfo.bg}`} />
                      <span className="font-medium text-[var(--text-primary)] truncate">
                        {item.categoryName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold font-display-num text-[var(--text-primary)]">
                        {formatCurrency(item.amount)}
                      </span>
                      <span
                        className={`text-[10px] font-bold font-display-num px-1.5 py-0.5 rounded-md border ${colorInfo.badge}`}
                      >
                        {percentageNum.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div className="h-2 w-full bg-[var(--bg-card-subtle)] rounded-full overflow-hidden border border-[var(--border-subtle)]/40">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: colorInfo.bar,
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Total Footer */}
            {totalAmount > 0 && (
              <div className="pt-3 mt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)] font-medium">Total Recorded Expenses</span>
                <span className="font-bold font-display-num text-rose-600 dark:text-rose-400">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
