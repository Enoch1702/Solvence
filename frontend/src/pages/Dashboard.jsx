import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import api from '../services/api';
import { FinancialSummaryGrid } from '../components/dashboard/FinancialSummaryGrid';
import { TransactionLedger } from '../components/transactions/TransactionLedger';
import { TransactionDialog } from '../components/transactions/TransactionDialog';
import { ErrorBanner } from '../components/common/ErrorBanner';
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
      setError(err.message || 'Failed to load financial data from Solvence backend.');
    } finally {
      setLoading(false);
    }
  }, [onCycleUpdate]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  async function handleCreateTransaction(formData) {
    setIsSubmitting(true);
    setDialogError('');
    try {
      await api.createTransaction(formData);
      setIsDialogOpen(false);
      // Immediately refresh runway summary and ledger to ensure zero stale numbers
      await loadAllData();
    } catch (err) {
      setDialogError(err.message || 'Failed to record transaction.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTransaction(id) {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    setDeletingId(id);
    try {
      await api.deleteTransaction(id);
      await loadAllData();
    } catch (err) {
      setError(`Failed to delete transaction: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cashflow &amp; Safe Spend
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time runway calculation based on liquid reserves and committed obligations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Record Transaction
        </button>
      </div>

      {/* Global Error Banner */}
      <ErrorBanner message={error} onRetry={loadAllData} />

      {/* Primary Financial Metric Cards */}
      <FinancialSummaryGrid runwayData={runwayData} loading={loading} />

      {/* Transactions Ledger */}
      <TransactionLedger
        transactions={transactions}
        loading={loading}
        onDelete={handleDeleteTransaction}
        onNewTransaction={() => setIsDialogOpen(true)}
        deletingId={deletingId}
      />

      {/* New Transaction Modal Dialog */}
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
