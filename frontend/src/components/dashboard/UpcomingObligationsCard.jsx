import { CalendarClock, CheckCircle2, ShieldAlert } from 'lucide-react';
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
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-framer-xs hover:shadow-framer-md transition-all duration-200 p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${hasCommittedBills ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <CalendarClock className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-900">
                Committed Obligations
              </h4>
              <span className="text-[11px] text-stone-400">
                Cycle Protection Buffer
              </span>
            </div>
          </div>

          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
              hasCommittedBills
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {hasCommittedBills ? 'Active Obligations' : 'Zero Obligations'}
          </span>
        </div>

        <div className="my-3">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-stone-900">
            {formatCurrency(committedBills)}
          </span>
          <p className="text-xs text-stone-500 mt-1">
            {hasCommittedBills
              ? `Reserved to cover upcoming mandatory bills due within the next ${daysRemaining} days.`
              : 'No upcoming recurring obligations due in the remainder of this cycle.'}
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-stone-100 mt-2">
        {hasCommittedBills ? (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              This amount is quarantined from Safe Daily Spend calculations to prevent overdraft.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              100% of liquid reserve ({formatCurrency(liquidReserve)}) is unencumbered for daily safe spend.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
