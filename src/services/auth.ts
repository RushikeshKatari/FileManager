import { storage } from './storage';
import { PortalType } from '../types';

export interface AuthUser {
  id: string;
  name: string;
  role: PortalType;
  department?: string;
  designation?: string;
  shift?: string;
  assignedZone?: string;
}

// Hardcoded admin credential (extend to DB later)
const ADMIN_CREDENTIALS = {
  id: 'ADMIN',
  password: 'admin123',
};

/**
 * Simple in-memory password store for Officers & Attenders.
 * In a real backend these would be hashed rows in the DB.
 * Format: { entityId: password }
 */
const MOCK_PASSWORDS: Record<string, string> = {
  'OFF-001': 'officer001',
  'OFF-002': 'officer002',
  'OFF-004': 'officer004',
  'OFF-005': 'officer005',
  'OFF-007': 'officer007',
  'ATT-001': 'attender001',
  'ATT-002': 'attender002',
  'ATT-003': 'attender003',
};

export type LoginResult =
  | { success: true; user: AuthUser }
  | { success: false; error: string };

/**
 * Login via ID + password
 */
export function loginWithCredentials(id: string, password: string): LoginResult {
  const trimId = id.trim().toUpperCase();
  const trimPwd = password.trim();

  // Admin check
  if (trimId === ADMIN_CREDENTIALS.id.toUpperCase() && trimPwd === ADMIN_CREDENTIALS.password) {
    return {
      success: true,
      user: { id: 'ADMIN', name: 'System Administrator', role: 'ADMIN' },
    };
  }

  // Officer check
  if (trimId.startsWith('OFF-')) {
    const officer = storage.getOfficerById(trimId);
    if (!officer) return { success: false, error: `Officer ID "${trimId}" not found.` };
    const expectedPwd = MOCK_PASSWORDS[trimId];
    if (!expectedPwd || trimPwd !== expectedPwd) {
      return { success: false, error: 'Incorrect password.' };
    }
    return {
      success: true,
      user: {
        id: officer.id,
        name: officer.name,
        role: 'OFFICER',
        department: officer.department,
        designation: officer.designation,
      },
    };
  }

  // Attender check
  if (trimId.startsWith('ATT-')) {
    const attender = storage.getAttenderById(trimId);
    if (!attender) return { success: false, error: `Attender ID "${trimId}" not found.` };
    const expectedPwd = MOCK_PASSWORDS[trimId];
    if (!expectedPwd || trimPwd !== expectedPwd) {
      return { success: false, error: 'Incorrect password.' };
    }
    return {
      success: true,
      user: {
        id: attender.id,
        name: attender.name,
        role: 'ATTENDER',
        shift: attender.shift,
        assignedZone: attender.assignedZone,
      },
    };
  }

  return { success: false, error: 'Unrecognized ID format. Use ADMIN, OFF-XXX, or ATT-XXX.' };
}

/**
 * Login via QR string  (same format as officer/attender QR codes)
 * Expected payloads:
 *   OFFICER:OFF-001
 *   ATTENDER:ATT-001
 *   ADMIN (bare string)
 */
export function loginWithQR(qrString: string): LoginResult {
  const raw = qrString.trim();

  if (raw.toUpperCase() === 'ADMIN') {
    return {
      success: true,
      user: { id: 'ADMIN', name: 'System Administrator', role: 'ADMIN' },
    };
  }

  if (raw.toUpperCase().startsWith('OFFICER:')) {
    const officerId = raw.slice('OFFICER:'.length).trim().toUpperCase();
    const officer = storage.getOfficerById(officerId);
    if (!officer) return { success: false, error: `Officer "${officerId}" not found in system.` };
    return {
      success: true,
      user: {
        id: officer.id,
        name: officer.name,
        role: 'OFFICER',
        department: officer.department,
        designation: officer.designation,
      },
    };
  }

  if (raw.toUpperCase().startsWith('ATTENDER:')) {
    const attenderId = raw.slice('ATTENDER:'.length).trim().toUpperCase();
    const attender = storage.getAttenderById(attenderId);
    if (!attender) return { success: false, error: `Attender "${attenderId}" not found in system.` };
    return {
      success: true,
      user: {
        id: attender.id,
        name: attender.name,
        role: 'ATTENDER',
        shift: attender.shift,
        assignedZone: attender.assignedZone,
      },
    };
  }

  // Bare ID fallback  e.g. "OFF-001" or "ATT-002"
  const upper = raw.toUpperCase();
  if (upper.startsWith('OFF-')) {
    const officer = storage.getOfficerById(upper);
    if (officer) {
      return {
        success: true,
        user: {
          id: officer.id,
          name: officer.name,
          role: 'OFFICER',
          department: officer.department,
          designation: officer.designation,
        },
      };
    }
  }
  if (upper.startsWith('ATT-')) {
    const attender = storage.getAttenderById(upper);
    if (attender) {
      return {
        success: true,
        user: {
          id: attender.id,
          name: attender.name,
          role: 'ATTENDER',
          shift: attender.shift,
          assignedZone: attender.assignedZone,
        },
      };
    }
  }

  return {
    success: false,
    error: 'QR code not recognized. Please use your personal Officer or Attender QR badge.',
  };
}

const SESSION_KEY = 'fm_session_user';

export function saveSession(user: AuthUser) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch (_) {}
}

export function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch (_) {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (_) {}
}
