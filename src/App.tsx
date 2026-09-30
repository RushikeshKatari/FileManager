import React, { useState, useEffect } from 'react';
import {
  Shield,
  RotateCcw,
  FolderOpen,
  LogOut,
} from 'lucide-react';
import { PortalType } from './types';
import { storage } from './services/storage';
import { AuthUser, loadSession, clearSession } from './services/auth';
import { LoginPage } from './components/auth/LoginPage';
import { AdminPortal } from './components/admin/AdminPortal';
import { OfficerPortal } from './components/officer/OfficerPortal';
import { AttenderPortal } from './components/attender/AttenderPortal';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => loadSession());

  // Portal is strictly derived from the user's role — no switching allowed
  const portalForRole = (u: AuthUser | null): PortalType => {
    if (u?.role === 'OFFICER') return 'OFFICER';
    if (u?.role === 'ATTENDER') return 'ATTENDER';
    return 'ADMIN';
  };

  const [activePortal, setActivePortal] = useState<PortalType>(() =>
    portalForRole(loadSession())
  );

  const [currentOfficerId, setCurrentOfficerId] = useState<string>(() =>
    loadSession()?.role === 'OFFICER' ? (loadSession()?.id ?? 'OFF-001') : 'OFF-001'
  );
  const [currentAttenderId, setCurrentAttenderId] = useState<string>(() =>
    loadSession()?.role === 'ATTENDER' ? (loadSession()?.id ?? 'ATT-001') : 'ATT-001'
  );

  const [versionKey, setVersionKey] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = storage.subscribe(() => setVersionKey((p) => p + 1));
    return unsubscribe;
  }, []);

  const handleLogin = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    setActivePortal(portalForRole(loggedInUser));
    if (loggedInUser.role === 'OFFICER') setCurrentOfficerId(loggedInUser.id);
    if (loggedInUser.role === 'ATTENDER') setCurrentAttenderId(loggedInUser.id);
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setActivePortal('ADMIN');
  };

  const handleResetData = () => {
    if (window.confirm('Reset system data to initial demonstration state? This will restore sample cupboards, shelves, files, and initial movement history.')) {
      storage.resetToDefaults();
    }
  };

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const stats = storage.getDashboardStats();
  const isAdmin = user.role === 'ADMIN';

  const roleColor = {
    ADMIN: 'indigo',
    OFFICER: 'sky',
    ATTENDER: 'emerald',
  }[user.role];

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center text-white shadow-md">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base tracking-tight text-white">File Manager</h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                    Dual-QR Matrix
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 hidden sm:block">
                  Physical File Tracking System · Admin • Officer • Attender
                </div>
              </div>
            </div>



            {/* Right: stats + user chip + logout */}
            <div className="flex items-center gap-3">
              {/* Stats (desktop only) */}
              <div className="hidden lg:block text-right text-[11px] text-slate-400">
                <div>
                  <span className="font-semibold text-slate-200">{stats.totalFiles}</span> Files ·{' '}
                  <span className="text-amber-400 font-semibold">{stats.currentlyMoving}</span> Moving
                </div>
                <div>
                  <span className="text-emerald-400 font-semibold">{stats.inShelves}</span> In Shelves ·{' '}
                  <span className="text-indigo-400 font-semibold">{stats.withOfficers}</span> With Officers
                </div>
              </div>

              {/* Reset (admin only) */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleResetData}
                  title="Reset sample database"
                  className="hidden lg:flex p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              {/* User chip */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold
                ${roleColor === 'indigo' ? 'bg-indigo-900/50 border-indigo-700/50 text-indigo-300' : ''}
                ${roleColor === 'sky' ? 'bg-sky-900/50 border-sky-700/50 text-sky-300' : ''}
                ${roleColor === 'emerald' ? 'bg-emerald-900/50 border-emerald-700/50 text-emerald-300' : ''}
              `}>
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{user.name.split(' ').slice(-2).join(' ')}</span>
                <span className="text-[10px] opacity-70 hidden sm:inline">({user.role})</span>
              </div>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activePortal === 'ADMIN' && <AdminPortal />}

        {activePortal === 'OFFICER' && (
          <OfficerPortal
            currentOfficerId={currentOfficerId}
            onChangeOfficer={setCurrentOfficerId}
            onNavigateToAttender={() => setActivePortal('ATTENDER')}
          />
        )}

        {activePortal === 'ATTENDER' && (
          <AttenderPortal
            currentAttenderId={currentAttenderId}
            onChangeAttender={setCurrentAttenderId}
          />
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-bold text-slate-700">File Manager</span>
            <span>·</span>
            <span>Physical File Tracking System (PFTS)</span>
            <span>·</span>
            <span>Dual-QR Sequence Engine</span>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <button
                type="button"
                onClick={handleResetData}
                className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Demo Records
              </button>
            )}
            <span>·</span>
            <span className="font-mono text-[11px] text-slate-400">
              Audit Trail: {stats.totalMovementsCount} Transactions
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
