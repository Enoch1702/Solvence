import { AlertTriangle, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { formatCurrency } from '../../utils/currency';

export function RunwayHero({ runwayData }) {
  if (!runwayData) return null;

  const {
    safeDailySpend = 0,
    daysRemaining = 0,
    liquidReserve = 0,
    committedBills = 0,
    totalIncome = 0,
    totalExpenses = 0,
    cycleStart,
    cycleEnd,
  } = runwayData;

  const unencumberedCash =
    runwayData.availableCash ??
    runwayData.unencumberedCash ??
    (liquidReserve - committedBills);

  const isNegativeOrZeroCapacity = unencumberedCash <= 0;

  // Dynamic cycle days computation matching backend CycleCalculator
  let totalCycleDays = 30;
  if (cycleStart && cycleEnd) {
    const s = new Date(cycleStart);
    const e = new Date(cycleEnd);
    totalCycleDays = Math.round((e - s) / 86400000) + 1 || 30;
  }
  const currentDay = Math.max(1, totalCycleDays - daysRemaining + 1);

  const totalBuffer = liquidReserve > 0 ? liquidReserve : 1;
  const committedPct = Math.min(100, Math.max(0, Math.round((committedBills / totalBuffer) * 100)));
  const availablePct = Math.max(0, 100 - committedPct);

  return (
    <div className="saas-glass-card relative overflow-hidden p-6 sm:p-8 shadow-framer-md">
      {/* Specular Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-indigo-500/[0.08] blur-3xl pointer-events-none -z-0" />

      <div className="relative z-10 flex flex-col gap-6">
        {/* Top Eyebrow & Status Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-muted)]">
              Daily Spending Guide
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--text-secondary)] font-medium">
              Day {currentDay} of {totalCycleDays} · {daysRemaining}d remaining
            </span>
            {isNegativeOrZeroCapacity ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Bills Exceed Balance
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                On Track
              </span>
            )}
          </div>
        </div>

        {/* Zero/Negative Spending Alert Banner if applicable */}
        {isNegativeOrZeroCapacity && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Your upcoming bills ({formatCurrency(committedBills)}) are higher than or equal to your current balance ({formatCurrency(liquidReserve)}). You do not have positive spending capacity until more income is recorded.
            </span>
          </div>
        )}

        {/* Centerpiece Hero Figures */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Hero Number */}
          <div className="lg:col-span-7 space-y-2">
            <span className="block text-[11px] font-semibold tracking-widest text-[var(--text-muted)] uppercase">
              Safe to Spend Today
            </span>

            <div className="flex items-baseline gap-3">
              <CurrencyDisplay
                amount={safeDailySpend}
                size="hero"
                className={isNegativeOrZeroCapacity ? "text-amber-500" : "text-[var(--text-primary)]"}
              />
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-card-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                per day
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xl">
              Based on your recorded balance, expenses, income, and upcoming bills, this is the amount you can spend each day while keeping those recorded bills covered across the remaining <span className="font-semibold text-[var(--text-primary)]">{daysRemaining} days</span> of this pay cycle.
            </p>
          </div>

          {/* Right Secondary Metrics Pillar */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
            <div>
              <span className="block text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-1">
                Current Balance
              </span>
              <CurrencyDisplay
                amount={liquidReserve}
                size="xl"
                className="text-[var(--text-primary)]"
              />
              <span className="block text-[10px] text-[var(--text-muted)] mt-0.5">
                Total recorded balance
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-1">
                Upcoming Bills
              </span>
              <CurrencyDisplay
                amount={committedBills}
                size="xl"
                className={committedBills > 0 ? 'text-amber-500' : 'text-[var(--text-primary)]'}
              />
              <span className="block text-[10px] text-[var(--text-muted)] mt-0.5">
                {committedBills > 0 ? 'Due this pay cycle' : 'No bills due'}
              </span>
            </div>
          </div>
        </div>

        {/* Segmented Track */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-muted)] font-medium">
              Balance Breakdown · <span className="text-[var(--text-primary)] font-semibold">{availablePct}% available to spend</span>
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Available ({formatCurrency(unencumberedCash)})
              </span>
              {committedBills > 0 && (
                <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Upcoming Bills ({formatCurrency(committedBills)})
                </span>
              )}
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800/80 overflow-hidden flex p-0.5 border border-[var(--border-subtle)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out"
              style={{ width: `${availablePct}%` }}
              title={`Available: ${formatCurrency(unencumberedCash)}`}
            />
            {committedPct > 0 && (
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500 ease-out"
                style={{ width: `${committedPct}%` }}
                title={`Upcoming Bills: ${formatCurrency(committedBills)}`}
              />
            )}
          </div>
        </div>

        {/* Bottom Pacing Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              Available to Spend: <strong className="text-[var(--text-primary)] font-display-num">{formatCurrency(unencumberedCash)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium font-display-num">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Total Income: +{formatCurrency(totalIncome)}
            </span>
            <span className="font-display-num text-[var(--text-muted)]">
              Total Expenses: -{formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
