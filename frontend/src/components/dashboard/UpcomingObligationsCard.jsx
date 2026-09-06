import { CalendarClock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { formatCurrency } from '../../utils/currency';

export function UpcomingObligationsCard({ runwayData }) {
  if (!runwayData) return null;

  const {
    committedBills = 0,
    liquidReserve = 0,
    daysRemaining = 0,
  } = runwayData;

  const hasCommittedBills = committedBills > 0;

  return (
    <div className="saas-glass-card saas-glass-card-hover p-5 sm:p-6 flex flex-col justify-between h-full shadow-framer-md">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs ${
              hasCommittedBills
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              <CalendarClock className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Upcoming Bills
              </h4>
              <span className="text-[11px] text-[var(--text-muted)]">
                Pay cycle bill protection
              </span>
            </div>
          </div>

          <span
            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
              hasCommittedBills
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {hasCommittedBills ? 'Active Bills' : 'No Bills Due'}
          </span>
        </div>

        <div className="my-3">
          <CurrencyDisplay
            amount={committedBills}
            size="2xl"
            className={hasCommittedBills ? 'text-amber-500' : 'text-[var(--text-primary)]'}
          />
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
            {hasCommittedBills
              ? `Amount needed to cover recurring bills scheduled before the end of this pay cycle (${daysRemaining} days remaining).`
              : 'No upcoming recurring bills due in the remainder of this pay cycle.'}
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-[var(--border-subtle)] mt-4">
        {hasCommittedBills ? (
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 shadow-xs">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              Amount needed for upcoming bills before calculating daily safe spend.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 shadow-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              All of your current balance ({formatCurrency(liquidReserve)}) is available to spend.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
