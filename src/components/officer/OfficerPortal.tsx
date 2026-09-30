import React, { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  UserCheck,
  QrCode,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Send,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { storage } from '../../services/storage';
import { PhysicalFile, Officer, Shelf, Cupboard } from '../../types';
import { QRCodeView } from '../common/QRCodeView';
import { PrintLabelsModal } from '../common/PrintLabelsModal';
import {
  encodeOfficerQR,
  encodeFileKeepQR,
  encodeFileTakeQR,
  encodeLocationQR,
} from '../../utils/qrUtils';

interface OfficerPortalProps {
  currentOfficerId?: string;
  onChangeOfficer?: (officerId: string) => void;
  onNavigateToAttender?: () => void;
}

export const OfficerPortal: React.FC<OfficerPortalProps> = ({
  currentOfficerId = 'OFF-001',
  onChangeOfficer,
  onNavigateToAttender,
}) => {
  const officers = storage.getOfficers();
  const activeOfficer = officers.find((o) => o.id === currentOfficerId) || officers[0];
  const files = storage.getFiles();
  const shelves = storage.getShelves();
  const cupboards = storage.getCupboards();
  const [, setTick] = useState(0);

  useEffect(() => {
    return storage.subscribe(() => setTick((t) => t + 1));
  }, []);

  const [activeTab, setActiveTab] = useState<'SEARCH' | 'MY_FILES' | 'MY_QR' | 'QR_GENERATOR'>('SEARCH');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileForInspection, setSelectedFileForInspection] = useState<PhysicalFile | null>(null);

  // QR Generation permission check (from Officer model)
  const canGenerate = activeOfficer?.canGenerateQRs ?? true;
  const [genTarget, setGenTarget] = useState<'FILE_KEEP' | 'FILE_TAKE' | 'SHELF'>('FILE_KEEP');
  const [genFileId, setGenFileId] = useState(files[0]?.id || 'FILE-1024');
  const [genShelfId, setGenShelfId] = useState(shelves[0]?.id || 'SHELF-04-02');

  // Print modal
  const [printModal, setPrintModal] = useState<{
    isOpen: boolean;
    type: 'FILE_DOUBLE_QR' | 'SHELF_LABELS' | 'OFFICER_BADGE';
    file?: PhysicalFile;
    shelf?: Shelf;
    officer?: Officer;
  }>({
    isOpen: false,
    type: 'OFFICER_BADGE',
  });

  // Action status message
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal for shelf placement check when releasing from desk
  const [placementCheckFile, setPlacementCheckFile] = useState<PhysicalFile | null>(null);
  const [selectedShelfId, setSelectedShelfId] = useState<string>('');

  // Files currently held by this officer
  const myDeskFiles = files.filter((f) => f.currentOfficerId === activeOfficer.id && f.status === 'WITH_OFFICER');

  // Search Results
  const searchResults = searchQuery.trim()
    ? files.filter((f) => {
        const q = searchQuery.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q))
        );
      })
    : [];

  // Release a file back: FIRST checks if placed into cupboard/shelf! If not, it is NOT removed from My Desk
  const handleOfficerRelease = (file: PhysicalFile) => {
    // 1. Check if this file is placed into any cupboard or shelf
    const isPlaced = storage.isFilePlacedInShelfOrCupboard(file.id);

    if (!isPlaced) {
      // If it's NOT placed in any cupboard or shelf, DO NOT REMOVE FROM MY DESK!
      setActionAlert({
        type: 'error',
        message: `Release blocked: File "${file.id}" has NOT been placed into any cupboard or shelf yet. It will remain on your desk until verified placed into a cupboard/shelf.`,
      });
      setPlacementCheckFile(file);
      setSelectedShelfId(file.homeShelfId || shelves[0]?.id || '');
      return;
    }

    // 2. If it is already placed in a cupboard/shelf, release and clear from desk
    const res = storage.executeScanTransaction({
      targetType: 'OFFICER',
      targetId: activeOfficer.id,
      fileAction: 'TAKE',
      fileId: file.id,
      actorId: activeOfficer.id,
      actorName: activeOfficer.name,
      actorRole: 'OFFICER',
      customNotes: `Officer ${activeOfficer.name} verified file is in cupboard/shelf and completed desk release`,
    });

    if (res.success) {
      setActionAlert({
        type: 'success',
        message: `File "${file.id}" verified placed in cupboard/shelf and successfully removed from your desk.`,
      });
    } else {
      setActionAlert({ type: 'error', message: res.message });
    }

    setTimeout(() => setActionAlert(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Officer Header & Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {activeOfficer.name.split(' ').slice(1).map((n) => n[0]).join('') || 'OF'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{activeOfficer.name}</h2>
                <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                  {activeOfficer.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeOfficer.designation} • {activeOfficer.department} ({activeOfficer.deskNumber})
              </p>
            </div>
          </div>

          {/* Officer Selector (for testing multiple officer views) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Switch Officer:</span>
            <select
              value={activeOfficer.id}
              onChange={(e) => onChangeOfficer && onChangeOfficer(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {officers.map((off) => (
                <option key={off.id} value={off.id}>
                  {off.name} ({off.id} - {off.department.split('&')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pt-1">
          <button
            onClick={() => setActiveTab('SEARCH')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'SEARCH'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Find Physical Files
          </button>

          <button
            onClick={() => setActiveTab('MY_FILES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'MY_FILES'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            My Desk Files ({myDeskFiles.length})
          </button>

          <button
            onClick={() => setActiveTab('MY_QR')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'MY_QR'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            My Officer QR Code Badge
          </button>

          <button
            onClick={() => setActiveTab('QR_GENERATOR')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'QR_GENERATOR'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Officer QR Generator
          </button>
        </div>
      </div>

      {actionAlert && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs animate-in fade-in ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {actionAlert.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionAlert.message}</span>
        </div>
      )}

      {/* 1. SEARCH FILES TAB (Never says 'Not found', always shows latest trace / whereabouts) */}
      {activeTab === 'SEARCH' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Search Physical File Whereabouts
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter any file name, record topic, or docket ID. The tracking engine will locate the exact Cupboard & Shelf or current Officer in possession.
            </p>

            <div className="relative">
              <Search className="w-5 h-5 text-indigo-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Try searching 'Employee Service Record', 'FILE-1024', 'Land Acquisition', 'Audit'..."
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
              />
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
              <span className="text-slate-400">Quick Searches:</span>
              {['Employee Service Record 1024', 'FILE-1025', 'Land Acquisition Deed', 'State Vigilance'].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setSearchQuery(q)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Search Result Cards (Matches format from prompt) */}
          {searchQuery.trim() ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
                <span>Search Results ({searchResults.length})</span>
                <span>Sorted by relevance</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 text-sm">No Exact Match for "{searchQuery}"</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    The query did not match active registered files. Check the spelling or browse through the File Catalog.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map((file) => {
                    const isAvailable = file.status === 'IN_SHELF';
                    const isWithMe = file.currentOfficerId === activeOfficer.id;
                    const isWithOther = file.status === 'WITH_OFFICER' && !isWithMe;
                    const isInTransit = file.status === 'IN_TRANSIT';

                    return (
                      <div
                        key={file.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-indigo-300 transition-all"
                      >
                        <div>
                          {/* File Header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                                {file.id}
                              </span>
                              <h4 className="font-bold text-base text-slate-900 mt-1">
                                {file.name}
                              </h4>
                            </div>

                            <span
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase border shrink-0 ${
                                isAvailable
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isWithMe
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : isInTransit
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {isAvailable
                                ? 'Available in Shelf'
                                : isWithMe
                                ? 'On Your Desk'
                                : isInTransit
                                ? 'In Transit'
                                : `With ${file.currentOfficerId || 'Officer'}`}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 mb-3">{file.description}</p>

                          {/* Location Card Display matching user spec */}
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              Current Physical Location
                            </div>

                            {isAvailable && (
                              <div className="space-y-1">
                                <div className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4 text-emerald-600" />
                                  {storage.getLocationBreadcrumb(file.currentShelfId)}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Home Shelf: {storage.getLocationBreadcrumb(file.homeShelfId)}
                                </div>
                              </div>
                            )}

                            {isWithMe && (
                              <div className="space-y-1 text-indigo-950">
                                <div className="font-bold text-sm flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                  Currently on your desk ({activeOfficer.deskNumber})
                                </div>
                                <div className="text-[11px] text-indigo-700">
                                  Received: {file.officerReceivedAt ? new Date(file.officerReceivedAt).toLocaleString() : 'Active'}
                                </div>
                              </div>
                            )}

                            {isWithOther && (
                              <div className="space-y-1 text-rose-950">
                                <div className="font-bold text-sm flex items-center gap-1.5">
                                  <UserCheck className="w-4 h-4 text-rose-600" />
                                  Officer: {file.currentOfficerName} ({file.currentOfficerId})
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Department: {file.currentOfficerDept}
                                </div>
                              </div>
                            )}

                            {isInTransit && (
                              <div className="space-y-1 text-amber-950">
                                <div className="font-bold text-sm flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-amber-600" />
                                  In Transit with {file.currentAttenderName} ({file.currentAttenderId})
                                </div>
                                <div className="text-[11px] text-amber-800">
                                  Moving from: {file.inTransitFrom}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            Last Scanned: {new Date(file.lastScannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          <div className="flex gap-2">
                            {isWithMe && (
                              <button
                                type="button"
                                onClick={() => handleOfficerRelease(file)}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Finish & Release
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setPrintModal({
                                  isOpen: true,
                                  type: 'FILE_DOUBLE_QR',
                                  file,
                                })
                              }
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              View QRs
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="font-bold text-slate-700 text-sm">Enter search term above</div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Search to inspect real-time Cupboard, Shelf, or Officer custody locations.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. MY DESK FILES TAB */}
      {activeTab === 'MY_FILES' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Files Currently in Your Possession
                </h3>
                <p className="text-xs text-slate-500">
                  These physical dossiers are checked out under Officer {activeOfficer.id}. When done, release them so an attender can return them to the shelf.
                </p>
              </div>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                {myDeskFiles.length} dockets on desk
              </span>
            </div>
          </div>

          {myDeskFiles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">No files currently on desk</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                When an attender scans your Officer QR + File FRONT QR, the received file will automatically appear here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myDeskFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                        {file.id}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                        ACTIVE IN DESK
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-slate-900">{file.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{file.description}</p>

                    <div className="my-3 p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Received At:</span>
                        <span className="font-semibold text-slate-800">
                          {file.officerReceivedAt ? new Date(file.officerReceivedAt).toLocaleString() : 'Today'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Home Shelf:</span>
                        <span className="font-semibold text-slate-800">
                          {storage.getLocationBreadcrumb(file.homeShelfId)}
                        </span>
                      </div>

                      {/* Shelf / Cupboard Placement Verification Status */}
                      <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Placement Check:</span>
                        {storage.isFilePlacedInShelfOrCupboard(file.id) ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Placed in Shelf
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Not in Shelf (On Desk)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setPrintModal({
                          isOpen: true,
                          type: 'FILE_DOUBLE_QR',
                          file,
                        })
                      }
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Inspect File QRs
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOfficerRelease(file)}
                      title="Checks if file is placed in cupboard/shelf before removing from desk"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Finish & Release Back
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. MY OFFICER QR CODE BADGE */}
      {activeTab === 'MY_QR' && (
        <div className="max-w-md mx-auto bg-white rounded-3xl border-2 border-indigo-600 shadow-xl p-6 text-center space-y-4">
          <div className="inline-block text-xs font-extrabold text-indigo-700 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            OFFICER VERIFICATION BADGE
          </div>

          <h3 className="text-xl font-extrabold text-slate-900">{activeOfficer.name}</h3>
          <div className="text-xs font-semibold text-indigo-600">{activeOfficer.designation}</div>
          <div className="text-xs text-slate-500">{activeOfficer.department} • {activeOfficer.deskNumber}</div>

          <div className="py-2 flex justify-center">
            <QRCodeView
              value={encodeOfficerQR(activeOfficer.id)}
              size={190}
              label={activeOfficer.id}
              subLabel={encodeOfficerQR(activeOfficer.id)}
              badge="Official Scanning QR"
              badgeColor="indigo"
              className="border-2 border-indigo-100 shadow-md"
            />
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
              Physical Handover Protocol
            </div>
            <div>
              <strong>1. Receiving a File:</strong> Attender scans your badge QR, then scans the file's <strong className="text-emerald-700">FRONT/KEEP QR</strong>.
            </div>
            <div>
              <strong>2. Releasing a File:</strong> Attender scans your badge QR, then scans the file's <strong className="text-amber-700">BACK/TAKE QR</strong>.
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setPrintModal({
                isOpen: true,
                type: 'OFFICER_BADGE',
                officer: activeOfficer,
              })
            }
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Print Physical Officer Badge
          </button>
        </div>
      )}

      {/* 4. OFFICER QR GENERATOR (Permission-controlled by Admin) */}
      {activeTab === 'QR_GENERATOR' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-base text-slate-900">
                Officer QR Barcode Generator
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Authorized officers can quickly generate and print Cupboard/Shelf QRs or File Keep/Take stickers.
            </p>
          </div>

          {!canGenerate ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <strong>Permission Restricted:</strong> Your officer profile does not currently have QR generation privileges. Please contact the System Admin.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Barcode Type to Generate:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setGenTarget('FILE_KEEP')}
                      className={`p-2.5 rounded-xl text-xs font-bold text-center cursor-pointer transition-all border ${
                        genTarget === 'FILE_KEEP'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      File KEEP (Front)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenTarget('FILE_TAKE')}
                      className={`p-2.5 rounded-xl text-xs font-bold text-center cursor-pointer transition-all border ${
                        genTarget === 'FILE_TAKE'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      File TAKE (Back)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenTarget('SHELF')}
                      className={`p-2.5 rounded-xl text-xs font-bold text-center cursor-pointer transition-all border ${
                        genTarget === 'SHELF'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Shelf QR
                    </button>
                  </div>
                </div>

                {genTarget.startsWith('FILE') ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Select Physical File:
                    </label>
                    <select
                      value={genFileId}
                      onChange={(e) => setGenFileId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    >
                      {files.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.id} - {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Select Shelf Location:
                    </label>
                    <select
                      value={genShelfId}
                      onChange={(e) => setGenShelfId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                    >
                      {shelves.map((s) => (
                        <option key={s.id} value={s.id}>
                          {storage.getLocationBreadcrumb(s.id)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* QR Preview Box */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                {genTarget === 'FILE_KEEP' && (
                  <QRCodeView
                    value={encodeFileKeepQR(genFileId)}
                    size={160}
                    label={`FRONT / KEEP QR: ${genFileId}`}
                    subLabel={encodeFileKeepQR(genFileId)}
                    badge="FRONT STICKER"
                    badgeColor="emerald"
                  />
                )}
                {genTarget === 'FILE_TAKE' && (
                  <QRCodeView
                    value={encodeFileTakeQR(genFileId)}
                    size={160}
                    label={`BACK / TAKE QR: ${genFileId}`}
                    subLabel={encodeFileTakeQR(genFileId)}
                    badge="BACK STICKER"
                    badgeColor="amber"
                  />
                )}
                {genTarget === 'SHELF' && (
                  <QRCodeView
                    value={encodeLocationQR(genShelfId)}
                    size={160}
                    label={`LOCATION: ${genShelfId}`}
                    subLabel={storage.getLocationBreadcrumb(genShelfId)}
                    badge="SHELF BARCODE"
                    badgeColor="blue"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Print Label Sheet Modal */}
      <PrintLabelsModal
        isOpen={printModal.isOpen}
        onClose={() => setPrintModal((prev) => ({ ...prev, isOpen: false }))}
        type={printModal.type}
        file={printModal.file}
        shelf={printModal.shelf}
        officer={printModal.officer}
      />

      {/* CUPBOARD / SHELF PLACEMENT CHECK MODAL */}
      {placementCheckFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                  Physical Placement Required
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  File Not Placed in Cupboard / Shelf
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Docket: {placementCheckFile.id} • {placementCheckFile.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPlacementCheckFile(null);
                  setActionAlert({
                    type: 'error',
                    message: `Release blocked: File "${placementCheckFile.id}" has not been placed into any cupboard/shelf and remains on your desk.`,
                  });
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1.5">
              <div className="font-extrabold flex items-center gap-1.5">
                <span>⛔ Rule Enforced: Cannot Remove From Desk</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                This file is currently physically on your desk. It <strong>cannot be removed from your desk</strong> until it is deposited into a registered cupboard and shelf.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  On Desk ({activeOfficer.deskNumber})
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Designated Home Shelf:</span>
                <span className="font-semibold text-slate-800">
                  {storage.getLocationBreadcrumb(placementCheckFile.homeShelfId)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-700">
                Select Destination Cupboard / Shelf:
              </label>
              <select
                value={selectedShelfId}
                onChange={(e) => setSelectedShelfId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {shelves.map((s) => (
                  <option key={s.id} value={s.id}>
                    {storage.getLocationBreadcrumb(s.id)} ({s.code}){' '}
                    {s.id === placementCheckFile.homeShelfId ? '★ (Home)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Confirm the shelf where this file is placed to complete release and remove from desk.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const targetFile = placementCheckFile;
                  setPlacementCheckFile(null);
                  setActionAlert({
                    type: 'error',
                    message: `Release cancelled: File "${targetFile.id}" was not placed into any cupboard/shelf and remains on your desk.`,
                  });
                }}
                className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Keep on My Desk
              </button>

              <button
                type="button"
                onClick={() => {
                  const outcome = storage.placeFileIntoShelf(
                    placementCheckFile.id,
                    selectedShelfId,
                    activeOfficer.id
                  );
                  setPlacementCheckFile(null);
                  if (outcome.success) {
                    setActionAlert({
                      type: 'success',
                      message: outcome.message,
                    });
                  } else {
                    setActionAlert({ type: 'error', message: outcome.message });
                  }
                  setTimeout(() => setActionAlert(null), 5000);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify Placement in Shelf & Release</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
