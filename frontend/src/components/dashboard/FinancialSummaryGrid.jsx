import { ShieldCheck, CalendarClock, Layers, Clock, ArrowUpRight, ArrowDownRight, Briefcase } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { MetricCardSkeleton } from '../common/Skeleton';
import { formatCurrency, formatLifeHours } from '../../utils/currency';

export function FinancialSummaryGrid({ runwayData, loading }) {
  if (loading || !runwayData) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
    );
  }

  const {
    liquidReserve = 0,
    committedBills = 0,
    availableCash = 0,
    openingBalance = 0,
    totalIncome = 0,
    totalExpenses = 0,
    hourlyRate = 300,
  } = runwayData;

  // Calculate reserve life hours: Liquid Reserve / hourlyRate
  const reserveLifeHours = hourlyRate > 0 ? (liquidReserve / hourlyRate) : null;

  return (
    <div className="space-y-5 mb-8">
      {/* 4 Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Liquid Reserve */}
        <MetricCard
          title="Liquid Reserve"
          numericValue={liquidReserve}
          formatFn={(v) => formatCurrency(v)}
          subtitle="Cash across liquid accounts"
          icon={ShieldCheck}
          variant="emerald"
          badge={totalIncome > 0 ? `+${formatCurrency(totalIncome, { showFraction: false })} in` : undefined}
          badgeVariant="emerald"
        />

        {/* 2. Committed Bills */}
        <MetricCard
          title="Committed Bills"
          numericValue={committedBills}
          formatFn={(v) => formatCurrency(v)}
          subtitle="Obligations due this cycle"
          icon={CalendarClock}
          variant="amber"
          badge={committedBills === 0 ? '0 obligations' : 'Cycle bills'}
          badgeVariant={committedBills === 0 ? 'slate' : 'amber'}
        />

        {/* 3. Available Cash */}
        <MetricCard
          title="Available Cash"
          numericValue={availableCash}
          formatFn={(v) => formatCurrency(v)}
          subtitle="Unencumbered reserve buffer"
          icon={Layers}
          variant="indigo"
          badge="100% Protected"
          badgeVariant="indigo"
        />

        {/* 4. Life Hours Reserve */}
        <MetricCard
          title="Life Hours"
          amount={formatLifeHours(reserveLifeHours) || '—'}
          subtitle={`Reserve at ₹${Number(hourlyRate).toFixed(0)}/hr rate`}
          icon={Clock}
          variant="violet"
          badge={hourlyRate ? `₹${hourlyRate}/hr` : undefined}
          badgeVariant="violet"
        />
      </div>

      {/* Secondary Financial Flow Strip */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-framer-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
          {/* Opening Balance */}
          <div className="px-2 sm:px-3 pt-2 sm:pt-0">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
              Opening Balance
            </span>
            <span className="font-mono text-sm sm:text-base font-semibold text-stone-800">
              {formatCurrency(openingBalance)}
            </span>
            <span className="block text-[10px] text-stone-400 mt-0.5">Cycle baseline</span>
          </div>

          {/* Total Inflows */}
          <div className="px-2 sm:px-3 pt-2 sm:pt-0">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
              Total Inflows
            </span>
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <span className="font-mono text-sm sm:text-base font-semibold text-emerald-700">
                +{formatCurrency(totalIncome)}
              </span>
            </div>
            <span className="block text-[10px] text-stone-400 mt-0.5">Received this cycle</span>
          </div>

          {/* Total Outflows */}
          <div className="px-2 sm:px-3 pt-2 sm:pt-0">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
              Total Outflows
            </span>
            <div className="flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
              <span className="font-mono text-sm sm:text-base font-semibold text-rose-700">
                -{formatCurrency(totalExpenses)}
              </span>
            </div>
            <span className="block text-[10px] text-stone-400 mt-0.5">Spent this cycle</span>
          </div>

          {/* Earning Baseline */}
          <div className="px-2 sm:px-3 pt-2 sm:pt-0">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
              Hourly Baseline
            </span>
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-stone-500" />
              <span className="font-mono text-sm sm:text-base font-semibold text-stone-800">
                {formatCurrency(hourlyRate)}/hr
              </span>
            </div>
            <span className="block text-[10px] text-stone-400 mt-0.5">Time valuation rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
