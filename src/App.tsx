// src/App.tsx - Main app with routing
import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Campaigns from './pages/Campaigns';
import AiComposer from './pages/AiComposer';
import Settings from './pages/Settings';
import SetupWizard from './pages/SetupWizard';

export default function App() {
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (window.electronAPI?.checkSetup) {
      window.electronAPI.checkSetup().then((result: boolean) => {
        setSetupComplete(result);
      }).catch(() => setSetupComplete(false));
    } else {
      setSetupComplete(true);
    }
  }, []);

  if (setupComplete === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
          <span className="text-[13px] text-text-secondary">Loading ReachAI...</span>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/setup" element={<SetupWizard onComplete={() => setSetupComplete(true)} />} />
          {!setupComplete && <Route path="*" element={<Navigate to="/setup" replace />} />}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/compose" element={<AiComposer />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
