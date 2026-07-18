import { ABILITIES, CLASS_HOTBARS, STATUS_EFFECTS, getAbility, getClassAbilities, isAbilityUnlocked } from "../data/abilities.js";
import { clamp } from "../utils/math.js";

const HOTBAR_SIZE = 8;

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cloneStatus(status) {
  return {
    id: status.id,
    sourceId: status.sourceId || null,
    sourceName: status.sourceName || "Neznámý zdroj",
    duration: Math.max(0, safeNumber(status.duration, 0)),
    remaining: Math.max(0, safeNumber(status.remaining, status.duration)),
    potency: Math.max(0, safeNumber(status.potency, 1)),
    tickTimer: Math.max(0, safeNumber(status.tickTimer, STATUS_EFFECTS[status.id]?.tickInterval || 0)),
  };
}

export class MagicSystem {
  constructor(snapshot = null, partyManager = null) {
    this.partyStatuses = {};
    this.enemyStatuses = {};
    this.cooldowns = {};
    this.hotbars = {};
    this.castSequence = 0;
    if (partyManager) this.ensureParty(partyManager);
    if (snapshot) this.restore(snapshot, partyManager);
  }

  ensureParty(partyManager) {
    for (const member of partyManager.members) {
      if (!this.partyStatuses[member.id]) this.partyStatuses[member.id] = [];
      if (!this.cooldowns[member.id]) this.cooldowns[member.id] = {};
      if (!this.hotbars[member.id]) {
        const defaults = CLASS_HOTBARS[member.classId] || [];
        this.hotbars[member.id] = [...defaults, ...Array(Math.max(0, HOTBAR_SIZE - defaults.length)).fill(null)].slice(0, HOTBAR_SIZE);
      }
    }
  }

  update(dt, world) {
    this.ensureParty(world.partyManager);
    if (world.combat.tacticalPaused) return;

    for (const memberCooldowns of Object.values(this.cooldowns)) {
      for (const abilityId of Object.keys(memberCooldowns)) {
        memberCooldowns[abilityId] = Math.max(0, memberCooldowns[abilityId] - dt);
      }
    }

    for (const member of world.party) {
      this.partyStatuses[member.id] = this.#updateStatusList(this.partyStatuses[member.id] || [], dt, (status, definition) => {
        if (definition.healing) {
          const healed = this.#healMember(world, member.id, Math.max(1, Math.round(definition.healing * status.potency)), status.sourceName);
          if (healed > 0) world.notifications.push({ type: "magic", message: `${member.name} obnovil ${healed} životů (${definition.name}).`, screenEffect: "heal", effectStrength: Math.min(.8, .25 + healed / 80) });
        }
        if (definition.damageType && status.potency > 0) {
          world.combat.damageParty(member.id, Math.max(1, Math.round(status.potency)), definition.damageType, world, status.sourceName || definition.name);
        }
      });
    }

    for (const [entityId, statuses] of Object.entries(this.enemyStatuses)) {
      const entity = world.entities.find((candidate) => candidate.id === entityId && candidate.enemyId);
      if (!entity || world.combat.getEnemyState(entityId)?.dead) {
        delete this.enemyStatuses[entityId];
        continue;
      }
      this.enemyStatuses[entityId] = this.#updateStatusList(statuses, dt, (status, definition) => {
        if (definition.damageType && status.potency > 0) {
          world.combat.damageEnemy(entity, Math.max(1, Math.round(status.potency)), definition.damageType, false, world, status.sourceName || definition.name);
        }
      });
    }
  }

  cast(abilityId, world, options = {}) {
    const ability = getAbility(abilityId);
    const caster = world.partyManager.getMember(options.memberId || world.activeMemberId);
    if (!ability || !caster) return { ok: false, reason: "Neznámá schopnost nebo sesilatel." };
    if (!isAbilityUnlocked(caster, ability)) return { ok: false, reason: "Schopnost ještě není odemčena nebo chybí požadovaná dovednost." };
    if (caster.condition === "dead" || caster.condition === "unconscious") return { ok: false, reason: `${caster.name} nemůže schopnost použít.` };
    if (ability.kind === "spell" && (this.partyStatuses[caster.id] || []).some((status) => STATUS_EFFECTS[status.id]?.blocksMagic)) {
      return { ok: false, reason: `${caster.name} je umlčen a nemůže sesílat kouzla.` };
    }
    const cooldown = this.getCooldown(caster.id, ability.id);
    if (cooldown > 0) return { ok: false, reason: `${ability.name} bude připravena za ${cooldown.toFixed(1)} s.`, cooldown };
    if (caster.mp < ability.manaCost) return { ok: false, reason: `${caster.name} nemá dost many (${caster.mp}/${ability.manaCost}).` };

    const targetContext = this.#resolveTarget(ability, world, options);
    if (!targetContext.ok) return targetContext;

    const derived = world.partyManager.getDerivedStats(caster.id);
    const skillRank = ability.requiredSkill ? (caster.skills[ability.requiredSkill.id] || 0) : 0;
    const power = ability.kind === "spell" ? derived.spellPower : derived.attack;
    const healingPower = derived.healingPower;
    const result = { ok: true, abilityId, casterId: caster.id, name: ability.name, affected: [], projectile: false };

    caster.mp = Math.max(0, caster.mp - ability.manaCost);
    this.cooldowns[caster.id][ability.id] = ability.cooldown;
    this.castSequence += 1;

    for (const effect of ability.effects) {
      this.#applyEffect(effect, { ability, caster, derived, skillRank, power, healingPower, world, targetContext, result });
    }

    world.notifications.push({ type: "magic", message: `${caster.name} použil: ${ability.name}${ability.manaCost ? ` (−${ability.manaCost} many)` : ""}.` });
    return result;
  }

  castHotbar(slotIndex, world, options = {}) {
    const memberId = options.memberId || world.activeMemberId;
    const abilityId = this.getHotbar(memberId)[slotIndex] || null;
    if (!abilityId) return { ok: false, reason: `Pozice ${slotIndex + 1} je prázdná.` };
    return this.cast(abilityId, world, { ...options, memberId });
  }

  setHotbarSlot(memberId, slotIndex, abilityId, partyManager) {
    this.ensureParty(partyManager);
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= HOTBAR_SIZE) return { ok: false, reason: "Neplatná pozice rychlé lišty." };
    const member = partyManager.getMember(memberId);
    const ability = abilityId ? getAbility(abilityId) : null;
    if (!member || (ability && ability.classId !== member.classId)) return { ok: false, reason: "Schopnost nepatří této postavě." };
    this.hotbars[memberId][slotIndex] = abilityId || null;
    return { ok: true };
  }

  getHotbar(memberId) {
    return [...(this.hotbars[memberId] || Array(HOTBAR_SIZE).fill(null))];
  }

  getHotbarView(member, partyManager) {
    this.ensureParty(partyManager);
    return this.getHotbar(member.id).map((abilityId, index) => {
      const ability = getAbility(abilityId);
      return {
        index,
        ability,
        unlocked: ability ? isAbilityUnlocked(member, ability) : false,
        cooldown: ability ? this.getCooldown(member.id, ability.id) : 0,
        affordable: ability ? member.mp >= ability.manaCost : false,
      };
    });
  }

  getSpellbookView(member) {
    return getClassAbilities(member.classId).map((ability) => ({
      ability,
      unlocked: isAbilityUnlocked(member, ability),
      cooldown: this.getCooldown(member.id, ability.id),
      assignedSlots: (this.hotbars[member.id] || []).map((id, index) => id === ability.id ? index : -1).filter((index) => index >= 0),
    }));
  }

  getCooldown(memberId, abilityId) {
    return Math.max(0, safeNumber(this.cooldowns[memberId]?.[abilityId], 0));
  }

  getPartyStatuses(memberId) {
    return (this.partyStatuses[memberId] || []).map((status) => ({ ...status, definition: STATUS_EFFECTS[status.id] }));
  }

  getEnemyStatuses(entityId) {
    return (this.enemyStatuses[entityId] || []).map((status) => ({ ...status, definition: STATUS_EFFECTS[status.id] }));
  }

  getPartyModifier(memberId, key) {
    let additive = 0;
    let multiplicative = 1;
    for (const status of this.partyStatuses[memberId] || []) {
      const definition = STATUS_EFFECTS[status.id];
      if (!definition) continue;
      if (key === "attack") additive += (definition.attackBonus || 0) * status.potency;
      if (key === "defense") additive += (definition.defenseBonus || 0) * status.potency;
      if (key === "critical") additive += (definition.criticalBonus || 0) * status.potency;
      if (key === "initiative") additive += (definition.initiativeBonus || 0) * status.potency;
      if (key === "resistance") additive += (definition.resistanceBonus || 0) * status.potency;
      if (key === "recovery") multiplicative *= definition.recoveryMultiplier || 1;
      if (key === "damageTaken") multiplicative *= definition.damageTakenMultiplier || 1;
    }
    return ["recovery", "damageTaken"].includes(key) ? multiplicative : additive;
  }

  getEnemyModifier(entityId, key) {
    let multiplier = 1;
    for (const status of this.enemyStatuses[entityId] || []) {
      const definition = STATUS_EFFECTS[status.id];
      if (!definition) continue;
      if (key === "speed") multiplier *= definition.speedMultiplier ?? 1;
      if (key === "attack") multiplier *= definition.attackMultiplier ?? 1;
      if (key === "shockTaken") multiplier *= definition.shockTakenMultiplier ?? 1;
    }
    return multiplier;
  }

  applyPartyStatus(memberId, statusId, duration, potency, sourceId, sourceName) {
    if (!STATUS_EFFECTS[statusId]) return false;
    if (!this.partyStatuses[memberId]) this.partyStatuses[memberId] = [];
    this.#upsertStatus(this.partyStatuses[memberId], { id: statusId, duration, remaining: duration, potency, sourceId, sourceName, tickTimer: STATUS_EFFECTS[statusId].tickInterval || 0 });
    return true;
  }

  applyEnemyStatus(entityId, statusId, duration, potency, sourceId, sourceName) {
    if (!STATUS_EFFECTS[statusId]) return false;
    if (!this.enemyStatuses[entityId]) this.enemyStatuses[entityId] = [];
    this.#upsertStatus(this.enemyStatuses[entityId], { id: statusId, duration, remaining: duration, potency, sourceId, sourceName, tickTimer: STATUS_EFFECTS[statusId].tickInterval || 0 });
    return true;
  }

  cleanseMember(memberId) {
    const before = this.partyStatuses[memberId]?.length || 0;
    this.partyStatuses[memberId] = (this.partyStatuses[memberId] || []).filter((status) => STATUS_EFFECTS[status.id]?.category !== "negative");
    return before - this.partyStatuses[memberId].length;
  }

  clearOnRest() {
    this.partyStatuses = Object.fromEntries(Object.keys(this.partyStatuses).map((memberId) => [memberId, []]));
    this.enemyStatuses = {};
    for (const memberCooldowns of Object.values(this.cooldowns)) {
      for (const abilityId of Object.keys(memberCooldowns)) memberCooldowns[abilityId] = 0;
    }
  }

  snapshot() {
    return {
      partyStatuses: structuredClone(this.partyStatuses),
      enemyStatuses: structuredClone(this.enemyStatuses),
      cooldowns: structuredClone(this.cooldowns),
      hotbars: structuredClone(this.hotbars),
      castSequence: this.castSequence,
    };
  }

  restore(snapshot, partyManager = null) {
    if (!snapshot || typeof snapshot !== "object") {
      if (partyManager) this.ensureParty(partyManager);
      return;
    }
    this.partyStatuses = this.#normalizeStatusMap(snapshot.partyStatuses);
    this.enemyStatuses = this.#normalizeStatusMap(snapshot.enemyStatuses);
    this.cooldowns = snapshot.cooldowns && typeof snapshot.cooldowns === "object" ? structuredClone(snapshot.cooldowns) : {};
    this.hotbars = snapshot.hotbars && typeof snapshot.hotbars === "object" ? structuredClone(snapshot.hotbars) : {};
    this.castSequence = Math.max(0, Math.floor(safeNumber(snapshot.castSequence, 0)));
    if (partyManager) this.ensureParty(partyManager);
  }

  #resolveTarget(ability, world, options) {
    if (["self", "party", "selfArea"].includes(ability.target)) return { ok: true, member: world.partyManager.getMember(options.memberId || world.activeMemberId) };
    if (["ally", "deadAlly"].includes(ability.target)) {
      const candidates = world.party.filter((member) => ability.target === "deadAlly"
        ? member.condition === "dead" || member.condition === "unconscious"
        : member.condition !== "dead");
      const requested = candidates.find((member) => member.id === options.targetMemberId);
      const target = requested || (ability.target === "ally"
        ? [...candidates].sort((a, b) => (a.hp / Math.max(1, a.maxHp)) - (b.hp / Math.max(1, b.maxHp)))[0]
        : candidates[0]);
      if (!target) return { ok: false, reason: ability.target === "deadAlly" ? "Nikdo nepotřebuje navrátit dech." : "Není dostupný platný spojenec." };
      return { ok: true, member: target };
    }
    const target = world.combat.getTarget(world, ability.range || 9, Math.PI * 0.24);
    if (!target) return { ok: false, reason: "V dosahu a zaměřovači není platný nepřítel." };
    return { ok: true, enemy: target };
  }

  #applyEffect(effect, context) {
    const { ability, caster, skillRank, power, healingPower, world, targetContext, result } = context;
    const rawDamage = () => Math.max(1, Math.round((effect.flat || 0) + power * (effect.power || 0) + skillRank * 1.8));
    const rawHealing = () => Math.max(1, Math.round((effect.flat || 0) + healingPower * (effect.power || 0) + skillRank * 1.6));

    if (effect.type === "damage" && targetContext.enemy) {
      const critical = this.#isCritical(caster, context.derived, effect.criticalBonus || 0);
      const damage = world.combat.damageEnemy(targetContext.enemy, rawDamage(), effect.damageType, critical, world, caster.name);
      result.affected.push({ entityId: targetContext.enemy.id, damage });
      return;
    }

    if (effect.type === "projectileDamage" && targetContext.enemy) {
      const critical = this.#isCritical(caster, context.derived, effect.criticalBonus || 0);
      world.combat.launchPartyProjectile({
        world,
        sourceName: caster.name,
        casterId: caster.id,
        target: targetContext.enemy,
        kind: effect.projectileKind || "spellArcane",
        speed: effect.speed || 6,
        range: ability.range || 9,
        damage: rawDamage(),
        damageType: effect.damageType,
        critical,
        statuses: ability.effects.filter((entry) => entry.type === "enemyStatus").map((entry) => ({ ...entry })),
      });
      result.projectile = true;
      result.affected.push({ entityId: targetContext.enemy.id, pending: true });
      return;
    }

    if (effect.type === "areaDamage") {
      const center = ability.target === "selfArea" ? world.player : targetContext.enemy;
      if (!center) return;
      const enemies = world.combat.getEnemiesInRadius(world, center.x, center.y, ability.radius || 3, effect.maxTargets || 99);
      for (const enemy of enemies) {
        const damage = world.combat.damageEnemy(enemy, rawDamage(), effect.damageType, false, world, caster.name);
        result.affected.push({ entityId: enemy.id, damage });
      }
      return;
    }

    if (effect.type === "chainDamage" && targetContext.enemy) {
      const chain = [targetContext.enemy];
      while (chain.length < (effect.maxTargets || 3)) {
        const origin = chain.at(-1);
        const next = world.combat.getEnemiesInRadius(world, origin.x, origin.y, ability.radius || 4, 99)
          .filter((enemy) => !chain.some((entry) => entry.id === enemy.id))
          .sort((a, b) => Math.hypot(a.x - origin.x, a.y - origin.y) - Math.hypot(b.x - origin.x, b.y - origin.y))[0];
        if (!next) break;
        chain.push(next);
      }
      chain.forEach((enemy, index) => {
        const damage = world.combat.damageEnemy(enemy, Math.max(1, Math.round(rawDamage() * ((effect.falloff || 0.8) ** index))), effect.damageType, false, world, caster.name);
        this.applyEnemyStatus(enemy.id, "shocked", 7, 1, caster.id, ability.name);
        world.combat.effects.push({ type: "lightning", x: enemy.x, y: enemy.y, value: index + 1, ttl: 0.65 });
        result.affected.push({ entityId: enemy.id, damage });
      });
      return;
    }

    if (effect.type === "enemyStatus" && targetContext.enemy && !result.projectile) {
      this.applyEnemyStatus(targetContext.enemy.id, effect.statusId, effect.duration || STATUS_EFFECTS[effect.statusId]?.duration || 5, effect.potency || 1, caster.id, ability.name);
      result.affected.push({ entityId: targetContext.enemy.id, statusId: effect.statusId });
      return;
    }

    if (effect.type === "areaEnemyStatus") {
      const center = ability.target === "selfArea" ? world.player : targetContext.enemy;
      if (!center) return;
      for (const enemy of world.combat.getEnemiesInRadius(world, center.x, center.y, ability.radius || 3, 99)) {
        this.applyEnemyStatus(enemy.id, effect.statusId, effect.duration || 5, effect.potency || 1, caster.id, ability.name);
      }
      return;
    }

    if (effect.type === "heal" && targetContext.member) {
      const healed = this.#healMember(world, targetContext.member.id, rawHealing(), caster.name);
      result.affected.push({ memberId: targetContext.member.id, healing: healed });
      return;
    }

    if (effect.type === "revive" && targetContext.member) {
      const amount = Math.max(1, Math.round((effect.flat || 0) + targetContext.member.maxHp * (effect.power || 0.35)));
      const revived = world.partyManager.revive(targetContext.member.id, amount, true);
      if (revived > 0) world.notifications.push({ type: "magic", message: `${targetContext.member.name} znovu nabral dech s ${revived} životy.`, screenEffect: "flash", effectStrength: .72 });
      result.affected.push({ memberId: targetContext.member.id, revived });
      return;
    }

    if (effect.type === "memberStatus" && targetContext.member) {
      this.applyPartyStatus(targetContext.member.id, effect.statusId, effect.duration || 8, effect.potency || 1, caster.id, ability.name);
      result.affected.push({ memberId: targetContext.member.id, statusId: effect.statusId });
      return;
    }

    if (effect.type === "partyStatus") {
      for (const member of world.party.filter((entry) => entry.condition !== "dead")) {
        this.applyPartyStatus(member.id, effect.statusId, effect.duration || 8, effect.potency || 1, caster.id, ability.name);
        result.affected.push({ memberId: member.id, statusId: effect.statusId });
      }
      return;
    }

    if (effect.type === "cleanse" && targetContext.member) {
      const removed = this.cleanseMember(targetContext.member.id);
      world.notifications.push({ type: "magic", message: `${targetContext.member.name}: odstraněno ${removed} negativních efektů.` });
      result.affected.push({ memberId: targetContext.member.id, cleansed: removed });
    }
  }

  #healMember(world, memberId, amount, sourceName) {
    const member = world.partyManager.getMember(memberId);
    if (!member || member.condition === "dead") return 0;
    const before = member.hp;
    if (member.condition === "unconscious") world.partyManager.revive(member.id, Math.max(1, Math.round(amount * 0.4)));
    else world.partyManager.heal(member.id, amount);
    const healed = Math.max(0, member.hp - before);
    if (healed > 0) world.notifications.push({ type: "magic", message: `${sourceName} obnovil ${member.name} ${healed} životů.`, screenEffect: "heal", effectStrength: Math.min(.8, .25 + healed / 80) });
    return healed;
  }

  #isCritical(caster, derived, bonus) {
    const seed = (this.castSequence * 1103515245 + caster.level * 997 + caster.id.length * 31) >>> 0;
    return (seed % 10000) / 100 < clamp(derived.criticalChance + bonus, 0, 75);
  }

  #upsertStatus(list, status) {
    const existing = list.find((entry) => entry.id === status.id);
    if (existing) {
      existing.remaining = Math.max(existing.remaining, status.remaining);
      existing.duration = Math.max(existing.duration, status.duration);
      existing.potency = Math.max(existing.potency, status.potency);
      existing.sourceId = status.sourceId;
      existing.sourceName = status.sourceName;
      existing.tickTimer = STATUS_EFFECTS[status.id]?.tickInterval || existing.tickTimer;
    } else {
      list.push(cloneStatus(status));
    }
  }

  #updateStatusList(list, dt, onTick) {
    const survivors = [];
    for (const status of list) {
      const definition = STATUS_EFFECTS[status.id];
      if (!definition) continue;
      status.remaining -= dt;
      const interval = definition.tickInterval || 0;
      if (interval > 0) {
        status.tickTimer -= dt;
        while (status.tickTimer <= 0 && status.remaining > 0) {
          onTick(status, definition);
          status.tickTimer += interval;
        }
      }
      if (status.remaining > 0) survivors.push(status);
    }
    return survivors;
  }

  #normalizeStatusMap(rawMap) {
    if (!rawMap || typeof rawMap !== "object") return {};
    return Object.fromEntries(Object.entries(rawMap).map(([targetId, statuses]) => [targetId, Array.isArray(statuses)
      ? statuses.filter((status) => STATUS_EFFECTS[status?.id]).map(cloneStatus)
      : []]));
  }
}
