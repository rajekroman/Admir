import { FACTIONS } from "./factions.js";

const ALLIANCE_TEXT = Object.freeze({
  silverWatch: {
    title: "Nová přísaha Stříbrné brány",
    lead: "Stříbrná hlídka převzala Korunu ozvěn a přetavila ji v pečeť, kterou musí každá generace obnovit vlastní přísahou.",
  },
  freeCaravans: {
    title: "Brána otevřených cest",
    lead: "Svobodné karavany odstranily závory a proměnily Stříbrnou bránu v místo setkání, kde žádný jediný příběh nesmí umlčet ostatní.",
  },
  obsidianArchive: {
    title: "Katalog pravých jmen",
    lead: "Obsidiánový archiv uzavřel pravé jméno Mor-Kharra do černého skla a zpřístupnil jeho příběh těm, kteří unesou celou pravdu.",
  },
});

const RELIC_TEXT = Object.freeze({
  destroy: "Hlasy uvězněné v reliikviáři se rozptýlily do světa. Některé rodiny poprvé po sedmdesáti letech uslyšely ve snech skutečná jména svých mrtvých.",
  preserve: "Reliikviář zůstal neporušený jako svědectví. Jeho paměť se stala protiváhou každé nové oficiální legendy.",
  claim: "Družina odnesla paměť reliikviáře v sobě. Vítězství má od té chvíle cenu: žádný z hrdinů už nedokáže zapomenout na člověka, kterého potkal.",
});

export function resolveCampaignEnding({ flags = {}, factions = {} } = {}) {
  const alliance = flags["campaign:finalAlliance"] || flags["campaign:expeditionAlliance"] || "silverWatch";
  const relic = flags["campaign:relicChoice"] || "preserve";
  const base = ALLIANCE_TEXT[alliance] || ALLIANCE_TEXT.silverWatch;
  const faction = FACTIONS[alliance] || FACTIONS.silverWatch;
  const reputation = Number(factions[alliance]) || 0;
  const harmony = Math.max(-10, Math.min(10, Object.values(factions).reduce((sum, value) => sum + Number(value || 0), 0)));
  const tone = reputation >= 6
    ? `${faction.name} přijala družinu jako zakladatele nové éry.`
    : reputation >= 2
      ? `${faction.name} dodržela dohodu, i když mezi vítězi zůstaly spory.`
      : `${faction.name} převzala vedení bez skutečné důvěry lidu; mír proto zůstává křehký.`;

  return Object.freeze({
    id: `${alliance}-${relic}`,
    alliance,
    relic,
    title: base.title,
    text: `${base.lead} ${RELIC_TEXT[relic] || RELIC_TEXT.preserve}`,
    epilogue: [
      tone,
      harmony >= 8
        ? "Tři frakce nakonec vytvořily společnou radu a brána přestala patřit jediné instituci."
        : harmony >= 2
          ? "Frakce spolupracují, ale každá si uchovává vlastní výklad vítězství."
          : "Rozpory mezi frakcemi přežily Mor-Kharra a staly se zárodkem budoucího konfliktu.",
      "Daren, Lyra, Orin a Saela jsou připomínáni nikoli jako ti, kteří zničili lež, ale jako ti, kteří dovolili světu znovu si vybrat.",
    ],
    allianceName: faction.name,
    reputation,
  });
}
