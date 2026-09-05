import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';

export function App() {
  const [cycleInfo, setCycleInfo] = useState('');

  return (
    <AppShell
      cycleInfo={cycleInfo}
      onNewTransaction={() => {
        // Trigger dialog via event or shared state if needed
        const btn = document.querySelector('button[aria-label="Close dialog"]');
        if (!btn) {
          // Find the record transaction button in dashboard
          const recordBtns = document.querySelectorAll('button');
          for (const b of recordBtns) {
            if (b.textContent.includes('Record Transaction')) {
              b.click();
              break;
            }
          }
        }
      }}
    >
      <Dashboard onCycleUpdate={setCycleInfo} />
    </AppShell>
  );
}

export default App;
