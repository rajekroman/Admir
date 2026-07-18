const q = (definition) => Object.freeze(definition);

export const CAMPAIGN_QUESTS = Object.freeze({
  councilOfSilverhaven: q({ id: "councilOfSilverhaven", category: "main", title: "Rada Stříbrného přístavu", giver: "Městská rada", summary: "Dones zrcadlové stříbro do města a varuj radu.", stages: [
    { title: "Vstup do Stříbrného přístavu", description: "Dostaň se přes průsmyk do města.", objectives: [
      { id: "enter-city", label: "Vstup do Stříbrného přístavu", event: "enterZone", target: "silverhaven", count: 1 },
    ] },
  ], rewards: [
    { type: "experience", amount: 260, label: "260 zkušeností pro každého člena" },
    { type: "gold", amount: 110, label: "110 zlatých" },
    { type: "faction", factionId: "silverWatch", amount: 1, label: "Změna reputace frakce" },
    { type: "startQuest", questId: "threeVoices" },
  ] }),
  threeVoices: q({ id: "threeVoices", category: "main", title: "Tři hlasy města", giver: "Radní Serin", summary: "Vyslechni tři frakce, které chtějí rozhodovat o obraně brány.", stages: [
    { title: "Hlasy frakcí", description: "Promluv s představiteli hlídky, karavan a archivářů.", objectives: [
      { id: "voice-watch", label: "Vyslechni Stříbrnou hlídku", event: "dialogue", target: "leader:watch", count: 1 },
      { id: "voice-caravans", label: "Vyslechni Svobodné karavany", event: "dialogue", target: "leader:caravans", count: 1 },
      { id: "voice-archive", label: "Vyslechni Obsidiánový archiv", event: "dialogue", target: "leader:archive", count: 1 },
    ] },
  ], rewards: [
    { type: "experience", amount: 280, label: "280 zkušeností pro každého člena" },
    { type: "gold", amount: 120, label: "120 zlatých" },
    { type: "startQuest", questId: "ashEnvoy" },
  ] }),
  ashEnvoy: q({ id: "ashEnvoy", category: "main", title: "Popelavý vyslanec", giver: "Radní Serin", summary: "Zvol, komu svěříš vedení první výpravy do Popelavého pochodu.", stages: [
    { title: "První spojenectví", description: "Vyber frakci, která povede výpravu.", objectives: [
      { id: "choose-alliance", label: "Zvol vedoucí frakci výpravy", event: "dialogue", target: "alliance:chosen", count: 1 },
    ] },
  ], rewards: [
    { type: "experience", amount: 300, label: "300 zkušeností pro každého člena" },
    { type: "gold", amount: 130, label: "130 zlatých" },
    { type: "flag", key: "access:ashenMarch", value: true },
    { type: "startQuest", questId: "brokenCaravan" },
  ] }),
  brokenCaravan: q({ id: "brokenCaravan", category: "main", title: "Karavana beze stínů", giver: "Vybraná frakce", summary: "Najdi ztracenou karavanu v Popelavém pochodu.", stages: [
    { title: "Do pochodu", description: "Vstup do Popelavého pochodu a najdi trosky karavany.", objectives: [
      { id: "enter-march", label: "Vstup do Popelavého pochodu", event: "enterZone", target: "ashenMarch", count: 1 },
      { id: "inspect-caravan", label: "Prozkoumej rozbitou karavanu", event: "inspect", target: "broken-caravan", count: 1 },
    ] },
  ], rewards: [
    { type: "experience", amount: 330, label: "330 zkušeností pro každého člena" },
    { type: "gold", amount: 145, label: "145 zlatých" },
    { type: "startQuest", questId: "marchBeacon" },
  ] }),
  marchBeacon: q({ id: "marchBeacon", category: "main", title: "Maják v popelu", giver: "Kapitán výpravy", summary: "Obnov starý signální maják a otevři cestu k zatopenému opatství.", stages: [
    { title: "Oheň nad pochodem", description: "Aktivuj signální mechanismus na severu pochodu.", objectives: [
      { id: "light-beacon", label: "Aktivuj popelavý maják", event: "mechanism", target: "march-beacon", count: 1 },
    ] },
  ], rewards: [
    { type: "experience", amount: 360, label: "360 zkušeností pro každého člena" },
    { type: "gold", amount: 160, label: "160 zlatých" },
    { type: "flag", key: "access:drownedAbbey", value: true },
    { type: "startQuest", questId: "abbeyDoor" },
  ] }),
  abbeyDoor: q({ id: "abbeyDoor", category: "main", title: "Dveře pod vodou", giver: "Kapitán výpravy", summary: "Sestup do Zatopeného opatství.", stages: [
    { title: "Zatopené schody", description: "Najdi vchod do opatství.", objectives: [
      { id: "enter-abbey", label: "Vstup do Zatopeného opatství", event: "enterZone", target: "drownedAbbey", count: 1 },
    ] },
  ], rewards: [
    { type: "experience", amount: 380, label: "380 zkušeností pro každého člena" },
    { type: "gold", amount: 170, label: "170 zlatých" },
    { type: "startQuest", questId: "drownedChoir" },
  ] }),
  drownedChoir: q({ id: "drownedChoir", category: "main", title: "Sbor bez dechu", giver: "Ozvěna opatství", summary: "Utiš živé ozvěny, které drží reliikviář zavřený.", stages: [
    { title: "Tiché lavice", description: "Poraz čtyři živé ozvěny v opatství.", objectives: [
      { id: "slay-shades", label: "Poraz živé ozvěny", event: "kill", target: "echoShade", count: 4 },
    ] },
  ], rewards: [
    { type: "experience", amount: 410, label: "410 zkušeností pro každého člena" },
    { type: "gold", amount: 185, label: "185 zlatých" },
    { type: "startQuest", questId: "reliquaryChoice" },
  ] }),
  reliquaryChoice: q({ id: "reliquaryChoice", category: "main", title: "Tři tváře relikvie", giver: "Reliikviář opatství", summary: "Rozhodni, co se stane s relikvií paměti.", stages: [
    { title: "Rozhodnutí", description: "Zvol osud relikvie.", objectives: [
      { id: "choose-relic", label: "Rozhodni o relikvii", event: "dialogue", target: "reliquary:chosen", count: 1 },
    ] },
  ], rewards: [
    { type: "experience", amount: 440, label: "440 zkušeností pro každého člena" },
    { type: "gold", amount: 195, label: "195 zlatých" },
    { type: "flag", key: "access:glasswood", value: true },
    { type: "startQuest", questId: "glasswoodPath" },
  ] }),
  glasswoodPath: q({ id: "glasswoodPath", category: "main", title: "Cesta Skleněným hvozdem", giver: "Relikvie paměti", summary: "Projdi za opatstvím do Skleněného hvozdu.", stages: [
    { title: "Za mlhou", description: "Vstup do Skleněného hvozdu.", objectives: [
      { id: "enter-glasswood", label: "Vstup do Skleněného hvozdu", event: "enterZone", target: "glasswood", count: 1 },
    ] },
  ], rewards: [
    { type: "experience", amount: 450, label: "450 zkušeností pro každého člena" },
    { type: "gold", amount: 205, label: "205 zlatých" },
    { type: "startQuest", questId: "memoryOrchard" },
  ] }),
  memoryOrchard: q({ id: "memoryOrchard", category: "main", title: "Sad cizích vzpomínek", giver: "Šepot hvozdu", summary: "Probuď tři stromy, které uchovávají cestu k archivu.", stages: [
    { title: "Tři kořeny", description: "Dotkni se tří paměťových stromů.", objectives: [
      { id: "wake-trees", label: "Probuď paměťové stromy", event: "inspect", target: "memory-tree", count: 3 },
    ] },
  ], rewards: [
    { type: "experience", amount: 480, label: "480 zkušeností pro každého člena" },
    { type: "gold", amount: 215, label: "215 zlatých" },
    { type: "flag", key: "access:obsidianArchive", value: true },
    { type: "startQuest", questId: "archiveSeal" },
  ] }),
  archiveSeal: q({ id: "archiveSeal", category: "main", title: "Pečeť černého skla", giver: "Archivářská ozvěna", summary: "Vstup do Obsidiánového archivu a odemkni hlavní pečeť.", stages: [
    { title: "Černé schodiště", description: "Vstup do archivu a aktivuj pečetní páku.", objectives: [
      { id: "enter-archive", label: "Vstup do Obsidiánového archivu", event: "enterZone", target: "obsidianArchive", count: 1 },
      { id: "open-seal", label: "Aktivuj pečeť archivu", event: "mechanism", target: "archive-seal", count: 1 },
    ] },
  ], rewards: [
    { type: "experience", amount: 500, label: "500 zkušeností pro každého člena" },
    { type: "gold", amount: 230, label: "230 zlatých" },
    { type: "startQuest", questId: "obsidianQuestions" },
  ] }),
  obsidianQuestions: q({ id: "obsidianQuestions", category: "main", title: "Otázky vyryté do tmy", giver: "Obsidiánový archiv", summary: "Přečti tři tabulky, které popisují Mor-Kharrovo skutečné zrození.", stages: [
    { title: "Tři tabulky", description: "Prozkoumej tři obsidiánové tabulky.", objectives: [
      { id: "read-tablets", label: "Přečti obsidiánové tabulky", event: "inspect", target: "obsidian-tablet", count: 3 },
    ] },
  ], rewards: [
    { type: "experience", amount: 520, label: "520 zkušeností pro každého člena" },
    { type: "gold", amount: 240, label: "240 zlatých" },
    { type: "startQuest", questId: "trueName" },
  ] }),
  trueName: q({ id: "trueName", category: "main", title: "Jméno, které kámen odmítl", giver: "Obsidiánový archiv", summary: "Najdi tabulku se skutečným jménem nepřítele.", stages: [
    { title: "Zapovězený regál", description: "Najdi a vezmi tabulku pravého jména.", objectives: [
      { id: "collect-name", label: "Získej tabulku pravého jména", event: "collect", target: "true-name-tablet", count: 1 },
    ] },
  ], rewards: [
    { type: "experience", amount: 550, label: "550 zkušeností pro každého člena" },
    { type: "gold", amount: 250, label: "250 zlatých" },
    { type: "startQuest", questId: "returnToCouncil" },
  ] }),
  returnToCouncil: q({ id: "returnToCouncil", category: "main", title: "Návrat se jménem", giver: "Radní Serin", summary: "Vrať se do města a předlož radě pravé jméno.", stages: [
    { title: "Zpět do města", description: "Předej tabulku radnímu Serinovi.", objectives: [
      { id: "return-name", label: "Předej tabulku pravého jména", event: "dialogue", target: "council:true-name", count: 1 },
    ] },
  ], rewards: [
    { type: "experience", amount: 580, label: "580 zkušeností pro každého člena" },
    { type: "gold", amount: 270, label: "270 zlatých" },
    { type: "startQuest", questId: "factionChoice" },
  ] }),
  factionChoice: q({ id: "factionChoice", category: "main", title: "Kdo ponese korunu", giver: "Rada Stříbrného přístavu", summary: "Vyber frakci, která povede závěrečný útok.", stages: [
    { title: "Poslední spojenectví", description: "Rozhodni, komu svěříš budoucnost brány.", objectives: [
      { id: "final-alliance", label: "Zvol závěrečného spojence", event: "dialogue", target: "final-alliance:chosen", count: 1 },
    ] },
  ], rewards: [
    { type: "experience", amount: 600, label: "600 zkušeností pro každého člena" },
    { type: "gold", amount: 300, label: "300 zlatých" },
    { type: "flag", key: "access:crownCitadel", value: true },
    { type: "startQuest", questId: "crownRoad" },
  ] }),
  crownRoad: q({ id: "crownRoad", category: "main", title: "Cesta ke Koruně ozvěn", giver: "Zvolená frakce", summary: "Vstup do pevnosti postavené kolem Stříbrné brány.", stages: [
    { title: "Poslední výstup", description: "Vstup do Korunní citadely.", objectives: [
      { id: "enter-citadel", label: "Vstup do Korunní citadely", event: "enterZone", target: "crownCitadel", count: 1 },
    ] },
  ], rewards: [
    { type: "experience", amount: 640, label: "640 zkušeností pro každého člena" },
    { type: "gold", amount: 330, label: "330 zlatých" },
    { type: "startQuest", questId: "threeAnchors" },
  ] }),
  threeAnchors: q({ id: "threeAnchors", category: "main", title: "Tři kotvy lži", giver: "Pravé jméno", summary: "Rozbij tři paměťové kotvy, které chrání Mor-Kharra.", stages: [
    { title: "Kotvy", description: "Znič tři kotvy na nádvoří citadely.", objectives: [
      { id: "break-anchors", label: "Znič paměťové kotvy", event: "inspect", target: "crown-anchor", count: 3 },
    ] },
  ], rewards: [
    { type: "experience", amount: 700, label: "700 zkušeností pro každého člena" },
    { type: "gold", amount: 360, label: "360 zlatých" },
    { type: "flag", key: "access:hollowThrone", value: true },
    { type: "startQuest", questId: "hollowThrone" },
  ] }),
  hollowThrone: q({ id: "hollowThrone", category: "main", title: "Prázdný trůn", giver: "Pravé jméno", summary: "Vstup do trůnní síně a poraz Mor-Kharra.", stages: [
    { title: "Poslední dveře", description: "Vstup do Prázdného trůnu.", objectives: [
      { id: "enter-throne", label: "Vstup do Prázdného trůnu", event: "enterZone", target: "hollowThrone", count: 1 },
    ] },
    { title: "Mor-Kharr", description: "Mor-Kharr", objectives: [
      { id: "slay-mor-kharr", label: "Poraz Mor-Kharra", event: "kill", target: "morKharr", count: 1 },
    ] },
  ], rewards: [
    { type: "experience", amount: 1200, label: "1200 zkušeností pro každého člena" },
    { type: "gold", amount: 1000, label: "1000 zlatých" },
    { type: "resolveEnding" },
  ] }),
  valeHounds: q({ id: "valeHounds", category: "side", title: "Zuby v mlze", giver: "Zakázková tabule", summary: "Poraz tři ozvěnové honiče.", stages: [{ title: "Zuby v mlze", description: "Poraz tři ozvěnové honiče.", objectives: [{ id: "valeHounds-objective", label: "Poraz tři ozvěnové honiče.", event: "kill", target: "echoHound", count: 3 }] }], rewards: [{ type: "experience", amount: 120, label: "120 zkušeností pro každého člena" }, { type: "gold", amount: 55, label: "55 zlatých" }] }),
  valeStones: q({ id: "valeStones", category: "side", title: "Zapomenuté kameny", giver: "Zakázková tabule", summary: "Prozkoumej dva zapomenuté kameny.", stages: [{ title: "Zapomenuté kameny", description: "Prozkoumej dva zapomenuté kameny.", objectives: [{ id: "valeStones-objective", label: "Prozkoumej dva zapomenuté kameny.", event: "inspect", target: "vale-side-stone", count: 2 }] }], rewards: [{ type: "experience", amount: 140, label: "140 zkušeností pro každého člena" }, { type: "gold", amount: 65, label: "65 zlatých" }] }),
  valeHerbs: q({ id: "valeHerbs", category: "side", title: "Kořeny po bouři", giver: "Zakázková tabule", summary: "Nasbírej dva kořeny bouřnice.", stages: [{ title: "Kořeny po bouři", description: "Nasbírej dva kořeny bouřnice.", objectives: [{ id: "valeHerbs-objective", label: "Nasbírej dva kořeny bouřnice.", event: "collect", target: "stormroot", count: 2 }] }], rewards: [{ type: "experience", amount: 160, label: "160 zkušeností pro každého člena" }, { type: "gold", amount: 75, label: "75 zlatých" }] }),
  valeSentinels: q({ id: "valeSentinels", category: "side", title: "Duté helmy", giver: "Zakázková tabule", summary: "Poraz dva duté strážce.", stages: [{ title: "Duté helmy", description: "Poraz dva duté strážce.", objectives: [{ id: "valeSentinels-objective", label: "Poraz dva duté strážce.", event: "kill", target: "hollowSentinel", count: 2 }] }], rewards: [{ type: "experience", amount: 180, label: "180 zkušeností pro každého člena" }, { type: "gold", amount: 85, label: "85 zlatých" }] }),
  passRaiders: q({ id: "passRaiders", category: "side", title: "Šípy v průsmyku", giver: "Zakázková tabule", summary: "Poraz tři popelavé nájezdníky.", stages: [{ title: "Šípy v průsmyku", description: "Poraz tři popelavé nájezdníky.", objectives: [{ id: "passRaiders-objective", label: "Poraz tři popelavé nájezdníky.", event: "kill", target: "ashRaider", count: 3 }] }], rewards: [{ type: "experience", amount: 120, label: "120 zkušeností pro každého člena" }, { type: "gold", amount: 55, label: "55 zlatých" }] }),
  passSignals: q({ id: "passSignals", category: "side", title: "Kamenné signály", giver: "Zakázková tabule", summary: "Prozkoumej tři strážní signály.", stages: [{ title: "Kamenné signály", description: "Prozkoumej tři strážní signály.", objectives: [{ id: "passSignals-objective", label: "Prozkoumej tři strážní signály.", event: "inspect", target: "pass-signal", count: 3 }] }], rewards: [{ type: "experience", amount: 140, label: "140 zkušeností pro každého člena" }, { type: "gold", amount: 65, label: "65 zlatých" }] }),
  passToken: q({ id: "passToken", category: "side", title: "Ztracený žeton", giver: "Zakázková tabule", summary: "Najdi žeton horské hlídky.", stages: [{ title: "Ztracený žeton", description: "Najdi žeton horské hlídky.", objectives: [{ id: "passToken-objective", label: "Najdi žeton horské hlídky.", event: "collect", target: "watch-token", count: 1 }] }], rewards: [{ type: "experience", amount: 160, label: "160 zkušeností pro každého člena" }, { type: "gold", amount: 75, label: "75 zlatých" }] }),
  passHounds: q({ id: "passHounds", category: "side", title: "Smečka pod větrem", giver: "Zakázková tabule", summary: "Poraz čtyři ozvěnové honiče.", stages: [{ title: "Smečka pod větrem", description: "Poraz čtyři ozvěnové honiče.", objectives: [{ id: "passHounds-objective", label: "Poraz čtyři ozvěnové honiče.", event: "kill", target: "echoHound", count: 4 }] }], rewards: [{ type: "experience", amount: 180, label: "180 zkušeností pro každého člena" }, { type: "gold", amount: 85, label: "85 zlatých" }] }),
  cryptShades: q({ id: "cryptShades", category: "side", title: "Stíny v lavicích", giver: "Zakázková tabule", summary: "Poraz čtyři živé ozvěny.", stages: [{ title: "Stíny v lavicích", description: "Poraz čtyři živé ozvěny.", objectives: [{ id: "cryptShades-objective", label: "Poraz čtyři živé ozvěny.", event: "kill", target: "echoShade", count: 4 }] }], rewards: [{ type: "experience", amount: 120, label: "120 zkušeností pro každého člena" }, { type: "gold", amount: 55, label: "55 zlatých" }] }),
  cryptTraps: q({ id: "cryptTraps", category: "side", title: "Bezpečný sestup", giver: "Zakázková tabule", summary: "Zneškodni tři pasti krypty.", stages: [{ title: "Bezpečný sestup", description: "Zneškodni tři pasti krypty.", objectives: [{ id: "cryptTraps-objective", label: "Zneškodni tři pasti krypty.", event: "disarm", target: "crypt-hazard", count: 3 }] }], rewards: [{ type: "experience", amount: 140, label: "140 zkušeností pro každého člena" }, { type: "gold", amount: 65, label: "65 zlatých" }] }),
  cryptSecrets: q({ id: "cryptSecrets", category: "side", title: "Spára kapitána", giver: "Zakázková tabule", summary: "Objev tajnou stěnu krypty.", stages: [{ title: "Spára kapitána", description: "Objev tajnou stěnu krypty.", objectives: [{ id: "cryptSecrets-objective", label: "Objev tajnou stěnu krypty.", event: "discover", target: "crypt-secret", count: 1 }] }], rewards: [{ type: "experience", amount: 160, label: "160 zkušeností pro každého člena" }, { type: "gold", amount: 75, label: "75 zlatých" }] }),
  cryptRelics: q({ id: "cryptRelics", category: "side", title: "Jména bezejmenných", giver: "Zakázková tabule", summary: "Prozkoumej tři náhrobní reliéfy.", stages: [{ title: "Jména bezejmenných", description: "Prozkoumej tři náhrobní reliéfy.", objectives: [{ id: "cryptRelics-objective", label: "Prozkoumej tři náhrobní reliéfy.", event: "inspect", target: "crypt-relic", count: 3 }] }], rewards: [{ type: "experience", amount: 180, label: "180 zkušeností pro každého člena" }, { type: "gold", amount: 85, label: "85 zlatých" }] }),
  cityLetters: q({ id: "cityLetters", category: "side", title: "Dopisy beze jmen", giver: "Zakázková tabule", summary: "Najdi tři ztracené dopisy.", stages: [{ title: "Dopisy beze jmen", description: "Najdi tři ztracené dopisy.", objectives: [{ id: "cityLetters-objective", label: "Najdi tři ztracené dopisy.", event: "collect", target: "courier-note", count: 3 }] }], rewards: [{ type: "experience", amount: 120, label: "120 zkušeností pro každého člena" }, { type: "gold", amount: 55, label: "55 zlatých" }] }),
  cityThieves: q({ id: "cityThieves", category: "side", title: "Noční kapsáři", giver: "Zakázková tabule", summary: "Poraz dva městské lupiče.", stages: [{ title: "Noční kapsáři", description: "Poraz dva městské lupiče.", objectives: [{ id: "cityThieves-objective", label: "Poraz dva městské lupiče.", event: "kill", target: "ashRaider", count: 2 }] }], rewards: [{ type: "experience", amount: 140, label: "140 zkušeností pro každého člena" }, { type: "gold", amount: 65, label: "65 zlatých" }] }),
  cityShrines: q({ id: "cityShrines", category: "side", title: "Tři městské svatyně", giver: "Zakázková tabule", summary: "Prozkoumej tři svatyně.", stages: [{ title: "Tři městské svatyně", description: "Prozkoumej tři svatyně.", objectives: [{ id: "cityShrines-objective", label: "Prozkoumej tři svatyně.", event: "inspect", target: "city-shrine", count: 3 }] }], rewards: [{ type: "experience", amount: 160, label: "160 zkušeností pro každého člena" }, { type: "gold", amount: 75, label: "75 zlatých" }] }),
  citySupplies: q({ id: "citySupplies", category: "side", title: "Zásoby pro hradby", giver: "Zakázková tabule", summary: "Najdi dvě bedny zásob.", stages: [{ title: "Zásoby pro hradby", description: "Najdi dvě bedny zásob.", objectives: [{ id: "citySupplies-objective", label: "Najdi dvě bedny zásob.", event: "collect", target: "watch-supplies", count: 2 }] }], rewards: [{ type: "experience", amount: 180, label: "180 zkušeností pro každého člena" }, { type: "gold", amount: 85, label: "85 zlatých" }] }),
  marchRaiders: q({ id: "marchRaiders", category: "side", title: "Popelavá daň", giver: "Zakázková tabule", summary: "Poraz pět nájezdníků.", stages: [{ title: "Popelavá daň", description: "Poraz pět nájezdníků.", objectives: [{ id: "marchRaiders-objective", label: "Poraz pět nájezdníků.", event: "kill", target: "ashRaider", count: 5 }] }], rewards: [{ type: "experience", amount: 120, label: "120 zkušeností pro každého člena" }, { type: "gold", amount: 55, label: "55 zlatých" }] }),
  marchHounds: q({ id: "marchHounds", category: "side", title: "Lov v popele", giver: "Zakázková tabule", summary: "Poraz čtyři honiče.", stages: [{ title: "Lov v popele", description: "Poraz čtyři honiče.", objectives: [{ id: "marchHounds-objective", label: "Poraz čtyři honiče.", event: "kill", target: "echoHound", count: 4 }] }], rewards: [{ type: "experience", amount: 140, label: "140 zkušeností pro každého člena" }, { type: "gold", amount: 65, label: "65 zlatých" }] }),
  marchSignals: q({ id: "marchSignals", category: "side", title: "Staré signální věže", giver: "Zakázková tabule", summary: "Prozkoumej tři signální kameny.", stages: [{ title: "Staré signální věže", description: "Prozkoumej tři signální kameny.", objectives: [{ id: "marchSignals-objective", label: "Prozkoumej tři signální kameny.", event: "inspect", target: "march-signal", count: 3 }] }], rewards: [{ type: "experience", amount: 160, label: "160 zkušeností pro každého člena" }, { type: "gold", amount: 75, label: "75 zlatých" }] }),
  marchHerbs: q({ id: "marchHerbs", category: "side", title: "Byliny z popela", giver: "Zakázková tabule", summary: "Nasbírej čtyři svazky měsíčníku.", stages: [{ title: "Byliny z popela", description: "Nasbírej čtyři svazky měsíčníku.", objectives: [{ id: "marchHerbs-objective", label: "Nasbírej čtyři svazky měsíčníku.", event: "collect", target: "moonleaf", count: 4 }] }], rewards: [{ type: "experience", amount: 180, label: "180 zkušeností pro každého člena" }, { type: "gold", amount: 85, label: "85 zlatých" }] }),
  abbeyShades: q({ id: "abbeyShades", category: "side", title: "Sborové stíny", giver: "Zakázková tabule", summary: "Poraz pět živých ozvěn.", stages: [{ title: "Sborové stíny", description: "Poraz pět živých ozvěn.", objectives: [{ id: "abbeyShades-objective", label: "Poraz pět živých ozvěn.", event: "kill", target: "echoShade", count: 5 }] }], rewards: [{ type: "experience", amount: 120, label: "120 zkušeností pro každého člena" }, { type: "gold", amount: 55, label: "55 zlatých" }] }),
  abbeySentinels: q({ id: "abbeySentinels", category: "side", title: "Kamenní bratři", giver: "Zakázková tabule", summary: "Poraz tři duté strážce.", stages: [{ title: "Kamenní bratři", description: "Poraz tři duté strážce.", objectives: [{ id: "abbeySentinels-objective", label: "Poraz tři duté strážce.", event: "kill", target: "hollowSentinel", count: 3 }] }], rewards: [{ type: "experience", amount: 140, label: "140 zkušeností pro každého člena" }, { type: "gold", amount: 65, label: "65 zlatých" }] }),
  abbeyCandles: q({ id: "abbeyCandles", category: "side", title: "Svíce poslední vigilie", giver: "Zakázková tabule", summary: "Prozkoumej čtyři věčné svíce.", stages: [{ title: "Svíce poslední vigilie", description: "Prozkoumej čtyři věčné svíce.", objectives: [{ id: "abbeyCandles-objective", label: "Prozkoumej čtyři věčné svíce.", event: "inspect", target: "abbey-candle", count: 4 }] }], rewards: [{ type: "experience", amount: 160, label: "160 zkušeností pro každého člena" }, { type: "gold", amount: 75, label: "75 zlatých" }] }),
  abbeyRelics: q({ id: "abbeyRelics", category: "side", title: "Stříbro pod vodou", giver: "Zakázková tabule", summary: "Najdi tři opatství relikvie.", stages: [{ title: "Stříbro pod vodou", description: "Najdi tři opatství relikvie.", objectives: [{ id: "abbeyRelics-objective", label: "Najdi tři opatství relikvie.", event: "collect", target: "abbey-relic", count: 3 }] }], rewards: [{ type: "experience", amount: 180, label: "180 zkušeností pro každého člena" }, { type: "gold", amount: 85, label: "85 zlatých" }] }),
  archiveTablets: q({ id: "archiveTablets", category: "side", title: "Okraje poznání", giver: "Zakázková tabule", summary: "Prozkoumej čtyři vedlejší tabulky.", stages: [{ title: "Okraje poznání", description: "Prozkoumej čtyři vedlejší tabulky.", objectives: [{ id: "archiveTablets-objective", label: "Prozkoumej čtyři vedlejší tabulky.", event: "inspect", target: "archive-side-tablet", count: 4 }] }], rewards: [{ type: "experience", amount: 120, label: "120 zkušeností pro každého člena" }, { type: "gold", amount: 55, label: "55 zlatých" }] }),
  archiveShades: q({ id: "archiveShades", category: "side", title: "Tiché indexy", giver: "Zakázková tabule", summary: "Poraz pět živých ozvěn.", stages: [{ title: "Tiché indexy", description: "Poraz pět živých ozvěn.", objectives: [{ id: "archiveShades-objective", label: "Poraz pět živých ozvěn.", event: "kill", target: "echoShade", count: 5 }] }], rewards: [{ type: "experience", amount: 140, label: "140 zkušeností pro každého člena" }, { type: "gold", amount: 65, label: "65 zlatých" }] }),
  archiveKeys: q({ id: "archiveKeys", category: "side", title: "Klíče k nepopsaným dveřím", giver: "Zakázková tabule", summary: "Najdi tři archivní klíče.", stages: [{ title: "Klíče k nepopsaným dveřím", description: "Najdi tři archivní klíče.", objectives: [{ id: "archiveKeys-objective", label: "Najdi tři archivní klíče.", event: "collect", target: "archive-key", count: 3 }] }], rewards: [{ type: "experience", amount: 160, label: "160 zkušeností pro každého člena" }, { type: "gold", amount: 75, label: "75 zlatých" }] }),
  archiveSecrets: q({ id: "archiveSecrets", category: "side", title: "Dvě chybějící police", giver: "Zakázková tabule", summary: "Objev dva tajné průchody.", stages: [{ title: "Dvě chybějící police", description: "Objev dva tajné průchody.", objectives: [{ id: "archiveSecrets-objective", label: "Objev dva tajné průchody.", event: "discover", target: "archive-secret", count: 2 }] }], rewards: [{ type: "experience", amount: 180, label: "180 zkušeností pro každého člena" }, { type: "gold", amount: 85, label: "85 zlatých" }] }),
});
