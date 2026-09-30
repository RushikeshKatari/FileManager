import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Layers,
  Users,
  QrCode,
  Search,
  Plus,
  Printer,
  Archive,
  ArrowRight,
  TrendingUp,
  Clock,
  Shield,
  FileCheck2,
  AlertCircle,
  Eye,
  Filter,
  RefreshCw,
  FolderOpen,
  Edit2,
  Trash2,
  Building,
  Check,
} from 'lucide-react';
import { storage } from '../../services/storage';
import { PhysicalFile, Shelf, Cupboard, Room, Officer, Attender } from '../../types';
import { QRCodeView } from '../common/QRCodeView';
import { PrintLabelsModal } from '../common/PrintLabelsModal';
import { MovementHistoryTable } from '../audit/MovementHistoryTable';
import {
  encodeFileKeepQR,
  encodeFileTakeQR,
  encodeLocationQR,
  encodeCupboardQR,
  encodeRoomQR,
  encodeOfficerQR,
  encodeAttenderQR,
} from '../../utils/qrUtils';

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MONITORING' | 'LOCATIONS' | 'FILES' | 'OFFICERS' | 'ATTENDERS' | 'AUDIT'>(() => {
    try {
      const saved = localStorage.getItem('pfts_admin_tab');
      if (saved && ['MONITORING', 'LOCATIONS', 'FILES', 'OFFICERS', 'ATTENDERS', 'AUDIT'].includes(saved)) {
        return saved as any;
      }
    } catch (_) {}
    return 'LOCATIONS';
  });

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('pfts_admin_tab', tab);
    } catch (_) {}
  };

  const [, setTick] = useState(0);

  // Subscribe to storage changes in-place so tab state and inputs are never reset
  useEffect(() => {
    return storage.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, []);
  
  // Storage state getters
  const stats = storage.getDashboardStats();
  const files = storage.getFiles();
  const rooms = storage.getRooms();
  const cupboards = storage.getCupboards();
  const shelves = storage.getShelves();
  const officers = storage.getOfficers();
  const attenders = storage.getAttenders();
  const movements = storage.getMovements();

  // Search & Filter state for Monitoring Inventory
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [selectedFileForAudit, setSelectedFileForAudit] = useState<string | null>(null);

  // Label Printing Modal
  const [printModal, setPrintModal] = useState<{
    isOpen: boolean;
    type: 'FILE_DOUBLE_QR' | 'SHELF_LABELS' | 'CUPBOARD_LABEL' | 'ROOM_LABEL' | 'OFFICER_BADGE' | 'ATTENDER_BADGE';
    file?: PhysicalFile;
    shelf?: Shelf;
    cupboard?: Cupboard;
    room?: Room;
    officer?: Officer;
    attender?: Attender;
  }>({
    isOpen: false,
    type: 'FILE_DOUBLE_QR',
  });

  // Location Edit & Action State (Rooms and Cupboards only; Shelves have no edit)
  const [editingNode, setEditingNode] = useState<{
    type: 'ROOM' | 'CUPBOARD';
    id: string;
    name: string;
    code: string;
    building?: string;
    floor?: string;
    description?: string;
    capacity?: number;
    parentId?: string;
  } | null>(null);

  // In-UI Delete Confirmation State (No window.confirm!)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'ROOM' | 'CUPBOARD' | 'SHELF';
    id: string;
    name: string;
    code: string;
    filesCount: number;
    cupboardsCount?: number;
    shelvesCount?: number;
  } | null>(null);

  const [deleteOption, setDeleteOption] = useState<'REASSIGN' | 'FORCE' | 'DELETE_FILES'>('REASSIGN');
  const [reassignDestinationShelfId, setReassignDestinationShelfId] = useState<string>('');

  const [locationActionFeedback, setLocationActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Creation Modals
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [showAddOfficerModal, setShowAddOfficerModal] = useState(false);
  const [showAddAttenderModal, setShowAddAttenderModal] = useState(false);

  // Dedicated Hierarchy Creation Modals:
  // 1. Top Add Room Modal
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCode, setNewRoomCode] = useState('');
  const [newRoomBuilding, setNewRoomBuilding] = useState('Main Block');
  const [newRoomFloor, setNewRoomFloor] = useState('Ground Floor');
  const [newRoomDesc, setNewRoomDesc] = useState('');

  // 2. Add Cupboard to specific room
  const [addingCupboardToRoom, setAddingCupboardToRoom] = useState<Room | null>(null);
  const [newCupboardName, setNewCupboardName] = useState('');
  const [newCupboardCode, setNewCupboardCode] = useState('');
  const [newCupboardCapacity, setNewCupboardCapacity] = useState(60);

  // 3. Add Shelf to specific cupboard
  const [addingShelfToCupboard, setAddingShelfToCupboard] = useState<{ cupboard: Cupboard; roomName: string } | null>(null);
  const [newShelfName, setNewShelfName] = useState('');
  const [newShelfCode, setNewShelfCode] = useState('');
  const [newShelfCapacity, setNewShelfCapacity] = useState(20);

  // New File Form
  const [newFileId, setNewFileId] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileCat, setNewFileCat] = useState('Personnel');
  const [newFilePriority, setNewFilePriority] = useState<'NORMAL' | 'URGENT' | 'CONFIDENTIAL' | 'HIGH'>('NORMAL');
  const [newFileShelf, setNewFileShelf] = useState(shelves[0]?.id || 'SHELF-04-02');
  const [fileFormError, setFileFormError] = useState<string | null>(null);

  // New Officer Form
  const [newOffId, setNewOffId] = useState('');
  const [newOffName, setNewOffName] = useState('');
  const [newOffDept, setNewOffDept] = useState('Accounts');
  const [newOffDesig, setNewOffDesig] = useState('Senior Executive');
  const [newOffDesk, setNewOffDesk] = useState('Desk 301, 3rd Floor');

  // New Attender Form
  const [newAttId, setNewAttId] = useState('');
  const [newAttName, setNewAttName] = useState('');
  const [newAttZone, setNewAttZone] = useState('Zone A (Rooms 01 & 02)');

  // Filtered files for monitoring
  const filteredFiles = files.filter((f) => {
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (departmentFilter !== 'ALL' && f.category !== departmentFilter) return false;
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    const locBreadcrumb = storage.getLocationBreadcrumb(f.currentShelfId).toLowerCase();
    const officerName = (f.currentOfficerName || '').toLowerCase();
    const attenderName = (f.currentAttenderName || '').toLowerCase();

    return (
      f.id.toLowerCase().includes(term) ||
      f.name.toLowerCase().includes(term) ||
      locBreadcrumb.includes(term) ||
      officerName.includes(term) ||
      attenderName.includes(term) ||
      f.category.toLowerCase().includes(term)
    );
  });

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    setFileFormError(null);
    try {
      if (!newFileName.trim()) throw new Error('File name is required');
      const created = storage.addFile({
        id: newFileId.trim() || undefined,
        name: newFileName.trim(),
        category: newFileCat,
        priority: newFilePriority,
        shelfId: newFileShelf,
      });

      setShowAddFileModal(false);
      setNewFileId('');
      setNewFileName('');
      // Open print modal immediately for the new file stickers
      setPrintModal({
        isOpen: true,
        type: 'FILE_DOUBLE_QR',
        file: created,
      });
    } catch (err: any) {
      setFileFormError(err.message || 'Failed to create file');
    }
  };

  // Dedicated Room Creation Handler
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      const codeToUse = newRoomCode.trim() || `ROOM-0${rooms.length + 1}`;
      storage.addRoom({
        name: newRoomName.trim(),
        code: codeToUse,
        building: newRoomBuilding.trim() || 'Main Block',
        floor: newRoomFloor.trim() || 'Ground Floor',
        description: newRoomDesc.trim(),
      });

      setShowAddRoomModal(false);
      setNewRoomName('');
      setNewRoomCode('');
      setNewRoomDesc('');
      handleTabChange('LOCATIONS');
      setLocationActionFeedback({
        type: 'success',
        message: `Room "${newRoomName.trim()}" created successfully! Click "+ Add Cupboard" on the room card to add cupboards.`,
      });
      setTimeout(() => setLocationActionFeedback(null), 5000);
    } catch (err: any) {
      setLocationActionFeedback({
        type: 'error',
        message: err.message || 'Failed to create room',
      });
    }
  };

  // Dedicated Cupboard Creation Handler
  const handleCreateCupboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingCupboardToRoom || !newCupboardName.trim()) return;

    try {
      const roomCupboards = cupboards.filter((c) => c.roomId === addingCupboardToRoom.id);
      const codeToUse = newCupboardCode.trim() || `CUP-0${cupboards.length + 1}`;
      storage.addCupboard({
        roomId: addingCupboardToRoom.id,
        name: newCupboardName.trim(),
        code: codeToUse,
        capacity: Number(newCupboardCapacity) || 60,
      });

      const parentRoomName = addingCupboardToRoom.name;
      setAddingCupboardToRoom(null);
      setNewCupboardName('');
      setNewCupboardCode('');
      handleTabChange('LOCATIONS');
      setLocationActionFeedback({
        type: 'success',
        message: `Cupboard "${newCupboardName.trim()}" added to ${parentRoomName}! Click "+ Add Shelf" to add shelves.`,
      });
      setTimeout(() => setLocationActionFeedback(null), 5000);
    } catch (err: any) {
      setLocationActionFeedback({
        type: 'error',
        message: err.message || 'Failed to create cupboard',
      });
    }
  };

  // Dedicated Shelf Creation Handler
  const handleCreateShelf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingShelfToCupboard || !newShelfName.trim()) return;

    try {
      const parentCup = addingShelfToCupboard.cupboard;
      const cupCodeClean = (parentCup.code || parentCup.id).replace('CUP-', '').replace(/[^0-9a-zA-Z]/g, '');
      const existingShelves = shelves.filter((s) => s.cupboardId === parentCup.id);
      const codeToUse = newShelfCode.trim() || `SHELF-${cupCodeClean}-0${existingShelves.length + 1}`;

      storage.addShelf({
        cupboardId: parentCup.id,
        roomId: parentCup.roomId,
        name: newShelfName.trim(),
        code: codeToUse,
        capacity: Number(newShelfCapacity) || 20,
      });

      const parentCupName = parentCup.name;
      setAddingShelfToCupboard(null);
      setNewShelfName('');
      setNewShelfCode('');
      handleTabChange('LOCATIONS');
      setLocationActionFeedback({
        type: 'success',
        message: `Shelf "${newShelfName.trim()}" added to ${parentCupName}! QR barcode is ready for scanning and printing.`,
      });
      setTimeout(() => setLocationActionFeedback(null), 5000);
    } catch (err: any) {
      setLocationActionFeedback({
        type: 'error',
        message: err.message || 'Failed to create shelf',
      });
    }
  };

  const handleCreateOfficer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOffName.trim()) return;
    const off = storage.addOfficer({
      id: newOffId.trim() || undefined,
      name: newOffName.trim(),
      department: newOffDept,
      designation: newOffDesig,
      email: `${newOffName.toLowerCase().replace(/\s+/g, '.')}@dept.gov.in`,
      deskNumber: newOffDesk,
      canGenerateQRs: true,
    });
    setShowAddOfficerModal(false);
    setNewOffId('');
    setNewOffName('');
    setPrintModal({
      isOpen: true,
      type: 'OFFICER_BADGE',
      officer: off,
    });
  };

  const handleCreateAttender = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttName.trim()) return;
    const att = storage.addAttender({
      id: newAttId.trim() || undefined,
      name: newAttName.trim(),
      assignedZone: newAttZone,
      shift: 'GENERAL',
    });
    setShowAddAttenderModal(false);
    setNewAttId('');
    setNewAttName('');
    setPrintModal({
      isOpen: true,
      type: 'ATTENDER_BADGE',
      attender: att,
    });
  };

  // Location Hierarchy Edit & Delete Handlers
  const handleStartEditRoom = (room: Room) => {
    setEditingNode({
      type: 'ROOM',
      id: room.id,
      name: room.name,
      code: room.code,
      building: room.building || '',
      floor: room.floor || '',
      description: room.description || '',
    });
  };

  const handleStartEditCupboard = (cupboard: Cupboard) => {
    setEditingNode({
      type: 'CUPBOARD',
      id: cupboard.id,
      name: cupboard.name,
      code: cupboard.code,
      parentId: cupboard.roomId,
      capacity: cupboard.capacity || 60,
    });
  };

  const handleSaveEditNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode || !editingNode.name.trim()) return;

    try {
      if (editingNode.type === 'ROOM') {
        storage.updateRoom(editingNode.id, {
          name: editingNode.name.trim(),
          code: editingNode.code.trim(),
          building: editingNode.building?.trim(),
          floor: editingNode.floor?.trim(),
          description: editingNode.description?.trim(),
        });
        setLocationActionFeedback({
          type: 'success',
          message: `Room "${editingNode.name}" updated successfully!`,
        });
      } else if (editingNode.type === 'CUPBOARD') {
        storage.updateCupboard(editingNode.id, {
          name: editingNode.name.trim(),
          code: editingNode.code.trim(),
          roomId: editingNode.parentId,
          capacity: Number(editingNode.capacity) || 60,
        });
        setLocationActionFeedback({
          type: 'success',
          message: `Cupboard "${editingNode.name}" updated successfully!`,
        });
      }
      setEditingNode(null);
      handleTabChange('LOCATIONS');
      setTimeout(() => setLocationActionFeedback(null), 4000);
    } catch (err: any) {
      setLocationActionFeedback({
        type: 'error',
        message: err.message || 'Failed to update location node',
      });
    }
  };

  const handleOpenDeleteRoom = (room: Room) => {
    const filesInside = storage.getFilesInRoom(room.id);
    const cupsInside = cupboards.filter((c) => c.roomId === room.id);
    const childShelves = shelves.filter((s) => cupsInside.some((c) => c.id === s.cupboardId) || s.roomId === room.id);
    const otherShelves = shelves.filter((s) => !childShelves.some((cs) => cs.id === s.id));

    setDeleteTarget({
      type: 'ROOM',
      id: room.id,
      name: room.name,
      code: room.code,
      filesCount: filesInside.length,
      cupboardsCount: cupsInside.length,
      shelvesCount: childShelves.length,
    });
    setDeleteOption(filesInside.length > 0 && otherShelves.length > 0 ? 'REASSIGN' : 'FORCE');
    setReassignDestinationShelfId(otherShelves[0]?.id || '');
  };

  const handleOpenDeleteCupboard = (cupboard: Cupboard) => {
    const filesInside = storage.getFilesInCupboard(cupboard.id);
    const childShelves = shelves.filter((s) => s.cupboardId === cupboard.id);
    const otherShelves = shelves.filter((s) => s.cupboardId !== cupboard.id);

    setDeleteTarget({
      type: 'CUPBOARD',
      id: cupboard.id,
      name: cupboard.name,
      code: cupboard.code,
      filesCount: filesInside.length,
      shelvesCount: childShelves.length,
    });
    setDeleteOption(filesInside.length > 0 && otherShelves.length > 0 ? 'REASSIGN' : 'FORCE');
    setReassignDestinationShelfId(otherShelves[0]?.id || '');
  };

  const handleOpenDeleteShelf = (shelf: Shelf) => {
    const filesInside = storage.getFilesInShelf(shelf.id);
    const otherShelves = shelves.filter((s) => s.id !== shelf.id);

    setDeleteTarget({
      type: 'SHELF',
      id: shelf.id,
      name: shelf.name,
      code: shelf.code,
      filesCount: filesInside.length,
    });
    setDeleteOption(filesInside.length > 0 && otherShelves.length > 0 ? 'REASSIGN' : 'FORCE');
    setReassignDestinationShelfId(otherShelves[0]?.id || '');
  };

  const handleExecuteDelete = () => {
    if (!deleteTarget) return;

    let res: { success: boolean; error?: string };
    const opts = {
      reassignToShelfId: deleteOption === 'REASSIGN' ? reassignDestinationShelfId : undefined,
      force: deleteOption === 'FORCE',
      deleteFiles: deleteOption === 'DELETE_FILES',
    };

    if (deleteTarget.type === 'ROOM') {
      res = storage.deleteRoom(deleteTarget.id, opts);
    } else if (deleteTarget.type === 'CUPBOARD') {
      res = storage.deleteCupboard(deleteTarget.id, opts);
    } else {
      res = storage.deleteShelf(deleteTarget.id, opts);
    }

    if (res.success) {
      setLocationActionFeedback({
        type: 'success',
        message: `${deleteTarget.type === 'ROOM' ? 'Room' : deleteTarget.type === 'CUPBOARD' ? 'Cupboard' : 'Shelf'} "${deleteTarget.name}" deleted successfully!`,
      });
    } else {
      setLocationActionFeedback({
        type: 'error',
        message: res.error || 'Failed to delete location node',
      });
    }

    setDeleteTarget(null);
    setTimeout(() => setLocationActionFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Tab Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                Central Admin Control
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                System Administration & Inventory
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Master control panel for physical location hierarchy, dual-QR generation, officer & attender credentials, and real-time inventory monitoring
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddFileModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register New File
            </button>
            <button
              onClick={() => {
                handleTabChange('LOCATIONS');
                setShowAddRoomModal(true);
                setNewRoomName('');
                setNewRoomBuilding('Main Block');
                setNewRoomFloor('Ground Floor');
                setNewRoomDesc('');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Room
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pt-1">
          <button
            onClick={() => handleTabChange('MONITORING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'MONITORING'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Monitoring Dashboard
          </button>
          <button
            onClick={() => handleTabChange('LOCATIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'LOCATIONS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Location Hierarchy ({shelves.length} Shelves)
          </button>
          <button
            onClick={() => handleTabChange('FILES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'FILES'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            File QR Catalog ({files.length})
          </button>
          <button
            onClick={() => handleTabChange('OFFICERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'OFFICERS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Officers ({officers.length})
          </button>
          <button
            onClick={() => handleTabChange('ATTENDERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ATTENDERS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Attenders ({attenders.length})
          </button>
          <button
            onClick={() => handleTabChange('AUDIT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'AUDIT'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Movement History ({movements.length})
          </button>
        </div>
      </div>

      {/* 1. MONITORING DASHBOARD (matches prompt specification: Total Files, In Shelves, With Officers, Currently Moving) */}
      {activeTab === 'MONITORING' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Files
                </div>
                <div className="text-3xl font-extrabold text-slate-900 mt-1 font-mono">
                  {stats.totalFiles.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <span>Across {stats.totalRooms} rooms & {stats.totalCupboards} cupboards</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <FolderOpen className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm flex items-center justify-between bg-gradient-to-br from-white to-emerald-50/40">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  In Shelves (Available)
                </div>
                <div className="text-3xl font-extrabold text-emerald-700 mt-1 font-mono">
                  {stats.inShelves.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-600 mt-1 font-medium">
                  {Math.round((stats.inShelves / (stats.totalFiles || 1)) * 100)}% of total inventory
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Archive className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-indigo-200 shadow-sm flex items-center justify-between bg-gradient-to-br from-white to-indigo-50/40">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  With Officers
                </div>
                <div className="text-3xl font-extrabold text-indigo-700 mt-1 font-mono">
                  {stats.withOfficers.toLocaleString()}
                </div>
                <div className="text-[11px] text-indigo-600 mt-1 font-medium">
                  Active desk examination
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm flex items-center justify-between bg-gradient-to-br from-white to-amber-50/40">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Currently Moving
                </div>
                <div className="text-3xl font-extrabold text-amber-700 mt-1 font-mono">
                  {stats.currentlyMoving.toLocaleString()}
                </div>
                <div className="text-[11px] text-amber-600 mt-1 font-medium">
                  In transit with attenders
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Searchable Real-Time Inventory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/60">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Live Physical File Tracker</h3>
                  <p className="text-xs text-slate-500">
                    Search by File Name, ID, Officer, Attender, Cupboard, Shelf, or Status
                  </p>
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  Showing {filteredFiles.length} of {files.length} physical dossiers
                </div>
              </div>

              {/* Filters */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search file name, ID, room, shelf, officer..."
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Physical Statuses</option>
                    <option value="IN_SHELF">In Shelves (Available)</option>
                    <option value="WITH_OFFICER">With Officer (Desk)</option>
                    <option value="IN_TRANSIT">In Transit (Moving)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Departments / Categories</option>
                    <option value="Personnel">Personnel</option>
                    <option value="Finance">Finance</option>
                    <option value="Legal">Legal</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Vigilance">Vigilance</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">File ID & Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Current Physical Location</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Scanned</th>
                    <th className="py-3 px-4">Audit Moves</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFiles.map((file) => {
                    return (
                      <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-indigo-700 bg-indigo-50 inline-block px-1.5 py-0.5 rounded text-xs border border-indigo-200 mb-0.5">
                            {file.id}
                          </div>
                          <div className="font-semibold text-slate-900 max-w-xs truncate">
                            {file.name}
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-slate-600 font-medium">{file.category}</span>
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                            {file.priority}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {file.status === 'IN_SHELF' && (
                            <div className="font-medium text-slate-800">
                              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                              {storage.getLocationBreadcrumb(file.currentShelfId)}
                            </div>
                          )}

                          {file.status === 'WITH_OFFICER' && (
                            <div className="font-medium text-indigo-900 bg-indigo-50/80 px-2 py-1 rounded-lg border border-indigo-200 inline-block">
                              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mr-1.5" />
                              With {file.currentOfficerName || file.currentOfficerId}
                              <div className="text-[10px] text-indigo-600 font-normal">
                                {file.currentOfficerDept}
                              </div>
                            </div>
                          )}

                          {file.status === 'IN_TRANSIT' && (
                            <div className="font-medium text-amber-900 bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200 inline-block">
                              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
                              Transit: {file.currentAttenderName || 'Attender'}
                              <div className="text-[10px] text-amber-600 font-normal">
                                From: {file.inTransitFrom}
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {file.status === 'IN_SHELF' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              In Shelf
                            </span>
                          )}
                          {file.status === 'WITH_OFFICER' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                              With Officer
                            </span>
                          )}
                          {file.status === 'IN_TRANSIT' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Moving
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                          <div>{new Date(file.lastScannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="text-slate-400">{new Date(file.lastScannedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          {file.totalMovements} moves
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPrintModal({
                                isOpen: true,
                                type: 'FILE_DOUBLE_QR',
                                file,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 font-semibold cursor-pointer text-xs"
                          >
                            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                            Dual QRs
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFileForAudit(file.id);
                              setActiveTab('AUDIT');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer text-xs"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            History
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. LOCATION QR MANAGEMENT (Hierarchy: Room -> Cupboard -> Shelf) */}
      {activeTab === 'LOCATIONS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-base text-slate-900">Physical Location Hierarchy & Barcodes</h3>
              <p className="text-xs text-slate-500">
                Structure: Room ➔ Cupboard ➔ Shelf. Each node has an authentic physical QR barcode.
              </p>
            </div>
            {/* Top action: ONLY Add Room */}
            <button
              onClick={() => {
                setShowAddRoomModal(true);
                setNewRoomName('');
                setNewRoomCode('');
                setNewRoomBuilding('Main Block');
                setNewRoomFloor('Ground Floor');
                setNewRoomDesc('');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Room
            </button>
          </div>

          {locationActionFeedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
                locationActionFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{locationActionFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setLocationActionFeedback(null)}
                className="text-xs font-bold opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => {
              const roomCupboards = cupboards.filter((c) => c.roomId === room.id);
              return (
                <div key={room.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-slate-300 transition-all">
                  {/* Room Card Header with Room Info & Actions */}
                  <div className="p-4 bg-slate-900 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-indigo-300 font-bold border border-slate-700">
                            {room.code}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {roomCupboards.length} Cupboards
                          </span>
                        </div>
                        <h4 className="font-bold text-base mt-1 text-white">{room.name}</h4>
                        <p className="text-[11px] text-slate-400">{room.building || 'Main Block'} • {room.floor || 'Ground'}</p>
                        {room.description && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5 line-clamp-1">{room.description}</p>
                        )}
                      </div>

                      {/* Header quick tools: QR Signboard & Edit */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setPrintModal({
                              isOpen: true,
                              type: 'ROOM_LABEL',
                              room,
                            })
                          }
                          title="View & Print Room Barcode Signboard"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-lg transition-colors cursor-pointer border border-slate-700 text-xs flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-semibold">QR</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEditRoom(room)}
                          title="Edit Room Details"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>

                    {/* DEDICATED ROOM ACTION BAR: + Add Cupboard & Delete Room */}
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddingCupboardToRoom(room);
                          setNewCupboardName('');
                          setNewCupboardCode('');
                          setNewCupboardCapacity(60);
                        }}
                        title={`Add Cupboard inside ${room.name}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Cupboard</span>
                      </button>

                      {/* Clear, Prominent Delete Room Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteRoom(room)}
                        title={`Delete Room ${room.name}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs border border-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Room</span>
                      </button>
                    </div>
                  </div>

                  {/* Cupboards and Shelves */}
                  <div className="p-4 space-y-4 flex-1">
                    {roomCupboards.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-4">
                        No cupboards inside this room yet. Click the <strong>"+ Add Cupboard"</strong> button above to add one!
                      </div>
                    ) : (
                      roomCupboards.map((cupboard) => {
                        const cupShelves = shelves.filter((s) => s.cupboardId === cupboard.id);
                        return (
                          <div key={cupboard.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50/70">
                            {/* Cupboard Header with + Add Shelf, Edit & QR Actions */}
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                                <Archive className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{cupboard.name}</span>
                                <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                                  {cupboard.code}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                {/* + Add Shelf inside cupboard */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingShelfToCupboard({ cupboard, roomName: room.name });
                                    setNewShelfName('');
                                    setNewShelfCode('');
                                    setNewShelfCapacity(20);
                                  }}
                                  title={`Add Shelf inside ${cupboard.name}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-200 cursor-pointer transition-colors mr-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Shelf</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setPrintModal({
                                      isOpen: true,
                                      type: 'CUPBOARD_LABEL',
                                      cupboard,
                                    })
                                  }
                                  title="Print Cupboard Barcode Label"
                                  className="p-1 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded cursor-pointer transition-colors"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditCupboard(cupboard)}
                                  title="Edit Cupboard"
                                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteCupboard(cupboard)}
                                  title="Delete Cupboard"
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Shelves List */}
                            <div className="space-y-1.5 pl-2 border-l-2 border-indigo-200">
                              {cupShelves.length === 0 ? (
                                <div className="text-[11px] text-slate-400 italic py-1">
                                  No shelves in this cupboard yet. Click "+ Add Shelf" above to create one.
                                </div>
                              ) : (
                                cupShelves.map((shelf) => {
                                  const filesInShelf = files.filter(
                                    (f) => f.currentShelfId === shelf.id && f.status === 'IN_SHELF'
                                  );
                                  return (
                                    <div
                                      key={shelf.id}
                                      className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs hover:border-indigo-300 transition-colors"
                                    >
                                      <div>
                                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                          <span>{shelf.name}</span>
                                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                            {shelf.code}
                                          </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">
                                          Files inside: <strong className="text-slate-800">{filesInShelf.length}</strong> / {shelf.capacity || 20}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPrintModal({
                                              isOpen: true,
                                              type: 'SHELF_LABELS',
                                              shelf,
                                            })
                                          }
                                          title="View & Print Shelf QR"
                                          className="p-1 text-blue-700 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                                        >
                                          <QrCode className="w-3.5 h-3.5" />
                                        </button>
                                        {/* NO EDIT OPTION FOR SHELF UNIT AS REQUESTED */}
                                        <button
                                          type="button"
                                          onClick={() => handleOpenDeleteShelf(shelf)}
                                          title="Delete Shelf"
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Room Card Footer with Delete Room Option */}
                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 mt-auto">
                    <span className="font-medium text-[11px] text-slate-600">
                      {room.name} • {roomCupboards.length} cupboard(s)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteRoom(room)}
                      title={`Delete Room ${room.name}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Room</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. FILE QR CATALOG (Dual QR codes: FRONT KEEP / BACK TAKE) */}
      {activeTab === 'FILES' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Dual-QR Standard Implemented:</strong> Every file generated receives two distinct QR actions.
              The <strong>FRONT QR</strong> triggers <span className="font-bold text-emerald-800">KEEP / ADD / RESTOCK</span>.
              The <strong>BACK QR</strong> triggers <span className="font-bold text-amber-800">TAKE / REMOVE / RELEASE</span>.
              Attenders scan the back sticker when removing files, and front sticker when shelving or handing over.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                      {file.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        file.status === 'IN_SHELF'
                          ? 'bg-emerald-100 text-emerald-800'
                          : file.status === 'WITH_OFFICER'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {file.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mb-1">{file.name}</h4>
                  <div className="text-xs text-slate-500 mb-3">{file.category} • Priority: {file.priority}</div>

                  {/* Dual QR Mini View */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-emerald-700 uppercase mb-1">
                        FRONT (KEEP)
                      </div>
                      <QRCodeView
                        value={encodeFileKeepQR(file.id)}
                        size={80}
                        showActions={false}
                        className="p-1 border-0 shadow-none mx-auto"
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-amber-700 uppercase mb-1">
                        BACK (TAKE)
                      </div>
                      <QRCodeView
                        value={encodeFileTakeQR(file.id)}
                        size={80}
                        showActions={false}
                        className="p-1 border-0 shadow-none mx-auto"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1">
                    <div>Home Shelf: <strong className="text-slate-800">{storage.getLocationBreadcrumb(file.homeShelfId)}</strong></div>
                    <div>Movements: <strong className="text-slate-800">{file.totalMovements}</strong> recorded</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setPrintModal({
                        isOpen: true,
                        type: 'FILE_DOUBLE_QR',
                        file,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors cursor-pointer w-full justify-center"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Sticker Pair (Front & Back)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. OFFICERS MANAGEMENT */}
      {activeTab === 'OFFICERS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-base text-slate-900">Registered Departmental Officers</h3>
              <p className="text-xs text-slate-500">
                Authorized officers with unique identification QR codes for receiving and releasing physical dossiers
              </p>
            </div>
            <button
              onClick={() => setShowAddOfficerModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Officer Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {officers.map((officer) => (
              <div
                key={officer.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      {officer.id}
                    </span>
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {officer.activeFilesCount || 0} active files
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-slate-900">{officer.name}</h4>
                  <div className="text-xs font-semibold text-slate-700">{officer.designation}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{officer.department}</div>

                  <div className="my-3 p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                    <QRCodeView
                      value={encodeOfficerQR(officer.id)}
                      size={70}
                      showActions={false}
                      className="border-0 shadow-none p-0 bg-transparent"
                    />
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <div>Desk: <strong className="text-slate-800">{officer.deskNumber}</strong></div>
                      <div>QR: <span className="font-mono text-[10px] text-slate-600">{encodeOfficerQR(officer.id)}</span></div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPrintModal({
                      isOpen: true,
                      type: 'OFFICER_BADGE',
                      officer,
                    })
                  }
                  className="mt-2 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Official ID Badge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ATTENDERS MANAGEMENT */}
      {activeTab === 'ATTENDERS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-base text-slate-900">Physical Logistics Attenders</h3>
              <p className="text-xs text-slate-500">
                Designated staff responsible for physical movements between shelves and officer chambers
              </p>
            </div>
            <button
              onClick={() => setShowAddAttenderModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Attender Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {attenders.map((attender) => (
              <div
                key={attender.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                      {attender.id}
                    </span>
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      {attender.activeTransitCount || 0} in hand
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-slate-900">{attender.name}</h4>
                  <div className="text-xs text-slate-500 mt-0.5">{attender.assignedZone}</div>

                  <div className="my-3 p-3 bg-emerald-50/50 rounded-xl flex items-center gap-3 border border-emerald-100">
                    <QRCodeView
                      value={encodeAttenderQR(attender.id)}
                      size={70}
                      showActions={false}
                      className="border-0 shadow-none p-0 bg-transparent"
                    />
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <div>Shift: <strong className="text-slate-800">{attender.shift}</strong></div>
                      <div>QR: <span className="font-mono text-[10px] text-slate-600">{encodeAttenderQR(attender.id)}</span></div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPrintModal({
                      isOpen: true,
                      type: 'ATTENDER_BADGE',
                      attender,
                    })
                  }
                  className="mt-2 w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Attender Badge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. AUDIT TRAIL TAB */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          {selectedFileForAudit && (
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-xs text-indigo-900">
              <span>
                Filtered by File: <strong>{selectedFileForAudit}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedFileForAudit(null)}
                className="text-indigo-600 hover:text-indigo-900 font-semibold"
              >
                Clear Filter (Show All)
              </button>
            </div>
          )}

          <MovementHistoryTable
            records={movements}
            filterFileId={selectedFileForAudit || undefined}
            onSelectFile={(fId) => setSelectedFileForAudit(fId)}
          />
        </div>
      )}

      {/* CREATE FILE MODAL */}
      {showAddFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">Register New Physical File</h3>
            <p className="text-xs text-slate-500 mb-4">
              Registers new file record and generates both FRONT (Keep) and BACK (Take) QR stickers.
            </p>

            {fileFormError && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                {fileFormError}
              </div>
            )}

            <form onSubmit={handleCreateFile} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  File ID Code (Optional, auto-generated if blank)
                </label>
                <input
                  type="text"
                  value={newFileId}
                  onChange={(e) => setNewFileId(e.target.value)}
                  placeholder="e.g. FILE-1035"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  File Title / Docket Subject *
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. Land Acquisition Brief 2024-Q3"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newFileCat}
                    onChange={(e) => setNewFileCat(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Personnel">Personnel</option>
                    <option value="Finance">Finance</option>
                    <option value="Legal">Legal</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Vigilance">Vigilance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newFilePriority}
                    onChange={(e) => setNewFilePriority(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                    <option value="CONFIDENTIAL">Confidential</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Initial Stored Shelf Location *
                </label>
                <select
                  value={newFileShelf}
                  onChange={(e) => setNewFileShelf(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  {shelves.map((s) => (
                    <option key={s.id} value={s.id}>
                      {storage.getLocationBreadcrumb(s.id)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddFileModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Register & Generate QRs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. ADD ROOM MODAL (Triggered only from top "Add Room" button) */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                  Top Hierarchy Level
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">Add New Room</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRoomModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Create a new physical room or hall. Once created, you can use the <strong>"+ Add Cupboard"</strong> button on the room card to add cupboards.
            </p>

            <form onSubmit={handleCreateRoom} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Room Name / Title *
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Room 03 - Central Repository"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Room Code (Auto-suggested or Custom)
                </label>
                <input
                  type="text"
                  value={newRoomCode}
                  onChange={(e) => setNewRoomCode(e.target.value)}
                  placeholder={`e.g. ROOM-0${rooms.length + 1}`}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Building / Wing</label>
                  <input
                    type="text"
                    value={newRoomBuilding}
                    onChange={(e) => setNewRoomBuilding(e.target.value)}
                    placeholder="e.g. Main Block"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Floor Level</label>
                  <input
                    type="text"
                    value={newRoomFloor}
                    onChange={(e) => setNewRoomFloor(e.target.value)}
                    placeholder="e.g. Ground Floor"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="e.g. Secure physical archive for administrative dossiers and service books"
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADD CUPBOARD TO SPECIFIC ROOM MODAL */}
      {addingCupboardToRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                  Inside {addingCupboardToRoom.code}
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">Add Cupboard</h3>
              </div>
              <button
                type="button"
                onClick={() => setAddingCupboardToRoom(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs">
              <span className="text-slate-500">Target Room:</span>{' '}
              <strong className="text-slate-900">{addingCupboardToRoom.name}</strong> ({addingCupboardToRoom.code})
            </div>

            <form onSubmit={handleCreateCupboard} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cupboard Name *
                </label>
                <input
                  type="text"
                  value={newCupboardName}
                  onChange={(e) => setNewCupboardName(e.target.value)}
                  placeholder="e.g. Cupboard 05"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cupboard Code (Auto-suggested or Custom)
                </label>
                <input
                  type="text"
                  value={newCupboardCode}
                  onChange={(e) => setNewCupboardCode(e.target.value)}
                  placeholder={`e.g. CUP-0${cupboards.length + 1}`}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Total File Capacity
                </label>
                <input
                  type="number"
                  value={newCupboardCapacity}
                  onChange={(e) => setNewCupboardCapacity(Number(e.target.value))}
                  min={1}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddingCupboardToRoom(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Add Cupboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ADD SHELF TO SPECIFIC CUPBOARD MODAL */}
      {addingShelfToCupboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                  Inside {addingShelfToCupboard.cupboard.code}
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">Add Shelf</h3>
              </div>
              <button
                type="button"
                onClick={() => setAddingShelfToCupboard(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs">
              <span className="text-slate-500">Target Cupboard:</span>{' '}
              <strong className="text-slate-900">{addingShelfToCupboard.cupboard.name}</strong> ({addingShelfToCupboard.cupboard.code}) in <em>{addingShelfToCupboard.roomName}</em>
            </div>

            <form onSubmit={handleCreateShelf} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Shelf Name *
                </label>
                <input
                  type="text"
                  value={newShelfName}
                  onChange={(e) => setNewShelfName(e.target.value)}
                  placeholder="e.g. Shelf 01"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Shelf Code (Auto-suggested or Custom)
                </label>
                <input
                  type="text"
                  value={newShelfCode}
                  onChange={(e) => setNewShelfCode(e.target.value)}
                  placeholder={`e.g. SHELF-${addingShelfToCupboard.cupboard.code.replace('CUP-', '')}-01`}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Max File Capacity
                </label>
                <input
                  type="number"
                  value={newShelfCapacity}
                  onChange={(e) => setNewShelfCapacity(Number(e.target.value))}
                  min={1}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddingShelfToCupboard(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Add Shelf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE OFFICER MODAL */}
      {showAddOfficerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">Create Officer Profile</h3>
            <p className="text-xs text-slate-500 mb-4">
              Registers new officer and generates official verification QR badge.
            </p>

            <form onSubmit={handleCreateOfficer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Officer ID (Optional)</label>
                <input
                  type="text"
                  value={newOffId}
                  onChange={(e) => setNewOffId(e.target.value)}
                  placeholder="e.g. OFF-008"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newOffName}
                  onChange={(e) => setNewOffName(e.target.value)}
                  placeholder="e.g. Officer Sunita Rao"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newOffDept}
                    onChange={(e) => setNewOffDept(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={newOffDesig}
                    onChange={(e) => setNewOffDesig(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Desk / Chamber</label>
                <input
                  type="text"
                  value={newOffDesk}
                  onChange={(e) => setNewOffDesk(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddOfficerModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg cursor-pointer"
                >
                  Create & Print Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ATTENDER MODAL */}
      {showAddAttenderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">Create Attender Profile</h3>
            <p className="text-xs text-slate-500 mb-4">
              Registers logistics attender and generates scan badge.
            </p>

            <form onSubmit={handleCreateAttender} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attender ID (Optional)</label>
                <input
                  type="text"
                  value={newAttId}
                  onChange={(e) => setNewAttId(e.target.value)}
                  placeholder="e.g. ATT-004"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newAttName}
                  onChange={(e) => setNewAttName(e.target.value)}
                  placeholder="e.g. Attender Mohan Lal"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Zone</label>
                <input
                  type="text"
                  value={newAttZone}
                  onChange={(e) => setNewAttZone(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAttenderModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg cursor-pointer"
                >
                  Create & Print Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LOCATION NODE MODAL (Room / Cupboard) */}
      {editingNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                  Editing {editingNode.type}
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  Edit {editingNode.type === 'ROOM' ? 'Room Details' : 'Cupboard Unit'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingNode(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditNode} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Identifier / Code *
                </label>
                <input
                  type="text"
                  value={editingNode.code}
                  onChange={(e) => setEditingNode({ ...editingNode, code: e.target.value })}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={editingNode.name}
                  onChange={(e) => setEditingNode({ ...editingNode, name: e.target.value })}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {editingNode.type === 'ROOM' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Building / Wing</label>
                      <input
                        type="text"
                        value={editingNode.building || ''}
                        onChange={(e) => setEditingNode({ ...editingNode, building: e.target.value })}
                        placeholder="e.g. Block A"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Floor Level</label>
                      <input
                        type="text"
                        value={editingNode.floor || ''}
                        onChange={(e) => setEditingNode({ ...editingNode, floor: e.target.value })}
                        placeholder="e.g. 1st Floor"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Description / Purpose</label>
                    <textarea
                      value={editingNode.description || ''}
                      onChange={(e) => setEditingNode({ ...editingNode, description: e.target.value })}
                      placeholder="e.g. Active administrative records and personnel books"
                      rows={2}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {editingNode.type === 'CUPBOARD' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Parent Room</label>
                    <select
                      value={editingNode.parentId}
                      onChange={(e) => setEditingNode({ ...editingNode, parentId: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">File Capacity</label>
                    <input
                      type="number"
                      value={editingNode.capacity || 60}
                      onChange={(e) => setEditingNode({ ...editingNode, capacity: Number(e.target.value) })}
                      min={1}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const nodeToDelete = editingNode;
                    setEditingNode(null);
                    if (nodeToDelete.type === 'ROOM') {
                      const r = storage.getRoomById(nodeToDelete.id);
                      if (r) handleOpenDeleteRoom(r);
                    } else {
                      const c = storage.getCupboardById(nodeToDelete.id);
                      if (c) handleOpenDeleteCupboard(c);
                    }
                  }}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete {editingNode.type === 'ROOM' ? 'Room' : 'Cupboard'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingNode(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE LOCATION CONFIRMATION MODAL (No window.confirm!) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-mono uppercase bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold border border-rose-200">
                  Delete {deleteTarget.type}
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  Remove {deleteTarget.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">ID: {deleteTarget.code}</p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 my-4 text-xs text-slate-700">
              {deleteTarget.filesCount === 0 ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Zero Physical Files Attached
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    This location node is completely empty. It can be safely removed from the system hierarchy immediately.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    Contains {deleteTarget.filesCount} Physical File(s)
                  </div>
                  <p className="text-amber-800 text-[11px]">
                    To maintain physical audit integrity, select how to handle the files currently recorded in this location:
                  </p>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-amber-200 cursor-pointer hover:border-amber-300">
                      <input
                        type="radio"
                        name="delOption"
                        checked={deleteOption === 'REASSIGN'}
                        onChange={() => setDeleteOption('REASSIGN')}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">
                          Relocate files to another shelf (Recommended)
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Files remain safely tracked and their location is updated automatically.
                        </div>

                        {deleteOption === 'REASSIGN' && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100">
                            <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                              Choose Destination Shelf:
                            </label>
                            <select
                              value={reassignDestinationShelfId}
                              onChange={(e) => setReassignDestinationShelfId(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                            >
                              {shelves
                                .filter((s) => s.id !== deleteTarget.id)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {storage.getLocationBreadcrumb(s.id)} ({s.code})
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-amber-200 cursor-pointer hover:border-amber-300">
                      <input
                        type="radio"
                        name="delOption"
                        checked={deleteOption === 'FORCE'}
                        onChange={() => setDeleteOption('FORCE')}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">
                          Force delete location (Auto-reassign / mark in transit)
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Removes location and safely shifts files to the next available shelf in repository.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-rose-200 cursor-pointer hover:border-rose-300">
                      <input
                        type="radio"
                        name="delOption"
                        checked={deleteOption === 'DELETE_FILES'}
                        onChange={() => setDeleteOption('DELETE_FILES')}
                        className="mt-0.5 text-rose-600"
                      />
                      <div>
                        <div className="font-semibold text-rose-900">
                          Delete files along with this location
                        </div>
                        <div className="text-[11px] text-rose-700 mt-0.5">
                          Permanently removes both the location and the {deleteTarget.filesCount} file records.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {deleteTarget.cupboardsCount !== undefined && deleteTarget.cupboardsCount > 0 && (
                <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                  Hierarchy Note: All <strong>{deleteTarget.cupboardsCount} cupboard(s)</strong> and <strong>{deleteTarget.shelvesCount} shelf/shelves</strong> inside this room will also be removed.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Confirm Delete {deleteTarget.type}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT LABELS MODAL */}
      <PrintLabelsModal
        isOpen={printModal.isOpen}
        onClose={() => setPrintModal((prev) => ({ ...prev, isOpen: false }))}
        type={printModal.type}
        file={printModal.file}
        shelf={printModal.shelf}
        cupboard={printModal.cupboard}
        room={printModal.room}
        officer={printModal.officer}
        attender={printModal.attender}
      />
    </div>
  );
};
