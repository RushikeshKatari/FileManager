import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  MapPin,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  PackageCheck,
  PackageMinus,
  QrCode,
  Shield,
  Layers,
} from 'lucide-react';
import { storage } from '../../services/storage';
import { QRScannerModal } from '../scanner/QRScannerModal';
import { parseQRString, playScanSound } from '../../utils/qrUtils';

interface AttenderPortalProps {
  currentAttenderId?: string;
  onChangeAttender?: (attenderId: string) => void;
}

export const AttenderPortal: React.FC<AttenderPortalProps> = ({
  currentAttenderId = 'ATT-001',
  onChangeAttender,
}) => {
  const attenders = storage.getAttenders();
  const activeAttender = attenders.find((a) => a.id === currentAttenderId) || attenders[0];
  const movements = storage.getMovements();
  const [, setTick] = useState(0);

  useEffect(() => {
    return storage.subscribe(() => setTick((t) => t + 1));
  }, []);

  // Step 1: Locked target (ONLY Shelf Location or Officer)
  const [step1Target, setStep1Target] = useState<{
    type: 'SHELF' | 'OFFICER';
    id: string;
    name: string;
    code: string;
    description: string;
  } | null>(null);

  // Scanner Modal & Input
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Feedback State
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
    subtext?: string;
  } | null>(null);

  // Auto-focus input on mount or step change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [step1Target]);

  // QR Processor implementing strict 2-step scanning:
  // Step 1: ONLY accepts Shelf location or Officer QR
  // Step 2: ONLY accepts File Action (KEEP or TAKE)
  const processScannedCode = (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    const parsed = parseQRString(trimmed);
    const upper = trimmed.toUpperCase();

    // ==========================================
    // STEP 1: MUST BE A SHELF OR OFFICER QR
    // ==========================================
    if (!step1Target) {
      // 1. Check if user attempted to scan a File QR on Step 1 -> REJECT
      if (
        parsed.type === 'FILE_ACTION' ||
        upper.includes('KEEP') ||
        upper.includes('TAKE') ||
        upper.startsWith('FILE:') ||
        upper.startsWith('FILE-')
      ) {
        playScanSound('error');
        setFeedback({
          type: 'error',
          title: 'Step 1 Rejected: File Scan Not Allowed',
          message: 'First scan MUST be a Shelf location or Officer QR. File scans are not accepted in Step 1.',
          subtext: 'Please scan the physical Shelf barcode or Officer badge first.',
        });
        return;
      }

      // 2. Is it a Shelf location?
      if (
        parsed.type === 'LOCATION' &&
        (parsed.subType === 'SHELF' || parsed.shelfId || upper.includes('SHELF'))
      ) {
        const shelfCandidate = parsed.shelfId || parsed.entityId || trimmed.replace('LOC:SHELF:', '');
        const shelf =
          storage.getShelfById(shelfCandidate) ||
          storage.getShelves().find((s) => s.code.toUpperCase() === shelfCandidate.toUpperCase() || s.id === shelfCandidate);

        if (!shelf) {
          playScanSound('error');
          setFeedback({
            type: 'error',
            title: 'Shelf Not Found',
            message: `Scanned code "${shelfCandidate}" does not match any registered shelf.`,
            subtext: 'Ensure the shelf QR is registered in the Location Hierarchy.',
          });
          return;
        }

        const breadcrumb = storage.getLocationBreadcrumb(shelf.id);
        setStep1Target({
          type: 'SHELF',
          id: shelf.id,
          name: shelf.name,
          code: shelf.code,
          description: breadcrumb,
        });

        playScanSound('success');
        setFeedback({
          type: 'success',
          title: `Step 1 Complete: Locked to ${shelf.name}`,
          message: `Location: ${breadcrumb}`,
          subtext: 'Next: Scan File FRONT (KEEP) or BACK (TAKE) QR.',
        });
        return;
      }

      // 3. Is it an Officer?
      if (
        parsed.type === 'OFFICER' ||
        upper.startsWith('OFF-') ||
        upper.startsWith('OFFICER:')
      ) {
        const officerCandidate = parsed.entityId || trimmed.replace('OFFICER:', '').trim();
        const officer =
          storage.getOfficerById(officerCandidate) ||
          storage.getOfficers().find((o) => o.id.toUpperCase() === officerCandidate.toUpperCase());

        if (!officer) {
          playScanSound('error');
          setFeedback({
            type: 'error',
            title: 'Officer Not Found',
            message: `Scanned badge "${officerCandidate}" does not match any registered officer.`,
            subtext: 'Ensure the officer badge is registered in the Officer directory.',
          });
          return;
        }

        setStep1Target({
          type: 'OFFICER',
          id: officer.id,
          name: officer.name,
          code: officer.id,
          description: `${officer.department} Dept • Desk: ${officer.deskNumber || 'Main Desk'}`,
        });

        playScanSound('success');
        setFeedback({
          type: 'success',
          title: `Step 1 Complete: Locked to Officer ${officer.name}`,
          message: `Badge: ${officer.id} (${officer.department})`,
          subtext: 'Next: Scan File FRONT (KEEP) or BACK (TAKE) QR.',
        });
        return;
      }

      // 4. Any other unrecognized barcode
      playScanSound('error');
      setFeedback({
        type: 'error',
        title: 'Step 1 Rejected: Invalid QR',
        message: `Scanned code "${trimmed}" is not a recognized Shelf or Officer QR.`,
        subtext: 'Step 1 strictly accepts only a Shelf Location QR or Officer Badge QR.',
      });
      return;
    }

    // ==========================================
    // STEP 2: MUST BE A FILE ACTION (KEEP / TAKE)
    // ==========================================
    // If user scans another location or officer while on Step 2 -> REJECT
    if (
      parsed.type === 'LOCATION' ||
      parsed.type === 'OFFICER' ||
      upper.startsWith('LOC:') ||
      upper.startsWith('OFFICER:') ||
      upper.startsWith('OFF-') ||
      upper.startsWith('SHELF-')
    ) {
      playScanSound('error');
      setFeedback({
        type: 'error',
        title: 'Step 2 Rejected: Location Scan Not Allowed',
        message: `Already locked to "${step1Target.name}". Step 2 strictly requires a File KEEP or TAKE QR.`,
        subtext: 'To change location/officer, click "Change Target" button below.',
      });
      return;
    }

    // If it's a file action QR
    if (parsed.type === 'FILE_ACTION' || upper.includes('KEEP') || upper.includes('TAKE')) {
      let fileId = parsed.fileId;
      let action: 'KEEP' | 'TAKE' = parsed.action || (upper.includes('TAKE') ? 'TAKE' : 'KEEP');

      // Heuristic extraction if fileId wasn't parsed cleanly
      if (!fileId) {
        const match = upper.match(/FILE-?[0-9]+/);
        if (match) fileId = match[0];
      }

      if (!fileId) {
        playScanSound('error');
        setFeedback({
          type: 'error',
          title: 'Invalid File QR',
          message: 'The scanned code is missing a valid File ID.',
          subtext: 'Scan the FRONT (KEEP) or BACK (TAKE) QR on the physical file.',
        });
        return;
      }

      // Execute transaction via storage
      const outcome = storage.executeScanTransaction({
        targetType: step1Target.type,
        targetId: step1Target.id,
        fileAction: action,
        fileId,
        actorId: activeAttender.id,
        actorName: activeAttender.name,
        actorRole: 'ATTENDER',
      });

      if (outcome.success) {
        playScanSound('success');
        setFeedback({
          type: 'success',
          title: `File ${fileId} [${action}] Completed!`,
          message: outcome.message,
          subtext: `Target: ${step1Target.name}. Terminal is ready for next scan.`,
        });
        // Automatically reset to Step 1 so attender is ready for next job
        setStep1Target(null);
      } else {
        playScanSound('error');
        setFeedback({
          type: 'error',
          title: 'Movement Validation Error',
          message: outcome.message,
          subtext: `Check file status or physical custody. Target: ${step1Target.name}.`,
        });
      }
      return;
    }

    // Any other barcode on Step 2
    playScanSound('error');
    setFeedback({
      type: 'error',
      title: 'Step 2 Rejected: Unrecognized File QR',
      message: `Scanned code "${trimmed}" is not a recognized File KEEP or TAKE QR.`,
      subtext: 'Scan the File FRONT sticker (KEEP) or BACK sticker (TAKE).',
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    processScannedCode(manualInput.trim());
    setManualInput('');
  };

  const handleResetTarget = () => {
    setStep1Target(null);
    setFeedback(null);
    if (inputRef.current) inputRef.current.focus();
  };

  // Recent 2 scans by this attender for instant reassurance
  const recentTransactions = movements
    .filter((m) => m.personId === activeAttender.id)
    .slice(0, 2);

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Simple Top Bar: Attender Identity */}
      <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-slate-900 leading-tight">
              {activeAttender.name}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Attender ID: {activeAttender.id}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Switch:</span>
          <select
            value={activeAttender.id}
            onChange={(e) => onChangeAttender && onChangeAttender(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            {attenders.map((att) => (
              <option key={att.id} value={att.id}>
                {att.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Ultra-Simple QR Scanner Station */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-6 sm:p-7 space-y-5">
        {/* Step Progress Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase transition-all ${
                !step1Target
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              Step 1: {!step1Target ? 'Scan Target' : 'Done ✓'}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
            <span
              className={`px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase transition-all ${
                step1Target
                  ? 'bg-amber-500 text-white shadow-xs animate-pulse'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              Step 2: Scan File
            </span>
          </div>

          {step1Target && (
            <button
              type="button"
              onClick={handleResetTarget}
              title="Cancel and pick a different shelf/officer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Current Active Step Banner */}
        {!step1Target ? (
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 text-center space-y-1">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white mb-1 shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              STEP 1: SCAN SHELF OR OFFICER QR
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Scan the physical <strong>Shelf Barcode</strong> or <strong>Officer Badge QR</strong>. (File scans will not be accepted until Step 1 is locked).
            </p>
          </div>
        ) : (
          <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                Target Locked
              </span>
              <button
                type="button"
                onClick={handleResetTarget}
                className="text-xs font-bold text-amber-900 underline hover:text-amber-950 cursor-pointer"
              >
                Change Target
              </button>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                {step1Target.type === 'SHELF' ? (
                  <MapPin className="w-5 h-5" />
                ) : (
                  <UserCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">{step1Target.name}</h4>
                <p className="text-xs text-slate-600 font-mono mt-0.5">{step1Target.description}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-amber-200/70 text-xs font-bold text-amber-950 text-center">
              👉 STEP 2: Now scan File FRONT (KEEP) or BACK (TAKE) QR
            </div>
          </div>
        )}

        {/* Primary Action 1: Huge Camera Scanner Button */}
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className={`w-full py-4 px-6 rounded-2xl font-black text-base flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all cursor-pointer text-white ${
            !step1Target
              ? 'bg-indigo-600 hover:bg-indigo-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          <Camera className="w-6 h-6 shrink-0" />
          <span>
            {!step1Target
              ? '📷 Scan Shelf / Officer with Camera'
              : '📷 Scan File (Keep/Take) with Camera'}
          </span>
        </button>

        {/* Primary Action 2: Barcode Gun / Manual Input Box */}
        <form onSubmit={handleManualSubmit} className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Or Scan with Barcode Gun / Type Code:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={
                  !step1Target
                    ? 'Scan Shelf barcode or Officer QR...'
                    : 'Scan File FRONT (KEEP) or BACK (TAKE) QR...'
                }
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Submit
            </button>
          </div>
        </form>

        {/* Quick Testing Shortcuts (For Desktop / Demo Testing) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            {!step1Target ? 'Quick Demo: Step 1 Scans' : 'Quick Demo: Step 2 File Scans'}
          </div>

          {!step1Target ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => processScannedCode('LOC:SHELF:SHELF-04-02')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Shelf 02 (SHELF-04-02)</span>
              </button>
              <button
                type="button"
                onClick={() => processScannedCode('OFFICER:OFF-001')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Officer OFF-001</span>
              </button>
              <button
                type="button"
                onClick={() => processScannedCode('FILE:KEEP:FILE-1024')}
                title="Testing invalid step 1 scan (rejects file)"
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                ⚠️ Test Invalid File Scan
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => processScannedCode('FILE:KEEP:FILE-1024')}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>File 1024 FRONT (KEEP)</span>
              </button>
              <button
                type="button"
                onClick={() => processScannedCode('FILE:TAKE:FILE-1024')}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <PackageMinus className="w-3.5 h-3.5 text-amber-600" />
                <span>File 1024 BACK (TAKE)</span>
              </button>
              <button
                type="button"
                onClick={() => processScannedCode('LOC:SHELF:SHELF-04-02')}
                title="Testing invalid step 2 scan (rejects location)"
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                ⚠️ Test Invalid Location Scan
              </button>
            </div>
          )}
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs animate-in zoom-in-95 duration-150 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-black text-sm">{feedback.title}</div>
                <p className="mt-0.5 font-medium">{feedback.message}</p>
                {feedback.subtext && (
                  <p className="mt-1 text-[11px] opacity-80 italic">{feedback.subtext}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-xs font-bold opacity-60 hover:opacity-100 p-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Simple Recent Activity Footer */}
      {recentTransactions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 text-xs">
          <div className="font-bold text-slate-700 mb-1.5 text-[11px] uppercase tracking-wider">
            Last Recorded Movement:
          </div>
          <div className="space-y-1.5">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      tx.action === 'TAKE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {tx.action}
                  </span>
                  <span className="font-bold font-mono text-slate-800">{tx.fileId}</span>
                  <span className="text-slate-400">➔</span>
                  <span className="text-slate-600 text-[11px] truncate max-w-[180px]">
                    {tx.toLocation}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Camera QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scanned) => {
          setIsScannerOpen(false);
          processScannedCode(scanned);
        }}
        title={!step1Target ? 'Step 1: Scan Shelf or Officer' : 'Step 2: Scan File (Keep/Take)'}
        subtitle={
          !step1Target
            ? 'Point camera at physical Shelf Barcode or Officer Badge QR'
            : `Locked to ${step1Target.name}. Point camera at File FRONT (KEEP) or BACK (TAKE) QR.`
        }
      />
    </div>
  );
};
