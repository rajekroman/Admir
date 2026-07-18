import { CAMPAIGN_QUESTS } from "./campaignQuests.js";
const BASE_QUESTS = {
  silverEcho: {
    id: "silverEcho",
    category: "main",
    title: "Ozvěna zhaslé brány",
    giver: "Strážkyně Elira",
    summary: "Zjisti, proč prastaré mezníky v údolí ztratily své světlo.",
    stages: [
      {
        title: "Varování strážkyně",
        description: "Strážkyně Elira hlídá severní cestu. Zeptej se jí, co se v údolí stalo.",
        objectives: [
          { id: "accept-elira", label: "Přijmi od Eliry úkol prozkoumat zhaslé mezníky", event: "dialogue", target: "elira:accepted", count: 1 },
        ],
      },
      {
        title: "Stopa v kameni",
        description: "Rozbitý mezník a krystalická ozvěna mohou odhalit původ poruchy.",
        objectives: [
          { id: "inspect-marker", label: "Prozkoumej rozbitý stříbrný mezník", event: "inspect", target: "silver-marker", count: 1 },
          { id: "recover-fragment", label: "Najdi krystalický střep ukrytý v severovýchodní části údolí", event: "collect", target: "silver-fragment", count: 1 },
        ],
      },
      {
        title: "První odpověď",
        description: "Střep v dlani tiše zpívá. Vrať se k Eliře a předej jí nález.",
        objectives: [
          { id: "return-elira", label: "Předej krystalický střep Eliře", event: "dialogue", target: "elira:return", count: 1 },
        ],
      },
    ],
    rewards: [
      { type: "gold", amount: 75, label: "75 zlatých" },
      { type: "experience", amount: 180, label: "180 zkušeností pro každého člena" },
      { type: "reputation", amount: 1, label: "+1 pověst ve Vrbovém údolí" },
      { type: "item", itemId: "eliras-seal", name: "Eliřina pečeť", amount: 1, label: "Eliřina pečeť" },
    ],
  },

  lostSatchel: {
    id: "lostSatchel",
    category: "side",
    title: "Kupecká brašna",
    giver: "Kupec Tomar",
    summary: "Najdi brašnu, kterou Tomar ztratil při nočním útěku před podivnými světly.",
    stages: [
      {
        title: "Ztracené zboží",
        description: "Brašna zůstala poblíž západních kamenných zdí.",
        objectives: [
          { id: "find-satchel", label: "Najdi Tomarovu koženou brašnu", event: "collect", target: "lost-satchel", count: 1 },
        ],
      },
      {
        title: "Poctivý nálezce",
        description: "Vrať nalezenou brašnu jejímu majiteli.",
        objectives: [
          { id: "return-satchel", label: "Vrať brašnu Tomarovi", event: "dialogue", target: "tomar:return", count: 1 },
        ],
      },
    ],
    rewards: [
      { type: "gold", amount: 40, label: "40 zlatých" },
      { type: "experience", amount: 75, label: "75 zkušeností pro každého člena" },
      { type: "reputation", amount: 1, label: "+1 pověst mezi kupci" },
    ],
  },

  moonleafTonic: {
    id: "moonleafTonic",
    category: "side",
    title: "Listy pod bledým měsícem",
    giver: "Bylinkářka Mira",
    summary: "Nasbírej tři svazky měsíčníku pro lék určený nemocným strážcům.",
    stages: [
      {
        title: "Měsíčník",
        description: "Modravé listy rostou u vlhkých zdí a starých kamenů.",
        objectives: [
          { id: "gather-moonleaf", label: "Nasbírej měsíčník", event: "collect", target: "moonleaf", count: 3 },
        ],
      },
      {
        title: "Lék pro hlídku",
        description: "Mira čeká u jižní cesty. Přines jí nasbírané listy.",
        objectives: [
          { id: "return-moonleaf", label: "Odevzdej tři svazky měsíčníku Miře", event: "dialogue", target: "mira:return", count: 1 },
        ],
      },
    ],
    rewards: [
      { type: "gold", amount: 25, label: "25 zlatých" },
      { type: "experience", amount: 80, label: "80 zkušeností pro každého člena" },
      { type: "item", itemId: "moonleaf-tonic", name: "Tonikum z měsíčníku", amount: 1, label: "Tonikum z měsíčníku" },
    ],
  },

  beneathGate: {
    id: "beneathGate",
    category: "main",
    title: "Pod Stříbrnou bránou",
    giver: "Objev družiny",
    summary: "Sestup do Krypty zlomených ozvěn a zjisti, co probudilo její mechanismy.",
    stages: [
      {
        title: "Cesta průsmykem",
        description: "Eliřina pečeť otevřela horskou cestu. Najdi schodiště vedoucí pod Stříbrnou bránu.",
        objectives: [
          { id: "enter-crypt", label: "Vstup do Krypty zlomených ozvěn", event: "enterZone", target: "echoCrypt", count: 1 },
        ],
      },
      {
        title: "Tři údery beze zvonu",
        description: "Vnitřní bránu ovládá staré kovové táhlo. Najdi mechanismus v prostřední síni.",
        objectives: [
          { id: "pull-crypt-lever", label: "Aktivuj páku tichého zvonu", event: "mechanism", target: "crypt-lever", count: 1 },
        ],
      },
      {
        title: "Odraz, který předbíhá",
        description: "Rezonanční brána se otevřela. V severní svatyni čeká zdroj první ozvěny.",
        objectives: [
          { id: "inspect-crypt-altar", label: "Prozkoumej oltář první ozvěny", event: "inspect", target: "crypt-altar", count: 1 },
        ],
      },
    ],
    rewards: [
      { type: "experience", amount: 240, label: "240 zkušeností pro každého člena" },
      { type: "gold", amount: 90, label: "90 zlatých" },
      { type: "reputation", amount: 1, label: "+1 pověst mezi Stříbrnou hlídkou" },
      { type: "item", itemId: "mirror-silver", name: "Zrcadlové stříbro", amount: 1, label: "Zrcadlové stříbro" },
      { type: "startQuest", questId: "councilOfSilverhaven" },
    ],
  },

};

export const QUESTS = Object.freeze({ ...BASE_QUESTS, ...CAMPAIGN_QUESTS });
