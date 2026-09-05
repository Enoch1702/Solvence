import { Trash2, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { TableRowSkeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { formatCurrency, formatLifeHours } from '../../utils/currency';
import { formatDate } from '../../utils/date';

export function TransactionLedger({
  transactions,
  loading,
  onDelete,
  onNewTransaction,
  deletingId
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Transaction Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Life Hours</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return <EmptyState onAction={onNewTransaction} />;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Transaction Ledger</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {transactions.length} record{transactions.length === 1 ? '' : 's'} in current session
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="py-3 px-4 font-medium">Date</th>
              <th className="py-3 px-4 font-medium">Description</th>
              <th className="py-3 px-4 font-medium">Category</th>
              <th className="py-3 px-4 font-medium">Type</th>
              <th className="py-3 px-4 text-right font-medium">Amount</th>
              <th className="py-3 px-4 text-center font-medium">Life Hours</th>
              <th className="py-3 px-4 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {transactions.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              const lifeHourText = formatLifeHours(tx.lifeHours);

              return (
                <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Date */}
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">
                    {formatDate(tx.transactionDate)}
                  </td>

                  {/* Description */}
                  <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs truncate">
                    {tx.description || (
                      <span className="text-slate-400 italic">No description</span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                      {tx.categoryName}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {isIncome ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        <ArrowUpRight className="w-3 h-3" />
                        Income
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                        <ArrowDownRight className="w-3 h-3" />
                        Expense
                      </span>
                    )}
                  </td>

                  {/* Amount (Tabular aligned) */}
                  <td className="py-3.5 px-4 text-right font-mono font-semibold whitespace-nowrap">
                    <span className={isIncome ? 'text-emerald-600' : 'text-slate-900'}>
                      {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>
                  </td>

                  {/* Life Hours */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {lifeHourText ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        {lifeHourText}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono text-xs">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onDelete(tx.id)}
                      disabled={deletingId === tx.id}
                      aria-label={`Delete transaction ${tx.description || tx.id}`}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:ring-2 focus:ring-rose-400/20 focus:outline-hidden disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
