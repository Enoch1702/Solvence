import { CurrencyDisplay } from '../common/CurrencyDisplay';

export function MetricCard({
  title,
  subtitle,
  amount,
  isCurrency = true,
  unit,
  icon: Icon,
  badgeText,
  badgeVariant = 'neutral',
  helperText,
}) {
  const badgeStyles = {
    neutral: 'bg-[var(--bg-card-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
  };

  return (
    <div className="saas-card saas-card-hover p-5 sm:p-6 flex flex-col justify-between group shadow-framer-xs">
      <div>
        {/* Top Card Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase truncate">
            {title}
          </span>
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
              <Icon className="w-3.5 h-3.5 stroke-[2]" />
            </div>
          )}
        </div>

        {/* Main Value Display */}
        <div className="my-2">
          {isCurrency ? (
            <CurrencyDisplay
              amount={amount}
              size="2xl"
              className="text-[var(--text-primary)]"
            />
          ) : (
            <div className="flex items-baseline gap-1.5 font-display-num">
              <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
                {amount}
              </span>
              {unit && (
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  {unit}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Badge / Chip */}
        {badgeText && (
          <div className="mt-2.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                badgeStyles[badgeVariant] || badgeStyles.neutral
              }`}
            >
              {badgeText}
            </span>
          </div>
        )}
      </div>

      {/* Helper Subtitle */}
      {(subtitle || helperText) && (
        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
          <p className="text-[11px] text-[var(--text-muted)] truncate">
            {helperText || subtitle}
          </p>
        </div>
      )}
    </div>
  );
}
