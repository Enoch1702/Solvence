import { useState } from 'react';
import {
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Utensils,
  Car,
  Home,
  Briefcase,
  Tv,
  Zap,
  Tag,
  Search
} from 'lucide-react';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { TableRowSkeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { formatLifeHours } from '../../utils/currency';
import { formatDate } from '../../utils/date';

// Category color dot and styling map (Copilot jewel tones)
const categoryConfig = {
  food: { icon: Utensils, dot: 'bg-amber-500', pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  transport: { icon: Car, dot: 'bg-sky-500', pill: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  rent: { icon: Home, dot: 'bg-violet-500', pill: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  salary: { icon: Briefcase, dot: 'bg-emerald-500', pill: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  entertainment: { icon: Tv, dot: 'bg-pink-500', pill: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
  utilities: { icon: Zap, dot: 'bg-indigo-500', pill: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
};

export function TransactionLedger({
  transactions = [],
  loading,
  onDelete,
  onNewTransaction,
  deletingId,
}) {
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <div className="saas-card bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden shadow-framer-xs">
        <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-32 animate-pulse" />
        </div>
        <div className="divide-y divide-[var(--border-subtle)] p-4 space-y-3">
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return <EmptyState onAction={onNewTransaction} />;
  }

  const filtered = transactions.filter((tx) => {
    const matchesType = filterType === 'ALL' || tx.type === filterType;
    const matchesSearch =
      searchTerm === '' ||
      (tx.description && tx.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.categoryName && tx.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="saas-card bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-framer-xs overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 sm:p-6 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Financial Activity Stream
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-card-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
              {transactions.length} total
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Real-time ledger events impacting reserve liquidity and life hours.
          </p>
        </div>

        {/* Filter Switch & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Filter */}
          <div className="flex items-center p-1 bg-[var(--bg-card-subtle)] rounded-xl border border-[var(--border-subtle)] text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] font-semibold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterType('INCOME')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filterType === 'INCOME'
                  ? 'bg-[var(--bg-card)] text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Inflows
            </button>
            <button
              type="button"
              onClick={() => setFilterType('EXPENSE')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filterType === 'EXPENSE'
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] font-semibold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Outflows
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-indigo-500 w-32 sm:w-44 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-card-subtle)]/50 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <th className="py-3 px-4 sm:px-6">Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Life Hours</th>
              <th className="py-3 px-4 sm:px-6 text-right">Amount</th>
              <th className="py-3 px-4 text-center w-16">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-xs text-[var(--text-muted)]">
                  No matching transactions found.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => {
                const isIncome = tx.type === 'INCOME';
                const catLower = (tx.categoryName || '').toLowerCase();
                const catInfo = categoryConfig[catLower] || {
                  icon: Tag,
                  dot: 'bg-zinc-400',
                  pill: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
                };
                const CatIcon = catInfo.icon;
                const isDeleting = deletingId === tx.id;

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-[var(--bg-card-hover)] transition-colors group"
                  >
                    {/* Description & Type Icon */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)]'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 stroke-[2.2]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-[var(--text-primary)] block truncate">
                            {tx.description || (isIncome ? 'Income credit' : 'Expense debit')}
                          </span>
                          {tx.isRecurring && (
                            <span className="inline-block text-[9px] font-semibold text-amber-500 mt-0.5">
                              Recurring Bill
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold ${catInfo.pill}`}
                      >
                        <CatIcon className="w-3 h-3 stroke-[2]" />
                        <span>{tx.categoryName || 'General'}</span>
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-[var(--text-muted)] font-display-num">
                      {formatDate(tx.transactionDate)}
                    </td>

                    {/* Life Hours Impact */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-display-num">
                      {tx.lifeHoursImpact ? (
                        <span
                          className={`text-xs font-medium ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatLifeHours(tx.lifeHoursImpact)}
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-baseline font-display-num">
                        <span
                          className={`text-xs font-semibold mr-0.5 ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                        </span>
                        <CurrencyDisplay
                          amount={tx.amount}
                          size="sm"
                          className={
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-[var(--text-primary)]'
                          }
                        />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onDelete(tx.id)}
                        disabled={isDeleting}
                        title="Remove transaction"
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer focus:opacity-100"
                      >
                        {isDeleting ? (
                          <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
