import { useState } from 'react';
import {
  Compass,
  LayoutDashboard,
  TrendingUp,
  ReceiptText,
  CalendarClock,
  BarChart3,
  Plus,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

export function AppShell({
  children,
  onNewTransaction,
  cycleInfo,
  currentView = 'dashboard',
  onViewChange,
  onRefresh,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'runway', label: 'Runway Analysis', icon: TrendingUp, badge: 'Live' },
    { id: 'transactions', label: 'Transactions Ledger', icon: ReceiptText, badge: null },
    { id: 'committed', label: 'Committed Obligations', icon: CalendarClock, badge: null },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: 'Phase 2', disabled: true },
  ];

  const handleNavClick = (id, disabled) => {
    if (disabled) return;
    if (onViewChange) onViewChange(id);
    setMobileMenuOpen(false);
  };

  const getBreadcrumbTitle = () => {
    switch (currentView) {
      case 'runway':
        return 'Runway & Cashflow Trajectory';
      case 'transactions':
        return 'Financial Activity Ledger';
      case 'committed':
        return 'Committed Obligations & Protection';
      case 'dashboard':
      default:
        return 'Executive Financial Overview';
    }
  };

  return (
    <div className="h-screen w-screen flex bg-[#fbfbfa] text-stone-900 overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* ========================================================================= */}
      {/* 1. DESKTOP PERSISTENT SAAS SIDEBAR */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex w-68 h-full bg-white border-r border-stone-200/80 flex-col justify-between shrink-0 shadow-framer-xs z-20">
        <div className="p-5 flex flex-col flex-1 overflow-y-auto">
          {/* Workspace Branding Header */}
          <div className="flex items-center gap-3 pb-5 border-b border-stone-100">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-framer-sm shrink-0">
              <Compass className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-stone-900 font-sans truncate">
                  SOLVENCE
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200/60">
                  OS
                </span>
              </div>
              <p className="text-[11px] text-stone-400 truncate">
                Personal Financial Workspace
              </p>
            </div>
          </div>

          {/* Quick Action Button in Sidebar */}
          <div className="my-5">
            <button
              type="button"
              onClick={onNewTransaction}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-framer-xs hover:shadow-framer-sm transition-all focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Record Activity</span>
            </button>
          </div>

          {/* Nav Group: Financial Core */}
          <div className="space-y-1">
            <span className="block px-3 text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-2">
              Financial Operating System
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => handleNavClick(item.id, item.disabled)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-xl transition-all ${
                    item.disabled
                      ? 'text-stone-400 cursor-not-allowed opacity-60'
                      : isActive
                      ? 'bg-indigo-50/90 text-indigo-700 font-semibold shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 stroke-[2] ${
                        isActive ? 'text-indigo-600' : 'text-stone-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${
                        item.disabled
                          ? 'bg-stone-100 text-stone-500'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Sidebar Footer */}
        <div className="p-4 border-t border-stone-100 space-y-3 bg-stone-50/50">
          {/* Pay Cycle Mini Card */}
          {cycleInfo && (
            <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-framer-xs">
              <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Active Cycle
                </span>
                <span className="text-emerald-700 text-[10px] font-bold">25d left</span>
              </div>
              <p className="text-[11px] font-mono font-medium text-stone-600">
                {cycleInfo}
              </p>
            </div>
          )}

          {/* User Profile & Engine Status */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center shrink-0">
                1
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-stone-800 truncate">
                  User #1
                </span>
                <span className="block text-[10px] text-stone-400">
                  Rate: ₹300/hr
                </span>
              </div>
            </div>

            <div
              className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70"
              title="PostgreSQL 18 Live Engine Verified"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
              <span>Live</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN VIEWPORT (TOP BAR + DYNAMIC STAGE) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header Action Bar */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 z-10 shadow-framer-xs">
          {/* Left: Mobile Toggle + Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open sidebar menu"
              className="lg:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <span className="font-semibold text-stone-800 font-sans hidden sm:inline">
                Solvence
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 hidden sm:inline" />
              <span className="font-medium text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded-md border border-indigo-100">
                {getBreadcrumbTitle()}
              </span>
            </div>
          </div>

          {/* Right: Engine Indicator & Quick Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* PostgreSQL Engine Heartbeat */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-xl text-xs font-medium text-stone-600 border border-stone-200/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-mono text-[11px]">PostgreSQL 18 • Healthy</span>
            </div>

            {/* Refresh Button */}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                title="Refresh financial data"
                className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors border border-stone-200/80 shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {/* Top Right "Record Transaction" CTA */}
            <button
              type="button"
              onClick={onNewTransaction}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-framer-xs hover:shadow-framer-sm transition-all focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Record Activity</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Stage */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#fbfbfa]">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE SLIDE-OVER DRAWER */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex lg:hidden bg-stone-900/40 backdrop-blur-xs animate-fade-in-up"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <div className="w-72 max-w-[80vw] h-full bg-white flex flex-col justify-between p-5 shadow-framer-lg border-r border-stone-200">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                    <Compass className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="font-bold text-sm tracking-tight text-stone-900">
                    SOLVENCE OS
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile CTA */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNewTransaction();
                }}
                className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-framer-xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Record Activity
              </button>

              {/* Navigation Items */}
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={item.disabled}
                      onClick={() => handleNavClick(item.id, item.disabled)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-xl transition-all ${
                        item.disabled
                          ? 'text-stone-400 cursor-not-allowed opacity-60'
                          : isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-stone-700 hover:bg-stone-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="pt-4 border-t border-stone-100 text-xs text-stone-500">
              <p className="font-semibold text-stone-800">User #1</p>
              <p className="text-[11px] text-stone-400 font-mono">PostgreSQL 18 • React 19</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) on Mobile */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <button
          type="button"
          onClick={onNewTransaction}
          aria-label="Add transaction"
          className="w-13 h-13 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-framer-lg active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
