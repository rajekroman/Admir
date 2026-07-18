const assetUrl = (relativePath) => new URL(`../../assets/${relativePath}`, import.meta.url).href;

export const FRAME_SIZE = 64;

export const WALL_TEXTURES = Object.freeze({
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
});

export const FLOOR_TEXTURES = Object.freeze({
  grass: 0,
  stone: 1,
  crypt: 2,
});

export const WORLD_SPRITES = Object.freeze({
  npc: 0,
  obelisk: 1,
  sign: 2,
  torch: 3,
  fragment: 4,
  satchel: 5,
  herb: 6,
  key: 7,
  lever: 8,
  trap: 9,
  chest: 10,
  crate: 11,
  stall: 12,
  corpse: 13,
});

export const ENEMY_SPRITES = Object.freeze({
  enemyHound: 0,
  enemyCrawler: 1,
  enemyRaider: 2,
  enemySentinel: 3,
  enemyShade: 4,
  enemyWarden: 5,
});

export const WEAPON_SPRITES = Object.freeze({
  sword: 0,
  mace: 1,
  bow: 2,
  staff: 3,
});

export const EFFECT_SPRITES = Object.freeze({
  arrow: 0,
  arcane: 1,
  fire: 2,
  frost: 3,
  lightning: 4,
  venom: 5,
  echo: 6,
  impact: 7,
  heal: 8,
  death: 9,
});

export const ITEM_ICON_IDS = Object.freeze([
  "iron-longsword", "silver-watch-blade", "ashwood-bow", "echo-string-bow",
  "apprentice-staff", "resonance-staff", "silver-mace", "silent-bell-mace",
  "oak-buckler", "watch-shield", "chain-hauberk", "rangers-leathers",
  "archivist-robes", "bell-vestments", "iron-cap", "seers-circlet",
  "trail-boots", "ring-of-clear-thought", "amulet-of-the-gate",
  "minor-healing-potion", "greater-healing-potion", "mana-tonic", "moonleaf-tonic", "antidote",
  "travel-ration", "moonleaf", "silver-dust", "wolf-pelt", "old-silver-brooch",
  "silver-fragment", "lost-satchel", "eliras-seal", "crypt-warden-key", "mirror-silver",
]);

export const ABILITY_ICON_IDS = Object.freeze([
  "powerStrike", "shieldBash", "rally", "guardianStance",
  "aimedShot", "pinningShot", "volley", "fieldDressing",
  "emberBolt", "frostShard", "chainLightning", "fireNova",
  "mend", "guardianWard", "cleanse", "resurrection",
]);

export const ITEM_ICONS = Object.freeze(Object.fromEntries(ITEM_ICON_IDS.map((id, index) => [id, index])));
export const ABILITY_ICONS = Object.freeze(Object.fromEntries(ABILITY_ICON_IDS.map((id, index) => [id, ITEM_ICON_IDS.length + index])));

export const PORTRAITS = Object.freeze({
  daren: assetUrl("ui/professional/portrait-daren.png"),
  lyra: assetUrl("ui/professional/portrait-lyra.png"),
  orin: assetUrl("ui/professional/portrait-orin.png"),
  saela: assetUrl("ui/professional/portrait-saela.png"),
});

export const ASSET_MANIFEST = Object.freeze({
  walls: { url: assetUrl("textures/walls.png"), frameWidth: 64, frameHeight: 64, columns: 5, rows: 1 },
  floors: { url: assetUrl("textures/floors.png"), frameWidth: 64, frameHeight: 64, columns: 3, rows: 1 },
  world: { url: assetUrl("sprites/world.png"), frameWidth: 64, frameHeight: 64, columns: 4, rows: 14 },
  enemies: { url: assetUrl("sprites/enemies.png"), frameWidth: 64, frameHeight: 64, columns: 12, rows: 6 },
  weapons: { url: assetUrl("sprites/weapons.png"), frameWidth: 64, frameHeight: 64, columns: 4, rows: 4 },
  effects: { url: assetUrl("effects/spells.png"), frameWidth: 64, frameHeight: 64, columns: 6, rows: 10 },
  icons: { url: assetUrl("ui/icons.png"), frameWidth: 32, frameHeight: 32, columns: 10, rows: 5 },
});
