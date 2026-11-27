import React from 'react';
import {
  BarChart3,
  BrainCircuit,
  Database,
  LogOut,
  Moon,
  Sun,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Radio,
} from 'lucide-react';

export default function Sidebar({
  user,
  activeTab,
  setActiveTab,
  darkMode,
  toggleDarkMode,
  onLogout,
  isLive,
}) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Executive Analytics',
      icon: BarChart3,
      roles: ['admin', 'student'],
    },
    {
      id: 'profile',
      label: 'My Details & Insights',
      icon: UserCheck,
      roles: ['admin'],
    },
    {
      id: 'predictor',
      label: 'Predictor & Simulator',
      icon: BrainCircuit,
      roles: ['admin', 'student'],
    },
    {
      id: 'admin',
      label: 'Admin Data Portal',
      icon: Database,
      roles: ['admin'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="w-full md:w-64 shrink-0 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between">
      <div>
        {/* Brand */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight text-slate-900 dark:text-white">
                PlaceIQ Analytics
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Real-Time ML Portal
              </div>
            </div>
          </div>

          <span
            title={isLive ? 'Connected to real-time updates' : 'Reconnecting...'}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              isLive
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
            }`}
          >
            <Radio className={`w-2.5 h-2.5 ${isLive ? 'animate-pulse' : ''}`} />
            {isLive ? 'LIVE' : 'SYNC'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer User + Theme */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            {user.role === 'admin' ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <GraduationCap className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate text-slate-900 dark:text-white">
              {user.name}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {user.role}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleDarkMode}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {darkMode ? 'Light' : 'Dark'}
          </button>
          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Switch Role
          </button>
        </div>
      </div>
    </aside>
  );
}
