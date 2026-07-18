import { clamp, distanceSquared } from "../utils/math.js";

const MINUTES_PER_DAY = 24 * 60;
const DEFAULT_START_MINUTE = 20 * 60 + 15;
const DEFAULT_TIME_SCALE = 2.5;

function keyFor(x, y) {
  return `${Math.floor(x)},${Math.floor(y)}`;
}

function normalizeCalendar(snapshot = null) {
  const totalMinutes = Number(snapshot?.totalMinutes);
  return {
    totalMinutes: Number.isFinite(totalMinutes) && totalMinutes >= 0 ? totalMinutes : DEFAULT_START_MINUTE,
    timeScale: clamp(Number(snapshot?.timeScale) || DEFAULT_TIME_SCALE, 0, 30),
  };
}

export class EnvironmentSystem {
  constructor(snapshot = null) {
    this.calendar = normalizeCalendar(snapshot?.calendar);
    this.tileOverrides = snapshot?.tileOverrides && typeof snapshot.tileOverrides === "object"
      ? structuredClone(snapshot.tileOverrides)
      : {};
    this.mechanisms = snapshot?.mechanisms && typeof snapshot.mechanisms === "object"
      ? structuredClone(snapshot.mechanisms)
      : {};
    this.traps = snapshot?.traps && typeof snapshot.traps === "object"
      ? structuredClone(snapshot.traps)
      : {};
    this.lastPlayerTile = snapshot?.lastPlayerTile && typeof snapshot.lastPlayerTile === "object"
      ? structuredClone(snapshot.lastPlayerTile)
      : null;
    this.detectionTimer = 0;
  }

  update(dt, world) {
    this.advanceMinutes(dt * this.calendar.timeScale);
    this.detectionTimer -= dt;
    if (this.detectionTimer <= 0) {
      this.detectionTimer = 0.3;
      this.#detectNearbyHazards(world);
    }
  }

  advanceMinutes(minutes) {
    const delta = Math.max(0, Number(minutes) || 0);
    this.calendar.totalMinutes += delta;
    return this.getClockView();
  }

  getClockView() {
    const total = Math.floor(this.calendar.totalMinutes);
    const day = Math.floor(total / MINUTES_PER_DAY) + 1;
    const minuteOfDay = ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    const hour = Math.floor(minuteOfDay / 60);
    const minute = minuteOfDay % 60;
    const phase = hour < 5 ? "noc"
      : hour < 8 ? "svítání"
        : hour < 18 ? "den"
          : hour < 21 ? "soumrak" : "noc";
    return {
      day,
      hour,
      minute,
      minuteOfDay,
      phase,
      label: `Den ${day} · ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    };
  }

  getDaylight(zone) {
    if (zone?.environment === "dungeon") return 0.18;
    const { minuteOfDay } = this.getClockView();
    const angle = ((minuteOfDay - 360) / MINUTES_PER_DAY) * Math.PI * 2;
    const solar = Math.sin(angle);
    return clamp(0.2 + Math.max(0, solar) * 0.8, 0.16, 1);
  }

  getMusic(zone) {
    const daylight = this.getDaylight(zone);
    return daylight < 0.38 && Array.isArray(zone?.nightMusic) ? zone.nightMusic : zone?.music;
  }

  getTile(zoneId, x, y, baseTile) {
    const zoneOverrides = this.tileOverrides[zoneId];
    const override = zoneOverrides?.[keyFor(x, y)];
    return Number.isFinite(Number(override)) ? Number(override) : baseTile;
  }

  setTile(zoneId, x, y, tile) {
    if (!this.tileOverrides[zoneId]) this.tileOverrides[zoneId] = {};
    this.tileOverrides[zoneId][keyFor(x, y)] = Number(tile) || 0;
  }

  getMechanismState(zoneId, entityId) {
    return this.mechanisms[`${zoneId}:${entityId}`] || null;
  }

  useDoor(entity, world) {
    const interaction = entity?.interaction;
    if (!interaction || interaction.type !== "door") return { ok: false, reason: "Toto nejsou použitelné dveře." };
    const stateKey = `${world.zoneId}:${entity.id}`;
    const state = this.mechanisms[stateKey] || { open: false, unlocked: false };

    if (!state.open) {
      if (interaction.requiresFlag && !world.flags[interaction.requiresFlag]) {
        return { ok: false, reason: interaction.lockedText || "Mechanismus dveří je uzamčen." };
      }
      if (interaction.requiresItem && world.getItemCount(interaction.requiresItem) < 1) {
        return { ok: false, reason: interaction.lockedText || "Chybí správný klíč." };
      }
      state.unlocked = true;
      state.open = true;
      this.setTile(world.zoneId, interaction.tileX, interaction.tileY, interaction.openTile ?? 0);
      this.mechanisms[stateKey] = state;
      entity.interaction.prompt = "Zavřít dveře";
      world.flags[`door:${entity.id}:open`] = true;
      world.notifications.push({ type: "environment", message: interaction.messageOpen || `${entity.name} se otevřely.` });
      return { ok: true, action: "opened", message: interaction.messageOpen || `${entity.name} se otevřely.` };
    }

    const playerTileX = Math.floor(world.player.x);
    const playerTileY = Math.floor(world.player.y);
    if (playerTileX === interaction.tileX && playerTileY === interaction.tileY) {
      return { ok: false, reason: "Dveře nelze zavřít, dokud stojíte v jejich průchodu." };
    }
    for (const other of world.entities) {
      if (!world.isEntityVisible(other)) continue;
      if (Math.floor(other.x) === interaction.tileX && Math.floor(other.y) === interaction.tileY) {
        return { ok: false, reason: "Průchod blokuje postava nebo tvor." };
      }
    }
    state.open = false;
    this.setTile(world.zoneId, interaction.tileX, interaction.tileY, interaction.closedTile ?? 2);
    this.mechanisms[stateKey] = state;
    entity.interaction.prompt = "Otevřít dveře";
    delete world.flags[`door:${entity.id}:open`];
    world.notifications.push({ type: "environment", message: `${entity.name} se zavřely.` });
    return { ok: true, action: "closed", message: `${entity.name} se zavřely.` };
  }

  useLever(entity, world) {
    const interaction = entity?.interaction;
    if (!interaction || interaction.type !== "lever") return { ok: false, reason: "Tento mechanismus nelze použít." };
    const stateKey = `${world.zoneId}:${entity.id}`;
    const state = this.mechanisms[stateKey] || { active: false };
    if (interaction.oneWay && state.active) return { ok: false, reason: "Páka je již ve spodní poloze." };

    state.active = interaction.oneWay ? true : !state.active;
    this.mechanisms[stateKey] = state;
    if (interaction.flag) world.flags[interaction.flag] = state.active;
    for (const target of interaction.targets || []) {
      const tile = state.active ? target.tile : (target.closedTile ?? 2);
      this.setTile(world.zoneId, target.tileX, target.tileY, tile);
    }
    if (interaction.event && interaction.target) world.emitQuestEvent(interaction.event, interaction.target, 1);
    world.notifications.push({ type: "environment", message: interaction.text || `${entity.name}: mechanismus se pohnul.` });
    return { ok: true, active: state.active, message: interaction.text || `${entity.name}: mechanismus se pohnul.` };
  }

  useSecret(entity, world) {
    const interaction = entity?.interaction;
    if (!interaction || interaction.type !== "secret") return { ok: false, reason: "Tato stěna se nezdá být pohyblivá." };
    const stateKey = `${world.zoneId}:${entity.id}`;
    const state = this.mechanisms[stateKey] || {};
    if (!state.discovered && !entity.discovered) return { ok: false, reason: "Na stěně nevidíte nic neobvyklého." };
    if (state.open) return { ok: false, reason: "Tajný průchod je již otevřený." };

    state.discovered = true;
    state.open = true;
    this.mechanisms[stateKey] = state;
    entity.discovered = true;
    entity.hidden = true;
    this.setTile(world.zoneId, interaction.tileX, interaction.tileY, interaction.openTile ?? 0);
    world.flags[`secret:${entity.id}:open`] = true;
    if (interaction.event && interaction.target) world.emitQuestEvent(interaction.event, interaction.target, 1);
    world.notifications.push({ type: "discovery", message: interaction.text || "Tajný průchod se otevřel." });
    world.awardExperience(35, "Objevení tajného průchodu");
    return { ok: true, action: "opened", message: interaction.text || "Tajný průchod se otevřel." };
  }

  disarmTrap(entity, world) {
    const trapId = entity?.trapId;
    const trap = world.zone.traps?.find((entry) => entry.id === trapId);
    if (!trap) return { ok: false, reason: "Pasti nelze rozpoznat mechanismus." };
    const state = this.#trapState(world.zoneId, trap.id);
    if (state.disarmed) return { ok: false, reason: "Past je již zneškodněná." };
    const skill = world.partyManager.getBestSkill("perception");
    if (skill < trap.disarmDifficulty) {
      this.#triggerTrap(trap, world, state, true);
      return { ok: false, triggered: true, reason: `Pokus selhal. Past vyžaduje Vnímání ${trap.disarmDifficulty}.` };
    }
    state.disarmed = true;
    state.detected = true;
    entity.hidden = true;
    world.flags[`trap:${trap.id}:disarmed`] = true;
    if (trap.eventTarget) world.emitQuestEvent("disarm", trap.eventTarget, 1);
    world.notifications.push({ type: "discovery", message: `${trap.name} byla zneškodněna.` });
    world.awardExperience(20 + trap.disarmDifficulty * 5, `Zneškodnění pasti: ${trap.name}`);
    return { ok: true, message: `${trap.name} byla zneškodněna.` };
  }

  handlePlayerPosition(world) {
    const tile = { zoneId: world.zoneId, x: Math.floor(world.player.x), y: Math.floor(world.player.y) };
    const previous = this.lastPlayerTile;
    this.lastPlayerTile = tile;
    if (previous && previous.zoneId === tile.zoneId && previous.x === tile.x && previous.y === tile.y) return;

    for (const trap of world.zone.traps || []) {
      if (trap.x !== tile.x || trap.y !== tile.y) continue;
      const state = this.#trapState(world.zoneId, trap.id);
      if (state.disarmed) continue;
      const clock = this.calendar.totalMinutes;
      if (state.triggered && trap.oneShot) continue;
      if (state.triggeredAt && trap.resetMinutes && clock - state.triggeredAt < trap.resetMinutes) continue;
      this.#triggerTrap(trap, world, state, false);
    }
  }

  isSecretAvailable(entity, world) {
    if (!entity?.secret) return true;
    const state = this.getMechanismState(world.zoneId, entity.id);
    return Boolean(entity.discovered || state?.discovered) && !state?.open;
  }

  isTrapAvailable(entity, world) {
    if (!entity?.trapId) return true;
    const state = this.#trapState(world.zoneId, entity.trapId);
    return Boolean(state.detected && !state.disarmed && !(state.triggered && world.zone.traps?.find((trap) => trap.id === entity.trapId)?.oneShot));
  }

  snapshot() {
    return {
      calendar: structuredClone(this.calendar),
      tileOverrides: structuredClone(this.tileOverrides),
      mechanisms: structuredClone(this.mechanisms),
      traps: structuredClone(this.traps),
      lastPlayerTile: structuredClone(this.lastPlayerTile),
    };
  }

  #detectNearbyHazards(world) {
    const perception = world.partyManager.getBestSkill("perception");
    for (const entity of world.entities) {
      if (entity.secret) {
        const stateKey = `${world.zoneId}:${entity.id}`;
        const state = this.mechanisms[stateKey] || {};
        if (state.open || state.discovered || perception < (entity.secret.detectDifficulty || 1)) continue;
        if (distanceSquared(world.player.x, world.player.y, entity.x, entity.y) > 2.4 ** 2) continue;
        state.discovered = true;
        this.mechanisms[stateKey] = state;
        entity.discovered = true;
        world.notifications.push({ type: "discovery", message: `${world.party.find((member) => (member.skills?.perception || 0) === perception)?.name || "Družina"} si všiml skryté spáry ve zdi.` });
      }
      if (entity.trapId) {
        const trap = world.zone.traps?.find((entry) => entry.id === entity.trapId);
        if (!trap) continue;
        const state = this.#trapState(world.zoneId, trap.id);
        if (state.disarmed || state.detected || perception < trap.detectDifficulty) continue;
        if (distanceSquared(world.player.x, world.player.y, entity.x, entity.y) > 2.6 ** 2) continue;
        state.detected = true;
        entity.hidden = false;
        world.notifications.push({ type: "warning", message: `Odhalena past: ${trap.name}.` });
      }
    }
  }

  #trapState(zoneId, trapId) {
    const key = `${zoneId}:${trapId}`;
    if (!this.traps[key]) this.traps[key] = { detected: false, disarmed: false, triggered: false, triggeredAt: null };
    return this.traps[key];
  }

  #triggerTrap(trap, world, state, fromFailedDisarm) {
    state.triggered = true;
    state.detected = true;
    state.triggeredAt = this.calendar.totalMinutes;
    const living = world.party.filter((member) => member.condition !== "dead" && member.condition !== "unconscious");
    const targets = trap.targets >= living.length ? living : living.slice(0, Math.max(1, trap.targets || 1));
    for (const member of targets) {
      world.combat.damageParty(member.id, trap.damage, trap.damageType || "physical", world, trap.name);
      if (trap.statusId) world.magic.applyPartyStatus(member.id, trap.statusId, trap.statusDuration || 6, 1, trap.id, trap.name);
    }
    world.notifications.push({
      type: "warning",
      message: `${fromFailedDisarm ? "Neúspěšné zneškodnění aktivovalo" : "Aktivována"} ${trap.name.toLowerCase()}.`,
    });
    const entity = world.entities.find((entry) => entry.trapId === trap.id);
    if (entity) entity.hidden = Boolean(trap.oneShot);
  }
}
