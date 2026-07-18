import { Raycaster } from "./Raycaster.js";
import { CinematicRenderer } from "./CinematicRenderer.js";

export class HybridRenderer {
  constructor(canvas, assets = null) {
    this.canvas = canvas;
    this.assets = assets;
    this.mode = "webgl";
    this.renderErrors = 0;
    this.safeMode = false;
    try {
      this.renderer = new CinematicRenderer(canvas, assets);
    } catch (error) {
      console.warn("WebGL renderer unavailable; using compatibility renderer.", error);
      this.mode = "canvas";
      this.renderer = new Raycaster(canvas, assets);
    }
  }

  setAssets(assets) {
    this.assets = assets;
    this.renderer.setAssets?.(assets);
  }

  setQualityProfile(profile) {
    this.renderer.setQualityProfile?.(profile);
  }

  resize(width, height) {
    this.renderer.resize(width, height);
  }

  enableSafeMode(error = null) {
    this.safeMode = true;
    this.mode = this.mode === "canvas" ? "canvas" : "webgl-safe";
    this.renderer.enableSafeMode?.(error);
  }

  render(world, interpolation = 0) {
    try {
      this.renderer.render(world, interpolation);
      this.renderErrors = 0;
      return true;
    } catch (error) {
      this.renderErrors += 1;
      console.error("Renderer frame failed; activating safe mode.", error);
      this.enableSafeMode(error);
      // Jednou zkusíme snímek znovu bez postprocessu, stínů a těžkých modelů.
      // Další chyba se předá Game/Clock ochraně, ale další frame už zůstane naplánovaný.
      if (this.renderErrors === 1) {
        this.renderer.render(world, interpolation);
        return true;
      }
      throw error;
    }
  }
}
