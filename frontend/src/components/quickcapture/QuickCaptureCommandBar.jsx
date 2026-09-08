import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  Calendar,
  Tag,
  FileText,
  AlertCircle,
  Loader2,
  CornerDownLeft,
} from 'lucide-react';
import api from '../../services/api';
import { parseQuickCapturePreview } from '../../utils/quickCaptureLexer';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';

export function QuickCaptureCommandBar({ isOpen, onClose, onSuccess }) {
  const [input, setInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Fetch available categories for parsing preview
  useEffect(() => {
    if (isOpen) {
      api.getCategories()
        .then((data) => setCategories(data || []))
        .catch(() => {});
      setError('');
    }
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Escape to close, Enter to submit)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Parse preview in real-time
  const preview = useMemo(() => {
    return parseQuickCapturePreview(input, categories);
  }, [input, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const created = await api.quickCapture(input.trim());
      setInput('');
      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record transaction via Quick Capture.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExampleClick = (example) => {
    setInput(example);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick Capture Command Bar"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-framer-xl overflow-hidden animate-modal-glide flex flex-col">
        {/* Command Input Header */}
        <form onSubmit={handleSubmit} className="relative flex items-center px-4 py-3.5 border-b border-[var(--border-subtle)]">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mr-2.5 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type command e.g. 450 lunch food yesterday..."
            disabled={isSubmitting}
            className="flex-1 bg-transparent border-0 text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden"
          />

          {input && (
            <button
              type="button"
              onClick={() => setInput('')}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] mr-1 cursor-pointer transition-colors"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-1.5 py-0.5 rounded-md text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors"
          >
            ESC
          </button>
        </form>

        {/* Error Banner */}
        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Live Parsing Preview Panel */}
        <div className="p-4 space-y-3 bg-[var(--bg-card-subtle)]/40">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            <span>Deterministic Parsing Preview</span>
            {preview.isReady && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold normal-case">
                <CheckCircle2 className="w-3 h-3" />
                <span>Ready to record</span>
              </span>
            )}
          </div>

          {/* Parsed Fields Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Amount */}
            <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                <span>Amount</span>
              </span>
              <p
                className={`font-bold font-display-num text-sm truncate ${
                  preview.amount
                    ? preview.type === 'INCOME'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] font-normal italic'
                }`}
              >
                {preview.amount ? formatCurrency(preview.amount) : 'Not detected'}
              </p>
            </div>

            {/* Type */}
            <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] text-[var(--text-muted)]">Type</span>
              <div>
                <span
                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    preview.type === 'INCOME'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {preview.type === 'INCOME' ? '+ Income' : '- Expense'}
                </span>
              </div>
            </div>

            {/* Category */}
            <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />
                <span>Category</span>
              </span>
              <p className="font-semibold truncate">
                {preview.category ? (
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {preview.category.name}
                  </span>
                ) : (
                  <span className="text-[var(--text-muted)] font-normal italic">
                    Not detected
                  </span>
                )}
              </p>
            </div>

            {/* Date */}
            <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                <span>Date</span>
              </span>
              <p className="font-semibold text-[var(--text-primary)] truncate">
                {preview.dateLabel} ({formatDate(preview.transactionDate)})
              </p>
            </div>
          </div>

          {/* Description line */}
          <div className="px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-between text-xs gap-3">
            <span className="text-[10px] text-[var(--text-muted)] shrink-0 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>Description:</span>
            </span>
            <span className="font-medium text-[var(--text-primary)] truncate text-right">
              {preview.description || (
                <span className="text-[var(--text-muted)] italic">
                  Will use category name
                </span>
              )}
            </span>
          </div>

          {/* Quick Examples when input is empty */}
          {!input && (
            <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] space-y-1.5">
              <span>Quick templates (click to fill):</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '450 lunch food yesterday',
                  '1,500 rent today',
                  '120 metro transport',
                  'income 50000 salary today',
                ].map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => handleExampleClick(ex)}
                    className="px-2 py-0.5 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-between">
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] font-mono text-[10px]">
                ↵
              </kbd>{' '}
              Record
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] font-mono text-[10px]">
                Esc
              </kbd>{' '}
              Cancel
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim() || isSubmitting}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                preview.isReady && !isSubmitting
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-framer-xs'
                  : 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)] cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <span>Record</span>
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
