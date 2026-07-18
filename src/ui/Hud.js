import { normalizeAngle } from "../utils/math.js";

const COMPASS_POINTS = ["V", "JV", "J", "JZ", "Z", "SZ", "S", "SV"];
const CONDITION_LABELS = Object.freeze({
  healthy: "Zdravý",
  wounded: "Zraněný",
  unconscious: "V bezvědomí",
  dead: "Mrtvý",
});

export class Hud {
  constructor({
    partyPanel,
    minimap,
    compass,
    gameLog,
    zoneName,
    coordinates,
    interactionHint,
    debugOverlay,
    questTracker,
    resourceStatus,
    combatTarget,
    abilityHotbar,
    quickInventory = null,
    assets = null,
    onPartyMemberSelect = null,
    onAbilityUse = null,
    onQuickItemUse = null,
    onOpenInventory = null,
  }) {
    this.partyPanel = partyPanel;
    this.minimap = minimap;
    this.minimapContext = minimap.getContext("2d", { alpha: false });
    this.minimapContext.imageSmoothingEnabled = false;
    this.compass = compass;
    this.gameLog = gameLog;
    this.zoneName = zoneName;
    this.coordinates = coordinates;
    this.interactionHint = interactionHint;
    this.debugOverlay = debugOverlay;
    this.questTracker = questTracker;
    this.resourceStatus = resourceStatus;
    this.combatTarget = combatTarget;
    this.combatTargetName = combatTarget.querySelector("#combat-target-name");
    this.combatTargetDistance = combatTarget.querySelector("#combat-target-distance");
    this.combatTargetHp = combatTarget.querySelector("#combat-target-hp");
    this.combatState = combatTarget.querySelector("#combat-state");
    this.combatRecovery = combatTarget.querySelector("#combat-recovery");
    this.combatTargetStatuses = combatTarget.querySelector("#combat-target-statuses");
    this.abilityHotbar = abilityHotbar;
    this.quickInventory = quickInventory;
    this.assets = assets;
    this.onPartyMemberSelect = onPartyMemberSelect;
    this.onAbilityUse = onAbilityUse;
    this.onQuickItemUse = onQuickItemUse;
    this.onOpenInventory = onOpenInventory;
    this.logs = [];
    this.lastInteractableId = null;
    this.showFullMap = false;
    this.debugEnabled = false;
    this.lastQuestSignature = "";
    this.lastPartySignature = "";
    this.lastCombatSignature = "";
    this.lastMagicSignature = "";
    this.lastQuickSignature = "";
  }

  render(world, fps = 0) {
    this.#renderParty(world);
    this.#renderMinimap(world);
    this.#renderCompass(world.player.direction);
    this.#renderQuestTracker(world);
    this.#renderCombat(world);
    this.#renderHotbar(world);
    this.#renderQuickInventory(world);
    this.zoneName.textContent = world.zone.name;
    this.coordinates.textContent = `X ${world.player.x.toFixed(1)} · Y ${world.player.y.toFixed(1)}`;
    const inventory = world.getInventoryView();
    this.resourceStatus.textContent = `${world.gold} zl. · ${inventory.weight.toFixed(1)}/${inventory.capacity} kg · ${world.clock.label} · ${world.clock.phase}`;

    if (this.debugEnabled) {
      this.debugOverlay.classList.remove("hidden");
      const active = world.partyManager.activeMember;
      this.debugOverlay.textContent = [
        `FPS ${fps.toFixed(0)}`,
        `ZONE ${world.zoneId} · ${world.clock.label} · LIGHT ${world.daylight.toFixed(2)}`,
        `POS ${world.player.x.toFixed(3)}, ${world.player.y.toFixed(3)}`,
        `DIR ${(world.player.direction * 180 / Math.PI).toFixed(1)}°`,
        `TILE ${world.getTile(world.player.x, world.player.y)}`,
        `ENT ${world.entities.filter((entity) => world.isEntityVisible(entity)).length}`,
        `QUEST ${world.quests.getTrackedSummary()?.questId || "—"}`,
        `HERO ${active.id} L${active.level} XP${active.experience}`,
        `BAG ${world.inventoryManager.getUsedSlots()}/${world.inventoryManager.getMaxSlots()} ${world.inventoryManager.getWeight().toFixed(1)}kg`,
        `COMBAT ${world.combat.inCombat ? "ACTIVE" : "IDLE"} ${world.combat.tacticalPaused ? "PAUSED" : "RUN"}`,
        `TARGET ${world.combat.targetId || "—"} PROJ ${world.combat.projectiles.length}`,
        `AI ${world.combat.targetId ? JSON.stringify(world.combat.getEnemyBrain(world.combat.targetId)?.intent || "—") : "—"}`,
        `MAGIC FX ${Object.values(world.magic.partyStatuses).flat().length + Object.values(world.magic.enemyStatuses).flat().length} CAST ${world.magic.castSequence}`,
      ].join("\n");
    } else {
      this.debugOverlay.classList.add("hidden");
    }
  }

  renderInteraction(entity) {
    if (!entity) {
      this.interactionHint.classList.remove("is-visible");
      this.interactionHint.textContent = "";
      this.lastInteractableId = null;
      return;
    }

    this.interactionHint.textContent = `[F] ${entity.interaction.prompt}`;
    this.interactionHint.classList.add("is-visible");
    this.lastInteractableId = entity.id;
  }

  addLog(message, type = "info") {
    this.logs.push({ message, type });
    if (this.logs.length > 8) this.logs.shift();
    this.gameLog.replaceChildren();
    for (const entry of this.logs) {
      const line = document.createElement("div");
      line.className = `log-entry log-entry--${entry.type}`;
      line.textContent = entry.message;
      this.gameLog.append(line);
    }
  }

  toggleFullMap() {
    this.showFullMap = !this.showFullMap;
  }

  toggleDebug() {
    this.debugEnabled = !this.debugEnabled;
    return this.debugEnabled;
  }

  resetParty() {
    this.lastPartySignature = "";
    this.lastCombatSignature = "";
    this.lastMagicSignature = "";
    this.lastQuickSignature = "";
  }

  #renderParty(world) {
    const party = world.party;
    const activeMemberId = world.activeMemberId;
    const signature = JSON.stringify(party.map((member) => [
      member.id,
      member.level,
      member.hp,
      member.maxHp,
      member.mp,
      member.maxMp,
      member.condition,
      member.attributePoints,
      member.skillPoints,
      member.id === activeMemberId,
      world.magic.getPartyStatuses(member.id).map((status) => [status.id, status.remaining.toFixed(1)]),
    ]));
    if (signature === this.lastPartySignature) return;
    this.lastPartySignature = signature;
    this.partyPanel.replaceChildren();

    for (const member of party) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `party-member${member.id === activeMemberId ? " is-active" : ""}${member.condition !== "healthy" ? ` condition-${member.condition}` : ""}`;
      button.dataset.memberId = member.id;
      button.title = `${member.name}, ${member.className || member.classId}, úroveň ${member.level}. Kliknutím otevřete postavu.`;

      const portrait = document.createElement("span");
      portrait.className = "party-portrait";
      const portraitUrl = this.assets?.getPortrait?.(member.id);
      if (portraitUrl) {
        const image = document.createElement("img");
        image.src = portraitUrl;
        image.alt = "";
        image.width = 64;
        image.height = 80;
        portrait.append(image);
      } else {
        portrait.textContent = member.initials;
      }

      const details = document.createElement("span");
      details.className = "party-details";
      const heading = document.createElement("span");
      heading.className = "party-heading";
      const name = document.createElement("span");
      name.className = "party-name";
      name.textContent = member.name;
      const level = document.createElement("span");
      level.className = "party-level";
      level.textContent = `L${member.level}`;
      heading.append(name, level);

      const className = document.createElement("span");
      className.className = "party-class";
      className.textContent = member.className || member.classId;

      const hpBar = document.createElement("span");
      hpBar.className = "stat-bar stat-bar--hp";
      hpBar.title = `Život ${member.hp}/${member.maxHp}`;
      hpBar.dataset.value = `${Math.max(0, Math.round(member.hp))}/${Math.max(0, Math.round(member.maxHp))}`;
      const hpFill = document.createElement("span");
      hpFill.style.width = `${Math.max(0, Math.min(100, member.hp / member.maxHp * 100))}%`;
      hpBar.append(hpFill);

      const mpBar = document.createElement("span");
      mpBar.className = "stat-bar stat-bar--mp";
      mpBar.title = `Mana ${member.mp}/${member.maxMp}`;
      mpBar.dataset.value = `${Math.max(0, Math.round(member.mp))}/${Math.max(0, Math.round(member.maxMp))}`;
      const mpFill = document.createElement("span");
      mpFill.style.width = `${member.maxMp > 0 ? Math.max(0, Math.min(100, member.mp / member.maxMp * 100)) : 0}%`;
      mpBar.append(mpFill);

      const condition = document.createElement("span");
      condition.className = "party-condition";
      const points = member.attributePoints + member.skillPoints;
      condition.textContent = member.condition === "healthy"
        ? (points > 0 ? `${points} volných bodů` : "Připraven")
        : CONDITION_LABELS[member.condition] || member.condition;

      const statuses = document.createElement("span");
      statuses.className = "party-statuses";
      for (const status of world.magic.getPartyStatuses(member.id).slice(0, 4)) {
        const badge = document.createElement("span");
        badge.className = "status-badge";
        badge.style.color = status.definition?.color || "#d3c8aa";
        badge.title = `${status.definition?.name || status.id}: ${status.remaining.toFixed(1)} s`;
        badge.textContent = status.definition?.icon || "·";
        statuses.append(badge);
      }

      details.append(heading, className, hpBar, mpBar, condition, statuses);
      button.append(portrait, details);
      button.addEventListener("click", () => this.onPartyMemberSelect?.(member.id));
      this.partyPanel.append(button);
    }
  }

  #renderCombat(world) {
    const view = world.getCombatView();
    const signature = JSON.stringify([
      view.target?.id,
      view.target?.hp,
      view.target?.maxHp,
      view.target?.distance?.toFixed(1),
      view.target?.phase,
      view.target?.role,
      view.target?.shielded,
      view.inCombat,
      view.tacticalPaused,
      view.cooldown.toFixed(2),
    ]);
    if (signature === this.lastCombatSignature) return;
    this.lastCombatSignature = signature;

    const target = view.target;
    this.combatTarget.classList.toggle("hidden", !target && !view.inCombat && !view.tacticalPaused);
    this.combatTarget.classList.toggle("is-paused", view.tacticalPaused);
    this.combatTarget.classList.toggle("is-boss", Boolean(target?.boss));
    this.combatTargetName.textContent = target?.name || (view.tacticalPaused ? "Taktická pauza" : "Boj");
    this.combatTargetDistance.textContent = target
      ? `${target.distance.toFixed(1)} m${target.boss ? ` · FÁZE ${target.phase}` : ""}${target.shielded ? " · ŠTÍT" : ""}`
      : "—";
    this.combatTargetHp.style.width = `${target ? Math.max(0, Math.min(100, target.hp / target.maxHp * 100)) : 0}%`;
    this.combatState.textContent = view.tacticalPaused ? "PAUZA" : view.inCombat ? "BOJ" : "KLID";
    this.combatRecovery.textContent = view.cooldown > 0 ? `ZOTAVENÍ ${view.cooldown.toFixed(1)} s` : "PŘIPRAVEN";
    this.combatTargetStatuses.replaceChildren();
    for (const status of target?.statuses || []) {
      const badge = document.createElement("span");
      badge.className = "status-badge";
      badge.style.color = status.definition?.color || "#d3c8aa";
      badge.textContent = `${status.definition?.icon || "·"} ${status.remaining.toFixed(1)}s`;
      badge.title = status.definition?.name || status.id;
      this.combatTargetStatuses.append(badge);
    }
  }

  #renderHotbar(world) {
    const member = world.partyManager.activeMember;
    const view = world.magic.getHotbarView(member, world.partyManager);
    const signature = JSON.stringify([member.id, member.mp, member.level, view.map((slot) => [slot.ability?.id, slot.unlocked, slot.affordable, slot.cooldown.toFixed(1)])]);
    if (signature === this.lastMagicSignature) return;
    this.lastMagicSignature = signature;
    this.abilityHotbar.replaceChildren();
    for (const slot of view) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `ability-slot${!slot.ability ? " is-empty" : ""}${slot.ability && !slot.unlocked ? " is-locked" : ""}${slot.cooldown > 0 ? " is-cooldown" : ""}${slot.ability && !slot.affordable ? " is-unaffordable" : ""}`;
      button.disabled = !slot.ability;
      button.title = slot.ability ? `${slot.ability.name} — ${slot.ability.description}` : `Prázdná pozice ${slot.index + 1}`;
      const key = document.createElement("span"); key.className = "ability-slot__key"; key.textContent = String(slot.index + 1);
      const icon = document.createElement("span");
      icon.className = "ability-slot__icon";
      const abilityFrame = slot.ability ? this.assets?.getAbilityIcon?.(slot.ability.id) : null;
      if (!this.assets?.applyCssFrame?.(icon, abilityFrame)) icon.textContent = slot.ability?.icon || "·";
      const name = document.createElement("span"); name.className = "ability-slot__name"; name.textContent = slot.ability?.name || "Prázdné";
      const cost = document.createElement("span"); cost.className = "ability-slot__cost"; cost.textContent = slot.ability?.manaCost ? `${slot.ability.manaCost}M` : "";
      button.append(key, icon, name, cost);
      if (slot.cooldown > 0) {
        const cooldown = document.createElement("span"); cooldown.className = "ability-slot__cooldown"; cooldown.textContent = slot.cooldown.toFixed(1); button.append(cooldown);
      }
      button.addEventListener("click", () => this.onAbilityUse?.(slot.index));
      this.abilityHotbar.append(button);
    }
  }

  #renderQuickInventory(world) {
    if (!this.quickInventory) return;
    const view = world.getInventoryView();
    const activeId = world.activeMemberId;
    const equipped = Object.fromEntries((view.equipment[activeId] || []).map((entry) => [entry.slotId, entry]));
    const consumables = view.items.filter((entry) => entry.definition?.category === "consumable").slice(0, 3);
    const keyItem = view.items.find((entry) => entry.itemId.includes("key") || entry.definition?.category === "quest");
    const slots = [
      { kind: "equipment", entry: equipped.mainHand, label: "Zbraň" },
      { kind: "equipment", entry: equipped.body, label: "Zbroj" },
      { kind: "equipment", entry: equipped.offHand || equipped.head, label: "Výstroj" },
      ...consumables.map((entry) => ({ kind: "consumable", entry, label: entry.definition.name })),
      { kind: "item", entry: keyItem, label: "Klíč" },
      { kind: "gold", count: world.gold, label: "Zlato" },
      { kind: "bag", count: view.usedSlots, max: view.maxSlots, label: "Batoh" },
    ];
    while (slots.length < 9) slots.splice(Math.max(3, slots.length - 2), 0, { kind: "empty", label: "Prázdné" });
    slots.length = 9;

    const signature = JSON.stringify(slots.map((slot) => [slot.kind, slot.entry?.itemId, slot.entry?.count, slot.count, slot.max]));
    if (signature === this.lastQuickSignature) return;
    this.lastQuickSignature = signature;
    this.quickInventory.replaceChildren();

    for (const slot of slots) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `quick-slot quick-slot--${slot.kind}`;
      button.title = slot.entry?.definition?.name || slot.entry?.item?.name || slot.label;
      const label = document.createElement("span");
      label.className = "quick-slot__label";
      label.textContent = slot.label || "";
      const icon = document.createElement("span");
      icon.className = "quick-slot__icon";
      const itemId = slot.entry?.itemId;
      const frame = itemId ? this.assets?.getItemIcon?.(itemId) : null;
      if (!this.assets?.applyCssFrame?.(icon, frame)) {
        icon.textContent = slot.kind === "gold" ? "●" : slot.kind === "bag" ? "▣" : slot.kind === "empty" ? "·" : "◇";
      }
      const count = document.createElement("span");
      count.className = "quick-slot__count";
      if (slot.kind === "gold") count.textContent = String(slot.count ?? 0);
      else if (slot.kind === "bag") count.textContent = `${slot.count ?? 0}/${slot.max ?? 0}`;
      else if (slot.entry?.count > 1) count.textContent = String(slot.entry.count);
      button.append(label, icon, count);
      if (slot.kind === "consumable" && itemId) button.addEventListener("click", () => this.onQuickItemUse?.(itemId));
      else if (slot.kind !== "empty") button.addEventListener("click", () => this.onOpenInventory?.());
      else button.disabled = true;
      this.quickInventory.append(button);
    }
  }

  #renderQuestTracker(world) {
    const quest = world.quests.getTrackedSummary();
    const signature = JSON.stringify(quest);
    if (signature === this.lastQuestSignature) return;
    this.lastQuestSignature = signature;
    this.questTracker.replaceChildren();

    if (!quest) {
      const empty = document.createElement("span");
      empty.className = "quest-tracker__empty";
      empty.textContent = "Žádný sledovaný úkol";
      this.questTracker.append(empty);
      return;
    }

    const title = document.createElement("strong");
    title.textContent = quest.title;
    const stage = document.createElement("span");
    stage.className = "quest-tracker__stage";
    stage.textContent = quest.stageTitle;
    this.questTracker.append(title, stage);

    const objective = quest.objectives.find((entry) => !entry.complete) || quest.objectives.at(-1);
    if (objective) {
      const line = document.createElement("span");
      line.className = "quest-tracker__objective";
      line.textContent = objective.required > 1
        ? `${objective.label} (${objective.current}/${objective.required})`
        : objective.label;
      this.questTracker.append(line);
    }
  }

  #renderMinimap(world) {
    const ctx = this.minimapContext;
    const width = this.minimap.width;
    const height = this.minimap.height;
    ctx.fillStyle = "#060504";
    ctx.fillRect(0, 0, width, height);

    const map = world.zone.map;
    const mapWidth = map[0].length;
    const mapHeight = map.length;
    const radius = this.showFullMap ? Math.max(mapWidth, mapHeight) / 2 : 6;
    const centerX = this.showFullMap ? mapWidth / 2 : world.player.x;
    const centerY = this.showFullMap ? mapHeight / 2 : world.player.y;
    const scale = Math.min(width, height) / (radius * 2 + 1);

    for (let y = 0; y < mapHeight; y += 1) {
      for (let x = 0; x < mapWidth; x += 1) {
        const drawX = (x - centerX) * scale + width / 2;
        const drawY = (y - centerY) * scale + height / 2;
        if (drawX < -scale || drawY < -scale || drawX > width || drawY > height) continue;
        const tile = world.getTile(x, y);
        ctx.fillStyle = tile === 0 ? "#28311f" : tile === 1 ? "#736c60" : tile === 2 ? "#805b35" : "#365035";
        ctx.fillRect(Math.floor(drawX), Math.floor(drawY), Math.ceil(scale + 0.5), Math.ceil(scale + 0.5));
      }
    }

    for (const entity of world.entities) {
      if ((!entity.interaction && !entity.enemyId) || !world.isEntityVisible(entity)) continue;
      const drawX = (entity.x - centerX) * scale + width / 2;
      const drawY = (entity.y - centerY) * scale + height / 2;
      if (drawX < 0 || drawY < 0 || drawX > width || drawY > height) continue;
      ctx.fillStyle = entity.enemyId && entity.kind !== "corpse" ? "#d84d3f"
        : entity.kind === "corpse" ? "#6f5e55"
          : entity.kind === "npc" ? "#e0c56e"
            : entity.interaction.type === "collect" ? "#75bfd5"
              : entity.interaction.type === "shop" ? "#d7a85a"
                : entity.interaction.type === "loot" ? "#b887d8"
                  : entity.interaction.type === "transition" ? "#7fd7b5"
                    : entity.interaction.type === "trap" ? "#e06c54"
                      : ["door", "lever", "secret"].includes(entity.interaction.type) ? "#d3a75c" : "#9aa6ab";
      ctx.fillRect(drawX - 1.5, drawY - 1.5, 3, 3);
    }

    const playerX = (world.player.x - centerX) * scale + width / 2;
    const playerY = (world.player.y - centerY) * scale + height / 2;
    const directionX = Math.cos(world.player.direction);
    const directionY = Math.sin(world.player.direction);
    ctx.strokeStyle = "#fff0a0";
    ctx.fillStyle = "#f2d878";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playerX + directionX * 7, playerY + directionY * 7);
    ctx.lineTo(playerX - directionY * 4 - directionX * 3, playerY + directionX * 4 - directionY * 3);
    ctx.lineTo(playerX + directionY * 4 - directionX * 3, playerY - directionX * 4 - directionY * 3);
    ctx.closePath();
    ctx.fill();
  }

  #renderCompass(direction) {
    const normalized = normalizeAngle(direction);
    const index = Math.round(normalized / (Math.PI / 4)) % 8;
    this.compass.textContent = COMPASS_POINTS[index];
  }
}
