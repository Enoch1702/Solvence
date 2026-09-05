import { Wallet, Plus, ShieldCheck, User } from 'lucide-react';

export function AppShell({ children, onNewTransaction, cycleInfo }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Navigation */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-lg font-bold tracking-tight text-slate-900">SOLVENCE</span>
                  <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/60">
                    Phase 1
                  </span>
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-1">
                <span className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50/70 rounded-lg">
                  Dashboard
                </span>
              </nav>
            </div>

            {/* Right: Cycle Info, User Badge & Action */}
            <div className="flex items-center gap-3">
              {cycleInfo && (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 border border-slate-200/60">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cycle: {cycleInfo}</span>
                </div>
              )}

              <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>User #1</span>
              </div>

              <button
                type="button"
                onClick={onNewTransaction}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Record Transaction</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>Solvence Financial Operating System — Phase 1 Vertical Slice</p>
          <p className="font-mono text-[11px] text-slate-400">PostgreSQL 18 • Spring Boot 3.3 • React 19</p>
        </div>
      </footer>
    </div>
  );
}
