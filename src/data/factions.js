export const FACTIONS = Object.freeze({
  silverWatch: { id: "silverWatch", name: "Stříbrná hlídka", description: "Ochránci brány, řádu a přísah." },
  freeCaravans: { id: "freeCaravans", name: "Svobodné karavany", description: "Kupci a průvodci, kteří chtějí otevřené cesty." },
  obsidianArchive: { id: "obsidianArchive", name: "Obsidiánový archiv", description: "Strážci paměti, jmen a nebezpečných pravd." },
});

export const DEFAULT_FACTION_REPUTATION = Object.freeze(Object.fromEntries(Object.keys(FACTIONS).map((id) => [id, 0])));
