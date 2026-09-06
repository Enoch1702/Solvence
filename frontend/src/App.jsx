import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Compass } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [cycleInfo, setCycleInfo] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOpenTransaction = () => {
    window.dispatchEvent(new CustomEvent('solvence:open-tx'));
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg animate-pulse mb-4">
          <Compass className="w-6 h-6 stroke-[2.2]" />
        </div>
        <p className="text-xs text-[var(--text-muted)] font-medium">
          Loading Solvence workspace...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authMode === 'register') {
      return (
        <RegisterPage
          initialEmail={authEmail}
          onSwitchToLogin={(email) => {
            if (typeof email === 'string') setAuthEmail(email);
            setAuthMode('login');
          }}
        />
      );
    }
    return (
      <LoginPage
        initialEmail={authEmail}
        onSwitchToRegister={(email) => {
          if (typeof email === 'string') setAuthEmail(email);
          setAuthMode('register');
        }}
      />
    );
  }

  return (
    <AppShell
      cycleInfo={cycleInfo}
      currentView={currentView}
      onViewChange={setCurrentView}
      onNewTransaction={handleOpenTransaction}
      onRefresh={handleRefresh}
    >
      <Dashboard
        activeView={currentView}
        onViewChange={setCurrentView}
        refreshTrigger={refreshTrigger}
        onCycleUpdate={setCycleInfo}
      />
    </AppShell>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
