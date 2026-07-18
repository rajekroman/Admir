import { AssetManager } from "./core/AssetManager.js";
import { Game } from "./core/Game.js";
import { AudioManager } from "./core/AudioManager.js";

async function registerServiceWorker(status) {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return null;
  try {
    const registration = await navigator.serviceWorker.register("./sw.js?v=4.0.1", { scope: "./", updateViaCache: "none" });
    if (registration.waiting) {
      registration.waiting.postMessage("SKIP_WAITING");
      if (status) status.textContent = "Aktualizuji hru na nejnovější verzi…";
    }
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      location.reload();
    });
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller && status) {
          status.textContent = "Instaluji novou verzi hry…";
          worker.postMessage("SKIP_WAITING");
        }
      });
    });
    return registration;
  } catch (error) {
    console.warn("Service worker nebyl zaregistrován", error);
    return null;
  }
}

function configureInstallButton() {
  const button = document.querySelector("#install-button");
  if (!button) return;
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    button.classList.remove("hidden");
  });
  button.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    button.classList.add("hidden");
  });
  window.addEventListener("appinstalled", () => button.classList.add("hidden"));
}

async function bootstrap() {
  const status = document.querySelector("#asset-status");
  const newGameButton = document.querySelector("#new-game");
  const continueButton = document.querySelector("#continue-game");
  if (newGameButton) newGameButton.disabled = true;
  if (continueButton) continueButton.disabled = true;

  configureInstallButton();
  const serviceWorkerPromise = registerServiceWorker(status);
  const assets = new AssetManager();
  const audio = new AudioManager();

  if (status) status.textContent = "Načítám finální grafiku a herní data…";
  const assetResult = await assets.loadAll();
  const graphicsText = assetResult.failed ? `${assetResult.loaded} atlasů (${assetResult.failed} chyb)` : `${assetResult.loaded} atlasů`;

  const game = new Game(document, { assets, audio });
  game.start();
  if (newGameButton) newGameButton.disabled = false;
  game.refreshContinueButton();
  const launchAction = new URLSearchParams(location.search).get("action");
  if (launchAction === "new") game.newGame();
  else if (launchAction === "continue") game.continueGame();

  if (status) status.textContent = `Grafika připravena: ${graphicsText}. Zvuková banka se načítá na pozadí…`;
  audio.loadAll().then((audioResult) => {
    if (!status) return;
    const audioText = audioResult.failed ? `${audioResult.loaded} zvuků (${audioResult.failed} chyb)` : `${audioResult.loaded} zvuků`;
    status.textContent = `Připraveno: ${graphicsText}, ${audioText}. Hru lze nainstalovat a po prvním načtení používat offline.`;
  }).catch(() => {
    if (status) status.textContent = `Grafika připravena: ${graphicsText}. Zvuková banka se nepodařila načíst; hra zůstává hratelná bez zvuku.`;
  });

  await serviceWorkerPromise;
  window.__KRONIKY_GAME__ = game;
  window.__KRONIKY_ASSETS__ = assets;
  window.__KRONIKY_AUDIO__ = audio;
}

bootstrap().catch((error) => {
  console.error(error);
  const status = document.querySelector("#asset-status");
  if (status) status.textContent = "Herní data se nepodařilo načíst. Obnovte stránku nebo smažte mezipaměť webu.";
});
