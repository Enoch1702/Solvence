/**
 * Precision Currency Display Component
 * Renders proportional INR values with subtly scaled symbols and fractional digits,
 * matching Copilot Money and modern luxury fintech interfaces.
 */
export function CurrencyDisplay({
  amount = 0,
  size = 'base',
  showFraction = true,
  className = '',
  symbolClassName = '',
  integerClassName = '',
  fractionClassName = '',
}) {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : (amount || 0);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Split into integer and fractional components using Indian locale
  const parts = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: showFraction ? 2 : 0,
    maximumFractionDigits: showFraction ? 2 : 0,
  }).formatToParts(absNum);

  let integerStr = '0';
  let decimalStr = '00';

  parts.forEach((part) => {
    if (part.type === 'integer' || part.type === 'group') {
      if (integerStr === '0') integerStr = part.value;
      else integerStr += part.value;
    } else if (part.type === 'fraction') {
      decimalStr = part.value;
    }
  });

  // Size hierarchy
  const sizeStyles = {
    hero: 'text-4xl sm:text-5xl lg:text-6xl tracking-tight font-bold',
    '3xl': 'text-3xl sm:text-4xl tracking-tight font-bold',
    '2xl': 'text-2xl sm:text-3xl tracking-tight font-semibold',
    xl: 'text-xl sm:text-2xl tracking-tight font-semibold',
    lg: 'text-lg sm:text-xl font-semibold',
    base: 'text-base font-semibold',
    sm: 'text-sm font-semibold',
    xs: 'text-xs font-semibold',
  };

  const selectedSize = sizeStyles[size] || sizeStyles.base;

  return (
    <span
      className={`inline-flex items-baseline font-display-num tabular-nums leading-none ${selectedSize} ${className}`}
    >
      {isNegative && <span className="mr-0.5 text-rose-500 font-semibold">-</span>}
      <span
        className={`text-[0.72em] font-normal text-zinc-400 dark:text-zinc-500 mr-1 select-none ${symbolClassName}`}
      >
        ₹
      </span>
      <span className={`font-display-num ${integerClassName}`}>
        {integerStr}
      </span>
      {showFraction && (
        <span
          className={`text-[0.78em] font-medium opacity-60 ml-0.5 ${fractionClassName}`}
        >
          .{decimalStr}
        </span>
      )}
    </span>
  );
}
