import { clamp } from "../utils/math.js";
import { getEnemyAbility } from "../data/enemyAbilities.js";
import { getEnemyDefinition } from "../data/enemies.js";
import { Pathfinder } from "./Pathfinder.js";

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export class EnemyAI {
  constructor(snapshot = null) {
    this.brains = {};
    this.groupStates = {};
    this.pathfinder = new Pathfinder();
    this.randomState = hashString("silver-gate-ai") || 1;
    this.summonSequence = 0;
    this.hostileActivity = false;
    if (snapshot) this.restore(snapshot);
  }

  update(dt, world, combat) {
    this.hostileActivity = false;
    this.#ensureBrains(world, combat);
    this.#tickBrains(dt);
    this.#detectAndShareThreat(world, combat);

    for (const entity of world.entities) {
      if (!entity.enemyId || !world.isEntityVisible(entity)) continue;
      const definition = getEnemyDefinition(entity.enemyId);
      const state = combat.ensureEnemyState(entity);
      const brain = this.#brainFor(entity, definition);
      if (!definition || state.dead) continue;
      state.cooldown = Math.max(0, state.cooldown - dt);
      state.hitFlash = Math.max(0, state.hitFlash - dt);

      if (!state.alerted) {
        this.#returnHome(entity, definition, brain, world, dt);
        continue;
      }
      this.hostileActivity = true;
      this.#updateBossPhase(entity, definition, state, brain, world, combat);

      const dx = world.player.x - entity.x;
      const dy = world.player.y - entity.y;
      const distance = Math.hypot(dx, dy);
      const homeDistance = Math.hypot(entity.x - state.homeX, entity.y - state.homeY);
      if (distance > definition.leashRange && homeDistance > definition.leashRange * 0.65) {
        state.alerted = false;
        brain.mode = "return";
        continue;
      }

      if (brain.thinkTimer <= 0) {
        brain.thinkTimer = 0.18 + this.#random() * 0.18;
        brain.intent = this.#chooseIntent(entity, definition, state, brain, world, combat, distance);
      }
      this.#executeIntent(entity, definition, state, brain, world, combat, dt, distance);
    }
  }

  onEnemyDamaged(entity, world, combat) {
    const definition = getEnemyDefinition(entity.enemyId);
    const state = combat.ensureEnemyState(entity);
    state.alerted = true;
    const brain = this.#brainFor(entity, definition);
    brain.lastKnownX = world.player.x;
    brain.lastKnownY = world.player.y;
    this.#alertGroup(entity, definition, world, combat, 10);
  }

  getDamageTakenMultiplier(entityId, world) {
    const brain = this.brains[entityId];
    let multiplier = brain?.shieldTimer > 0 ? 0.72 : 1;
    const entity = world.entities.find((entry) => entry.id === entityId);
    if (!entity) return multiplier;
    for (const ally of world.entities) {
      if (!ally.enemyId || ally.id === entityId) continue;
      const allyBrain = this.brains[ally.id];
      const allyState = world.combat.getEnemyState(ally.id);
      if (!allyBrain || !allyState || allyState.dead || allyBrain.shieldAuraTimer <= 0) continue;
      if (Math.hypot(ally.x - entity.x, ally.y - entity.y) <= 4.2) multiplier *= 0.76;
    }
    return clamp(multiplier, 0.45, 1);
  }

  getAttackMultiplier(entityId) {
    const brain = this.brains[entityId];
    if (!brain) return 1;
    let multiplier = brain.frenzyTimer > 0 ? 1.28 : 1;
    if (brain.phase >= 3) multiplier *= 1.32;
    return multiplier;
  }

  getSpeedMultiplier(entityId) {
    const brain = this.brains[entityId];
    if (!brain) return 1;
    let multiplier = brain.frenzyTimer > 0 ? 1.2 : 1;
    if (brain.phase >= 3) multiplier *= 1.2;
    return multiplier;
  }

  getBrainView(entityId) {
    const brain = this.brains[entityId];
    return brain ? structuredClone(brain) : null;
  }

  snapshot() {
    return {
      brains: structuredClone(this.brains),
      groupStates: structuredClone(this.groupStates),
      randomState: this.randomState,
      summonSequence: this.summonSequence,
    };
  }

  restore(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return;
    this.brains = snapshot.brains && typeof snapshot.brains === "object" ? structuredClone(snapshot.brains) : {};
    this.groupStates = snapshot.groupStates && typeof snapshot.groupStates === "object" ? structuredClone(snapshot.groupStates) : {};
    this.randomState = Number(snapshot.randomState) >>> 0 || this.randomState;
    this.summonSequence = Math.max(0, Math.floor(Number(snapshot.summonSequence) || 0));
  }

  #ensureBrains(world, combat) {
    for (const entity of world.entities) {
      if (!entity.enemyId) continue;
      const definition = getEnemyDefinition(entity.enemyId);
      combat.ensureEnemyState(entity);
      this.#brainFor(entity, definition);
    }
  }

  #brainFor(entity, definition) {
    if (!this.brains[entity.id]) {
      this.brains[entity.id] = {
        role: entity.aiRole || definition?.aiRole || "bruiser",
        groupId: entity.groupId || definition?.groupId || `solo:${entity.id}`,
        mode: "idle",
        intent: "idle",
        thinkTimer: 0,
        pathTimer: 0,
        path: [],
        pathIndex: 0,
        abilityCooldowns: {},
        frenzyTimer: 0,
        shieldTimer: 0,
        shieldAuraTimer: 0,
        morale: 100,
        phase: 1,
        phaseTransition: 0,
        summonUsed: false,
        lastKnownX: entity.x,
        lastKnownY: entity.y,
        strafeSign: this.#random() < 0.5 ? -1 : 1,
      };
    }
    return this.brains[entity.id];
  }

  #tickBrains(dt) {
    for (const brain of Object.values(this.brains)) {
      brain.thinkTimer -= dt;
      brain.pathTimer -= dt;
      brain.frenzyTimer = Math.max(0, brain.frenzyTimer - dt);
      brain.shieldTimer = Math.max(0, brain.shieldTimer - dt);
      brain.shieldAuraTimer = Math.max(0, brain.shieldAuraTimer - dt);
      for (const abilityId of Object.keys(brain.abilityCooldowns || {})) {
        brain.abilityCooldowns[abilityId] = Math.max(0, brain.abilityCooldowns[abilityId] - dt);
      }
    }
  }

  #detectAndShareThreat(world, combat) {
    for (const entity of world.entities) {
      if (!entity.enemyId || !world.isEntityVisible(entity)) continue;
      const definition = getEnemyDefinition(entity.enemyId);
      const state = combat.ensureEnemyState(entity);
      if (!definition || state.dead || state.alerted) continue;
      const distance = Math.hypot(world.player.x - entity.x, world.player.y - entity.y);
      if (distance <= definition.aggroRange && world.hasLineOfSight(entity.x, entity.y, world.player.x, world.player.y)) {
        state.alerted = true;
        const brain = this.#brainFor(entity, definition);
        brain.mode = "combat";
        brain.lastKnownX = world.player.x;
        brain.lastKnownY = world.player.y;
        this.#alertGroup(entity, definition, world, combat, definition.callRadius || 9);
        world.notifications.push({ type: "combat", message: `${definition.name} vyhlásil poplach.` });
      }
    }
  }

  #alertGroup(source, definition, world, combat, radius) {
    const sourceBrain = this.#brainFor(source, definition);
    const group = sourceBrain.groupId;
    this.groupStates[group] = { alerted: true, lastKnownX: world.player.x, lastKnownY: world.player.y, updatedAt: world.time };
    for (const ally of world.entities) {
      if (!ally.enemyId || ally.id === source.id) continue;
      const allyDefinition = getEnemyDefinition(ally.enemyId);
      const allyBrain = this.#brainFor(ally, allyDefinition);
      if (allyBrain.groupId !== group) continue;
      if (Math.hypot(ally.x - source.x, ally.y - source.y) > radius) continue;
      const allyState = combat.ensureEnemyState(ally);
      if (allyState.dead) continue;
      allyState.alerted = true;
      allyBrain.mode = "combat";
      allyBrain.lastKnownX = world.player.x;
      allyBrain.lastKnownY = world.player.y;
    }
  }

  #chooseIntent(entity, definition, state, brain, world, combat, distance) {
    const abilities = definition.abilities || [];
    for (const abilityId of abilities) {
      if ((brain.abilityCooldowns[abilityId] || 0) > 0) continue;
      const ability = getEnemyAbility(abilityId);
      if (!ability) continue;
      if (this.#canUseAbility(entity, definition, state, brain, world, combat, ability, distance)) return `ability:${abilityId}`;
    }

    const preferred = definition.preferredRange ?? definition.attackRange * 0.8;
    if (definition.projectileSpeed > 0 || brain.role === "skirmisher" || brain.role === "caster") {
      if (distance < Math.max(2.2, preferred * 0.55)) return "retreat";
      if (distance <= definition.attackRange && world.hasLineOfSight(entity.x, entity.y, world.player.x, world.player.y)) return "attack";
      return "flank";
    }
    if (distance <= definition.attackRange && world.hasLineOfSight(entity.x, entity.y, world.player.x, world.player.y)) return "attack";
    return "advance";
  }

  #canUseAbility(entity, definition, state, brain, world, combat, ability, distance) {
    if ((ability.requirePhase || 1) > brain.phase) return false;
    if (ability.kind === "groupBuff") {
      const allies = this.#nearbyAllies(entity, brain.groupId, world, combat, ability.range).length;
      return allies >= 1 && brain.frenzyTimer <= 0;
    }
    if (ability.kind === "groupShield") {
      const allies = this.#nearbyAllies(entity, brain.groupId, world, combat, ability.range);
      return allies.some((ally) => {
        const allyState = combat.getEnemyState(ally.id);
        const allyDef = getEnemyDefinition(ally.enemyId);
        return allyState && allyState.hp / allyDef.maxHp < 0.75;
      }) && brain.shieldAuraTimer <= 0;
    }
    if (ability.kind === "summon") return definition.boss && brain.phase >= 2 && !brain.summonUsed;
    if (ability.kind === "partyArea") return distance <= ability.range;
    if (ability.kind === "projectile") return distance <= ability.range && distance >= 1.5 && world.hasLineOfSight(entity.x, entity.y, world.player.x, world.player.y);
    return false;
  }

  #executeIntent(entity, definition, state, brain, world, combat, dt, distance) {
    const intent = brain.intent || "advance";
    if (intent.startsWith("ability:")) {
      const ability = getEnemyAbility(intent.slice(8));
      if (ability && this.#useAbility(entity, definition, state, brain, world, combat, ability)) return;
      brain.intent = "advance";
    }
    if (intent === "attack") {
      if (state.cooldown <= 0 && world.magic.getEnemyModifier(entity.id, "attack") > 0) combat.performEnemyBasicAttack(entity, definition, world, this.getAttackMultiplier(entity.id));
      return;
    }
    if (intent === "retreat") {
      const dx = entity.x - world.player.x;
      const dy = entity.y - world.player.y;
      this.#moveToward(entity, definition, brain, world, dt, entity.x + dx, entity.y + dy);
      return;
    }
    if (intent === "flank") {
      const angle = Math.atan2(entity.y - world.player.y, entity.x - world.player.x) + brain.strafeSign * 0.7;
      const range = definition.preferredRange || Math.max(3, definition.attackRange * 0.72);
      const tx = world.player.x + Math.cos(angle) * range;
      const ty = world.player.y + Math.sin(angle) * range;
      this.#moveToward(entity, definition, brain, world, dt, tx, ty);
      return;
    }
    this.#moveToward(entity, definition, brain, world, dt, world.player.x, world.player.y);
  }

  #useAbility(entity, definition, state, brain, world, combat, ability) {
    brain.abilityCooldowns[ability.id] = ability.cooldown * (0.9 + this.#random() * 0.2);
    state.cooldown = Math.max(state.cooldown, 0.6);
    if (ability.kind === "groupBuff") {
      for (const ally of [entity, ...this.#nearbyAllies(entity, brain.groupId, world, combat, ability.range)]) {
        const allyBrain = this.#brainFor(ally, getEnemyDefinition(ally.enemyId));
        allyBrain.frenzyTimer = Math.max(allyBrain.frenzyTimer, ability.duration);
      }
      world.notifications.push({ type: "combat", message: `${definition.name} použil ${ability.name}; smečka útočí rychleji.` });
      return true;
    }
    if (ability.kind === "groupShield") {
      brain.shieldAuraTimer = ability.duration;
      world.notifications.push({ type: "combat", message: `${definition.name} vyvolal ${ability.name}; okolní nepřátelé jsou chráněni.` });
      return true;
    }
    if (ability.kind === "projectile") {
      combat.launchEnemyProjectile({
        entity, definition, world, kind: ability.projectileKind, speed: ability.projectileSpeed,
        range: ability.range + 1, damage: this.#integer(ability.damage[0], ability.damage[1]), damageType: ability.damageType,
        partyStatus: ability.partyStatus, sourceName: ability.name,
      });
      world.notifications.push({ type: "combat", message: `${definition.name} použil: ${ability.name}.` });
      return true;
    }
    if (ability.kind === "partyArea") {
      for (const member of world.party.filter((entry) => entry.condition !== "dead" && entry.condition !== "unconscious")) {
        combat.damageParty(member.id, this.#integer(ability.damage[0], ability.damage[1]) * this.getAttackMultiplier(entity.id), ability.damageType, world, ability.name);
        if (ability.partyStatus) world.magic.applyPartyStatus(member.id, ability.partyStatus.statusId, ability.partyStatus.duration, ability.partyStatus.potency, entity.id, ability.name);
      }
      combat.effects.push({ type: ability.damageType === "shock" ? "lightning" : "partyDamage", x: world.player.x, y: world.player.y, value: ability.name, ttl: 1.1 });
      world.notifications.push({ type: "combat", message: `${definition.name} rozpoutal: ${ability.name}.` });
      return true;
    }
    if (ability.kind === "summon") {
      this.#summon(entity, brain, world, combat, ability);
      brain.summonUsed = true;
      world.notifications.push({ type: "combat", message: `${definition.name} povolal dvě živé ozvěny.` });
      return true;
    }
    return false;
  }

  #summon(source, brain, world, combat, ability) {
    const offsets = [[1.15, 0], [-1.15, 0], [0, 1.15], [0, -1.15]];
    let created = 0;
    for (const [ox, oy] of offsets) {
      if (created >= ability.count) break;
      const x = source.x + ox;
      const y = source.y + oy;
      if (world.isWall(x, y)) continue;
      const id = `${source.id}-summon-${++this.summonSequence}`;
      const entity = {
        id, kind: "enemyShade", enemyId: ability.enemyId, name: "Živá ozvěna", x, y,
        homeX: source.homeX ?? source.x, homeY: source.homeY ?? source.y, solid: true,
        groupId: brain.groupId, aiRole: "assassin", summoned: true,
      };
      world.entities.push(entity);
      const state = combat.ensureEnemyState(entity);
      state.alerted = true;
      const summonBrain = this.#brainFor(entity, getEnemyDefinition(entity.enemyId));
      summonBrain.mode = "combat";
      created += 1;
    }
  }

  #updateBossPhase(entity, definition, state, brain, world, combat) {
    if (!definition.boss || !definition.phases?.length) return;
    const ratio = state.hp / Math.max(1, definition.maxHp);
    let nextPhase = 1;
    for (const phase of definition.phases) if (ratio <= phase.threshold) nextPhase = Math.max(nextPhase, phase.phase);
    if (nextPhase <= brain.phase) return;
    brain.phase = nextPhase;
    brain.phaseTransition = world.time;
    const phaseDef = definition.phases.find((entry) => entry.phase === nextPhase);
    world.notifications.push({ type: "complete", message: phaseDef?.message || `${definition.name} vstoupil do fáze ${nextPhase}.` });
    combat.effects.push({ type: "lightning", x: entity.x, y: entity.y, value: `FÁZE ${nextPhase}`, ttl: 1.5 });
    if (phaseDef?.immediateAbility) {
      brain.abilityCooldowns[phaseDef.immediateAbility] = 0;
      brain.intent = `ability:${phaseDef.immediateAbility}`;
      brain.thinkTimer = 0.45;
    }
  }

  #moveToward(entity, definition, brain, world, dt, targetX, targetY) {
    const speed = definition.speed * world.magic.getEnemyModifier(entity.id, "speed") * this.getSpeedMultiplier(entity.id);
    if (brain.pathTimer <= 0 || !brain.path.length || brain.pathIndex >= brain.path.length) {
      brain.path = this.pathfinder.findPath(world, entity.x, entity.y, targetX, targetY, definition.radius);
      brain.pathIndex = 0;
      brain.pathTimer = 0.65 + this.#random() * 0.35;
    }
    const waypoint = brain.path[brain.pathIndex] || { x: targetX, y: targetY };
    const dx = waypoint.x - entity.x;
    const dy = waypoint.y - entity.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.18 && brain.pathIndex < brain.path.length) {
      brain.pathIndex += 1;
      return;
    }
    if (distance <= 0.001) return;
    const step = Math.min(distance, speed * dt);
    const nx = entity.x + dx / distance * step;
    const ny = entity.y + dy / distance * step;
    let moved = false;
    if (world.canEntityOccupy(entity, nx, entity.y, definition.radius)) { entity.x = nx; moved = true; }
    if (world.canEntityOccupy(entity, entity.x, ny, definition.radius)) { entity.y = ny; moved = true; }
    if (!moved) brain.pathTimer = 0;
  }

  #returnHome(entity, definition, brain, world, dt) {
    const homeX = entity.homeX ?? entity.x;
    const homeY = entity.homeY ?? entity.y;
    if (Math.hypot(entity.x - homeX, entity.y - homeY) < 0.2) {
      brain.mode = "idle";
      brain.path = [];
      return;
    }
    this.#moveToward(entity, definition, brain, world, dt, homeX, homeY);
  }

  #nearbyAllies(entity, groupId, world, combat, radius) {
    return world.entities.filter((ally) => {
      if (!ally.enemyId || ally.id === entity.id) return false;
      const state = combat.getEnemyState(ally.id);
      const brain = this.brains[ally.id];
      return state && !state.dead && brain?.groupId === groupId && Math.hypot(ally.x - entity.x, ally.y - entity.y) <= radius;
    });
  }

  #random() {
    let x = this.randomState || 1;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.randomState = x >>> 0;
    return this.randomState / 4294967296;
  }

  #integer(min, max) { return Math.floor(this.#random() * (max - min + 1)) + min; }
}
