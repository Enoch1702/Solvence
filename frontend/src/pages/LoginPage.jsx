import { useState } from 'react';
import { Compass, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage({ onSwitchToRegister, initialEmail = '' }) {
  const { login } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-primary)] p-4 relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="fixed -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-indigo-500/15 dark:bg-indigo-500/20 blur-[130px] pointer-events-none" />
      <div className="fixed top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-violet-500/10 dark:bg-violet-500/15 blur-[140px] pointer-events-none" />
      <div className="fixed -bottom-40 left-1/3 w-[520px] h-[520px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/12 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-white text-white dark:text-black shadow-lg mb-4">
            <Compass className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Welcome to Solvence
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1.5">
            Sign in to access your pay cycle planner and financial runway
          </p>
        </div>

        {/* Card */}
        <div className="saas-glass-card rounded-2xl border border-[var(--border-subtle)] p-6 sm:p-8 backdrop-blur-2xl shadow-xl">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 animate-fadeIn">
              <span className="font-semibold shrink-0">Error:</span>
              <div className="flex-1">
                <span>{errorMessage}</span>
                {errorMessage.toLowerCase().includes('invalid email or password') && (
                  <div className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                    Don&apos;t have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => onSwitchToRegister && onSwitchToRegister(email)}
                      className="text-indigo-600 dark:text-indigo-400 font-semibold underline hover:opacity-80 cursor-pointer ml-0.5"
                    >
                      Create an account
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-xl shadow-framer-xs hover:shadow-framer-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="mt-6 pt-5 border-t border-[var(--border-subtle)] text-center">
            <p className="text-xs text-[var(--text-muted)]">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => onSwitchToRegister && onSwitchToRegister(email)}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer ml-1"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-[11px] text-[var(--text-muted)]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Multi-tenant data isolation & BCrypt password encryption</span>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;
