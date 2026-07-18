import { LOOT_TABLES } from "../data/lootTables.js";

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed) {
  let state = hashString(seed) || 1;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function integer(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

export class LootManager {
  roll(tableId, seed) {
    const table = LOOT_TABLES[tableId];
    if (!table) return { gold: 0, items: [] };
    const random = createRandom(`${tableId}:${seed}`);
    const [goldMin, goldMax] = table.gold || [0, 0];
    const result = { gold: integer(random, goldMin, goldMax), items: [] };
    const pool = [...table.entries];

    for (let roll = 0; roll < table.rolls && pool.length; roll += 1) {
      const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
      let cursor = random() * totalWeight;
      let selectedIndex = pool.length - 1;
      for (let index = 0; index < pool.length; index += 1) {
        cursor -= pool[index].weight;
        if (cursor <= 0) {
          selectedIndex = index;
          break;
        }
      }
      const selected = pool[selectedIndex];
      const amount = integer(random, selected.min || 1, selected.max || selected.min || 1);
      const existing = result.items.find((entry) => entry.itemId === selected.itemId);
      if (existing) existing.amount += amount;
      else result.items.push({ itemId: selected.itemId, amount });
      if (table.unique) pool.splice(selectedIndex, 1);
    }
    return result;
  }
}
