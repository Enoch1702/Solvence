/**
 * Formats a monetary number into INR standard currency format: ₹XX,XXX.XX
 */
export function formatCurrency(amount, options = {}) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const showFraction = options.showFraction !== false;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showFraction ? 2 : 0,
    maximumFractionDigits: showFraction ? 2 : 0,
  }).format(num);
}

/**
 * Formats a life-hour value into a human readable tag: "2.5h"
 */
export function formatLifeHours(hours) {
  if (hours === null || hours === undefined || isNaN(hours)) {
    return null;
  }
  const num = typeof hours === 'string' ? parseFloat(hours) : hours;
  return `${num.toFixed(1)}h`;
}
