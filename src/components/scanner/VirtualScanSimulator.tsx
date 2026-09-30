import React, { useState } from 'react';
import { Play, Sparkles, AlertTriangle, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { storage } from '../../services/storage';
import { encodeLocationQR, encodeOfficerQR, encodeFileKeepQR, encodeFileTakeQR } from '../../utils/qrUtils';

interface VirtualScanSimulatorProps {
  onSimulateScan: (code: string) => void;
  onRunScenario?: (scenarioName: string) => void;
  className?: string;
}

export const VirtualScanSimulator: React.FC<VirtualScanSimulatorProps> = ({
  onSimulateScan,
  className = '',
}) => {
  const [selectedShelf, setSelectedShelf] = useState<string>('SHELF-04-02');
  const [selectedOfficer, setSelectedOfficer] = useState<string>('OFF-001');
  const [selectedFile, setSelectedFile] = useState<string>('FILE-1024');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const shelves = storage.getShelves();
  const officers = storage.getOfficers();
  const files = storage.getFiles();

  const handleQuickScan = (payload: string, desc: string) => {
    onSimulateScan(payload);
    setStatusMessage(`Simulated scan: ${desc} ("${payload}")`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 border border-slate-700/80 shadow-xl ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/70 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              Virtual Barcode & Workflow Simulator
              <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-400/20">
                1-Click Testing
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Instantly test the physical 2-step scanning sequences without a physical webcam
            </p>
          </div>
        </div>

        {statusMessage && (
          <div className="text-xs bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {statusMessage}
          </div>
        )}
      </div>

      {/* Workflow Pre-set Scenarios matching the user brief */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Standard Physical Lifecycle Scenarios (FILE-1024)</span>
          <span className="text-[11px] text-slate-400 font-normal">Click buttons in sequence:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Step A */}
          <div className="bg-slate-800/80 hover:bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
                <span>Phase 1: Shelf → Attender</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Attender takes file from shelf.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickScan(encodeLocationQR('SHELF-04-02'), 'Shelf 04-02 QR')}
                className="w-full text-left px-2.5 py-1.5 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/30 text-blue-200 text-xs rounded-lg font-mono flex items-center justify-between cursor-pointer"
              >
                <span>1. Scan Shelf 04-02</span>
                <Play className="w-3 h-3 text-blue-400" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickScan(encodeFileTakeQR('FILE-1024'), 'File 1024 BACK/TAKE QR')}
                className="w-full text-left px-2.5 py-1.5 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/30 text-amber-200 text-xs rounded-lg font-mono flex items-center justify-between cursor-pointer"
              >
                <span>2. Scan File BACK/TAKE</span>
                <Play className="w-3 h-3 text-amber-400" />
              </button>
            </div>
          </div>

          {/* Step B */}
          <div className="bg-slate-800/80 hover:bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                <span>Phase 2: Attender → Officer</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Delivers file to Officer Roy.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickScan(encodeOfficerQR('OFF-001'), 'Officer OFF-001 QR')}
                className="w-full text-left px-2.5 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-200 text-xs rounded-lg font-mono flex items-center justify-between cursor-pointer"
              >
                <span>1. Scan Officer OFF-001</span>
                <Play className="w-3 h-3 text-indigo-400" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickScan(encodeFileKeepQR('FILE-1024'), 'File 1024 FRONT/KEEP QR')}
                className="w-full text-left px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 text-xs rounded-lg font-mono flex items-center justify-between cursor-pointer"
              >
                <span>2. Scan File FRONT/KEEP</span>
                <Play className="w-3 h-3 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Step C */}
          <div className="bg-slate-800/80 hover:bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
                <span>Phase 3: Officer → Attender</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Officer releases file to attender.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickScan(encodeOfficerQR('OFF-001'), 'Officer OFF-001 QR')}
                className="w-full text-left px-2.5 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-200 text-xs rounded-lg font-mono flex items-center justify-between cursor-pointer"
              >
                <span>1. Scan Officer OFF-001</span>
                <Play className="w-3 h-3 text-indigo-400" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickScan(encodeFileTakeQR('FILE-1024'), 'File 1024 BACK/TAKE QR')}
                className="w-full text-left px-2.5 py-1.5 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/30 text-amber-200 text-xs rounded-lg font-mono flex items-center justify-between cursor-pointer"
              >
                <span>2. Scan File BACK/TAKE</span>
                <Play className="w-3 h-3 text-amber-400" />
              </button>
            </div>
          </div>

          {/* Step D */}
          <div className="bg-slate-800/80 hover:bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold mb-1">
                <span>Phase 4: Attender → Shelf</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Restocks file back into shelf.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickScan(encodeLocationQR('SHELF-04-02'), 'Shelf 04-02 QR')}
                className="w-full text-left px-2.5 py-1.5 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/30 text-blue-200 text-xs rounded-lg font-mono flex items-center justify-between cursor-pointer"
              >
                <span>1. Scan Shelf 04-02</span>
                <Play className="w-3 h-3 text-blue-400" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickScan(encodeFileKeepQR('FILE-1024'), 'File 1024 FRONT/KEEP QR')}
                className="w-full text-left px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 text-xs rounded-lg font-mono flex items-center justify-between cursor-pointer"
              >
                <span>2. Scan File FRONT/KEEP</span>
                <Play className="w-3 h-3 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Entity Trigger Bar */}
      <div className="pt-3 border-t border-slate-700/70 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Shelf Picker */}
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 space-y-2">
          <label className="text-[11px] font-semibold text-slate-300 block">
            Scan Any Location (Shelf QR)
          </label>
          <div className="flex gap-1.5">
            <select
              value={selectedShelf}
              onChange={(e) => setSelectedShelf(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {shelves.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} ({s.name})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleQuickScan(encodeLocationQR(selectedShelf), `Shelf ${selectedShelf}`)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Scan
            </button>
          </div>
        </div>

        {/* Officer Picker */}
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 space-y-2">
          <label className="text-[11px] font-semibold text-slate-300 block">
            Scan Any Officer Badge QR
          </label>
          <div className="flex gap-1.5">
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id}: {o.name.split(' ')[1] || o.name} ({o.department.split('&')[0]})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleQuickScan(encodeOfficerQR(selectedOfficer), `Officer ${selectedOfficer}`)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Scan
            </button>
          </div>
        </div>

        {/* File Action Dual-Scan */}
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-semibold text-slate-300 block">
              Scan File Action QR
            </label>
            <span className="text-[10px] text-slate-400">Front vs Back</span>
          </div>
          <div className="flex gap-1.5">
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {files.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.id} - {f.name.slice(0, 18)}...
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickScan(encodeFileKeepQR(selectedFile), `FRONT/KEEP QR (${selectedFile})`)}
              className="py-1 px-2 bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer text-center"
            >
              FRONT (KEEP)
            </button>
            <button
              type="button"
              onClick={() => handleQuickScan(encodeFileTakeQR(selectedFile), `BACK/TAKE QR (${selectedFile})`)}
              className="py-1 px-2 bg-amber-600/90 hover:bg-amber-500 text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer text-center"
            >
              BACK (TAKE)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
