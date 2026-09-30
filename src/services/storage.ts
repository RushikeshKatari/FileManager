import {
  Room,
  Cupboard,
  Shelf,
  PhysicalFile,
  Officer,
  Attender,
  MovementRecord,
  ActionType,
  ValidationOutcome,
} from '../types';
import { supabase } from '../lib/supabase';

const STORAGE_KEYS = {
  ROOMS: 'pfts_rooms_v1',
  CUPBOARDS: 'pfts_cupboards_v1',
  SHELVES: 'pfts_shelves_v1',
  FILES: 'pfts_files_v1',
  OFFICERS: 'pfts_officers_v1',
  ATTENDERS: 'pfts_attenders_v1',
  MOVEMENTS: 'pfts_movements_v1',
  INITIALIZED: 'pfts_initialized_v1',
};

// Initial Seed Data
const INITIAL_ROOMS: Room[] = [
  { id: 'ROOM-01', code: 'ROOM-01', name: 'Room 01 - Main Records Wing', building: 'Block A', floor: 'Ground Floor', description: 'Active administrative & personnel files' },
  { id: 'ROOM-02', code: 'ROOM-02', name: 'Room 02 - Central Archive', building: 'Block A', floor: '1st Floor', description: 'Legal, land records & audit dockets' },
  { id: 'ROOM-03', code: 'ROOM-03', name: 'Room 03 - Finance & Accounts Vault', building: 'Block B', floor: 'Ground Floor', description: 'Budgetary, paybills & tax records' },
];

const INITIAL_CUPBOARDS: Cupboard[] = [
  { id: 'CUP-01', roomId: 'ROOM-01', code: 'CUP-01', name: 'Cupboard 01', capacity: 60 },
  { id: 'CUP-02', roomId: 'ROOM-01', code: 'CUP-02', name: 'Cupboard 02', capacity: 60 },
  { id: 'CUP-03', roomId: 'ROOM-02', code: 'CUP-03', name: 'Cupboard 03', capacity: 75 },
  { id: 'CUP-04', roomId: 'ROOM-02', code: 'CUP-04', name: 'Cupboard 04', capacity: 75 },
  { id: 'CUP-05', roomId: 'ROOM-03', code: 'CUP-05', name: 'Cupboard 05', capacity: 50 },
];

const INITIAL_SHELVES: Shelf[] = [
  // Cupboard 01
  { id: 'SHELF-01-01', cupboardId: 'CUP-01', roomId: 'ROOM-01', code: 'SHELF-01-01', name: 'Shelf 01', capacity: 20 },
  { id: 'SHELF-01-02', cupboardId: 'CUP-01', roomId: 'ROOM-01', code: 'SHELF-01-02', name: 'Shelf 02', capacity: 20 },
  { id: 'SHELF-01-03', cupboardId: 'CUP-01', roomId: 'ROOM-01', code: 'SHELF-01-03', name: 'Shelf 03', capacity: 20 },

  // Cupboard 02
  { id: 'SHELF-02-01', cupboardId: 'CUP-02', roomId: 'ROOM-01', code: 'SHELF-02-01', name: 'Shelf 01', capacity: 20 },
  { id: 'SHELF-02-02', cupboardId: 'CUP-02', roomId: 'ROOM-01', code: 'SHELF-02-02', name: 'Shelf 02', capacity: 20 },

  // Cupboard 03
  { id: 'SHELF-03-01', cupboardId: 'CUP-03', roomId: 'ROOM-02', code: 'SHELF-03-01', name: 'Shelf 01', capacity: 25 },
  { id: 'SHELF-03-02', cupboardId: 'CUP-03', roomId: 'ROOM-02', code: 'SHELF-03-02', name: 'Shelf 02', capacity: 25 },

  // Cupboard 04 (Matches user specification!)
  { id: 'SHELF-04-01', cupboardId: 'CUP-04', roomId: 'ROOM-02', code: 'SHELF-04-01', name: 'Shelf 01', capacity: 25 },
  { id: 'SHELF-04-02', cupboardId: 'CUP-04', roomId: 'ROOM-02', code: 'SHELF-04-02', name: 'Shelf 02', capacity: 25 },
  { id: 'SHELF-04-03', cupboardId: 'CUP-04', roomId: 'ROOM-02', code: 'SHELF-04-03', name: 'Shelf 03', capacity: 25 },

  // Cupboard 05
  { id: 'SHELF-05-01', cupboardId: 'CUP-05', roomId: 'ROOM-03', code: 'SHELF-05-01', name: 'Shelf 01', capacity: 25 },
  { id: 'SHELF-05-02', cupboardId: 'CUP-05', roomId: 'ROOM-03', code: 'SHELF-05-02', name: 'Shelf 02', capacity: 25 },
];

const INITIAL_OFFICERS: Officer[] = [
  { id: 'OFF-001', name: 'Officer Vikramaditya Roy', department: 'Accounts & Budget', designation: 'Senior Accounts Officer', email: 'v.roy@dept.gov.in', deskNumber: 'Desk 301, 3rd Floor', canGenerateQRs: true },
  { id: 'OFF-002', name: 'Officer Sarah Jenkins', department: 'Personnel & HR', designation: 'Establishment Officer', email: 'sarah.j@dept.gov.in', deskNumber: 'Desk 204, 2nd Floor', canGenerateQRs: true },
  { id: 'OFF-007', name: 'Officer Ananya Sen', department: 'Legal Affairs', designation: 'Legal Consultant', email: 'ananya.sen@dept.gov.in', deskNumber: 'Chamber 109, 1st Floor', canGenerateQRs: false },
  { id: 'OFF-004', name: 'Officer Rajesh Sharma', department: 'Revenue & Audit', designation: 'Chief Audit Officer', email: 'rajesh.sharma@dept.gov.in', deskNumber: 'Desk 308, 3rd Floor', canGenerateQRs: true },
  { id: 'OFF-005', name: 'Officer Priya Nair', department: 'Procurement & Logistics', designation: 'Procurement Head', email: 'priya.nair@dept.gov.in', deskNumber: 'Desk 115, 1st Floor', canGenerateQRs: false },
];

const INITIAL_ATTENDERS: Attender[] = [
  { id: 'ATT-001', name: 'Attender Ramesh Kumar', assignedZone: 'Zone A (Rooms 01 & 02)', shift: 'GENERAL', phone: '+91 98450 11223' },
  { id: 'ATT-002', name: 'Attender Michael Vance', assignedZone: 'Zone B (Officer Wings 1-3)', shift: 'MORNING', phone: '+91 98450 22334' },
  { id: 'ATT-003', name: 'Attender Sunita Devi', assignedZone: 'Zone C (Finance & Archives)', shift: 'GENERAL', phone: '+91 98450 33445' },
];

const INITIAL_FILES: PhysicalFile[] = [
  {
    id: 'FILE-1024',
    name: 'Employee Service Record 1024',
    category: 'Personnel',
    description: 'Senior Cadre Service Book & Verification Dossier',
    priority: 'HIGH',
    registeredAt: '2024-01-15T09:00:00Z',
    status: 'IN_SHELF',
    homeRoomId: 'ROOM-02',
    homeCupboardId: 'CUP-04',
    homeShelfId: 'SHELF-04-02',
    currentRoomId: 'ROOM-02',
    currentCupboardId: 'CUP-04',
    currentShelfId: 'SHELF-04-02',
    lastScannedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    lastScannedBy: 'ATT-001 (Attender Ramesh Kumar)',
    totalMovements: 4,
  },
  {
    id: 'FILE-1025',
    name: 'Annual Audit Report 2024-25',
    category: 'Finance',
    description: 'Internal Comptroller and Auditor General Inspection Report',
    priority: 'URGENT',
    registeredAt: '2024-02-10T10:30:00Z',
    status: 'WITH_OFFICER',
    homeRoomId: 'ROOM-03',
    homeCupboardId: 'CUP-05',
    homeShelfId: 'SHELF-05-01',
    currentOfficerId: 'OFF-001',
    currentOfficerName: 'Officer Vikramaditya Roy',
    currentOfficerDept: 'Accounts & Budget',
    officerReceivedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastScannedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastScannedBy: 'ATT-001 (Attender Ramesh Kumar)',
    totalMovements: 3,
  },
  {
    id: 'FILE-1026',
    name: 'Land Acquisition Deed #498',
    category: 'Legal',
    description: 'Title deeds & Survey Maps for South Bypass Expansion',
    priority: 'CONFIDENTIAL',
    registeredAt: '2023-11-20T11:00:00Z',
    status: 'IN_TRANSIT',
    homeRoomId: 'ROOM-02',
    homeCupboardId: 'CUP-03',
    homeShelfId: 'SHELF-03-01',
    currentAttenderId: 'ATT-001',
    currentAttenderName: 'Attender Ramesh Kumar',
    inTransitSince: new Date(Date.now() - 1800000).toISOString(),
    inTransitFrom: 'Room 02 / Cupboard 03 / Shelf 01',
    lastScannedAt: new Date(Date.now() - 1800000).toISOString(),
    lastScannedBy: 'ATT-001 (Attender Ramesh Kumar)',
    totalMovements: 5,
  },
  {
    id: 'FILE-1027',
    name: 'Pension Clearance Docket 77',
    category: 'Personnel',
    description: 'Voluntary Retirement & Gratuity Calculation Docket',
    priority: 'NORMAL',
    registeredAt: '2024-03-01T08:45:00Z',
    status: 'IN_SHELF',
    homeRoomId: 'ROOM-01',
    homeCupboardId: 'CUP-01',
    homeShelfId: 'SHELF-01-02',
    currentRoomId: 'ROOM-01',
    currentCupboardId: 'CUP-01',
    currentShelfId: 'SHELF-01-02',
    lastScannedAt: new Date(Date.now() - 86400000).toISOString(),
    lastScannedBy: 'ATT-002 (Attender Michael Vance)',
    totalMovements: 2,
  },
  {
    id: 'FILE-1028',
    name: 'High Court Appeal Brief 2024/91',
    category: 'Legal',
    description: 'Special Leave Petition & Counter Affidavit Documentation',
    priority: 'URGENT',
    registeredAt: '2024-02-28T14:15:00Z',
    status: 'WITH_OFFICER',
    homeRoomId: 'ROOM-02',
    homeCupboardId: 'CUP-04',
    homeShelfId: 'SHELF-04-01',
    currentOfficerId: 'OFF-007',
    currentOfficerName: 'Officer Ananya Sen',
    currentOfficerDept: 'Legal Affairs',
    officerReceivedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastScannedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastScannedBy: 'ATT-003 (Attender Sunita Devi)',
    totalMovements: 6,
  },
  {
    id: 'FILE-1029',
    name: 'Tender Evaluation - Solar Microgrid',
    category: 'Procurement',
    description: 'Technical bids and vendor evaluation matrix',
    priority: 'NORMAL',
    registeredAt: '2024-04-05T09:20:00Z',
    status: 'IN_SHELF',
    homeRoomId: 'ROOM-01',
    homeCupboardId: 'CUP-02',
    homeShelfId: 'SHELF-02-01',
    currentRoomId: 'ROOM-01',
    currentCupboardId: 'CUP-02',
    currentShelfId: 'SHELF-02-01',
    lastScannedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    lastScannedBy: 'ATT-001 (Attender Ramesh Kumar)',
    totalMovements: 1,
  },
  {
    id: 'FILE-1030',
    name: 'State Vigilance Inquiry File #12',
    category: 'Vigilance',
    description: 'Confidential preliminary inquiry and witness statements',
    priority: 'CONFIDENTIAL',
    registeredAt: '2024-05-12T16:00:00Z',
    status: 'IN_SHELF',
    homeRoomId: 'ROOM-02',
    homeCupboardId: 'CUP-04',
    homeShelfId: 'SHELF-04-03',
    currentRoomId: 'ROOM-02',
    currentCupboardId: 'CUP-04',
    currentShelfId: 'SHELF-04-03',
    lastScannedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    lastScannedBy: 'ATT-001 (Attender Ramesh Kumar)',
    totalMovements: 3,
  },
  {
    id: 'FILE-1031',
    name: 'Quarterly GST Reconciliation 2024-Q1',
    category: 'Finance',
    description: 'Input Tax Credit ledger reconciliations and receipts',
    priority: 'HIGH',
    registeredAt: '2024-05-20T11:40:00Z',
    status: 'IN_SHELF',
    homeRoomId: 'ROOM-03',
    homeCupboardId: 'CUP-05',
    homeShelfId: 'SHELF-05-02',
    currentRoomId: 'ROOM-03',
    currentCupboardId: 'CUP-05',
    currentShelfId: 'SHELF-05-02',
    lastScannedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    lastScannedBy: 'ATT-003 (Attender Sunita Devi)',
    totalMovements: 2,
  },
];

const INITIAL_MOVEMENTS: MovementRecord[] = [
  {
    id: 'TX-90180',
    timestamp: new Date(Date.now() - 3600000 * 28).toISOString(),
    fileId: 'FILE-1024',
    fileName: 'Employee Service Record 1024',
    fromLocation: 'Cupboard 04 / Shelf 02 (Room 02)',
    toLocation: 'In Transit (ATT-001)',
    action: 'TAKE',
    personId: 'ATT-001',
    personName: 'Attender Ramesh Kumar',
    personRole: 'ATTENDER',
    scanSequence: 'Shelf 04-02 QR + File BACK/TAKE QR',
    notes: 'Requested for promotion board verification',
    status: 'SUCCESS',
  },
  {
    id: 'TX-90181',
    timestamp: new Date(Date.now() - 3600000 * 27.5).toISOString(),
    fileId: 'FILE-1024',
    fileName: 'Employee Service Record 1024',
    fromLocation: 'In Transit (ATT-001)',
    toLocation: 'Officer Vikramaditya Roy (OFF-001)',
    action: 'RECEIVE',
    personId: 'OFF-001',
    personName: 'Officer Vikramaditya Roy',
    personRole: 'OFFICER',
    scanSequence: 'Officer OFF-001 QR + File FRONT/KEEP QR',
    notes: 'Handover complete at Desk 301',
    status: 'SUCCESS',
  },
  {
    id: 'TX-90182',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    fileId: 'FILE-1024',
    fileName: 'Employee Service Record 1024',
    fromLocation: 'Officer Vikramaditya Roy (OFF-001)',
    toLocation: 'In Transit (ATT-001)',
    action: 'RELEASE',
    personId: 'OFF-001',
    personName: 'Officer Vikramaditya Roy',
    personRole: 'OFFICER',
    scanSequence: 'Officer OFF-001 QR + File BACK/TAKE QR',
    notes: 'Verification complete, released for return',
    status: 'SUCCESS',
  },
  {
    id: 'TX-90183',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    fileId: 'FILE-1024',
    fileName: 'Employee Service Record 1024',
    fromLocation: 'In Transit (ATT-001)',
    toLocation: 'Cupboard 04 / Shelf 02 (Room 02)',
    action: 'RETURN',
    personId: 'ATT-001',
    personName: 'Attender Ramesh Kumar',
    personRole: 'ATTENDER',
    scanSequence: 'Shelf 04-02 QR + File FRONT/KEEP QR',
    notes: 'Safely restocked in home shelf',
    status: 'SUCCESS',
  },
  {
    id: 'TX-90184',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    fileId: 'FILE-1025',
    fileName: 'Annual Audit Report 2024-25',
    fromLocation: 'Cupboard 05 / Shelf 01 (Room 03)',
    toLocation: 'Officer Vikramaditya Roy (OFF-001)',
    action: 'RECEIVE',
    personId: 'ATT-001',
    personName: 'Attender Ramesh Kumar',
    personRole: 'ATTENDER',
    scanSequence: 'Officer OFF-001 QR + File FRONT/KEEP QR',
    notes: 'Delivered to Accounts Officer for CAG preparation',
    status: 'SUCCESS',
  },
];

class StorageService {
  private rooms: Room[] = [];
  private cupboards: Cupboard[] = [];
  private shelves: Shelf[] = [];
  private files: PhysicalFile[] = [];
  private officers: Officer[] = [];
  private attenders: Attender[] = [];
  private movements: MovementRecord[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    try {
      const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
      if (!initialized) {
        this.resetToDefaults();
      } else {
        this.loadFromStorage();
      }
    } catch {
      this.resetToDefaults();
    }
  }

  public resetToDefaults() {
    this.rooms = [...INITIAL_ROOMS];
    this.cupboards = [...INITIAL_CUPBOARDS];
    this.shelves = [...INITIAL_SHELVES];
    this.files = [...INITIAL_FILES];
    this.officers = [...INITIAL_OFFICERS];
    this.attenders = [...INITIAL_ATTENDERS];
    this.movements = [...INITIAL_MOVEMENTS];

    this.saveAll();
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    this.notify();
  }

  private loadFromStorage() {
    this.rooms = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROOMS) || '[]') || INITIAL_ROOMS;
    this.cupboards = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUPBOARDS) || '[]') || INITIAL_CUPBOARDS;
    this.shelves = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHELVES) || '[]') || INITIAL_SHELVES;
    this.files = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]') || INITIAL_FILES;
    this.officers = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFICERS) || '[]') || INITIAL_OFFICERS;
    this.attenders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDERS) || '[]') || INITIAL_ATTENDERS;
    this.movements = JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVEMENTS) || '[]') || INITIAL_MOVEMENTS;

    if (this.files.length === 0) {
      this.resetToDefaults();
    }
  }

  private saveAll() {
    try {
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(this.rooms));
      localStorage.setItem(STORAGE_KEYS.CUPBOARDS, JSON.stringify(this.cupboards));
      localStorage.setItem(STORAGE_KEYS.SHELVES, JSON.stringify(this.shelves));
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(this.files));
      localStorage.setItem(STORAGE_KEYS.OFFICERS, JSON.stringify(this.officers));
      localStorage.setItem(STORAGE_KEYS.ATTENDERS, JSON.stringify(this.attenders));
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(this.movements));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
    void this.persistRemote();
  }

  /** Persist the current service state to Supabase. The UI remains responsive
   * by updating its local state first, while this sync writes the same records
   * to the shared database in the background. */
  private async persistRemote() {
    try {
      const writes = [
        supabase.from('rooms').upsert(this.rooms),
        supabase.from('cupboards').upsert(this.cupboards.map((c) => ({
          id: c.id, room_id: c.roomId, code: c.code, name: c.name, capacity: c.capacity,
        }))),
        supabase.from('shelves').upsert(this.shelves.map((s) => ({
          id: s.id, cupboard_id: s.cupboardId, room_id: s.roomId, code: s.code, name: s.name, capacity: s.capacity,
        }))),
        supabase.from('officers').upsert(this.officers.map((o) => ({
          id: o.id, name: o.name, department: o.department, designation: o.designation,
          email: o.email, desk_number: o.deskNumber, can_generate_qrs: o.canGenerateQRs,
        }))),
        supabase.from('attenders').upsert(this.attenders.map((a) => ({
          id: a.id, name: a.name, assigned_zone: a.assignedZone, shift: a.shift, phone: a.phone,
        }))),
        supabase.from('files').upsert(this.files.map((f) => ({
          id: f.id, name: f.name, category: f.category, description: f.description, priority: f.priority,
          registered_at: f.registeredAt, status: f.status, home_room_id: f.homeRoomId,
          home_cupboard_id: f.homeCupboardId, home_shelf_id: f.homeShelfId, current_room_id: f.currentRoomId,
          current_cupboard_id: f.currentCupboardId, current_shelf_id: f.currentShelfId,
          current_officer_id: f.currentOfficerId, current_officer_name: f.currentOfficerName,
          current_officer_dept: f.currentOfficerDept, current_attender_id: f.currentAttenderId,
          current_attender_name: f.currentAttenderName, officer_received_at: f.officerReceivedAt,
          in_transit_since: f.inTransitSince, in_transit_from: f.inTransitFrom,
          last_scanned_at: f.lastScannedAt, last_scanned_by: f.lastScannedBy, total_movements: f.totalMovements,
        }))),
        supabase.from('movements').upsert(this.movements.map((m) => ({
          id: m.id, timestamp: m.timestamp, file_id: m.fileId, file_name: m.fileName,
          from_location: m.fromLocation, to_location: m.toLocation, action: m.action,
          person_id: m.personId, person_name: m.personName, person_role: m.personRole,
          scan_sequence: m.scanSequence, notes: m.notes, status: m.status,
        }))),
      ];
      const results = await Promise.all(writes);
      const failed = results.find((result) => result.error);
      if (failed?.error) console.error('Supabase sync failed:', failed.error.message);
    } catch (error) {
      console.error('Supabase sync failed:', error);
    }
  }

  public async syncToDatabase() {
    await this.persistRemote();
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  // Getters
  public getRooms(): Room[] {
    return [...this.rooms];
  }

  public getCupboards(): Cupboard[] {
    return [...this.cupboards];
  }

  public getShelves(): Shelf[] {
    return [...this.shelves];
  }

  public getFiles(): PhysicalFile[] {
    return [...this.files];
  }

  public getOfficers(): Officer[] {
    // Populate activeFilesCount dynamically
    return this.officers.map((off) => ({
      ...off,
      activeFilesCount: this.files.filter((f) => f.currentOfficerId === off.id).length,
    }));
  }

  public getAttenders(): Attender[] {
    // Populate activeTransitCount dynamically
    return this.attenders.map((att) => ({
      ...att,
      activeTransitCount: this.files.filter((f) => f.currentAttenderId === att.id).length,
    }));
  }

  public getMovements(): MovementRecord[] {
    return [...this.movements].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Location helpers
  public getShelfById(shelfId: string): Shelf | undefined {
    return this.shelves.find((s) => s.id === shelfId || s.code === shelfId);
  }

  public getCupboardById(cupboardId: string): Cupboard | undefined {
    return this.cupboards.find((c) => c.id === cupboardId || c.code === cupboardId);
  }

  public getRoomById(roomId: string): Room | undefined {
    return this.rooms.find((r) => r.id === roomId || r.code === roomId);
  }

  public getFileById(fileId: string): PhysicalFile | undefined {
    const cleanId = fileId.toUpperCase().trim();
    return this.files.find((f) => f.id.toUpperCase() === cleanId);
  }

  public getOfficerById(officerId: string): Officer | undefined {
    const cleanId = officerId.toUpperCase().trim();
    return this.officers.find((o) => o.id.toUpperCase() === cleanId);
  }

  public getAttenderById(attenderId: string): Attender | undefined {
    const cleanId = attenderId.toUpperCase().trim();
    return this.attenders.find((a) => a.id.toUpperCase() === cleanId);
  }

  public getLocationBreadcrumb(shelfId?: string, cupboardId?: string, roomId?: string): string {
    const shelf = shelfId ? this.getShelfById(shelfId) : undefined;
    const cupId = cupboardId || (shelf ? shelf.cupboardId : undefined);
    const cupboard = cupId ? this.getCupboardById(cupId) : undefined;
    const rId = roomId || (cupboard ? cupboard.roomId : undefined);
    const room = rId ? this.getRoomById(rId) : undefined;

    const parts: string[] = [];
    if (room) parts.push(room.name.split(' - ')[0] || room.name);
    if (cupboard) parts.push(cupboard.name);
    if (shelf) parts.push(shelf.name);

    return parts.join(' → ') || 'Unknown Location';
  }

  // Create / Update Entities
  public addRoom(room: Omit<Room, 'id'> & { id?: string }): Room {
    const id = room.id || `ROOM-0${this.rooms.length + 1}`;
    const newRoom: Room = { ...room, id, code: id };
    this.rooms.push(newRoom);
    this.saveAll();
    this.notify();
    return newRoom;
  }

  public updateRoom(roomId: string, updates: Partial<Room>): Room {
    const idx = this.rooms.findIndex((r) => r.id === roomId || r.code === roomId);
    if (idx === -1) throw new Error(`Room "${roomId}" not found`);
    this.rooms[idx] = { ...this.rooms[idx], ...updates };
    this.saveAll();
    this.notify();
    return this.rooms[idx];
  }

  public getFilesInShelf(shelfId: string): PhysicalFile[] {
    return this.files.filter((f) => f.currentShelfId === shelfId || f.homeShelfId === shelfId);
  }

  public getFilesInCupboard(cupboardId: string): PhysicalFile[] {
    const childShelves = this.shelves.filter((s) => s.cupboardId === cupboardId).map((s) => s.id);
    return this.files.filter(
      (f) =>
        f.currentCupboardId === cupboardId ||
        f.homeCupboardId === cupboardId ||
        (f.currentShelfId && childShelves.includes(f.currentShelfId)) ||
        (f.homeShelfId && childShelves.includes(f.homeShelfId))
    );
  }

  public getFilesInRoom(roomId: string): PhysicalFile[] {
    const childCupboards = this.cupboards.filter((c) => c.roomId === roomId).map((c) => c.id);
    const childShelves = this.shelves.filter(
      (s) => s.roomId === roomId || childCupboards.includes(s.cupboardId)
    ).map((s) => s.id);

    return this.files.filter(
      (f) =>
        f.currentRoomId === roomId ||
        f.homeRoomId === roomId ||
        (f.currentCupboardId && childCupboards.includes(f.currentCupboardId)) ||
        (f.homeCupboardId && childCupboards.includes(f.homeCupboardId)) ||
        (f.currentShelfId && childShelves.includes(f.currentShelfId)) ||
        (f.homeShelfId && childShelves.includes(f.homeShelfId))
    );
  }

  public deleteRoom(
    roomId: string,
    options?: { reassignToShelfId?: string; deleteFiles?: boolean; force?: boolean }
  ): { success: boolean; error?: string } {
    const room = this.getRoomById(roomId);
    if (!room) return { success: false, error: 'Room not found' };

    const childCupboards = this.cupboards.filter((c) => c.roomId === room.id);
    const childCupIds = childCupboards.map((c) => c.id);
    const childShelves = this.shelves.filter((s) => childCupIds.includes(s.cupboardId) || s.roomId === room.id);
    const childShelfIds = childShelves.map((s) => s.id);
    const filesInRoom = this.getFilesInRoom(room.id);

    if (filesInRoom.length > 0) {
      if (options?.deleteFiles) {
        const fileIdsToDelete = filesInRoom.map((f) => f.id);
        this.files = this.files.filter((f) => !fileIdsToDelete.includes(f.id));
      } else {
        const targetShelfId = options?.reassignToShelfId || this.shelves.find((s) => !childShelfIds.includes(s.id))?.id;
        const destShelf = targetShelfId ? this.getShelfById(targetShelfId) : undefined;
        const destCup = destShelf ? this.getCupboardById(destShelf.cupboardId) : undefined;

        filesInRoom.forEach((file) => {
          if (destShelf && destCup) {
            file.currentShelfId = destShelf.id;
            file.currentCupboardId = destCup.id;
            file.currentRoomId = destCup.roomId;
            file.homeShelfId = destShelf.id;
            file.homeCupboardId = destCup.id;
            file.homeRoomId = destCup.roomId;
          } else {
            file.currentShelfId = undefined;
            file.currentCupboardId = undefined;
            file.currentRoomId = undefined;
          }
        });
      }
    }

    // Delete child shelves and cupboards
    this.shelves = this.shelves.filter((s) => !childShelfIds.includes(s.id) && s.roomId !== room.id);
    this.cupboards = this.cupboards.filter((c) => c.roomId !== room.id);
    this.rooms = this.rooms.filter((r) => r.id !== room.id);
    this.saveAll();
    this.notify();
    return { success: true };
  }

  public addCupboard(cupboard: Omit<Cupboard, 'id'> & { id?: string }): Cupboard {
    const id = cupboard.id || `CUP-0${this.cupboards.length + 1}`;
    const newCupboard: Cupboard = { ...cupboard, id, code: id };
    this.cupboards.push(newCupboard);
    this.saveAll();
    this.notify();
    return newCupboard;
  }

  public updateCupboard(cupboardId: string, updates: Partial<Cupboard>): Cupboard {
    const idx = this.cupboards.findIndex((c) => c.id === cupboardId || c.code === cupboardId);
    if (idx === -1) throw new Error(`Cupboard "${cupboardId}" not found`);
    this.cupboards[idx] = { ...this.cupboards[idx], ...updates };
    this.saveAll();
    this.notify();
    return this.cupboards[idx];
  }

  public deleteCupboard(
    cupboardId: string,
    options?: { reassignToShelfId?: string; deleteFiles?: boolean; force?: boolean }
  ): { success: boolean; error?: string } {
    const cup = this.getCupboardById(cupboardId);
    if (!cup) return { success: false, error: 'Cupboard not found' };

    const childShelves = this.shelves.filter((s) => s.cupboardId === cup.id);
    const childShelfIds = childShelves.map((s) => s.id);
    const filesInCup = this.getFilesInCupboard(cup.id);

    if (filesInCup.length > 0) {
      if (options?.deleteFiles) {
        const fileIdsToDelete = filesInCup.map((f) => f.id);
        this.files = this.files.filter((f) => !fileIdsToDelete.includes(f.id));
      } else {
        const targetShelfId = options?.reassignToShelfId || this.shelves.find((s) => !childShelfIds.includes(s.id))?.id;
        const destShelf = targetShelfId ? this.getShelfById(targetShelfId) : undefined;
        const destCup = destShelf ? this.getCupboardById(destShelf.cupboardId) : undefined;

        filesInCup.forEach((file) => {
          if (destShelf && destCup) {
            file.currentShelfId = destShelf.id;
            file.currentCupboardId = destCup.id;
            file.currentRoomId = destCup.roomId;
            file.homeShelfId = destShelf.id;
            file.homeCupboardId = destCup.id;
            file.homeRoomId = destCup.roomId;
          } else {
            file.currentShelfId = undefined;
            file.currentCupboardId = undefined;
            file.currentRoomId = undefined;
          }
        });
      }
    }

    this.shelves = this.shelves.filter((s) => s.cupboardId !== cup.id);
    this.cupboards = this.cupboards.filter((c) => c.id !== cup.id);
    this.saveAll();
    this.notify();
    return { success: true };
  }

  public addShelf(shelf: Omit<Shelf, 'id'> & { id?: string }): Shelf {
    const id = shelf.id || `SHELF-${shelf.cupboardId.replace('CUP-', '')}-0${this.shelves.filter((s) => s.cupboardId === shelf.cupboardId).length + 1}`;
    const newShelf: Shelf = { ...shelf, id, code: id };
    this.shelves.push(newShelf);
    this.saveAll();
    this.notify();
    return newShelf;
  }

  public updateShelf(shelfId: string, updates: Partial<Shelf>): Shelf {
    const idx = this.shelves.findIndex((s) => s.id === shelfId || s.code === shelfId);
    if (idx === -1) throw new Error(`Shelf "${shelfId}" not found`);
    this.shelves[idx] = { ...this.shelves[idx], ...updates };
    this.saveAll();
    this.notify();
    return this.shelves[idx];
  }

  public deleteShelf(
    shelfId: string,
    options?: { reassignToShelfId?: string; deleteFiles?: boolean; force?: boolean }
  ): { success: boolean; error?: string } {
    const shelf = this.getShelfById(shelfId);
    if (!shelf) return { success: false, error: 'Shelf not found' };

    const filesInShelf = this.getFilesInShelf(shelf.id);

    if (filesInShelf.length > 0) {
      if (options?.deleteFiles) {
        const fileIdsToDelete = filesInShelf.map((f) => f.id);
        this.files = this.files.filter((f) => !fileIdsToDelete.includes(f.id));
      } else {
        const targetShelfId = options?.reassignToShelfId || this.shelves.find((s) => s.id !== shelf.id)?.id;
        const destShelf = targetShelfId ? this.getShelfById(targetShelfId) : undefined;
        const destCup = destShelf ? this.getCupboardById(destShelf.cupboardId) : undefined;

        filesInShelf.forEach((file) => {
          if (destShelf && destCup) {
            file.currentShelfId = destShelf.id;
            file.currentCupboardId = destCup.id;
            file.currentRoomId = destCup.roomId;
            file.homeShelfId = destShelf.id;
            file.homeCupboardId = destCup.id;
            file.homeRoomId = destCup.roomId;
          } else {
            file.currentShelfId = undefined;
            file.currentCupboardId = undefined;
            file.currentRoomId = undefined;
          }
        });
      }
    }

    this.shelves = this.shelves.filter((s) => s.id !== shelf.id);
    this.saveAll();
    this.notify();
    return { success: true };
  }

  public addOfficer(officer: Omit<Officer, 'id'> & { id?: string }): Officer {
    const id = officer.id || `OFF-${String(this.officers.length + 1).padStart(3, '0')}`;
    const newOfficer: Officer = { ...officer, id };
    this.officers.push(newOfficer);
    this.saveAll();
    this.notify();
    return newOfficer;
  }

  public addAttender(attender: Omit<Attender, 'id'> & { id?: string }): Attender {
    const id = attender.id || `ATT-${String(this.attenders.length + 1).padStart(3, '0')}`;
    const newAttender: Attender = { ...attender, id };
    this.attenders.push(newAttender);
    this.saveAll();
    this.notify();
    return newAttender;
  }

  public addFile(fileData: {
    id?: string;
    name: string;
    category: string;
    description?: string;
    priority?: 'NORMAL' | 'URGENT' | 'CONFIDENTIAL' | 'HIGH';
    shelfId: string;
  }): PhysicalFile {
    const shelf = this.getShelfById(fileData.shelfId);
    if (!shelf) throw new Error('Selected shelf does not exist');
    const cupboard = this.getCupboardById(shelf.cupboardId);
    if (!cupboard) throw new Error('Shelf cupboard not found');

    const id = fileData.id?.trim() || `FILE-${1024 + this.files.length}`;
    const existing = this.getFileById(id);
    if (existing) throw new Error(`File ID "${id}" already exists`);

    const newFile: PhysicalFile = {
      id,
      name: fileData.name,
      category: fileData.category || 'General',
      description: fileData.description,
      priority: fileData.priority || 'NORMAL',
      registeredAt: new Date().toISOString(),
      status: 'IN_SHELF',
      homeRoomId: cupboard.roomId,
      homeCupboardId: cupboard.id,
      homeShelfId: shelf.id,
      currentRoomId: cupboard.roomId,
      currentCupboardId: cupboard.id,
      currentShelfId: shelf.id,
      lastScannedAt: new Date().toISOString(),
      lastScannedBy: 'Admin Registration',
      totalMovements: 0,
    };

    this.files.push(newFile);

    // Record initial registration transaction
    const tx: MovementRecord = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
      fileId: id,
      fileName: newFile.name,
      fromLocation: 'System Registration',
      toLocation: this.getLocationBreadcrumb(shelf.id),
      action: 'REGISTER',
      personId: 'ADMIN',
      personName: 'System Admin',
      personRole: 'ADMIN',
      scanSequence: 'Initial File Registration & Shelf Assignment',
      notes: `Placed in ${shelf.name} (${cupboard.name})`,
      status: 'SUCCESS',
    };
    this.movements.unshift(tx);

    this.saveAll();
    this.notify();
    return newFile;
  }

  public updateFile(fileId: string, updates: Partial<PhysicalFile>): PhysicalFile {
    const index = this.files.findIndex((f) => f.id === fileId);
    if (index === -1) throw new Error('File not found');
    this.files[index] = { ...this.files[index], ...updates };
    this.saveAll();
    this.notify();
    return this.files[index];
  }

  // ==========================================
  // SCAN VALIDATION & EXECUTION ENGINE
  // ==========================================

  /**
   * Pre-validates a 2-step scan sequence before executing
   */
  public validateScanSequence(
    targetType: 'SHELF' | 'OFFICER',
    targetId: string,
    fileAction: 'KEEP' | 'TAKE',
    fileId: string
  ): ValidationOutcome {
    const file = this.getFileById(fileId);
    if (!file) {
      return {
        valid: false,
        error: `File "${fileId}" is not registered in the system.`,
      };
    }

    if (targetType === 'SHELF') {
      const shelf = this.getShelfById(targetId);
      if (!shelf) {
        return {
          valid: false,
          error: `Location/Shelf "${targetId}" is not recognized.`,
        };
      }
      const targetShelfName = this.getLocationBreadcrumb(shelf.id);

      // Workflow A: Taking a File FROM a Shelf
      if (fileAction === 'TAKE') {
        if (file.status === 'IN_TRANSIT') {
          return {
            valid: false,
            error: `Invalid Scan: File "${file.id}" is already IN TRANSIT with ${file.currentAttenderName || 'an attender'}.`,
          };
        }
        if (file.status === 'WITH_OFFICER') {
          return {
            valid: false,
            error: `Invalid Scan: File "${file.id}" is currently WITH OFFICER (${file.currentOfficerName || file.currentOfficerId}), not in shelf ${shelf.name}.`,
          };
        }

        // File is in shelf. Check if it matches this shelf
        if (file.currentShelfId !== shelf.id) {
          const actualLoc = this.getLocationBreadcrumb(file.currentShelfId);
          return {
            valid: false,
            error: `Location Mismatch: File "${file.id}" is recorded in "${actualLoc}", not in "${targetShelfName}". Scan the correct shelf to take it!`,
          };
        }

        return {
          valid: true,
          actionType: 'TAKE',
          file,
          fromLocationName: targetShelfName,
          targetLocationName: 'In Transit (Attender Custody)',
          details: `Take file from ${shelf.name} into transit custody.`,
        };
      }

      // Workflow D: Returning / Storing a File TO a Shelf
      if (fileAction === 'KEEP') {
        // Redundancy check: File already in that shelf!
        if (file.status === 'IN_SHELF' && file.currentShelfId === shelf.id) {
          return {
            valid: false,
            error: `Redundant Scan: File "${file.id}" is ALREADY placed in "${targetShelfName}". No movement needed.`,
          };
        }

        // Warning if returning to a shelf different from its home shelf
        const isRelocation = file.homeShelfId !== shelf.id;
        const fromLoc = file.status === 'WITH_OFFICER'
          ? `Officer Desk (${file.currentOfficerName || file.currentOfficerId})`
          : file.status === 'IN_TRANSIT'
          ? `In Transit (${file.currentAttenderName || 'Attender'})`
          : this.getLocationBreadcrumb(file.currentShelfId);

        return {
          valid: true,
          actionType: isRelocation ? 'RELOCATE' : 'RETURN',
          warning: isRelocation
            ? `Note: This file's original home is ${this.getLocationBreadcrumb(file.homeShelfId)}. It will now be stored in ${targetShelfName}.`
            : undefined,
          file,
          fromLocationName: fromLoc,
          targetLocationName: targetShelfName,
          details: isRelocation ? `Relocating file to ${shelf.name}` : `Restocking file into ${shelf.name}`,
        };
      }
    }

    if (targetType === 'OFFICER') {
      const officer = this.getOfficerById(targetId);
      if (!officer) {
        return {
          valid: false,
          error: `Officer ID "${targetId}" not found in system.`,
        };
      }
      const officerName = `${officer.name} (${officer.id})`;

      // Workflow B: Giving File to an Officer (Receive)
      if (fileAction === 'KEEP') {
        if (file.status === 'WITH_OFFICER') {
          if (file.currentOfficerId === officer.id) {
            return {
              valid: false,
              error: `Redundant Scan: File "${file.id}" is ALREADY in possession of ${officer.name}.`,
            };
          } else {
            return {
              valid: false,
              error: `Invalid Scan: File is currently recorded with another officer (${file.currentOfficerName}). It must be formally released first.`,
            };
          }
        }

        if (file.status === 'IN_SHELF') {
          return {
            valid: false,
            error: `Sequence Violation: File "${file.id}" is still registered in shelf (${this.getLocationBreadcrumb(file.currentShelfId)}). Attender must first scan Shelf QR + File TAKE QR before handing over to an officer!`,
          };
        }

        // File is in transit -> valid!
        return {
          valid: true,
          actionType: 'RECEIVE',
          file,
          fromLocationName: `In Transit (${file.currentAttenderName || 'Attender'})`,
          targetLocationName: officerName,
          details: `Officer ${officer.name} receives and accepts custody of file.`,
        };
      }

      // Workflow C: Officer Finishes With File (Release to Attender)
      if (fileAction === 'TAKE') {
        if (file.status !== 'WITH_OFFICER') {
          return {
            valid: false,
            error: `Invalid Scan: File "${file.id}" is NOT currently with an officer (Status: ${file.status.replace('_', ' ')}).`,
          };
        }

        if (file.currentOfficerId !== officer.id) {
          return {
            valid: false,
            error: `Officer Mismatch: File is held by ${file.currentOfficerName}, but scan is for ${officer.name}. Only the holding officer can release it!`,
          };
        }

        return {
          valid: true,
          actionType: 'RELEASE',
          file,
          fromLocationName: officerName,
          targetLocationName: 'In Transit (Attender Custody)',
          details: `Officer ${officer.name} releases file to attender for shelf return.`,
        };
      }
    }

    return {
      valid: false,
      error: 'Unrecognized scan combination.',
    };
  }

  /**
   * Executes the transaction after validation
   */
  public executeScanTransaction(params: {
    targetType: 'SHELF' | 'OFFICER';
    targetId: string;
    fileAction: 'KEEP' | 'TAKE';
    fileId: string;
    actorId: string;
    actorName: string;
    actorRole: 'OFFICER' | 'ATTENDER' | 'ADMIN';
    customNotes?: string;
  }): { success: boolean; message: string; record?: MovementRecord } {
    const { targetType, targetId, fileAction, fileId, actorId, actorName, actorRole, customNotes } = params;

    // Validate
    const validation = this.validateScanSequence(targetType, targetId, fileAction, fileId);
    if (!validation.valid || !validation.file) {
      return {
        success: false,
        message: validation.error || 'Scan validation failed',
      };
    }

    const file = validation.file;
    const nowIso = new Date().toISOString();
    let fromLocation = validation.fromLocationName || 'Unknown';
    let toLocation = validation.targetLocationName || 'Unknown';
    let action = validation.actionType || 'TAKE';
    let scanSeqText = '';

    if (targetType === 'SHELF') {
      const shelf = this.getShelfById(targetId)!;
      const cupboard = this.getCupboardById(shelf.cupboardId)!;

      if (fileAction === 'TAKE') {
        // Taken from shelf -> IN_TRANSIT
        scanSeqText = `${shelf.code} QR + ${file.id} BACK/TAKE QR`;
        file.status = 'IN_TRANSIT';
        file.currentAttenderId = actorRole === 'ATTENDER' ? actorId : 'ATT-001';
        file.currentAttenderName = actorName;
        file.inTransitSince = nowIso;
        file.inTransitFrom = `${cupboard.name} / ${shelf.name}`;
        file.currentShelfId = undefined;
        file.currentCupboardId = undefined;
        file.currentRoomId = undefined;
        file.currentOfficerId = undefined;
        file.currentOfficerName = undefined;
      } else {
        // Stored / Returned to shelf -> IN_SHELF
        scanSeqText = `${shelf.code} QR + ${file.id} FRONT/KEEP QR`;
        file.status = 'IN_SHELF';
        file.currentShelfId = shelf.id;
        file.currentCupboardId = cupboard.id;
        file.currentRoomId = cupboard.roomId;
        file.currentAttenderId = undefined;
        file.currentAttenderName = undefined;
        file.inTransitSince = undefined;
        file.inTransitFrom = undefined;
        file.currentOfficerId = undefined;
        file.currentOfficerName = undefined;
      }
    } else if (targetType === 'OFFICER') {
      const officer = this.getOfficerById(targetId)!;

      if (fileAction === 'KEEP') {
        // Received by officer -> WITH_OFFICER
        scanSeqText = `${officer.id} QR + ${file.id} FRONT/KEEP QR`;
        file.status = 'WITH_OFFICER';
        file.currentOfficerId = officer.id;
        file.currentOfficerName = officer.name;
        file.currentOfficerDept = officer.department;
        file.officerReceivedAt = nowIso;
        file.currentAttenderId = undefined;
        file.currentAttenderName = undefined;
        file.inTransitSince = undefined;
      } else {
        // Released by officer -> IN_TRANSIT with attender
        scanSeqText = `${officer.id} QR + ${file.id} BACK/TAKE QR`;
        file.status = 'IN_TRANSIT';
        file.currentAttenderId = actorRole === 'ATTENDER' ? actorId : 'ATT-001';
        file.currentAttenderName = actorRole === 'ATTENDER' ? actorName : 'Attender Pool';
        file.inTransitSince = nowIso;
        file.inTransitFrom = `Officer ${officer.name} (${officer.department})`;
        file.currentOfficerId = undefined;
        file.currentOfficerName = undefined;
        file.currentOfficerDept = undefined;
      }
    }

    file.lastScannedAt = nowIso;
    file.lastScannedBy = `${actorId} (${actorName})`;
    file.totalMovements = (file.totalMovements || 0) + 1;

    // Create Audit Record
    const txRecord: MovementRecord = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: nowIso,
      fileId: file.id,
      fileName: file.name,
      fromLocation,
      toLocation,
      action,
      personId: actorId,
      personName: actorName,
      personRole: actorRole,
      scanSequence: scanSeqText,
      notes: customNotes || validation.details,
      status: 'SUCCESS',
    };

    this.movements.unshift(txRecord);

    // Save and notify
    this.updateFile(file.id, file);
    this.saveAll();
    this.notify();

    return {
      success: true,
      message: `${action} successful: File "${file.id}" moved from ${fromLocation} to ${toLocation}`,
      record: txRecord,
    };
  }

  /**
   * Checks if a file is physically deposited inside a registered shelf and cupboard
   */
  public isFilePlacedInShelfOrCupboard(fileId: string): boolean {
    const file = this.getFileById(fileId);
    if (!file) return false;
    if (file.status !== 'IN_SHELF') return false;
    if (!file.currentShelfId) return false;
    const shelf = this.getShelfById(file.currentShelfId);
    return Boolean(shelf);
  }

  /**
   * Places a file into a designated shelf/cupboard and logs transaction
   */
  public placeFileIntoShelf(
    fileId: string,
    shelfId: string,
    officerId: string,
    notes?: string
  ): { success: boolean; message: string } {
    const file = this.getFileById(fileId);
    if (!file) return { success: false, message: 'File not found' };

    const shelf = this.getShelfById(shelfId);
    if (!shelf) return { success: false, message: 'Destination shelf not found' };

    const cupboard = this.getCupboardById(shelf.cupboardId);
    if (!cupboard) return { success: false, message: 'Destination cupboard not found' };

    const officer = this.getOfficerById(officerId);
    const officerName = officer ? `${officer.name} (${officer.id})` : officerId;
    const shelfBreadcrumb = this.getLocationBreadcrumb(shelf.id);
    const nowIso = new Date().toISOString();

    const fromLoc = file.currentOfficerName
      ? `Desk of ${file.currentOfficerName}`
      : file.status === 'WITH_OFFICER'
      ? `Officer Desk (${officerName})`
      : 'In Transit';

    // Update physical file
    file.status = 'IN_SHELF';
    file.currentShelfId = shelf.id;
    file.currentCupboardId = cupboard.id;
    file.currentRoomId = cupboard.roomId;
    file.currentOfficerId = undefined;
    file.currentOfficerName = undefined;
    file.currentOfficerDept = undefined;
    file.officerReceivedAt = undefined;
    file.currentAttenderId = undefined;
    file.currentAttenderName = undefined;
    file.inTransitSince = undefined;
    file.inTransitFrom = undefined;
    file.lastScannedAt = nowIso;
    file.lastScannedBy = officerName;
    file.totalMovements = (file.totalMovements || 0) + 1;

    // Record movement audit
    const txRecord: MovementRecord = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: nowIso,
      fileId: file.id,
      fileName: file.name,
      fromLocation: fromLoc,
      toLocation: shelfBreadcrumb,
      action: 'RETURN',
      personId: officer ? officer.id : officerId,
      personName: officer ? officer.name : 'Officer',
      personRole: 'OFFICER',
      scanSequence: `Physical Restock to ${shelf.code} verified before release`,
      notes: notes || `Restocked directly into ${shelfBreadcrumb}`,
      status: 'SUCCESS',
    };
    this.movements.unshift(txRecord);

    this.updateFile(file.id, file);
    this.saveAll();
    this.notify();

    return {
      success: true,
      message: `File "${file.id}" successfully placed into ${shelfBreadcrumb}. Desk custody released.`,
    };
  }

  // Dashboard Stats
  public getDashboardStats() {
    const totalFiles = this.files.length;
    const inShelves = this.files.filter((f) => f.status === 'IN_SHELF').length;
    const withOfficers = this.files.filter((f) => f.status === 'WITH_OFFICER').length;
    const currentlyMoving = this.files.filter((f) => f.status === 'IN_TRANSIT').length;

    return {
      totalFiles,
      inShelves,
      withOfficers,
      currentlyMoving,
      totalRooms: this.rooms.length,
      totalCupboards: this.cupboards.length,
      totalShelves: this.shelves.length,
      totalOfficers: this.officers.length,
      totalAttenders: this.attenders.length,
      totalMovementsCount: this.movements.length,
    };
  }
}

export const storage = new StorageService();
