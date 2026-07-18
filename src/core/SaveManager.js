const SAVE_KEY = "kroniky-stribrne-brany-m12-save";
const BACKUP_KEY = "kroniky-stribrne-brany-m12-backup";
const LEGACY_KEYS = [
  { key: "kroniky-stribrne-brany-m11-save", version: 11 },
  { key: "kroniky-stribrne-brany-m10-save", version: 10 },
  { key: "kroniky-stribrne-brany-m09-save", version: 9 },
  { key: "kroniky-stribrne-brany-m08-save", version: 8 },
  { key: "kroniky-stribrne-brany-m07-save", version: 7 },
  { key: "kroniky-stribrne-brany-m06-save", version: 6 },
  { key: "kroniky-stribrne-brany-m05-save", version: 5 },
  { key: "kroniky-stribrne-brany-m04-save", version: 4 },
  { key: "kroniky-stribrne-brany-m03-save", version: 3 },
  { key: "kroniky-stribrne-brany-m02-save", version: 2 },
];
const SETTINGS_KEY = "kroniky-stribrne-brany-settings";
const SAVE_VERSION = 12;

function checksum(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function parsePayload(raw, expectedVersion = null) {
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw);
    if (!payload?.snapshot || !Number.isInteger(payload.version)) return null;
    if (expectedVersion != null && payload.version !== expectedVersion) return null;
    if (payload.checksum && payload.checksum !== checksum(payload.snapshot)) return null;
    return payload;
  } catch {
    return null;
  }
}

export class SaveManager {
  hasSave() {
    try {
      return Boolean(localStorage.getItem(SAVE_KEY) || localStorage.getItem(BACKUP_KEY) || LEGACY_KEYS.some(({ key }) => localStorage.getItem(key)));
    } catch {
      return false;
    }
  }

  save(snapshot) {
    const payload = { version: SAVE_VERSION, savedAt: new Date().toISOString(), checksum: checksum(snapshot), snapshot };
    try {
      const previous = localStorage.getItem(SAVE_KEY);
      if (previous) localStorage.setItem(BACKUP_KEY, previous);
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error("Uložení hry selhalo", error);
      return false;
    }
  }

  load() {
    try {
      for (const [key, version] of [[SAVE_KEY, SAVE_VERSION], [BACKUP_KEY, SAVE_VERSION]]) {
        const payload = parsePayload(localStorage.getItem(key), version);
        if (payload) return payload.snapshot;
      }
      for (const legacy of LEGACY_KEYS) {
        const payload = parsePayload(localStorage.getItem(legacy.key), legacy.version);
        if (payload) return payload.snapshot;
      }
      return null;
    } catch (error) {
      console.error("Načtení hry selhalo", error);
      return null;
    }
  }

  getMetadata() {
    try {
      const payload = parsePayload(localStorage.getItem(SAVE_KEY), SAVE_VERSION) || parsePayload(localStorage.getItem(BACKUP_KEY), SAVE_VERSION);
      return payload ? { version: payload.version, savedAt: payload.savedAt, checksum: payload.checksum } : null;
    } catch { return null; }
  }

  exportSave() {
    try {
      const payload = parsePayload(localStorage.getItem(SAVE_KEY), SAVE_VERSION) || parsePayload(localStorage.getItem(BACKUP_KEY), SAVE_VERSION);
      return payload ? JSON.stringify(payload, null, 2) : null;
    } catch { return null; }
  }

  importSave(raw) {
    try {
      const payload = parsePayload(raw);
      if (!payload || payload.version < 2 || payload.version > SAVE_VERSION) return false;
      return this.save(payload.snapshot);
    } catch { return false; }
  }

  deleteSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(BACKUP_KEY);
      return true;
    } catch { return false; }
  }

  saveSettings(settings) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); return true; } catch { return false; }
  }

  loadSettings() {
    try { const raw = localStorage.getItem(SETTINGS_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  }
}

export const SAVE_FORMAT_VERSION = SAVE_VERSION;
export const computeSaveChecksum = checksum;
