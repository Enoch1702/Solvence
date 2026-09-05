import { useState, useEffect, useRef } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { getTodayISO } from '../../utils/date';

export function TransactionDialog({
  isOpen,
  onClose,
  categories,
  onSubmit,
  isSubmitting,
  error
}) {
  const [type, setType] = useState('EXPENSE');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(getTodayISO());
  const [formError, setFormError] = useState('');

  const amountInputRef = useRef(null);

  // Filter categories matching selected type, or fallback to all
  const filteredCategories = categories.filter((cat) => cat.type === type);

  // Auto-select first category when type changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      const matching = categories.filter((cat) => cat.type === type);
      if (matching.length > 0) {
        setCategoryId(String(matching[0].id));
      } else if (categories.length > 0) {
        setCategoryId(String(categories[0].id));
      }
      setAmount('');
      setDescription('');
      setTransactionDate(getTodayISO());
      setFormError('');

      // Focus amount input
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, type, categories]);

  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Please enter a valid positive monetary amount.');
      return;
    }

    if (!categoryId) {
      setFormError('Please select a category.');
      return;
    }

    if (!transactionDate) {
      setFormError('Please select a transaction date.');
      return;
    }

    onSubmit({
      amount: numericAmount,
      type,
      categoryId: parseInt(categoryId, 10),
      description: description.trim() || undefined,
      transactionDate,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 id="dialog-title" className="text-base font-semibold text-slate-900">
            Record Transaction
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error alerts */}
          {(formError || error) && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {formError || error}
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  type === 'EXPENSE'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  type === 'INCOME'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                Income
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="tx-amount" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-mono text-sm">
                ₹
              </span>
              <input
                id="tx-amount"
                ref={amountInputRef}
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 text-base font-mono font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="tx-category" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Category *
            </label>
            <select
              id="tx-category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            >
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} {cat.isEssential ? '(Essential)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="tx-description" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Description (Optional)
            </label>
            <input
              id="tx-description"
              type="text"
              maxLength={255}
              placeholder="e.g. Groceries, Dinner, Freelance project"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="tx-date" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Date *
            </label>
            <input
              id="tx-date"
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 rounded-lg shadow-xs transition-colors focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording...
                </>
              ) : (
                'Save Transaction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
