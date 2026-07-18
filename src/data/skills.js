export const SKILLS = Object.freeze({
  blade: { id: "blade", name: "Čepel", category: "Boj", attribute: "might", description: "Meče a dlouhé čepele. Zvyšuje fyzický útok a přesnost zásahu." },
  mace: { id: "mace", name: "Palcát", category: "Boj", attribute: "might", description: "Tupé zbraně. Později umožní omráčení a prorážení zbroje." },
  staff: { id: "staff", name: "Hůl", category: "Boj", attribute: "accuracy", description: "Lehké obouruční zbraně mágů. Zlepšuje obranu i základní útok." },
  bow: { id: "bow", name: "Luk", category: "Boj", attribute: "accuracy", description: "Střelba na dálku. Zvyšuje zásah, poškození a kritickou šanci." },
  armor: { id: "armor", name: "Zbroj", category: "Obrana", attribute: "endurance", description: "Snižuje postih zbroje a zvyšuje fyzickou obranu." },
  athletics: { id: "athletics", name: "Atletika", category: "Obrana", attribute: "endurance", description: "Zvyšuje životy, regeneraci a odolnost proti sražení." },
  arcana: { id: "arcana", name: "Arkánum", category: "Magie", attribute: "intellect", description: "Obecná znalost magie. Zvyšuje sílu kouzel a maximální manu." },
  elemental: { id: "elemental", name: "Elementy", category: "Magie", attribute: "intellect", description: "Oheň, mráz a blesk. Zvyšuje útočné kouzlení a elementární odolnosti." },
  restoration: { id: "restoration", name: "Obnova", category: "Magie", attribute: "spirit", description: "Léčení a odstraňování stavů. Zvyšuje léčivou sílu." },
  light: { id: "light", name: "Světlo", category: "Magie", attribute: "spirit", description: "Ochranná kouzla, požehnání a obrana proti duchovnímu poškození." },
  perception: { id: "perception", name: "Vnímání", category: "Průzkum", attribute: "accuracy", description: "Odhalování pastí, tajných stěn a vzdálených hrozeb." },
  survival: { id: "survival", name: "Přežití", category: "Průzkum", attribute: "luck", description: "Orientace v divočině, táboření a získávání surovin." },
  lore: { id: "lore", name: "Učenost", category: "Sociální", attribute: "intellect", description: "Identifikace předmětů, run, historie a magických jevů." },
  diplomacy: { id: "diplomacy", name: "Diplomacie", category: "Sociální", attribute: "spirit", description: "Lepší ceny, přesvědčování a alternativní dialogové volby." },
  leadership: { id: "leadership", name: "Velení", category: "Sociální", attribute: "luck", description: "Zvyšuje morálku družiny a účinnost skupinových bonusů." },
});

export function getMastery(rank) {
  if (rank >= 10) return { id: "grandmaster", name: "Velmistr", threshold: 10 };
  if (rank >= 7) return { id: "master", name: "Mistr", threshold: 7 };
  if (rank >= 4) return { id: "expert", name: "Expert", threshold: 4 };
  if (rank >= 1) return { id: "novice", name: "Novic", threshold: 1 };
  return { id: "untrained", name: "Neznalý", threshold: 0 };
}

export function getSkillTrainingCost(rank) {
  if (rank < 4) return 1;
  if (rank < 7) return 2;
  return 3;
}
