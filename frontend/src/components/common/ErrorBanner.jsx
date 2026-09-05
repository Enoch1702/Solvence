import { AlertCircle, RefreshCw } from 'lucide-react';

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="saas-card border border-rose-500/20 bg-rose-500/10 p-4 mb-6 text-rose-600 dark:text-rose-400 shadow-xs flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-semibold text-rose-500">Connection or Processing Issue</h4>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
