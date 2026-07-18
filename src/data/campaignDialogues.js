import { CAMPAIGN_BOARDS } from "./campaignBoards.js";

const boardDialogue = (id, speaker, intro) => ({
  id,
  entries: [{ node: "board" }],
  nodes: { board: { speaker, text: intro, choices: [
    ...(CAMPAIGN_BOARDS[id] || []).map((questId) => ({
      label: `Přijmout: ${BOARD_TITLES[questId] || questId}`,
      when: [{ type: "questStatus", questId, status: "notStarted" }],
      effects: [{ type: "startQuest", questId }],
      close: true,
    })),
    { label: "Odejít od tabule.", close: true },
  ] } },
});

const BOARD_TITLES = Object.freeze({"valeHounds": "Zuby v mlze", "valeStones": "Zapomenuté kameny", "valeHerbs": "Kořeny po bouři", "valeSentinels": "Duté helmy", "passRaiders": "Šípy v průsmyku", "passSignals": "Kamenné signály", "passToken": "Ztracený žeton", "passHounds": "Smečka pod větrem", "cryptShades": "Stíny v lavicích", "cryptTraps": "Bezpečný sestup", "cryptSecrets": "Spára kapitána", "cryptRelics": "Jména bezejmenných", "cityLetters": "Dopisy beze jmen", "cityThieves": "Noční kapsáři", "cityShrines": "Tři městské svatyně", "citySupplies": "Zásoby pro hradby", "marchRaiders": "Popelavá daň", "marchHounds": "Lov v popele", "marchSignals": "Staré signální věže", "marchHerbs": "Byliny z popela", "abbeyShades": "Sborové stíny", "abbeySentinels": "Kamenní bratři", "abbeyCandles": "Svíce poslední vigilie", "abbeyRelics": "Stříbro pod vodou", "archiveTablets": "Okraje poznání", "archiveShades": "Tiché indexy", "archiveKeys": "Klíče k nepopsaným dveřím", "archiveSecrets": "Dvě chybějící police"});

export const CAMPAIGN_DIALOGUES = {
  councilScribe: { id: "councilScribe", entries: [
    { node: "finalChoice", when: [{ type: "questStage", questId: "factionChoice", stageIndex: 0 }] },
    { node: "returnName", when: [{ type: "questStage", questId: "returnToCouncil", stageIndex: 0 }] },
    { node: "briefing", when: [{ type: "questStatus", questId: "threeVoices", status: "active" }] },
    { node: "fallback" },
  ], nodes: {
    briefing: { speaker: "Radní Serin", text: "Stříbrný přístav stojí na třech slibech: hlídka chrání hradby, karavany živí město a archiváři pamatují, proč hradby vůbec vznikly. Vyslechni všechny tři, než rada vyšle výpravu.", choices: [{ label: "Promluvím s nimi.", close: true }] },
    returnName: { speaker: "Radní Serin", text: "Tabulka se brání světlu. Přesto na ní čtu jediné jméno: Mor-Kharr. Tohle není titul, ale příkaz, kterým byl kámen donucen zapomenout sám sebe.", choices: [{ label: "Předat tabulku radě.", when: [{ type: "item", itemId: "true-name-tablet", min: 1 }], effects: [{ type: "takeItem", itemId: "true-name-tablet", amount: 1 }, { type: "questEvent", event: "dialogue", target: "council:true-name" }], close: true }, { label: "Ještě ji nepředávat.", close: true }] },
    finalChoice: { speaker: "Radní Serin", text: "Pravé jméno otevře cestu, ale někdo musí rozhodnout, co zůstane po vítězství. Komu svěříš vedení závěrečného útoku?", choices: [
      { label: "Stříbrné hlídce — brána musí zůstat střežena.", effects: [{ type: "setFlag", key: "campaign:finalAlliance", value: "silverWatch" }, { type: "faction", factionId: "silverWatch", amount: 4 }, { type: "questEvent", event: "dialogue", target: "final-alliance:chosen" }], close: true },
      { label: "Svobodným karavanám — brána má spojovat, ne zavírat.", effects: [{ type: "setFlag", key: "campaign:finalAlliance", value: "freeCaravans" }, { type: "faction", factionId: "freeCaravans", amount: 4 }, { type: "questEvent", event: "dialogue", target: "final-alliance:chosen" }], close: true },
      { label: "Obsidiánovému archivu — paměť musí přežít moc.", effects: [{ type: "setFlag", key: "campaign:finalAlliance", value: "obsidianArchive" }, { type: "faction", factionId: "obsidianArchive", amount: 4 }, { type: "questEvent", event: "dialogue", target: "final-alliance:chosen" }], close: true },
    ] },
    fallback: { speaker: "Radní Serin", text: "Rada zasedá, dokud se brána znovu nenaučí rozlišovat pravdu od ozvěny.", choices: [{ label: "Odejít.", close: true }] },
  } },
  leaderWatch: { id: "leaderWatch", entries: [
    { node: "offer", when: [{ type: "questStage", questId: "ashEnvoy", stageIndex: 0 }, { type: "not", condition: { type: "flag", key: "campaign:expeditionAlliance" } }] },
    { node: "voice", when: [{ type: "questStage", questId: "threeVoices", stageIndex: 0 }] },
    { node: "after" },
  ], nodes: {
    voice: { speaker: "Velitelka Ilyra", text: "Stříbrná hlídka věří, že bránu lze zachránit pouze disciplínou a novou přísahou.", choices: [{ label: "Vyslechnout stanovisko.", effects: [{ type: "questEvent", event: "dialogue", target: "leader:watch" }], close: true }] },
    offer: { speaker: "Velitelka Ilyra", text: "Hlídka povede výpravu v sevřeném šiku. Ztráty přijmeme, chaos nikoli.", choices: [{ label: "Svěřit vám první výpravu.", effects: [{ type: "setFlag", key: "campaign:expeditionAlliance", value: "silverWatch" }, { type: "faction", factionId: "silverWatch", amount: 2 }, { type: "questEvent", event: "dialogue", target: "alliance:chosen" }], close: true }, { label: "Ještě se nerozhodnout.", close: true }] },
    after: { speaker: "Velitelka Ilyra", text: "Ať rada rozhodne jakkoli, Mor-Kharr nesmí získat pravé jméno brány.", choices: [{ label: "Odejít.", close: true }] },
  } },
  leaderCaravans: { id: "leaderCaravans", entries: [
    { node: "offer", when: [{ type: "questStage", questId: "ashEnvoy", stageIndex: 0 }, { type: "not", condition: { type: "flag", key: "campaign:expeditionAlliance" } }] },
    { node: "voice", when: [{ type: "questStage", questId: "threeVoices", stageIndex: 0 }] },
    { node: "after" },
  ], nodes: {
    voice: { speaker: "Mistr karavan Oren", text: "Svobodné karavany tvrdí, že uzavřená brána je jen jiný druh porážky.", choices: [{ label: "Vyslechnout stanovisko.", effects: [{ type: "questEvent", event: "dialogue", target: "leader:caravans" }], close: true }] },
    offer: { speaker: "Mistr karavan Oren", text: "Karavany znají cesty, které mapy zamlčují. Povedeme výpravu rychle a bez praporů.", choices: [{ label: "Svěřit vám první výpravu.", effects: [{ type: "setFlag", key: "campaign:expeditionAlliance", value: "freeCaravans" }, { type: "faction", factionId: "freeCaravans", amount: 2 }, { type: "questEvent", event: "dialogue", target: "alliance:chosen" }], close: true }, { label: "Ještě se nerozhodnout.", close: true }] },
    after: { speaker: "Mistr karavan Oren", text: "Ať rada rozhodne jakkoli, Mor-Kharr nesmí získat pravé jméno brány.", choices: [{ label: "Odejít.", close: true }] },
  } },
  leaderArchive: { id: "leaderArchive", entries: [
    { node: "offer", when: [{ type: "questStage", questId: "ashEnvoy", stageIndex: 0 }, { type: "not", condition: { type: "flag", key: "campaign:expeditionAlliance" } }] },
    { node: "voice", when: [{ type: "questStage", questId: "threeVoices", stageIndex: 0 }] },
    { node: "after" },
  ], nodes: {
    voice: { speaker: "Archivářka Vesna", text: "Obsidiánový archiv varuje, že Mor-Kharr se živí zjednodušenými příběhy.", choices: [{ label: "Vyslechnout stanovisko.", effects: [{ type: "questEvent", event: "dialogue", target: "leader:archive" }], close: true }] },
    offer: { speaker: "Archivářka Vesna", text: "Archiv povede výpravu pomalu. Každý znak nejprve pochopíme, teprve potom zlomíme.", choices: [{ label: "Svěřit vám první výpravu.", effects: [{ type: "setFlag", key: "campaign:expeditionAlliance", value: "obsidianArchive" }, { type: "faction", factionId: "obsidianArchive", amount: 2 }, { type: "questEvent", event: "dialogue", target: "alliance:chosen" }], close: true }, { label: "Ještě se nerozhodnout.", close: true }] },
    after: { speaker: "Archivářka Vesna", text: "Ať rada rozhodne jakkoli, Mor-Kharr nesmí získat pravé jméno brány.", choices: [{ label: "Odejít.", close: true }] },
  } },
  reliquaryVoice: { id: "reliquaryVoice", entries: [{ node: "choice", when: [{ type: "questStage", questId: "reliquaryChoice", stageIndex: 0 }] }, { node: "after" }], nodes: {
    choice: { speaker: "Reliikviář tří tváří", text: "Relikvie uchovává vzpomínky těch, kteří při zavírání brány ztratili vlastní jména. Můžeš ji rozbít, zachovat, nebo přijmout její tíhu.", choices: [
      { label: "Rozbít relikvii a osvobodit uvězněné hlasy.", effects: [{ type: "setFlag", key: "campaign:relicChoice", value: "destroy" }, { type: "faction", factionId: "freeCaravans", amount: 2 }, { type: "questEvent", event: "dialogue", target: "reliquary:chosen" }], close: true },
      { label: "Zachovat relikvii jako svědectví.", effects: [{ type: "setFlag", key: "campaign:relicChoice", value: "preserve" }, { type: "faction", factionId: "obsidianArchive", amount: 2 }, { type: "questEvent", event: "dialogue", target: "reliquary:chosen" }], close: true },
      { label: "Přijmout relikvii a její paměť do sebe.", effects: [{ type: "setFlag", key: "campaign:relicChoice", value: "claim" }, { type: "faction", factionId: "silverWatch", amount: 1 }, { type: "giveItem", itemId: "reliquary-heart", amount: 1 }, { type: "questEvent", event: "dialogue", target: "reliquary:chosen" }], close: true },
    ] },
    after: { speaker: "Prázdný reliikviář", text: "V kameni zůstala jen stopa rozhodnutí, které už nelze vzít zpět.", choices: [{ label: "Odejít.", close: true }] },
  } },
  valeBoard: boardDialogue("valeBoard", "Tabule Vrbového údolí", "Na tabuli visí drobné prosby lidí z údolí."),
  passBoard: boardDialogue("passBoard", "Tabule horské hlídky", "Hlídka připíchla k desce úkoly, na které nemá dost lidí."),
  cryptBoard: boardDialogue("cryptBoard", "Nápisy na stěně krypty", "Někdo vyryl do omítky seznam věcí, které měly být vykonány před zapečetěním krypty."),
  cityBoard: boardDialogue("cityBoard", "Zakázková tabule přístavu", "Městská tabule nabízí práci mimo hlavní výpravu."),
  marchBoard: boardDialogue("marchBoard", "Výpravní rozkazy", "Rozkazy pro průzkumníky jsou zatížené kusem černého skla."),
  abbeyBoard: boardDialogue("abbeyBoard", "Seznam nedokončených vigilií", "Za mokrým seznamem jsou stále čitelné poslední povinnosti mnichů."),
  archiveBoard: boardDialogue("archiveBoard", "Okrajový katalog", "Vedlejší katalog eviduje nezpracované nálezy a porušené pečeti."),
};
