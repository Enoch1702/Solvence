export function MetricCard({
  title,
  amount,
  subtitle,
  icon: Icon,
  variant = 'indigo', // 'emerald' | 'amber' | 'indigo' | 'rose' | 'slate'
  badge,
}) {
  const variantStyles = {
    emerald: {
      border: 'border-emerald-200/80',
      iconBg: 'bg-emerald-50 text-emerald-600',
      text: 'text-emerald-700',
      tag: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    amber: {
      border: 'border-amber-200/80',
      iconBg: 'bg-amber-50 text-amber-600',
      text: 'text-amber-700',
      tag: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    indigo: {
      border: 'border-indigo-200/80',
      iconBg: 'bg-indigo-50 text-indigo-600',
      text: 'text-indigo-700',
      tag: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    rose: {
      border: 'border-rose-200/80',
      iconBg: 'bg-rose-50 text-rose-600',
      text: 'text-rose-700',
      tag: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    slate: {
      border: 'border-slate-200/80',
      iconBg: 'bg-slate-50 text-slate-600',
      text: 'text-slate-800',
      tag: 'bg-slate-50 text-slate-700 border-slate-200',
    },
  };

  const style = variantStyles[variant] || variantStyles.indigo;

  return (
    <div className={`bg-white rounded-xl p-6 border ${style.border} shadow-xs hover:shadow-sm transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          {title}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1.5">
        <span className={`text-3xl font-bold font-mono tracking-tight ${style.text}`}>
          {amount}
        </span>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${style.tag}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}
