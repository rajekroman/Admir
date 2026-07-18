import { AUDIO_MANIFEST, resolveSceneAudio } from "../data/audio.js";

const SETTINGS_KEY = "kroniky-stribrne-brany-audio-m10";
const DEFAULT_SETTINGS = Object.freeze({ master: 0.78, music: 0.62, ambience: 0.48, sfx: 0.82, ui: 0.72, muted: false });
const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

function safeSettings(raw = {}) {
  return {
    master: clamp01(raw.master ?? DEFAULT_SETTINGS.master),
    music: clamp01(raw.music ?? DEFAULT_SETTINGS.music),
    ambience: clamp01(raw.ambience ?? DEFAULT_SETTINGS.ambience),
    sfx: clamp01(raw.sfx ?? DEFAULT_SETTINGS.sfx),
    ui: clamp01(raw.ui ?? DEFAULT_SETTINGS.ui),
    muted: Boolean(raw.muted),
  };
}

export class AudioManager {
  constructor({ manifest = AUDIO_MANIFEST } = {}) {
    this.manifest = manifest;
    this.context = null;
    this.nodes = null;
    this.raw = new Map();
    this.buffers = new Map();
    this.failed = new Set();
    this.loadingPromise = null;
    this.loadingById = new Map();
    this.decodingById = new Map();
    this.unlocked = false;
    this.enabled = true;
    this.settings = this.#loadSettings();
    this.scene = { screen: "menu" };
    this.sceneRevision = 0;
    this.currentMusic = null;
    this.currentAmbience = null;
    this.stepIndex = { grass: 0, stone: 0, crypt: 0 };
    this.lastCombatPulse = -10;
  }

  async loadAll() {
    if (this.loadingPromise) return this.loadingPromise;
    this.loadingPromise = (async () => {
      const entries = Object.keys(this.manifest);
      await Promise.all(entries.map((id) => this.#loadOne(id).catch(() => null)));
      return { loaded: this.raw.size, failed: this.failed.size, total: entries.length };
    })();
    return this.loadingPromise;
  }

  async unlock() {
    if (!this.enabled) return { ok: false, reason: "disabled" };
    this.#ensureContext();
    if (!this.context) return { ok: false, reason: "unsupported" };
    if (this.context.state === "suspended") await this.context.resume();
    this.unlocked = true;
    this.#applySettings();

    // Dekódují se pouze dvě smyčky aktuální scény. Původní verze dekódovala
    // všech 96 MP3 najednou, což na iPhonu mohlo na několik sekund zablokovat
    // hlavní vlákno právě při prvním kontaktu s nepřítelem.
    const desired = resolveSceneAudio(this.scene);
    const critical = [desired.musicId ? `music:${desired.musicId}` : null, desired.ambienceId ? `ambience:${desired.ambienceId}` : null].filter(Boolean);
    await Promise.all(critical.map((id) => this.#ensureDecoded(id).catch(() => null)));
    this.#syncScene(true);

    // Běžné efekty se připravují postupně mimo kritickou cestu spuštění.
    for (const id of ["sfx:ui-click", "sfx:ui-confirm", "sfx:weapon-sword", "sfx:step-grass-1", "sfx:hit-flesh"]) {
      this.#ensureDecoded(id).catch(() => null);
    }
    return { ok: true, decoded: this.buffers.size, failed: this.failed.size };
  }

  getSettings() { return { ...this.settings }; }

  setSetting(name, value) {
    if (!(name in DEFAULT_SETTINGS)) return this.getSettings();
    this.settings[name] = name === "muted" ? Boolean(value) : clamp01(value);
    this.#saveSettings();
    this.#applySettings();
    return this.getSettings();
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    this.settings.muted = !this.enabled;
    this.#saveSettings();
    this.#applySettings();
  }

  setScene(scene = {}) {
    const next = { ...scene };
    const changed = JSON.stringify(next) !== JSON.stringify(this.scene);
    this.scene = next;
    if (changed) this.#syncScene(false);
  }

  update(_dt, scene = null) {
    if (scene) this.setScene(scene);
  }

  playUi(frequency = 440, _duration = 0.045) {
    const cue = frequency < 260 ? "ui-error" : frequency > 650 ? "ui-confirm" : "ui-click";
    this.#play(cue, "ui", { gain: cue === "ui-error" ? 0.78 : 0.72 });
  }
  playDialogueChoice() { this.#play("ui-page", "ui", { gain: 0.78 }); }
  playInteract() { this.#play("ui-confirm", "ui", { gain: 0.78 }); }
  playCollect() { this.#play("collect", "sfx", { gain: 0.9 }); }
  playQuestUpdate() { this.#play("quest-update", "ui", { gain: 0.9 }); }
  playQuestComplete() { this.#play("quest-complete", "ui", { gain: 0.95 }); }
  playDiscovery() { this.#play("discovery", "sfx", { gain: 0.9 }); }
  playZoneTransition() { this.#play("zone-transition", "sfx", { gain: 0.85 }); }
  playCombatPulse() {
    if (!this.context) return;
    const now = this.context.currentTime;
    if (now - this.lastCombatPulse < 0.1) return;
    this.lastCombatPulse = now;
  }

  playStep(material = "stone") {
    const key = ["grass", "stone", "crypt"].includes(material) ? material : "stone";
    const index = (this.stepIndex[key]++ % 3) + 1;
    this.#play(`step-${key}-${index}`, "sfx", { gain: 0.62, rate: 0.96 + Math.random() * 0.08, pan: (Math.random() - 0.5) * 0.18 });
  }

  playAttack(kind = "melee", critical = false, weaponSkill = null) {
    if (critical) this.#play("hit-critical", "sfx", { gain: 0.9 });
    const cue = weaponSkill === "mace" ? "weapon-mace"
      : weaponSkill === "bow" || kind === "ranged" ? "weapon-bow"
        : weaponSkill === "staff" ? "weapon-staff" : "weapon-sword";
    this.#play(cue, "sfx", { gain: 0.88, rate: critical ? 1.06 : 1 });
  }

  playHit({ armored = false, critical = false } = {}) {
    this.#play(critical ? "hit-critical" : armored ? "hit-armor" : "hit-flesh", "sfx", { gain: critical ? 1 : 0.82 });
  }

  playMiss() { this.#play("miss", "sfx", { gain: 0.7 }); }

  playMagic(abilityId = "", success = true) {
    if (!success) return this.#play("magic-fail", "sfx", { gain: 0.75 });
    const id = String(abilityId).toLowerCase();
    const cue = id.includes("heal") || id.includes("mend") || id.includes("breath") || id.includes("dressing") ? "magic-heal"
      : id.includes("frost") || id.includes("ice") ? "magic-frost"
        : id.includes("lightning") || id.includes("shock") ? "magic-lightning"
          : id.includes("ember") || id.includes("fire") || id.includes("nova") ? "magic-fire"
            : id.includes("poison") || id.includes("venom") ? "magic-poison" : "magic-spirit";
    this.#play(cue, "sfx", { gain: 0.9 });
  }

  playTacticalPause(paused) { this.#play(paused ? "tactical-pause" : "tactical-resume", "ui", { gain: 0.8 }); }
  playDoor(success = true, opening = true) { this.#play(success ? (opening ? "door-open" : "door-close") : "door-locked", "sfx", { gain: 0.9 }); }
  playMechanism(success = true) { this.#play(success ? "lever" : "ui-error", success ? "sfx" : "ui", { gain: 0.82 }); }
  playTrap(disarmed = false) { this.#play(disarmed ? "trap-disarm" : "trap-trigger", "sfx", { gain: 0.95 }); }
  playMonster(archetype, action = "attack", options = {}) { this.#play(`monster-${archetype}-${action}`, "sfx", { gain: options.gain ?? 0.88, pan: options.pan ?? 0, rate: options.rate ?? 1 }); }
  playCue(cue, options = {}) { if (cue) this.#play(cue.replace(/^sfx:/, ""), options.bus || "sfx", options); }

  preview(bus) {
    if (bus === "music") this.#play("music:valeDay", "music", { gain: 0.55, duration: 2.4 });
    else if (bus === "ambience") this.#play("ambience:forest", "ambience", { gain: 0.7, duration: 2.4 });
    else if (bus === "ui") this.#play("ui-confirm", "ui", { gain: 0.9 });
    else this.#play("weapon-sword", "sfx", { gain: 0.85 });
  }

  #ensureContext() {
    if (this.context) return;
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) return;
    this.context = new AudioContextClass();
    const master = this.context.createGain();
    const music = this.context.createGain();
    const ambience = this.context.createGain();
    const sfx = this.context.createGain();
    const ui = this.context.createGain();
    const compressor = this.context.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 16;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;
    music.connect(master); ambience.connect(master); sfx.connect(master); ui.connect(master);
    master.connect(compressor); compressor.connect(this.context.destination);
    this.nodes = { master, music, ambience, sfx, ui, compressor };
  }

  #normalizeId(id, bus = "sfx") {
    return id.includes(":") ? id : `${bus === "ui" ? "sfx" : bus}:${id}`;
  }

  async #loadOne(id) {
    if (this.raw.has(id)) return this.raw.get(id);
    if (this.failed.has(id)) throw new Error(`Audio ${id} previously failed`);
    if (this.loadingById.has(id)) return this.loadingById.get(id);
    const url = this.manifest[id];
    if (!url) throw new Error(`Unknown audio asset ${id}`);
    const promise = (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const raw = await response.arrayBuffer();
        this.raw.set(id, raw);
        return raw;
      } catch (error) {
        console.warn(`Audio asset ${id} se nepodařilo načíst`, error);
        this.failed.add(id);
        throw error;
      } finally {
        this.loadingById.delete(id);
      }
    })();
    this.loadingById.set(id, promise);
    return promise;
  }

  async #ensureDecoded(id) {
    if (!id) return null;
    if (this.buffers.has(id)) return this.buffers.get(id);
    if (!this.context) return null;
    if (this.decodingById.has(id)) return this.decodingById.get(id);
    const promise = (async () => {
      try {
        const raw = await this.#loadOne(id);
        const buffer = await this.context.decodeAudioData(raw.slice(0));
        this.buffers.set(id, buffer);
        return buffer;
      } catch (error) {
        console.warn(`Audio ${id} nelze dekódovat`, error);
        this.failed.add(id);
        return null;
      } finally {
        this.decodingById.delete(id);
      }
    })();
    this.decodingById.set(id, promise);
    return promise;
  }

  #play(id, bus = "sfx", options = {}) {
    if (!this.context || !this.nodes || !this.unlocked || this.settings.muted || !this.enabled) return null;
    const fullId = this.#normalizeId(id, bus);
    const buffer = this.buffers.get(fullId);
    if (!buffer) {
      this.#ensureDecoded(fullId).then((ready) => {
        if (ready && this.unlocked && !this.settings.muted && this.enabled) this.#playReady(fullId, bus, options);
      });
      return null;
    }
    return this.#playReady(fullId, bus, options);
  }

  #playReady(fullId, bus, { gain = 1, rate = 1, pan = 0, duration = null } = {}) {
    const buffer = this.buffers.get(fullId);
    if (!buffer || !this.context || !this.nodes) return null;
    const source = this.context.createBufferSource();
    const level = this.context.createGain();
    source.buffer = buffer;
    source.playbackRate.value = Math.max(0.45, Math.min(1.8, rate));
    level.gain.value = Math.max(0, gain);
    source.connect(level);
    if (this.context.createStereoPanner) {
      const panner = this.context.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      level.connect(panner); panner.connect(this.nodes[bus] || this.nodes.sfx);
    } else level.connect(this.nodes[bus] || this.nodes.sfx);
    source.start();
    if (Number.isFinite(duration) && duration > 0) source.stop(this.context.currentTime + duration);
    return source;
  }

  #syncScene(immediate) {
    if (!this.unlocked || !this.context || !this.nodes) return;
    const desired = resolveSceneAudio(this.scene);
    const revision = ++this.sceneRevision;
    this.#prepareLoop("music", desired.musicId ? `music:${desired.musicId}` : null, immediate ? 0.02 : 1.25, revision);
    this.#prepareLoop("ambience", desired.ambienceId ? `ambience:${desired.ambienceId}` : null, immediate ? 0.02 : 1.6, revision);
  }

  async #prepareLoop(bus, nextId, duration, revision) {
    const current = bus === "music" ? this.currentMusic : this.currentAmbience;
    if (nextId && current?.fullId === nextId) return;
    if (nextId) {
      const buffer = await this.#ensureDecoded(nextId);
      if (!buffer || revision !== this.sceneRevision) return;
    }
    if (revision !== this.sceneRevision) return;
    const next = this.#crossfadeLoop(current, nextId, bus, duration);
    if (bus === "music") this.currentMusic = next;
    else this.currentAmbience = next;
  }

  #crossfadeLoop(previous, nextId, bus, duration) {
    const now = this.context.currentTime;
    if (previous) {
      previous.gain.gain.cancelScheduledValues(now);
      previous.gain.gain.setValueAtTime(Math.max(previous.gain.gain.value, 0.0001), now);
      previous.gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      previous.source.stop(now + duration + 0.05);
    }
    if (!nextId) return null;
    const buffer = this.buffers.get(nextId);
    if (!buffer) return null;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer; source.loop = true;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(1, now + duration);
    source.connect(gain); gain.connect(this.nodes[bus]); source.start(now);
    return { id: nextId.replace(/^[^:]+:/, ""), fullId: nextId, source, gain };
  }

  #applySettings() {
    if (!this.nodes || !this.context) return;
    const now = this.context.currentTime;
    const muted = this.settings.muted || !this.enabled;
    this.nodes.master.gain.setTargetAtTime(muted ? 0.0001 : Math.max(0.0001, this.settings.master), now, 0.03);
    for (const bus of ["music", "ambience", "sfx", "ui"]) this.nodes[bus].gain.setTargetAtTime(Math.max(0.0001, this.settings[bus]), now, 0.03);
  }

  #loadSettings() {
    try { return safeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")); }
    catch { return safeSettings(); }
  }

  #saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch { /* soukromý režim */ }
  }
}
