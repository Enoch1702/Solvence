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
    hourlyRate = 300,
    openingBalance = 0,
    totalIncome = 0,
    totalExpenses = 0,
  } = runwayData;

  const unencumberedCash =
    runwayData.availableCash ??
    runwayData.unencumberedCash ??
    (liquidReserve - committedBills);

  const effectiveLifeHours =
    runwayData.lifeHoursRemaining ??
    (hourlyRate > 0 ? liquidReserve / hourlyRate : 0);

  const hoursDisplay =
    effectiveLifeHours !== null && effectiveLifeHours !== undefined
      ? `${Number(effectiveLifeHours).toFixed(1)}h`
      : '0.0h';

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Current Balance"
          amount={liquidReserve}
          icon={Wallet}
          badgeText={totalIncome > 0 ? `+${formatCurrency(totalIncome)} in` : 'Steady'}
          badgeVariant="emerald"
          subtitle="Based on your opening balance, income, and expenses"
        />

        <MetricCard
          title="Upcoming Bills"
          amount={committedBills}
          icon={CalendarCheck}
          badgeText={committedBills > 0 ? 'Active' : 'No bills due'}
          badgeVariant={committedBills > 0 ? 'amber' : 'neutral'}
          subtitle="Amount needed for upcoming bills"
        />

        <MetricCard
          title="Available to Spend"
          amount={unencumberedCash}
          icon={Shield}
          badgeText={unencumberedCash > 0 ? 'Available' : 'Zero Buffer'}
          badgeVariant={unencumberedCash > 0 ? 'indigo' : 'amber'}
          subtitle="Money available after upcoming bills"
        />

        <MetricCard
          title="Work Hours Represented"
          amount={hoursDisplay}
          isCurrency={false}
          icon={Clock}
          badgeText={`₹${hourlyRate}/hr`}
          badgeVariant="neutral"
          subtitle="Equivalent work hours at your configured hourly rate"
          helperText={`Equivalent work hours at ₹${hourlyRate}/hr rate`}
        />
      </div>

      {/* Reconciliation Strip (Glass Panel) */}
      <div className="saas-glass-card p-4 shadow-framer-xs">
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
              Total Income
            </span>
            <span className="text-sm font-semibold font-display-num text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(totalIncome)}
            </span>
          </div>

          <div className="pt-3 sm:pt-0 sm:px-4">
            <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Total Expenses
            </span>
            <span className="text-sm font-semibold font-display-num text-[var(--text-primary)]">
              -{formatCurrency(totalExpenses)}
            </span>
          </div>

          <div className="pt-3 sm:pt-0 sm:pl-4">
            <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Hourly Rate
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
