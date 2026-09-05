import { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle2, RefreshCw } from 'lucide-react';
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

export function Dashboard({ onCycleUpdate }) {
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
  }, [loadAllData]);

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
      // Immediately refresh runway summary and ledger to ensure zero stale numbers
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
    <div className="space-y-8 animate-fade-in-up">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-2xl shadow-framer-lg animate-fade-in-up">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header: Greeting & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Cashflow &amp; Safe Spend
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
              Live Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Real-time burn rate and daily spending capacity, protecting committed obligations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadAllData}
            title="Refresh financial data"
            className="p-2.5 text-stone-500 hover:text-stone-800 hover:bg-white bg-stone-50 border border-stone-200/80 rounded-xl transition-all shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-framer-xs hover:shadow-framer-sm transition-all focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Record Transaction
          </button>
        </div>
      </div>

      {/* Global Error Banner (if error) */}
      <ErrorBanner message={error} onRetry={loadAllData} />

      {/* Primary Runway Hero Centerpiece */}
      {loading || !runwayData ? (
        <RunwayHeroSkeleton />
      ) : (
        <RunwayHero
          runwayData={runwayData}
          onNewTransaction={() => setIsDialogOpen(true)}
        />
      )}

      {/* 4 Financial Metric Cards & Flow Breakdown */}
      <FinancialSummaryGrid runwayData={runwayData} loading={loading} />

      {/* Runway Visualization & Obligations Breakdown */}
      <section id="runway-section" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RunwayChart runwayData={runwayData} />
          </div>
          <div className="lg:col-span-1">
            <UpcomingObligationsCard runwayData={runwayData} />
          </div>
        </div>
      </section>

      {/* Transaction Activity Feed & Ledger */}
      <section id="ledger-section">
        <TransactionLedger
          transactions={transactions}
          loading={loading}
          onDelete={handleDeleteTransaction}
          onNewTransaction={() => setIsDialogOpen(true)}
          deletingId={deletingId}
        />
      </section>

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
