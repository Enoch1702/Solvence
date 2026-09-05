import { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
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
import { formatCurrency } from '../../src/utils/currency';

export function Dashboard({ onCycleUpdate, activeView = 'dashboard', refreshTrigger = 0 }) {
  const [runwayData, setRunwayData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
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
      const [runwayRes, txRes, catRes] = await Promise.all([
        api.getRunwaySummary(),
        api.getTransactions(),
        api.getCategories(),
      ]);

      setRunwayData(runwayRes);
      setTransactions(txRes);
      setCategories(catRes);

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

  // Listen for global quick action events from AppShell or mobile FAB
  useEffect(() => {
    const handleOpenTx = () => setIsDialogOpen(true);
    window.addEventListener('solvence:open-tx', handleOpenTx);
    return () => window.removeEventListener('solvence:open-tx', handleOpenTx);
  }, []);

  // Show auto-dismiss toast on success
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
      // Immediately refresh runway summary and ledger
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

      {/* Global Error Banner (if error) */}
      <ErrorBanner message={error} onRetry={loadAllData} />

      {/* ========================================================================= */}
      {/* VIEW 1: DASHBOARD (Executive Cockpit) */}
      {/* ========================================================================= */}
      {activeView === 'dashboard' && (
        <>
          {/* Primary Runway Hero Centerpiece */}
          {loading || !runwayData ? (
            <RunwayHeroSkeleton />
          ) : (
            <RunwayHero runwayData={runwayData} />
          )}

          {/* 4 Financial Metric Cards & Flow Breakdown */}
          <FinancialSummaryGrid runwayData={runwayData} loading={loading} />

          {/* Runway Visualization & Obligations Breakdown Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RunwayChart runwayData={runwayData} />
            </div>
            <div className="lg:col-span-1">
              <UpcomingObligationsCard runwayData={runwayData} />
            </div>
          </div>

          {/* Recent Financial Activity Stream */}
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
      {/* VIEW 2: RUNWAY ANALYSIS (Dedicated In-Depth Runway View) */}
      {/* ========================================================================= */}
      {activeView === 'runway' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-stone-200/80 shadow-framer-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 className="text-xl font-bold tracking-tight text-stone-900">
                  Forward Cashflow &amp; Runway Projection
                </h2>
              </div>
              <p className="text-xs text-stone-500">
                Mathematical burn trajectory model guaranteeing that daily discretionary spend protects all recurring commitments.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-stone-50 px-4 py-2 rounded-xl border border-stone-200/70">
              <div>
                <span className="block text-[10px] uppercase font-bold text-stone-400">Safe Daily Spend</span>
                <span className="text-lg font-bold font-display-num text-indigo-700">
                  {formatCurrency(runwayData?.safeDailySpend || 0)}/day
                </span>
              </div>
              <div className="w-px h-8 bg-stone-200" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-stone-400">Days Remaining</span>
                <span className="text-lg font-bold font-display-num text-stone-800">
                  {runwayData?.daysRemaining || 0} days
                </span>
              </div>
            </div>
          </div>

          {/* Full-width Trajectory Chart */}
          <RunwayChart runwayData={runwayData} />

          {/* Reserve Health & Methodology Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-framer-xs">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">
                1. Liquid Reserve Base
              </span>
              <p className="text-2xl font-bold font-display-num text-emerald-700 mb-1">
                {formatCurrency(runwayData?.liquidReserve || 0)}
              </p>
              <p className="text-xs text-stone-500">
                Opening balance ({formatCurrency(runwayData?.openingBalance || 0)}) plus cycle inflows ({formatCurrency(runwayData?.totalIncome || 0)}) minus outflows.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-framer-xs">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">
                2. Committed Obligations
              </span>
              <p className="text-2xl font-bold font-display-num text-amber-700 mb-1">
                {formatCurrency(runwayData?.committedBills || 0)}
              </p>
              <p className="text-xs text-stone-500">
                Quarantined from the daily spend pool to ensure upcoming bills are never overdrafted.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-framer-xs">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">
                3. Daily Safe Velocity
              </span>
              <p className="text-2xl font-bold font-display-num text-indigo-700 mb-1">
                {formatCurrency(runwayData?.safeDailySpend || 0)}/day
              </p>
              <p className="text-xs text-stone-500">
                Exact capacity divided over the remaining {runwayData?.daysRemaining || 0} cycle days.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: TRANSACTIONS (Dedicated Ledger View) */}
      {/* ========================================================================= */}
      {activeView === 'transactions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-stone-200/80 shadow-framer-xs">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-stone-900">
                Transactions &amp; Activity Stream
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Every transaction records instant life-hour impact and recalibrates forward cashflow.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-framer-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Record Transaction
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
      {/* VIEW 4: COMMITTED (Dedicated Obligations View) */}
      {/* ========================================================================= */}
      {activeView === 'committed' && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-2xl border border-stone-200/80 shadow-framer-xs">
            <h2 className="text-xl font-bold tracking-tight text-stone-900">
              Committed Obligations &amp; Cycle Buffer
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Active recurring commitments due in the remainder of the current pay cycle.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UpcomingObligationsCard runwayData={runwayData} />

            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-framer-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-stone-900">
                    Runway Safety Guarantee
                  </h3>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Solvence isolates committed bills before calculating daily spending capacity. Unlike standard budgeting apps that show your entire bank balance as &quot;available&quot;, Solvence guarantees that your mandatory obligations are safely quarantined.
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-500">Unencumbered Buffer</span>
                <span className="font-bold font-display-num text-emerald-700 text-sm">
                  {formatCurrency(runwayData?.availableCash || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Transaction Modal Dialog */}
      <TransactionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        categories={categories}
        onSubmit={handleCreateTransaction}
        isSubmitting={isSubmitting}
        error={dialogError}
      />
    </div>
  );
}
