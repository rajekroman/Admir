import { CAMPAIGN_ITEMS } from "./campaignItems.js";
export const RARITIES = Object.freeze({
  common: { id: "common", name: "Běžný", sort: 0 },
  uncommon: { id: "uncommon", name: "Neobvyklý", sort: 1 },
  rare: { id: "rare", name: "Vzácný", sort: 2 },
  epic: { id: "epic", name: "Epický", sort: 3 },
  quest: { id: "quest", name: "Úkolový", sort: 4 },
});

export const EQUIPMENT_SLOTS = Object.freeze({
  mainHand: { id: "mainHand", name: "Hlavní ruka" },
  offHand: { id: "offHand", name: "Vedlejší ruka" },
  armor: { id: "armor", name: "Zbroj" },
  helmet: { id: "helmet", name: "Přilba" },
  boots: { id: "boots", name: "Boty" },
  ring: { id: "ring", name: "Prsten" },
  amulet: { id: "amulet", name: "Amulet" },
});

const item = (definition) => Object.freeze({
  stackLimit: definition.slot ? 8 : 1,
  value: 0,
  weight: 0,
  rarity: "common",
  icon: "◇",
  modifiers: {},
  ...definition,
});

const BASE_ITEMS = {
  "iron-longsword": item({
    id: "iron-longsword", name: "Železný dlouhý meč", category: "weapon", slot: "mainHand", icon: "⚔",
    value: 82, weight: 3.4, skill: "blade", allowedClasses: ["knight", "ranger"],
    description: "Spolehlivá vojenská čepel s opravenou záštitou. Není krásná, ale drží ostří.",
    modifiers: { attack: 9, criticalChance: 1 },
  }),
  "silver-watch-blade": item({
    id: "silver-watch-blade", name: "Čepel Stříbrné hlídky", category: "weapon", slot: "mainHand", icon: "⚔",
    value: 310, weight: 3.1, rarity: "rare", skill: "blade", allowedClasses: ["knight", "ranger"], minSkill: 3,
    description: "Meč kalený stříbrným prachem. V blízkosti mezníků slabě vibruje.",
    modifiers: { attack: 17, criticalChance: 3, spiritResistance: 5 },
  }),
  "ashwood-bow": item({
    id: "ashwood-bow", name: "Jasanový luk", category: "weapon", slot: "mainHand", icon: "➶",
    value: 76, weight: 1.8, skill: "bow", twoHanded: true, allowedClasses: ["ranger"],
    description: "Lehký luk pro rychlou střelbu v hustém lese.",
    modifiers: { attack: 8, initiative: 3, criticalChance: 2 },
  }),
  "echo-string-bow": item({
    id: "echo-string-bow", name: "Luk se strunou ozvěny", category: "weapon", slot: "mainHand", icon: "➶",
    value: 345, weight: 1.6, rarity: "rare", skill: "bow", twoHanded: true, allowedClasses: ["ranger"], minSkill: 3,
    description: "Jeho struna po výstřelu nezazní nahlas. Tón se ozve až v cíli.",
    modifiers: { attack: 16, initiative: 6, criticalChance: 4 },
  }),
  "apprentice-staff": item({
    id: "apprentice-staff", name: "Hůl archiváře", category: "weapon", slot: "mainHand", icon: "ϟ",
    value: 70, weight: 2.1, skill: "staff", twoHanded: true, allowedClasses: ["mage"],
    description: "Hůl s měděnými kroužky pro přesné vedení magického proudu.",
    modifiers: { attack: 3, spellPower: 9, initiative: 1 },
  }),
  "resonance-staff": item({
    id: "resonance-staff", name: "Rezonanční hůl", category: "weapon", slot: "mainHand", icon: "ϟ",
    value: 370, weight: 2.4, rarity: "rare", skill: "staff", twoHanded: true, allowedClasses: ["mage"], minSkill: 2,
    description: "Krystal na jejím vrcholu odpovídá na kouzla druhým, tišším pulzem.",
    modifiers: { attack: 5, spellPower: 19, initiative: 2 },
  }),
  "silver-mace": item({
    id: "silver-mace", name: "Stříbřený palcát", category: "weapon", slot: "mainHand", icon: "✣",
    value: 88, weight: 3.0, skill: "mace", allowedClasses: ["cleric", "knight"],
    description: "Chrámová zbraň s hlavicí ve tvaru zavřeného zvonu.",
    modifiers: { attack: 8, healingPower: 3 },
  }),
  "silent-bell-mace": item({
    id: "silent-bell-mace", name: "Palcát Tichého zvonu", category: "weapon", slot: "mainHand", icon: "✣",
    value: 360, weight: 2.8, rarity: "rare", skill: "mace", allowedClasses: ["cleric"], minSkill: 2,
    description: "Úder nevydá zvuk, přesto se protivníkovi zachvějí kosti.",
    modifiers: { attack: 14, healingPower: 12, spiritResistance: 8 },
  }),
  "oak-buckler": item({
    id: "oak-buckler", name: "Dubový puklíř", category: "shield", slot: "offHand", icon: "◉",
    value: 54, weight: 2.2, allowedClasses: ["knight", "cleric", "ranger"],
    description: "Malý kruhový štít pobitý železem.", modifiers: { defense: 7 },
  }),
  "watch-shield": item({
    id: "watch-shield", name: "Štít severní hlídky", category: "shield", slot: "offHand", icon: "◉",
    value: 250, weight: 3.0, rarity: "uncommon", allowedClasses: ["knight", "cleric"],
    description: "Štít s vybledlým znakem brány. Jeho lem byl nedávno znovu postříbřen.",
    modifiers: { defense: 13, maxHp: 8 },
  }),
  "chain-hauberk": item({
    id: "chain-hauberk", name: "Kroužková zbroj", category: "armor", slot: "armor", icon: "▦",
    value: 120, weight: 7.8, skill: "armor", allowedClasses: ["knight", "cleric"],
    description: "Těžší kroužková košile, která pamatuje několik oprav.", modifiers: { defense: 12, initiative: -2 },
  }),
  "rangers-leathers": item({
    id: "rangers-leathers", name: "Hraničářská koženice", category: "armor", slot: "armor", icon: "▤",
    value: 102, weight: 4.2, skill: "armor", allowedClasses: ["ranger", "knight"],
    description: "Vrstvená kůže chrání trup a nebrání tichému pohybu.", modifiers: { defense: 8, initiative: 3 },
  }),
  "archivist-robes": item({
    id: "archivist-robes", name: "Roucho archiváře", category: "armor", slot: "armor", icon: "⌁",
    value: 96, weight: 1.5, allowedClasses: ["mage"],
    description: "Tmavé roucho vyšité měděnou nití, která rozvádí přebytečnou magii.", modifiers: { defense: 3, spellPower: 6, maxMp: 10 },
  }),
  "bell-vestments": item({
    id: "bell-vestments", name: "Roucho Tichého zvonu", category: "armor", slot: "armor", icon: "⌁",
    value: 104, weight: 2.0, allowedClasses: ["cleric"],
    description: "Obřadní roucho se skrytými koženými výztuhami.", modifiers: { defense: 5, healingPower: 7, maxMp: 6 },
  }),
  "iron-cap": item({
    id: "iron-cap", name: "Železná kukla", category: "helmet", slot: "helmet", icon: "⌂",
    value: 45, weight: 1.6, allowedClasses: ["knight", "cleric", "ranger"],
    description: "Jednoduchá ochrana hlavy s koženou výstelkou.", modifiers: { defense: 4, maxHp: 3 },
  }),
  "seers-circlet": item({
    id: "seers-circlet", name: "Čelenka ozvěn", category: "helmet", slot: "helmet", icon: "⌒",
    value: 220, weight: 0.3, rarity: "uncommon", allowedClasses: ["mage", "cleric"],
    description: "Stříbrný kruh pomáhá odlišit vlastní myšlenku od cizího šepotu.", modifiers: { spellPower: 7, mindResistance: 8 },
  }),
  "trail-boots": item({
    id: "trail-boots", name: "Boty stezkaře", category: "boots", slot: "boots", icon: "∪",
    value: 62, weight: 1.2, allowedClasses: ["knight", "ranger", "mage", "cleric"],
    description: "Měkké vysoké boty se zesílenou podrážkou.", modifiers: { initiative: 4, defense: 1 },
  }),
  "ring-of-clear-thought": item({
    id: "ring-of-clear-thought", name: "Prsten jasné mysli", category: "accessory", slot: "ring", icon: "○",
    value: 285, weight: 0.1, rarity: "rare", allowedClasses: ["knight", "ranger", "mage", "cleric"],
    description: "Vnitřní strana nese větu: ‚První hlas je tvůj.‘", modifiers: { mindResistance: 12, criticalChance: 2 },
  }),
  "amulet-of-the-gate": item({
    id: "amulet-of-the-gate", name: "Amulet severní brány", category: "accessory", slot: "amulet", icon: "◇",
    value: 330, weight: 0.2, rarity: "rare", allowedClasses: ["knight", "ranger", "mage", "cleric"],
    description: "Malá stříbrná brána zavřená kolem tmavého kamene.", modifiers: { defense: 3, spiritResistance: 10, maxHp: 5 },
  }),

  "minor-healing-potion": item({
    id: "minor-healing-potion", name: "Malý léčivý lektvar", category: "consumable", icon: "♥",
    value: 28, weight: 0.35, stackLimit: 20, description: "Obnoví 35 životů zvolené postavě.",
    effects: [{ type: "heal", amount: 35 }],
  }),
  "greater-healing-potion": item({
    id: "greater-healing-potion", name: "Silný léčivý lektvar", category: "consumable", icon: "♥",
    value: 82, weight: 0.4, stackLimit: 10, rarity: "uncommon", description: "Obnoví 90 životů zvolené postavě.",
    effects: [{ type: "heal", amount: 90 }],
  }),
  "mana-tonic": item({
    id: "mana-tonic", name: "Tonikum many", category: "consumable", icon: "✦",
    value: 32, weight: 0.35, stackLimit: 20, description: "Obnoví 45 bodů many zvolené postavě.",
    effects: [{ type: "mana", amount: 45 }],
  }),
  "moonleaf-tonic": item({
    id: "moonleaf-tonic", name: "Tonikum z měsíčníku", category: "consumable", icon: "❧",
    value: 95, weight: 0.35, stackLimit: 10, rarity: "uncommon", description: "Obnoví 55 životů a odstraní bezvědomí.",
    effects: [{ type: "revive", amount: 55 }],
  }),
  "antidote": item({
    id: "antidote", name: "Protijed", category: "consumable", icon: "✚",
    value: 24, weight: 0.25, stackLimit: 20, description: "Neutralizuje otravu a stabilizuje zasaženou postavu.",
    effects: [{ type: "cleanse", condition: "poisoned" }],
  }),
  "travel-ration": item({
    id: "travel-ration", name: "Cestovní dávka", category: "consumable", icon: "▱",
    value: 9, weight: 0.6, stackLimit: 20, description: "Zásoba jídla pro bezpečný odpočinek družiny.",
    effects: [{ type: "ration" }],
  }),

  "moonleaf": item({
    id: "moonleaf", name: "Měsíčník", category: "material", icon: "❧", rarity: "uncommon",
    value: 7, weight: 0.1, stackLimit: 30, description: "Studená léčivá bylina s bílými žilkami.",
  }),
  "silver-dust": item({
    id: "silver-dust", name: "Stříbrný prach", category: "material", icon: "✧", rarity: "uncommon",
    value: 18, weight: 0.05, stackLimit: 50, description: "Jemný prach ze žil mezníků. Používá se při runovém kování.",
  }),
  "wolf-pelt": item({
    id: "wolf-pelt", name: "Vlčí kožešina", category: "material", icon: "≋",
    value: 14, weight: 1.1, stackLimit: 10, description: "Dobře zachovaná kožešina vhodná k prodeji nebo výrobě.",
  }),
  "old-silver-brooch": item({
    id: "old-silver-brooch", name: "Stará stříbrná brož", category: "treasure", icon: "✥", rarity: "uncommon",
    value: 75, weight: 0.15, stackLimit: 5, description: "Rodový šperk bez známého majitele. Kupec za něj nabídne slušnou cenu.",
  }),

  "silver-fragment": item({
    id: "silver-fragment", name: "Krystalický střep", category: "quest", icon: "◈", rarity: "quest",
    value: 0, weight: 0.4, stackLimit: 1, description: "Střep z rozbitého mezníku, uvnitř kterého se opakuje cizí tón.",
  }),
  "lost-satchel": item({
    id: "lost-satchel", name: "Tomarova brašna", category: "quest", icon: "▣", rarity: "quest",
    value: 0, weight: 1.0, stackLimit: 1, description: "Kožená brašna se třemi zapečetěnými dopisy.",
  }),
  "eliras-seal": item({
    id: "eliras-seal", name: "Eliřina pečeť", category: "quest", icon: "◆", rarity: "quest",
    value: 0, weight: 0.05, stackLimit: 1, description: "Pečeť, která otevře cestu ke Stříbrné bráně.",
  }),
  "crypt-warden-key": item({
    id: "crypt-warden-key", name: "Klíč správce krypty", category: "quest", icon: "⚿", rarity: "quest",
    value: 0, weight: 0.15, stackLimit: 1, description: "Těžký stříbrný klíč se znakem zavřeného oka. Odemkne vnitřní dveře Krypty ozvěn.",
  }),
  "mirror-silver": item({
    id: "mirror-silver", name: "Zrcadlové stříbro", category: "quest", icon: "◫", rarity: "quest",
    value: 0, weight: 0.6, stackLimit: 1, description: "Nehybná kapka kovu z oltáře první ozvěny. Odraz v ní předbíhá skutečnost.",
  }),
};

export const ITEMS = Object.freeze({ ...BASE_ITEMS, ...CAMPAIGN_ITEMS });

export const STARTER_LOADOUT = Object.freeze({
  daren: { mainHand: "iron-longsword", offHand: "oak-buckler", armor: "chain-hauberk", helmet: "iron-cap", boots: "trail-boots" },
  lyra: { mainHand: "ashwood-bow", armor: "rangers-leathers", boots: "trail-boots" },
  orin: { mainHand: "apprentice-staff", armor: "archivist-robes", helmet: "seers-circlet" },
  saela: { mainHand: "silver-mace", offHand: "oak-buckler", armor: "bell-vestments", boots: "trail-boots" },
});

export const STARTER_BACKPACK = Object.freeze({
  "minor-healing-potion": 4,
  "mana-tonic": 3,
  "travel-ration": 5,
  antidote: 2,
});

export function isEquipment(itemDefinition) {
  return Boolean(itemDefinition?.slot);
}

export function getItemName(itemId) {
  return ITEMS[itemId]?.name || itemId;
}
