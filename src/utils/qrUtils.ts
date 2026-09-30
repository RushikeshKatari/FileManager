import QRCode from 'qrcode';
import { ScanResultPayload } from '../types';

/**
 * Encodes QR payload strings
 */
export function encodeRoomQR(roomId: string): string {
  return `LOC:ROOM:${roomId}`;
}

export function encodeLocationQR(shelfId: string): string {
  return `LOC:SHELF:${shelfId}`;
}

export function encodeCupboardQR(cupboardId: string): string {
  return `LOC:CUPBOARD:${cupboardId}`;
}

export function encodeOfficerQR(officerId: string): string {
  return `OFFICER:${officerId}`;
}

export function encodeAttenderQR(attenderId: string): string {
  return `ATTENDER:${attenderId}`;
}

export function encodeFileKeepQR(fileId: string): string {
  return `FILE:KEEP:${fileId}`;
}

export function encodeFileTakeQR(fileId: string): string {
  return `FILE:TAKE:${fileId}`;
}

/**
 * Parses any scanned QR string
 */
export function parseQRString(raw: string): ScanResultPayload {
  const trimmed = raw.trim();

  // Try JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const data = JSON.parse(trimmed);
      if (data.type === 'FILE_ACTION') {
        return {
          raw: trimmed,
          type: 'FILE_ACTION',
          subType: data.action === 'TAKE' ? 'TAKE' : 'KEEP',
          fileId: data.fileId,
          action: data.action === 'TAKE' ? 'TAKE' : 'KEEP',
        };
      }
      if (data.type === 'OFFICER') {
        return {
          raw: trimmed,
          type: 'OFFICER',
          entityId: data.officerId || data.id,
        };
      }
      if (data.type === 'LOCATION') {
        return {
          raw: trimmed,
          type: 'LOCATION',
          subType: data.subType || 'SHELF',
          entityId: data.shelfId || data.cupboardId || data.id,
          shelfId: data.shelfId,
          cupboardId: data.cupboardId,
        };
      }
    } catch {
      // Fallback to prefix parsing
    }
  }

  // Prefix: FILE:KEEP:... or FILE:TAKE:... or FILE:...:KEEP or FILE:...:TAKE
  if (trimmed.startsWith('FILE:KEEP:')) {
    const fileId = trimmed.replace('FILE:KEEP:', '').trim();
    return {
      raw: trimmed,
      type: 'FILE_ACTION',
      subType: 'KEEP',
      fileId,
      action: 'KEEP',
    };
  }

  if (trimmed.startsWith('FILE:TAKE:')) {
    const fileId = trimmed.replace('FILE:TAKE:', '').trim();
    return {
      raw: trimmed,
      type: 'FILE_ACTION',
      subType: 'TAKE',
      fileId,
      action: 'TAKE',
    };
  }

  // Format: FILE:FILE-1024:KEEP or FILE:FILE-1024:TAKE
  if (trimmed.startsWith('FILE:') && (trimmed.endsWith(':KEEP') || trimmed.endsWith(':TAKE'))) {
    const parts = trimmed.split(':');
    const action = parts[parts.length - 1].toUpperCase() as 'KEEP' | 'TAKE';
    const fileId = parts.slice(1, parts.length - 1).join(':').trim();
    return {
      raw: trimmed,
      type: 'FILE_ACTION',
      subType: action,
      fileId,
      action,
    };
  }

  if (trimmed.startsWith('KEEP:')) {
    const fileId = trimmed.replace('KEEP:', '').trim();
    return {
      raw: trimmed,
      type: 'FILE_ACTION',
      subType: 'KEEP',
      fileId,
      action: 'KEEP',
    };
  }

  if (trimmed.startsWith('TAKE:')) {
    const fileId = trimmed.replace('TAKE:', '').trim();
    return {
      raw: trimmed,
      type: 'FILE_ACTION',
      subType: 'TAKE',
      fileId,
      action: 'TAKE',
    };
  }

  // Prefix: LOC:ROOM:... or LOC:SHELF:... or LOC:CUPBOARD:...
  if (trimmed.startsWith('LOC:ROOM:')) {
    const roomId = trimmed.replace('LOC:ROOM:', '').trim();
    return {
      raw: trimmed,
      type: 'LOCATION',
      subType: 'ROOM',
      entityId: roomId,
      roomId,
    };
  }

  if (trimmed.startsWith('LOC:SHELF:')) {
    const shelfId = trimmed.replace('LOC:SHELF:', '').trim();
    return {
      raw: trimmed,
      type: 'LOCATION',
      subType: 'SHELF',
      entityId: shelfId,
      shelfId,
    };
  }

  if (trimmed.startsWith('LOC:CUPBOARD:')) {
    const cupboardId = trimmed.replace('LOC:CUPBOARD:', '').trim();
    return {
      raw: trimmed,
      type: 'LOCATION',
      subType: 'CUPBOARD',
      entityId: cupboardId,
      cupboardId,
    };
  }

  // Prefix: OFFICER:...
  if (trimmed.startsWith('OFFICER:')) {
    const officerId = trimmed.replace('OFFICER:', '').trim();
    return {
      raw: trimmed,
      type: 'OFFICER',
      entityId: officerId,
    };
  }

  // Prefix: ATTENDER:...
  if (trimmed.startsWith('ATTENDER:')) {
    const attenderId = trimmed.replace('ATTENDER:', '').trim();
    return {
      raw: trimmed,
      type: 'ATTENDER',
      entityId: attenderId,
    };
  }

  // Fallback heuristics based on common ID patterns
  const upper = trimmed.toUpperCase();
  if (upper.startsWith('OFF-') || upper.startsWith('OFFICER-')) {
    return {
      raw: trimmed,
      type: 'OFFICER',
      entityId: upper,
    };
  }

  if (upper.startsWith('ATT-') || upper.startsWith('ATTENDER-')) {
    return {
      raw: trimmed,
      type: 'ATTENDER',
      entityId: upper,
    };
  }

  if (upper.startsWith('SHELF-') || upper.includes('SHELF')) {
    return {
      raw: trimmed,
      type: 'LOCATION',
      subType: 'SHELF',
      entityId: upper,
      shelfId: upper,
    };
  }

  if (upper.startsWith('CUP-') || upper.startsWith('CUPBOARD-')) {
    return {
      raw: trimmed,
      type: 'LOCATION',
      subType: 'CUPBOARD',
      entityId: upper,
      cupboardId: upper,
    };
  }

  return {
    raw: trimmed,
    type: 'UNKNOWN',
  };
}

/**
 * Generates an SVG or PNG data URL for a QR code
 */
export async function generateQRDataUrl(
  text: string,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 2,
    scale: 8,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    ...options,
  });
}

/**
 * Web Audio API synthesize scanner beep feedback
 */
export function playScanSound(type: 'success' | 'warning' | 'error' = 'success'): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'success') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08); // D6
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.36);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.16);
    }
  } catch {
    // Ignore audio permission/context errors
  }
}
