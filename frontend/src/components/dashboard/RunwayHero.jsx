import { ShieldCheck, ArrowUpRight } from 'lucide-react';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { formatCurrency } from '../../utils/currency';

export function RunwayHero({ runwayData }) {
  if (!runwayData) return null;

  const {
    safeDailySpend = 0,
    daysRemaining = 0,
    liquidReserve = 0,
    committedBills = 0,
    unencumberedCash = 0,
    totalIncome = 0,
    totalExpenses = 0,
  } = runwayData;

  const totalBuffer = liquidReserve > 0 ? liquidReserve : 1;
  const committedPct = Math.min(100, Math.max(0, Math.round((committedBills / totalBuffer) * 100)));
  const availablePct = Math.max(0, 100 - committedPct);

  return (
    <div className="saas-card relative overflow-hidden p-6 sm:p-8 bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-framer-sm">
      {/* Specular Ambient Glow (Copilot Style) */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-indigo-500/[0.04] dark:bg-indigo-500/[0.08] blur-3xl pointer-events-none -z-0" />

      <div className="relative z-10 flex flex-col gap-6">
        {/* Top Eyebrow & Status Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-muted)]">
              Safe Runway Engine · Real-Time Pacing
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--text-secondary)] font-medium">
              Day 6 of 30 · {daysRemaining}d left
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Optimal
            </span>
          </div>
        </div>

        {/* Centerpiece Hero Figures */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Hero Number */}
          <div className="lg:col-span-7 space-y-2">
            <span className="block text-[11px] font-semibold tracking-widest text-[var(--text-muted)] uppercase">
              Safe Daily Spend
            </span>

            <div className="flex items-baseline gap-3">
              <CurrencyDisplay
                amount={safeDailySpend}
                size="hero"
                className="text-[var(--text-primary)]"
              />
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-card-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                per day
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xl">
              Calculated dynamically as <span className="font-semibold text-[var(--text-primary)]">(Liquid Reserve − Committed Bills) ÷ {daysRemaining} days</span>. You can spend up to this threshold daily without depleting committed obligations.
            </p>
          </div>

          {/* Right Secondary Metrics Pillar */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
            <div>
              <span className="block text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-1">
                Liquid Reserve
              </span>
              <CurrencyDisplay
                amount={liquidReserve}
                size="xl"
                className="text-[var(--text-primary)]"
              />
              <span className="block text-[10px] text-[var(--text-muted)] mt-0.5">
                Total liquid cash
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-1">
                Committed Bills
              </span>
              <CurrencyDisplay
                amount={committedBills}
                size="xl"
                className={committedBills > 0 ? 'text-amber-500' : 'text-[var(--text-primary)]'}
              />
              <span className="block text-[10px] text-[var(--text-muted)] mt-0.5">
                {committedBills > 0 ? 'Quarantined this cycle' : 'Zero bills due'}
              </span>
            </div>
          </div>
        </div>

        {/* Minimalist Segmented Runway Track */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-muted)] font-medium">
              Reserve Allocation · <span className="text-[var(--text-primary)] font-semibold">{availablePct}% available</span>
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Available ({formatCurrency(unencumberedCash)})
              </span>
              {committedBills > 0 && (
                <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Committed ({formatCurrency(committedBills)})
                </span>
              )}
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${availablePct}%` }}
              title={`Available: ${formatCurrency(unencumberedCash)}`}
            />
            {committedPct > 0 && (
              <div
                className="h-full bg-amber-500 transition-all duration-500 ease-out"
                style={{ width: `${committedPct}%` }}
                title={`Committed: ${formatCurrency(committedBills)}`}
              />
            )}
          </div>
        </div>

        {/* Bottom Pacing Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              Net Protected Cash: <strong className="text-[var(--text-primary)] font-display-num">{formatCurrency(unencumberedCash)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium font-display-num">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Inflows: +{formatCurrency(totalIncome)}
            </span>
            <span className="font-display-num text-[var(--text-muted)]">
              Outflows: -{formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
