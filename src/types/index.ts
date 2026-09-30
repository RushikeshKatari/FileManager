export type FileStatus = 'IN_SHELF' | 'IN_TRANSIT' | 'WITH_OFFICER' | 'ARCHIVED' | 'MISSING';

export type ActionType = 'TAKE' | 'RECEIVE' | 'RELEASE' | 'RETURN' | 'REGISTER' | 'RELOCATE';

export interface LocationHierarchy {
  roomId: string;
  roomName: string;
  cupboardId: string;
  cupboardName: string;
  shelfId: string;
  shelfName: string;
}

export interface Room {
  id: string;
  name: string;
  code: string;
  description?: string;
  building?: string;
  floor?: string;
}

export interface Cupboard {
  id: string;
  roomId: string;
  name: string; // e.g. "Cupboard 04"
  code: string; // e.g. "CUP-04"
  capacity?: number;
}

export interface Shelf {
  id: string;
  cupboardId: string;
  roomId: string;
  name: string; // e.g. "Shelf 02"
  code: string; // e.g. "SHELF-04-02"
  capacity?: number;
}

export interface PhysicalFile {
  id: string; // e.g. "FILE-1024"
  name: string; // e.g. "Employee Service Record 1024"
  category: string; // e.g. "Personnel", "Finance", "Legal"
  description?: string;
  caseNumber?: string;
  priority: 'NORMAL' | 'URGENT' | 'CONFIDENTIAL' | 'HIGH';
  registeredAt: string;
  status: FileStatus;
  
  // Stored Shelf location (when IN_SHELF or last registered shelf)
  homeShelfId: string;
  homeCupboardId: string;
  homeRoomId: string;

  // Current physical location details
  currentShelfId?: string;
  currentCupboardId?: string;
  currentRoomId?: string;

  // Officer custody details (when WITH_OFFICER)
  currentOfficerId?: string;
  currentOfficerName?: string;
  currentOfficerDept?: string;
  officerReceivedAt?: string;

  // Attender transit details (when IN_TRANSIT)
  currentAttenderId?: string;
  currentAttenderName?: string;
  inTransitSince?: string;
  inTransitFrom?: string;

  lastScannedAt: string;
  lastScannedBy?: string;
  totalMovements: number;
}

export interface Officer {
  id: string; // e.g. "OFF-001"
  name: string;
  department: string;
  designation: string;
  email: string;
  phone?: string;
  deskNumber: string;
  canGenerateQRs: boolean;
  activeFilesCount?: number;
}

export interface Attender {
  id: string; // e.g. "ATT-001"
  name: string;
  assignedZone: string;
  shift: 'MORNING' | 'EVENING' | 'GENERAL' | 'NIGHT';
  phone?: string;
  activeTransitCount?: number;
}

export interface MovementRecord {
  id: string;
  timestamp: string;
  fileId: string;
  fileName: string;
  fromLocation: string;
  toLocation: string;
  action: ActionType;
  personId: string;
  personName: string;
  personRole: 'OFFICER' | 'ATTENDER' | 'ADMIN';
  scanSequence: string; // e.g. "Shelf 04-02 + File BACK QR"
  notes?: string;
  status: 'SUCCESS' | 'FLAGGED';
}

export type PortalType = 'ADMIN' | 'OFFICER' | 'ATTENDER';

export interface ScanResultPayload {
  raw: string;
  type: 'LOCATION' | 'OFFICER' | 'ATTENDER' | 'FILE_ACTION' | 'UNKNOWN';
  subType?: 'ROOM' | 'CUPBOARD' | 'SHELF' | 'KEEP' | 'TAKE';
  entityId?: string;
  shelfId?: string;
  cupboardId?: string;
  roomId?: string;
  fileId?: string;
  action?: 'KEEP' | 'TAKE';
}

export interface ValidationOutcome {
  valid: boolean;
  error?: string;
  warning?: string;
  actionType?: ActionType;
  file?: PhysicalFile;
  targetLocationName?: string;
  fromLocationName?: string;
  details?: string;
}
