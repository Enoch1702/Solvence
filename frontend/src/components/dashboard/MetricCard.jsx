import { CurrencyDisplay } from '../common/CurrencyDisplay';

const variantCardClass = {
  blue: 'saas-card-blue',
  amber: 'saas-card-amber',
  violet: 'saas-card-violet',
  orange: 'saas-card-orange',
  neutral: 'saas-glass-card saas-glass-card-hover',
};

const variantIconStyle = {
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 group-hover:bg-blue-500/20 group-hover:border-blue-500/40',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 group-hover:bg-amber-500/20 group-hover:border-amber-500/40',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 group-hover:bg-violet-500/20 group-hover:border-violet-500/40',
  orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 group-hover:bg-orange-500/20 group-hover:border-orange-500/40',
  neutral: 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)] group-hover:text-[var(--text-primary)]',
};

const variantDotStyle = {
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  orange: 'bg-orange-500',
  neutral: 'bg-slate-400',
};

const badgeStyles = {
  neutral: 'bg-[var(--bg-card-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
  indigo: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20',
};

export function MetricCard({
  title,
  subtitle,
  amount,
  isCurrency = true,
  unit,
  icon: Icon,
  badgeText,
  badgeVariant = 'neutral',
  variant = 'neutral',
  helperText,
}) {
  const cardClass = variantCardClass[variant] || variantCardClass.neutral;
  const iconClass = variantIconStyle[variant] || variantIconStyle.neutral;
  const dotClass = variantDotStyle[variant] || variantDotStyle.neutral;

  return (
    <div className={`${cardClass} p-5 sm:p-6 flex flex-col justify-between group shadow-framer-sm`}>
      <div>
        {/* Top Card Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
            <span className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase truncate">
              {title}
            </span>
          </div>
          {Icon && (
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-300 shadow-xs ${iconClass}`}>
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
              className="text-[var(--text-primary)] font-bold"
            />
          ) : (
            <div className="flex items-baseline gap-1.5 font-display-num">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                {amount}
              </span>
              {unit && (
                <span className="text-xs font-semibold text-[var(--text-muted)]">
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
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold shadow-2xs ${
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
