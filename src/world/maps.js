import { WILLOW_VALE } from "./willowVale.js";
import { CAMPAIGN_ZONES, EXISTING_ZONE_PATCHES } from "./campaignZones.js";
import { applyFullContentPatches } from "./fullContentPatches.js";

const SILVER_PASS = {
  id: "silverPass",
  name: "Průsmyk Stříbrné brány",
  subtitle: "Vítr mezi zhaslými menhiry",
  environment: "outdoor",
  skyTop: "#465a72",
  skyBottom: "#a98d6a",
  floorNear: "#3a412c",
  floorFar: "#1d241c",
  fog: "#59625d",
  music: [98, 130.81, 146.83, 196, 174.61, 146.83],
  nightMusic: [73.42, 98, 110, 146.83, 130.81, 98],
  start: { x: 2.5, y: 10.5, direction: 0 },
  spawns: {
    fromVale: { x: 2.5, y: 10.5, direction: 0 },
    fromCrypt: { x: 20.5, y: 6.5, direction: Math.PI },
  },
  map: [
    "111111111111111111111111",
    "133330000000000003333331",
    "130030000111100003000031",
    "130030000100100003000031",
    "133330000100100003333331",
    "100000000122100000000001",
    "100000000000000000000001",
    "100033300000000033300001",
    "100030300111100030300001",
    "100030300100100030300001",
    "100000000100100000000001",
    "100000000122100000000001",
    "100030300000000030300001",
    "100033300011000033300001",
    "100000000011000000000001",
    "100000000000000000000001",
    "100033330000000333300001",
    "100000000000000000000001",
    "100000000000000000000001",
    "111111111111111111111111"
  ],
  floorZones: [
    { x1: 1, y1: 5, x2: 22, y2: 15, material: "stone" },
  ],
  entities: [
    {
      id: "pass-to-vale", kind: "portal", name: "Cesta do Vrbového údolí", x: 1.5, y: 10.5, solid: false, render: false,
      interaction: { type: "transition", prompt: "Vrátit se do údolí", targetZone: "willowVale", targetSpawn: "eastRoad" },
    },
    {
      id: "pass-to-crypt", kind: "portal", name: "Schodiště do Krypty ozvěn", x: 21.5, y: 6.5, solid: false, render: false,
      interaction: { type: "transition", prompt: "Sestoupit do Krypty ozvěn", targetZone: "echoCrypt", targetSpawn: "entrance" },
    },
    {
      id: "pass-warning", kind: "sign", name: "Rozštípnutý varovný kámen", x: 11.5, y: 6.5, solid: false,
      interaction: { type: "inspect", prompt: "Přečíst varovný kámen", title: "Varování hlídky", text: "Krypta pod průsmykem byla zapečetěna po Popelavé noci. Tři údery zvonu otevřou cestu dolů. Čtvrtý probudí to, co nemá jméno.", flag: "lore:cryptWarning", experience: 20 },
    },
    {
      id: "pass-supply-cache", kind: "chest", name: "Schránka průsmykové hlídky", x: 5.5, y: 3.5, solid: true,
      interaction: { type: "loot", lootTable: "watchArmory", prompt: "Otevřít schránku hlídky" },
    },
    {
      id: "pass-crypt-key", kind: "key", name: "Klíč správce krypty", x: 18.5, y: 14.5, solid: false,
      interaction: { type: "collect", prompt: "Zvednout klíč správce", itemId: "crypt-warden-key", itemName: "Klíč správce krypty", event: "collect", target: "crypt-warden-key", text: "Těžký stříbrný klíč je stále teplý. Na dříku má vyrytý symbol zavřeného oka." },
    },
    { id: "pass-hound-a", kind: "enemyHound", enemyId: "echoHound", name: "Ozvěnový honič", x: 8.5, y: 15.5, homeX: 8.5, homeY: 15.5, solid: true, groupId: "pass-pack" },
    { id: "pass-hound-b", kind: "enemyHound", enemyId: "echoHound", name: "Ozvěnový honič", x: 10.5, y: 16.5, homeX: 10.5, homeY: 16.5, solid: true, groupId: "pass-pack" },
    { id: "pass-raider-a", kind: "enemyRaider", enemyId: "ashRaider", name: "Popelavý ostrostřelec", x: 15.5, y: 9.5, homeX: 15.5, homeY: 9.5, solid: true, groupId: "pass-raiders" },
    { id: "pass-sentinel", kind: "enemySentinel", enemyId: "hollowSentinel", name: "Strážce schodiště", x: 20.5, y: 5.5, homeX: 20.5, homeY: 5.5, solid: true, groupId: "crypt-watch" },
    { id: "pass-torch-a", kind: "torch", name: "Pochodeň", x: 19.5, y: 5.5, solid: false },
    { id: "pass-torch-b", kind: "torch", name: "Pochodeň", x: 21.5, y: 5.5, solid: false },
  ],
  traps: [],
};

const ECHO_CRYPT = {
  id: "echoCrypt",
  name: "Krypta zlomených ozvěn",
  subtitle: "První podzemí — hrobka bezejmenné hlídky",
  environment: "dungeon",
  skyTop: "#14131a",
  skyBottom: "#29232b",
  floorNear: "#292725",
  floorFar: "#111113",
  fog: "#24232a",
  music: [65.41, 87.31, 98, 130.81, 116.54, 87.31],
  nightMusic: [65.41, 82.41, 98, 123.47, 110, 82.41],
  start: { x: 3.5, y: 21.5, direction: -Math.PI / 2 },
  spawns: {
    entrance: { x: 3.5, y: 21.5, direction: -Math.PI / 2 },
  },
  map: [
    "44444444444444444444444444",
    "40000000400000000400000004",
    "40000000400000000400000004",
    "40000000400000000400000004",
    "40000000400000000400000004",
    "40000000400000000400000004",
    "40000000400000000400000004",
    "44444444444442444400000004",
    "40000000400000000444444444",
    "40000000400000000400000004",
    "40000000400000000400000004",
    "40000000400000000400000004",
    "40000000400000000400000004",
    "40000000400000000400000004",
    "40000000400000000400000004",
    "40000000200000000200000004",
    "40000000400000000400000004",
    "40000000400000000400000004",
    "44442444444444444400000004",
    "40000000400000000400000004",
    "40000000400000000400000004",
    "40000000400000000400000004",
    "40000000400000000400000004",
    "44444444444444444444444444"
  ],
  floorZones: [{ x1: 1, y1: 1, x2: 24, y2: 22, material: "crypt" }],
  entities: [
    {
      id: "crypt-exit", kind: "portal", name: "Schodiště do průsmyku", x: 2.5, y: 22.5, solid: false, render: false,
      interaction: { type: "transition", prompt: "Vystoupit do průsmyku", targetZone: "silverPass", targetSpawn: "fromCrypt" },
    },
    {
      id: "crypt-entry-door", kind: "mechanism", name: "Vstupní kamenné dveře", x: 4.5, y: 19.5, solid: false, render: false,
      interaction: { type: "door", prompt: "Otevřít kamenné dveře", tileX: 4, tileY: 18, closedTile: 2, openTile: 0, messageOpen: "Kamenná deska se s hlubokým zaduněním zasunula do podlahy." },
    },
    {
      id: "crypt-warden-door", kind: "mechanism", name: "Dveře správce", x: 7.5, y: 15.5, solid: false, render: false,
      interaction: { type: "door", prompt: "Odemknout dveře správce", tileX: 8, tileY: 15, closedTile: 2, openTile: 0, requiresItem: "crypt-warden-key", lockedText: "Zámek má tvar zavřeného oka. Bez klíče správce se nepohne." },
    },
    {
      id: "crypt-resonance-door", kind: "mechanism", name: "Rezonanční brána", x: 13.5, y: 8.5, solid: false, render: false,
      interaction: { type: "door", prompt: "Prozkoumat rezonanční bránu", tileX: 13, tileY: 7, closedTile: 2, openTile: 0, requiresFlag: "mechanism:crypt-lever", lockedText: "Brána nereaguje na sílu. Z hlubiny stěn k ní vede kovové táhlo." },
    },
    {
      id: "crypt-lever", kind: "lever", name: "Páka tichého zvonu", x: 11.5, y: 12.5, solid: true,
      interaction: { type: "lever", prompt: "Stisknout páku", oneWay: true, flag: "mechanism:crypt-lever", event: "mechanism", target: "crypt-lever", targets: [{ tileX: 13, tileY: 7, tile: 0 }], text: "Páka klesla. Nad vámi třikrát zazněl zvon, ačkoli v kryptě žádný není." },
    },
    {
      id: "crypt-secret-wall", kind: "mechanism", name: "Podezřelá stěna", x: 16.5, y: 4.5, solid: false, render: false,
      secret: { tileX: 17, tileY: 4, detectDifficulty: 2 },
      interaction: { type: "secret", prompt: "Odtlačit tajnou stěnu", tileX: 17, tileY: 4, openTile: 0, event: "discover", target: "crypt-secret", text: "Spára v kameni povolila. Za stěnou se otevřela zapomenutá pokladnice." },
    },
    {
      id: "crypt-treasure", kind: "chest", name: "Pokladnice bezejmenného kapitána", x: 22.5, y: 3.5, solid: true,
      interaction: { type: "loot", lootTable: "watchArmory", prompt: "Otevřít tajnou pokladnici" },
    },
    {
      id: "crypt-altar", kind: "obelisk", name: "Oltář první ozvěny", x: 13.5, y: 3.5, solid: true,
      interaction: { type: "inspect", prompt: "Prozkoumat oltář", title: "Oltář první ozvěny", text: "V kamenné míse neleží popel, ale dokonale hladké stříbro. Když se nad něj skloníš, odraz otevře ústa o zlomek vteřiny dříve než ty.", event: "inspect", target: "crypt-altar", experience: 75, flag: "lore:firstEcho" },
    },
    { id: "crypt-trap-darts", kind: "trap", name: "Štěrbiny šipkové pasti", x: 4.5, y: 16.5, solid: false, render: false, trapId: "crypt-darts", interaction: { type: "trap", prompt: "Zneškodnit šipkovou past" } },
    { id: "crypt-trap-rune", kind: "trap", name: "Prasklá runa bolesti", x: 12.5, y: 12.5, solid: false, render: false, trapId: "crypt-rune", interaction: { type: "trap", prompt: "Rozpojit runu bolesti" } },
    { id: "crypt-trap-collapse", kind: "trap", name: "Uvolněná stropní deska", x: 14.5, y: 5.5, solid: false, render: false, trapId: "crypt-collapse", interaction: { type: "trap", prompt: "Zajistit stropní spoušť" } },
    { id: "crypt-crawler-a", kind: "enemyCrawler", enemyId: "mireCrawler", name: "Kryptový lezoun", x: 5.5, y: 14.5, homeX: 5.5, homeY: 14.5, solid: true, groupId: "entry-crawlers" },
    { id: "crypt-crawler-b", kind: "enemyCrawler", enemyId: "mireCrawler", name: "Kryptový lezoun", x: 6.5, y: 12.5, homeX: 6.5, homeY: 12.5, solid: true, groupId: "entry-crawlers" },
    { id: "crypt-sentinel-a", kind: "enemySentinel", enemyId: "hollowSentinel", name: "Dutý strážce krypty", x: 11.5, y: 10.5, homeX: 11.5, homeY: 10.5, solid: true, groupId: "inner-watch" },
    { id: "crypt-shade-a", kind: "enemyShade", enemyId: "echoShade", name: "Živá ozvěna", x: 15.5, y: 4.5, homeX: 15.5, homeY: 4.5, solid: true, groupId: "altar-watch" },
    { id: "crypt-shade-b", kind: "enemyShade", enemyId: "echoShade", name: "Živá ozvěna", x: 14.5, y: 2.5, homeX: 14.5, homeY: 2.5, solid: true, groupId: "altar-watch" },
    { id: "crypt-torch-a", kind: "torch", name: "Modrá pochodeň", x: 3.5, y: 19.5, solid: false },
    { id: "crypt-torch-b", kind: "torch", name: "Modrá pochodeň", x: 12.5, y: 9.5, solid: false },
    { id: "crypt-torch-c", kind: "torch", name: "Modrá pochodeň", x: 13.5, y: 5.5, solid: false },
  ],
  traps: [
    { id: "crypt-darts", x: 4, y: 16, name: "Šipková past", detectDifficulty: 1, disarmDifficulty: 2, damage: 16, damageType: "physical", targets: 1, oneShot: false, resetMinutes: 30 },
    { id: "crypt-rune", x: 12, y: 12, name: "Runa bolesti", detectDifficulty: 2, disarmDifficulty: 3, damage: 13, damageType: "spirit", targets: 4, statusId: "shaken", statusDuration: 7, oneShot: true },
    { id: "crypt-collapse", x: 14, y: 5, name: "Stropní zával", detectDifficulty: 3, disarmDifficulty: 4, damage: 26, damageType: "physical", targets: 4, oneShot: true },
  ],
};

// Návratový bod byl doplněn mimo původní data, aby stará mapa zůstala kompatibilní.
WILLOW_VALE.environment = "outdoor";
WILLOW_VALE.nightMusic = [82.41, 110, 123.47, 164.81, 146.83, 110];
WILLOW_VALE.spawns = { ...(WILLOW_VALE.spawns || {}), eastRoad: { x: 21.5, y: 12.5, direction: Math.PI } };
WILLOW_VALE.traps = WILLOW_VALE.traps || [];

for (const [zoneId, additions] of Object.entries(EXISTING_ZONE_PATCHES)) {
  const zone = zoneId === "willowVale" ? WILLOW_VALE : zoneId === "silverPass" ? SILVER_PASS : ECHO_CRYPT;
  const known = new Set(zone.entities.map((entity) => entity.id));
  for (const entity of additions) if (!known.has(entity.id)) zone.entities.push(structuredClone(entity));
}

SILVER_PASS.spawns.fromCity = { x: 22.5, y: 17.5, direction: Math.PI };
if (!SILVER_PASS.entities.some((entity) => entity.id === "pass-to-city")) {
  SILVER_PASS.entities.push({
    id: "pass-to-city", kind: "portal", name: "Cesta do Stříbrného přístavu", x: 22.5, y: 17.5, solid: false, render: false,
    interaction: { type: "transition", prompt: "Vstoupit do Stříbrného přístavu", targetZone: "silverhaven", targetSpawn: "fromPass", requiresItem: "mirror-silver", lockedText: "Městská brána reaguje pouze na zrcadlové stříbro z krypty." },
  });
}

for (const trap of ECHO_CRYPT.traps) trap.eventTarget = "crypt-hazard";

const ALL_ZONES = {
  willowVale: WILLOW_VALE,
  silverPass: SILVER_PASS,
  echoCrypt: ECHO_CRYPT,
  ...CAMPAIGN_ZONES,
};
applyFullContentPatches(ALL_ZONES);
export const ZONES = Object.freeze(ALL_ZONES);
