import { ReceiptText, PlusCircle } from 'lucide-react';

export function EmptyState({ onAction }) {
  return (
    <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-4">
        <ReceiptText className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">No transactions yet</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
        Record your first income or expense to activate real-time cashflow calculations and track your safe daily spend.
      </p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
        >
          <PlusCircle className="w-4 h-4" />
          Record First Transaction
        </button>
      )}
    </div>
  );
}
