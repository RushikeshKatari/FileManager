import React, { useState, useEffect } from 'react';
import {
  Shield,
  Layers,
  Search,
  Camera,
  RotateCcw,
  Sparkles,
  QrCode,
  FileCheck2,
  Users,
  Package,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { PortalType } from './types';
import { storage } from './services/storage';
import { AdminPortal } from './components/admin/AdminPortal';
import { OfficerPortal } from './components/officer/OfficerPortal';
import { AttenderPortal } from './components/attender/AttenderPortal';

export default function App() {
  const [activePortal, setActivePortal] = useState<PortalType>(() => {
    try {
      const saved = localStorage.getItem('pfts_active_portal');
      if (saved && ['ADMIN', 'OFFICER', 'ATTENDER'].includes(saved)) {
        return saved as PortalType;
      }
    } catch (_) {}
    return 'ADMIN';
  });

  const handlePortalSwitch = (portal: PortalType) => {
    setActivePortal(portal);
    try {
      localStorage.setItem('pfts_active_portal', portal);
    } catch (_) {}
  };

  const [currentOfficerId, setCurrentOfficerId] = useState<string>('OFF-001');
  const [currentAttenderId, setCurrentAttenderId] = useState<string>('ATT-001');
  const [versionKey, setVersionKey] = useState<number>(0);

  // Subscribe to storage changes so UI updates reactively across all tabs & actions
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setVersionKey((prev) => prev + 1);
    });
    return unsubscribe;
  }, []);

  const handleResetData = () => {
    if (window.confirm('Reset system data to initial demonstration state? This will restore sample cupboards, shelves, files, and initial movement history.')) {
      storage.resetToDefaults();
    }
  };

  const stats = storage.getDashboardStats();

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & System Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center text-white shadow-md">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base tracking-tight text-white">
                    Physical File Tracking System
                  </h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                    Dual-QR Matrix
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 hidden sm:block">
                  Admin • Officer • Attender Portals with Sequence Validation
                </div>
              </div>
            </div>

            {/* Portal Switcher Nav */}
            <nav className="flex items-center gap-1 sm:gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => handlePortalSwitch('ADMIN')}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activePortal === 'ADMIN'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handlePortalSwitch('OFFICER')}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activePortal === 'OFFICER'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Officer</span>
              </button>

              <button
                type="button"
                onClick={() => handlePortalSwitch('ATTENDER')}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activePortal === 'ATTENDER'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Attender Scanner</span>
              </button>
            </nav>

            {/* Top Right Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="text-right text-[11px] text-slate-400">
                <div>
                  <span className="font-semibold text-slate-200">{stats.totalFiles}</span> Files •{' '}
                  <span className="text-amber-400 font-semibold">{stats.currentlyMoving}</span> Moving
                </div>
                <div>
                  <span className="text-emerald-400 font-semibold">{stats.inShelves}</span> In Shelves •{' '}
                  <span className="text-indigo-400 font-semibold">{stats.withOfficers}</span> With Officers
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetData}
                title="Reset sample database to default state"
                className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
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

      {/* System Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Physical File Tracking System (PFTS)</span>
            <span>•</span>
            <span>Dual-QR Sequence Engine (Front = Keep, Back = Take)</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleResetData}
              className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Demo Records
            </button>
            <span>•</span>
            <span className="font-mono text-[11px] text-slate-400">
              Audit Trail: {stats.totalMovementsCount} Transactions
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
