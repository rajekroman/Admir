const CACHE_VERSION = "ksb-4.0.1-combatfix";
const CORE_CACHE = `${CACHE_VERSION}-core`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const AUDIO_CACHE = `${CACHE_VERSION}-audio`;
const CORE_ASSETS = [
  "./",
  "./.nojekyll",
  "./assets/audio/audio-index.json",
  "./assets/effects/spells.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/sprites/enemies.png",
  "./assets/sprites/weapons.png",
  "./assets/sprites/world.png",
  "./assets/textures/floors.png",
  "./assets/textures/professional/crypt-floor.png",
  "./assets/textures/professional/crypt-wall.png",
  "./assets/textures/professional/grass.png",
  "./assets/textures/professional/hedge.png",
  "./assets/textures/professional/rune-wall.png",
  "./assets/textures/professional/stone-floor.png",
  "./assets/textures/professional/stone-wall.png",
  "./assets/textures/professional/wood-door.png",
  "./assets/textures/walls.png",
  "./assets/textures/world/abbey-floor-d.png",
  "./assets/textures/world/abbey-floor-n.png",
  "./assets/textures/world/abbey-floor-r.png",
  "./assets/textures/world/abbey-wall-d.png",
  "./assets/textures/world/abbey-wall-n.png",
  "./assets/textures/world/abbey-wall-r.png",
  "./assets/textures/world/abbey-water-d.png",
  "./assets/textures/world/abbey-water-n.png",
  "./assets/textures/world/abbey-water-r.png",
  "./assets/textures/world/archive-floor-d.png",
  "./assets/textures/world/archive-floor-n.png",
  "./assets/textures/world/archive-floor-r.png",
  "./assets/textures/world/archive-wall-d.png",
  "./assets/textures/world/archive-wall-n.png",
  "./assets/textures/world/archive-wall-r.png",
  "./assets/textures/world/ash-ground-d.png",
  "./assets/textures/world/ash-ground-n.png",
  "./assets/textures/world/ash-ground-r.png",
  "./assets/textures/world/ash-rock-d.png",
  "./assets/textures/world/ash-rock-n.png",
  "./assets/textures/world/ash-rock-r.png",
  "./assets/textures/world/book-leather-d.png",
  "./assets/textures/world/book-leather-n.png",
  "./assets/textures/world/book-leather-r.png",
  "./assets/textures/world/burnt-wood-d.png",
  "./assets/textures/world/burnt-wood-n.png",
  "./assets/textures/world/burnt-wood-r.png",
  "./assets/textures/world/citadel-floor-d.png",
  "./assets/textures/world/citadel-floor-n.png",
  "./assets/textures/world/citadel-floor-r.png",
  "./assets/textures/world/citadel-wall-d.png",
  "./assets/textures/world/citadel-wall-n.png",
  "./assets/textures/world/citadel-wall-r.png",
  "./assets/textures/world/crypt-floor-d.png",
  "./assets/textures/world/crypt-floor-n.png",
  "./assets/textures/world/crypt-floor-r.png",
  "./assets/textures/world/crypt-wall-d.png",
  "./assets/textures/world/crypt-wall-n.png",
  "./assets/textures/world/crypt-wall-r.png",
  "./assets/textures/world/glass-bark-d.png",
  "./assets/textures/world/glass-bark-n.png",
  "./assets/textures/world/glass-bark-r.png",
  "./assets/textures/world/glass-crystal-d.png",
  "./assets/textures/world/glass-crystal-n.png",
  "./assets/textures/world/glass-crystal-r.png",
  "./assets/textures/world/glass-soil-d.png",
  "./assets/textures/world/glass-soil-n.png",
  "./assets/textures/world/glass-soil-r.png",
  "./assets/textures/world/harbor-cobble-d.png",
  "./assets/textures/world/harbor-cobble-n.png",
  "./assets/textures/world/harbor-cobble-r.png",
  "./assets/textures/world/harbor-plaster-d.png",
  "./assets/textures/world/harbor-plaster-n.png",
  "./assets/textures/world/harbor-plaster-r.png",
  "./assets/textures/world/harbor-timber-d.png",
  "./assets/textures/world/harbor-timber-n.png",
  "./assets/textures/world/harbor-timber-r.png",
  "./assets/textures/world/iron-d.png",
  "./assets/textures/world/iron-n.png",
  "./assets/textures/world/iron-r.png",
  "./assets/textures/world/oak-door-d.png",
  "./assets/textures/world/oak-door-n.png",
  "./assets/textures/world/oak-door-r.png",
  "./assets/textures/world/pass-road-d.png",
  "./assets/textures/world/pass-road-n.png",
  "./assets/textures/world/pass-road-r.png",
  "./assets/textures/world/pass-slate-d.png",
  "./assets/textures/world/pass-slate-n.png",
  "./assets/textures/world/pass-slate-r.png",
  "./assets/textures/world/pass-wall-d.png",
  "./assets/textures/world/pass-wall-n.png",
  "./assets/textures/world/pass-wall-r.png",
  "./assets/textures/world/roof-slate-d.png",
  "./assets/textures/world/roof-slate-n.png",
  "./assets/textures/world/roof-slate-r.png",
  "./assets/textures/world/royal-banner-d.png",
  "./assets/textures/world/royal-banner-n.png",
  "./assets/textures/world/royal-banner-r.png",
  "./assets/textures/world/throne-floor-d.png",
  "./assets/textures/world/throne-floor-n.png",
  "./assets/textures/world/throne-floor-r.png",
  "./assets/textures/world/throne-wall-d.png",
  "./assets/textures/world/throne-wall-n.png",
  "./assets/textures/world/throne-wall-r.png",
  "./assets/textures/world/vale-earth-d.png",
  "./assets/textures/world/vale-earth-n.png",
  "./assets/textures/world/vale-earth-r.png",
  "./assets/textures/world/vale-grass-d.png",
  "./assets/textures/world/vale-grass-n.png",
  "./assets/textures/world/vale-grass-r.png",
  "./assets/textures/world/vale-hedge-d.png",
  "./assets/textures/world/vale-hedge-n.png",
  "./assets/textures/world/vale-hedge-r.png",
  "./assets/textures/world/vale-stone-d.png",
  "./assets/textures/world/vale-stone-n.png",
  "./assets/textures/world/vale-stone-r.png",
  "./assets/textures/world/void-crystal-d.png",
  "./assets/textures/world/void-crystal-n.png",
  "./assets/textures/world/void-crystal-r.png",
  "./assets/ui/full/title-background.jpg",
  "./assets/ui/icons.png",
  "./assets/ui/professional/button.png",
  "./assets/ui/professional/frame-slot.png",
  "./assets/ui/professional/frame-stone.png",
  "./assets/ui/professional/panel-obsidian.png",
  "./assets/ui/professional/portrait-daren.png",
  "./assets/ui/professional/portrait-lyra.png",
  "./assets/ui/professional/portrait-orin.png",
  "./assets/ui/professional/portrait-saela.png",
  "./assets/ui/professional/title-background.jpg",
  "./assets/ui/professional/utility-icons.png",
  "./index.html",
  "./manifest.webmanifest",
  "./src/core/AssetManager.js",
  "./src/core/AudioManager.js",
  "./src/core/Clock.js",
  "./src/core/Game.js",
  "./src/core/InputManager.js",
  "./src/core/PerformanceGovernor.js",
  "./src/core/PreferencesManager.js",
  "./src/core/SaveManager.js",
  "./src/data/abilities.js",
  "./src/data/assets.js",
  "./src/data/audio.js",
  "./src/data/campaignBoards.js",
  "./src/data/campaignDialogues.js",
  "./src/data/campaignEnemies.js",
  "./src/data/campaignItems.js",
  "./src/data/campaignQuests.js",
  "./src/data/classes.js",
  "./src/data/dialogues.js",
  "./src/data/endings.js",
  "./src/data/enemies.js",
  "./src/data/enemyAbilities.js",
  "./src/data/factions.js",
  "./src/data/items.js",
  "./src/data/lootTables.js",
  "./src/data/party.js",
  "./src/data/quests.js",
  "./src/data/skills.js",
  "./src/data/vendors.js",
  "./src/main.js",
  "./src/render/AnimationState.js",
  "./src/render/CinematicRenderer.js",
  "./src/render/CreatureFactory.js",
  "./src/render/HybridRenderer.js",
  "./src/render/Raycaster.js",
  "./src/render/WorldArtDirector.js",
  "./src/systems/CombatSystem.js",
  "./src/systems/ConditionEvaluator.js",
  "./src/systems/DialogueManager.js",
  "./src/systems/EnemyAI.js",
  "./src/systems/InventoryManager.js",
  "./src/systems/LootManager.js",
  "./src/systems/MagicSystem.js",
  "./src/systems/PartyManager.js",
  "./src/systems/Pathfinder.js",
  "./src/systems/QuestManager.js",
  "./src/systems/VendorManager.js",
  "./src/ui/Hud.js",
  "./src/ui/ScreenEffects.js",
  "./src/utils/math.js",
  "./src/world/EnvironmentSystem.js",
  "./src/world/World.js",
  "./src/world/campaignZones.js",
  "./src/world/fullContentPatches.js",
  "./src/world/maps.js",
  "./src/world/willowVale.js",
  "./styles-final.css",
  "./styles.css",
  "./vendor/three.core.min.js",
  "./vendor/three.module.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CORE_CACHE).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(RUNTIME_CACHE)).put(request, response.clone());
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match("./index.html"));
  }
}

async function cacheFirst(request, cacheName = RUNTIME_CACHE) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") (await caches.open(cacheName)).put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") { event.respondWith(networkFirst(request)); return; }
  if (url.pathname.includes("/assets/audio/")) { event.respondWith(cacheFirst(request, AUDIO_CACHE)); return; }
  event.respondWith(cacheFirst(request));
});
