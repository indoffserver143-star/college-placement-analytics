import React, { useEffect, useState } from 'react';
import LoginView from './components/LoginView';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentDetailsPortal from './components/StudentDetailsPortal';
import StudentPredictor from './components/StudentPredictor';
import AdminPortal from './components/AdminPortal';
import { useRealtimeUpdates } from './hooks/useRealtimeUpdates';

export default function App() {
  const [user, setUser] = useState({
    role: 'admin',
    name: 'Placement Officer (Admin)',
    username: 'admin',
    access_token: 'demo-token-admin',
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [liveTick, setLiveTick] = useState(0);
  const [toastMsg, setToastMsg] = useState('');
  const [prefillProfile, setPrefillProfile] = useState(null);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const { isLive } = useRealtimeUpdates((evt) => {
    setLiveTick((t) => t + 1);
    if (evt?.detail) {
      setToastMsg(`Live Update: ${evt.detail}`);
      setTimeout(() => setToastMsg(''), 4000);
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogin = (userData) => {
    setUser(userData);
    setActiveTab(userData.role === 'student' ? 'predictor' : 'dashboard');
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleOpenSimulator = (studentRecord) => {
    setPrefillProfile(studentRecord);
    setActiveTab('predictor');
  };

  if (!user) {
    return (
      <LoginView
        onLogin={handleLogin}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode((d) => !d)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode((d) => !d)}
        onLogout={handleLogout}
        isLive={isLive}
      />

      <main className="flex-1 p-5 md:p-8 overflow-y-auto relative">
        {toastMsg && (
          <div className="fixed bottom-5 right-5 z-40 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-xs font-semibold shadow-lg border border-slate-700 animate-fade-in">
            ● {toastMsg}
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard liveTick={liveTick} />}
        {activeTab === 'profile' && user.role === 'admin' && (
          <StudentDetailsPortal liveTick={liveTick} onOpenSimulator={handleOpenSimulator} />
        )}
        {activeTab === 'predictor' && <StudentPredictor prefillProfile={prefillProfile} />}
        {activeTab === 'admin' && user.role === 'admin' && <AdminPortal liveTick={liveTick} />}
      </main>
    </div>
  );
}
