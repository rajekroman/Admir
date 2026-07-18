import { ITEMS } from "../data/items.js";
import { VENDORS } from "../data/vendors.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class VendorManager {
  constructor(snapshot = null) {
    this.stock = Object.fromEntries(Object.values(VENDORS).map((vendor) => [vendor.id, structuredClone(vendor.stock)]));
    if (snapshot) this.restore(snapshot);
  }

  getVendor(vendorId) {
    return VENDORS[vendorId] || null;
  }

  getStock(vendorId, itemId) {
    return this.stock[vendorId]?.[itemId] || 0;
  }

  getDiplomacy(partyManager) {
    return Math.max(0, ...(partyManager?.members || []).map((member) => member.skills?.diplomacy || 0));
  }

  getBuyPrice(vendorId, itemId, partyManager, reputation = 0) {
    const vendor = this.getVendor(vendorId);
    const item = ITEMS[itemId];
    if (!vendor || !item) return null;
    const diplomacy = this.getDiplomacy(partyManager);
    const discount = clamp(diplomacy * 0.018 + Math.max(0, reputation) * 0.0025, 0, 0.28);
    return Math.max(1, Math.ceil(item.value * vendor.markup * (1 - discount)));
  }

  getSellPrice(vendorId, itemId, partyManager, reputation = 0) {
    const vendor = this.getVendor(vendorId);
    const item = ITEMS[itemId];
    if (!vendor || !item || item.value <= 0 || item.category === "quest") return 0;
    const diplomacy = this.getDiplomacy(partyManager);
    const bonus = clamp(diplomacy * 0.012 + Math.max(0, reputation) * 0.0015, 0, 0.2);
    return Math.max(1, Math.floor(item.value * (vendor.buyback + bonus)));
  }

  buy(vendorId, itemId, amount, { inventory, partyManager, gold, reputation }) {
    const quantity = Math.max(1, Math.floor(Number(amount) || 1));
    const available = this.getStock(vendorId, itemId);
    const price = this.getBuyPrice(vendorId, itemId, partyManager, reputation);
    if (price === null || available < quantity) return { ok: false, reason: "Obchodník nemá požadované množství." };
    const total = price * quantity;
    if (gold < total) return { ok: false, reason: `Nákup stojí ${total} zlatých.` };
    const added = inventory.add(itemId, quantity, partyManager);
    if (!added.ok) return { ok: false, reason: added.reason };
    this.stock[vendorId][itemId] -= quantity;
    return { ok: true, goldDelta: -total, total, amount: quantity };
  }

  sell(vendorId, itemId, amount, { inventory, partyManager, reputation }) {
    const quantity = Math.max(1, Math.floor(Number(amount) || 1));
    const item = ITEMS[itemId];
    const price = this.getSellPrice(vendorId, itemId, partyManager, reputation);
    if (!item || price <= 0) return { ok: false, reason: "Tento předmět obchodník nevykupuje." };
    if (inventory.getCount(itemId) < quantity) return { ok: false, reason: "V batohu není požadované množství." };
    if (!inventory.remove(itemId, quantity)) return { ok: false, reason: "Prodej se nezdařil." };
    this.stock[vendorId][itemId] = this.getStock(vendorId, itemId) + quantity;
    const total = price * quantity;
    return { ok: true, goldDelta: total, total, amount: quantity };
  }

  getView(vendorId, inventory, partyManager, reputation) {
    const vendor = this.getVendor(vendorId);
    if (!vendor) return null;
    const wares = Object.entries(this.stock[vendorId] || {})
      .filter(([itemId, count]) => ITEMS[itemId] && count > 0)
      .map(([itemId, count]) => ({ itemId, item: ITEMS[itemId], count, price: this.getBuyPrice(vendorId, itemId, partyManager, reputation) }))
      .sort((a, b) => a.item.name.localeCompare(b.item.name, "cs"));
    const buyback = inventory.getList(partyManager)
      .filter((entry) => entry.definition.value > 0 && entry.definition.category !== "quest")
      .map((entry) => ({ ...entry, price: this.getSellPrice(vendorId, entry.itemId, partyManager, reputation) }));
    return { vendor, wares, buyback, diplomacy: this.getDiplomacy(partyManager) };
  }

  snapshot() {
    return { stock: structuredClone(this.stock) };
  }

  restore(snapshot) {
    const raw = snapshot?.stock;
    if (!raw || typeof raw !== "object") return;
    for (const vendorId of Object.keys(this.stock)) {
      for (const itemId of Object.keys(this.stock[vendorId])) {
        const count = Number(raw[vendorId]?.[itemId]);
        if (Number.isFinite(count) && count >= 0) this.stock[vendorId][itemId] = Math.floor(count);
      }
      for (const [itemId, count] of Object.entries(raw[vendorId] || {})) {
        if (ITEMS[itemId] && Number.isFinite(Number(count)) && Number(count) >= 0) this.stock[vendorId][itemId] = Math.floor(Number(count));
      }
    }
  }
}
