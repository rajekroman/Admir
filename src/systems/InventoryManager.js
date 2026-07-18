import { EQUIPMENT_SLOTS, ITEMS, RARITIES, STARTER_BACKPACK, STARTER_LOADOUT, isEquipment } from "../data/items.js";

const safeInteger = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
};

const emptyEquipment = () => Object.fromEntries(Object.keys(EQUIPMENT_SLOTS).map((slotId) => [slotId, null]));

export class InventoryManager {
  constructor({ snapshot = null, partyManager = null, initializeStarter = false } = {}) {
    this.stacks = {};
    this.equipment = {};
    if (partyManager) this.#ensureMembers(partyManager);
    if (snapshot) this.restore(snapshot, partyManager);
    else if (initializeStarter && partyManager) this.initializeStarterLoadout(partyManager);
  }

  initializeStarterLoadout(partyManager) {
    this.stacks = {};
    this.#ensureMembers(partyManager);
    for (const [memberId, slots] of Object.entries(STARTER_LOADOUT)) {
      if (!this.equipment[memberId]) this.equipment[memberId] = emptyEquipment();
      for (const [slotId, itemId] of Object.entries(slots)) {
        if (ITEMS[itemId] && EQUIPMENT_SLOTS[slotId]) this.equipment[memberId][slotId] = itemId;
      }
    }
    for (const [itemId, count] of Object.entries(STARTER_BACKPACK)) this.add(itemId, count, partyManager, { ignoreCapacity: true });
  }

  getCount(itemId) {
    return this.stacks[itemId] || 0;
  }

  getUsedSlots() {
    return Object.values(this.stacks).filter((count) => count > 0).length;
  }

  getMaxSlots() {
    return 36;
  }

  getWeight() {
    return Number(Object.entries(this.stacks)
      .reduce((sum, [itemId, count]) => sum + (ITEMS[itemId]?.weight || 0) * count, 0)
      .toFixed(2));
  }

  getEquippedWeight() {
    let total = 0;
    for (const slots of Object.values(this.equipment)) {
      for (const itemId of Object.values(slots)) total += ITEMS[itemId]?.weight || 0;
    }
    return Number(total.toFixed(2));
  }

  getCapacity(partyManager) {
    const might = partyManager?.members?.reduce((sum, member) => sum + (member.attributes?.might || 0), 0) || 0;
    const athletics = partyManager?.members?.reduce((sum, member) => sum + (member.skills?.athletics || 0), 0) || 0;
    return Math.round(42 + might * 1.45 + athletics * 1.8);
  }

  canAdd(itemId, amount, partyManager) {
    const definition = ITEMS[itemId];
    const quantity = safeInteger(amount);
    if (!definition || quantity < 1) return { ok: false, reason: "Neplatný předmět." };
    const existing = this.getCount(itemId);
    if (existing + quantity > definition.stackLimit) return { ok: false, reason: `Do jednoho stohu lze uložit nejvýše ${definition.stackLimit} kusů.` };
    if (!existing && this.getUsedSlots() >= this.getMaxSlots()) return { ok: false, reason: "Batoh nemá volný slot." };
    const futureWeight = this.getWeight() + definition.weight * quantity;
    if (futureWeight > this.getCapacity(partyManager) + 0.001) return { ok: false, reason: "Družina by překročila nosnost." };
    return { ok: true };
  }

  add(itemId, amount = 1, partyManager = null, { ignoreCapacity = false } = {}) {
    const quantity = safeInteger(amount);
    const definition = ITEMS[itemId];
    if (!definition || quantity < 1) return { ok: false, reason: "Neplatný předmět.", added: 0 };
    if (!ignoreCapacity) {
      const validation = this.canAdd(itemId, quantity, partyManager);
      if (!validation.ok) return { ...validation, added: 0 };
    }
    const limit = definition.stackLimit;
    const current = this.getCount(itemId);
    const added = Math.max(0, Math.min(quantity, limit - current));
    if (!added) return { ok: false, reason: "Stoh je plný.", added: 0 };
    this.stacks[itemId] = current + added;
    return { ok: added === quantity, reason: added === quantity ? null : "Část předmětů se nevešla.", added };
  }

  remove(itemId, amount = 1) {
    const quantity = safeInteger(amount);
    const current = this.getCount(itemId);
    if (!ITEMS[itemId] || quantity < 1 || current < quantity) return false;
    const next = current - quantity;
    if (next > 0) this.stacks[itemId] = next;
    else delete this.stacks[itemId];
    return true;
  }

  getEquipment(memberId) {
    return { ...(this.equipment[memberId] || emptyEquipment()) };
  }

  getEquippedItems(memberId) {
    return Object.entries(this.getEquipment(memberId)).map(([slotId, itemId]) => ({
      slotId,
      slot: EQUIPMENT_SLOTS[slotId],
      itemId,
      item: itemId ? ITEMS[itemId] : null,
    }));
  }

  getBonuses(memberId) {
    const bonuses = {
      attack: 0,
      defense: 0,
      initiative: 0,
      spellPower: 0,
      healingPower: 0,
      criticalChance: 0,
      maxHp: 0,
      maxMp: 0,
      resistances: { fire: 0, frost: 0, shock: 0, poison: 0, mind: 0, spirit: 0 },
    };
    for (const { item } of this.getEquippedItems(memberId)) {
      if (!item) continue;
      const modifiers = item.modifiers || {};
      for (const key of ["attack", "defense", "initiative", "spellPower", "healingPower", "criticalChance", "maxHp", "maxMp"]) {
        bonuses[key] += Number(modifiers[key]) || 0;
      }
      for (const resistanceId of Object.keys(bonuses.resistances)) {
        bonuses.resistances[resistanceId] += Number(modifiers[`${resistanceId}Resistance`]) || 0;
      }
    }
    return bonuses;
  }

  validateEquip(memberId, itemId, partyManager) {
    const item = ITEMS[itemId];
    const member = partyManager?.getMember(memberId);
    if (!member || !item || !isEquipment(item)) return { ok: false, reason: "Předmět nelze vybavit." };
    if (this.getCount(itemId) < 1) return { ok: false, reason: "Předmět není v batohu." };
    if (item.allowedClasses && !item.allowedClasses.includes(member.classId)) return { ok: false, reason: `${member.name} tento typ předmětu nemůže používat.` };
    if (item.skill && item.minSkill && (member.skills?.[item.skill] || 0) < item.minSkill) {
      return { ok: false, reason: `Je vyžadována dovednost ${item.skill} na úrovni ${item.minSkill}.` };
    }
    if (item.slot === "offHand") {
      const mainHandId = this.equipment[memberId]?.mainHand;
      if (ITEMS[mainHandId]?.twoHanded) return { ok: false, reason: "Dvoruční zbraň blokuje vedlejší ruku." };
    }
    return { ok: true };
  }

  equip(memberId, itemId, partyManager) {
    const validation = this.validateEquip(memberId, itemId, partyManager);
    if (!validation.ok) return validation;
    const item = ITEMS[itemId];
    this.#ensureMembers(partyManager);
    const slots = this.equipment[memberId];
    const returned = [];

    if (!this.remove(itemId, 1)) return { ok: false, reason: "Předmět se nepodařilo odebrat z batohu." };

    const returnSlot = (slotId) => {
      const oldItemId = slots[slotId];
      if (!oldItemId) return;
      this.add(oldItemId, 1, partyManager, { ignoreCapacity: true });
      returned.push(oldItemId);
      slots[slotId] = null;
    };

    returnSlot(item.slot);
    if (item.twoHanded) returnSlot("offHand");
    slots[item.slot] = itemId;
    return { ok: true, itemId, slotId: item.slot, returned };
  }

  unequip(memberId, slotId, partyManager) {
    if (!EQUIPMENT_SLOTS[slotId]) return { ok: false, reason: "Neplatný slot." };
    const itemId = this.equipment[memberId]?.[slotId];
    if (!itemId) return { ok: false, reason: "Slot je prázdný." };
    const validation = this.canAdd(itemId, 1, partyManager);
    if (!validation.ok) return validation;
    this.equipment[memberId][slotId] = null;
    this.add(itemId, 1, partyManager, { ignoreCapacity: true });
    return { ok: true, itemId };
  }

  use(itemId, memberId, partyManager) {
    const item = ITEMS[itemId];
    const member = partyManager?.getMember(memberId);
    if (!item || item.category !== "consumable" || !member) return { ok: false, reason: "Předmět nelze použít." };
    if (this.getCount(itemId) < 1) return { ok: false, reason: "Předmět není v batohu." };

    let changed = false;
    const messages = [];
    for (const effect of item.effects || []) {
      if (effect.type === "heal") {
        const before = member.hp;
        partyManager.heal(memberId, effect.amount);
        const restored = Math.max(0, member.hp - before);
        changed = restored > 0 || changed;
        messages.push(restored > 0 ? `${member.name} obnovil ${restored} životů.` : `${member.name} má již plné životy.`);
      } else if (effect.type === "mana") {
        const restored = partyManager.restoreMana(memberId, effect.amount);
        changed = restored > 0 || changed;
        messages.push(`${member.name} obnovil ${restored} many.`);
      } else if (effect.type === "revive") {
        const restored = partyManager.revive(memberId, effect.amount);
        changed = restored > 0 || changed;
        messages.push(restored > 0 ? `${member.name} se znovu postavil na nohy.` : `${member.name} tonikum nepotřebuje.`);
      } else if (effect.type === "cleanse") {
        messages.push("Postava nyní nemá stav, který by protijed odstranil.");
      } else if (effect.type === "ration") {
        messages.push("Cestovní dávku lze spotřebovat pouze při odpočinku.");
      }
    }

    const rationOnly = (item.effects || []).every((effect) => effect.type === "ration");
    if (rationOnly) return { ok: false, reason: messages[0] || "Předmět nyní nelze použít." };
    if (!changed) return { ok: false, reason: messages.join(" ") || "Předmět neměl žádný účinek." };
    this.remove(itemId, 1);
    return { ok: true, messages };
  }

  consumeRation() {
    return this.remove("travel-ration", 1);
  }

  getList(partyManager) {
    return Object.entries(this.stacks)
      .filter(([, count]) => count > 0)
      .map(([itemId, count]) => {
        const definition = ITEMS[itemId];
        return {
          itemId,
          count,
          definition,
          totalWeight: Number((definition.weight * count).toFixed(2)),
        };
      })
      .sort((a, b) => {
        const categoryOrder = { weapon: 0, shield: 1, armor: 2, helmet: 3, boots: 4, accessory: 5, consumable: 6, material: 7, treasure: 8, quest: 9 };
        return (categoryOrder[a.definition.category] ?? 99) - (categoryOrder[b.definition.category] ?? 99)
          || (RARITIES[b.definition.rarity]?.sort || 0) - (RARITIES[a.definition.rarity]?.sort || 0)
          || a.definition.name.localeCompare(b.definition.name, "cs");
      });
  }

  snapshot() {
    return { stacks: structuredClone(this.stacks), equipment: structuredClone(this.equipment) };
  }

  restore(snapshot, partyManager) {
    this.stacks = {};
    this.equipment = {};
    this.#ensureMembers(partyManager);

    const rawStacks = snapshot?.stacks && typeof snapshot.stacks === "object" ? snapshot.stacks : snapshot;
    if (rawStacks && typeof rawStacks === "object") {
      for (const [itemId, entry] of Object.entries(rawStacks)) {
        if (!ITEMS[itemId]) continue;
        const count = typeof entry === "object" ? safeInteger(entry?.count) : safeInteger(entry);
        if (count > 0) this.stacks[itemId] = Math.min(count, ITEMS[itemId].stackLimit);
      }
    }

    if (snapshot?.equipment && typeof snapshot.equipment === "object") {
      for (const member of partyManager?.members || []) {
        const rawSlots = snapshot.equipment[member.id];
        for (const slotId of Object.keys(EQUIPMENT_SLOTS)) {
          const itemId = rawSlots?.[slotId];
          if (ITEMS[itemId]?.slot === slotId) this.equipment[member.id][slotId] = itemId;
        }
      }
    }
  }

  #ensureMembers(partyManager) {
    for (const member of partyManager?.members || []) {
      if (!this.equipment[member.id]) this.equipment[member.id] = emptyEquipment();
    }
  }
}
