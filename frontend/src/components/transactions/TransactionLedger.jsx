import { useState } from 'react';
import {
  Trash2,
  Clock,
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
import { TableRowSkeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { formatCurrency, formatLifeHours } from '../../utils/currency';
import { formatDate } from '../../utils/date';

// Map categories to dedicated icons and warm tint colors
const categoryConfig = {
  food: { icon: Utensils, bg: 'bg-orange-50 text-orange-600 border-orange-200/70' },
  transport: { icon: Car, bg: 'bg-blue-50 text-blue-600 border-blue-200/70' },
  rent: { icon: Home, bg: 'bg-purple-50 text-purple-600 border-purple-200/70' },
  salary: { icon: Briefcase, bg: 'bg-emerald-50 text-emerald-600 border-emerald-200/70' },
  entertainment: { icon: Tv, bg: 'bg-pink-50 text-pink-600 border-pink-200/70' },
  utilities: { icon: Zap, bg: 'bg-amber-50 text-amber-600 border-amber-200/70' },
};

export function TransactionLedger({
  transactions = [],
  loading,
  onDelete,
  onNewTransaction,
  deletingId,
}) {
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'EXPENSE' | 'INCOME'
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-framer-xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="h-4 bg-stone-200 rounded w-32 animate-pulse" />
        </div>
        <div className="divide-y divide-stone-100 p-4 space-y-3">
          <TableRowSkeleton />
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

  // Filter transactions based on type and search query
  const filtered = transactions.filter((tx) => {
    const matchesType = filterType === 'ALL' || tx.type === filterType;
    const matchesSearch =
      searchTerm === '' ||
      (tx.description && tx.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.categoryName && tx.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-framer-xs hover:shadow-framer-md transition-all duration-200 overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 sm:p-6 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-stone-900">
              Financial Activity Feed
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
              {transactions.length} record{transactions.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time transaction stream impacting cashflow and life hours.
          </p>
        </div>

        {/* Filter Switch & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Filter */}
          <div className="flex items-center p-1 bg-stone-100 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'ALL'
                  ? 'bg-white text-stone-900 font-semibold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterType('EXPENSE')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'EXPENSE'
                  ? 'bg-white text-rose-700 font-semibold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Expenses
            </button>
            <button
              type="button"
              onClick={() => setFilterType('INCOME')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'INCOME'
                  ? 'bg-white text-emerald-700 font-semibold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Inflows
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-stone-50 hover:bg-stone-100/80 focus:bg-white border border-stone-200/80 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors w-36 sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* Activity Feed Rows */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-stone-400">
          No transactions match current filters.
        </div>
      ) : (
        <div className="divide-y divide-stone-100">
          {filtered.map((tx) => {
            const isIncome = tx.type === 'INCOME';
            const slug = (tx.categorySlug || tx.categoryName || '').toLowerCase();
            const config = categoryConfig[slug] || {
              icon: Tag,
              bg: 'bg-stone-100 text-stone-600 border-stone-200',
            };
            const Icon = config.icon;
            const lifeHoursFormatted = formatLifeHours(tx.lifeHours);

            return (
              <div
                key={tx.id}
                className={`group flex items-center justify-between p-4 sm:px-6 hover:bg-stone-50/70 transition-all duration-150 ${
                  deletingId === tx.id ? 'opacity-40 pointer-events-none' : ''
                }`}
              >
                {/* Left: Category Icon + Details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${config.bg} transition-transform group-hover:scale-105`}
                  >
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-900 truncate">
                        {tx.description || tx.categoryName}
                      </span>
                      {tx.description && (
                        <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                          {tx.categoryName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                      <span className="font-mono text-[11px]">{formatDate(tx.transactionDate)}</span>
                      {tx.type === 'INCOME' ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium text-[11px]">
                          <ArrowUpRight className="w-3 h-3" /> Inflow
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-rose-600 font-medium text-[11px]">
                          <ArrowDownRight className="w-3 h-3" /> Outflow
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount, Life Hours & Actions */}
                <div className="flex items-center gap-4 sm:gap-6 shrink-0 ml-4">
                  {/* Life Hours Badge (for expenses) */}
                  <div className="hidden md:flex flex-col items-end">
                    {lifeHoursFormatted ? (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-display-num font-semibold bg-violet-50 text-violet-700 border border-violet-200/60"
                        title="Life hours spent based on hourly wage"
                      >
                        <Clock className="w-3 h-3 text-violet-500" />
                        {lifeHoursFormatted}
                      </span>
                    ) : (
                      <span className="text-stone-300 font-display-num text-xs">—</span>
                    )}
                  </div>

                  {/* Formatted Amount */}
                  <div className="text-right">
                    <span
                      className={`text-sm sm:text-base font-extrabold font-display-num tracking-tight ${
                        isIncome ? 'text-emerald-600' : 'text-stone-900'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </span>
                    {lifeHoursFormatted && (
                      <span className="block md:hidden text-[10px] font-display-num text-violet-600">
                        {lifeHoursFormatted} work
                      </span>
                    )}
                  </div>

                  {/* Delete Action Button */}
                  <button
                    type="button"
                    onClick={() => onDelete(tx.id)}
                    disabled={deletingId === tx.id}
                    aria-label={`Delete transaction ${tx.description || tx.id}`}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors focus:ring-2 focus:ring-rose-500/20 focus:outline-hidden disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
