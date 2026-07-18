import { clamp, normalizeAngle } from "../utils/math.js";
import { ITEMS } from "../data/items.js";
import { getEnemyDefinition } from "../data/enemies.js";
import { EnemyAI } from "./EnemyAI.js";
import { ENEMY_AUDIO_ARCHETYPE } from "../data/audio.js";

const TARGET_ANGLE = Math.PI * 0.17;
const MELEE_RANGE = 1.72;
const DEFAULT_RANGED_RANGE = 8.5;

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function signedAngle(value) {
  let result = normalizeAngle(value);
  if (result > Math.PI) result -= Math.PI * 2;
  return result;
}

export class CombatSystem {
  constructor(snapshot = null) {
    this.enemyStates = {};
    this.memberCooldowns = {};
    this.projectiles = [];
    this.effects = [];
    this.targetId = null;
    this.inCombat = false;
    this.tacticalPaused = false;
    this.combatQuietTimer = 0;
    this.randomState = hashString("silver-gate-combat") || 1;
    this.ai = new EnemyAI(snapshot?.ai || null);
    if (snapshot) this.restore(snapshot);
  }

  update(dt, world) {
    this.#ensureEnemies(world);
    this.effects = this.effects
      .map((effect) => ({ ...effect, ttl: effect.ttl - dt }))
      .filter((effect) => effect.ttl > 0);

    this.#updateTarget(world);
    if (this.tacticalPaused) return;

    for (const memberId of Object.keys(this.memberCooldowns)) {
      this.memberCooldowns[memberId] = Math.max(0, this.memberCooldowns[memberId] - dt);
    }

    this.ai.update(dt, world, this);
    this.#updateProjectiles(dt, world);
    if (this.ai.hostileActivity || this.projectiles.length) {
      this.inCombat = true;
      this.combatQuietTimer = 3.2;
    } else if (this.combatQuietTimer > 0) {
      this.combatQuietTimer -= dt;
      if (this.combatQuietTimer <= 0) this.inCombat = false;
    }
  }

  attack(world) {
    if (this.tacticalPaused) return { ok: false, reason: "Taktická pauza je aktivní." };
    const member = world.partyManager.activeMember;
    if (!member || member.condition === "dead" || member.condition === "unconscious") {
      return { ok: false, reason: "Aktivní postava nemůže bojovat." };
    }
    const cooldown = this.memberCooldowns[member.id] || 0;
    if (cooldown > 0) return { ok: false, reason: `Postava se zotavuje (${cooldown.toFixed(1)} s).`, cooldown };

    const equipment = world.inventoryManager.getEquipment(member.id);
    const weapon = ITEMS[equipment.mainHand] || null;
    const skillId = weapon?.skill || "athletics";
    const ranged = skillId === "bow" || skillId === "staff";
    const maxRange = ranged ? DEFAULT_RANGED_RANGE : MELEE_RANGE;
    const target = this.getTarget(world, maxRange, TARGET_ANGLE);
    if (!target) return { ok: false, reason: ranged ? "V zaměřovači není nepřítel." : "Žádný nepřítel není v dosahu." };

    const derived = world.partyManager.getDerivedStats(member.id);
    const state = this.#stateFor(target);
    const definition = getEnemyDefinition(target.enemyId);
    const skill = member.skills[skillId] || 0;
    const accuracy = member.attributes.accuracy || 0;
    const hitChance = clamp(0.66 + accuracy * 0.012 + skill * 0.025 - definition.evasion * 0.012, 0.25, 0.97);
    const recovery = clamp((1.42 - (derived.initiative + world.magic.getPartyModifier(member.id, "initiative")) * 0.012 - skill * 0.025) * world.magic.getPartyModifier(member.id, "recovery"), 0.24, 1.3);
    this.memberCooldowns[member.id] = recovery;
    this.targetId = target.id;
    state.alerted = true;

    if (this.#random() > hitChance) {
      world.notifications.push({ type: "combat", message: `${member.name} minul: ${definition.name}.` });
      this.effects.push({ type: "miss", x: target.x, y: target.y, value: "MINUL", ttl: 0.75 });
      return { ok: true, hit: false, targetId: target.id, cooldown: recovery, attackKind: ranged ? "ranged" : "melee" };
    }

    const base = ranged && skillId === "staff"
      ? 4 + derived.spellPower * 0.62 + skill * 2.2
      : 4 + derived.attack * 0.48 + skill * 1.75;
    const critical = this.#random() * 100 < derived.criticalChance + world.magic.getPartyModifier(member.id, "critical");
    const rawDamage = Math.max(1, Math.round((base + world.magic.getPartyModifier(member.id, "attack")) * (0.86 + this.#random() * 0.3) * (critical ? 1.65 : 1)));
    const damageType = skillId === "staff" ? "spirit" : "physical";

    if (ranged) {
      const angle = Math.atan2(target.y - world.player.y, target.x - world.player.x);
      this.projectiles.push({
        id: `party-${member.id}-${world.time}-${this.projectiles.length}`,
        owner: "party",
        kind: skillId === "bow" ? "playerArrow" : "playerArcane",
        x: world.player.x + Math.cos(angle) * 0.28,
        y: world.player.y + Math.sin(angle) * 0.28,
        vx: Math.cos(angle) * (skillId === "bow" ? 7.8 : 5.6),
        vy: Math.sin(angle) * (skillId === "bow" ? 7.8 : 5.6),
        remaining: maxRange,
        damage: rawDamage,
        damageType,
        critical,
        targetId: target.id,
        sourceName: member.name,
      });
      return { ok: true, hit: true, pending: true, targetId: target.id, cooldown: recovery, attackKind: "ranged", critical };
    }

    const dealt = this.#damageEnemy(target, rawDamage, damageType, critical, world, member.name);
    return { ok: true, hit: true, damage: dealt, targetId: target.id, cooldown: recovery, attackKind: "melee", critical };
  }

  cycleTarget(world, direction = 1) {
    const candidates = world.entities
      .filter((entity) => entity.enemyId && world.isEntityVisible(entity) && !this.#stateFor(entity).dead)
      .map((entity) => ({ entity, angle: Math.abs(signedAngle(Math.atan2(entity.y - world.player.y, entity.x - world.player.x) - world.player.direction)), distance: Math.hypot(entity.x - world.player.x, entity.y - world.player.y) }))
      .filter((entry) => entry.distance <= 12 && world.hasLineOfSight(world.player.x, world.player.y, entry.entity.x, entry.entity.y))
      .sort((a, b) => a.angle - b.angle || a.distance - b.distance)
      .map((entry) => entry.entity);
    if (!candidates.length) {
      this.targetId = null;
      return null;
    }
    const currentIndex = candidates.findIndex((entry) => entry.id === this.targetId);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + direction + candidates.length) % candidates.length;
    this.targetId = candidates[nextIndex].id;
    return candidates[nextIndex];
  }

  toggleTacticalPause() {
    this.tacticalPaused = !this.tacticalPaused;
    return this.tacticalPaused;
  }

  getTarget(world, range = DEFAULT_RANGED_RANGE, maxAngle = TARGET_ANGLE) {
    const locked = world.entities.find((entity) => entity.id === this.targetId && entity.enemyId && world.isEntityVisible(entity) && !this.#stateFor(entity).dead);
    if (locked) {
      const distance = Math.hypot(locked.x - world.player.x, locked.y - world.player.y);
      const angle = Math.abs(signedAngle(Math.atan2(locked.y - world.player.y, locked.x - world.player.x) - world.player.direction));
      if (distance <= range && angle <= maxAngle * 1.7 && world.hasLineOfSight(world.player.x, world.player.y, locked.x, locked.y)) return locked;
    }

    let best = null;
    let bestScore = Infinity;
    for (const entity of world.entities) {
      if (!entity.enemyId || !world.isEntityVisible(entity)) continue;
      const state = this.#stateFor(entity);
      if (state.dead) continue;
      const dx = entity.x - world.player.x;
      const dy = entity.y - world.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance > range) continue;
      const angle = Math.abs(signedAngle(Math.atan2(dy, dx) - world.player.direction));
      if (angle > maxAngle) continue;
      if (!world.hasLineOfSight(world.player.x, world.player.y, entity.x, entity.y)) continue;
      const score = angle * 4 + distance * 0.08;
      if (score < bestScore) {
        best = entity;
        bestScore = score;
      }
    }
    if (best) this.targetId = best.id;
    return best;
  }

  getTargetView(world) {
    const entity = world.entities.find((candidate) => candidate.id === this.targetId && candidate.enemyId && world.isEntityVisible(candidate));
    if (!entity) return null;
    const state = this.#stateFor(entity);
    const definition = getEnemyDefinition(entity.enemyId);
    if (!definition || state.dead) return null;
    const brain = this.ai.getBrainView(entity.id);
    return {
      id: entity.id,
      name: definition.name,
      hp: state.hp,
      maxHp: definition.maxHp,
      boss: Boolean(definition.boss),
      alerted: state.alerted,
      phase: brain?.phase || 1,
      role: brain?.role || definition.aiRole || "bruiser",
      shielded: Boolean(brain?.shieldTimer > 0 || brain?.shieldAuraTimer > 0),
      distance: Math.hypot(entity.x - world.player.x, entity.y - world.player.y),
    };
  }

  getMemberCooldown(memberId) {
    return Math.max(0, this.memberCooldowns[memberId] || 0);
  }

  getEnemiesInRadius(world, x, y, radius, limit = 99) {
    return world.entities
      .filter((entity) => entity.enemyId && world.isEntityVisible(entity) && !this.#stateFor(entity).dead)
      .filter((entity) => Math.hypot(entity.x - x, entity.y - y) <= radius)
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))
      .slice(0, Math.max(0, limit));
  }

  damageEnemy(entity, rawDamage, damageType, critical, world, sourceName) {
    if (!entity?.enemyId) return 0;
    return this.#damageEnemy(entity, rawDamage, damageType, critical, world, sourceName);
  }

  damageParty(memberId, rawDamage, damageType, world, sourceName) {
    return this.#damageParty(memberId, rawDamage, damageType, world, sourceName);
  }

  launchPartyProjectile({ world, sourceName, casterId, target, kind, speed, range, damage, damageType, critical = false, statuses = [] }) {
    if (!target?.enemyId) return null;
    const angle = Math.atan2(target.y - world.player.y, target.x - world.player.x);
    const projectile = {
      id: `magic-${casterId}-${world.time}-${this.projectiles.length}`,
      owner: "party",
      kind,
      x: world.player.x + Math.cos(angle) * 0.28,
      y: world.player.y + Math.sin(angle) * 0.28,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      remaining: range,
      damage,
      damageType,
      critical,
      targetId: target.id,
      sourceName,
      casterId,
      statuses: structuredClone(statuses),
    };
    this.projectiles.push(projectile);
    return projectile;
  }

  getEnemyState(entityId) {
    const state = this.enemyStates[entityId];
    return state ? { ...state } : null;
  }

  getEnemyBrain(entityId) {
    return this.ai.getBrainView(entityId);
  }

  ensureEnemyState(entity) {
    return this.#stateFor(entity);
  }

  performEnemyBasicAttack(entity, definition, world, damageMultiplier = 1) {
    return this.#enemyAttack(entity, definition, world, damageMultiplier);
  }

  launchEnemyProjectile({ entity, definition, world, kind, speed, range, damage, damageType, partyStatus = null, sourceName = null }) {
    const living = world.party.filter((member) => member.condition !== "dead" && member.condition !== "unconscious");
    if (!living.length) return null;
    const active = world.partyManager.activeMember;
    const target = active && living.some((member) => member.id === active.id) && this.#random() < 0.58
      ? active
      : living[Math.floor(this.#random() * living.length)];
    const angle = Math.atan2(world.player.y - entity.y, world.player.x - entity.x);
    const projectile = {
      id: `enemy-ability-${entity.id}-${world.time}-${this.projectiles.length}`,
      owner: "enemy",
      kind: kind || definition.projectileKind,
      x: entity.x,
      y: entity.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      remaining: range,
      damage: Math.max(1, Math.round(damage)),
      damageType,
      memberId: target.id,
      sourceName: sourceName || definition.name,
      partyStatus: partyStatus ? structuredClone(partyStatus) : null,
    };
    this.projectiles.push(projectile);
    return projectile;
  }

  snapshot() {
    return {
      enemyStates: structuredClone(this.enemyStates),
      memberCooldowns: structuredClone(this.memberCooldowns),
      targetId: this.targetId,
      tacticalPaused: this.tacticalPaused,
      randomState: this.randomState,
      ai: this.ai.snapshot(),
    };
  }

  restore(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return;
    this.enemyStates = snapshot.enemyStates && typeof snapshot.enemyStates === "object" ? structuredClone(snapshot.enemyStates) : {};
    this.memberCooldowns = snapshot.memberCooldowns && typeof snapshot.memberCooldowns === "object" ? structuredClone(snapshot.memberCooldowns) : {};
    this.targetId = typeof snapshot.targetId === "string" ? snapshot.targetId : null;
    this.tacticalPaused = Boolean(snapshot.tacticalPaused);
    this.randomState = Number(snapshot.randomState) >>> 0 || this.randomState;
    this.ai.restore(snapshot.ai || null);
    this.projectiles = [];
    this.effects = [];
  }

  #ensureEnemies(world) {
    for (const entity of world.entities) {
      if (!entity.enemyId) continue;
      const state = this.#stateFor(entity);
      if (state.dead) {
        entity.kind = "corpse";
        entity.solid = false;
        entity.interaction = entity.interaction || { type: "loot", lootTable: getEnemyDefinition(entity.enemyId)?.lootTable, prompt: "Prohledat ostatky" };
      }
    }
  }

  #stateFor(entity) {
    if (!this.enemyStates[entity.id]) {
      const definition = getEnemyDefinition(entity.enemyId);
      this.enemyStates[entity.id] = {
        hp: definition?.maxHp || 1,
        dead: false,
        alerted: false,
        cooldown: 0,
        hitFlash: 0,
        deathStartedAt: null,
        homeX: entity.homeX ?? entity.x,
        homeY: entity.homeY ?? entity.y,
      };
    }
    return this.enemyStates[entity.id];
  }

  #updateTarget(world) {
    const current = world.entities.find((entity) => entity.id === this.targetId && entity.enemyId && world.isEntityVisible(entity));
    if (current && !this.#stateFor(current).dead) return;
    this.targetId = null;
    this.getTarget(world, DEFAULT_RANGED_RANGE, TARGET_ANGLE);
  }

  #moveEnemy(entity, definition, world, dt, dx, dy, distance) {
    if (distance <= 0.001) return;
    const step = definition.speed * world.magic.getEnemyModifier(entity.id, "speed") * dt;
    const nx = entity.x + (dx / distance) * step;
    const ny = entity.y + (dy / distance) * step;
    if (world.canEntityOccupy(entity, nx, entity.y, definition.radius)) entity.x = nx;
    if (world.canEntityOccupy(entity, entity.x, ny, definition.radius)) entity.y = ny;
  }

  #enemyAttack(entity, definition, world, damageMultiplier = 1) {
    const state = this.#stateFor(entity);
    state.cooldown = definition.attackCooldown * (0.9 + this.#random() * 0.2);
    const living = world.party.filter((member) => member.condition !== "dead" && member.condition !== "unconscious");
    if (!living.length) return;
    const active = world.partyManager.activeMember;
    const target = active && living.some((member) => member.id === active.id) && this.#random() < 0.58
      ? active
      : living[Math.floor(this.#random() * living.length)];
    const rawDamage = Math.max(1, Math.round(this.#integer(definition.damage[0], definition.damage[1]) * damageMultiplier));

    if (definition.projectileSpeed > 0) {
      const angle = Math.atan2(world.player.y - entity.y, world.player.x - entity.x);
      this.projectiles.push({
        id: `enemy-${entity.id}-${world.time}-${this.projectiles.length}`,
        owner: "enemy",
        kind: definition.projectileKind,
        x: entity.x,
        y: entity.y,
        vx: Math.cos(angle) * definition.projectileSpeed,
        vy: Math.sin(angle) * definition.projectileSpeed,
        remaining: definition.attackRange + 1,
        damage: rawDamage,
        damageType: definition.damageType,
        memberId: target.id,
        sourceName: definition.name,
      });
      world.notifications.push({ type: "combat", message: `${definition.name} vystřelil na ${target.name}.`, audioCue: `monster-${ENEMY_AUDIO_ARCHETYPE[entity.enemyId] || "raider"}-attack` });
      return;
    }

    world.notifications.push({ type: "audio", audioCue: `monster-${ENEMY_AUDIO_ARCHETYPE[entity.enemyId] || "hound"}-attack` });
    this.#damageParty(target.id, rawDamage, definition.damageType, world, definition.name);
  }

  #updateProjectiles(dt, world) {
    const survivors = [];
    for (const projectile of this.projectiles) {
      const speed = Math.hypot(projectile.vx, projectile.vy);
      const previousX = projectile.x;
      const previousY = projectile.y;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.remaining -= speed * dt;
      if (projectile.remaining <= 0 || world.isWall(projectile.x, projectile.y)) continue;

      if (projectile.owner === "party") {
        const target = world.entities.find((entity) => entity.id === projectile.targetId && entity.enemyId && world.isEntityVisible(entity));
        if (!target || this.#stateFor(target).dead) continue;
        if (Math.hypot(projectile.x - target.x, projectile.y - target.y) <= 0.34 || this.#segmentNear(previousX, previousY, projectile.x, projectile.y, target.x, target.y, 0.28)) {
          this.#damageEnemy(target, projectile.damage, projectile.damageType, projectile.critical, world, projectile.sourceName);
          for (const status of projectile.statuses || []) {
            world.magic.applyEnemyStatus(target.id, status.statusId, status.duration || 5, status.potency || 1, projectile.casterId, projectile.sourceName);
          }
          continue;
        }
      } else if (Math.hypot(projectile.x - world.player.x, projectile.y - world.player.y) <= 0.3 || this.#segmentNear(previousX, previousY, projectile.x, projectile.y, world.player.x, world.player.y, 0.25)) {
        this.#damageParty(projectile.memberId, projectile.damage, projectile.damageType, world, projectile.sourceName);
        if (projectile.partyStatus) {
          world.magic.applyPartyStatus(projectile.memberId, projectile.partyStatus.statusId, projectile.partyStatus.duration || 5, projectile.partyStatus.potency || 1, projectile.id, projectile.sourceName);
        }
        continue;
      }
      survivors.push(projectile);
    }
    this.projectiles = survivors;
  }

  #damageEnemy(entity, rawDamage, damageType, critical, world, sourceName) {
    const state = this.#stateFor(entity);
    const definition = getEnemyDefinition(entity.enemyId);
    const armor = damageType === "physical" ? definition.armor : Math.round(definition.armor * 0.35);
    const statusMultiplier = damageType === "shock" ? world.magic.getEnemyModifier(entity.id, "shockTaken") : 1;
    const resistance = damageType === "physical" ? 0 : Number(definition.resistances?.[damageType] || 0);
    const resistanceMultiplier = clamp(1 - resistance / 100, 0.18, 1.5);
    const aiMitigation = this.ai.getDamageTakenMultiplier(entity.id, world);
    const damage = Math.max(1, Math.round(rawDamage * statusMultiplier * resistanceMultiplier * aiMitigation * (100 / (100 + armor * 2.2))));
    state.hp = Math.max(0, state.hp - damage);
    state.hitFlash = 0.16;
    state.alerted = true;
    this.ai.onEnemyDamaged(entity, world, this);
    this.effects.push({ type: critical ? "critical" : "damage", x: entity.x, y: entity.y, value: damage, ttl: 0.9 });
    world.notifications.push({ type: "combat", message: `${sourceName} zasáhl: ${definition.name} utrpěl ${damage}${critical ? " kritického" : ""} poškození.`, audioCue: critical ? "hit-critical" : definition.armor >= 12 ? "hit-armor" : "hit-flesh" });
    if (state.hp <= 0) this.#killEnemy(entity, definition, world);
    return damage;
  }

  #damageParty(memberId, rawDamage, damageType, world, sourceName) {
    const member = world.partyManager.getMember(memberId);
    if (!member || member.condition === "dead") return 0;
    const derived = world.partyManager.getDerivedStats(member.id);
    const view = world.partyManager.getMemberView(member.id);
    const resistance = damageType === "physical" ? 0 : (view.adjustedResistances[damageType] || 0) + world.magic.getPartyModifier(member.id, "resistance");
    const defense = derived.defense + world.magic.getPartyModifier(member.id, "defense");
    const mitigation = damageType === "physical"
      ? 100 / (100 + defense * 1.85)
      : clamp(1 - resistance / 130, 0.18, 1);
    const damage = Math.max(1, Math.round(rawDamage * mitigation * world.magic.getPartyModifier(member.id, "damageTaken")));
    world.partyManager.applyDamage(member.id, damage);
    this.effects.push({ type: "partyDamage", x: world.player.x, y: world.player.y, value: damage, ttl: 0.7 });
    world.notifications.push({ type: "combat", message: `${sourceName} zasáhl ${member.name} za ${damage}.`, audioCue: "hit-flesh", screenEffect: "damage", effectStrength: Math.min(1, .35 + damage / 35) });
    if (member.condition === "unconscious") world.notifications.push({ type: "warning", message: `${member.name} upadl do bezvědomí.` });
    if (member.condition === "dead") world.notifications.push({ type: "warning", message: `${member.name} zemřel.` });
    if (world.party.every((entry) => entry.condition === "dead" || entry.condition === "unconscious")) {
      world.notifications.push({ type: "defeat", message: "Celá družina byla vyřazena." });
    }
    return damage;
  }

  #killEnemy(entity, definition, world) {
    const state = this.#stateFor(entity);
    state.dead = true;
    state.deathStartedAt = world.time;
    state.alerted = false;
    entity.kind = "corpse";
    entity.solid = false;
    entity.name = `Ostatky: ${definition.name}`;
    entity.interaction = { type: "loot", lootTable: definition.lootTable, prompt: `Prohledat ostatky (${definition.name})` };
    this.targetId = null;
    world.flags[`killed:${entity.id}`] = true;
    world.awardExperience(definition.experience, `Poražen: ${definition.name}`);
    world.emitQuestEvent("kill", entity.enemyId, 1);
    world.notifications.push({ type: definition.boss ? "complete" : "combat", message: `${definition.name} byl poražen. Ostatky lze prohledat.`, audioCue: `monster-${ENEMY_AUDIO_ARCHETYPE[entity.enemyId] || "hound"}-death` });
  }

  #segmentNear(ax, ay, bx, by, px, py, radius) {
    const abx = bx - ax;
    const aby = by - ay;
    const lengthSquared = abx * abx + aby * aby || 1;
    const t = clamp(((px - ax) * abx + (py - ay) * aby) / lengthSquared, 0, 1);
    return Math.hypot(ax + abx * t - px, ay + aby * t - py) <= radius;
  }

  #random() {
    let x = this.randomState || 1;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.randomState = x >>> 0;
    return this.randomState / 4294967296;
  }

  #integer(min, max) {
    return Math.floor(this.#random() * (max - min + 1)) + min;
  }
}
