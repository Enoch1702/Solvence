import { AlertCircle, RefreshCw } from 'lucide-react';

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 mb-6 text-rose-900 shadow-xs flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-rose-800">Connection or Processing Issue</h4>
          <p className="text-sm text-rose-700 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
