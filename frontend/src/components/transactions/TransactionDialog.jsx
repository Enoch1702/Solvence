import { useState, useEffect, useRef } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Loader2, Sparkles, Check } from 'lucide-react';
import { getTodayISO } from '../../utils/date';

export function TransactionDialog({
  isOpen,
  onClose,
  categories = [],
  onSubmit,
  isSubmitting,
  error,
}) {
  const [type, setType] = useState('EXPENSE');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(getTodayISO());
  const [formError, setFormError] = useState('');

  const amountInputRef = useRef(null);

  // Filter categories matching selected type
  const filteredCategories = categories.filter((cat) => cat.type === type);

  // Auto-select first matching category when type changes or dialog opens
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

      // Auto-focus amount field
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 75);
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
      setFormError('Please select a valid category.');
      return;
    }

    if (!transactionDate) {
      setFormError('Please select a valid transaction date.');
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm transition-all animate-fade-in-up"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl border border-stone-200 shadow-framer-lg max-w-md w-full overflow-hidden transition-all">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="dialog-title" className="text-base font-semibold text-stone-900">
                Record Financial Activity
              </h2>
              <p className="text-[11px] text-stone-400">
                Updates runway and safe daily spend instantly
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error Notice */}
          {(formError || error) && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl">
              {formError || error}
            </div>
          )}

          {/* Type Toggle Switch */}
          <div>
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-stone-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  type === 'EXPENSE'
                    ? 'bg-white text-rose-700 shadow-framer-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
                Expense (Outflow)
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  type === 'INCOME'
                    ? 'bg-white text-emerald-700 shadow-framer-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                Income (Inflow)
              </button>
            </div>
          </div>

          {/* Prominent Amount Input (Hero field) */}
          <div className="bg-stone-50/70 border border-stone-200/80 rounded-2xl p-4 text-center">
            <label
              htmlFor="tx-amount"
              className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1"
            >
              Amount (INR) *
            </label>
            <div className="relative inline-flex items-center justify-center max-w-xs w-full">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-stone-400 mr-2">
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
                className="w-full text-center text-3xl sm:text-4xl font-mono font-bold bg-transparent text-stone-900 placeholder:text-stone-300 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label
              htmlFor="tx-category"
              className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5"
            >
              Category *
            </label>
            <select
              id="tx-category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200/90 rounded-xl text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-xs"
            >
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} {cat.isEssential ? '• Essential' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="tx-description"
              className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5"
            >
              Description (Optional)
            </label>
            <input
              id="tx-description"
              type="text"
              maxLength={255}
              placeholder="e.g. Groceries, Team Lunch, Client Payment"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200/90 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-xs"
            />
          </div>

          {/* Date Picker */}
          <div>
            <label
              htmlFor="tx-date"
              className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5"
            >
              Transaction Date *
            </label>
            <input
              id="tx-date"
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-stone-200/90 rounded-xl text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 rounded-xl shadow-framer-xs hover:shadow-framer-sm transition-all focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating Runway...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  Record Transaction
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
