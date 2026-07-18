import { clamp } from "../utils/math.js";
import { getEnemyDefinition } from "../data/enemies.js";
import { ITEMS } from "../data/items.js";
import { getDeathTransitionFrame, getEffectFrame, getEnemyFrame, getWorldFrame } from "./AnimationState.js";

const FOV = Math.PI / 3;
const MAX_DISTANCE = 24;
const TEXTURE_SIZE = 64;

export class Raycaster {
  constructor(canvas, assets = null) {
    this.canvas = canvas;
    this.assets = assets;
    this.context = canvas.getContext("2d", { alpha: false });
    this.context.imageSmoothingEnabled = false;
    this.zBuffer = new Float32Array(canvas.width);
    this.textures = this.#createTextures();
    this.spriteCache = new Map();
  }

  setAssets(assets) {
    this.assets = assets;
  }

  resize(width, height) {
    const safeWidth = Math.max(320, Math.floor(width));
    const safeHeight = Math.max(180, Math.floor(height));
    if (this.canvas.width === safeWidth && this.canvas.height === safeHeight) return;
    this.canvas.width = safeWidth;
    this.canvas.height = safeHeight;
    this.context.imageSmoothingEnabled = false;
    this.zBuffer = new Float32Array(safeWidth);
  }

  render(world, interpolation = 0) {
    void interpolation;
    const { width, height } = this.canvas;
    const horizon = Math.floor(height * 0.5);
    this.#drawBackground(world, horizon);
    this.#drawWalls(world, horizon);
    this.#drawSprites(world, horizon);
    this.#drawProjectiles(world, horizon);
    this.#drawLighting(world);
    this.#drawCombatEffects(world, horizon);
    this.#drawWeapon(world);
    this.#drawVignette();
  }

  #drawBackground(world, horizon) {
    const { width, height } = this.canvas;
    const ctx = this.context;

    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, world.zone.skyTop);
    sky.addColorStop(1, world.zone.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, horizon);

    const floor = ctx.createLinearGradient(0, horizon, 0, height);
    floor.addColorStop(0, world.zone.floorFar);
    floor.addColorStop(1, world.zone.floorNear);
    ctx.fillStyle = floor;
    ctx.fillRect(0, horizon, width, height - horizon);
    this.#drawTexturedFloor(world, horizon);

    if (world.zone.environment === "dungeon") {
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#77707b";
      for (let y = 8; y < horizon; y += 18) ctx.fillRect(0, y, width, 1);
      ctx.globalAlpha = 1;
    } else if (world.daylight < 0.42) {
      ctx.fillStyle = "rgba(220,232,255,.72)";
      const starCount = Math.max(12, Math.floor(width / 20));
      for (let index = 0; index < starCount; index += 1) {
        const x = (index * 97 + 31) % width;
        const y = (index * 47 + 11) % Math.max(1, horizon - 6);
        ctx.fillRect(x, y, index % 5 === 0 ? 2 : 1, 1);
      }
    }

    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#d9c790";
    for (let y = horizon + 12; y < height; y += Math.max(4, Math.floor((y - horizon) * 0.16))) {
      ctx.fillRect(0, y, width, 1);
    }
    ctx.globalAlpha = 1;
  }

  #drawTexturedFloor(world, horizon) {
    const frame = this.assets?.getFloorTexture?.(world.getFloorMaterial?.(world.player.x, world.player.y) || (world.zone.environment === "dungeon" ? "crypt" : "grass"));
    if (!frame) return;

    const ctx = this.context;
    const { width, height } = this.canvas;
    const floorHeight = Math.max(1, height - horizon);
    ctx.save();
    ctx.globalAlpha = world.zone.environment === "dungeon" ? 0.58 : 0.44;
    for (let y = horizon + 2; y < height; y += 2) {
      const depth = (y - horizon) / floorHeight;
      const tileWidth = Math.max(18, Math.floor(24 + depth * 74));
      const sourceY = ((Math.floor(world.player.y * 17 + world.player.x * 9 + y * (0.48 + depth)) % frame.sh) + frame.sh) % frame.sh;
      const scroll = ((Math.floor(world.player.x * tileWidth * 0.72 + world.player.direction * tileWidth * 0.55) % tileWidth) + tileWidth) % tileWidth;
      for (let x = -tileWidth + scroll; x < width; x += tileWidth) {
        ctx.drawImage(frame.image, frame.sx, frame.sy + sourceY, frame.sw, 1, x, y, tileWidth + 1, 2);
      }
    }
    ctx.restore();
  }

  #drawWalls(world, horizon) {
    const { width, height } = this.canvas;
    const ctx = this.context;
    const player = world.player;
    const directionX = Math.cos(player.direction);
    const directionY = Math.sin(player.direction);
    const planeScale = Math.tan(FOV / 2);
    const planeX = -directionY * planeScale;
    const planeY = directionX * planeScale;

    for (let screenX = 0; screenX < width; screenX += 1) {
      const cameraX = (2 * screenX) / width - 1;
      const rayDirX = directionX + planeX * cameraX;
      const rayDirY = directionY + planeY * cameraX;

      let mapX = Math.floor(player.x);
      let mapY = Math.floor(player.y);

      const deltaDistX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX);
      const deltaDistY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY);

      let stepX;
      let stepY;
      let sideDistX;
      let sideDistY;

      if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (player.x - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1 - player.x) * deltaDistX;
      }

      if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (player.y - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1 - player.y) * deltaDistY;
      }

      let side = 0;
      let tile = 0;
      let iterations = 0;

      while (tile === 0 && iterations < 96) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }
        tile = world.getTile(mapX, mapY);
        iterations += 1;
      }

      let distance;
      if (side === 0) {
        distance = (mapX - player.x + (1 - stepX) / 2) / (rayDirX || 1e-9);
      } else {
        distance = (mapY - player.y + (1 - stepY) / 2) / (rayDirY || 1e-9);
      }
      distance = Math.max(0.001, Math.min(MAX_DISTANCE, distance));
      this.zBuffer[screenX] = distance;

      const lineHeight = Math.min(height * 4, Math.floor(height / distance));
      const drawStart = Math.max(0, Math.floor(horizon - lineHeight / 2));
      const drawEnd = Math.min(height - 1, Math.floor(horizon + lineHeight / 2));

      let wallX;
      if (side === 0) wallX = player.y + distance * rayDirY;
      else wallX = player.x + distance * rayDirX;
      wallX -= Math.floor(wallX);

      let textureX = Math.floor(wallX * TEXTURE_SIZE);
      if (side === 0 && rayDirX > 0) textureX = TEXTURE_SIZE - textureX - 1;
      if (side === 1 && rayDirY < 0) textureX = TEXTURE_SIZE - textureX - 1;

      const textureFrame = this.assets?.getWallTexture?.(tile);
      if (textureFrame) {
        ctx.drawImage(
          textureFrame.image,
          textureFrame.sx + textureX,
          textureFrame.sy,
          1,
          textureFrame.sh,
          screenX,
          drawStart,
          1,
          drawEnd - drawStart + 1,
        );
      } else {
        const texture = this.textures.get(tile) || this.textures.get(1);
        ctx.drawImage(texture, textureX, 0, 1, TEXTURE_SIZE, screenX, drawStart, 1, drawEnd - drawStart + 1);
      }

      const fogAmount = clamp(distance / MAX_DISTANCE, 0, 0.82);
      const sideShade = side === 1 ? 0.18 : 0;
      ctx.fillStyle = this.#withAlpha(world.zone.fog, fogAmount + sideShade);
      ctx.fillRect(screenX, drawStart, 1, drawEnd - drawStart + 1);
    }
  }

  #drawSprites(world, horizon) {
    const ctx = this.context;
    const { width, height } = this.canvas;
    const player = world.player;
    const directionX = Math.cos(player.direction);
    const directionY = Math.sin(player.direction);
    const planeScale = Math.tan(FOV / 2);
    const planeX = -directionY * planeScale;
    const planeY = directionX * planeScale;
    const inverseDet = 1 / (planeX * directionY - directionX * planeY);

    const sprites = world.entities
      .filter((entity) => world.isEntityVisible(entity) && entity.render !== false)
      .map((entity) => ({
        entity,
        distanceSquared: (entity.x - player.x) ** 2 + (entity.y - player.y) ** 2,
      }))
      .sort((a, b) => b.distanceSquared - a.distanceSquared);

    for (const item of sprites) {
      const spriteX = item.entity.x - player.x;
      const spriteY = item.entity.y - player.y;
      const transformX = inverseDet * (directionY * spriteX - directionX * spriteY);
      const transformY = inverseDet * (-planeY * spriteX + planeX * spriteY);
      if (transformY <= 0.08 || transformY > MAX_DISTANCE) continue;

      const screenCenterX = Math.floor((width / 2) * (1 + transformX / transformY));
      const baseScale = this.#spriteScale(item.entity.kind);
      const spriteHeight = Math.abs(Math.floor((height / transformY) * baseScale));
      const spriteWidth = Math.floor(spriteHeight * this.#spriteAspect(item.entity.kind));
      const drawStartY = Math.floor(horizon - spriteHeight / 2);
      const drawStartX = Math.floor(screenCenterX - spriteWidth / 2);
      const sprite = this.#getSprite(item.entity, world);

      for (let stripe = 0; stripe < spriteWidth; stripe += 1) {
        const screenX = drawStartX + stripe;
        if (screenX < 0 || screenX >= width) continue;
        if (transformY >= this.zBuffer[screenX]) continue;

        const sourceX = sprite.sx + Math.floor((stripe / Math.max(1, spriteWidth)) * sprite.sw);
        ctx.drawImage(sprite.image, sourceX, sprite.sy, 1, sprite.sh, screenX, drawStartY, 1, spriteHeight);

        const fogAmount = clamp(transformY / MAX_DISTANCE, 0, 0.72);
        if (fogAmount > 0.05) {
          ctx.fillStyle = this.#withAlpha(world.zone.fog, fogAmount);
          ctx.fillRect(screenX, drawStartY, 1, spriteHeight);
        }
      }

      if (item.entity.enemyId) {
        const state = world.combat.getEnemyState(item.entity.id);
        const target = world.combat.targetId === item.entity.id;
        if (state && !state.dead && (state.alerted || target)) {
          const definition = getEnemyDefinition(item.entity.enemyId);
          const maxHp = definition?.maxHp || Math.max(1, state.hp);
          const barWidth = Math.max(18, Math.min(62, spriteWidth));
          const barX = Math.floor(screenCenterX - barWidth / 2);
          const barY = Math.max(3, drawStartY - 7);
          ctx.fillStyle = target ? "#e8cf7b" : "#291410";
          ctx.fillRect(barX - 1, barY - 1, barWidth + 2, 5);
          ctx.fillStyle = "#35100d";
          ctx.fillRect(barX, barY, barWidth, 3);
          ctx.fillStyle = target ? "#d84935" : "#9f3027";
          ctx.fillRect(barX, barY, Math.round(barWidth * clamp(state.hp / maxHp, 0, 1)), 3);
        }
      }
    }
  }

  #drawProjectiles(world, horizon) {
    const ctx = this.context;
    for (const projectile of world.combat.projectiles) {
      const point = this.#project(world, projectile.x, projectile.y, horizon);
      if (!point || point.depth >= this.zBuffer[Math.max(0, Math.min(this.canvas.width - 1, Math.floor(point.x)))]) continue;
      const size = Math.max(4, Math.min(24, Math.floor(28 / point.depth)));
      const effectKind = this.#projectileEffectKind(projectile.kind);
      const frame = this.assets?.getEffectSprite?.(effectKind, Math.floor(world.time * 13) % 6);
      if (frame) {
        ctx.drawImage(frame.image, frame.sx, frame.sy, frame.sw, frame.sh, Math.floor(point.x - size / 2), Math.floor(point.y - size / 2), size, size);
      } else {
        ctx.fillStyle = effectKind === "fire" ? "#ef763d"
          : effectKind === "frost" ? "#8bd8ef"
            : effectKind === "venom" ? "#85aa48"
              : effectKind === "arrow" ? "#e3c98b" : "#b36dde";
        ctx.fillRect(Math.floor(point.x - size / 2), Math.floor(point.y - size / 2), size, size);
      }
    }
  }

  #drawCombatEffects(world, horizon) {
    const ctx = this.context;
    ctx.save();
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const effect of world.combat.effects) {
      if (effect.type === "partyDamage") {
        const alpha = clamp(effect.ttl * 0.28, 0, 0.24);
        ctx.fillStyle = `rgba(122,0,0,${alpha})`;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        continue;
      }
      const point = this.#project(world, effect.x, effect.y, horizon);
      if (!point) continue;
      const visualKind = effect.type === "lightning" ? "lightning"
        : effect.type === "healing" ? "heal"
          : effect.type === "miss" ? null : "impact";
      if (visualKind) {
        const initialTtl = effect.type === "lightning" ? 1.5 : effect.type === "healing" ? 1.1 : 0.9;
        const frame = this.assets?.getEffectSprite?.(visualKind, getEffectFrame(effect.ttl, initialTtl));
        const size = Math.max(18, Math.min(54, Math.floor(65 / Math.max(0.5, point.depth))));
        if (frame) ctx.drawImage(frame.image, frame.sx, frame.sy, frame.sw, frame.sh, Math.floor(point.x - size / 2), Math.floor(point.y - size / 2), size, size);
      }
      const lift = (1 - Math.min(1, effect.ttl)) * 18;
      ctx.fillStyle = effect.type === "critical" ? "#ffe18a"
        : effect.type === "miss" ? "#d8d2bd"
          : effect.type === "lightning" ? "#c6a7ff"
            : effect.type === "healing" ? "#8bd889" : "#ff8f70";
      ctx.fillText(String(effect.value), Math.floor(point.x), Math.floor(point.y - 22 - lift));
    }
    ctx.restore();
  }

  #drawWeapon(world) {
    const member = world.partyManager.activeMember;
    if (!member || member.condition === "dead" || member.condition === "unconscious") return;
    const equipment = world.inventoryManager.getEquipment(member.id);
    const item = ITEMS[equipment.mainHand] || null;
    const skill = item?.skill || "sword";
    const weaponKind = skill === "bow" ? "bow" : skill === "staff" ? "staff" : skill === "mace" ? "mace" : "sword";
    const cooldown = world.combat.getMemberCooldown(member.id);
    const frameIndex = cooldown <= 0.04 ? 0 : cooldown > 0.8 ? 1 : cooldown > 0.42 ? 2 : 3;
    const frame = this.assets?.getWeaponSprite?.(weaponKind, frameIndex);
    if (!frame) return;

    const { width, height } = this.canvas;
    const scale = Math.max(1.75, height / 205);
    const drawWidth = Math.floor(frame.sw * scale);
    const drawHeight = Math.floor(frame.sh * scale);
    const bob = world.combat.inCombat ? Math.sin(world.time * 7.5) * 2 : Math.sin(world.time * 2.2) * 1.2;
    const drawX = Math.floor(width - drawWidth * 0.82);
    const drawY = Math.floor(height - drawHeight * 0.9 + bob);
    this.context.drawImage(frame.image, frame.sx, frame.sy, frame.sw, frame.sh, drawX, drawY, drawWidth, drawHeight);
  }

  #projectileEffectKind(kind) {
    if (["playerArrow", "abilityArrow", "enemyArrow"].includes(kind)) return "arrow";
    if (kind === "spellFire") return "fire";
    if (kind === "spellFrost") return "frost";
    if (kind === "enemyVenom") return "venom";
    if (String(kind).toLowerCase().includes("echo")) return "echo";
    if (String(kind).toLowerCase().includes("bolt") || String(kind).toLowerCase().includes("lightning")) return "lightning";
    return "arcane";
  }

  #project(world, x, y, horizon) {
    const player = world.player;
    const directionX = Math.cos(player.direction);
    const directionY = Math.sin(player.direction);
    const planeScale = Math.tan(FOV / 2);
    const planeX = -directionY * planeScale;
    const planeY = directionX * planeScale;
    const inverseDet = 1 / (planeX * directionY - directionX * planeY);
    const spriteX = x - player.x;
    const spriteY = y - player.y;
    const transformX = inverseDet * (directionY * spriteX - directionX * spriteY);
    const transformY = inverseDet * (-planeY * spriteX + planeX * spriteY);
    if (transformY <= 0.08 || transformY > MAX_DISTANCE) return null;
    return {
      x: (this.canvas.width / 2) * (1 + transformX / transformY),
      y: horizon,
      depth: transformY,
    };
  }

  #drawLighting(world) {
    const daylight = world.daylight;
    const dungeon = world.zone.environment === "dungeon";
    const darkness = dungeon ? 0.22 : clamp((1 - daylight) * 0.62, 0, 0.58);
    if (darkness <= 0.01) return;
    this.context.fillStyle = dungeon
      ? `rgba(9,7,14,${darkness})`
      : `rgba(7,12,27,${darkness})`;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  #drawVignette() {
    const { width, height } = this.canvas;
    const gradient = this.context.createRadialGradient(width / 2, height / 2, height * 0.16, width / 2, height / 2, width * 0.67);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,.46)");
    this.context.fillStyle = gradient;
    this.context.fillRect(0, 0, width, height);
  }

  #createTextures() {
    const textures = new Map();
    textures.set(1, this.#buildTexture((ctx) => {
      ctx.fillStyle = "#605a50";
      ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
      for (let y = 0; y < TEXTURE_SIZE; y += 16) {
        const offset = (y / 16) % 2 ? 8 : 0;
        for (let x = -offset; x < TEXTURE_SIZE; x += 16) {
          ctx.fillStyle = "#302d29";
          ctx.fillRect(x, y, 1, 16);
          ctx.fillRect(x, y, 16, 1);
          ctx.fillStyle = (x + y) % 32 ? "#6f685c" : "#777064";
          ctx.fillRect(x + 2, y + 2, 12, 12);
        }
      }
    }));

    textures.set(2, this.#buildTexture((ctx) => {
      ctx.fillStyle = "#594126";
      ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
      for (let x = 0; x < TEXTURE_SIZE; x += 8) {
        ctx.fillStyle = x % 16 === 0 ? "#3b2918" : "#795632";
        ctx.fillRect(x, 0, 2, TEXTURE_SIZE);
      }
      ctx.fillStyle = "rgba(226,178,102,.15)";
      for (let y = 7; y < TEXTURE_SIZE; y += 13) ctx.fillRect(0, y, TEXTURE_SIZE, 1);
    }));

    textures.set(3, this.#buildTexture((ctx) => {
      ctx.fillStyle = "#253b25";
      ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
      for (let y = 0; y < TEXTURE_SIZE; y += 4) {
        for (let x = (y % 8); x < TEXTURE_SIZE; x += 8) {
          ctx.fillStyle = (x + y) % 16 === 0 ? "#4b6d39" : "#34502e";
          ctx.fillRect(x, y, 5, 4);
        }
      }
    }));

    textures.set(4, this.#buildTexture((ctx) => {
      ctx.fillStyle = "#343238";
      ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
      for (let y = 0; y < TEXTURE_SIZE; y += 12) {
        const offset = (y / 12) % 2 ? 9 : 0;
        for (let x = -offset; x < TEXTURE_SIZE; x += 18) {
          ctx.fillStyle = "#1d1c21";
          ctx.fillRect(x, y, 1, 12);
          ctx.fillRect(x, y, 18, 1);
          ctx.fillStyle = (x + y) % 36 ? "#454249" : "#514b57";
          ctx.fillRect(x + 2, y + 2, 14, 8);
        }
      }
      ctx.fillStyle = "rgba(118,94,139,.16)";
      for (let y = 5; y < TEXTURE_SIZE; y += 19) ctx.fillRect(0, y, TEXTURE_SIZE, 1);
    }));

    textures.set(5, this.#buildTexture((ctx) => {
      ctx.fillStyle = "#2b2533";
      ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
      ctx.strokeStyle = "#7d6091";
      ctx.lineWidth = 2;
      for (let y = 8; y < TEXTURE_SIZE; y += 16) {
        ctx.beginPath();
        ctx.arc(TEXTURE_SIZE / 2, y, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }));

    return textures;
  }

  #buildTexture(draw) {
    const canvas = document.createElement("canvas");
    canvas.width = TEXTURE_SIZE;
    canvas.height = TEXTURE_SIZE;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.imageSmoothingEnabled = false;
    draw(ctx);
    return canvas;
  }

  #getSprite(entity, world) {
    const state = entity.enemyId ? world.combat.getEnemyState(entity.id) : null;
    const definition = entity.enemyId ? getEnemyDefinition(entity.enemyId) : null;
    const deathFrame = getDeathTransitionFrame(state, world.time);
    if (deathFrame !== null && definition?.kind) {
      const frame = this.assets?.getEnemySprite?.(definition.kind, deathFrame);
      if (frame) return frame;
    }

    if (entity.enemyId && entity.kind !== "corpse") {
      const brain = world.combat.ai.getBrainView(entity.id);
      const frameIndex = getEnemyFrame({ state, brain, definition, worldTime: world.time });
      const frame = this.assets?.getEnemySprite?.(definition?.kind || entity.kind, frameIndex);
      if (frame) return frame;
    }

    const worldFrame = getWorldFrame(entity, world.time, world.flags);
    const external = this.assets?.getWorldSprite?.(entity.kind, worldFrame);
    if (external) return external;

    const animatedFrame = ["torch", "fragment", "herb", "enemyHound", "enemyShade", "enemyWarden"].includes(entity.kind) ? Math.floor(world.time * 7) % 2 : 0;
    const key = `${entity.kind}:${animatedFrame}`;
    if (!this.spriteCache.has(key)) {
      const canvas = document.createElement("canvas");
      canvas.width = 48;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      this.#drawSprite(ctx, entity.kind, animatedFrame);
      this.spriteCache.set(key, canvas);
    }
    const canvas = this.spriteCache.get(key);
    return { image: canvas, sx: 0, sy: 0, sw: canvas.width, sh: canvas.height };
  }

  #drawSprite(ctx, kind, frame) {
    const pixel = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    };

    if (kind === "npc") {
      pixel(18, 5, 12, 13, "#d7b28b");
      pixel(16, 3, 16, 6, "#5e4a2d");
      pixel(12, 18, 24, 30, "#334b65");
      pixel(8, 22, 8, 24, "#334b65");
      pixel(32, 22, 8, 24, "#334b65");
      pixel(15, 48, 8, 14, "#2a241d");
      pixel(25, 48, 8, 14, "#2a241d");
      pixel(20, 10, 3, 2, "#17120e");
      pixel(27, 10, 3, 2, "#17120e");
      pixel(19, 25, 10, 3, "#b8a065");
      return;
    }

    if (kind === "obelisk") {
      pixel(18, 4, 12, 7, "#c5c0b7");
      pixel(14, 11, 20, 38, "#777d82");
      pixel(18, 15, 12, 28, "#9ba2a4");
      pixel(10, 49, 28, 8, "#45494c");
      pixel(19, 23, 10, 12, "#6bb8d5");
      pixel(21, 25, 6, 8, "#c2f1ff");
      return;
    }

    if (kind === "sign") {
      pixel(22, 16, 5, 45, "#4d321c");
      pixel(7, 10, 35, 13, "#805932");
      pixel(10, 13, 29, 7, "#a07847");
      pixel(12, 15, 20, 2, "#352315");
      return;
    }

    if (kind === "torch") {
      pixel(22, 25, 5, 36, "#6b4020");
      pixel(17, 17, 15, 12, frame ? "#f2b233" : "#e87c24");
      pixel(20, 9, 9, 16, frame ? "#fff0a3" : "#ffd45c");
      pixel(23, 4, 5, 12, "#fff6c7");
      return;
    }

    if (kind === "fragment") {
      pixel(22, 15, 5, 8, "#e8fbff");
      pixel(16, 22, 17, 27, frame ? "#67cce8" : "#4ba7d3");
      pixel(21, 24, 7, 21, frame ? "#d8fbff" : "#a7eaff");
      pixel(13, 49, 23, 5, "#514d58");
      return;
    }

    if (kind === "satchel") {
      pixel(13, 27, 24, 24, "#6c4225");
      pixel(16, 24, 18, 8, "#8f6137");
      pixel(21, 34, 7, 7, "#c69b54");
      pixel(10, 20, 4, 28, "#3c2618");
      pixel(34, 20, 4, 28, "#3c2618");
      return;
    }

    if (kind === "herb") {
      pixel(23, 32, 3, 25, "#38582f");
      pixel(13, 28, 12, 8, frame ? "#6f9cc7" : "#577fae");
      pixel(25, 24, 12, 9, frame ? "#8eb8dc" : "#6c96bd");
      pixel(16, 39, 10, 7, "#83aecd");
      pixel(25, 42, 10, 7, "#719abd");
      pixel(18, 57, 14, 3, "#283921");
      return;
    }

    if (kind === "key") {
      pixel(18, 23, 12, 12, "#d8c070");
      pixel(22, 33, 5, 24, "#aa8a43");
      pixel(26, 47, 10, 5, "#aa8a43");
      pixel(31, 43, 5, 9, "#aa8a43");
      pixel(21, 26, 6, 6, "#312b22");
      return;
    }

    if (kind === "lever") {
      pixel(20, 34, 10, 24, "#4a4643");
      pixel(13, 49, 24, 9, "#292725");
      pixel(23, 15, 4, 23, "#8d6b3e");
      pixel(19, 11, 12, 9, "#b58a4d");
      return;
    }

    if (kind === "trap") {
      pixel(9, 46, 30, 7, "#4b4540");
      pixel(13, 43, 22, 3, "#8c6b5a");
      pixel(18, 38, 12, 5, "#aa4950");
      return;
    }

    if (kind === "chest") {
      pixel(8, 26, 32, 27, "#49301f");
      pixel(10, 19, 28, 13, "#76502e");
      pixel(9, 28, 30, 4, "#9b7543");
      pixel(21, 34, 7, 9, "#d2aa55");
      pixel(7, 52, 34, 5, "#251b13");
      return;
    }

    if (kind === "crate") {
      pixel(9, 22, 30, 34, "#715033");
      pixel(12, 25, 24, 28, "#8c6842");
      pixel(9, 34, 30, 4, "#3f2b1d");
      pixel(22, 22, 4, 34, "#3f2b1d");
      return;
    }

    if (kind === "stall") {
      pixel(7, 23, 34, 8, "#6d4527");
      pixel(10, 31, 28, 24, "#4d3321");
      pixel(8, 10, 32, 13, "#8f3434");
      pixel(8, 10, 8, 13, "#d0b06c");
      pixel(24, 10, 8, 13, "#d0b06c");
      pixel(12, 36, 8, 10, "#4f7d59");
      pixel(26, 35, 8, 12, "#7b5b9a");
      return;
    }

    if (kind === "enemyHound") {
      pixel(8, 30, 30, 18, "#394451");
      pixel(30, 23, 13, 16, "#4c5968");
      pixel(37, 26, 3, 3, frame ? "#bff4ff" : "#66c7e3");
      pixel(10, 45, 6, 15, "#202932");
      pixel(29, 45, 6, 15, "#202932");
      pixel(4, 31, 9, 4, "#26303a");
      return;
    }

    if (kind === "enemyCrawler") {
      pixel(9, 31, 30, 20, "#50603c");
      pixel(15, 22, 20, 17, "#68794b");
      pixel(18, 27, 4, 3, "#d9c85b");
      pixel(29, 27, 4, 3, "#d9c85b");
      pixel(5, 47, 11, 5, "#303b27");
      pixel(33, 47, 11, 5, "#303b27");
      return;
    }

    if (kind === "enemyRaider") {
      pixel(18, 7, 12, 12, "#b88b67");
      pixel(15, 4, 18, 7, "#4f3326");
      pixel(12, 18, 24, 31, "#6d3029");
      pixel(8, 22, 7, 27, "#3c2720");
      pixel(34, 18, 4, 34, "#7c5a31");
      pixel(37, 18, 5, 34, "#b48b51");
      pixel(15, 49, 8, 13, "#2b221c");
      pixel(26, 49, 8, 13, "#2b221c");
      return;
    }

    if (kind === "enemySentinel") {
      pixel(15, 4, 18, 13, "#737a7d");
      pixel(11, 17, 26, 34, "#5b6063");
      pixel(5, 21, 8, 29, "#42474a");
      pixel(36, 21, 8, 29, "#42474a");
      pixel(18, 8, 4, 3, "#72d7e7");
      pixel(27, 8, 4, 3, "#72d7e7");
      pixel(16, 51, 8, 12, "#34383a");
      pixel(27, 51, 8, 12, "#34383a");
      return;
    }

    if (kind === "enemyShade") {
      pixel(14, 8, 20, 14, frame ? "#69547d" : "#4e3c64");
      pixel(10, 20, 28, 31, "#352a45");
      pixel(5, 28, 12, 8, "#5f4a79");
      pixel(31, 28, 12, 8, "#5f4a79");
      pixel(18, 12, 4, 3, "#d5a9ef");
      pixel(27, 12, 4, 3, "#d5a9ef");
      pixel(16, 51, 7, 10, "#241d31");
      pixel(27, 51, 7, 10, "#241d31");
      return;
    }

    if (kind === "enemyWarden") {
      pixel(14, 3, 20, 17, "#2d2638");
      pixel(9, 18, 30, 37, "#493657");
      pixel(4, 20, 9, 34, "#2a2033");
      pixel(36, 20, 9, 34, "#2a2033");
      pixel(18, 9, 4, 3, frame ? "#ff9fec" : "#b96ed6");
      pixel(27, 9, 4, 3, frame ? "#ff9fec" : "#b96ed6");
      pixel(18, 28, 13, 13, "#764f8d");
      pixel(21, 31, 7, 7, "#d9a4ed");
      return;
    }

    if (kind === "corpse") {
      pixel(7, 45, 35, 10, "#39322d");
      pixel(12, 39, 22, 9, "#5b4b42");
      pixel(34, 42, 8, 6, "#202020");
      return;
    }

    pixel(16, 12, 16, 40, "#c83434");
  }

  #spriteScale(kind) {
    if (kind === "torch") return 0.72;
    if (kind === "sign") return 0.8;
    if (kind === "fragment") return 0.62;
    if (kind === "satchel") return 0.55;
    if (kind === "herb") return 0.5;
    if (kind === "key") return 0.42;
    if (kind === "lever") return 0.7;
    if (kind === "trap") return 0.35;
    if (kind === "chest" || kind === "crate") return 0.58;
    if (kind === "stall") return 0.85;
    if (kind === "corpse") return 0.4;
    if (kind === "enemyHound" || kind === "enemyCrawler" || kind === "enemyShade") return 0.72;
    if (kind === "enemySentinel") return 1.08;
    if (kind === "enemyWarden") return 1.2;
    return 1;
  }

  #spriteAspect(kind) {
    if (kind === "sign") return 0.78;
    if (kind === "torch") return 0.55;
    if (kind === "fragment") return 0.62;
    if (kind === "satchel") return 0.8;
    if (kind === "herb") return 0.72;
    if (kind === "key") return 0.62;
    if (kind === "lever") return 0.7;
    if (kind === "trap") return 1.0;
    if (kind === "chest" || kind === "crate") return 1.0;
    if (kind === "stall") return 1.05;
    if (kind === "corpse") return 1.4;
    if (kind === "enemyHound" || kind === "enemyCrawler" || kind === "enemyShade") return 1.05;
    if (kind === "enemySentinel") return 0.82;
    if (kind === "enemyWarden") return 0.9;
    return 0.75;
  }

  #withAlpha(hex, alpha) {
    const clean = hex.replace("#", "");
    const value = Number.parseInt(clean.length === 3 ? clean.split("").map((part) => part + part).join("") : clean, 16);
    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;
    return `rgba(${red},${green},${blue},${clamp(alpha, 0, 1)})`;
  }
}
