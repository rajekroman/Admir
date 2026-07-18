const SETTINGS_KEY = "kroniky-stribrne-brany-preferences-v3";
const LEGACY_KEYS = ["kroniky-stribrne-brany-preferences-m12"];

export const DEFAULT_PREFERENCES = Object.freeze({
  quality: "auto",
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  crosshair: true,
  autosave: true,
  touchOpacity: 0.82,
  lookSensitivity: 1,
  tapToAttack: true,
  hudScale: 1,
});

const QUALITY_VALUES = new Set(["low", "balanced", "high", "auto"]);
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));

function normalize(raw = {}) {
  const prefersReduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  return {
    quality: QUALITY_VALUES.has(raw.quality) ? raw.quality : DEFAULT_PREFERENCES.quality,
    highContrast: Boolean(raw.highContrast),
    reducedMotion: raw.reducedMotion == null ? prefersReduced : Boolean(raw.reducedMotion),
    largeText: Boolean(raw.largeText),
    crosshair: raw.crosshair == null ? true : Boolean(raw.crosshair),
    autosave: raw.autosave == null ? true : Boolean(raw.autosave),
    touchOpacity: clamp(raw.touchOpacity ?? DEFAULT_PREFERENCES.touchOpacity, 0.35, 1),
    lookSensitivity: clamp(raw.lookSensitivity ?? DEFAULT_PREFERENCES.lookSensitivity, 0.45, 1.8),
    tapToAttack: raw.tapToAttack == null ? true : Boolean(raw.tapToAttack),
    hudScale: clamp(raw.hudScale ?? DEFAULT_PREFERENCES.hudScale, 0.82, 1.18),
  };
}

export class PreferencesManager {
  constructor({ storage = globalThis.localStorage } = {}) {
    this.storage = storage;
    this.settings = this.#load();
  }

  getSettings() { return { ...this.settings }; }

  setSetting(name, value) {
    if (!(name in DEFAULT_PREFERENCES)) return this.getSettings();
    this.settings = normalize({ ...this.settings, [name]: value });
    this.#save();
    return this.getSettings();
  }

  apply(root = globalThis.document?.documentElement) {
    if (!root?.classList) return;
    root.classList.toggle("pref-high-contrast", this.settings.highContrast);
    root.classList.toggle("pref-reduced-motion", this.settings.reducedMotion);
    root.classList.toggle("pref-large-text", this.settings.largeText);
    root.classList.toggle("pref-hide-crosshair", !this.settings.crosshair);
    root.style?.setProperty?.("--touch-opacity", String(this.settings.touchOpacity));
    root.style?.setProperty?.("--hud-scale", String(this.settings.hudScale));
    root.dataset.quality = this.settings.quality;
  }

  getRenderWidth(viewportWidth = 640) {
    if (this.settings.quality === "low") return Math.min(430, viewportWidth);
    if (this.settings.quality === "balanced") return Math.min(580, viewportWidth);
    if (this.settings.quality === "high") return Math.min(viewportWidth < 760 ? 650 : 800, viewportWidth);
    const memory = Number(globalThis.navigator?.deviceMemory || 0);
    const cores = Number(globalThis.navigator?.hardwareConcurrency || 0);
    const constrained = (memory && memory <= 4) || (cores && cores <= 4);
    if (constrained) return Math.min(viewportWidth, 430);
    return Math.min(viewportWidth, viewportWidth < 760 ? 560 : 720);
  }

  #load() {
    try {
      let raw = this.storage?.getItem?.(SETTINGS_KEY);
      if (!raw) {
        for (const key of LEGACY_KEYS) {
          raw = this.storage?.getItem?.(key);
          if (raw) break;
        }
      }
      return normalize(raw ? JSON.parse(raw) : {});
    } catch {
      return normalize({});
    }
  }

  #save() {
    try { this.storage?.setItem?.(SETTINGS_KEY, JSON.stringify(this.settings)); } catch { /* storage unavailable */ }
  }
}
