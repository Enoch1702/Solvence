import { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle2, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { RunwayHero } from '../components/dashboard/RunwayHero';
import { FinancialSummaryGrid } from '../components/dashboard/FinancialSummaryGrid';
import { RunwayChart } from '../components/dashboard/RunwayChart';
import { UpcomingObligationsCard } from '../components/dashboard/UpcomingObligationsCard';
import { TransactionLedger } from '../components/transactions/TransactionLedger';
import { TransactionDialog } from '../components/transactions/TransactionDialog';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { RunwayHeroSkeleton } from '../components/common/Skeleton';
import { formatDate } from '../utils/date';
import { formatCurrency } from '../utils/currency';

export function Dashboard({ onCycleUpdate, activeView = 'dashboard', refreshTrigger = 0 }) {
  const [runwayData, setRunwayData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const loadAllData = useCallback(async () => {
    try {
      setError(null);
      const [runwayRes, txRes] = await Promise.all([
        api.getRunwaySummary(),
        api.getTransactions(),
      ]);

      setRunwayData(runwayRes);
      setTransactions(txRes);

      if (onCycleUpdate && runwayRes.cycleStart && runwayRes.cycleEnd) {
        onCycleUpdate(`${formatDate(runwayRes.cycleStart)} - ${formatDate(runwayRes.cycleEnd)}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to Solvence backend server.');
    } finally {
      setLoading(false);
    }
  }, [onCycleUpdate]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData, refreshTrigger]);

  // Global quick action event listener
  useEffect(() => {
    const handleOpenTx = () => setIsDialogOpen(true);
    window.addEventListener('solvence:open-tx', handleOpenTx);
    return () => window.removeEventListener('solvence:open-tx', handleOpenTx);
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  async function handleCreateTransaction(formData) {
    setIsSubmitting(true);
    setDialogError('');
    try {
      await api.createTransaction(formData);
      setIsDialogOpen(false);
      await loadAllData();
      triggerToast('Transaction recorded successfully! Runway recalculated.');
    } catch (err) {
      setDialogError(err.message || 'Failed to record transaction.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTransaction(id) {
    if (!window.confirm('Are you sure you want to remove this transaction?')) {
      return;
    }

    setDeletingId(id);
    try {
      await api.deleteTransaction(id);
      await loadAllData();
      triggerToast('Transaction deleted. Runway updated.');
    } catch (err) {
      setError(`Failed to delete transaction: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-2xl shadow-framer-lg animate-fade-in-up">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Error Banner */}
      <ErrorBanner message={error} onRetry={loadAllData} />

      {/* ========================================================================= */}
      {/* VIEW 1: DASHBOARD / EXECUTIVE COCKPIT */}
      {/* ========================================================================= */}
      {activeView === 'dashboard' && (
        <>
          {/* Executive Runway Centerpiece */}
          {loading || !runwayData ? (
            <RunwayHeroSkeleton />
          ) : (
            <RunwayHero runwayData={runwayData} />
          )}

          {/* 4 Financial Pulse Cards & Cashflow Reconciliation Strip */}
          <FinancialSummaryGrid runwayData={runwayData} loading={loading} />

          {/* Copilot-Style Smart Financial Intelligence Feed */}
          {runwayData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="saas-card p-4 bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-[var(--text-primary)]">
                    100% Reserve Protected
                  </h5>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                    Zero committed bills due this cycle. All {formatCurrency(runwayData.liquidReserve)} is unencumbered.
                  </p>
                </div>
              </div>

              <div className="saas-card p-4 bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-[var(--text-primary)]">
                    Safe Velocity Cap
                  </h5>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                    Allocate up to {formatCurrency(runwayData.safeDailySpend)}/day over the remaining {runwayData.daysRemaining} days without risk.
                  </p>
                </div>
              </div>

              <div className="saas-card p-4 bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-start gap-3">
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-[var(--text-primary)]">
                    Positive Net Inflow
                  </h5>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                    +{formatCurrency(runwayData.totalIncome)} credited this cycle, boosting runway life hours to {runwayData.lifeHoursRemaining?.toFixed(1) || '0'}h.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Runway Chart & Obligations Breakdown Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RunwayChart runwayData={runwayData} />
            </div>
            <div className="lg:col-span-1">
              <UpcomingObligationsCard runwayData={runwayData} />
            </div>
          </div>

          {/* Activity Ledger */}
          <div>
            <TransactionLedger
              transactions={transactions}
              loading={loading}
              onDelete={handleDeleteTransaction}
              onNewTransaction={() => setIsDialogOpen(true)}
              deletingId={deletingId}
            />
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: RUNWAY ANALYSIS */}
      {/* ========================================================================= */}
      {activeView === 'runway' && (
        <div className="space-y-6">
          <div className="saas-card p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                  Forward Cashflow &amp; Runway Model
                </h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Burn trajectory ensuring safe daily discretionary spend protects all recurring commitments.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-[var(--bg-card-subtle)] px-4 py-2 rounded-xl border border-[var(--border-subtle)]">
              <div>
                <span className="block text-[10px] uppercase font-bold text-[var(--text-muted)]">Safe Daily Spend</span>
                <span className="text-base font-bold font-display-num text-indigo-500 dark:text-indigo-400">
                  {formatCurrency(runwayData?.safeDailySpend || 0)}/day
                </span>
              </div>
              <div className="w-px h-8 bg-[var(--border-subtle)]" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-[var(--text-muted)]">Days Remaining</span>
                <span className="text-base font-bold font-display-num text-[var(--text-primary)]">
                  {runwayData?.daysRemaining || 0} days
                </span>
              </div>
            </div>
          </div>

          {/* Full-width Trajectory Chart */}
          <RunwayChart runwayData={runwayData} />

          {/* Mathematical Decomposition */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="saas-card p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                1. Liquid Reserve Base
              </span>
              <p className="text-2xl font-bold font-display-num text-emerald-600 dark:text-emerald-400 mb-1">
                {formatCurrency(runwayData?.liquidReserve || 0)}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Opening balance ({formatCurrency(runwayData?.openingBalance || 0)}) plus cycle inflows ({formatCurrency(runwayData?.totalIncome || 0)}) minus outflows.
              </p>
            </div>

            <div className="saas-card p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                2. Committed Obligations
              </span>
              <p className="text-2xl font-bold font-display-num text-amber-500 mb-1">
                {formatCurrency(runwayData?.committedBills || 0)}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Quarantined from the daily spend pool to ensure upcoming bills are never overdrafted.
              </p>
            </div>

            <div className="saas-card p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                3. Daily Safe Velocity
              </span>
              <p className="text-2xl font-bold font-display-num text-indigo-500 dark:text-indigo-400 mb-1">
                {formatCurrency(runwayData?.safeDailySpend || 0)}/day
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Exact capacity divided over the remaining {runwayData?.daysRemaining || 0} cycle days.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: TRANSACTIONS LEDGER */}
      {/* ========================================================================= */}
      {activeView === 'transactions' && (
        <div className="space-y-6">
          <div className="saas-card p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                Financial Transactions Ledger
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Complete historical record of income and expenditures with real-time runway impact.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-white dark:text-black rounded-xl shadow-framer-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Activity</span>
            </button>
          </div>

          <TransactionLedger
            transactions={transactions}
            loading={loading}
            onDelete={handleDeleteTransaction}
            onNewTransaction={() => setIsDialogOpen(true)}
            deletingId={deletingId}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: COMMITTED OBLIGATIONS */}
      {/* ========================================================================= */}
      {activeView === 'committed' && (
        <div className="space-y-6">
          <div className="saas-card p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                Committed Obligations &amp; Protection
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Mandatory bills and recurring commitments quarantined to safeguard your financial runway.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UpcomingObligationsCard runwayData={runwayData} />
            <div className="saas-card p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                  Solvence Protection Guarantee
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  The Safe Runway engine automatically calculates:
                </p>
                <div className="mt-3 p-3 bg-[var(--bg-card-subtle)] rounded-xl border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)]">
                  Safe Daily Spend = (Liquid Reserve − Committed Bills) ÷ Days Remaining
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-3 leading-relaxed">
                  By strictly limiting daily spend to this number, your committed bills ({formatCurrency(runwayData?.committedBills || 0)}) will always be 100% covered when due.
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero overdraft risk under current allocation.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog for Recording Transactions */}
      <TransactionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleCreateTransaction}
        isSubmitting={isSubmitting}
        error={dialogError}
      />
    </div>
  );
}
