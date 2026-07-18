import {
  ABILITY_ICONS,
  ASSET_MANIFEST,
  EFFECT_SPRITES,
  ENEMY_SPRITES,
  FLOOR_TEXTURES,
  ITEM_ICONS,
  PORTRAITS,
  WALL_TEXTURES,
  WEAPON_SPRITES,
  WORLD_SPRITES,
} from "../data/assets.js";

export class AssetManager {
  constructor(manifest = ASSET_MANIFEST) {
    this.manifest = manifest;
    this.images = new Map();
    this.failures = [];
    this.ready = false;
  }

  async loadAll() {
    if (typeof Image === "undefined") {
      this.ready = false;
      return { loaded: 0, failed: Object.keys(this.manifest).length, fallback: true };
    }

    this.failures = [];
    const results = await Promise.all(Object.entries(this.manifest).map(async ([key, descriptor]) => {
      try {
        const image = await this.#loadImage(descriptor.url);
        this.images.set(key, image);
        return true;
      } catch (error) {
        this.failures.push({ key, url: descriptor.url, error: String(error) });
        return false;
      }
    }));
    this.ready = this.images.size > 0;
    return {
      loaded: results.filter(Boolean).length,
      failed: results.filter((result) => !result).length,
      fallback: !this.ready,
    };
  }

  getFrame(sheetKey, column, row) {
    const descriptor = this.manifest[sheetKey];
    const image = this.images.get(sheetKey);
    if (!descriptor || !image) return null;
    const safeColumn = Math.max(0, Math.min(descriptor.columns - 1, Math.floor(column)));
    const safeRow = Math.max(0, Math.min(descriptor.rows - 1, Math.floor(row)));
    return {
      image,
      sx: safeColumn * descriptor.frameWidth,
      sy: safeRow * descriptor.frameHeight,
      sw: descriptor.frameWidth,
      sh: descriptor.frameHeight,
    };
  }

  getWallTexture(tileId) {
    const column = WALL_TEXTURES[tileId];
    return Number.isInteger(column) ? this.getFrame("walls", column, 0) : null;
  }

  getFloorTexture(material) {
    const column = FLOOR_TEXTURES[material] ?? FLOOR_TEXTURES.grass;
    return this.getFrame("floors", column, 0);
  }

  getWorldSprite(kind, frame = 0) {
    const row = WORLD_SPRITES[kind];
    return Number.isInteger(row) ? this.getFrame("world", frame % 4, row) : null;
  }

  getEnemySprite(kind, frame = 0) {
    const row = ENEMY_SPRITES[kind];
    return Number.isInteger(row) ? this.getFrame("enemies", frame % 12, row) : null;
  }

  getWeaponSprite(kind, frame = 0) {
    const row = WEAPON_SPRITES[kind] ?? WEAPON_SPRITES.sword;
    return this.getFrame("weapons", frame % 4, row);
  }

  getEffectSprite(kind, frame = 0) {
    const row = EFFECT_SPRITES[kind] ?? EFFECT_SPRITES.impact;
    return this.getFrame("effects", frame % 6, row);
  }

  getPortrait(memberId) {
    return PORTRAITS[memberId] || null;
  }

  getItemIcon(itemId) {
    const index = ITEM_ICONS[itemId];
    if (!Number.isInteger(index)) return null;
    const descriptor = this.manifest.icons;
    return this.getFrame("icons", index % descriptor.columns, Math.floor(index / descriptor.columns));
  }

  getAbilityIcon(abilityId) {
    const index = ABILITY_ICONS[abilityId];
    if (!Number.isInteger(index)) return null;
    const descriptor = this.manifest.icons;
    return this.getFrame("icons", index % descriptor.columns, Math.floor(index / descriptor.columns));
  }

  applyCssFrame(element, frame) {
    if (!element || !frame) return false;
    element.style.backgroundImage = `url("${frame.image.src}")`;
    element.style.backgroundPosition = `-${frame.sx}px -${frame.sy}px`;
    element.style.backgroundSize = "320px 160px";
    element.classList.add("atlas-icon");
    return true;
  }


  #loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Nelze načíst asset: ${url}`));
      image.src = url;
    });
  }
}
