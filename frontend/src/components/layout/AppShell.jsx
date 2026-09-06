import { useState, useEffect } from 'react';
import {
  Compass,
  LayoutDashboard,
  TrendingUp,
  ReceiptText,
  CalendarClock,
  Plus,
  Calendar,
  RefreshCw,
  Menu,
  X,
  Search,
  Sun,
  Moon,
  Database
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
  const [isDark, setIsDark] = useState(true);

  // Initialize theme from localStorage or document default
  useEffect(() => {
    const savedTheme = localStorage.getItem('solvence_theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('solvence_theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('solvence_theme', 'dark');
      setIsDark(true);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'runway', label: 'Pay Cycle Planner', icon: TrendingUp },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'committed', label: 'Bills & Subscriptions', icon: CalendarClock },
  ];

  const handleNavClick = (id) => {
    if (onViewChange) onViewChange(id);
    setMobileMenuOpen(false);
  };

  const getBreadcrumbTitle = () => {
    switch (currentView) {
      case 'runway':
        return 'Pay Cycle Planner';
      case 'transactions':
        return 'Transactions';
      case 'committed':
        return 'Bills & Subscriptions';
      case 'dashboard':
      default:
        return 'Overview';
    }
  };

  return (
    <div className="relative h-screen w-screen flex bg-[var(--bg-canvas)] text-[var(--text-primary)] overflow-hidden font-sans">
      {/* ========================================================================= */}
      {/* AMBIENT RADIAL MESH GLOW (Enables genuine frosted glass refraction) */}
      {/* ========================================================================= */}
      <div className="fixed -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-indigo-500/15 dark:bg-indigo-500/20 blur-[130px] pointer-events-none z-0" />
      <div className="fixed top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-violet-500/10 dark:bg-violet-500/15 blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 left-1/3 w-[520px] h-[520px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/12 blur-[130px] pointer-events-none z-0" />

      {/* ========================================================================= */}
      {/* 1. DESKTOP SAAS SIDEBAR (Frosted Translucent Glass Layer) */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex w-64 h-full saas-glass-card rounded-none border-y-0 border-l-0 border-r border-[var(--border-subtle)] flex-col justify-between shrink-0 z-20">
        <div className="p-4 sm:p-5 flex flex-col flex-1 overflow-y-auto">
          {/* Workspace Switcher Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-subtle)]">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xs shrink-0">
              <Compass className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)] truncate">
                  Solvence
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                Personal Financial System
              </p>
            </div>
          </div>

          {/* Primary Quick Action */}
          <div className="my-4">
            <button
              type="button"
              onClick={onNewTransaction}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-xl shadow-framer-xs hover:shadow-framer-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Record Transaction</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <span className="block px-2 text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-2">
              Navigation
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] text-left cursor-pointer ${
                    isActive
                      ? 'bg-indigo-500/10 dark:bg-white/[0.09] text-indigo-600 dark:text-white font-semibold shadow-xs'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] hover:translate-x-1'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 stroke-[2] transition-colors duration-200 ${
                      isActive
                        ? 'text-indigo-600 dark:text-white'
                        : 'text-[var(--text-muted)]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Workspace Footer */}
        <div className="p-4 border-t border-[var(--border-subtle)] space-y-3">
          {/* Active Pay Cycle Pill */}
          <div className="p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[11px]">
            <div className="flex items-center justify-between text-[var(--text-muted)] mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>Active Cycle</span>
              </span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                25d left
              </span>
            </div>
            <p className="text-[var(--text-primary)] font-medium truncate">
              {cycleInfo || '1 Sept 2026 – 30 Sept 2026'}
            </p>
          </div>

          {/* User Account / Engine Status */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center justify-center shrink-0">
                EN
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                  Personal Space
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Engine Live
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN APP CONTENT CONTAINER */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Sleek Global SaaS Top Header (Frosted Glass) */}
        <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/80 backdrop-blur-2xl px-4 sm:px-6 flex items-center justify-between shrink-0 z-10">
          {/* Left: Mobile Menu & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] lg:hidden cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--text-muted)] font-medium hidden sm:inline">
                Solvence
              </span>
              <span className="text-[var(--text-muted)] hidden sm:inline">/</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {getBreadcrumbTitle()}
              </span>
            </div>
          </div>

          {/* Center: Command Search Bar (Desktop) */}
          <div className="hidden md:flex items-center w-72 lg:w-96">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search transactions, bills, or actions..."
                disabled
                className="w-full pl-8 pr-12 py-1.5 text-xs bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden select-none cursor-default"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-card-solid)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                ⌘K
              </span>
            </div>
          </div>

          {/* Right Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Database Heartbeat */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <Database className="w-3 h-3" />
              <span>PostgreSQL 18</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Dark / Light Mode Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] active:scale-90 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer"
              title={isDark ? 'Switch to Framer Day Mode' : 'Switch to Copilot Night Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:rotate-45" /> : <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-rotate-12" />}
            </button>

            {/* Manual Refresh */}
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] active:scale-90 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer group"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4 stroke-[1.8] group-hover:rotate-180 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            </button>

            {/* Header CTA Button */}
            <button
              type="button"
              onClick={onNewTransaction}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-xl shadow-framer-xs hover:shadow-framer-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Record Transaction</span>
            </button>
          </div>
        </header>

        {/* Scrollable Viewport with Smooth View Transition */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto">
          <div key={currentView} className="animate-view-glide">
            {children}
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE SLIDE-OVER DRAWER */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full saas-glass-card rounded-none p-5 z-10 shadow-2xl border-r border-[var(--border-subtle)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 dark:bg-white text-white dark:text-black flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm">Solvence</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-left ${
                      isActive
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-white font-semibold'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNewTransaction();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Record Transaction</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
