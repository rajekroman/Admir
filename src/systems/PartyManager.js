import { ATTRIBUTES, CLASSES } from "../data/classes.js";
import { PARTY_SEEDS } from "../data/party.js";
import { getMastery, getSkillTrainingCost, SKILLS } from "../data/skills.js";
import { clamp } from "../utils/math.js";

const CONDITION_PRIORITY = Object.freeze({ healthy: 0, wounded: 1, unconscious: 2, dead: 3 });

export function experienceForLevel(level) {
  const normalized = Math.max(1, Math.floor(level));
  if (normalized <= 1) return 0;
  return Math.floor(100 * ((normalized - 1) ** 1.65));
}

function createMember(seed) {
  const classDefinition = CLASSES[seed.classId];
  const member = {
    id: seed.id,
    name: seed.name,
    classId: seed.classId,
    className: classDefinition.name,
    initials: seed.initials,
    biography: seed.biography,
    level: 1,
    experience: 0,
    attributePoints: 0,
    skillPoints: 0,
    attributes: structuredClone(seed.attributes),
    skills: Object.fromEntries(Object.keys(classDefinition.skillCaps).map((skillId) => [skillId, seed.skills[skillId] || 0])),
    resistances: structuredClone(seed.resistances),
    hp: 1,
    maxHp: 1,
    mp: 0,
    maxMp: 0,
    condition: "healthy",
    equipmentBonuses: { attack: 0, defense: 0, initiative: 0, spellPower: 0, healingPower: 0, criticalChance: 0, maxHp: 0, maxMp: 0, resistances: { fire: 0, frost: 0, shock: 0, poison: 0, mind: 0, spirit: 0 } },
  };
  recalculate(member, true);
  return member;
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeMember(raw, seed) {
  const base = createMember(seed);
  if (!raw || typeof raw !== "object") return base;

  base.name = typeof raw.name === "string" ? raw.name : base.name;
  base.level = clamp(Math.floor(safeNumber(raw.level, 1)), 1, 50);
  base.experience = Math.max(0, Math.floor(safeNumber(raw.experience, experienceForLevel(base.level))));
  base.attributePoints = Math.max(0, Math.floor(safeNumber(raw.attributePoints, 0)));
  base.skillPoints = Math.max(0, Math.floor(safeNumber(raw.skillPoints, 0)));
  base.condition = CONDITION_PRIORITY[raw.condition] !== undefined ? raw.condition : "healthy";

  for (const attributeId of Object.keys(ATTRIBUTES)) {
    base.attributes[attributeId] = clamp(Math.floor(safeNumber(raw.attributes?.[attributeId], base.attributes[attributeId])), 1, 40);
  }

  const classDefinition = CLASSES[base.classId];
  for (const [skillId, cap] of Object.entries(classDefinition.skillCaps)) {
    base.skills[skillId] = clamp(Math.floor(safeNumber(raw.skills?.[skillId], base.skills[skillId] || 0)), 0, cap);
  }

  for (const resistanceId of Object.keys(base.resistances)) {
    base.resistances[resistanceId] = clamp(Math.floor(safeNumber(raw.resistances?.[resistanceId], base.resistances[resistanceId])), 0, 100);
  }

  recalculate(base, true);
  base.hp = clamp(Math.floor(safeNumber(raw.hp, base.maxHp)), 0, base.maxHp);
  base.mp = clamp(Math.floor(safeNumber(raw.mp, base.maxMp)), 0, base.maxMp);
  updateCondition(base);
  return base;
}

function recalculate(member, restoreResources = false) {
  const classDefinition = CLASSES[member.classId];
  const previousMaxHp = member.maxHp || 1;
  const previousMaxMp = member.maxMp || 0;
  const hpRatio = previousMaxHp > 0 ? member.hp / previousMaxHp : 1;
  const mpRatio = previousMaxMp > 0 ? member.mp / previousMaxMp : 1;
  const { endurance, intellect, spirit } = member.attributes;

  member.maxHp = Math.max(1, Math.round(
    classDefinition.hpBase
      + endurance * classDefinition.hpPerEndurance
      + (member.level - 1) * classDefinition.hpPerLevel
      + (member.skills.athletics || 0) * 3
      + (member.equipmentBonuses?.maxHp || 0),
  ));
  member.maxMp = Math.max(0, Math.round(
    classDefinition.mpBase
      + intellect * classDefinition.mpPerIntellect
      + spirit * classDefinition.mpPerSpirit
      + (member.level - 1) * classDefinition.mpPerLevel
      + (member.skills.arcana || 0) * 3
      + (member.equipmentBonuses?.maxMp || 0),
  ));

  if (restoreResources) {
    member.hp = member.maxHp;
    member.mp = member.maxMp;
  } else {
    member.hp = clamp(Math.round(member.maxHp * hpRatio), 0, member.maxHp);
    member.mp = clamp(Math.round(member.maxMp * mpRatio), 0, member.maxMp);
  }
  updateCondition(member);
}

function updateCondition(member) {
  if (member.condition === "dead") {
    member.hp = 0;
    return;
  }
  if (member.hp <= -member.maxHp) {
    member.condition = "dead";
    member.hp = 0;
  } else if (member.hp <= 0) {
    member.condition = "unconscious";
    member.hp = 0;
  } else if (member.hp < member.maxHp * 0.35) {
    member.condition = "wounded";
  } else {
    member.condition = "healthy";
  }
}

export class PartyManager {
  constructor(snapshot = null) {
    this.members = PARTY_SEEDS.map((seed) => createMember(seed));
    this.activeMemberId = this.members[0].id;
    if (snapshot) this.restore(snapshot);
  }

  get activeMember() {
    return this.getMember(this.activeMemberId) || this.members[0];
  }

  getMember(memberId) {
    return this.members.find((member) => member.id === memberId) || null;
  }

  selectMember(memberId) {
    if (!this.getMember(memberId)) return false;
    this.activeMemberId = memberId;
    return true;
  }

  getDerivedStats(memberId) {
    const member = this.getMember(memberId);
    if (!member) return null;
    const a = member.attributes;
    const weaponRank = Math.max(member.skills.blade || 0, member.skills.bow || 0, member.skills.mace || 0, member.skills.staff || 0);
    const armorRank = member.skills.armor || 0;
    const arcanaRank = member.skills.arcana || 0;
    const restorationRank = member.skills.restoration || 0;
    const leadershipRank = member.skills.leadership || 0;

    const equipment = member.equipmentBonuses || {};
    return {
      attack: Math.round(a.might * 0.85 + a.accuracy * 0.45 + weaponRank * 3 + member.level * 2 + (equipment.attack || 0)),
      defense: Math.round(a.endurance * 0.6 + a.speed * 0.55 + armorRank * 3 + member.level + (equipment.defense || 0)),
      initiative: Math.round(a.speed * 1.2 + a.accuracy * 0.35 + member.level + (equipment.initiative || 0)),
      spellPower: Math.round(a.intellect * 1.05 + a.spirit * 0.35 + arcanaRank * 4 + member.level + (equipment.spellPower || 0)),
      healingPower: Math.round(a.spirit * 1.15 + restorationRank * 4 + member.level + (equipment.healingPower || 0)),
      criticalChance: clamp(Math.round(2 + a.luck * 0.35 + a.accuracy * 0.15 + (equipment.criticalChance || 0)), 2, 50),
      leadership: Math.round(a.luck * 0.25 + a.spirit * 0.2 + leadershipRank * 5),
    };
  }

  getMemberView(memberId) {
    const member = this.getMember(memberId);
    if (!member) return null;
    const classDefinition = CLASSES[member.classId];
    const nextLevel = experienceForLevel(member.level + 1);
    const currentLevelStart = experienceForLevel(member.level);
    const xpSpan = Math.max(1, nextLevel - currentLevelStart);
    const xpProgress = clamp((member.experience - currentLevelStart) / xpSpan, 0, 1);
    const skillViews = Object.keys(classDefinition.skillCaps)
      .map((skillId) => {
        const rank = member.skills[skillId] || 0;
        const cap = classDefinition.skillCaps[skillId];
        return {
          ...SKILLS[skillId],
          rank,
          cap,
          mastery: getMastery(rank),
          trainingCost: rank < cap ? getSkillTrainingCost(rank) : null,
        };
      })
      .sort((a, b) => b.rank - a.rank || a.category.localeCompare(b.category, "cs") || a.name.localeCompare(b.name, "cs"));

    return {
      member: structuredClone(member),
      classDefinition,
      derived: this.getDerivedStats(member.id),
      adjustedResistances: Object.fromEntries(Object.entries(member.resistances).map(([id, value]) => [id, value + (member.equipmentBonuses?.resistances?.[id] || 0)])),
      nextLevel,
      currentLevelStart,
      xpProgress,
      skillViews,
    };
  }

  awardExperience(amount) {
    const xp = Math.max(0, Math.floor(safeNumber(amount, 0)));
    const notifications = [];
    if (!xp) return notifications;

    for (const member of this.members) {
      if (member.condition === "dead") continue;
      member.experience += xp;
      while (member.level < 50 && member.experience >= experienceForLevel(member.level + 1)) {
        const oldMaxHp = member.maxHp;
        const oldMaxMp = member.maxMp;
        member.level += 1;
        member.attributePoints += 3;
        member.skillPoints += 2;
        recalculate(member, false);
        member.hp = clamp(member.hp + (member.maxHp - oldMaxHp), 0, member.maxHp);
        member.mp = clamp(member.mp + (member.maxMp - oldMaxMp), 0, member.maxMp);
        notifications.push({
          type: "levelUp",
          memberId: member.id,
          message: `${member.name} postupuje na úroveň ${member.level}. +3 atributové a +2 dovednostní body.`,
        });
      }
    }
    return notifications;
  }

  spendAttributePoint(memberId, attributeId) {
    const member = this.getMember(memberId);
    if (!member || !ATTRIBUTES[attributeId]) return { ok: false, reason: "Neplatný atribut." };
    if (member.attributePoints < 1) return { ok: false, reason: "Postava nemá volné atributové body." };
    if (member.attributes[attributeId] >= 40) return { ok: false, reason: "Atribut dosáhl maxima 40." };

    member.attributePoints -= 1;
    member.attributes[attributeId] += 1;
    recalculate(member, false);
    return { ok: true, message: `${member.name}: ${ATTRIBUTES[attributeId].name} zvýšena na ${member.attributes[attributeId]}.` };
  }

  trainSkill(memberId, skillId) {
    const member = this.getMember(memberId);
    const classDefinition = member ? CLASSES[member.classId] : null;
    const cap = classDefinition?.skillCaps?.[skillId];
    if (!member || cap === undefined || !SKILLS[skillId]) return { ok: false, reason: "Tato postava se dovednost nemůže učit." };
    const current = member.skills[skillId] || 0;
    if (current >= cap) return { ok: false, reason: `Dovednost dosáhla třídního maxima ${cap}.` };
    const cost = getSkillTrainingCost(current);
    if (member.skillPoints < cost) return { ok: false, reason: `Výcvik vyžaduje ${cost} dovednostní body.` };

    member.skillPoints -= cost;
    member.skills[skillId] = current + 1;
    recalculate(member, false);
    return {
      ok: true,
      message: `${member.name}: ${SKILLS[skillId].name} zvýšena na ${member.skills[skillId]} (${getMastery(member.skills[skillId]).name}).`,
    };
  }

  syncEquipmentBonuses(memberId, bonuses = {}) {
    const member = this.getMember(memberId);
    if (!member) return false;
    member.equipmentBonuses = {
      attack: Number(bonuses.attack) || 0,
      defense: Number(bonuses.defense) || 0,
      initiative: Number(bonuses.initiative) || 0,
      spellPower: Number(bonuses.spellPower) || 0,
      healingPower: Number(bonuses.healingPower) || 0,
      criticalChance: Number(bonuses.criticalChance) || 0,
      maxHp: Number(bonuses.maxHp) || 0,
      maxMp: Number(bonuses.maxMp) || 0,
      resistances: { fire: 0, frost: 0, shock: 0, poison: 0, mind: 0, spirit: 0, ...(bonuses.resistances || {}) },
    };
    recalculate(member, false);
    return true;
  }

  getBestSkill(skillId) {
    return Math.max(0, ...this.members.map((member) => member.skills?.[skillId] || 0));
  }

  restoreMana(memberId, amount) {
    const member = this.getMember(memberId);
    if (!member || member.condition === "dead") return 0;
    const before = member.mp;
    member.mp = clamp(member.mp + Math.max(0, Math.floor(safeNumber(amount, 0))), 0, member.maxMp);
    return member.mp - before;
  }

  revive(memberId, amount, allowDead = false) {
    const member = this.getMember(memberId);
    if (!member || (member.condition === "dead" && !allowDead)) return 0;
    if (member.condition !== "unconscious" && member.condition !== "dead" && member.hp > 0) return 0;
    member.condition = "healthy";
    member.hp = clamp(Math.max(1, Math.floor(safeNumber(amount, 1))), 1, member.maxHp);
    return member.hp;
  }

  applyDamage(memberId, amount) {
    const member = this.getMember(memberId);
    if (!member || member.condition === "dead") return false;
    const damage = Math.max(0, Math.floor(safeNumber(amount, 0)));
    const remaining = member.hp - damage;
    if (remaining <= -member.maxHp) {
      member.hp = 0;
      member.condition = "dead";
    } else {
      member.hp = Math.max(0, remaining);
      updateCondition(member);
    }
    return true;
  }

  heal(memberId, amount) {
    const member = this.getMember(memberId);
    if (!member || member.condition === "dead") return false;
    member.hp = clamp(member.hp + Math.max(0, Math.floor(safeNumber(amount, 0))), 0, member.maxHp);
    updateCondition(member);
    return true;
  }

  rest() {
    for (const member of this.members) {
      if (member.condition === "dead") continue;
      member.hp = member.maxHp;
      member.mp = member.maxMp;
      member.condition = "healthy";
    }
  }

  snapshot() {
    return {
      members: structuredClone(this.members),
      activeMemberId: this.activeMemberId,
    };
  }

  restore(snapshot) {
    const rawMembers = Array.isArray(snapshot) ? snapshot : snapshot?.members;
    this.members = PARTY_SEEDS.map((seed) => {
      const raw = Array.isArray(rawMembers) ? rawMembers.find((member) => member?.id === seed.id) : null;
      return normalizeMember(raw, seed);
    });
    this.activeMemberId = this.getMember(snapshot?.activeMemberId)?.id || this.members[0].id;
  }
}
