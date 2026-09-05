import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';

export function App() {
  const [cycleInfo, setCycleInfo] = useState('');

  const handleOpenTransaction = () => {
    window.dispatchEvent(new CustomEvent('solvence:open-tx'));
  };

  return (
    <AppShell
      cycleInfo={cycleInfo}
      onNewTransaction={handleOpenTransaction}
    >
      <Dashboard onCycleUpdate={setCycleInfo} />
    </AppShell>
  );
}

export default App;
