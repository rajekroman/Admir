export const STATUS_EFFECTS = Object.freeze({
  burning: { id: "burning", name: "Hoření", icon: "🔥", category: "negative", duration: 5, tickInterval: 1, damageType: "fire", color: "#db6b36" },
  chilled: { id: "chilled", name: "Zpomalení", icon: "❄", category: "negative", duration: 6, speedMultiplier: 0.58, color: "#73b9d7" },
  stunned: { id: "stunned", name: "Omráčení", icon: "✦", category: "negative", duration: 1.5, speedMultiplier: 0, attackMultiplier: 0, color: "#e5d18a" },
  shocked: { id: "shocked", name: "Vodivost", icon: "ϟ", category: "negative", duration: 7, shockTakenMultiplier: 1.28, color: "#b99ae8" },
  warded: { id: "warded", name: "Ochranná záře", icon: "◇", category: "positive", duration: 10, defenseBonus: 18, resistanceBonus: 12, color: "#d9c66d" },
  courage: { id: "courage", name: "Odvaha", icon: "⚑", category: "positive", duration: 12, attackBonus: 14, criticalBonus: 4, color: "#d7a64f" },
  guardianStance: { id: "guardianStance", name: "Strážný postoj", icon: "⬟", category: "positive", duration: 8, defenseBonus: 30, damageTakenMultiplier: 0.82, color: "#9cabb6" },
  haste: { id: "haste", name: "Zrychlení", icon: "➳", category: "positive", duration: 10, recoveryMultiplier: 0.72, initiativeBonus: 18, color: "#8fcac1" },
  regeneration: { id: "regeneration", name: "Obnova", icon: "✚", category: "positive", duration: 8, tickInterval: 2, healing: 5, color: "#83bf75" },
  poisoned: { id: "poisoned", name: "Otrava", icon: "☠", category: "negative", duration: 7, tickInterval: 1, damageType: "poison", color: "#7fa64b" },
  exposed: { id: "exposed", name: "Odhalená obrana", icon: "▽", category: "negative", duration: 6, damageTakenMultiplier: 1.24, defenseBonus: -12, color: "#c77a55" },
  silenced: { id: "silenced", name: "Umlčení", icon: "∅", category: "negative", duration: 4.5, blocksMagic: true, color: "#8f7ab5" },
  shaken: { id: "shaken", name: "Otřesení", icon: "≈", category: "negative", duration: 5, attackBonus: -8, initiativeBonus: -14, recoveryMultiplier: 1.2, color: "#8d8b9e" },
});

export const ABILITIES = Object.freeze({
  powerStrike: {
    id: "powerStrike", name: "Drtivý úder", icon: "⚔", classId: "knight", kind: "ability", school: "boj",
    target: "enemy", range: 1.85, cooldown: 4, manaCost: 0, unlockLevel: 1, requiredSkill: { id: "blade", rank: 2 },
    description: "Silný úder zblízka s vysokým fyzickým poškozením.",
    effects: [{ type: "damage", damageType: "physical", power: 1.35, flat: 7 }],
  },
  shieldBash: {
    id: "shieldBash", name: "Úder štítem", icon: "⬢", classId: "knight", kind: "ability", school: "boj",
    target: "enemy", range: 1.72, cooldown: 7, manaCost: 0, unlockLevel: 2, requiredSkill: { id: "armor", rank: 2 },
    description: "Zasáhne nepřítele a krátce jej omráčí.",
    effects: [{ type: "damage", damageType: "physical", power: 0.58, flat: 4 }, { type: "enemyStatus", statusId: "stunned", duration: 1.6, potency: 1 }],
  },
  rally: {
    id: "rally", name: "Bojový pokřik", icon: "⚑", classId: "knight", kind: "ability", school: "velení",
    target: "party", cooldown: 15, manaCost: 0, unlockLevel: 3, requiredSkill: { id: "leadership", rank: 1 },
    description: "Dočasně zvýší útok a kritickou šanci celé družiny.",
    effects: [{ type: "partyStatus", statusId: "courage", duration: 12, potency: 1 }],
  },
  guardianStance: {
    id: "guardianStance", name: "Strážný postoj", icon: "⬟", classId: "knight", kind: "ability", school: "obrana",
    target: "self", cooldown: 13, manaCost: 0, unlockLevel: 3, requiredSkill: { id: "armor", rank: 3 },
    description: "Výrazně zvyšuje obranu rytíře a snižuje utržené poškození.",
    effects: [{ type: "memberStatus", statusId: "guardianStance", duration: 8, potency: 1 }],
  },

  aimedShot: {
    id: "aimedShot", name: "Mířená střela", icon: "➶", classId: "ranger", kind: "ability", school: "střelba",
    target: "enemy", range: 9.5, cooldown: 3.5, manaCost: 0, unlockLevel: 1, requiredSkill: { id: "bow", rank: 2 },
    description: "Přesná střela s vyšší šancí na kritický zásah.",
    effects: [{ type: "projectileDamage", projectileKind: "abilityArrow", speed: 9.2, damageType: "physical", power: 1.05, flat: 5, criticalBonus: 18 }],
  },
  pinningShot: {
    id: "pinningShot", name: "Spoutávací střela", icon: "⇥", classId: "ranger", kind: "ability", school: "střelba",
    target: "enemy", range: 9, cooldown: 6, manaCost: 0, unlockLevel: 2, requiredSkill: { id: "bow", rank: 3 },
    description: "Zraní cíl a výrazně jej zpomalí.",
    effects: [{ type: "projectileDamage", projectileKind: "abilityArrow", speed: 8.4, damageType: "physical", power: 0.78, flat: 4 }, { type: "enemyStatus", statusId: "chilled", duration: 7, potency: 1 }],
  },
  volley: {
    id: "volley", name: "Salva", icon: "≋", classId: "ranger", kind: "ability", school: "střelba",
    target: "enemyArea", range: 8.5, radius: 2.7, cooldown: 10, manaCost: 0, unlockLevel: 3, requiredSkill: { id: "bow", rank: 3 },
    description: "Zasáhne cílového nepřítele a všechny protivníky v jeho okolí.",
    effects: [{ type: "areaDamage", damageType: "physical", power: 0.72, flat: 4, maxTargets: 6 }],
  },
  fieldDressing: {
    id: "fieldDressing", name: "Polní ošetření", icon: "✚", classId: "ranger", kind: "ability", school: "přežití",
    target: "ally", cooldown: 12, manaCost: 0, unlockLevel: 3, requiredSkill: { id: "survival", rank: 2 },
    description: "Ošetří živého člena družiny a přidá krátkou regeneraci.",
    effects: [{ type: "heal", power: 0.65, flat: 8 }, { type: "memberStatus", statusId: "regeneration", duration: 8, potency: 1 }],
  },

  emberBolt: {
    id: "emberBolt", name: "Žhavý šíp", icon: "◆", classId: "mage", kind: "spell", school: "oheň",
    target: "enemy", range: 9.5, cooldown: 1.7, manaCost: 5, unlockLevel: 1, requiredSkill: { id: "elemental", rank: 1 },
    description: "Rychlý ohnivý projektil, který může cíl zapálit.",
    effects: [{ type: "projectileDamage", projectileKind: "spellFire", speed: 6.8, damageType: "fire", power: 0.82, flat: 6 }, { type: "enemyStatus", statusId: "burning", duration: 5, potency: 4 }],
  },
  frostShard: {
    id: "frostShard", name: "Ledový střep", icon: "❄", classId: "mage", kind: "spell", school: "mráz",
    target: "enemy", range: 8.8, cooldown: 3.2, manaCost: 7, unlockLevel: 1, requiredSkill: { id: "elemental", rank: 2 },
    description: "Ledový projektil způsobí zranění a zpomalí nepřítele.",
    effects: [{ type: "projectileDamage", projectileKind: "spellFrost", speed: 5.8, damageType: "frost", power: 0.92, flat: 5 }, { type: "enemyStatus", statusId: "chilled", duration: 6, potency: 1 }],
  },
  chainLightning: {
    id: "chainLightning", name: "Řetězový blesk", icon: "ϟ", classId: "mage", kind: "spell", school: "blesk",
    target: "enemy", range: 8.5, radius: 3.8, cooldown: 7.5, manaCost: 11, unlockLevel: 2, requiredSkill: { id: "elemental", rank: 3 },
    description: "Blesk přeskočí až na tři blízké protivníky.",
    effects: [{ type: "chainDamage", damageType: "shock", power: 0.88, flat: 8, maxTargets: 3, falloff: 0.78 }, { type: "enemyStatus", statusId: "shocked", duration: 7, potency: 1 }],
  },
  fireNova: {
    id: "fireNova", name: "Ohnivá nova", icon: "☀", classId: "mage", kind: "spell", school: "oheň",
    target: "selfArea", radius: 4.25, cooldown: 11, manaCost: 16, unlockLevel: 3, requiredSkill: { id: "elemental", rank: 3 },
    description: "Výbuch ohně zasáhne všechny protivníky kolem družiny.",
    effects: [{ type: "areaDamage", damageType: "fire", power: 0.95, flat: 10, maxTargets: 12 }, { type: "areaEnemyStatus", statusId: "burning", duration: 5, potency: 3 }],
  },

  mend: {
    id: "mend", name: "Obnovující dotek", icon: "✚", classId: "cleric", kind: "spell", school: "obnova",
    target: "ally", cooldown: 2.2, manaCost: 5, unlockLevel: 1, requiredSkill: { id: "restoration", rank: 1 },
    description: "Obnoví život vybranému živému členovi družiny.",
    effects: [{ type: "heal", power: 0.95, flat: 10 }],
  },
  guardianWard: {
    id: "guardianWard", name: "Strážná záře", icon: "◇", classId: "cleric", kind: "spell", school: "světlo",
    target: "party", cooldown: 12, manaCost: 10, unlockLevel: 1, requiredSkill: { id: "light", rank: 2 },
    description: "Zvýší obranu a elementární odolnosti celé družiny.",
    effects: [{ type: "partyStatus", statusId: "warded", duration: 10, potency: 1 }],
  },
  cleanse: {
    id: "cleanse", name: "Očištění", icon: "✧", classId: "cleric", kind: "spell", school: "světlo",
    target: "ally", cooldown: 6, manaCost: 7, unlockLevel: 2, requiredSkill: { id: "restoration", rank: 3 },
    description: "Odstraní všechny negativní stavové efekty z vybraného člena.",
    effects: [{ type: "cleanse" }, { type: "heal", power: 0.28, flat: 3 }],
  },
  resurrection: {
    id: "resurrection", name: "Navrácení dechu", icon: "☥", classId: "cleric", kind: "spell", school: "světlo",
    target: "deadAlly", cooldown: 35, manaCost: 22, unlockLevel: 3, requiredSkill: { id: "restoration", rank: 3 },
    description: "Navrátí mrtvého nebo bezvědomého člena družiny s částí života.",
    effects: [{ type: "revive", power: 0.46, flat: 8 }],
  },
});

export const CLASS_HOTBARS = Object.freeze({
  knight: ["powerStrike", "shieldBash", "rally", "guardianStance"],
  ranger: ["aimedShot", "pinningShot", "volley", "fieldDressing"],
  mage: ["emberBolt", "frostShard", "chainLightning", "fireNova"],
  cleric: ["mend", "guardianWard", "cleanse", "resurrection"],
});

export function getAbility(abilityId) {
  return ABILITIES[abilityId] || null;
}

export function getClassAbilities(classId) {
  return Object.values(ABILITIES).filter((ability) => ability.classId === classId);
}

export function isAbilityUnlocked(member, ability) {
  if (!member || !ability || member.classId !== ability.classId) return false;
  if (member.level < (ability.unlockLevel || 1)) return false;
  const requirement = ability.requiredSkill;
  if (requirement && (member.skills?.[requirement.id] || 0) < requirement.rank) return false;
  return true;
}
