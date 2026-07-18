const audioUrl = (path) => new URL(`../../assets/audio/${path}`, import.meta.url).href;

const music = {
  menu: "music/menu.mp3",
  valeDay: "music/vale-day.mp3",
  valeNight: "music/vale-night.mp3",
  passDay: "music/pass-day.mp3",
  passNight: "music/pass-night.mp3",
  crypt: "music/crypt.mp3",
  silverhaven: "music/silverhaven.mp3",
  ashenMarch: "music/ashen-march.mp3",
  drownedAbbey: "music/drowned-abbey.mp3",
  glasswood: "music/glasswood.mp3",
  obsidianArchive: "music/obsidian-archive.mp3",
  crownCitadel: "music/crown-citadel.mp3",
  hollowThrone: "music/hollow-throne.mp3",
  combat: "music/combat.mp3",
  boss: "music/boss.mp3",
};

const ambience = {
  forest: "ambience/forest.mp3",
  mountainWind: "ambience/mountain-wind.mp3",
  cryptDepths: "ambience/crypt-depths.mp3",
  harbor: "ambience/harbor.mp3",
  ashWind: "ambience/ash-wind.mp3",
  floodedAbbey: "ambience/flooded-abbey.mp3",
  glassChimes: "ambience/glass-chimes.mp3",
  archiveWhispers: "ambience/archive-whispers.mp3",
  citadelWind: "ambience/citadel-wind.mp3",
  voidDrone: "ambience/void-drone.mp3",
};

const sfxNames = [
  "ui-click", "ui-confirm", "ui-error", "ui-page",
  "step-grass-1", "step-grass-2", "step-grass-3",
  "step-stone-1", "step-stone-2", "step-stone-3",
  "step-crypt-1", "step-crypt-2", "step-crypt-3",
  "weapon-sword", "weapon-mace", "weapon-bow", "weapon-staff",
  "hit-flesh", "hit-armor", "hit-critical", "miss",
  "door-open", "door-close", "door-locked", "lever", "collect",
  "quest-update", "quest-complete", "trap-trigger", "trap-disarm",
  "zone-transition", "discovery",
  "magic-fire", "magic-frost", "magic-lightning", "magic-heal",
  "magic-spirit", "magic-poison", "magic-fail",
  "tactical-pause", "tactical-resume",
  "monster-hound-attack", "monster-hound-death",
  "monster-crawler-attack", "monster-crawler-death",
  "monster-raider-attack", "monster-raider-death",
  "monster-sentinel-attack", "monster-sentinel-death",
  "monster-shade-attack", "monster-shade-death",
  "monster-boss-attack", "monster-boss-death",
  "monster-cutthroat-attack", "monster-cutthroat-death",
  "monster-champion-attack", "monster-champion-death",
  "monster-monk-attack", "monster-monk-death",
  "monster-stalker-attack", "monster-stalker-death",
  "monster-wisp-attack", "monster-wisp-death",
  "monster-wraith-attack", "monster-wraith-death",
  "monster-golem-attack", "monster-golem-death",
  "monster-knight-attack", "monster-knight-death",
  "monster-herald-attack", "monster-herald-death",
];

const sfx = Object.fromEntries(sfxNames.map((name) => [name, `sfx/${name}.mp3`]));

export const AUDIO_MANIFEST = Object.freeze({
  ...Object.fromEntries(Object.entries(music).map(([id, path]) => [`music:${id}`, audioUrl(path)])),
  ...Object.fromEntries(Object.entries(ambience).map(([id, path]) => [`ambience:${id}`, audioUrl(path)])),
  ...Object.fromEntries(Object.entries(sfx).map(([id, path]) => [`sfx:${id}`, audioUrl(path)])),
});

export const AUDIO_COUNTS = Object.freeze({ music: Object.keys(music).length, ambience: Object.keys(ambience).length, sfx: Object.keys(sfx).length });

export const ENEMY_AUDIO_ARCHETYPE = Object.freeze({
  echoHound: "hound",
  mireCrawler: "crawler",
  ashRaider: "raider",
  hollowSentinel: "sentinel",
  echoShade: "shade",
  echoWarden: "boss",
  morKharr: "boss",
  harborCutthroat: "cutthroat",
  ashChampion: "champion",
  drownedMonk: "monk",
  glassStalker: "stalker",
  mirrorWisp: "wisp",
  archiveWraith: "wraith",
  obsidianGolem: "golem",
  crownKnight: "knight",
  voidHerald: "herald",
});

const ZONE_SCENES = Object.freeze({
  willowVale: { day: "valeDay", night: "valeNight", ambience: "forest" },
  silverPass: { day: "passDay", night: "passNight", ambience: "mountainWind" },
  echoCrypt: { day: "crypt", night: "crypt", ambience: "cryptDepths" },
  silverhaven: { day: "silverhaven", night: "silverhaven", ambience: "harbor" },
  ashenMarch: { day: "ashenMarch", night: "ashenMarch", ambience: "ashWind" },
  drownedAbbey: { day: "drownedAbbey", night: "drownedAbbey", ambience: "floodedAbbey" },
  glasswood: { day: "glasswood", night: "glasswood", ambience: "glassChimes" },
  obsidianArchive: { day: "obsidianArchive", night: "obsidianArchive", ambience: "archiveWhispers" },
  crownCitadel: { day: "crownCitadel", night: "crownCitadel", ambience: "citadelWind" },
  hollowThrone: { day: "hollowThrone", night: "hollowThrone", ambience: "voidDrone" },
});

export function resolveSceneAudio(scene = {}) {
  if (scene.screen === "menu" || !scene.zoneId) return { musicId: "menu", ambienceId: null };
  const profile = ZONE_SCENES[scene.zoneId] || ZONE_SCENES.willowVale;
  if (scene.inCombat) return { musicId: scene.bossActive ? "boss" : "combat", ambienceId: profile.ambience };
  return { musicId: scene.isNight ? profile.night : profile.day, ambienceId: profile.ambience };
}

export const AUDIO_ZONE_SCENES = ZONE_SCENES;
