import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Sliders,
  CalendarCheck,
  Clock,
  Shield
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

  // Runway Scenario Simulator State
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

  // Simulation calculations
  const simResults = useMemo(() => {
    if (!runwayData) return null;
    const available =
      runwayData.availableCash ??
      ((runwayData.liquidReserve || 0) - (runwayData.committedBills || 0));
    const spend = Math.max(100, simulatedSpend);
    const simDays = Math.max(0, Math.floor(available / spend));
    const deltaDays = simDays - (runwayData.daysRemaining || 25);
    return { simDays, deltaDays, spend };
  }, [runwayData, simulatedSpend]);

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
              <div className="saas-glass-card p-4 flex items-start gap-3 shadow-framer-xs">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-[var(--text-primary)]">
                    100% Reserve Protected
                  </h5>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                    Zero committed bills due this cycle. All {formatCurrency(runwayData.liquidReserve)} remains unencumbered.
                  </p>
                </div>
              </div>

              <div className="saas-glass-card p-4 flex items-start gap-3 shadow-framer-xs">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-[var(--text-primary)]">
                    Safe Daily Limit
                  </h5>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                    Allocate up to {formatCurrency(runwayData.safeDailySpend)}/day over the next {runwayData.daysRemaining} days safely.
                  </p>
                </div>
              </div>

              <div className="saas-glass-card p-4 flex items-start gap-3 shadow-framer-xs">
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-[var(--text-primary)]">
                    Positive Cash Velocity
                  </h5>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                    +{formatCurrency(runwayData.totalIncome)} credited this cycle, boosting runway life hours to {(runwayData.lifeHoursRemaining ?? (runwayData.hourlyRate > 0 ? (runwayData.liquidReserve / runwayData.hourlyRate) : 0)).toFixed(1)}h.
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

          {/* Compact Recent Activity Stream (with link to dedicated ledger) */}
          <div>
            <TransactionLedger
              transactions={transactions}
              loading={loading}
              onDelete={handleDeleteTransaction}
              onNewTransaction={() => setIsDialogOpen(true)}
              deletingId={deletingId}
              isCompact={true}
              onViewAll={() => onViewChange && onViewChange('transactions')}
            />
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: RUNWAY ANALYSIS & INTERACTIVE SCENARIO SIMULATOR */}
      {/* ========================================================================= */}
      {activeView === 'runway' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="saas-glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-framer-md">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                  Forward Cashflow &amp; Runway Simulator
                </h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Simulate burn trajectories and stress-test daily discretionary budgets against cycle completion.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-[var(--bg-card-subtle)] px-4 py-2 rounded-xl border border-[var(--border-subtle)] shadow-xs">
              <div>
                <span className="block text-[10px] uppercase font-bold text-[var(--text-muted)]">Target Velocity</span>
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
          <div className="saas-glass-card p-6 shadow-framer-md border border-indigo-500/20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[var(--border-subtle)]">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Interactive Spend Scenario Engine
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Adjust your simulated daily spend to see how your runway longevity dynamically changes.
                </p>
              </div>

              {/* Preset Chips */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSimulatedSpend(1500)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
                    Simulated Runway
                  </span>
                  <span className="text-2xl font-bold font-display-num text-[var(--text-primary)]">
                    {simResults?.simDays || 0} days
                  </span>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {simResults?.deltaDays >= 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        +{simResults.deltaDays}d buffer past cycle end
                      </span>
                    ) : (
                      <span className="text-rose-500 font-medium">
                        {simResults?.deltaDays}d short of cycle end
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

          {/* Full-width Trajectory Chart with Simulated Burn Slope */}
          <RunwayChart
            runwayData={runwayData}
            customSafeDailySpend={simulatedSpend}
          />

          {/* Mathematical Decomposition */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="saas-glass-card p-6 shadow-framer-xs">
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

            <div className="saas-glass-card p-6 shadow-framer-xs">
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

            <div className="saas-glass-card p-6 shadow-framer-xs">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                3. Daily Safe Velocity
              </span>
              <p className="text-2xl font-bold font-display-num text-indigo-600 dark:text-indigo-400 mb-1">
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
      {/* VIEW 3: DEDICATED TRANSACTIONS LEDGER & CATEGORIES */}
      {/* ========================================================================= */}
      {activeView === 'transactions' && (
        <div className="space-y-6">
          <div className="saas-glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-framer-md">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                Financial Transactions Ledger
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Complete audit ledger of credits and debits with real-time category distribution and life-hour impacts.
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

          {/* Full Pro Ledger with Category Totals */}
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
      {/* VIEW 4: COMMITTED OBLIGATIONS & OVERDRAFT SHIELD */}
      {/* ========================================================================= */}
      {activeView === 'committed' && (
        <div className="space-y-6">
          <div className="saas-glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-framer-md">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                Committed Obligations &amp; Shield Protocol
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Mandatory recurring commitments quarantined in advance to safeguard 100% of your financial runway.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Overdraft Shield Active</span>
            </div>
          </div>

          {/* Split: Upcoming Obligations Card & Protection Architecture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UpcomingObligationsCard runwayData={runwayData} />

            <div className="saas-glass-card p-6 flex flex-col justify-between shadow-framer-md">
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Solvence Protection Guarantee</span>
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Unlike traditional budgeting apps that treat income as a single pool, Solvence quarantines committed obligations first:
                </p>
                <div className="mt-3 p-3.5 bg-[var(--bg-card-subtle)] rounded-xl border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] leading-relaxed shadow-xs">
                  Safe Daily Spend = (Liquid Reserve − Committed Bills) ÷ Days Remaining
                </div>
                <div className="mt-4 space-y-2 text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Upcoming bills are quarantined before discretionary spending is authorized.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Your unencumbered cash balance remains 100% protected through cycle end.</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">Current Quarantine Ratio</span>
                <strong className="text-[var(--text-primary)] font-display-num">
                  {runwayData?.committedBills ? `${Math.round((runwayData.committedBills / runwayData.liquidReserve) * 100)}%` : '0% (Unencumbered)'}
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
                  Obligations &amp; Subscriptions Cadence
                </h3>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {runwayData?.committedBills > 0 ? 'Active Obligations' : 'No upcoming bills pending'}
              </span>
            </div>

            <div className="p-8 text-center bg-[var(--bg-card-subtle)]/40 rounded-xl border border-dashed border-[var(--border-subtle)]">
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                {runwayData?.committedBills > 0
                  ? `You have ${formatCurrency(runwayData.committedBills)} in recurring mandatory bills scheduled for deduction during this cycle.`
                  : 'All recurring commitments for this cycle have been met or are unallocated. Your full reserve of ' + formatCurrency(runwayData?.liquidReserve || 0) + ' is discretionary.'}
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
