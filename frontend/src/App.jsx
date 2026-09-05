import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';

export function App() {
  const [cycleInfo, setCycleInfo] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOpenTransaction = () => {
    window.dispatchEvent(new CustomEvent('solvence:open-tx'));
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

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

export default App;
