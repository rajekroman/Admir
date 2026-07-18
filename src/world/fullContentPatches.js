const enemy = (id, enemyId, name, x, y, groupId) => ({
  id, kind: enemyId === "ashChampion" || enemyId === "harborCutthroat" ? "enemyRaider" : enemyId === "glassStalker" ? "enemyHound" : enemyId === "obsidianGolem" || enemyId === "crownKnight" ? "enemySentinel" : "enemyShade",
  enemyId, name, x, y, homeX: x, homeY: y, solid: true, groupId,
});

const trapEntity = (id, trapId, name, x, y) => ({
  id, kind: "trap", name, x: x + .5, y: y + .5, solid: false, render: false, trapId,
  interaction: { type: "trap", prompt: `Zneškodnit: ${name}` },
});

export const FULL_CONTENT_PATCHES = Object.freeze({
  silverPass: Object.freeze({
    entities: [
      enemy("pass-ash-champion", "ashChampion", "Popelavý předák", 6.5, 2.5, "pass-raiders-elite"),
    ],
    traps: [],
  }),
  silverhaven: Object.freeze({
    entities: [
      enemy("harbor-cutthroat-a", "harborCutthroat", "Přístavní hrdlořez", 4.5, 2.5, "harbor-gang"),
      enemy("harbor-cutthroat-b", "harborCutthroat", "Přístavní hrdlořez", 11.5, 2.5, "harbor-gang"),
      enemy("harbor-cutthroat-c", "harborCutthroat", "Vůdce přístavních zlodějů", 18.5, 2.5, "harbor-gang"),
      {
        id: "harbor-master-cache", kind: "chest", name: "Schránka přístavního mistra", x: 25.5, y: 2.5, solid: true,
        interaction: { type: "loot", lootTable: "watchArmory", prompt: "Otevřít schránku přístavního mistra" },
      },
    ],
    traps: [],
  }),
  ashenMarch: Object.freeze({
    entities: [
      enemy("march-champion-a", "ashChampion", "Popelavý šampion", 6.5, 2.5, "march-elite"),
      enemy("march-champion-b", "ashChampion", "Popelavý šampion", 20.5, 2.5, "march-elite"),
      enemy("march-wisp-a", "mirrorWisp", "Bludička spáleného zrcadla", 5.5, 3.5, "march-wisps"),
      enemy("march-wisp-b", "mirrorWisp", "Bludička spáleného zrcadla", 19.5, 3.5, "march-wisps"),
      {
        id: "march-fallen-standard", kind: "obelisk", name: "Praporec poslední obrany", x: 25.5, y: 4.5, solid: true,
        interaction: { type: "inspect", prompt: "Prozkoumat padlý praporec", title: "Praporec poslední obrany", text: "Na látce zůstal seznam jednotek, které se vrátily z bitvy dříve, než do ní vyrazily.", event: "inspect", target: "march-standard", experience: 65, flag: "lore:marchStandard" },
      },
    ],
    traps: [],
  }),
  drownedAbbey: Object.freeze({
    entities: [
      enemy("abbey-monk-a", "drownedMonk", "Utonulý kantor", 2.5, 2.5, "abbey-choir"),
      enemy("abbey-monk-b", "drownedMonk", "Utonulý kantor", 22.5, 3.5, "abbey-choir"),
      enemy("abbey-monk-c", "drownedMonk", "Utonulý mnich", 14.5, 4.5, "abbey-choir"),
      enemy("abbey-monk-d", "drownedMonk", "Utonulý mnich", 21.5, 4.5, "abbey-choir"),
      enemy("abbey-wisp-a", "mirrorWisp", "Zrcadlo pod hladinou", 6.5, 5.5, "abbey-reflections"),
      enemy("abbey-wisp-b", "mirrorWisp", "Zrcadlo pod hladinou", 13.5, 5.5, "abbey-reflections"),
      trapEntity("abbey-undertow-entity", "abbey-undertow", "Propadlá dlažba pod proudem", 12, 6),
      trapEntity("abbey-bells-entity", "abbey-bells", "Utopené zvony", 19, 6),
      {
        id: "abbey-reliquary-cache", kind: "chest", name: "Vodou uzavřený relikviář", x: 20.5, y: 5.5, solid: true,
        interaction: { type: "loot", lootTable: "echoWarden", prompt: "Otevřít vodou uzavřený relikviář" },
      },
    ],
    traps: [
      { id: "abbey-undertow", x: 12, y: 6, name: "Podvodní proud", detectDifficulty: 3, disarmDifficulty: 4, damage: 22, damageType: "frost", targets: 4, statusId: "shaken", statusDuration: 5, oneShot: false, resetMinutes: 45 },
      { id: "abbey-bells", x: 19, y: 6, name: "Utopené zvony", detectDifficulty: 4, disarmDifficulty: 4, damage: 18, damageType: "spirit", targets: 4, statusId: "silenced", statusDuration: 4, oneShot: true },
    ],
  }),
  glasswood: Object.freeze({
    entities: [
      enemy("glass-stalker-a", "glassStalker", "Skleněný stopař", 8.5, 2.5, "glass-pack"),
      enemy("glass-stalker-b", "glassStalker", "Skleněný stopař", 22.5, 2.5, "glass-pack"),
      enemy("glass-stalker-c", "glassStalker", "Skleněný stopař", 11.5, 6.5, "glass-pack"),
      enemy("glass-stalker-d", "glassStalker", "Skleněný stopař", 18.5, 6.5, "glass-pack"),
      enemy("glass-wisp-a", "mirrorWisp", "Zrcadlový bludič", 25.5, 6.5, "glass-wisps"),
      enemy("glass-wisp-b", "mirrorWisp", "Zrcadlový bludič", 3.5, 7.5, "glass-wisps"),
      enemy("glass-wisp-c", "mirrorWisp", "Zrcadlový bludič", 10.5, 7.5, "glass-wisps"),
      {
        id: "glass-heart", kind: "obelisk", name: "Srdce skleněného stromu", x: 2.5, y: 8.5, solid: true,
        interaction: { type: "inspect", prompt: "Dotknout se skleněného srdce", title: "Srdce skleněného stromu", text: "Krystal ukazuje všechny podoby lesa zároveň: živý, shořelý, zatopený i dosud nezasazený.", event: "inspect", target: "glass-heart", experience: 85, flag: "lore:glassHeart" },
      },
      {
        id: "glass-ranger-cache", kind: "chest", name: "Schránka skleněného hraničáře", x: 26.5, y: 8.5, solid: true,
        interaction: { type: "loot", lootTable: "watchArmory", prompt: "Otevřít schránku skleněného hraničáře" },
      },
    ],
    traps: [],
  }),
  obsidianArchive: Object.freeze({
    entities: [
      enemy("archive-wraith-a", "archiveWraith", "Paměťový přízrak", 3.5, 2.5, "archive-index"),
      enemy("archive-wraith-b", "archiveWraith", "Paměťový přízrak", 10.5, 2.5, "archive-index"),
      enemy("archive-wraith-c", "archiveWraith", "Paměťový přízrak", 17.5, 2.5, "archive-index"),
      enemy("archive-wraith-d", "archiveWraith", "Paměťový přízrak", 24.5, 2.5, "archive-index"),
      enemy("archive-golem-a", "obsidianGolem", "Obsidiánový kolos", 2.5, 3.5, "archive-guard"),
      enemy("archive-golem-b", "obsidianGolem", "Obsidiánový kolos", 16.5, 3.5, "archive-guard"),
      trapEntity("archive-index-trap-entity", "archive-index-trap", "Index vymazání", 14, 5),
      trapEntity("archive-crush-entity", "archive-crush", "Padající obsidiánová deska", 7, 5),
      {
        id: "archive-curator-cache", kind: "chest", name: "Kazeta zakázaného kurátora", x: 15.5, y: 4.5, solid: true,
        interaction: { type: "loot", lootTable: "echoWarden", prompt: "Otevřít kazetu zakázaného kurátora" },
      },
    ],
    traps: [
      { id: "archive-index-trap", x: 14, y: 5, name: "Index vymazání", detectDifficulty: 4, disarmDifficulty: 5, damage: 21, damageType: "spirit", targets: 4, statusId: "silenced", statusDuration: 5, oneShot: false, resetMinutes: 60 },
      { id: "archive-crush", x: 7, y: 5, name: "Padající obsidiánová deska", detectDifficulty: 3, disarmDifficulty: 5, damage: 34, damageType: "physical", targets: 2, oneShot: true },
    ],
  }),
  crownCitadel: Object.freeze({
    entities: [
      enemy("citadel-knight-a", "crownKnight", "Rytíř prázdné koruny", 2.5, 2.5, "citadel-order"),
      enemy("citadel-knight-b", "crownKnight", "Rytíř prázdné koruny", 9.5, 2.5, "citadel-order"),
      enemy("citadel-knight-c", "crownKnight", "Rytíř prázdné koruny", 16.5, 2.5, "citadel-order"),
      enemy("citadel-knight-d", "crownKnight", "Rytíř prázdné koruny", 23.5, 2.5, "citadel-order"),
      enemy("citadel-champion", "ashChampion", "Korunní popravčí", 8.5, 3.5, "citadel-order"),
      enemy("citadel-wisp-a", "mirrorWisp", "Korunní zrcadlo", 15.5, 3.5, "citadel-mirrors"),
      enemy("citadel-wisp-b", "mirrorWisp", "Korunní zrcadlo", 14.5, 4.5, "citadel-mirrors"),
      trapEntity("citadel-oil-entity", "citadel-oil", "Žlab vroucího oleje", 12, 6),
      trapEntity("citadel-bolt-entity", "citadel-bolt", "Korunní balista", 11, 7),
      {
        id: "citadel-war-table", kind: "obelisk", name: "Kamenný válečný stůl", x: 13.5, y: 5.5, solid: true,
        interaction: { type: "inspect", prompt: "Prozkoumat válečný stůl", title: "Válečný stůl", text: "Na mapě jsou vyznačena vítězství, která se nikdy nestala, a porážky, na které si všichni pamatují.", event: "inspect", target: "citadel-table", experience: 95, flag: "lore:citadelTable" },
      },
      {
        id: "citadel-royal-armory", kind: "chest", name: "Truhlice královské zbrojnice", x: 24.5, y: 5.5, solid: true,
        interaction: { type: "loot", lootTable: "watchArmory", prompt: "Otevřít truhlici královské zbrojnice" },
      },
    ],
    traps: [
      { id: "citadel-oil", x: 12, y: 6, name: "Žlab vroucího oleje", detectDifficulty: 3, disarmDifficulty: 4, damage: 27, damageType: "fire", targets: 4, statusId: "burning", statusDuration: 5, oneShot: true },
      { id: "citadel-bolt", x: 11, y: 7, name: "Korunní balista", detectDifficulty: 4, disarmDifficulty: 5, damage: 38, damageType: "physical", targets: 1, oneShot: false, resetMinutes: 60 },
    ],
  }),
  hollowThrone: Object.freeze({
    entities: [
      enemy("throne-herald-a", "voidHerald", "Herold nicoty", 2.5, 2.5, "throne-court"),
      enemy("throne-herald-b", "voidHerald", "Herold nicoty", 23.5, 2.5, "throne-court"),
      enemy("throne-golem-a", "obsidianGolem", "Kolos prázdného trůnu", 8.5, 3.5, "throne-court"),
      enemy("throne-golem-b", "obsidianGolem", "Kolos prázdného trůnu", 22.5, 3.5, "throne-court"),
      enemy("throne-wisp-a", "mirrorWisp", "Střep falešného jména", 15.5, 3.5, "throne-shards"),
      enemy("throne-wisp-b", "mirrorWisp", "Střep falešného jména", 21.5, 4.5, "throne-shards"),
      trapEntity("throne-rift-entity", "throne-rift", "Trhlina falešného jména", 8, 4),
      trapEntity("throne-collapse-entity", "throne-collapse", "Rozpad koruny", 22, 4),
      {
        id: "throne-last-treasury", kind: "chest", name: "Pokladnice posledního jména", x: 24.5, y: 5.5, solid: true,
        interaction: { type: "loot", lootTable: "echoWarden", prompt: "Otevřít pokladnici posledního jména" },
      },
    ],
    traps: [
      { id: "throne-rift", x: 8, y: 4, name: "Trhlina falešného jména", detectDifficulty: 5, disarmDifficulty: 5, damage: 26, damageType: "spirit", targets: 4, statusId: "exposed", statusDuration: 7, oneShot: false, resetMinutes: 90 },
      { id: "throne-collapse", x: 22, y: 4, name: "Rozpad koruny", detectDifficulty: 5, disarmDifficulty: 6, damage: 31, damageType: "shock", targets: 4, statusId: "shaken", statusDuration: 6, oneShot: true },
    ],
  }),
});

export function applyFullContentPatches(zones) {
  for (const [zoneId, patch] of Object.entries(FULL_CONTENT_PATCHES)) {
    const zone = zones[zoneId];
    if (!zone) continue;
    zone.entities ||= [];
    zone.traps ||= [];
    const entityIds = new Set(zone.entities.map((entity) => entity.id));
    for (const entity of patch.entities) if (!entityIds.has(entity.id)) zone.entities.push(structuredClone(entity));
    const trapIds = new Set(zone.traps.map((trap) => trap.id));
    for (const trap of patch.traps) if (!trapIds.has(trap.id)) zone.traps.push(structuredClone(trap));
  }
  return zones;
}
