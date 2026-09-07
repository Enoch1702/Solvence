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
      {/* 4 Core Metric Cards with Distinct Semantic SaaS Personas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Current Balance"
          amount={liquidReserve}
          icon={Wallet}
          variant="blue"
          badgeText={totalIncome > 0 ? `+${formatCurrency(totalIncome)} in` : 'Steady'}
          badgeVariant="blue"
          subtitle="Based on your opening balance, income, and expenses"
        />

        <MetricCard
          title="Upcoming Bills"
          amount={committedBills}
          icon={CalendarCheck}
          variant="amber"
          badgeText={committedBills > 0 ? 'Active' : 'No bills due'}
          badgeVariant={committedBills > 0 ? 'amber' : 'neutral'}
          subtitle="Amount needed for upcoming bills"
        />

        <MetricCard
          title="Available to Spend"
          amount={unencumberedCash}
          icon={Shield}
          variant="violet"
          badgeText={unencumberedCash > 0 ? 'Available' : 'Zero Buffer'}
          badgeVariant={unencumberedCash > 0 ? 'violet' : 'amber'}
          subtitle="Money available after upcoming bills"
        />

        <MetricCard
          title="Work Hours Represented"
          amount={hoursDisplay}
          isCurrency={false}
          icon={Clock}
          variant="orange"
          badgeText={`₹${hourlyRate}/hr`}
          badgeVariant="orange"
          subtitle="Equivalent work hours at your configured hourly rate"
          helperText={`Equivalent work hours at ₹${hourlyRate}/hr rate`}
        />
      </div>

      {/* Reconciliation Strip with Semantic Micro-Accents */}
      <div className="saas-glass-card p-4 shadow-framer-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-subtle)] text-center sm:text-left">
          <div className="sm:pr-4 sm:border-l-2 sm:border-blue-500/50 sm:pl-3">
            <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Opening Balance
            </span>
            <span className="text-sm font-semibold font-display-num text-[var(--text-primary)]">
              {formatCurrency(openingBalance)}
            </span>
          </div>

          <div className="pt-3 sm:pt-0 sm:px-4 sm:border-l-2 sm:border-emerald-500/50 sm:pl-3">
            <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Total Income
            </span>
            <span className="text-sm font-semibold font-display-num text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(totalIncome)}
            </span>
          </div>

          <div className="pt-3 sm:pt-0 sm:px-4 sm:border-l-2 sm:border-rose-500/50 sm:pl-3">
            <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Total Expenses
            </span>
            <span className="text-sm font-semibold font-display-num text-rose-600 dark:text-rose-400">
              -{formatCurrency(totalExpenses)}
            </span>
          </div>

          <div className="pt-3 sm:pt-0 sm:pl-4 sm:border-l-2 sm:border-orange-500/50">
            <span className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Hourly Rate
            </span>
            <span className="text-sm font-semibold font-display-num text-orange-600 dark:text-orange-400">
              ₹{hourlyRate}.00/hr
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
