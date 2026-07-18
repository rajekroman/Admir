const questItem = (definition) => Object.freeze({
  category: "quest",
  rarity: "quest",
  value: 0,
  weight: 0.1,
  stackLimit: 20,
  modifiers: {},
  ...definition,
});

export const CAMPAIGN_ITEMS = Object.freeze({
  stormroot: questItem({ id: "stormroot", name: "Kořen bouřnice", icon: "❧", description: "Tmavý kořen, který po bouři slabě jiskří." }),
  "watch-token": questItem({ id: "watch-token", name: "Žeton horské hlídky", icon: "◉", stackLimit: 1, description: "Mosazný služební žeton ztracený v průsmyku." }),
  "courier-note": questItem({ id: "courier-note", name: "Ztracený dopis", icon: "▤", description: "Dopis bez jména adresáta, zapečetěný šedým voskem." }),
  "watch-supplies": questItem({ id: "watch-supplies", name: "Bedna zásob hlídky", icon: "▣", weight: 2.4, description: "Malá bedna obvazů, hřebů a oleje pro městské hradby." }),
  "abbey-relic": questItem({ id: "abbey-relic", name: "Relikvie zatopeného opatství", icon: "✥", description: "Stříbrný medailon pokrytý zaschlou solí." }),
  "archive-key": questItem({ id: "archive-key", name: "Archivní klíč", icon: "⚿", description: "Tenký černý klíč s číslem, které se při pohledu mění." }),
  "true-name-tablet": questItem({ id: "true-name-tablet", name: "Tabulka pravého jména", icon: "◫", stackLimit: 1, weight: 0.8, description: "Obsidiánová tabulka, na níž je vyryto jméno Mor-Kharr." }),
  "reliquary-heart": questItem({ id: "reliquary-heart", name: "Srdce reliikviáře", icon: "◆", stackLimit: 1, weight: 0.4, description: "Paměť stovek bezejmenných, uzavřená do teplého stříbra." }),
  "crown-shard": questItem({ id: "crown-shard", name: "Střep Koruny ozvěn", icon: "◈", stackLimit: 3, description: "Zlomek kotvy, která držela lež pohromadě." }),
  "gatekeeper-blade": Object.freeze({ id: "gatekeeper-blade", name: "Čepel pravého jména", category: "weapon", slot: "mainHand", icon: "⚔", value: 950, weight: 3.0, rarity: "epic", stackLimit: 1, skill: "blade", allowedClasses: ["knight", "ranger"], minSkill: 5, description: "Čepel, která řeže kouzla vyslovená pod falešným jménem.", modifiers: { attack: 28, criticalChance: 7, spiritResistance: 15 } }),
  "memory-glass-amulet": Object.freeze({ id: "memory-glass-amulet", name: "Amulet paměťového skla", category: "accessory", slot: "amulet", icon: "◇", value: 880, weight: 0.2, rarity: "epic", stackLimit: 1, allowedClasses: ["knight", "ranger", "mage", "cleric"], description: "Uchovává jednu vzpomínku, kterou nelze přepsat.", modifiers: { maxMp: 22, spellPower: 10, mindResistance: 18, spiritResistance: 18 } }),
  "open-road-ring": Object.freeze({ id: "open-road-ring", name: "Prsten otevřené cesty", category: "accessory", slot: "ring", icon: "○", value: 820, weight: 0.1, rarity: "epic", stackLimit: 1, allowedClasses: ["knight", "ranger", "mage", "cleric"], description: "Mapa na jeho povrchu se mění podle nejbližší svobodné cesty.", modifiers: { initiative: 10, defense: 5, criticalChance: 5 } }),
});
