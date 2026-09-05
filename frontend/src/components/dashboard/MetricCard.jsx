import { AnimatedNumber } from '../common/AnimatedNumber';

export function MetricCard({
  title,
  amount,
  numericValue,
  formatFn,
  subtitle,
  icon: Icon,
  variant = 'indigo', // 'emerald' | 'amber' | 'indigo' | 'rose' | 'slate' | 'violet'
  badge,
  badgeVariant,
}) {
  const variantStyles = {
    emerald: {
      border: 'border-emerald-200/70 hover:border-emerald-300',
      iconBg: 'bg-emerald-50 text-emerald-600',
      text: 'text-emerald-700',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    },
    amber: {
      border: 'border-amber-200/70 hover:border-amber-300',
      iconBg: 'bg-amber-50 text-amber-600',
      text: 'text-amber-700',
      badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
    },
    indigo: {
      border: 'border-indigo-200/70 hover:border-indigo-300',
      iconBg: 'bg-indigo-50 text-indigo-600',
      text: 'text-indigo-700',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    },
    rose: {
      border: 'border-rose-200/70 hover:border-rose-300',
      iconBg: 'bg-rose-50 text-rose-600',
      text: 'text-rose-700',
      badge: 'bg-rose-50 text-rose-700 border-rose-200/80',
    },
    violet: {
      border: 'border-violet-200/70 hover:border-violet-300',
      iconBg: 'bg-violet-50 text-violet-600',
      text: 'text-violet-700',
      badge: 'bg-violet-50 text-violet-700 border-violet-200/80',
    },
    slate: {
      border: 'border-stone-200/80 hover:border-stone-300',
      iconBg: 'bg-stone-100 text-stone-700',
      text: 'text-stone-900',
      badge: 'bg-stone-100 text-stone-700 border-stone-200',
    },
  };

  const style = variantStyles[variant] || variantStyles.indigo;
  const badgeStyle = badgeVariant ? variantStyles[badgeVariant]?.badge : style.badge;

  return (
    <div
      className={`group relative bg-white rounded-2xl p-5 sm:p-6 border ${style.border} shadow-framer-xs hover:shadow-framer-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
            {title}
          </span>
          {Icon && (
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${style.iconBg}`}
            >
              <Icon className="w-4 h-4 stroke-[2.2]" />
            </div>
          )}
        </div>

        {/* Display Number */}
        <div className="flex flex-wrap items-baseline gap-2 mb-1.5">
          <span className={`text-2xl sm:text-3xl font-extrabold font-display-num tracking-tight ${style.text}`}>
            {numericValue !== undefined ? (
              <AnimatedNumber value={numericValue} formatFn={formatFn} />
            ) : (
              amount
            )}
          </span>
          {badge && (
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${badgeStyle}`}
            >
              {badge}
            </span>
          )}
        </div>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-stone-500 font-medium mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
