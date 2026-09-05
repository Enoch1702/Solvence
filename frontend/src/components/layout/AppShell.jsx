import { useState } from 'react';
import {
  Compass,
  Plus,
  Calendar,
  LineChart,
  Menu,
  X
} from 'lucide-react';

export function AppShell({ children, onNewTransaction, cycleInfo }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] flex flex-col text-stone-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Premium Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-framer-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Left: Solvence Brand Identity & Nav */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                {/* Refined Solvence Logo Mark */}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-framer-xs transition-transform hover:scale-105">
                  <Compass className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold tracking-tight text-stone-900 font-sans">
                      SOLVENCE
                    </span>
                    <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-stone-100 text-stone-600 rounded-full border border-stone-200">
                      OS
                    </span>
                  </div>
                  <span className="block text-[10px] font-medium text-stone-400 tracking-tight">
                    Forward Cashflow Operating System
                  </span>
                </div>
              </div>

              {/* Desktop Nav Items */}
              <nav className="hidden md:flex items-center gap-1.5 pl-4 border-l border-stone-200">
                <button
                  type="button"
                  onClick={() => scrollToSection('dashboard-top')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50/90 rounded-xl transition-all"
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('runway-section')}
                  className="px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all"
                >
                  Runway
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('ledger-section')}
                  className="px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all"
                >
                  Transactions
                </button>
                <span
                  title="Coming in Phase 2"
                  className="px-3 py-1.5 text-xs font-medium text-stone-400 flex items-center gap-1 cursor-not-allowed"
                >
                  <LineChart className="w-3.5 h-3.5 opacity-60" />
                  Analytics
                  <span className="text-[9px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-sm ml-0.5">
                    Phase 2
                  </span>
                </span>
              </nav>
            </div>

            {/* Right: Cycle Info, User & Primary CTA */}
            <div className="flex items-center gap-3">
              {/* Cycle Date Range Badge */}
              {cycleInfo && (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-xl text-xs font-medium text-stone-600 border border-stone-200/80">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{cycleInfo}</span>
                </div>
              )}

              {/* User Chip */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-xl text-xs font-medium text-stone-700 border border-stone-200/80">
                <div className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-700">
                  1
                </div>
                <span>User #1</span>
              </div>

              {/* Desktop "Record Transaction" CTA */}
              <button
                type="button"
                onClick={onNewTransaction}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-framer-xs hover:shadow-framer-sm transition-all focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Record Activity</span>
              </button>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="md:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white p-4 space-y-2 animate-fade-in-up">
            {cycleInfo && (
              <div className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-xl text-xs text-stone-600">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Cycle: {cycleInfo}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => scrollToSection('dashboard-top')}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-xl"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('runway-section')}
              className="w-full text-left px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 rounded-xl"
            >
              Runway Visualization
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('ledger-section')}
              className="w-full text-left px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 rounded-xl"
            >
              Transaction Activity Feed
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNewTransaction();
              }}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-framer-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Record Transaction
            </button>
          </div>
        )}
      </header>

      {/* Main App Container */}
      <main id="dashboard-top" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Mobile Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-40 sm:hidden">
        <button
          type="button"
          onClick={onNewTransaction}
          aria-label="Add transaction"
          className="w-13 h-13 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-framer-lg active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Minimal Calm Footer */}
      <footer className="border-t border-stone-200/80 bg-white py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-stone-700">SOLVENCE</span>
            <span>• Forward Cashflow Operating System</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-stone-400">
            <span>PostgreSQL 18</span>
            <span>•</span>
            <span>Spring Boot 3.3</span>
            <span>•</span>
            <span>React 19</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
