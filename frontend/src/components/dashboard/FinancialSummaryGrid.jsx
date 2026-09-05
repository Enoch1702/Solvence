import { Wallet, CalendarCheck, Shield, Clock } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { MetricCardSkeleton } from '../common/Skeleton';
import { formatCurrency } from '../../utils/currency';

export function FinancialSummaryGrid({ runwayData, loading }) {
  if (loading || !runwayData) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
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
    unencumberedCash = 0,
    lifeHoursRemaining = 0,
    hourlyRate = 300,
    openingBalance = 0,
    totalIncome = 0,
    totalExpenses = 0,
  } = runwayData;

  const hoursDisplay =
    lifeHoursRemaining !== null && lifeHoursRemaining !== undefined
      ? `${Number(lifeHoursRemaining).toFixed(1)}h`
      : '0.0h';

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Liquid Reserve"
          amount={liquidReserve}
          icon={Wallet}
          badgeText={totalIncome > 0 ? `+${formatCurrency(totalIncome)} in` : 'Steady'}
          badgeVariant="emerald"
          subtitle="Cash across liquid accounts"
        />

        <MetricCard
          title="Committed Bills"
          amount={committedBills}
          icon={CalendarCheck}
          badgeText={committedBills > 0 ? 'Active' : '0 obligations'}
          badgeVariant={committedBills > 0 ? 'amber' : 'neutral'}
          subtitle="Obligations due this cycle"
        />

        <MetricCard
          title="Available Cash"
          amount={unencumberedCash}
          icon={Shield}
          badgeText="100% Protected"
          badgeVariant="indigo"
          subtitle="Unencumbered reserve buffer"
        />

        <MetricCard
          title="Life Hours"
          amount={hoursDisplay}
          isCurrency={false}
          icon={Clock}
          badgeText={`₹${hourlyRate}/hr`}
          badgeVariant="neutral"
          subtitle={`Reserve at ₹${hourlyRate}/hr rate`}
        />
      </div>

      {/* Cashflow Flow Reconciliation Strip (Linear / Ramp style) */}
      <div className="saas-card p-4 bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-subtle)] text-center sm:text-left">
          <div className="sm:pr-4">
            <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Opening Balance
            </span>
            <span className="text-sm font-semibold font-display-num text-[var(--text-primary)]">
              {formatCurrency(openingBalance)}
            </span>
          </div>

          <div className="pt-3 sm:pt-0 sm:px-4">
            <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Total Inflows
            </span>
            <span className="text-sm font-semibold font-display-num text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(totalIncome)}
            </span>
          </div>

          <div className="pt-3 sm:pt-0 sm:px-4">
            <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Total Outflows
            </span>
            <span className="text-sm font-semibold font-display-num text-[var(--text-primary)]">
              -{formatCurrency(totalExpenses)}
            </span>
          </div>

          <div className="pt-3 sm:pt-0 sm:pl-4">
            <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Hourly Baseline
            </span>
            <span className="text-sm font-semibold font-display-num text-[var(--text-primary)]">
              ₹{hourlyRate}.00/hr
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
