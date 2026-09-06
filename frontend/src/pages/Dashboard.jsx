import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Sliders,
  CalendarCheck,
  Clock,
  Shield,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api';
import { RunwayHero } from '../components/dashboard/RunwayHero';
import { FinancialSummaryGrid } from '../components/dashboard/FinancialSummaryGrid';
import { RunwayChart } from '../components/dashboard/RunwayChart';
import { UpcomingObligationsCard } from '../components/dashboard/UpcomingObligationsCard';
import { TransactionLedger } from '../components/transactions/TransactionLedger';
import { TransactionDialog } from '../components/transactions/TransactionDialog';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { RunwayHeroSkeleton } from '../components/common/Skeleton';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { formatDate } from '../utils/date';
import { formatCurrency } from '../utils/currency';

export function Dashboard({
  onCycleUpdate,
  activeView = 'dashboard',
  onViewChange,
  refreshTrigger = 0,
}) {
  const [runwayData, setRunwayData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Pay Cycle Planner Simulator State (strictly client-side hypothetical simulation)
  const [simulatedSpend, setSimulatedSpend] = useState(2600);

  const loadAllData = useCallback(async () => {
    try {
      setError(null);
      const [runwayRes, txRes] = await Promise.all([
        api.getRunwaySummary(),
        api.getTransactions(),
      ]);

      setRunwayData(runwayRes);
      setTransactions(txRes);
      if (runwayRes.safeDailySpend) {
        setSimulatedSpend(runwayRes.safeDailySpend);
      }

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
      triggerToast('Transaction recorded successfully! Balance updated.');
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
      triggerToast('Transaction deleted. Balance updated.');
    } catch (err) {
      setError(`Failed to delete transaction: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  // Strictly client-side hypothetical simulation (does NOT persist or alter real backend data)
  const simResults = useMemo(() => {
    if (!runwayData) return null;
    const available =
      runwayData.availableCash ??
      ((runwayData.liquidReserve || 0) - (runwayData.committedBills || 0));
    const spend = Math.max(100, simulatedSpend);
    const simDays = Math.max(0, Math.floor(available / spend));
    const deltaDays = simDays - (runwayData.daysRemaining || 25);
    return { simDays, deltaDays, spend, available };
  }, [runwayData, simulatedSpend]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-2xl shadow-framer-lg animate-modal-glide">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Error Banner */}
      <ErrorBanner message={error} onRetry={loadAllData} />

      {/* ========================================================================= */}
      {/* VIEW 1: DASHBOARD (EXECUTIVE COCKPIT) */}
      {/* Primary Responsibility: "Where do I stand?" & "Safe to spend today?" */}
      {/* ========================================================================= */}
      {activeView === 'dashboard' && (
        <>
          {/* Main Spending Guide Centerpiece */}
          {loading || !runwayData ? (
            <RunwayHeroSkeleton />
          ) : (
            <RunwayHero runwayData={runwayData} />
          )}

          {/* 4 Core Financial Summary Cards & Reconciliation Strip */}
          <FinancialSummaryGrid runwayData={runwayData} loading={loading} />

          {/* 2 Non-Interactive Preview Panels linking to dedicated views */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity Preview */}
            <div className="saas-glass-card saas-glass-card-hover p-5 sm:p-6 flex flex-col justify-between shadow-framer-md">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                      Recent Activity
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Last recorded transactions
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewChange && onViewChange('transactions')}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-[var(--border-subtle)] mt-2">
                  {transactions.slice(0, 3).length === 0 ? (
                    <p className="py-6 text-center text-xs text-[var(--text-muted)]">
                      No transactions recorded yet.
                    </p>
                  ) : (
                    transactions.slice(0, 3).map((tx) => {
                      const isIncome = tx.type === 'INCOME';
                      return (
                        <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-3">
                            <p className="font-medium text-[var(--text-primary)] truncate">
                              {tx.description}
                            </p>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {tx.categoryName || 'General'} · {formatDate(tx.transactionDate)}
                            </span>
                          </div>
                          <span
                            className={`font-semibold font-display-num shrink-0 ${
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] mt-2">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Transaction</span>
                </button>
              </div>
            </div>

            {/* Upcoming Bills Preview */}
            <div className="saas-glass-card saas-glass-card-hover p-5 sm:p-6 flex flex-col justify-between shadow-framer-md">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                      Upcoming Bills
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Scheduled for this pay cycle
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewChange && onViewChange('committed')}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <span>View schedule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="my-4 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Amount Needed:</span>
                    <CurrencyDisplay
                      amount={runwayData?.committedBills || 0}
                      size="xl"
                      className={runwayData?.committedBills > 0 ? "text-amber-500" : "text-[var(--text-primary)]"}
                    />
                  </div>
                  <div className="p-3 bg-[var(--bg-card-subtle)] rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] leading-relaxed">
                    {runwayData?.committedBills > 0
                      ? `Solvence accounts for ${formatCurrency(runwayData.committedBills)} in scheduled upcoming bills before calculating your daily safe spending limit.`
                      : 'You have no upcoming bills scheduled before the end of this pay cycle.'}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => onViewChange && onViewChange('committed')}
                  className="w-full py-2 px-3 rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Manage Bills &amp; Subscriptions</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: PAY CYCLE PLANNER (SPEND SIMULATION & BALANCE PROJECTION) */}
      {/* Primary Responsibility: "What will happen if I continue spending?" */}
      {/* ========================================================================= */}
      {activeView === 'runway' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="saas-glass-card saas-glass-card-hover p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-framer-md">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                  Pay Cycle Spend Planner
                </h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Simulate different daily spending amounts to see how your balance will hold up through the end of your pay cycle.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-[var(--bg-card-subtle)] px-4 py-2 rounded-xl border border-[var(--border-subtle)] shadow-xs">
              <div>
                <span className="block text-[10px] uppercase font-bold text-[var(--text-muted)]">Safe to Spend Today</span>
                <span className="text-base font-bold font-display-num text-indigo-600 dark:text-indigo-400">
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

          {/* Interactive What-If Scenario Simulator Card */}
          <div className="saas-glass-card saas-glass-card-hover p-6 shadow-framer-md border border-indigo-500/20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[var(--border-subtle)]">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    What-If Daily Spending Simulator
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Adjust your simulated daily spend to see how your balance will hold up. (Hypothetical simulation — does not change your actual balance.)
                </p>
              </div>

              {/* Preset Chips */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSimulatedSpend(1500)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 cursor-pointer ${
                    simulatedSpend === 1500
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                  }`}
                >
                  Lean (₹1,500/d)
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedSpend(runwayData?.safeDailySpend || 2600)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 cursor-pointer ${
                    simulatedSpend === (runwayData?.safeDailySpend || 2600)
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                  }`}
                >
                  Balanced (₹{runwayData?.safeDailySpend || 2600}/d)
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedSpend(3800)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 cursor-pointer ${
                    simulatedSpend === 3800
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                  }`}
                >
                  Stretch (₹3,800/d)
                </button>
              </div>
            </div>

            {/* Slider & Metrics */}
            <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)] font-medium">Simulated Daily Spend</span>
                  <CurrencyDisplay
                    amount={simulatedSpend}
                    size="lg"
                    className="text-indigo-600 dark:text-indigo-400 font-bold"
                  />
                </div>
                <input
                  type="range"
                  min="500"
                  max="6000"
                  step="100"
                  value={simulatedSpend}
                  onChange={(e) => setSimulatedSpend(parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-display-num">
                  <span>₹500/day</span>
                  <span>₹2,600/day (Baseline)</span>
                  <span>₹6,000/day</span>
                </div>
              </div>

              <div className="md:col-span-5 p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-[var(--text-muted)]">
                    Simulated Longevity
                  </span>
                  <span className="text-2xl font-bold font-display-num text-[var(--text-primary)]">
                    {simResults?.simDays || 0} days
                  </span>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {simResults?.deltaDays >= 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        +{simResults.deltaDays}d buffer past pay cycle end
                      </span>
                    ) : (
                      <span className="text-rose-500 font-medium">
                        {simResults?.deltaDays}d short of pay cycle end
                      </span>
                    )}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Full-width Balance Projection Chart with Simulated Spend Rate */}
          <RunwayChart
            runwayData={runwayData}
            customSafeDailySpend={simulatedSpend}
          />

          {/* How This Is Calculated */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="saas-glass-card saas-glass-card-hover p-6 shadow-framer-xs">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                1. Current Balance
              </span>
              <p className="text-2xl font-bold font-display-num text-emerald-600 dark:text-emerald-400 mb-1">
                {formatCurrency(runwayData?.liquidReserve || 0)}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Opening balance ({formatCurrency(runwayData?.openingBalance || 0)}) plus cycle income ({formatCurrency(runwayData?.totalIncome || 0)}) minus expenses ({formatCurrency(runwayData?.totalExpenses || 0)}).
              </p>
            </div>

            <div className="saas-glass-card saas-glass-card-hover p-6 shadow-framer-xs">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                2. Upcoming Bills
              </span>
              <p className="text-2xl font-bold font-display-num text-amber-500 mb-1">
                {formatCurrency(runwayData?.committedBills || 0)}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Amount needed for recurring bills due before the end of this pay cycle, protected before calculating daily safe spend.
              </p>
            </div>

            <div className="saas-glass-card saas-glass-card-hover p-6 shadow-framer-xs">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                3. Safe to Spend Today
              </span>
              <p className="text-2xl font-bold font-display-num text-indigo-600 dark:text-indigo-400 mb-1">
                {formatCurrency(runwayData?.safeDailySpend || 0)}/day
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Available spending capacity ({formatCurrency(simResults?.available || Math.max(0, (runwayData?.liquidReserve || 0) - (runwayData?.committedBills || 0)))}) divided across the remaining {runwayData?.daysRemaining || 0} days.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: DEDICATED TRANSACTIONS VIEW */}
      {/* Primary Responsibility: "Where did my money go and where did it come from?" */}
      {/* ========================================================================= */}
      {activeView === 'transactions' && (
        <div className="space-y-6">
          <div className="saas-glass-card saas-glass-card-hover p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-framer-md">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                Transactions
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Complete transaction history with categories, dates, and work hours represented.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-white dark:text-black rounded-xl shadow-framer-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Transaction</span>
            </button>
          </div>

          {/* Full Ledger with Category Totals, Filters, Search, and Pagination */}
          <TransactionLedger
            transactions={transactions}
            loading={loading}
            onDelete={handleDeleteTransaction}
            onNewTransaction={() => setIsDialogOpen(true)}
            deletingId={deletingId}
            isCompact={false}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: BILLS & SUBSCRIPTIONS */}
      {/* Primary Responsibility: "What bills do I need to prepare for?" */}
      {/* ========================================================================= */}
      {activeView === 'committed' && (
        <div className="space-y-6">
          <div className="saas-glass-card saas-glass-card-hover p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-framer-md">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                Bills &amp; Subscriptions
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Scheduled recurring bills and payments due during this pay cycle.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Bill Protection Active</span>
            </div>
          </div>

          {/* Split: Upcoming Bills Card & Bill Protection Logic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UpcomingObligationsCard runwayData={runwayData} />

            <div className="saas-glass-card saas-glass-card-hover p-6 flex flex-col justify-between shadow-framer-md">
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Bill Protection</span>
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Solvence accounts for scheduled upcoming bills before calculating your daily safe spending limit:
                </p>
                <div className="mt-3 p-3.5 bg-[var(--bg-card-subtle)] rounded-xl border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] leading-relaxed shadow-xs">
                  Safe to Spend Today = (Current Balance − Upcoming Bills) ÷ Days Remaining
                </div>
                <div className="mt-4 space-y-2 text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Upcoming bills are accounted for before daily spending is calculated.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Your spending limit keeps these bills covered through the end of the pay cycle.</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">Bills vs Balance Ratio</span>
                <strong className="text-[var(--text-primary)] font-display-num">
                  {runwayData?.committedBills ? `${Math.round((runwayData.committedBills / (runwayData.liquidReserve || 1)) * 100)}%` : '0% (No bills due)'}
                </strong>
              </div>
            </div>
          </div>

          {/* Recurring Schedule Table */}
          <div className="saas-glass-card p-6 shadow-framer-md">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Scheduled Recurring Bills
                </h3>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {runwayData?.committedBills > 0 ? 'Active Bills' : 'No upcoming bills pending'}
              </span>
            </div>

            <div className="p-8 text-center bg-[var(--bg-card-subtle)]/40 rounded-xl border border-dashed border-[var(--border-subtle)]">
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                {runwayData?.committedBills > 0
                  ? `You have ${formatCurrency(runwayData.committedBills)} in recurring bills scheduled before the end of this pay cycle.`
                  : 'No upcoming bills recorded for this pay cycle. Your full balance of ' + formatCurrency(runwayData?.liquidReserve || 0) + ' is available to spend.'}
              </p>
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
