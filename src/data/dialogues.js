import { CAMPAIGN_DIALOGUES } from "./campaignDialogues.js";
const BASE_DIALOGUES = {
  elira: {
    id: "elira",
    entries: [
      { node: "after", when: [{ type: "questStatus", questId: "silverEcho", status: "completed" }] },
      { node: "return", when: [{ type: "questStage", questId: "silverEcho", stageIndex: 2 }] },
      { node: "search", when: [{ type: "questStage", questId: "silverEcho", stageIndex: 1 }] },
      { node: "intro", when: [{ type: "questStage", questId: "silverEcho", stageIndex: 0 }] },
      { node: "fallback" },
    ],
    nodes: {
      intro: {
        speaker: "Strážkyně Elira",
        text: "Za svítání zhasly všechny stříbrné mezníky v údolí. Ve stejnou chvíli se ze severu ozval tón, který nebyl slyšet ušima, ale v kostech. Brána bez těchto mezníků nepozná přítele od vetřelce.",
        choices: [
          { label: "Co přesně je Stříbrná brána?", next: "gateLore" },
          {
            label: "Prohlédneme mezník a najdeme zdroj ozvěny.",
            effects: [{ type: "questEvent", event: "dialogue", target: "elira:accepted" }],
            next: "taskGiven",
          },
          { label: "Nejdřív se porozhlédneme.", next: "later" },
        ],
      },
      gateLore: {
        speaker: "Strážkyně Elira",
        text: "Brána je starší než zdejší království. Její stříbrné žíly vedou pod zemí od jednoho mezníku k druhému. Dokud zpívají stejným tónem, cesta do hor zůstává bezpečná.",
        choices: [
          {
            label: "Dobře. Najdeme, co její píseň narušilo.",
            effects: [{ type: "questEvent", event: "dialogue", target: "elira:accepted" }],
            next: "taskGiven",
          },
          { label: "Vrátit se k předchozí otázce.", next: "intro" },
        ],
      },
      taskGiven: {
        speaker: "Strážkyně Elira",
        text: "Začni u rozbitého mezníku na sever od cesty. Pokud najdeš odštěpený krystal, nedotýkej se jeho hran holou kůží. Ozvěna si pamatuje posledního člověka, který ji probudil.",
        choices: [{ label: "Vyrážíme.", close: true }],
      },
      later: {
        speaker: "Strážkyně Elira",
        text: "Rozhlédni se, ale nezůstávej dlouho. Mlha se každý večer přibližuje o několik kroků.",
        choices: [{ label: "Odejít.", close: true }],
      },
      search: {
        speaker: "Strážkyně Elira",
        text: "Rozbitý mezník stojí severně od dlážděné cesty. Krystalická ozvěna bude nejspíš dál na severovýchodě, kde se světlo v noci odráží od starých zdí.",
        choices: [
          { label: "Proč se střepu nemáme dotýkat?", next: "warning" },
          { label: "Budeme pokračovat v pátrání.", close: true },
        ],
      },
      warning: {
        speaker: "Strážkyně Elira",
        text: "Protože podobné krystaly někdy opakují nejen zvuk, ale i úmysl. Přines ho v látce nebo v brašně.",
        choices: [{ label: "Rozumím.", close: true }],
      },
      return: {
        speaker: "Strážkyně Elira",
        text: "Ten tón… je v něm cizí rytmus. Někdo nevypnul mezníky silou. Přesvědčil je, že Stříbrná brána už neexistuje. Dej mi střep, než si zapamatuje další hlas.",
        choices: [
          {
            label: "Předat krystalický střep.",
            when: [{ type: "item", itemId: "silver-fragment", min: 1 }],
            effects: [
              { type: "takeItem", itemId: "silver-fragment", amount: 1 },
              { type: "questEvent", event: "dialogue", target: "elira:return" },
              { type: "setFlag", key: "prologue:echoIdentified", value: true },
            ],
            next: "revelation",
          },
          { label: "Ještě si ho ponechat.", close: true },
        ],
      },
      revelation: {
        speaker: "Strážkyně Elira",
        text: "Na hraně je znak Popelavého kruhu. Řád měl být zničen před sedmdesáti lety. Pokud se vrátil, zhaslé mezníky jsou pouze první zámek, který se pokusí otevřít. Vezmi mou pečeť — severní hlídky tě od této chvíle pustí dál.",
        choices: [{ label: "Tohle je teprve začátek.", close: true }],
      },
      after: {
        speaker: "Strážkyně Elira",
        text: "Pečeť u sebe dobře ukryj. Až se cesta otevře, půjdeme ke Stříbrné bráně. Do té doby zjisti, co lidé v údolí viděli během noci, kdy mezníky zhasly.",
        choices: [
          { label: "Co je Popelavý kruh?", next: "ashCircle" },
          { label: "Odejít.", close: true },
        ],
      },
      ashCircle: {
        speaker: "Strážkyně Elira",
        text: "Učenci, kteří chtěli přepsat paměť kamene. Věřili, že svět lze změnit, když se všichni začnou shodovat na stejné lži.",
        choices: [{ label: "Vrátit se.", next: "after" }],
      },
      fallback: {
        speaker: "Strážkyně Elira",
        text: "Severní cesta zůstává uzavřena.",
        choices: [{ label: "Odejít.", close: true }],
      },
    },
  },

  tomar: {
    id: "tomar",
    entries: [
      { node: "after", when: [{ type: "questStatus", questId: "lostSatchel", status: "completed" }] },
      { node: "return", when: [{ type: "questStage", questId: "lostSatchel", stageIndex: 1 }] },
      { node: "search", when: [{ type: "questStage", questId: "lostSatchel", stageIndex: 0 }] },
      { node: "offer", when: [{ type: "questStatus", questId: "lostSatchel", status: "notStarted" }] },
    ],
    nodes: {
      offer: {
        speaker: "Kupec Tomar",
        text: "V noci se mezi zdmi objevila modrá světla. Můj mezek utekl, já za ním a brašna zůstala v trávě. Nejde mi ani tak o mince jako o dopisy zákazníků. Poctivý kupec si nemůže dovolit ztratit cizí tajemství.",
        choices: [
          {
            label: "Brašnu najdeme.",
            effects: [{ type: "startQuest", questId: "lostSatchel" }],
            next: "accepted",
          },
          { label: "Co bylo v těch dopisech?", next: "letters" },
          { label: "Teď ne.", close: true },
        ],
      },
      letters: {
        speaker: "Kupec Tomar",
        text: "Kdybych je četl, nebyl bych poctivý kupec. Ale podle pečetí mířily dva do hor a jeden do kláštera pod Stříbrnou branou.",
        choices: [
          {
            label: "Dobře, přineseme je.",
            effects: [{ type: "startQuest", questId: "lostSatchel" }],
            next: "accepted",
          },
          { label: "Odejít.", close: true },
        ],
      },
      accepted: {
        speaker: "Kupec Tomar",
        text: "Hledej u západních zdí. Brašna má mosaznou sponu ve tvaru lišky.",
        choices: [{ label: "Vyrazit hledat.", close: true }],
      },
      search: {
        speaker: "Kupec Tomar",
        text: "Západní zdi, mosazná liška. Jestli dopisy navlhly, alespoň je nesuš u ohně.",
        choices: [{ label: "Budeme hledat dál.", close: true }],
      },
      return: {
        speaker: "Kupec Tomar",
        text: "To je ona! Spona je poškrábaná, ale pečetě drží. Děkuji. Až dorazíme k bráně, připomeň mi, že vám dlužím lepší cenu než jen dnešní odměnu.",
        choices: [
          {
            label: "Vrátit brašnu.",
            when: [{ type: "item", itemId: "lost-satchel", min: 1 }],
            effects: [
              { type: "takeItem", itemId: "lost-satchel", amount: 1 },
              { type: "questEvent", event: "dialogue", target: "tomar:return" },
            ],
            next: "thanks",
          },
          { label: "Ještě ne.", close: true },
        ],
      },
      thanks: {
        speaker: "Kupec Tomar",
        text: "Čtyřicet zlatých. Bez smlouvání — dnes jste byli lepší obchodníci než já.",
        choices: [{ label: "Přijmout odměnu.", close: true }],
      },
      after: {
        speaker: "Kupec Tomar",
        text: "Od chvíle, kdy jste vrátili brašnu, držím vaše jméno na straně pohledávek, ne dluhů.",
        choices: [{ label: "Odejít.", close: true }],
      },
    },
  },

  mira: {
    id: "mira",
    entries: [
      { node: "after", when: [{ type: "questStatus", questId: "moonleafTonic", status: "completed" }] },
      { node: "return", when: [{ type: "questStage", questId: "moonleafTonic", stageIndex: 1 }] },
      { node: "search", when: [{ type: "questStage", questId: "moonleafTonic", stageIndex: 0 }] },
      { node: "offer", when: [{ type: "questStatus", questId: "moonleafTonic", status: "notStarted" }] },
    ],
    nodes: {
      offer: {
        speaker: "Bylinkářka Mira",
        text: "Tři strážci se vrátili z mlhy s horečkou a stříbrnými skvrnami na kůži. Potřebuji měsíčník — tři čerstvé svazky. Roste u starých zdí, kde se drží vlhko.",
        choices: [
          {
            label: "Nasbíráme ho.",
            effects: [{ type: "startQuest", questId: "moonleafTonic" }],
            next: "accepted",
          },
          { label: "Co způsobilo jejich nemoc?", next: "illness" },
          { label: "Teď ne.", close: true },
        ],
      },
      illness: {
        speaker: "Bylinkářka Mira",
        text: "Nevím. Jejich krev je teplá, ale skvrny studí jako kov v zimě. Měsíčník nemoc nevyléčí, pouze jim dá čas.",
        choices: [
          {
            label: "Přineseme tři svazky.",
            effects: [{ type: "startQuest", questId: "moonleafTonic" }],
            next: "accepted",
          },
          { label: "Odejít.", close: true },
        ],
      },
      accepted: {
        speaker: "Bylinkářka Mira",
        text: "Hledej modré listy s bílými žilkami. Nesbírej kořeny — za další měsíc je budeme potřebovat znovu.",
        choices: [{ label: "Vyrazit.", close: true }],
      },
      search: {
        speaker: "Bylinkářka Mira",
        text: "Potřebuji tři svazky. Měsíčník roste poblíž vlhkých zdí na východě a severu údolí.",
        choices: [{ label: "Pokračovat ve sběru.", close: true }],
      },
      return: {
        speaker: "Bylinkářka Mira",
        text: "Listy jsou čerstvé. Ještě cítím noční chlad. Z toho připravím dost léku pro všechny tři strážce.",
        choices: [
          {
            label: "Odevzdat měsíčník.",
            when: [{ type: "item", itemId: "moonleaf", min: 3 }],
            effects: [
              { type: "takeItem", itemId: "moonleaf", amount: 3 },
              { type: "questEvent", event: "dialogue", target: "mira:return" },
            ],
            next: "thanks",
          },
          { label: "Ještě ne.", close: true },
        ],
      },
      thanks: {
        speaker: "Bylinkářka Mira",
        text: "Vezmi si jedno hotové tonikum. Není příjemné, ale dokáže postavit na nohy člověka, který už ztratil naději.",
        choices: [{ label: "Přijmout tonikum.", close: true }],
      },
      after: {
        speaker: "Bylinkářka Mira",
        text: "Horečka ustupuje. Jeden ze strážců však ve spánku opakuje jméno, které nikdo z nás nezná: Mor-Kharr.",
        choices: [{ label: "Zapamatovat si jméno.", effects: [{ type: "setFlag", key: "lore:morKharrName", value: true }], close: true }],
      },
    },
  },
};

export const DIALOGUES = Object.freeze({ ...BASE_DIALOGUES, ...CAMPAIGN_DIALOGUES });
