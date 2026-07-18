const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const PROFILES = Object.freeze({
  low: Object.freeze({ width: 400, shadows: false, detail: 0.55, label: "Úsporná" }),
  balanced: Object.freeze({ width: 560, shadows: true, detail: 0.78, label: "Vyvážená" }),
  high: Object.freeze({ width: 720, shadows: true, detail: 1, label: "Vysoká" }),
});

export class PerformanceGovernor {
  constructor({ mode = "auto", navigatorObject = globalThis.navigator } = {}) {
    this.mode = mode;
    this.navigatorObject = navigatorObject;
    this.profileName = this.#initialProfile(mode);
    this.emaFps = 60;
    this.lowFpsTime = 0;
    this.highFpsTime = 0;
    this.changed = true;
    this.cooldown = 0;
  }

  setMode(mode = "auto") {
    const normalized = ["auto", "low", "balanced", "high"].includes(mode) ? mode : "auto";
    if (normalized === this.mode) return;
    this.mode = normalized;
    const next = this.#initialProfile(this.mode);
    if (next !== this.profileName) {
      this.profileName = next;
      this.changed = true;
    }
    this.lowFpsTime = 0;
    this.highFpsTime = 0;
  }

  update(dt, fps) {
    if (!Number.isFinite(dt) || !Number.isFinite(fps)) return false;
    this.emaFps += (fps - this.emaFps) * clamp(dt * 1.8, 0.02, 0.18);
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.mode !== "auto" || this.cooldown > 0) return this.consumeChanged();

    if (this.emaFps < 42) {
      this.lowFpsTime += dt;
      this.highFpsTime = Math.max(0, this.highFpsTime - dt * 2);
    } else if (this.emaFps > 57) {
      this.highFpsTime += dt;
      this.lowFpsTime = Math.max(0, this.lowFpsTime - dt * 1.5);
    } else {
      this.lowFpsTime = Math.max(0, this.lowFpsTime - dt);
      this.highFpsTime = Math.max(0, this.highFpsTime - dt);
    }

    if (this.lowFpsTime > 3.2) {
      this.lowFpsTime = 0;
      this.#step(-1);
    } else if (this.highFpsTime > 11) {
      this.highFpsTime = 0;
      this.#step(1);
    }
    return this.consumeChanged();
  }

  consumeChanged() {
    const changed = this.changed;
    this.changed = false;
    return changed;
  }

  getProfile(viewportWidth = 640) {
    const base = PROFILES[this.profileName] || PROFILES.balanced;
    const widthLimit = viewportWidth < 720 ? 620 : viewportWidth < 1100 ? 680 : 800;
    return {
      ...base,
      name: this.profileName,
      width: Math.min(base.width, widthLimit),
      fps: this.emaFps,
    };
  }

  #step(direction) {
    const order = ["low", "balanced", "high"];
    const current = order.indexOf(this.profileName);
    const next = order[clamp(current + direction, 0, order.length - 1)];
    if (next === this.profileName) return;
    this.profileName = next;
    this.changed = true;
    this.cooldown = direction < 0 ? 7 : 15;
  }

  #initialProfile(mode) {
    if (mode !== "auto") return mode;
    const memory = Number(this.navigatorObject?.deviceMemory || 0);
    const cores = Number(this.navigatorObject?.hardwareConcurrency || 0);
    const mobile = /iPhone|iPad|Android/i.test(this.navigatorObject?.userAgent || "");
    if ((memory && memory <= 4) || (cores && cores <= 4)) return "low";
    if (mobile || (memory && memory <= 6) || (cores && cores <= 6)) return "balanced";
    return "high";
  }
}

export { PROFILES as PERFORMANCE_PROFILES };
