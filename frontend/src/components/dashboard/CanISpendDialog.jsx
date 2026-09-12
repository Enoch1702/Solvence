import { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Activity,
  Info,
} from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currency';

export function CanISpendDialog({ isOpen, onClose }) {
  const [amount, setAmount] = useState('');
  const [evaluatedAmount, setEvaluatedAmount] = useState(null);
  const [result, setResult] = useState(null);
  const [spendingPace, setSpendingPace] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const inputRef = useRef(null);

  // Focus input on open and reset state on close
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      // Pre-fetch spending pace for context
      api.getSpendingPace()
        .then((data) => setSpendingPace(data))
        .catch(() => {});
    } else {
      setAmount('');
      setEvaluatedAmount(null);
      setResult(null);
      setSpendingPace(null);
      setError(null);
      setValidationError('');
      setShowDetails(false);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Stale detection: if amount changes after evaluation
  const isStale =
    result !== null &&
    evaluatedAmount !== null &&
    amount.trim() !== evaluatedAmount.trim();

  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val);
    setValidationError('');
    setError(null);
  };

  const handleEvaluate = async (e) => {
    if (e) e.preventDefault();
    setValidationError('');
    setError(null);

    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setValidationError('Enter an amount greater than zero.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.evaluateSpend(parsed);
      setResult(data);
      setEvaluatedAmount(amount);
    } catch (err) {
      setError(err.message || 'Failed to evaluate spend decision.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Decision state colors & icons
  const decisionConfig = {
    SAFE: {
      label: 'SAFE',
      sublabel: 'Fits within daily safe capacity',
      icon: CheckCircle2,
      borderClass: 'border-emerald-500/30',
      bgClass: 'bg-emerald-500/10',
      badgeClass: 'bg-emerald-500 text-white',
      textClass: 'text-emerald-600 dark:text-emerald-400',
    },
    CAUTION: {
      label: 'CAUTION',
      sublabel: 'Exceeds today’s safe daily amount, but covered by spending money',
      icon: AlertTriangle,
      borderClass: 'border-amber-500/30',
      bgClass: 'bg-amber-500/10',
      badgeClass: 'bg-amber-500 text-white',
      textClass: 'text-amber-600 dark:text-amber-400',
    },
    NOT_SAFE: {
      label: 'NOT SAFE',
      sublabel: 'Would create a deficit after protected bills',
      icon: AlertOctagon,
      borderClass: 'border-rose-500/30',
      bgClass: 'bg-rose-500/10',
      badgeClass: 'bg-rose-500 text-white',
      textClass: 'text-rose-600 dark:text-rose-400',
    },
  };

  const currentConfig = result?.decision ? decisionConfig[result.decision] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-modal-backdrop"
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="spend-decision-title"
        aria-describedby="spend-decision-desc"
        onClick={(e) => e.stopPropagation()}
        className="saas-glass-card relative w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 z-10 animate-modal-glide border border-[var(--border-subtle)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <HelpCircle className="w-4 h-4" />
              </span>
              <h3
                id="spend-decision-title"
                className="text-base font-semibold text-[var(--text-primary)]"
              >
                Can I Safely Spend This?
              </h3>
            </div>
            <p id="spend-decision-desc" className="text-xs text-[var(--text-secondary)] mt-1">
              Deterministic evaluation against your current Spending Money and remaining pay-cycle runway.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] active:scale-90 transition-all duration-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Input Form */}
        <form onSubmit={handleEvaluate} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="spend-amount-input"
              className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5"
            >
              Proposed Expense Amount
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-medium text-[var(--text-muted)]">
                ₹
              </span>
              <input
                id="spend-amount-input"
                ref={inputRef}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                disabled={isLoading}
                aria-invalid={!!validationError}
                aria-describedby={validationError ? "spend-amount-error" : undefined}
                className="w-full pl-8 pr-28 py-2.5 text-lg font-bold font-display-num bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-teal-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !amount}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-semibold text-xs rounded-lg transition-all duration-200 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <span>Evaluate</span>
                )}
              </button>
            </div>
            {validationError && (
              <p id="spend-amount-error" className="text-rose-500 text-xs mt-1.5 font-medium">
                {validationError}
              </p>
            )}
            {error && (
              <p className="text-rose-500 text-xs mt-1.5 font-medium">{error}</p>
            )}
          </div>
        </form>

        {/* Stale Warning Notice */}
        {isStale && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Amount changed since last evaluation. Result is stale.</span>
            </div>
            <button
              type="button"
              onClick={handleEvaluate}
              className="font-semibold underline hover:no-underline cursor-pointer ml-2 shrink-0"
            >
              Recalculate
            </button>
          </div>
        )}

        {/* Decision Result Section (Authoritative Backend Facts) */}
        {result && (
          <div
            className={`mt-4 rounded-xl border p-4 transition-all duration-300 ${
              isStale ? 'opacity-40 grayscale-75' : 'opacity-100'
            } ${currentConfig?.borderClass} ${currentConfig?.bgClass}`}
          >
            {/* 1. Decision Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2.5">
                {currentConfig && <currentConfig.icon className={`w-5 h-5 ${currentConfig.textClass}`} />}
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${currentConfig?.badgeClass}`}>
                      {currentConfig?.label}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {formatCurrency(result.amount)}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                {result.daysRemaining} days remaining
              </span>
            </div>

            {/* 2. Decision Explanation */}
            <p className="mt-3 text-xs text-[var(--text-primary)] leading-relaxed font-medium">
              {result.message}
            </p>

            {/* 3 & 4. Impact Metrics Hierarchy */}
            <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border-subtle)]">
              {/* Spending Money Impact */}
              <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                <span className="block text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                  Spending Money
                </span>
                <div className="mt-1 flex items-center gap-1.5 text-xs flex-wrap">
                  <span className="font-semibold text-[var(--text-secondary)]">
                    {formatCurrency(result.spendingMoney)}
                  </span>
                  <ArrowRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                  <span
                    className={`font-bold font-display-num ${
                      result.hypotheticalSpendingMoney < 0
                        ? 'text-rose-500'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {formatCurrency(result.hypotheticalSpendingMoney)}
                  </span>
                </div>
                <span className="block text-[10px] text-[var(--text-muted)] mt-0.5">
                  Available after protected bills
                </span>
              </div>

              {/* Safe to Spend Today Impact */}
              <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                <span className="block text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                  Safe to Spend Today
                </span>
                <div className="mt-1 flex items-center gap-1.5 text-xs flex-wrap">
                  <span className="font-semibold text-[var(--text-secondary)]">
                    {formatCurrency(result.safeToSpendToday)}
                  </span>
                  <ArrowRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                  <span className="font-bold font-display-num text-[var(--text-primary)]">
                    {formatCurrency(result.hypotheticalSafeToSpendToday)}
                  </span>
                </div>
                <span className="block text-[10px] text-[var(--text-muted)] mt-0.5">
                  Daily capacity through cycle end
                </span>
              </div>
            </div>

            {/* 5. Labor Cost */}
            <div className="mt-3 p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-between text-xs flex-wrap gap-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span className="text-[var(--text-muted)] font-medium">Labor Cost:</span>
              </div>
              {result.laborCostHours != null ? (
                <span className="font-semibold text-[var(--text-primary)] font-display-num">
                  {result.laborCostHours} {result.laborCostHours === 1 ? 'hour' : 'hours'} of work
                </span>
              ) : (
                <span className="text-[11px] text-[var(--text-muted)] italic">
                  Unavailable (no valid hourly rate set)
                </span>
              )}
            </div>

            {/* 6. Supporting Financial Details (Progressive Disclosure) */}
            <div className="mt-3 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center justify-between w-full text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium cursor-pointer py-1"
              >
                <span>Financial context &amp; protected bills</span>
                {showDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showDetails && (
                <div className="mt-2 space-y-2 text-[11px] text-[var(--text-secondary)] bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-subtle)]">
                  <div className="flex justify-between">
                    <span>Total Balance:</span>
                    <strong className="text-[var(--text-primary)] font-display-num">
                      {formatCurrency(result.totalBalance)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Protected Bills (Committed):</span>
                    <strong className="text-amber-600 dark:text-amber-400 font-display-num">
                      {formatCurrency(result.protectedBills)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Projected Cycle-End Balance:</span>
                    <strong
                      className={`font-display-num ${
                        result.projectedCycleEndBalance < 0
                          ? 'text-rose-500'
                          : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {formatCurrency(result.projectedCycleEndBalance)}
                    </strong>
                  </div>
                  {result.isDeficit && result.deficitAmount > 0 && (
                    <div className="flex justify-between text-rose-500 font-semibold pt-1 border-t border-[var(--border-subtle)]">
                      <span>Deficit Amount:</span>
                      <span className="font-display-num">{formatCurrency(result.deficitAmount)}</span>
                    </div>
                  )}

                  {/* Conservative Estimate Disclaimer */}
                  <div className="pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] flex items-start gap-1.5 leading-relaxed">
                    <Info className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)] mt-0.5" />
                    <span>
                      Conservative estimate after currently protected bills. If no additional income or discretionary spending occurs, this is the balance remaining after protected bills.
                    </span>
                  </div>

                  {/* Spending Pace Context if available */}
                  {spendingPace && (
                    <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[var(--text-muted)]">
                          <Activity className="w-3 h-3" />
                          <span>Cycle Spending Pace</span>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            spendingPace.paceStatus === 'BELOW_PACE'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : spendingPace.paceStatus === 'ABOVE_PACE'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-zinc-500/10 text-[var(--text-secondary)]'
                          }`}
                        >
                          {spendingPace.paceStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                        {spendingPace.message}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)] flex-wrap gap-2">
          <span className="text-[11px]">
            Operates on known facts. Does not alter transactions or balance.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] font-semibold text-[var(--text-primary)] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
