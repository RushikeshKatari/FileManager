import { PortalType } from '../types';
import { supabase } from '../lib/supabase';
import { storage } from './storage';

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
export type LoginResult =
  | { success: true; user: AuthUser }
  | { success: false; error: string };

/**
 * Login via ID + password
 */
export async function loginWithCredentials(id: string, password: string): Promise<LoginResult> {
  const trimId = id.trim().toUpperCase();
  const trimPwd = password.trim();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_id, name, role, department, designation, shift, assigned_zone, email')
    .eq('user_id', trimId)
    .single();

  if (profileError || !profile) return { success: false, error: `User ID "${trimId}" not found.` };
  if (!profile.email) return { success: false, error: 'This profile has no authentication email configured.' };

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: trimPwd,
  });

  if (authError) return { success: false, error: 'Incorrect password.' };
  await storage.syncToDatabase();
  return { success: true, user: profileToAuthUser(profile) };
}

/**
 * Login via QR string  (same format as officer/attender QR codes)
 * Expected payloads:
 *   OFFICER:OFF-001
 *   ATTENDER:ATT-001
 *   ADMIN (bare string)
 */
export async function loginWithQR(qrString: string): Promise<LoginResult> {
  const raw = qrString.trim();

  if (raw.toUpperCase() === 'ADMIN') {
    return findProfileLogin('ADMIN');
  }

  if (raw.toUpperCase().startsWith('OFFICER:')) {
    const officerId = raw.slice('OFFICER:'.length).trim().toUpperCase();
    return findProfileLogin(officerId);
  }

  if (raw.toUpperCase().startsWith('ATTENDER:')) {
    const attenderId = raw.slice('ATTENDER:'.length).trim().toUpperCase();
    return findProfileLogin(attenderId);
  }

  // Bare ID fallback  e.g. "OFF-001" or "ATT-002"
  const upper = raw.toUpperCase();
  if (upper.startsWith('OFF-')) {
    return findProfileLogin(upper);
  }
  if (upper.startsWith('ATT-')) {
    return findProfileLogin(upper);
  }

  return {
    success: false,
    error: 'QR code not recognized. Please use your personal Officer or Attender QR badge.',
  };
}

function profileToAuthUser(profile: any): AuthUser {
  return {
    id: profile.user_id,
    name: profile.name,
    role: profile.role as PortalType,
    department: profile.department ?? undefined,
    designation: profile.designation ?? undefined,
    shift: profile.shift ?? undefined,
    assignedZone: profile.assigned_zone ?? undefined,
  };
}

async function findProfileLogin(userId: string): Promise<LoginResult> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, name, role, department, designation, shift, assigned_zone')
    .eq('user_id', userId)
    .single();
  if (error || !data) return { success: false, error: `User "${userId}" not found in Supabase.` };
  return { success: true, user: profileToAuthUser(data) };
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
