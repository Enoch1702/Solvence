import { ShieldCheck, CalendarClock, Zap, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { MetricCardSkeleton } from '../common/Skeleton';
import { formatCurrency } from '../../utils/currency';

export function FinancialSummaryGrid({ runwayData, loading }) {
  if (loading || !runwayData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
    );
  }

  const {
    liquidReserve,
    committedBills,
    availableCash,
    safeDailySpend,
    daysRemaining,
    openingBalance,
    totalIncome,
    totalExpenses
  } = runwayData;

  return (
    <div className="space-y-6 mb-8">
      {/* 3 Primary Strategic Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Liquid Reserve */}
        <MetricCard
          title="Liquid Reserve"
          amount={formatCurrency(liquidReserve)}
          subtitle="Cash currently available across accounts"
          icon={ShieldCheck}
          variant="emerald"
        />

        {/* 2. Committed Bills */}
        <MetricCard
          title="Committed Bills"
          amount={formatCurrency(committedBills)}
          subtitle="Obligations due in remaining pay cycle"
          icon={CalendarClock}
          variant="amber"
        />

        {/* 3. Safe Daily Spend */}
        <MetricCard
          title="Safe Daily Spend"
          amount={`${formatCurrency(safeDailySpend)} / day`}
          subtitle={`${daysRemaining} days remaining in cycle`}
          icon={Zap}
          variant="indigo"
          badge={daysRemaining > 0 ? `${daysRemaining}d left` : 'Cycle End'}
        />
      </div>

      {/* Secondary Context Strip: Flow Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="px-3 py-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Opening Balance
            </span>
            <span className="font-mono text-sm font-semibold text-slate-800">
              {formatCurrency(openingBalance)}
            </span>
          </div>

          <div className="px-3 py-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Total Inflows
            </span>
            <div className="flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-mono text-sm font-semibold text-emerald-700">
                {formatCurrency(totalIncome)}
              </span>
            </div>
          </div>

          <div className="px-3 py-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Total Outflows
            </span>
            <div className="flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
              <span className="font-mono text-sm font-semibold text-rose-700">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>

          <div className="px-3 py-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Net Available Cash
            </span>
            <div className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-mono text-sm font-semibold text-indigo-900">
                {formatCurrency(availableCash)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
