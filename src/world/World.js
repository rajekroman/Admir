import { clamp, distanceSquared, normalizeAngle } from "../utils/math.js";
import { matchesConditions } from "../systems/ConditionEvaluator.js";
import { CombatSystem } from "../systems/CombatSystem.js";
import { InventoryManager } from "../systems/InventoryManager.js";
import { LootManager } from "../systems/LootManager.js";
import { MagicSystem } from "../systems/MagicSystem.js";
import { PartyManager } from "../systems/PartyManager.js";
import { QuestManager } from "../systems/QuestManager.js";
import { VendorManager } from "../systems/VendorManager.js";
import { ITEMS, getItemName } from "../data/items.js";
import { DEFAULT_FACTION_REPUTATION, FACTIONS } from "../data/factions.js";
import { resolveCampaignEnding } from "../data/endings.js";
import { QUESTS } from "../data/quests.js";
import { ZONES } from "./maps.js";
import { EnvironmentSystem } from "./EnvironmentSystem.js";

const PLAYER_RADIUS = 0.22;
const INTERACTION_DISTANCE = 1.65;
const INTERACTION_ANGLE = Math.PI * 0.34;

export class World {
  constructor(zoneId = "willowVale") {
    this.zoneId = zoneId;
    this.zone = ZONES[zoneId];
    if (!this.zone) throw new Error(`Neznámá oblast: ${zoneId}`);

    this.player = {
      x: this.zone.start.x,
      y: this.zone.start.y,
      direction: this.zone.start.direction,
      pitch: 0,
    };
    this.partyManager = new PartyManager();
    this.inventoryManager = new InventoryManager({ partyManager: this.partyManager, initializeStarter: true });
    this.vendorManager = new VendorManager();
    this.lootManager = new LootManager();
    this.combat = new CombatSystem();
    this.magic = new MagicSystem(null, this.partyManager);
    this.flags = {};
    this.gold = 35;
    this.reputation = 0;
    this.factions = structuredClone(DEFAULT_FACTION_REPUTATION);
    this.campaign = { ending: null, endingSeen: false };
    this.time = 0;
    this.stepAccumulator = 0;
    this.environment = new EnvironmentSystem();
    this.zoneEntityStates = {};
    this.entities = this.#loadZoneEntities(this.zoneId);
    this.notifications = [];
    this.quests = new QuestManager(QUESTS);
    this.#syncAllEquipmentBonuses();
    this.startQuest("silverEcho");
  }

  get party() {
    return this.partyManager.members;
  }

  get activeMemberId() {
    return this.partyManager.activeMemberId;
  }

  // Kompatibilní pohled pro questy a testy ze starších milníků.
  get inventory() {
    return Object.fromEntries(this.inventoryManager.getList(this.partyManager).map(({ itemId, count, definition }) => [
      itemId,
      { id: itemId, name: definition.name, count },
    ]));
  }

  update(dt) {
    this.time += dt;
    this.environment.update(dt, this);
    this.combat.update(dt, this);
    this.magic.update(dt, this);
    this.environment.handlePlayerPosition(this);
  }

  get clock() {
    return this.environment.getClockView();
  }

  get daylight() {
    return this.environment.getDaylight(this.zone);
  }

  getMusic() {
    return this.environment.getMusic(this.zone) || this.zone.music;
  }

  getAudioScene() {
    const clock = this.environment.getClockView();
    const target = this.combat.getTargetView(this);
    const bossEntity = this.entities.find((entity) => ["echoWarden", "morKharr"].includes(entity.enemyId));
    const bossState = bossEntity ? this.combat.getEnemyState(bossEntity.id) : null;
    return {
      screen: "game",
      zoneId: this.zoneId,
      environment: this.zone.environment,
      phase: clock.phase,
      isNight: clock.phase === "noc" || clock.phase === "soumrak",
      inCombat: this.combat.inCombat,
      bossActive: Boolean(target?.boss || (bossState?.alerted && !bossState?.dead)),
      tacticalPaused: this.combat.tacticalPaused,
    };
  }

  move({ forward, strafe, turn, pitch = 0 }, dt, onStep = null) {
    if (this.combat.tacticalPaused) return;
    const moveSpeed = 2.45;
    const turnSpeed = 1.85;
    const magnitude = Math.hypot(forward, strafe);
    const normalizedForward = magnitude > 1 ? forward / magnitude : forward;
    const normalizedStrafe = magnitude > 1 ? strafe / magnitude : strafe;

    this.player.direction = normalizeAngle(this.player.direction + turn * turnSpeed * dt);
    this.player.pitch = clamp((this.player.pitch || 0) - pitch, -0.62, 0.62);

    const cos = Math.cos(this.player.direction);
    const sin = Math.sin(this.player.direction);
    const dx = (cos * normalizedForward - sin * normalizedStrafe) * moveSpeed * dt;
    const dy = (sin * normalizedForward + cos * normalizedStrafe) * moveSpeed * dt;

    const previousX = this.player.x;
    const previousY = this.player.y;

    if (this.#canOccupy(this.player.x + dx, this.player.y)) this.player.x += dx;
    if (this.#canOccupy(this.player.x, this.player.y + dy)) this.player.y += dy;
    this.environment.handlePlayerPosition(this);

    const travelled = Math.hypot(this.player.x - previousX, this.player.y - previousY);
    this.stepAccumulator += travelled;
    if (this.stepAccumulator >= 0.78) {
      this.stepAccumulator %= 0.78;
      onStep?.(this.getFloorMaterial(this.player.x, this.player.y));
    }
  }

  getTile(x, y) {
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    if (tileY < 0 || tileY >= this.zone.map.length) return 1;
    const row = this.zone.map[tileY];
    if (tileX < 0 || tileX >= row.length) return 1;
    return this.environment.getTile(this.zoneId, tileX, tileY, Number(row[tileX]));
  }

  isWall(x, y) {
    return this.getTile(x, y) > 0;
  }

  getFloorMaterial(x, y) {
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    const region = (this.zone.floorZones || []).find((entry) => tileX >= entry.x1 && tileX <= entry.x2 && tileY >= entry.y1 && tileY <= entry.y2);
    if (region) return region.material;
    if (this.zone.environment === "dungeon") return "crypt";
    if (this.zoneId === "willowVale" && tileX >= 8 && tileX <= 15 && tileY >= 7 && tileY <= 18) return "stone";
    return "grass";
  }

  isEntityVisible(entity) {
    if (!entity || entity.hidden || !matchesConditions(entity.visibleWhen, this)) return false;
    if (entity.secret && !this.environment.isSecretAvailable(entity, this)) return false;
    if (entity.trapId && !this.environment.isTrapAvailable(entity, this)) return false;
    return true;
  }

  getInteractable() {
    let best = null;
    let bestScore = Infinity;

    for (const entity of this.entities) {
      if (!entity.interaction || !this.isEntityVisible(entity)) continue;
      const dx = entity.x - this.player.x;
      const dy = entity.y - this.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance > INTERACTION_DISTANCE) continue;

      const targetAngle = Math.atan2(dy, dx);
      let angleDelta = normalizeAngle(targetAngle - this.player.direction);
      if (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
      if (Math.abs(angleDelta) > INTERACTION_ANGLE) continue;

      const score = distance + Math.abs(angleDelta) * 0.7;
      if (score < bestScore && this.hasLineOfSight(this.player.x, this.player.y, entity.x, entity.y)) {
        best = entity;
        bestScore = score;
      }
    }

    return best;
  }

  inspectEntity(entity) {
    if (!entity?.interaction || !this.isEntityVisible(entity)) return false;
    const wasInspected = Boolean(this.flags[`inspected:${entity.id}`]);
    this.flags[`inspected:${entity.id}`] = true;
    if (entity.interaction.flag) this.flags[entity.interaction.flag] = true;
    if (!wasInspected && entity.interaction.event && entity.interaction.target) {
      this.emitQuestEvent(entity.interaction.event, entity.interaction.target, 1);
    }
    if (!wasInspected && entity.interaction.experience) {
      this.awardExperience(entity.interaction.experience, `Průzkum: ${entity.name}`);
    }
    return true;
  }

  collectEntity(entity) {
    if (!entity?.interaction || entity.interaction.type !== "collect" || !this.isEntityVisible(entity)) return false;
    const interaction = entity.interaction;
    const result = this.addItem(interaction.itemId, 1, interaction.itemName);
    if (!result.ok) return false;
    entity.hidden = true;
    this.flags[`collected:${entity.id}`] = true;
    this.emitQuestEvent(interaction.event || "collect", interaction.target || interaction.itemId, 1);
    return true;
  }

  openLoot(entity) {
    if (!entity?.interaction || entity.interaction.type !== "loot" || !this.isEntityVisible(entity)) {
      return { ok: false, reason: "Tuto schránku nelze otevřít." };
    }
    if (this.flags[`looted:${entity.id}`]) return { ok: false, reason: "Schránka je prázdná." };
    const loot = this.lootManager.roll(entity.interaction.lootTable, `${this.zoneId}:${entity.id}`);
    const added = [];
    for (const entry of loot.items) {
      const result = this.inventoryManager.add(entry.itemId, entry.amount, this.partyManager);
      if (!result.ok) {
        for (const rollback of added) this.inventoryManager.remove(rollback.itemId, rollback.amount);
        return { ok: false, reason: result.reason };
      }
      added.push(entry);
    }
    this.gold += loot.gold;
    this.flags[`looted:${entity.id}`] = true;
    entity.hidden = true;
    const itemLabels = added.map((entry) => `${getItemName(entry.itemId)} ×${entry.amount}`);
    this.notifications.push({ type: "loot", message: `Kořist: ${loot.gold} zl.${itemLabels.length ? ` · ${itemLabels.join(" · ")}` : ""}` });
    return { ok: true, gold: loot.gold, items: added };
  }

  useTransition(entity) {
    const interaction = entity?.interaction;
    if (!interaction || interaction.type !== "transition") return { ok: false, reason: "Tudy nelze projít." };
    if (interaction.requiresFlag && !this.flags[interaction.requiresFlag]) return { ok: false, reason: interaction.lockedText || "Cesta je uzavřená." };
    if (interaction.requiresItem && this.getItemCount(interaction.requiresItem) < 1) return { ok: false, reason: interaction.lockedText || "Chybí potřebný předmět." };
    return this.changeZone(interaction.targetZone, interaction.targetSpawn);
  }

  changeZone(targetZoneId, spawnId = null) {
    const targetZone = ZONES[targetZoneId];
    if (!targetZone) return { ok: false, reason: "Cílová oblast neexistuje." };
    this.#storeCurrentZoneEntities();
    this.zoneId = targetZoneId;
    this.zone = targetZone;
    this.entities = this.#loadZoneEntities(targetZoneId);
    const spawn = (spawnId && targetZone.spawns?.[spawnId]) || targetZone.start;
    this.player = { x: spawn.x, y: spawn.y, direction: normalizeAngle(spawn.direction || 0), pitch: 0 };
    this.stepAccumulator = 0;
    this.combat.targetId = null;
    this.combat.projectiles = [];
    this.combat.effects = [];
    this.combat.inCombat = false;
    this.combat.tacticalPaused = false;
    this.environment.lastPlayerTile = null;
    this.environment.handlePlayerPosition(this);
    if (targetZoneId === "silverPass" && this.quests.getStatus("beneathGate") === "notStarted") this.startQuest("beneathGate");
    this.emitQuestEvent("enterZone", targetZoneId, 1);
    this.notifications.push({ type: "zone", message: `Vstupujete do oblasti: ${targetZone.name}.` });
    return { ok: true, zoneId: targetZoneId, zone: targetZone, spawnId };
  }

  useDoor(entity) {
    return this.environment.useDoor(entity, this);
  }

  useLever(entity) {
    return this.environment.useLever(entity, this);
  }

  useSecret(entity) {
    return this.environment.useSecret(entity, this);
  }

  disarmTrap(entity) {
    return this.environment.disarmTrap(entity, this);
  }

  startQuest(questId) {
    this.#applyQuestResult(this.quests.start(questId));
  }

  emitQuestEvent(type, target, amount = 1) {
    this.#applyQuestResult(this.quests.emit(type, target, amount));
  }


  attack() {
    const result = this.combat.attack(this);
    if (!result.ok) this.notifications.push({ type: "warning", message: result.reason });
    return result;
  }

  cycleCombatTarget(direction = 1) {
    const target = this.combat.cycleTarget(this, direction);
    this.notifications.push({ type: target ? "combat" : "warning", message: target ? `Cíl: ${target.name}.` : "V dosahu není žádný nepřítel." });
    return target;
  }

  toggleTacticalPause() {
    const paused = this.combat.toggleTacticalPause();
    this.notifications.push({ type: "combat", message: paused ? "Taktická pauza aktivována." : "Boj pokračuje." });
    return paused;
  }

  getCombatView() {
    const target = this.combat.getTargetView(this);
    return {
      target: target ? { ...target, statuses: this.magic.getEnemyStatuses(target.id) } : null,
      inCombat: this.combat.inCombat,
      tacticalPaused: this.combat.tacticalPaused,
      cooldown: this.combat.getMemberCooldown(this.activeMemberId),
      projectiles: this.combat.projectiles,
      effects: this.combat.effects,
      hotbar: this.magic.getHotbarView(this.partyManager.activeMember, this.partyManager),
    };
  }

  castAbility(abilityId, options = {}) {
    const result = this.magic.cast(abilityId, this, options);
    if (!result.ok) this.notifications.push({ type: "warning", message: result.reason });
    return result;
  }

  castHotbar(slotIndex, options = {}) {
    const result = this.magic.castHotbar(slotIndex, this, options);
    if (!result.ok) this.notifications.push({ type: "warning", message: result.reason });
    return result;
  }

  getMagicView(memberId = this.activeMemberId) {
    const member = this.partyManager.getMember(memberId);
    if (!member) return null;
    return {
      member,
      spellbook: this.magic.getSpellbookView(member),
      hotbar: this.magic.getHotbarView(member, this.partyManager),
      statuses: this.magic.getPartyStatuses(member.id),
    };
  }

  setHotbarSlot(memberId, slotIndex, abilityId) {
    const result = this.magic.setHotbarSlot(memberId, slotIndex, abilityId, this.partyManager);
    this.notifications.push({ type: result.ok ? "magic" : "warning", message: result.ok ? `Rychlá pozice ${slotIndex + 1} byla upravena.` : result.reason });
    return result;
  }

  selectPartyMember(memberId, notify = true) {
    const selected = this.partyManager.selectMember(memberId);
    if (selected && notify) {
      const member = this.partyManager.getMember(memberId);
      this.notifications.push({ type: "party", message: `Aktivní postava: ${member.name}.` });
    }
    return selected;
  }

  getCharacterView(memberId = this.activeMemberId) {
    return this.partyManager.getMemberView(memberId);
  }

  getInventoryView() {
    return {
      items: this.inventoryManager.getList(this.partyManager),
      equipment: Object.fromEntries(this.party.map((member) => [member.id, this.inventoryManager.getEquippedItems(member.id)])),
      weight: this.inventoryManager.getWeight(),
      equippedWeight: this.inventoryManager.getEquippedWeight(),
      capacity: this.inventoryManager.getCapacity(this.partyManager),
      usedSlots: this.inventoryManager.getUsedSlots(),
      maxSlots: this.inventoryManager.getMaxSlots(),
    };
  }

  equipItem(memberId, itemId) {
    const result = this.inventoryManager.equip(memberId, itemId, this.partyManager);
    if (result.ok) this.#syncEquipmentBonuses(memberId);
    this.notifications.push({ type: result.ok ? "equipment" : "warning", message: result.ok ? `${this.partyManager.getMember(memberId).name} vybavil: ${getItemName(itemId)}.` : result.reason });
    return result;
  }

  unequipItem(memberId, slotId) {
    const itemId = this.inventoryManager.getEquipment(memberId)[slotId];
    const result = this.inventoryManager.unequip(memberId, slotId, this.partyManager);
    if (result.ok) this.#syncEquipmentBonuses(memberId);
    this.notifications.push({ type: result.ok ? "equipment" : "warning", message: result.ok ? `${getItemName(itemId)} vrácen do batohu.` : result.reason });
    return result;
  }

  useItem(itemId, memberId = this.activeMemberId) {
    const result = this.inventoryManager.use(itemId, memberId, this.partyManager);
    this.notifications.push({ type: result.ok ? "item" : "warning", message: result.ok ? result.messages.join(" ") : result.reason });
    return result;
  }

  getVendorView(vendorId) {
    return this.vendorManager.getView(vendorId, this.inventoryManager, this.partyManager, this.reputation);
  }

  buyItem(vendorId, itemId, amount = 1) {
    const result = this.vendorManager.buy(vendorId, itemId, amount, {
      inventory: this.inventoryManager,
      partyManager: this.partyManager,
      gold: this.gold,
      reputation: this.reputation,
    });
    if (result.ok) this.gold += result.goldDelta;
    this.notifications.push({ type: result.ok ? "trade" : "warning", message: result.ok ? `Zakoupeno: ${getItemName(itemId)} za ${result.total} zl.` : result.reason });
    return result;
  }

  sellItem(vendorId, itemId, amount = 1) {
    const result = this.vendorManager.sell(vendorId, itemId, amount, {
      inventory: this.inventoryManager,
      partyManager: this.partyManager,
      reputation: this.reputation,
    });
    if (result.ok) this.gold += result.goldDelta;
    this.notifications.push({ type: result.ok ? "trade" : "warning", message: result.ok ? `Prodáno: ${getItemName(itemId)} za ${result.total} zl.` : result.reason });
    return result;
  }

  spendAttributePoint(memberId, attributeId) {
    const result = this.partyManager.spendAttributePoint(memberId, attributeId);
    this.notifications.push({ type: result.ok ? "progress" : "warning", message: result.message || result.reason });
    return result;
  }

  trainSkill(memberId, skillId) {
    const result = this.partyManager.trainSkill(memberId, skillId);
    this.notifications.push({ type: result.ok ? "progress" : "warning", message: result.message || result.reason });
    return result;
  }

  awardExperience(amount, source = "Zkušenost") {
    const xp = Math.max(0, Math.floor(Number(amount) || 0));
    if (!xp) return [];
    const progressNotifications = this.partyManager.awardExperience(xp);
    this.notifications.push({ type: "experience", message: `${source}: každý člen získává ${xp} zkušeností.` });
    this.notifications.push(...progressNotifications);
    return progressNotifications;
  }

  restParty() {
    if (!this.inventoryManager.consumeRation()) {
      const result = { ok: false, reason: "K odpočinku chybí cestovní dávka." };
      this.notifications.push({ type: "warning", message: result.reason });
      return result;
    }
    this.partyManager.rest();
    this.magic.clearOnRest();
    this.environment.advanceMinutes(8 * 60);
    this.notifications.push({ type: "party", message: `Družina spotřebovala cestovní dávku a odpočinula si osm hodin. ${this.clock.label}.` });
    return { ok: true };
  }

  addItem(itemId, amount = 1, name = itemId) {
    if (!ITEMS[itemId]) {
      this.notifications.push({ type: "warning", message: `Neznámý předmět: ${name}.` });
      return { ok: false, reason: "Neznámý předmět." };
    }
    const result = this.inventoryManager.add(itemId, amount, this.partyManager, { ignoreCapacity: ITEMS[itemId].category === "quest" });
    if (!result.ok) this.notifications.push({ type: "warning", message: result.reason });
    return result;
  }

  removeItem(itemId, amount = 1) {
    return this.inventoryManager.remove(itemId, amount);
  }

  getItemCount(itemId) {
    return this.inventoryManager.getCount(itemId);
  }

  adjustFaction(factionId, amount = 0) {
    if (!FACTIONS[factionId]) return { ok: false, reason: "Neznámá frakce." };
    const delta = Math.trunc(Number(amount) || 0);
    this.factions[factionId] = Math.max(-10, Math.min(10, (Number(this.factions[factionId]) || 0) + delta));
    this.notifications.push({ type: "reputation", message: `${FACTIONS[factionId].name}: ${delta >= 0 ? "+" : ""}${delta} reputace.` });
    return { ok: true, value: this.factions[factionId] };
  }

  getFactionView() {
    return Object.values(FACTIONS).map((definition) => ({ ...definition, reputation: Number(this.factions[definition.id]) || 0 }));
  }

  resolveEnding() {
    if (!this.campaign.ending) {
      this.campaign.ending = resolveCampaignEnding({ flags: this.flags, factions: this.factions });
      this.campaign.endingSeen = false;
      this.notifications.push({ type: "complete", message: `Kampaň dokončena: ${this.campaign.ending.title}` });
    }
    return this.campaign.ending;
  }

  consumeEnding() {
    if (!this.campaign.ending || this.campaign.endingSeen) return null;
    this.campaign.endingSeen = true;
    return structuredClone(this.campaign.ending);
  }

  consumeNotifications() {
    const pending = this.notifications;
    this.notifications = [];
    return pending;
  }

  snapshot() {
    this.#storeCurrentZoneEntities();
    return {
      version: 11,
      zoneId: this.zoneId,
      player: { ...this.player },
      party: this.partyManager.snapshot(),
      flags: structuredClone(this.flags),
      inventoryState: this.inventoryManager.snapshot(),
      inventory: structuredClone(this.inventory),
      vendors: this.vendorManager.snapshot(),
      gold: this.gold,
      reputation: this.reputation,
      factions: structuredClone(this.factions),
      campaign: structuredClone(this.campaign),
      quests: this.quests.snapshot(),
      entities: structuredClone(this.entities),
      zoneEntityStates: structuredClone(this.zoneEntityStates),
      environment: this.environment.snapshot(),
      time: this.time,
      combat: this.combat.snapshot(),
      magic: this.magic.snapshot(),
    };
  }

  restore(snapshot) {
    if (!snapshot || !ZONES[snapshot.zoneId]) throw new Error("Neplatná uložená pozice.");
    this.zoneId = snapshot.zoneId;
    this.zone = ZONES[this.zoneId];
    this.player = {
      x: clamp(Number(snapshot.player?.x) || this.zone.start.x, 1.1, this.zone.map[0].length - 1.1),
      y: clamp(Number(snapshot.player?.y) || this.zone.start.y, 1.1, this.zone.map.length - 1.1),
      direction: normalizeAngle(Number(snapshot.player?.direction) || 0),
      pitch: 0,
    };
    this.partyManager = new PartyManager(snapshot.party || null);
    if (snapshot.inventoryState) {
      this.inventoryManager = new InventoryManager({ snapshot: snapshot.inventoryState, partyManager: this.partyManager });
    } else {
      this.inventoryManager = new InventoryManager({ partyManager: this.partyManager, initializeStarter: true });
      for (const [itemId, entry] of Object.entries(snapshot.inventory || {})) {
        const count = typeof entry === "object" ? Number(entry.count) || 0 : Number(entry) || 0;
        if (ITEMS[itemId] && count > 0) this.inventoryManager.add(itemId, count, this.partyManager, { ignoreCapacity: true });
      }
    }
    this.vendorManager = new VendorManager(snapshot.vendors || null);
    this.lootManager = new LootManager();
    this.combat = new CombatSystem(snapshot.combat || null);
    this.magic = new MagicSystem(snapshot.magic || null, this.partyManager);
    this.flags = snapshot.flags && typeof snapshot.flags === "object" ? structuredClone(snapshot.flags) : {};
    this.gold = Math.max(0, Number(snapshot.gold) || 0);
    this.reputation = Math.max(0, Number(snapshot.reputation) || 0);
    this.factions = { ...structuredClone(DEFAULT_FACTION_REPUTATION), ...(snapshot.factions && typeof snapshot.factions === "object" ? structuredClone(snapshot.factions) : {}) };
    this.campaign = snapshot.campaign && typeof snapshot.campaign === "object"
      ? { ending: snapshot.campaign.ending ? structuredClone(snapshot.campaign.ending) : null, endingSeen: Boolean(snapshot.campaign.endingSeen) }
      : { ending: null, endingSeen: false };
    this.quests = new QuestManager(QUESTS, snapshot.quests || null);
    if (this.quests.getStatus("silverEcho") === "notStarted") this.quests.start("silverEcho");
    if (this.quests.getStatus("beneathGate") === "completed" && this.quests.getStatus("councilOfSilverhaven") === "notStarted") this.quests.start("councilOfSilverhaven");
    this.environment = new EnvironmentSystem(snapshot.environment || null);
    this.zoneEntityStates = snapshot.zoneEntityStates && typeof snapshot.zoneEntityStates === "object"
      ? structuredClone(snapshot.zoneEntityStates)
      : {};
    if (!this.zoneEntityStates[this.zoneId] && Array.isArray(snapshot.entities)) {
      this.zoneEntityStates[this.zoneId] = structuredClone(snapshot.entities);
    }
    this.entities = this.#loadZoneEntities(this.zoneId);
    this.time = Number(snapshot.time) || 0;
    this.notifications = [];
    this.#syncAllEquipmentBonuses();
  }

  #applyQuestResult(result) {
    if (!result) return;
    this.notifications.push(...(result.notifications || []));

    for (const reward of result.rewards || []) {
      if (reward.type === "gold") this.gold += Number(reward.amount) || 0;
      if (reward.type === "reputation") this.reputation += Number(reward.amount) || 0;
      if (reward.type === "item") this.addItem(reward.itemId, reward.amount || 1, reward.name || reward.itemId);
      if (reward.type === "experience") this.awardExperience(reward.amount, "Odměna za úkol");
      if (reward.type === "faction") this.adjustFaction(reward.factionId, reward.amount);
      if (reward.type === "flag") this.flags[reward.key] = reward.value ?? true;
      if (reward.type === "startQuest") this.startQuest(reward.questId);
      if (reward.type === "resolveEnding") this.resolveEnding();
      if (["gold", "reputation", "item"].includes(reward.type)) {
        this.notifications.push({ type: "reward", message: `Odměna: ${reward.label || reward.name || reward.amount}` });
      }
    }
  }

  #storeCurrentZoneEntities() {
    if (!this.zoneId || !Array.isArray(this.entities)) return;
    this.zoneEntityStates[this.zoneId] = structuredClone(this.entities);
  }

  #loadZoneEntities(zoneId) {
    const zone = ZONES[zoneId];
    if (!zone) return [];
    const savedEntityList = Array.isArray(this.zoneEntityStates?.[zoneId]) ? this.zoneEntityStates[zoneId] : [];
    const savedEntities = new Map(savedEntityList.map((entity) => [entity.id, entity]));
    const baseIds = new Set(zone.entities.map((entity) => entity.id));
    const baseEntities = structuredClone(zone.entities).map((entity) => ({ ...entity, ...(savedEntities.get(entity.id) || {}) }));
    const dynamicEntities = savedEntityList.filter((entity) => entity?.id && !baseIds.has(entity.id)).map((entity) => structuredClone(entity));
    return [...baseEntities, ...dynamicEntities];
  }

  #syncEquipmentBonuses(memberId) {
    this.partyManager.syncEquipmentBonuses(memberId, this.inventoryManager.getBonuses(memberId));
  }

  #syncAllEquipmentBonuses() {
    for (const member of this.party) this.#syncEquipmentBonuses(member.id);
  }

  #canOccupy(x, y) {
    return this.canEntityOccupy(null, x, y, PLAYER_RADIUS);
  }

  canEntityOccupy(entity, x, y, radius = 0.22) {
    const probes = [
      [x - radius, y - radius],
      [x + radius, y - radius],
      [x - radius, y + radius],
      [x + radius, y + radius],
    ];
    for (const [probeX, probeY] of probes) {
      if (this.isWall(probeX, probeY)) return false;
    }

    if (entity && distanceSquared(x, y, this.player.x, this.player.y) < (radius + PLAYER_RADIUS + 0.08) ** 2) return false;
    for (const other of this.entities) {
      if (other === entity || !other.solid || !this.isEntityVisible(other)) continue;
      const otherRadius = other.enemyId ? 0.24 : 0.34;
      if (distanceSquared(x, y, other.x, other.y) < (radius + otherRadius) ** 2) return false;
    }
    return true;
  }

  hasLineOfSight(fromX, fromY, targetX, targetY) {
    const dx = targetX - fromX;
    const dy = targetY - fromY;
    const distance = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(distance / 0.08));

    for (let index = 1; index < steps; index += 1) {
      const t = index / steps;
      const x = fromX + dx * t;
      const y = fromY + dy * t;
      if (this.isWall(x, y)) return false;
    }
    return true;
  }
}

