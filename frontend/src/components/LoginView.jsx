import React, { useState } from 'react';
import { GraduationCap, ShieldCheck, UserCheck, Sparkles, ArrowRight, Lock, User } from 'lucide-react';
import { authAPI } from '../services/api';

export default function LoginView({ onLogin, darkMode, toggleDarkMode }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authAPI.login(username, password);
      onLogin(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoUser, demoPass) => {
    setError('');
    setLoading(true);
    try {
      const data = await authAPI.login(demoUser, demoPass);
      onLogin(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Demo login failed. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-900 transition-colors">
      <div className="absolute top-5 right-5">
        <button
          onClick={toggleDarkMode}
          className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Left Hero Panel */}
        <div className="p-8 md:p-10 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold tracking-wide mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              ML-POWERED PLACEMENT INTELLIGENCE
            </div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4">
              Interactive College Placement & Skills Analytics Dashboard
            </h1>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Explore 5-year historical placement trends, benchmark technical skills against Tier-1 alumni, and simulate your placement readiness in real time.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <p className="text-xs uppercase tracking-wider text-indigo-200 font-semibold">
              Instant One-Click Demo Access
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('admin', 'admin123')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Placement Officer (Admin)</div>
                  <div className="text-xs text-indigo-200">admin / admin123 • Full Analytics + CSV Portal</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('student', 'student123')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Final-Year Student</div>
                  <div className="text-xs text-indigo-200">student / student123 • Predictor & What-If Simulator</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>

        {/* Right Sign-In Form */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <UserCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sign in to Dashboard</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Use your credentials or click a demo role on the left.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or student"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 transition disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Demo Accounts:</span> Admin (<code>admin</code> / <code>admin123</code>) • Student (<code>student</code> / <code>student123</code>)
          </div>
        </div>
      </div>
    </div>
  );
}

