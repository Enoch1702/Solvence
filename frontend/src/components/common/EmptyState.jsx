import { ReceiptText, PlusCircle } from 'lucide-react';

export function EmptyState({ onAction }) {
  return (
    <div className="text-center py-16 px-6 border border-dashed border-stone-200 rounded-3xl bg-white/70 shadow-framer-xs">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-xs">
        <ReceiptText className="w-7 h-7 stroke-[1.8]" />
      </div>
      <h3 className="text-base font-semibold text-stone-900 mb-1.5">
        No transactions recorded yet
      </h3>
      <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mb-6">
        Record your first income or expense to activate real-time cashflow runway projections and track your safe daily spending limit.
      </p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-framer-xs hover:shadow-framer-sm transition-all focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
        >
          <PlusCircle className="w-4 h-4" />
          Record First Transaction
        </button>
      )}
    </div>
  );
}
