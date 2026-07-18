const movingIntents = new Set(["advance", "retreat", "flank", "return"]);

export function getWorldFrame(entity, worldTime, flags = {}) {
  const loop = Math.floor(worldTime * 6) % 4;
  if (entity.kind === "lever") return flags[entity.interaction?.flag] ? 3 : loop;
  if (entity.kind === "trap") return flags[`trapDisarmed:${entity.trapId}`] ? 0 : loop % 2;
  if (entity.kind === "chest") return flags[`looted:${entity.id}`] ? 3 : loop;
  if (["torch", "fragment", "herb", "npc", "sign", "obelisk"].includes(entity.kind)) return loop;
  return 0;
}

export function getEnemyFrame({ state, brain, definition, worldTime }) {
  if (!state) return Math.floor(worldTime * 3) % 4;
  if (state.dead) return 11;
  if (state.hitFlash > 0) return 10;

  const attacking = state.cooldown > 0
    && (brain?.intent === "attack" || String(brain?.intent || "").startsWith("ability:"));
  if (attacking) return 8 + (Math.floor(worldTime * 10) % 2);

  const moving = movingIntents.has(brain?.intent)
    || (brain?.mode === "combat" && state.alerted && state.cooldown <= 0 && definition?.speed > 0);
  if (moving) return 4 + (Math.floor(worldTime * 7) % 4);
  return Math.floor(worldTime * 3) % 4;
}

export function getDeathTransitionFrame(state, worldTime, duration = 0.72) {
  if (!state?.dead || !Number.isFinite(state.deathStartedAt)) return null;
  const elapsed = worldTime - state.deathStartedAt;
  if (elapsed < 0 || elapsed > duration) return null;
  return elapsed < duration * 0.45 ? 10 : 11;
}

export function getEffectFrame(ttl, initialTtl = 0.9) {
  const progress = Math.max(0, Math.min(0.999, 1 - ttl / Math.max(0.001, initialTtl)));
  return Math.floor(progress * 6);
}
