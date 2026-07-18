const CACHE = "lovec-vltavinu-reborn-v5-5";
const CORE = [
  "./","./index.html","./style.css","./game.js","./manifest.webmanifest",
  "./icon-180.png","./icon-192.png","./icon-512.png",
  "./assets/audio/music/field.wav","./assets/audio/music/meadow.wav",
  "./assets/audio/music/forest.wav","./assets/audio/music/night.wav",
  "./assets/audio/music/city.wav",
  "./assets/ui/na-zelene-vlne.jpg"
];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
