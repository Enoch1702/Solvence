import { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';

export function TransactionDialog({ isOpen, onClose, onSubmit, isSubmitting, error }) {
  const [type, setType] = useState('EXPENSE'); // 'EXPENSE' | 'INCOME'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [categories, setCategories] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      api.getCategories()
        .then((cats) => {
          setCategories(cats);
          if (cats && cats.length > 0 && !categoryId) {
            setCategoryId(cats[0].id.toString());
          }
        })
        .catch(() => {});
    }
  }, [isOpen, categoryId]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      errs.amount = 'Amount must be greater than zero.';
    }
    if (!description.trim()) {
      errs.description = 'Description is required.';
    }
    if (!categoryId) {
      errs.categoryId = 'Please select a category.';
    }
    if (!transactionDate) {
      errs.transactionDate = 'Date is required.';
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      type,
      amount: parseFloat(amount),
      description: description.trim(),
      categoryId: parseInt(categoryId, 10),
      isRecurring,
      transactionDate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="saas-card relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-2xl p-6 z-10 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Record Financial Event
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Live calculation into liquid reserve &amp; safe runway.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-500">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Type Switcher */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Flow Direction
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                  type === 'EXPENSE'
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Outflow / Expense</span>
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                  type === 'INCOME'
                    ? 'bg-[var(--bg-card)] text-emerald-600 dark:text-emerald-400 shadow-xs border border-[var(--border-subtle)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Inflow / Income</span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-sm font-display-num bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-indigo-500 transition-colors"
              />
            </div>
            {validationErrors.amount && (
              <p className="text-rose-500 text-[11px] mt-1">{validationErrors.amount}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Description / Merchant
            </label>
            <input
              type="text"
              placeholder="e.g. Server hosting, Groceries, Client invoice"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-indigo-500 transition-colors"
            />
            {validationErrors.description && (
              <p className="text-rose-500 text-[11px] mt-1">{validationErrors.description}</p>
            )}
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[var(--bg-card)]">
                    {cat.name}
                  </option>
                ))}
              </select>
              {validationErrors.categoryId && (
                <p className="text-rose-500 text-[11px] mt-1">{validationErrors.categoryId}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Date
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:border-indigo-500 transition-colors"
              />
              {validationErrors.transactionDate && (
                <p className="text-rose-500 text-[11px] mt-1">{validationErrors.transactionDate}</p>
              )}
            </div>
          </div>

          {/* Recurring Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-subtle)] text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-[var(--text-secondary)]">
                Mark as Recurring Mandatory Obligation (quarantined from daily spend)
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white font-semibold rounded-xl shadow-framer-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Confirm &amp; Recalculate</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
