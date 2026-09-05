import { ReceiptText, Plus } from 'lucide-react';

export function EmptyState({ onAction }) {
  return (
    <div className="saas-card text-center py-16 px-6 border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-framer-xs">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 mb-4">
        <ReceiptText className="w-6 h-6 stroke-[1.8]" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">
        No financial events recorded
      </h3>
      <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-6 leading-relaxed">
        Record your first income or expense to activate real-time forward runway pacing and unencumbered reserve calculations.
      </p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-xl shadow-framer-xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Record First Transaction</span>
        </button>
      )}
    </div>
  );
}
