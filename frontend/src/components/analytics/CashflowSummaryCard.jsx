import { ArrowDownLeft, ArrowUpRight, Scale, Receipt } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';

export function CashflowSummaryCard({ cashflowData, loading = false }) {
  if (loading) {
    return (
      <div className="saas-card p-5 sm:p-6 shadow-framer-md animate-pulse">
        <div className="h-5 w-44 bg-[var(--bg-card-subtle)] rounded mb-2" />
        <div className="h-3.5 w-60 bg-[var(--bg-card-subtle)] rounded mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-20 bg-[var(--bg-card-subtle)] rounded-xl" />
          <div className="h-20 bg-[var(--bg-card-subtle)] rounded-xl" />
          <div className="h-20 bg-[var(--bg-card-subtle)] rounded-xl" />
          <div className="h-20 bg-[var(--bg-card-subtle)] rounded-xl" />
        </div>
      </div>
    );
  }

  const income = Number(cashflowData?.totalIncome) || 0;
  const expenses = Number(cashflowData?.totalExpenses) || 0;
  const netFlow = Number(cashflowData?.netCashflow) || 0;
  const count = cashflowData?.transactionCount || 0;
  const isPositiveNet = netFlow >= 0;

  return (
    <div className="saas-card p-5 sm:p-6 shadow-framer-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Scale className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Cashflow Intelligence
            </h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Current pay cycle inflow, outflow, and net balance movement
          </p>
        </div>

        {cashflowData?.cycleStart && cashflowData?.cycleEnd && (
          <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-card-subtle)] px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] font-medium">
            Cycle: {formatDate(cashflowData.cycleStart)} → {formatDate(cashflowData.cycleEnd)}
          </div>
        )}
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {/* Income */}
        <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Total Inflow
            </span>
            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-base sm:text-lg font-bold font-display-num text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(income)}
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            Recorded pay cycle income
          </p>
        </div>

        {/* Expenses */}
        <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Total Outflow
            </span>
            <span className="p-1 rounded-md bg-rose-500/10 text-rose-500">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-base sm:text-lg font-bold font-display-num text-rose-600 dark:text-rose-400">
            -{formatCurrency(expenses)}
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            Recorded pay cycle expenses
          </p>
        </div>

        {/* Net Flow */}
        <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Net Cashflow
            </span>
            <span
              className={`p-1 rounded-md ${
                isPositiveNet
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-rose-500/10 text-rose-500'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
            </span>
          </div>
          <div
            className={`text-base sm:text-lg font-bold font-display-num ${
              isPositiveNet
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isPositiveNet ? '+' : ''}
            {formatCurrency(netFlow)}
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            {isPositiveNet ? 'Positive accumulation' : 'Net cycle reduction'}
          </p>
        </div>

        {/* Transaction Count */}
        <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Activity Count
            </span>
            <span className="p-1 rounded-md bg-blue-500/10 text-blue-500">
              <Receipt className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-base sm:text-lg font-bold font-display-num text-[var(--text-primary)]">
            {count} {count === 1 ? 'entry' : 'entries'}
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            Transactions in cycle
          </p>
        </div>
      </div>
    </div>
  );
}
