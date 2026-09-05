import { ShieldCheck, Calendar, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { AnimatedNumber } from '../common/AnimatedNumber';

export function RunwayHero({ runwayData }) {
  if (!runwayData) return null;

  const {
    liquidReserve = 0,
    committedBills = 0,
    availableCash = 0,
    safeDailySpend = 0,
    daysRemaining = 0,
    cycleStart,
    cycleEnd,
    totalIncome = 0,
    totalExpenses = 0,
  } = runwayData;

  // Calculate cycle progress (e.g. days elapsed out of total cycle days)
  let totalDaysInCycle = 30;
  let elapsedDays = 5;
  if (cycleStart && cycleEnd) {
    const start = new Date(cycleStart);
    const end = new Date(cycleEnd);
    const diffTime = Math.abs(end - start);
    totalDaysInCycle = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    elapsedDays = Math.max(0, totalDaysInCycle - daysRemaining);
  }

  // Reserve allocation percentages
  const safeReserveTotal = Math.max(liquidReserve, 1);
  const committedPercent = Math.min(100, Math.round((committedBills / safeReserveTotal) * 100));
  const availablePercent = Math.max(0, 100 - committedPercent);

  // Financial status evaluation
  const isOptimal = safeDailySpend > 0 && committedBills <= liquidReserve * 0.5;
  const isTight = safeDailySpend > 0 && !isOptimal;
  const isDepleted = safeDailySpend <= 0;

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-stone-200/80 shadow-framer-md mb-8 p-6 sm:p-8 transition-all hover:shadow-framer-lg">
      {/* Subtle ambient gradient mesh in background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-50/70 via-emerald-50/40 to-transparent blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-gradient-to-tr from-stone-100/60 via-amber-50/30 to-transparent blur-2xl"
      />

      <div className="relative z-10">
        {/* Top Header: Eyebrow + Live Cycle Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              SAFE RUNWAY ENGINE
            </span>
            <span className="text-xs font-medium text-stone-500 hidden sm:inline">
              Real-Time Forward Cashflow
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>Day {elapsedDays + 1} of {totalDaysInCycle} ({daysRemaining}d left)</span>
            </div>
            {isOptimal && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
                Optimal
              </span>
            )}
            {isTight && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                Tight
              </span>
            )}
            {isDepleted && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                Critical
              </span>
            )}
          </div>
        </div>

        {/* Main Centerpiece: Safe Daily Spend Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-7">
            <span className="block text-xs font-semibold tracking-wider text-stone-500 uppercase mb-1">
              Safe Daily Spend
            </span>
            <div className="flex items-baseline gap-3">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display-num tracking-tight text-stone-900">
                <span className="text-stone-300 font-normal mr-1 text-3xl sm:text-4xl lg:text-5xl">₹</span>
                <AnimatedNumber
                  value={safeDailySpend}
                  formatFn={(v) => {
                    const num = typeof v === 'string' ? parseFloat(v) : v;
                    return new Intl.NumberFormat('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(num || 0);
                  }}
                />
              </h2>
              <span className="text-sm sm:text-base font-semibold text-indigo-600 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100">
                per day
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-2 max-w-xl">
              Calculated dynamically as <span className="font-semibold text-stone-700">(Liquid Reserve − Committed Bills) ÷ {daysRemaining} days remaining</span>. Spend up to this amount daily without depleting your committed obligations.
            </p>
          </div>

          {/* Quick Stats Pillar */}
          <div className="lg:col-span-5 flex flex-col justify-end">
            <div className="grid grid-cols-2 gap-3 bg-stone-50/80 rounded-xl p-3.5 border border-stone-200/70">
              <div>
                <span className="block text-[11px] font-semibold uppercase text-stone-500 tracking-wider">
                  Liquid Reserve
                </span>
                <span className="text-base sm:text-lg font-bold font-display-num text-emerald-700">
                  <AnimatedNumber
                    value={liquidReserve}
                    formatFn={(v) => formatCurrency(v, { showFraction: false })}
                  />
                </span>
                <span className="block text-[10px] text-stone-400">Total liquid cash</span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold uppercase text-stone-500 tracking-wider">
                  Committed Bills
                </span>
                <span className="text-base sm:text-lg font-bold font-display-num text-amber-700">
                  <AnimatedNumber
                    value={committedBills}
                    formatFn={(v) => formatCurrency(v, { showFraction: false })}
                  />
                </span>
                <span className="block text-[10px] text-stone-400">Due this cycle</span>
              </div>
            </div>
          </div>
        </div>

        {/* Refined Segmented Runway Bar */}
        <div className="mt-7 pt-6 border-t border-stone-100">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <div className="flex items-center gap-2">
              <span className="text-stone-700">Reserve Allocation</span>
              <span className="text-stone-400 font-normal">
                ({availablePercent}% available, {committedPercent}% committed)
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="text-stone-600">Available ({formatCurrency(availableCash, { showFraction: false })})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                <span className="text-stone-600">Committed ({formatCurrency(committedBills, { showFraction: false })})</span>
              </div>
            </div>
          </div>

          {/* Segmented Progress Track */}
          <div className="w-full h-3.5 bg-stone-100 rounded-full overflow-hidden p-0.5 flex gap-0.5">
            <div
              style={{ width: `${availablePercent}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-l-full transition-all duration-700 ease-out"
              title={`Available Cash: ${formatCurrency(availableCash)}`}
            />
            {committedPercent > 0 && (
              <div
                style={{ width: `${committedPercent}%` }}
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-r-full transition-all duration-700 ease-out"
                title={`Committed Bills: ${formatCurrency(committedBills)}`}
              />
            )}
          </div>

          {/* Bottom Milestone Ribbon */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Net Available Cash: <strong className="font-display-num font-bold text-stone-800">{formatCurrency(availableCash)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Inflows: <strong className="font-display-num font-bold text-emerald-700">+{formatCurrency(totalIncome)}</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                <span>Outflows: <strong className="font-display-num font-bold text-rose-700">-{formatCurrency(totalExpenses)}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
