import { AudioManager } from "./AudioManager.js";
import { Clock } from "./Clock.js";
import { InputManager } from "./InputManager.js";
import { PreferencesManager } from "./PreferencesManager.js";
import { PerformanceGovernor } from "./PerformanceGovernor.js";
import { SaveManager } from "./SaveManager.js";
import { HybridRenderer } from "../render/HybridRenderer.js";
import { Hud } from "../ui/Hud.js";
import { ScreenEffects } from "../ui/ScreenEffects.js";
import { World } from "../world/World.js";
import { DialogueManager } from "../systems/DialogueManager.js";
import { DIALOGUES } from "../data/dialogues.js";
import { ATTRIBUTES, RESISTANCE_NAMES } from "../data/classes.js";
import { RARITIES, isEquipment } from "../data/items.js";
import { SKILLS } from "../data/skills.js";

const GAME_STATE = Object.freeze({
  TITLE: "title",
  PLAYING: "playing",
  PAUSED: "paused",
});

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export class Game {
  constructor(documentRoot = document, { assets = null, audio = null } = {}) {
    this.document = documentRoot;
    this.assets = assets;
    this.elements = this.#collectElements();
    this.clock = new Clock();
    this.saves = new SaveManager();
    this.preferences = new PreferencesManager();
    this.preferences.apply(this.document.documentElement);
    this.audio = audio || new AudioManager();
    this.renderer = new HybridRenderer(this.elements.gameCanvas, this.assets);
    this.performance = new PerformanceGovernor({ mode: this.preferences.getSettings().quality });
    this.input = new InputManager({
      canvas: this.elements.gameCanvas,
      moveStick: this.elements.moveStick,
      lookPad: this.elements.lookPad,
      getPreferences: () => this.preferences.getSettings(),
    });
    this.effects = new ScreenEffects({
      root: this.elements.viewportShell,
      damage: this.elements.screenDamage,
      heal: this.elements.screenHeal,
      flash: this.elements.screenFlash,
      banner: this.elements.cinematicBanner,
      bannerTitle: this.elements.cinematicBannerTitle,
      bannerText: this.elements.cinematicBannerText,
    });
    this.hud = new Hud({
      partyPanel: this.elements.partyPanel,
      minimap: this.elements.minimap,
      compass: this.elements.compass,
      gameLog: this.elements.gameLog,
      zoneName: this.elements.zoneName,
      coordinates: this.elements.coordinates,
      interactionHint: this.elements.interactionHint,
      debugOverlay: this.elements.debugOverlay,
      questTracker: this.elements.questTracker,
      resourceStatus: this.elements.resourceStatus,
      combatTarget: this.elements.combatTarget,
      abilityHotbar: this.elements.abilityHotbar,
      quickInventory: this.elements.quickInventory,
      assets: this.assets,
      onPartyMemberSelect: (memberId) => this.showCharacters(memberId),
      onAbilityUse: (slotIndex) => this.castHotbar(slotIndex),
      onQuickItemUse: (itemId) => {
        if (!this.world) return;
        const result = this.world.useItem(itemId, this.world.activeMemberId);
        this.#flushWorldNotifications();
        this.audio.playUi(result.ok ? 659.25 : 174.61, 0.06);
      },
      onOpenInventory: () => this.showInventory(),
    });
    this.dialogue = new DialogueManager(DIALOGUES);

    this.state = GAME_STATE.TITLE;
    this.world = null;
    this.modalOpen = false;
    this.modalOnClose = null;
    this.zoneBannerTimer = 0;
    this.fps = 60;
    this.resizeObserver = null;
    this.defeatShown = false;
    this.autoSaveElapsed = 0;
    this.runtimeErrorCount = 0;
    this.lastRuntimeErrorAt = 0;
    this.lastFocusedElement = null;
    this.modalKeyHandler = null;
    this.#bindUi();
    this.#bindLifecycle();
    this.#refreshContinueButton();
    this.#resizeRenderer();
    this.audio.setScene({ screen: "menu" });
  }

  refreshContinueButton() {
    this.#refreshContinueButton();
  }

  start() {
    this.clock.start(
      (dt) => this.#update(dt),
      (interpolation, elapsed) => this.#render(interpolation, elapsed),
      (error, phase, consecutiveErrors) => this.#handleRuntimeError(error, phase, consecutiveErrors),
    );
  }

  newGame() {
    this.world = new World("willowVale");
    this.dialogue.close();
    this.state = GAME_STATE.PLAYING;
    this.modalOpen = false;
    this.defeatShown = false;
    this.autoSaveElapsed = 0;
    this.input.setEnabled(true);
    this.hud.resetParty();
    this.#showScreen("game");
    this.#showZoneBanner(`${this.world.zone.name} — ${this.world.zone.subtitle}`);
    this.effects.announce(this.world.zone.name, this.world.zone.subtitle || "Kampaň začíná", 4.2);
    this.hud.addLog("Rok 417 po Pádu. Stříbrné mezníky zhasly za jedinou noc.", "info");
    this.hud.addLog("Najděte strážkyni Eliru a zjistěte, co se v údolí stalo.", "warn");
    this.#flushWorldNotifications();
    this.audio.setScene(this.world.getAudioScene());
    this.audio.playUi(523.25, 0.08);
  }

  continueGame() {
    const snapshot = this.saves.load();
    if (!snapshot) {
      this.#showNotice("Uložená pozice", "V tomto prohlížeči není platná uložená pozice pro verzi 1.0.");
      this.#refreshContinueButton();
      return;
    }

    try {
      this.world = new World(snapshot.zoneId || "willowVale");
      this.world.restore(snapshot);
      this.dialogue.close();
      this.state = GAME_STATE.PLAYING;
      this.modalOpen = false;
      this.defeatShown = false;
      this.input.setEnabled(true);
      this.hud.resetParty();
      this.#showScreen("game");
      this.#showZoneBanner(`${this.world.zone.name} — načtená pozice`);
      this.effects.announce(this.world.zone.name, "Uložená výprava obnovena", 3.1);
      this.hud.addLog("Uložená pozice byla načtena.", "system");
      this.audio.setScene(this.world.getAudioScene());
      this.audio.playUi(659.25, 0.07);
    } catch (error) {
      console.error(error);
      this.#showNotice("Chyba uložené pozice", "Uložená data jsou neplatná nebo pocházejí z jiné verze hry.");
    }
  }

  saveGame(showFeedback = true) {
    if (!this.world) return false;
    const saved = this.saves.save(this.world.snapshot());
    if (saved) this.#showSaveIndicator(showFeedback ? "Uloženo" : "Automaticky uloženo");
    if (showFeedback) {
      this.hud.addLog(saved ? "Pozice byla uložena." : "Uložení se nezdařilo.", saved ? "system" : "warn");
      this.audio.playUi(saved ? 698.46 : 196, 0.07);
    }
    this.#refreshContinueButton();
    return saved;
  }

  pause() {
    if (this.state !== GAME_STATE.PLAYING || this.modalOpen) return;
    this.state = GAME_STATE.PAUSED;
    this.input.setEnabled(false);
    if (document.pointerLockElement) document.exitPointerLock?.();
    this.#openModal({
      title: "Hra pozastavena",
      body: `
        <p><strong>Full Release 4.0.1</strong> obsahuje dokončitelnou kampaň, profesionální 12bitovou obrazovou vrstvu, adaptivní výkon, PWA instalaci a bezpečné zálohy pozice.</p>
        <ul>
          <li>20 hlavních a 30 vedlejších questů,</li>
          <li>10 propojených oblastí včetně Stříbrného přístavu a závěrečné citadely,</li>
          <li>tři frakce, dvě zásadní rozhodnutí a devět variant epilogu,</li>
          <li>závěrečný čtyřfázový souboj s Mor-Kharrem.</li>
        </ul>`,
      actions: [
        { label: "Pokračovat", primary: true, onClick: () => this.#closeModal() },
        { label: "Postavy a vývoj", onClick: () => this.showCharacters() },
        { label: "Inventář a vybavení", onClick: () => this.showInventory() },
        { label: "Kniha kouzel", onClick: () => this.showSpellbook() },
        { label: "Deník úkolů", onClick: () => this.showJournal() },
        { label: "Nastavení zvuku", onClick: () => this.showAudioSettings() },
        { label: "Obraz a přístupnost", onClick: () => this.showDisplaySettings() },
        { label: "Záloha uložené hry", onClick: () => this.showSaveTools() },
        { label: "Odpočinout 8 hodin", onClick: () => this.restParty() },
        { label: "Uložit", onClick: () => this.saveGame(true) },
        { label: "Hlavní menu", onClick: () => this.returnToTitle() },
      ],
      canClose: true,
      onClose: () => this.#resumeFromModal(),
    });
  }

  returnToTitle() {
    if (this.world) this.saveGame(false);
    this.dialogue.close();
    this.#closeModal(false);
    this.state = GAME_STATE.TITLE;
    this.input.setEnabled(false);
    this.#showScreen("title");
    this.audio.setScene({ screen: "menu" });
    this.#refreshContinueButton();
  }

  showControls() {
    const wasPlaying = this.state === GAME_STATE.PLAYING;
    if (wasPlaying) {
      this.state = GAME_STATE.PAUSED;
      this.input.setEnabled(false);
    }

    this.#openModal({
      title: "Ovládání",
      body: `
        <h3>Počítač</h3>
        <ul>
          <li><strong>W / S</strong> — vpřed a vzad</li>
          <li><strong>A / D</strong> — úkrok vlevo a vpravo</li>
          <li><strong>Q / E nebo šipky</strong> — otáčení</li>
          <li><strong>Myš</strong> — rozhlížení po kliknutí do obrazu</li>
          <li><strong>R, Enter nebo levé tlačítko myši</strong> — útok</li>
          <li><strong>Tab</strong> — přepnout cíl, <strong>T</strong> — taktická pauza</li>
          <li><strong>F nebo mezerník</strong> — interakce</li>
          <li><strong>C</strong> — postavy, <strong>I</strong> — inventář, <strong>K</strong> — kniha kouzel, <strong>J</strong> — deník, <strong>M</strong> — mapa</li>
          <li><strong>1–8</strong> — použít rychlou schopnost, <strong>F1–F4</strong> — zvolit člena družiny</li>
          <li><strong>F5</strong> — uložit, <strong>F3</strong> — debug, <strong>Esc</strong> — menu</li>
        </ul>
        <h3>iPhone a dotyková zařízení</h3>
        <p>Dotykem v levé části výhledu se objeví pohybový joystick. Tažením v pravé části se rozhlížíte; krátké klepnutí vpravo provede útok. Interakce, cílení, mapa a menu jsou vždy v pevném spodním HUD. Na portrét člena družiny lze klepnout.</p>`,
      actions: [{ label: wasPlaying ? "Zpět do hry" : "Zavřít", primary: true, onClick: () => this.#closeModal() }],
      canClose: true,
      onClose: () => {
        if (wasPlaying) this.#resumeFromModal();
      },
    });
  }

  showAudioSettings() {
    const wasPlaying = this.state === GAME_STATE.PLAYING;
    if (wasPlaying) { this.state = GAME_STATE.PAUSED; this.input.setEnabled(false); }
    const settings = this.audio.getSettings();
    const sliders = [
      ["master", "Celková hlasitost"], ["music", "Hudba"], ["ambience", "Prostředí"], ["sfx", "Efekty"], ["ui", "Rozhraní"],
    ];
    const body = `
      <div class="audio-settings">
        <p>Každá zvuková skupina má vlastní mixer. Změny se ukládají v tomto prohlížeči.</p>
        ${sliders.map(([id, label]) => `<label class="audio-setting"><span>${label}</span><input type="range" min="0" max="100" step="1" value="${Math.round(settings[id] * 100)}" data-audio-setting="${id}"><output>${Math.round(settings[id] * 100)} %</output></label>`).join("")}
        <label class="audio-mute"><input type="checkbox" data-audio-mute ${settings.muted ? "checked" : ""}> <span>Ztlumit veškerý zvuk</span></label>
        <div class="audio-preview-row"><button type="button" data-audio-preview="music">Test hudby</button><button type="button" data-audio-preview="ambience">Test prostředí</button><button type="button" data-audio-preview="sfx">Test efektu</button><button type="button" data-audio-preview="ui">Test UI</button></div>
      </div>`;
    this.#openModal({
      title: "Nastavení zvuku", body,
      actions: [{ label: wasPlaying ? "Zpět do hry" : "Zavřít", primary: true, onClick: () => this.#closeModal() }],
      canClose: true, onClose: () => { if (wasPlaying) this.#resumeFromModal(); },
    });
    this.elements.modalBody.querySelectorAll("[data-audio-setting]").forEach((input) => input.addEventListener("input", () => {
      const value = Number(input.value) / 100; this.audio.setSetting(input.dataset.audioSetting, value);
      const output = input.parentElement.querySelector("output"); if (output) output.value = `${input.value} %`;
    }));
    this.elements.modalBody.querySelector("[data-audio-mute]")?.addEventListener("change", (event) => this.audio.setSetting("muted", event.target.checked));
    this.elements.modalBody.querySelectorAll("[data-audio-preview]").forEach((button) => button.addEventListener("click", () => this.audio.preview(button.dataset.audioPreview)));
  }

  showDisplaySettings() {
    const wasPlaying = this.state === GAME_STATE.PLAYING;
    if (wasPlaying) { this.state = GAME_STATE.PAUSED; this.input.setEnabled(false); }
    const settings = this.preferences.getSettings();
    const checked = (value) => value ? "checked" : "";
    const body = `
      <div class="display-settings">
        <p>Změny se projeví okamžitě a ukládají se pouze v tomto zařízení.</p>
        <label class="settings-row"><span>Kvalita vykreslení</span><select data-pref="quality">
          <option value="auto" ${settings.quality === "auto" ? "selected" : ""}>Automatická</option>
          <option value="low" ${settings.quality === "low" ? "selected" : ""}>Úsporná</option>
          <option value="balanced" ${settings.quality === "balanced" ? "selected" : ""}>Vyvážená</option>
          <option value="high" ${settings.quality === "high" ? "selected" : ""}>Vysoká</option>
        </select></label>
        <label class="settings-check"><input type="checkbox" data-pref="highContrast" ${checked(settings.highContrast)}> <span>Vyšší kontrast rozhraní</span></label>
        <label class="settings-check"><input type="checkbox" data-pref="largeText" ${checked(settings.largeText)}> <span>Větší text v HUD a dialozích</span></label>
        <label class="settings-check"><input type="checkbox" data-pref="reducedMotion" ${checked(settings.reducedMotion)}> <span>Omezit přechody a pohybové efekty</span></label>
        <label class="settings-check"><input type="checkbox" data-pref="crosshair" ${checked(settings.crosshair)}> <span>Zobrazovat zaměřovací kříž</span></label>
        <label class="settings-check"><input type="checkbox" data-pref="autosave" ${checked(settings.autosave)}> <span>Automaticky ukládat každé 2 minuty a při skrytí aplikace</span></label>
        <label class="settings-check"><input type="checkbox" data-pref="tapToAttack" ${checked(settings.tapToAttack)}> <span>Krátké klepnutí v pravé části obrazu provede útok</span></label>
        <label class="settings-row"><span>Citlivost rozhlížení</span><input type="range" min="45" max="180" step="5" value="${Math.round(settings.lookSensitivity * 100)}" data-pref="lookSensitivity"><output>${Math.round(settings.lookSensitivity * 100)} %</output></label>
        <label class="settings-row"><span>Velikost HUD</span><input type="range" min="82" max="118" step="3" value="${Math.round(settings.hudScale * 100)}" data-pref="hudScale"><output>${Math.round(settings.hudScale * 100)} %</output></label>
        <label class="settings-row"><span>Viditelnost dotykového joysticku</span><input type="range" min="35" max="100" step="5" value="${Math.round(settings.touchOpacity * 100)}" data-pref="touchOpacity"><output>${Math.round(settings.touchOpacity * 100)} %</output></label>
      </div>`;
    this.#openModal({
      title: "Obraz a přístupnost", body,
      actions: [{ label: wasPlaying ? "Zpět do hry" : "Zavřít", primary: true, onClick: () => this.#closeModal() }],
      canClose: true, onClose: () => { if (wasPlaying) this.#resumeFromModal(); },
    });
    this.elements.modalBody.querySelectorAll("[data-pref]").forEach((control) => {
      const eventName = control.type === "range" ? "input" : "change";
      control.addEventListener(eventName, () => {
        const name = control.dataset.pref;
        const value = control.type === "checkbox" ? control.checked : control.type === "range" ? Number(control.value) / 100 : control.value;
        this.preferences.setSetting(name, value);
        this.preferences.apply(this.document.documentElement);
        if (control.type === "range") control.parentElement.querySelector("output").value = `${control.value} %`;
        if (name === "quality") { this.performance.setMode(value); this.#resizeRenderer(); }
        if (name === "hudScale") requestAnimationFrame(() => this.#resizeRenderer());
      });
    });
  }

  showSaveTools() {
    const wasPlaying = this.state === GAME_STATE.PLAYING;
    if (wasPlaying) { this.state = GAME_STATE.PAUSED; this.input.setEnabled(false); }
    const metadata = this.saves.getMetadata();
    const savedAt = metadata?.savedAt ? new Date(metadata.savedAt).toLocaleString("cs-CZ") : "žádná pozice";
    const body = `
      <div class="save-tools">
        <p>Aktuální uložená pozice: <strong>${escapeHtml(savedAt)}</strong></p>
        <p>Export vytvoří textový soubor, který lze bezpečně uložit mimo prohlížeč a později importovat.</p>
        <label class="file-import"><span>Importovat zálohu</span><input type="file" accept="application/json,.json" data-save-import></label>
        <p class="save-tools__status" data-save-status aria-live="polite"></p>
      </div>`;
    this.#openModal({
      title: "Záloha uložené hry", body,
      actions: [
        { label: "Uložit nyní", primary: Boolean(this.world), onClick: () => this.saveGame(true) },
        { label: "Exportovat JSON", onClick: () => this.#exportSaveFile() },
        { label: wasPlaying ? "Zpět do hry" : "Zavřít", primary: !this.world, onClick: () => this.#closeModal() },
      ],
      canClose: true, onClose: () => { if (wasPlaying) this.#resumeFromModal(); },
    });
    const input = this.elements.modalBody.querySelector("[data-save-import]");
    input?.addEventListener("change", async () => {
      const status = this.elements.modalBody.querySelector("[data-save-status]");
      const file = input.files?.[0];
      if (!file) return;
      const ok = this.saves.importSave(await file.text());
      if (status) status.textContent = ok ? "Záloha byla importována. Nyní lze zvolit Pokračovat." : "Soubor není platná záloha této hry.";
      this.#refreshContinueButton();
    });
  }

  #exportSaveFile() {
    const data = this.saves.exportSave();
    if (!data) { this.#showNotice("Export", "Není k dispozici žádná uložená pozice."); return; }
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = this.document.createElement("a");
    anchor.href = url;
    anchor.download = `kroniky-stribrne-brany-save-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  showJournal() {
    if (!this.world) return;
    const wasPlaying = this.state === GAME_STATE.PLAYING;
    this.state = GAME_STATE.PAUSED;
    this.input.setEnabled(false);

    const entries = this.world.quests.getJournalEntries();
    const active = entries.filter((entry) => entry.state.status === "active");
    const completed = entries.filter((entry) => entry.state.status === "completed");

    const renderQuest = (entry) => {
      const objectives = entry.currentStage?.objectives || [];
      const objectiveHtml = objectives.map((objective) => {
        const required = objective.count ?? 1;
        const progress = required > 1 ? ` ${objective.current}/${required}` : "";
        return `<li class="${objective.complete ? "is-complete" : ""}">${objective.complete ? "✓" : "○"} ${escapeHtml(objective.label)}${progress}</li>`;
      }).join("");
      return `
        <article class="journal-entry ${entry.tracked ? "is-tracked" : ""}">
          <div class="journal-entry__heading">
            <span class="quest-kind">${entry.category === "main" ? "Hlavní" : "Vedlejší"}</span>
            <h3>${escapeHtml(entry.title)}</h3>
            ${entry.tracked ? '<span class="tracked-mark">Sledováno</span>' : ""}
          </div>
          <p>${escapeHtml(entry.summary)}</p>
          ${entry.currentStage ? `<h4>${escapeHtml(entry.currentStage.title)}</h4><p>${escapeHtml(entry.currentStage.description)}</p><ul class="objective-list">${objectiveHtml}</ul>` : '<p class="quest-complete-copy">Dokončeno.</p>'}
        </article>`;
    };

    const factions = this.world.getFactionView();
    const factionHtml = factions.map((faction) => `<span class="faction-chip"><strong>${escapeHtml(faction.name)}</strong> ${faction.reputation >= 0 ? "+" : ""}${faction.reputation}</span>`).join("");
    const body = `
      <div class="journal-summary"><strong>${active.length}</strong> aktivní · <strong>${completed.length}</strong> dokončené · <strong>${this.world.gold}</strong> zlatých · pověst <strong>${this.world.reputation}</strong></div>
      <div class="faction-summary">${factionHtml}</div>
      <section class="journal-section"><h3>Aktivní úkoly</h3>${active.length ? active.map(renderQuest).join("") : "<p>Žádné aktivní úkoly.</p>"}</section>
      ${completed.length ? `<section class="journal-section"><h3>Dokončené úkoly</h3>${completed.map(renderQuest).join("")}</section>` : ""}`;

    const actions = active.map((entry) => ({
      label: entry.tracked ? `Sledováno: ${entry.title}` : `Sledovat: ${entry.title}`,
      onClick: () => {
        this.world.quests.setTracked(entry.questId);
        this.audio.playUi(587.33, 0.05);
        this.showJournal();
      },
    }));
    actions.push({ label: "Zavřít deník", primary: true, onClick: () => this.#closeModal() });

    this.#openModal({
      title: "Deník úkolů",
      body,
      actions,
      canClose: true,
      wide: true,
      onClose: () => {
        if (wasPlaying || this.state === GAME_STATE.PAUSED) this.#resumeFromModal();
      },
    });
  }


  showCharacters(memberId = this.world?.activeMemberId) {
    if (!this.world) return;
    this.state = GAME_STATE.PAUSED;
    this.input.setEnabled(false);
    if (memberId) this.world.selectPartyMember(memberId, false);
    this.#renderCharacterSheet(this.world.activeMemberId);
  }

  showInventory(memberId = this.world?.activeMemberId) {
    if (!this.world) return;
    this.state = GAME_STATE.PAUSED;
    this.input.setEnabled(false);
    if (memberId) this.world.selectPartyMember(memberId, false);
    const activeId = this.world.activeMemberId;
    const activeMember = this.world.partyManager.getMember(activeId);
    const view = this.world.getInventoryView();

    const categoryNames = {
      weapon: "Zbraň", shield: "Štít", armor: "Zbroj", helmet: "Přilba", boots: "Boty",
      accessory: "Doplněk", consumable: "Spotřební", material: "Surovina", treasure: "Cennost", quest: "Úkolový",
    };
    const formatModifiers = (definition) => {
      const labels = {
        attack: "útok", defense: "obrana", initiative: "iniciativa", spellPower: "síla kouzel",
        healingPower: "léčení", criticalChance: "% kritický zásah", maxHp: "max. život", maxMp: "max. mana",
        fireResistance: "odolnost oheň", frostResistance: "odolnost mráz", shockResistance: "odolnost blesk",
        poisonResistance: "odolnost jed", mindResistance: "odolnost mysl", spiritResistance: "odolnost duch",
      };
      return Object.entries(definition.modifiers || {})
        .filter(([, value]) => Number(value))
        .map(([key, value]) => `${value > 0 ? "+" : ""}${value} ${labels[key] || key}`)
        .join(" · ");
    };

    const memberTabs = this.world.party.map((member) => `
      <button type="button" class="character-tab ${member.id === activeId ? "is-active" : ""}" data-inventory-member="${escapeHtml(member.id)}">
        <span>${escapeHtml(member.initials)}</span><strong>${escapeHtml(member.name)}</strong><small>${escapeHtml(member.className)}</small>
      </button>`).join("");

    const equipment = this.world.inventoryManager.getEquippedItems(activeId).map(({ slotId, slot, itemId, item }) => `
      <article class="equipment-slot ${item ? `rarity-${item.rarity}` : "is-empty"}">
        <span class="equipment-slot__name">${escapeHtml(slot.name)}</span>
        ${item ? `${this.#itemIconMarkup(itemId, item.icon)}<strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(formatModifiers(item) || item.description)}</small><button type="button" data-unequip-slot="${escapeHtml(slotId)}">Sundat</button>`
          : '<span class="item-icon">·</span><strong>Prázdné</strong><small>Do tohoto slotu není nic vybaveno.</small>'}
      </article>`).join("");

    const items = view.items.map(({ itemId, count, definition, totalWeight }) => {
      const rarity = RARITIES[definition.rarity]?.name || definition.rarity;
      const modifiers = formatModifiers(definition);
      const canUse = definition.category === "consumable" && !(definition.effects || []).every((effect) => effect.type === "ration");
      return `
        <article class="inventory-item rarity-${escapeHtml(definition.rarity)}">
          ${this.#itemIconMarkup(itemId, definition.icon)}
          <div class="inventory-item__copy">
            <div><strong>${escapeHtml(definition.name)}</strong><span class="rarity-label">${escapeHtml(rarity)}</span></div>
            <small>${escapeHtml(categoryNames[definition.category] || definition.category)} · ${count} ks · ${totalWeight.toFixed(2)} kg · hodnota ${definition.value} zl.</small>
            <p>${escapeHtml(definition.description)}</p>
            ${modifiers ? `<p class="item-modifiers">${escapeHtml(modifiers)}</p>` : ""}
          </div>
          <div class="inventory-item__actions">
            ${isEquipment(definition) ? `<button type="button" data-inventory-action="equip" data-item-id="${escapeHtml(itemId)}">Vybavit ${escapeHtml(activeMember.name)}</button>` : ""}
            ${canUse ? `<button type="button" data-inventory-action="use" data-item-id="${escapeHtml(itemId)}">Použít na ${escapeHtml(activeMember.name)}</button>` : ""}
          </div>
        </article>`;
    }).join("");

    const body = `
      <nav class="character-tabs" aria-label="Komu vybavit předměty">${memberTabs}</nav>
      <section class="inventory-summary">
        <div><span>Batoh</span><strong>${view.usedSlots}/${view.maxSlots} slotů</strong></div>
        <div><span>Hmotnost batohu</span><strong>${view.weight.toFixed(2)}/${view.capacity} kg</strong></div>
        <div><span>Vybaveno</span><strong>${view.equippedWeight.toFixed(2)} kg</strong></div>
        <div><span>Zlato</span><strong>${this.world.gold}</strong></div>
      </section>
      <section class="inventory-section"><h3>Vybavení — ${escapeHtml(activeMember.name)}</h3><div class="equipment-grid">${equipment}</div></section>
      <section class="inventory-section"><h3>Sdílený batoh</h3><div class="inventory-list">${items || "<p>Batoh je prázdný.</p>"}</div></section>`;

    this.#openModal({
      title: "Inventář, vybavení a nosnost",
      body,
      actions: [{ label: "Zpět do hry", primary: true, onClick: () => this.#closeModal() }],
      canClose: true,
      wide: true,
      onClose: () => this.#resumeFromModal(),
    });

    for (const button of this.elements.modalBody.querySelectorAll("[data-inventory-member]")) {
      button.addEventListener("click", () => {
        this.audio.playUi(493.88, 0.045);
        this.showInventory(button.dataset.inventoryMember);
      });
    }
    for (const button of this.elements.modalBody.querySelectorAll("[data-unequip-slot]")) {
      button.addEventListener("click", () => {
        const result = this.world.unequipItem(activeId, button.dataset.unequipSlot);
        this.#flushWorldNotifications();
        this.audio.playUi(result.ok ? 523.25 : 174.61, 0.055);
        this.showInventory(activeId);
      });
    }
    for (const button of this.elements.modalBody.querySelectorAll("[data-inventory-action]")) {
      button.addEventListener("click", () => {
        const itemId = button.dataset.itemId;
        const result = button.dataset.inventoryAction === "equip"
          ? this.world.equipItem(activeId, itemId)
          : this.world.useItem(itemId, activeId);
        this.#flushWorldNotifications();
        this.audio.playUi(result.ok ? 659.25 : 174.61, 0.06);
        this.showInventory(activeId);
      });
    }
  }

  showShop(vendorId) {
    if (!this.world) return;
    const view = this.world.getVendorView(vendorId);
    if (!view) return;
    this.state = GAME_STATE.PAUSED;
    this.input.setEnabled(false);

    const renderRow = (entry, mode) => `
      <article class="shop-row rarity-${escapeHtml(entry.item.rarity || entry.definition?.rarity || "common")}">
        ${this.#itemIconMarkup(entry.itemId, (entry.item || entry.definition).icon)}
        <div><strong>${escapeHtml((entry.item || entry.definition).name)}</strong><small>${mode === "buy" ? `Skladem ${entry.count}` : `V batohu ${entry.count}`} · ${escapeHtml((entry.item || entry.definition).description)}</small></div>
        <span class="shop-price">${entry.price} zl.</span>
        <button type="button" data-shop-action="${mode}" data-shop-item="${escapeHtml(entry.itemId)}" ${mode === "buy" && this.world.gold < entry.price ? "disabled" : ""}>${mode === "buy" ? "Koupit" : "Prodat"}</button>
      </article>`;

    const body = `
      <section class="shop-heading"><p>${escapeHtml(view.vendor.description)}</p><div><strong>${this.world.gold} zl.</strong><span>Diplomacie ${view.diplomacy} · pověst ${this.world.reputation}</span></div></section>
      <div class="shop-columns">
        <section><h3>Nabídka obchodníka</h3><div class="shop-list">${view.wares.map((entry) => renderRow(entry, "buy")).join("") || "<p>Nabídka je vyprodána.</p>"}</div></section>
        <section><h3>Prodat z batohu</h3><div class="shop-list">${view.buyback.map((entry) => renderRow({ ...entry, item: entry.definition }, "sell")).join("") || "<p>Nemáte nic, co by obchodník vykoupil.</p>"}</div></section>
      </div>`;

    this.#openModal({
      title: view.vendor.name,
      body,
      actions: [
        { label: "Otevřít inventář", onClick: () => this.showInventory() },
        { label: "Ukončit obchod", primary: true, onClick: () => this.#closeModal() },
      ],
      canClose: true,
      wide: true,
      onClose: () => this.#resumeFromModal(),
    });

    for (const button of this.elements.modalBody.querySelectorAll("[data-shop-action]")) {
      button.addEventListener("click", () => {
        const result = button.dataset.shopAction === "buy"
          ? this.world.buyItem(vendorId, button.dataset.shopItem, 1)
          : this.world.sellItem(vendorId, button.dataset.shopItem, 1);
        this.#flushWorldNotifications();
        this.audio.playUi(result.ok ? 698.46 : 174.61, 0.055);
        this.showShop(vendorId);
      });
    }
  }

  restParty() {
    if (!this.world) return;
    const result = this.world.restParty();
    this.#flushWorldNotifications();
    this.audio.playUi(result.ok ? 392 : 174.61, 0.12);
    if (result.ok) this.#closeModal();
  }

  #renderCharacterSheet(memberId) {
    const view = this.world?.getCharacterView(memberId);
    if (!view) return;
    const { member, classDefinition, derived, skillViews, adjustedResistances } = view;
    const xpCurrent = Math.max(0, member.experience - view.currentLevelStart);
    const xpNeeded = Math.max(1, view.nextLevel - view.currentLevelStart);
    const xpPercent = Math.round(view.xpProgress * 100);
    const conditionNames = { healthy: "Zdravý", wounded: "Zraněný", unconscious: "V bezvědomí", dead: "Mrtvý" };

    const memberTabs = this.world.party.map((entry) => `
      <button type="button" class="character-tab ${entry.id === member.id ? "is-active" : ""}" data-character-id="${escapeHtml(entry.id)}">
        <span>${escapeHtml(entry.initials)}</span>
        <strong>${escapeHtml(entry.name)}</strong>
        <small>Úroveň ${entry.level}</small>
      </button>`).join("");

    const attributes = Object.values(ATTRIBUTES).map((attribute) => {
      const canRaise = member.attributePoints > 0 && member.attributes[attribute.id] < 40;
      return `
        <div class="attribute-row" title="${escapeHtml(attribute.description)}">
          <span class="attribute-short">${escapeHtml(attribute.short)}</span>
          <span class="attribute-name">${escapeHtml(attribute.name)}</span>
          <strong>${member.attributes[attribute.id]}</strong>
          <button type="button" data-attribute-id="${escapeHtml(attribute.id)}" ${canRaise ? "" : "disabled"} aria-label="Zvýšit ${escapeHtml(attribute.name)}">+</button>
        </div>`;
    }).join("");

    const stats = [
      ["Útok", derived.attack], ["Obrana", derived.defense], ["Iniciativa", derived.initiative],
      ["Síla kouzel", derived.spellPower], ["Léčení", derived.healingPower],
      ["Kritický zásah", `${derived.criticalChance} %`], ["Velení", derived.leadership],
    ].map(([label, value]) => `<div class="derived-stat"><span>${label}</span><strong>${value}</strong></div>`).join("");

    const resistances = Object.entries(RESISTANCE_NAMES).map(([id, label]) => {
      const base = member.resistances[id] ?? 0;
      const adjusted = adjustedResistances?.[id] ?? base;
      return `<div class="resistance-row"><span>${escapeHtml(label)}</span><strong>${adjusted}${adjusted !== base ? ` <small>(+${adjusted - base})</small>` : ""}</strong></div>`;
    }).join("");

    const skills = skillViews.map((skill) => {
      const canTrain = skill.trainingCost !== null && member.skillPoints >= skill.trainingCost;
      const cost = skill.trainingCost === null ? "MAX" : `${skill.trainingCost} b.`;
      return `
        <article class="skill-row" title="${escapeHtml(skill.description)}">
          <div>
            <span class="skill-category">${escapeHtml(skill.category)}</span>
            <strong>${escapeHtml(skill.name)}</strong>
            <small>${escapeHtml(skill.mastery.name)} · maximum ${skill.cap}</small>
          </div>
          <span class="skill-rank">${skill.rank}</span>
          <button type="button" data-skill-id="${escapeHtml(skill.id)}" ${canTrain ? "" : "disabled"}>${cost}</button>
        </article>`;
    }).join("");

    const equipped = this.world.inventoryManager.getEquippedItems(member.id).map(({ slot, itemId, item }) => `
      <div class="character-equipment-slot"><span>${escapeHtml(slot.name)}</span><strong>${item ? `${this.#itemIconMarkup(itemId, item.icon, "equipment-mini-icon")} ${escapeHtml(item.name)}` : "Prázdné"}</strong></div>`).join("");

    const body = `
      <nav class="character-tabs" aria-label="Členové družiny">${memberTabs}</nav>
      <section class="character-hero">
        <div class="character-portrait">${this.assets?.getPortrait(member.id) ? `<img src="${escapeHtml(this.assets.getPortrait(member.id))}" alt="Portrét: ${escapeHtml(member.name)}">` : escapeHtml(member.initials)}</div>
        <div>
          <p class="character-role">${escapeHtml(classDefinition.role)}</p>
          <h3>${escapeHtml(member.name)} · ${escapeHtml(classDefinition.name)}</h3>
          <p>${escapeHtml(classDefinition.description)}</p>
          <p class="character-biography">${escapeHtml(member.biography)}</p>
        </div>
        <div class="character-level"><span>Úroveň</span><strong>${member.level}</strong><small>${conditionNames[member.condition] || member.condition}</small></div>
      </section>
      <section class="character-equipment"><div><h3>Vybavení</h3><p>Bonusy vybavení jsou již zahrnuty v odvozených statistikách.</p></div><div class="character-equipment-grid">${equipped}</div><button type="button" data-open-inventory="${escapeHtml(member.id)}">Spravovat vybavení</button></section>
      <section class="progression-summary">
        <div><span>Zkušenosti</span><strong>${member.experience}</strong><small>${xpCurrent}/${xpNeeded} do další úrovně</small></div>
        <div class="xp-track" aria-label="Postup zkušeností ${xpPercent} procent"><span style="width:${xpPercent}%"></span></div>
        <div class="point-pool"><span>Atributové body <strong>${member.attributePoints}</strong></span><span>Dovednostní body <strong>${member.skillPoints}</strong></span></div>
      </section>
      <div class="character-columns">
        <section><h3>Atributy</h3><div class="attribute-list">${attributes}</div></section>
        <section><h3>Odvozené statistiky</h3><div class="derived-grid">${stats}</div><h3>Odolnosti</h3><div class="resistance-grid">${resistances}</div></section>
      </div>
      <section class="skill-section"><h3>Dovednosti a mistrovství</h3><p>Výcvik stojí 1 bod do hodnosti 4, 2 body do hodnosti 7 a poté 3 body. Třída omezuje maximální hodnost.</p><div class="skill-list">${skills}</div></section>`;

    this.#openModal({
      title: "Družina a vývoj postav",
      body,
      actions: [{ label: "Zpět do hry", primary: true, onClick: () => this.#closeModal() }],
      canClose: true,
      wide: true,
      onClose: () => this.#resumeFromModal(),
    });

    for (const button of this.elements.modalBody.querySelectorAll("[data-character-id]")) {
      button.addEventListener("click", () => {
        const nextId = button.dataset.characterId;
        this.world.selectPartyMember(nextId, false);
        this.audio.playUi(493.88, 0.045);
        this.#renderCharacterSheet(nextId);
      });
    }

    for (const button of this.elements.modalBody.querySelectorAll("[data-attribute-id]")) {
      button.addEventListener("click", () => {
        const result = this.world.spendAttributePoint(member.id, button.dataset.attributeId);
        this.#flushWorldNotifications();
        this.audio.playUi(result.ok ? 659.25 : 174.61, 0.055);
        this.#renderCharacterSheet(member.id);
      });
    }

    for (const button of this.elements.modalBody.querySelectorAll("[data-skill-id]")) {
      button.addEventListener("click", () => {
        const result = this.world.trainSkill(member.id, button.dataset.skillId);
        this.#flushWorldNotifications();
        this.audio.playUi(result.ok ? 783.99 : 174.61, 0.055);
        this.#renderCharacterSheet(member.id);
      });
    }
    this.elements.modalBody.querySelector("[data-open-inventory]")?.addEventListener("click", () => this.showInventory(member.id));
  }

  attack() {
    this.effects.update(dt);
    if (!this.world || this.state !== GAME_STATE.PLAYING || this.modalOpen) return;
    const member = this.world.partyManager.activeMember;
    const equipment = member ? this.world.inventoryManager.getEquipment(member.id) : null;
    const weaponSkill = equipment?.mainHand ? ITEMS[equipment.mainHand]?.skill : null;
    const result = this.world.attack();
    if (result.ok) {
      this.audio.playAttack(result.attackKind, result.critical, weaponSkill);
      if (result.hit === false) this.audio.playMiss();
    } else this.audio.playUi(174.61, 0.035);
    this.#flushWorldNotifications();
  }

  castHotbar(slotIndex) {
    if (!this.world || this.state !== GAME_STATE.PLAYING || this.modalOpen) return;
    const result = this.world.castHotbar(slotIndex);
    this.audio.playMagic(result.abilityId, result.ok);
    this.#flushWorldNotifications();
  }

  showSpellbook(memberId = this.world?.activeMemberId) {
    if (!this.world) return;
    this.state = GAME_STATE.PAUSED;
    this.input.setEnabled(false);
    if (memberId) this.world.selectPartyMember(memberId, false);
    const view = this.world.getMagicView(this.world.activeMemberId);
    const member = view.member;
    const tabs = this.world.party.map((entry) => `<button type="button" class="character-tab ${entry.id === member.id ? "is-active" : ""}" data-spell-member="${escapeHtml(entry.id)}"><span>${escapeHtml(entry.initials)}</span><strong>${escapeHtml(entry.name)}</strong><small>${escapeHtml(entry.className)}</small></button>`).join("");
    const statusHtml = view.statuses.length ? view.statuses.map((status) => `<span class="status-badge" style="color:${escapeHtml(status.definition?.color || "#ddd")}">${escapeHtml(status.definition?.icon || "·")} ${escapeHtml(status.definition?.name || status.id)} ${status.remaining.toFixed(1)}s</span>`).join("") : "<span>Bez aktivních efektů.</span>";
    const cards = view.spellbook.map(({ ability, unlocked, cooldown, assignedSlots }) => {
      const requirement = ability.requiredSkill ? `${SKILLS[ability.requiredSkill.id]?.name || ability.requiredSkill.id} ${ability.requiredSkill.rank}` : "bez požadavku";
      const slots = Array.from({ length: 8 }, (_, index) => `<button type="button" class="${assignedSlots.includes(index) ? "is-assigned" : ""}" data-assign-ability="${escapeHtml(ability.id)}" data-slot="${index}">${index + 1}</button>`).join("");
      return `<article class="spell-card ${unlocked ? "" : "is-locked"}"><div class="spell-card__heading"><span class="spell-card__icon">${escapeHtml(ability.icon)}</span><div><strong>${escapeHtml(ability.name)}</strong><small>${escapeHtml(ability.kind === "spell" ? "Kouzlo" : "Schopnost")} · ${escapeHtml(ability.school)}</small></div></div><p>${escapeHtml(ability.description)}</p><div class="spell-card__meta"><span>Mana ${ability.manaCost}</span><span>Cooldown ${ability.cooldown}s</span><span>Úroveň ${ability.unlockLevel}</span><span>${escapeHtml(requirement)}</span></div><div class="spell-card__actions"><button type="button" data-cast-ability="${escapeHtml(ability.id)}" ${unlocked ? "" : "disabled"}>${cooldown > 0 ? `Čekat ${cooldown.toFixed(1)}s` : "Použít"}</button></div><div class="hotbar-assignment">${slots}</div></article>`;
    }).join("");
    const body = `<div class="character-tabs">${tabs}</div><div class="spellbook-summary"><div><strong>${member.mp}/${member.maxMp}</strong>mana</div><div><strong>${view.spellbook.filter((entry) => entry.unlocked).length}</strong>odemčeno</div><div><strong>${view.statuses.length}</strong>efektů</div><div><strong>${member.level}</strong>úroveň</div></div><div class="status-list">${statusHtml}</div><div class="spellbook-grid">${cards}</div>`;
    this.#openModal({ title: `Kniha schopností — ${member.name}`, body, actions: [{ label: "Zavřít", primary: true, onClick: () => this.#closeModal() }], canClose: true, wide: true, onClose: () => this.#resumeFromModal() });
    this.elements.modalBody.querySelectorAll("[data-spell-member]").forEach((button) => button.addEventListener("click", () => this.showSpellbook(button.dataset.spellMember)));
    this.elements.modalBody.querySelectorAll("[data-assign-ability]").forEach((button) => button.addEventListener("click", () => { this.world.setHotbarSlot(member.id, Number(button.dataset.slot), button.dataset.assignAbility); this.#flushWorldNotifications(); this.showSpellbook(member.id); }));
    this.elements.modalBody.querySelectorAll("[data-cast-ability]").forEach((button) => button.addEventListener("click", () => { const result = this.world.castAbility(button.dataset.castAbility, { memberId: member.id }); this.audio.playMagic(result.abilityId, result.ok); this.#flushWorldNotifications(); this.showSpellbook(member.id); }));
  }

  cycleCombatTarget() {
    if (!this.world || this.state !== GAME_STATE.PLAYING || this.modalOpen) return;
    const target = this.world.cycleCombatTarget(1);
    this.audio.playUi(target ? 622.25 : 174.61, 0.045);
    this.#flushWorldNotifications();
  }

  toggleTacticalPause() {
    if (!this.world || this.state !== GAME_STATE.PLAYING || this.modalOpen) return;
    const paused = this.world.toggleTacticalPause();
    this.audio.playTacticalPause(paused);
    this.#flushWorldNotifications();
  }

  interact() {
    if (!this.world || this.state !== GAME_STATE.PLAYING || this.modalOpen) return;
    const entity = this.world.getInteractable();
    if (!entity?.interaction) {
      this.hud.addLog("V dosahu není nic k použití.", "info");
      this.audio.playUi(174.61, 0.035);
      return;
    }

    const interaction = entity.interaction;
    this.audio.playInteract();

    if (interaction.type === "dialogue" && entity.dialogueId) {
      this.#openDialogue(entity.dialogueId);
      return;
    }

    if (interaction.type === "shop" && interaction.vendorId) {
      this.showShop(interaction.vendorId);
      return;
    }

    if (interaction.type === "loot") {
      const result = this.world.openLoot(entity);
      this.#flushWorldNotifications();
      this.audio.playUi(result.ok ? 740 : 174.61, 0.08);
      if (!result.ok) this.hud.addLog(result.reason, "warn");
      return;
    }

    if (interaction.type === "collect") {
      if (this.world.collectEntity(entity)) {
        this.audio.playCollect();
        this.hud.addLog(`${interaction.itemName || entity.name} získán.`, "system");
        if (interaction.text) this.hud.addLog(interaction.text, "info");
      }
      this.#flushWorldNotifications();
      return;
    }

    if (interaction.type === "transition") {
      const result = this.world.useTransition(entity);
      this.#flushWorldNotifications();
      if (result.ok) {
        this.hud.resetParty();
        this.#showZoneBanner(`${this.world.zone.name} — ${this.world.zone.subtitle}`);
        this.audio.playZoneTransition();
      } else {
        this.hud.addLog(result.reason, "warn");
        this.audio.playUi(174.61, 0.06);
      }
      return;
    }

    if (interaction.type === "door") {
      const result = this.world.useDoor(entity);
      this.#flushWorldNotifications();
      this.audio.playDoor(result.ok, result.action === "opened");
      if (!result.ok) this.hud.addLog(result.reason, "warn");
      return;
    }

    if (interaction.type === "lever") {
      const result = this.world.useLever(entity);
      this.#flushWorldNotifications();
      this.audio.playMechanism(result.ok);
      if (!result.ok) this.hud.addLog(result.reason, "warn");
      return;
    }

    if (interaction.type === "secret") {
      const result = this.world.useSecret(entity);
      this.#flushWorldNotifications();
      this.audio.playMechanism(result.ok);
      if (!result.ok) this.hud.addLog(result.reason, "warn");
      return;
    }

    if (interaction.type === "trap") {
      const result = this.world.disarmTrap(entity);
      this.#flushWorldNotifications();
      this.audio.playTrap(result.ok);
      if (!result.ok) this.hud.addLog(result.reason, "warn");
      return;
    }

    this.world.inspectEntity(entity);
    this.#flushWorldNotifications();
    this.state = GAME_STATE.PAUSED;
    this.input.setEnabled(false);
    this.#openModal({
      title: interaction.title || entity.name,
      body: `<p>${escapeHtml(interaction.text || "Nenacházíš nic neobvyklého.")}</p>`,
      actions: [{ label: "Pokračovat", primary: true, onClick: () => this.#closeModal() }],
      canClose: true,
      onClose: () => this.#resumeFromModal(),
    });
  }

  #openDialogue(dialogueId) {
    const view = this.dialogue.start(dialogueId, this.world);
    if (!view) {
      this.hud.addLog("Postava teď nemá co říci.", "info");
      return;
    }
    this.state = GAME_STATE.PAUSED;
    this.input.setEnabled(false);
    this.#renderDialogue(view);
  }

  #renderDialogue(view) {
    const actions = view.choices.map((choice) => ({
      label: choice.label,
      onClick: () => {
        this.audio.playDialogueChoice();
        const outcome = this.dialogue.choose(choice.id, this.world);
        this.#flushWorldNotifications();
        if (outcome.closed) this.#closeModal();
        else this.#renderDialogue(outcome.view);
      },
    }));

    this.#openModal({
      title: view.speaker,
      body: `<div class="dialogue-copy"><span class="dialogue-rune" aria-hidden="true">◆</span><p>${escapeHtml(view.text)}</p></div>`,
      actions,
      canClose: true,
      onClose: () => {
        this.dialogue.close();
        this.#resumeFromModal();
      },
    });
  }

  #update(dt) {
    if (this.zoneBannerTimer > 0) {
      this.zoneBannerTimer -= dt;
      if (this.zoneBannerTimer <= 0) this.elements.zoneBanner.classList.remove("is-visible");
    }

    if (!this.world || this.state !== GAME_STATE.PLAYING || this.modalOpen) return;

    if (this.preferences.getSettings().autosave) {
      this.autoSaveElapsed += dt;
      if (this.autoSaveElapsed >= 120) {
        this.autoSaveElapsed = 0;
        this.saveGame(false);
      }
    }

    const axes = this.input.getAxes();
    this.world.move(axes, dt, (material) => this.audio.playStep(material));
    this.world.update(dt);
    this.audio.update(dt, this.world.getAudioScene());
    this.#flushWorldNotifications();
    const ending = this.world.consumeEnding();
    if (ending) {
      this.#showCampaignEnding(ending);
      return;
    }

    if (this.input.consumePressed("KeyR") || this.input.consumePressed("Enter") || this.input.consumePressed("Mouse0") || this.input.consumePressed("TouchTap")) this.attack();
    if (this.input.consumePressed("Tab")) this.cycleCombatTarget();
    if (this.input.consumePressed("KeyT")) this.toggleTacticalPause();
    if (this.input.consumePressed("KeyF") || this.input.consumePressed("Space")) this.interact();
    if (this.input.consumePressed("KeyC")) this.showCharacters();
    if (this.input.consumePressed("KeyI")) this.showInventory();
    if (this.input.consumePressed("KeyK")) this.showSpellbook();
    if (this.input.consumePressed("KeyJ")) this.showJournal();
    if (this.input.consumePressed("KeyM")) {
      this.hud.toggleFullMap();
      this.audio.playUi(440, 0.04);
    }
    for (let index = 0; index < 8; index += 1) {
      if (this.input.consumePressed(`Digit${index + 1}`)) this.castHotbar(index);
    }
    for (let index = 0; index < 4; index += 1) {
      if (this.input.consumePressed(`F${index + 1}`)) {
        const member = this.world.party[index];
        if (member) {
          this.world.selectPartyMember(member.id);
          this.#flushWorldNotifications();
          this.audio.playUi(440 + index * 55, 0.04);
        }
      }
    }
    if (this.input.consumePressed("F5")) this.saveGame(true);
    if (this.input.consumePressed("F3")) {
      const enabled = this.hud.toggleDebug();
      this.hud.addLog(`Technické údaje ${enabled ? "zapnuty" : "vypnuty"}.`, "system");
    }
    if (this.input.consumePressed("Escape")) this.pause();

    this.hud.renderInteraction(this.world.getInteractable());
  }

  #render(interpolation, elapsed) {
    const instantaneousFps = elapsed > 0 ? 1 / elapsed : 60;
    this.fps += (instantaneousFps - this.fps) * 0.08;
    if (this.performance.update(elapsed, this.fps)) this.#resizeRenderer();
    if (!this.world || this.state === GAME_STATE.TITLE) return;
    this.renderer.render(this.world, interpolation);
    this.hud.render(this.world, this.fps);
  }

  #handleRuntimeError(error, phase, consecutiveErrors = 1) {
    console.error(`Herní smyčka selhala ve fázi ${phase}`, error);
    this.runtimeErrorCount += 1;
    const now = performance.now();
    if (now - this.lastRuntimeErrorAt > 2500) {
      this.lastRuntimeErrorAt = now;
      this.#showSaveIndicator(phase === "render" ? "Obraz obnoven v bezpečném režimu" : "Herní smyčka byla obnovena");
      this.hud?.addLog?.("Hra zachytila technickou chybu a pokračuje v bezpečném režimu.", "warn");
    }
    if (phase === "render") this.renderer?.enableSafeMode?.(error);
    if (consecutiveErrors >= 4) {
      this.input.setEnabled(false);
      this.state = GAME_STATE.PAUSED;
      this.#showNotice("Technická ochrana", "Hra zachytila opakovanou chybu. Pozice zůstala zachována; po zavření okna lze pokračovat nebo načíst poslední autosave.");
    }
  }

  #flushWorldNotifications() {
    if (!this.world) return;
    for (const notification of this.world.consumeNotifications()) {
      const logType = ["complete", "reward", "levelUp", "progress"].includes(notification.type) ? "system"
        : ["quest", "warning", "defeat"].includes(notification.type) ? "warn" : "info";
      if (notification.message) this.hud.addLog(notification.message, logType);
      if (notification.type === "quest") this.audio.playQuestUpdate();
      if (notification.type === "complete") this.audio.playQuestComplete();
      if (notification.type === "levelUp") this.audio.playUi(880, 0.13);
      if (notification.type === "combat") this.audio.playCombatPulse();
      if (notification.type === "discovery") this.audio.playDiscovery();
      if (notification.type === "zone") this.audio.playZoneTransition();
      if (notification.audioCue) this.audio.playCue(notification.audioCue, notification.audioOptions || {});
      if (notification.screenEffect === "damage") this.effects.pulseDamage(notification.effectStrength || .65);
      if (notification.screenEffect === "heal") this.effects.pulseHeal(notification.effectStrength || .5);
      if (notification.screenEffect === "flash") this.effects.pulseFlash(notification.effectStrength || .45);
      if (["levelUp", "complete", "zone"].includes(notification.type) && notification.message) {
        const title = notification.type === "levelUp" ? "Nová úroveň" : notification.type === "zone" ? "Nová oblast" : "Cíl splněn";
        this.effects.announce(title, notification.message, notification.type === "complete" ? 3.8 : 3);
      }
      if (notification.type === "defeat") this.#showDefeat();
    }
  }

  #showCampaignEnding(ending) {
    if (!ending || !this.world) return;
    this.saveGame(false);
    this.state = GAME_STATE.PAUSED;
    this.input.setEnabled(false);
    if (document.pointerLockElement) document.exitPointerLock?.();
    const epilogue = (ending.epilogue || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
    const factions = this.world.getFactionView().map((faction) => `<li>${escapeHtml(faction.name)}: <strong>${faction.reputation >= 0 ? "+" : ""}${faction.reputation}</strong></li>`).join("");
    this.#openModal({
      title: ending.title,
      body: `<div class="ending-copy"><p class="ending-lead">${escapeHtml(ending.text)}</p>${epilogue}<h3>Výsledek kampaně</h3><p>Vedoucí frakce: <strong>${escapeHtml(ending.allianceName)}</strong></p><ul>${factions}</ul><p>Hlavní příběh byl dokončen. Ve světě lze dále plnit vedlejší úkoly.</p></div>`,
      actions: [
        { label: "Pokračovat ve světě", primary: true, onClick: () => this.#closeModal() },
        { label: "Uložit výsledek", onClick: () => this.saveGame(true) },
        { label: "Hlavní menu", onClick: () => this.returnToTitle() },
      ],
      canClose: true,
      wide: true,
      onClose: () => this.#resumeFromModal(),
    });
  }

  #showDefeat() {
    if (this.defeatShown || !this.world) return;
    this.defeatShown = true;
    this.state = GAME_STATE.PAUSED;
    this.input.setEnabled(false);
    if (document.pointerLockElement) document.exitPointerLock?.();
    const actions = [];
    if (this.saves.hasSave()) actions.push({ label: "Načíst poslední pozici", primary: true, onClick: () => { this.#closeModal(false); this.continueGame(); } });
    actions.push({ label: "Začít znovu", primary: !actions.length, onClick: () => { this.#closeModal(false); this.newGame(); } });
    actions.push({ label: "Hlavní menu", onClick: () => this.returnToTitle() });
    this.#openModal({
      title: "Družina byla poražena",
      body: "<p>Poslední zvuk zanikl v údolí. Obnovte uloženou pozici nebo začněte nový průchod.</p>",
      actions,
      canClose: false,
    });
  }

  #resumeFromModal() {
    if (!this.world || this.state === GAME_STATE.TITLE) return;
    this.state = GAME_STATE.PLAYING;
    this.input.setEnabled(true);
  }

  #bindUi() {
    const unlockAudio = () => this.audio.unlock().catch(() => {});
    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio, { passive: true });

    this.elements.newGame.addEventListener("click", () => this.newGame());
    this.elements.continueGame.addEventListener("click", () => this.continueGame());
    this.elements.controlsButton.addEventListener("click", () => this.showControls());
    this.elements.audioButton.addEventListener("click", () => this.showAudioSettings());
    this.elements.settingsButton.addEventListener("click", () => this.showDisplaySettings());
    this.elements.saveToolsButton.addEventListener("click", () => this.showSaveTools());
    this.elements.displayButton.addEventListener("click", () => this.showDisplaySettings());
    this.elements.attackButton.addEventListener("click", () => this.attack());
    this.elements.touchAttack.addEventListener("click", () => this.attack());
    this.elements.targetButton.addEventListener("click", () => this.cycleCombatTarget());
    this.elements.tacticalButton.addEventListener("click", () => this.toggleTacticalPause());
    this.elements.touchTactical.addEventListener("click", () => this.toggleTacticalPause());
    this.elements.interactButton.addEventListener("click", () => this.interact());
    this.elements.touchInteract.addEventListener("click", () => this.interact());
    this.elements.mapButton.addEventListener("click", () => this.hud.toggleFullMap());
    this.elements.restButton.addEventListener("click", () => this.restParty());
    this.elements.journalButton.addEventListener("click", () => this.showJournal());
    this.elements.characterButton.addEventListener("click", () => this.showCharacters());
    this.elements.inventoryButton.addEventListener("click", () => this.showInventory());
    this.elements.spellbookButton.addEventListener("click", () => this.showSpellbook());
    this.elements.touchSpellbook.addEventListener("click", () => this.showSpellbook());
    this.elements.saveButton.addEventListener("click", () => this.saveGame(true));
    this.elements.pauseButton.addEventListener("click", () => this.pause());
    this.elements.touchPause.addEventListener("click", () => this.pause());
    this.elements.modalClose.addEventListener("click", () => this.#closeModal());
    this.elements.modal.addEventListener("click", (event) => {
      if (event.target === this.elements.modal) this.#closeModal();
    });
  }

  #bindLifecycle() {
    window.addEventListener("resize", () => this.#resizeRenderer());
    window.addEventListener("orientationchange", () => window.setTimeout(() => this.#resizeRenderer(), 120));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.state === GAME_STATE.PLAYING) {
        if (this.preferences.getSettings().autosave) this.saveGame(false);
        this.pause();
      }
    });

    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(() => this.#resizeRenderer());
      this.resizeObserver.observe(this.elements.viewportShell);
    }
  }

  #resizeRenderer() {
    const rect = this.elements.viewportShell.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const aspect = rect.width / rect.height;
    this.performance.setMode(this.preferences.getSettings().quality);
    const profile = this.performance.getProfile(rect.width);
    const preferred = this.preferences.getRenderWidth(rect.width);
    const targetWidth = this.preferences.getSettings().quality === "auto" ? profile.width : preferred;
    const targetHeight = Math.max(180, Math.round(targetWidth / aspect));
    this.renderer.setQualityProfile({ ...profile, postProcess: true });
    this.renderer.resize(targetWidth, targetHeight);
    this.document.documentElement.dataset.runtimeQuality = profile.name;
  }

  #showSaveIndicator(text) {
    this.elements.saveIndicator.textContent = text;
    this.elements.saveIndicator.classList.add("is-visible");
    clearTimeout(this.saveIndicatorTimeout);
    this.saveIndicatorTimeout = setTimeout(() => this.elements.saveIndicator.classList.remove("is-visible"), 1500);
  }

  #showScreen(name) {
    this.elements.titleScreen.classList.toggle("screen--active", name === "title");
    this.elements.gameScreen.classList.toggle("screen--active", name === "game");
    if (name === "game") requestAnimationFrame(() => this.#resizeRenderer());
  }

  #showZoneBanner(text) {
    this.elements.zoneBanner.textContent = text;
    this.elements.zoneBanner.classList.add("is-visible");
    this.zoneBannerTimer = 2.8;
  }

  #showNotice(title, text) {
    this.#openModal({
      title,
      body: `<p>${escapeHtml(text)}</p>`,
      actions: [{ label: "Zavřít", primary: true, onClick: () => this.#closeModal() }],
      canClose: true,
    });
  }

  #itemIconMarkup(itemId, fallback = "·", className = "item-icon") {
    const frame = this.assets?.getItemIcon?.(itemId);
    if (!frame) return `<span class="${escapeHtml(className)}">${escapeHtml(fallback)}</span>`;
    const url = escapeHtml(frame.image.src);
    return `<span class="${escapeHtml(className)} atlas-icon" style="background-image:url('${url}');background-position:-${frame.sx}px -${frame.sy}px;background-size:320px 160px" aria-hidden="true"></span>`;
  }

  #openModal({ title, body, actions = [], canClose = true, onClose = null, wide = false }) {
    this.modalOpen = true;
    this.modalOnClose = onClose;
    this.lastFocusedElement = this.document.activeElement;
    this.elements.modalTitle.textContent = title;
    this.elements.modalBody.innerHTML = body;
    this.elements.modalActions.replaceChildren();
    this.elements.modalActions.className = "modal__buttons";
    this.elements.modalClose.classList.toggle("hidden", !canClose);
    this.elements.modalPanel.classList.toggle("modal__panel--wide", wide);

    for (const action of actions) {
      const button = this.document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      if (action.primary) button.className = "button--primary";
      button.addEventListener("click", action.onClick);
      this.elements.modalActions.append(button);
    }
    this.elements.modal.classList.remove("hidden");
    this.modalKeyHandler = (event) => {
      if (event.key === "Escape" && canClose) { event.preventDefault(); this.#closeModal(); return; }
      if (event.key !== "Tab") return;
      const focusable = [...this.elements.modalPanel.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')].filter((element) => !element.classList.contains("hidden"));
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && this.document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && this.document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    this.elements.modal.addEventListener("keydown", this.modalKeyHandler);
    requestAnimationFrame(() => (this.elements.modalActions.querySelector(".button--primary") || this.elements.modalActions.querySelector("button") || this.elements.modalClose).focus());
  }

  #closeModal(runCallback = true) {
    if (!this.modalOpen) return;
    this.modalOpen = false;
    this.elements.modal.classList.add("hidden");
    this.elements.modalPanel.classList.remove("modal__panel--wide");
    if (this.modalKeyHandler) this.elements.modal.removeEventListener("keydown", this.modalKeyHandler);
    this.modalKeyHandler = null;
    const callback = this.modalOnClose;
    this.modalOnClose = null;
    const restoreFocus = this.lastFocusedElement;
    this.lastFocusedElement = null;
    restoreFocus?.focus?.();
    if (runCallback) callback?.();
  }

  #refreshContinueButton() {
    const hasSave = this.saves.hasSave();
    this.elements.continueGame.disabled = !hasSave;
    this.elements.continueGame.title = hasSave ? "Načíst uloženou pozici" : "Zatím není uložena žádná pozice";
  }

  #collectElements() {
    const byId = (id) => {
      const element = this.document.getElementById(id);
      if (!element) throw new Error(`Chybí prvek #${id}`);
      return element;
    };

    return {
      titleScreen: byId("title-screen"),
      gameScreen: byId("game-screen"),
      newGame: byId("new-game"),
      continueGame: byId("continue-game"),
      controlsButton: byId("controls-button"),
      audioButton: byId("audio-button"),
      settingsButton: byId("settings-button"),
      saveToolsButton: byId("save-tools-button"),
      viewportShell: byId("viewport-shell"),
      gameCanvas: byId("game-canvas"),
      screenDamage: byId("screen-damage"),
      screenHeal: byId("screen-heal"),
      screenFlash: byId("screen-flash"),
      cinematicBanner: byId("cinematic-banner"),
      cinematicBannerTitle: byId("cinematic-banner-title"),
      cinematicBannerText: byId("cinematic-banner-text"),
      zoneBanner: byId("zone-banner"),
      saveIndicator: byId("save-indicator"),
      interactionHint: byId("interaction-hint"),
      combatTarget: byId("combat-target"),
      abilityHotbar: byId("ability-hotbar"),
      quickInventory: byId("quick-inventory"),
      debugOverlay: byId("debug-overlay"),
      partyPanel: byId("party-panel"),
      minimap: byId("minimap"),
      compass: byId("compass"),
      gameLog: byId("game-log"),
      questTracker: byId("quest-tracker"),
      resourceStatus: byId("resource-status"),
      zoneName: byId("zone-name"),
      coordinates: byId("coordinates"),
      attackButton: byId("attack-button"),
      targetButton: byId("target-button"),
      tacticalButton: byId("tactical-button"),
      interactButton: byId("interact-button"),
      mapButton: byId("map-button"),
      restButton: byId("rest-button"),
      journalButton: byId("journal-button"),
      characterButton: byId("character-button"),
      inventoryButton: byId("inventory-button"),
      spellbookButton: byId("spellbook-button"),
      saveButton: byId("save-button"),
      pauseButton: byId("pause-button"),
      displayButton: byId("display-button"),
      moveStick: byId("move-stick"),
      lookPad: byId("look-pad"),
      touchAttack: byId("touch-attack"),
      touchInteract: byId("touch-interact"),
      touchTactical: byId("touch-tactical"),
      touchSpellbook: byId("touch-spellbook"),
      touchPause: byId("touch-pause"),
      modal: byId("modal"),
      modalPanel: byId("modal-panel"),
      modalClose: byId("modal-close"),
      modalTitle: byId("modal-title"),
      modalBody: byId("modal-body"),
      modalActions: byId("modal-actions"),
    };
  }
}
