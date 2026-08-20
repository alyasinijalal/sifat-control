declare global {
  interface Window {
    electronAPI?: {
      getSystemHWID?: () => Promise<string>;
    };
  }
}

const MASTER_SECRET = "SIFAT_CONTROL_MASTER_KEY_2026_SECURE_AUTH_@#$!";

export async function fetchSystemHWID(): Promise<string> {
  if (typeof window !== 'undefined' && window.electronAPI?.getSystemHWID) {
    try {
      const hwid = await window.electronAPI.getSystemHWID();
      if (hwid) return hwid;
    } catch {
      // fallback
    }
  }

  // Fallback web fingerprint
  const fp = `${navigator.userAgent}-${navigator.hardwareConcurrency || 4}-${screen.width}x${screen.height}`;
  let hash = 0;
  for (let i = 0; i < fp.length; i++) {
    const char = fp.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(16, '0').toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

export function generateKeyForHWID(hwid: string): string {
  const cleanHwid = (hwid || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const combined = `${cleanHwid}:${MASTER_SECRET}`;
  
  let h1 = 0x811c9dc5;
  let h2 = 5381;
  for (let i = 0; i < combined.length; i++) {
    const code = combined.charCodeAt(i);
    h1 = (h1 ^ code) * 16777619;
    h2 = ((h2 << 5) + h2) ^ code;
  }
  
  const b1 = Math.abs(h1).toString(36).slice(-4).padStart(4, 'X').toUpperCase();
  const b2 = Math.abs(h2).toString(36).slice(-4).padStart(4, 'Y').toUpperCase();
  const b3 = Math.abs(h1 ^ h2).toString(36).slice(-4).padStart(4, 'Z').toUpperCase();
  const b4 = Math.abs(h1 + h2).toString(36).slice(-4).padStart(4, 'K').toUpperCase();
  
  return `KEY-${b1}-${b2}-${b3}-${b4}`;
}

export function isLicenseValid(hwid: string, licenseKey: string): boolean {
  if (!hwid || !licenseKey) return false;
  const expected = generateKeyForHWID(hwid);
  return licenseKey.trim().toUpperCase() === expected.trim().toUpperCase();
}

const STORAGE_KEY = 'sifat_farma_activation_license_v1';

export function getSavedLicense(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function saveLicense(licenseKey: string): void {
  localStorage.setItem(STORAGE_KEY, licenseKey.trim().toUpperCase());
}
