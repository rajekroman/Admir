export const EXISTING_ZONE_PATCHES = Object.freeze({
  "willowVale": [
    {
      "id": "vale-board",
      "kind": "sign",
      "name": "Tabule Vrbového údolí",
      "x": 3.5,
      "y": 20.5,
      "solid": false,
      "dialogueId": "valeBoard",
      "interaction": {
        "type": "dialogue",
        "prompt": "Prohlédnout zakázky"
      }
    },
    {
      "id": "vale-stone-a",
      "kind": "obelisk",
      "name": "Zapomenutý kámen u vrby",
      "x": 2.5,
      "y": 2.5,
      "solid": true,
      "interaction": {
        "type": "inspect",
        "prompt": "Prozkoumat: Zapomenutý kámen u vrby",
        "title": "Zapomenutý kámen u vrby",
        "text": "Kámen nese jméno člověka, který se nikdy nenarodil.",
        "event": "inspect",
        "target": "vale-side-stone",
        "experience": 20
      },
      "visibleWhen": [
        {
          "type": "questStatus",
          "questId": "valeStones",
          "status": "active"
        }
      ]
    },
    {
      "id": "vale-stone-b",
      "kind": "obelisk",
      "name": "Zapomenutý kámen u zdi",
      "x": 5.5,
      "y": 2.5,
      "solid": true,
      "interaction": {
        "type": "inspect",
        "prompt": "Prozkoumat: Zapomenutý kámen u zdi",
        "title": "Zapomenutý kámen u zdi",
        "text": "Nápis byl vyškrábán zevnitř kamene.",
        "event": "inspect",
        "target": "vale-side-stone",
        "experience": 20
      },
      "visibleWhen": [
        {
          "type": "questStatus",
          "questId": "valeStones",
          "status": "active"
        }
      ]
    },
    {
      "id": "stormroot-a",
      "kind": "herb",
      "name": "Kořen bouřnice",
      "x": 3.5,
      "y": 4.5,
      "solid": false,
      "interaction": {
        "type": "collect",
        "prompt": "Vzít: Kořen bouřnice",
        "itemId": "stormroot",
        "itemName": "Kořen bouřnice",
        "event": "collect",
        "target": "stormroot",
        "text": "Získáno: Kořen bouřnice."
      },
      "visibleWhen": [
        {
          "type": "questStatus",
          "questId": "valeHerbs",
          "status": "active"
        }
      ]
    },
    {
      "id": "stormroot-b",
      "kind": "herb",
      "name": "Kořen bouřnice",
      "x": 21.5,
      "y": 18.5,
      "solid": false,
      "interaction": {
        "type": "collect",
        "prompt": "Vzít: Kořen bouřnice",
        "itemId": "stormroot",
        "itemName": "Kořen bouřnice",
        "event": "collect",
        "target": "stormroot",
        "text": "Získáno: Kořen bouřnice."
      },
      "visibleWhen": [
        {
          "type": "questStatus",
          "questId": "valeHerbs",
          "status": "active"
        }
      ]
    }
  ],
  "silverPass": [
    {
      "id": "pass-board",
      "kind": "sign",
      "name": "Tabule horské hlídky",
      "x": 3.5,
      "y": 18.5,
      "solid": false,
      "dialogueId": "passBoard",
      "interaction": {
        "type": "dialogue",
        "prompt": "Prohlédnout zakázky"
      }
    },
    {
      "id": "pass-raider-b",
      "kind": "enemyRaider",
      "enemyId": "ashRaider",
      "name": "Popelavý ostrostřelec",
      "x": 13.5,
      "y": 15.5,
      "homeX": 13.5,
      "homeY": 15.5,
      "solid": true,
      "groupId": "pass-raiders"
    },
    {
      "id": "pass-raider-c",
      "kind": "enemyRaider",
      "enemyId": "ashRaider",
      "name": "Popelavý průzkumník",
      "x": 17.5,
      "y": 17.5,
      "homeX": 17.5,
      "homeY": 17.5,
      "solid": true,
      "groupId": "pass-raiders"
    },
    {
      "id": "pass-hound-c",
      "kind": "enemyHound",
      "enemyId": "echoHound",
      "name": "Ozvěnový honič",
      "x": 5.5,
      "y": 17.5,
      "homeX": 5.5,
      "homeY": 17.5,
      "solid": true,
      "groupId": "pass-pack"
    },
    {
      "id": "pass-hound-d",
      "kind": "enemyHound",
      "enemyId": "echoHound",
      "name": "Ozvěnový honič",
      "x": 12.5,
      "y": 17.5,
      "homeX": 12.5,
      "homeY": 17.5,
      "solid": true,
      "groupId": "pass-pack"
    },
    {
      "id": "pass-signal-a",
      "kind": "sign",
      "name": "Signální kámen západu",
      "x": 5.5,
      "y": 2.5,
      "solid": true,
      "interaction": {
        "type": "inspect",
        "prompt": "Prozkoumat: Signální kámen západu",
        "title": "Signální kámen západu",
        "text": "Pod mechem je stále čitelná šipka k bráně.",
        "event": "inspect",
        "target": "pass-signal",
        "experience": 20
      },
      "visibleWhen": [
        {
          "type": "questStatus",
          "questId": "passSignals",
          "status": "active"
        }
      ]
    },
    {
      "id": "pass-signal-b",
      "kind": "sign",
      "name": "Signální kámen středu",
      "x": 12.5,
      "y": 14.5,
      "solid": true,
      "interaction": {
        "type": "inspect",
        "prompt": "Prozkoumat: Signální kámen středu",
        "title": "Signální kámen středu",
        "text": "Kámen varuje před hlasem přicházejícím proti větru.",
        "event": "inspect",
        "target": "pass-signal",
        "experience": 20
      },
      "visibleWhen": [
        {
          "type": "questStatus",
          "questId": "passSignals",
          "status": "active"
        }
      ]
    },
    {
      "id": "pass-signal-c",
      "kind": "sign",
      "name": "Signální kámen východu",
      "x": 20.5,
      "y": 17.5,
      "solid": true,
      "interaction": {
        "type": "inspect",
        "prompt": "Prozkoumat: Signální kámen východu",
        "title": "Signální kámen východu",
        "text": "Poslední značka hlídky ukazuje do míst, kde cesta končí zdí.",
        "event": "inspect",
        "target": "pass-signal",
        "experience": 20
      },
      "visibleWhen": [
        {
          "type": "questStatus",
          "questId": "passSignals",
          "status": "active"
        }
      ]
    },
    {
      "id": "pass-watch-token",
      "kind": "key",
      "name": "Žeton horské hlídky",
      "x": 7.5,
      "y": 2.5,
      "solid": false,
      "interaction": {
        "type": "collect",
        "prompt": "Vzít: Žeton horské hlídky",
        "itemId": "watch-token",
        "itemName": "Žeton horské hlídky",
        "event": "collect",
        "target": "watch-token",
        "text": "Získáno: Žeton horské hlídky."
      },
      "visibleWhen": [
        {
          "type": "questStatus",
          "questId": "passToken",
          "status": "active"
        }
      ]
    }
  ],
  "echoCrypt": [
    {
      "id": "crypt-board",
      "kind": "sign",
      "name": "Nápisy na stěně krypty",
      "x": 6.5,
      "y": 21.5,
      "solid": false,
      "dialogueId": "cryptBoard",
      "interaction": {
        "type": "dialogue",
        "prompt": "Prohlédnout zakázky"
      }
    },
    {
      "id": "crypt-shade-c",
      "kind": "enemyShade",
      "enemyId": "echoShade",
      "name": "Živá ozvěna",
      "x": 20.5,
      "y": 5.5,
      "homeX": 20.5,
      "homeY": 5.5,
      "solid": true,
      "groupId": "altar-watch"
    },
    {
      "id": "crypt-shade-d",
      "kind": "enemyShade",
      "enemyId": "echoShade",
      "name": "Živá ozvěna",
      "x": 22.5,
      "y": 6.5,
      "homeX": 22.5,
      "homeY": 6.5,
      "solid": true,
      "groupId": "altar-watch"
    },
    {
      "id": "crypt-relic-a",
      "kind": "obelisk",
      "name": "Reliéf prvního kapitána",
      "x": 10.5,
      "y": 3.5,
      "solid": true,
      "interaction": {
        "type": "inspect",
        "prompt": "Prozkoumat: Reliéf prvního kapitána",
        "title": "Reliéf prvního kapitána",
        "text": "Kapitán drží meč obrácený hrotem k vlastnímu jménu.",
        "event": "inspect",
        "target": "crypt-relic",
        "experience": 20
      },
      "visibleWhen": [
        {
          "type": "questStatus",
          "questId": "cryptRelics",
          "status": "active"
        }
      ]
    },
    {
      "id": "crypt-relic-b",
      "kind": "obelisk",
      "name": "Reliéf poslední zvonařky",
      "x": 15.5,
      "y": 3.5,
      "solid": true,
      "interaction": {
        "type": "inspect",
        "prompt": "Prozkoumat: Reliéf poslední zvonařky",
        "title": "Reliéf poslední zvonařky",
        "text": "Zvonařka má místo tváře hladký kruh.",
        "event": "inspect",
        "target": "crypt-relic",
        "experience": 20
      },
      "visibleWhen": [
        {
          "type": "questStatus",
          "questId": "cryptRelics",
          "status": "active"
        }
      ]
    },
    {
      "id": "crypt-relic-c",
      "kind": "obelisk",
      "name": "Reliéf bezejmenné hlídky",
      "x": 6.5,
      "y": 20.5,
      "solid": true,
      "interaction": {
        "type": "inspect",
        "prompt": "Prozkoumat: Reliéf bezejmenné hlídky",
        "title": "Reliéf bezejmenné hlídky",
        "text": "Celá hlídka je vytesána bez stínů.",
        "event": "inspect",
        "target": "crypt-relic",
        "experience": 20
      },
      "visibleWhen": [
        {
          "type": "questStatus",
          "questId": "cryptRelics",
          "status": "active"
        }
      ]
    }
  ]
});

export const CAMPAIGN_ZONES = Object.freeze({
  "silverhaven": {
    "id": "silverhaven",
    "name": "Stříbrný přístav",
    "subtitle": "Město tří přísah",
    "environment": "outdoor",
    "skyTop": "#4a5868",
    "skyBottom": "#a18a68",
    "floorNear": "#373d2a",
    "floorFar": "#1b2118",
    "fog": "#58605c",
    "music": [
      82.41,
      110,
      130.81,
      164.81,
      146.83,
      110
    ],
    "nightMusic": [
      65.41,
      82.41,
      98,
      130.81,
      110,
      82.41
    ],
    "start": {
      "x": 2.5,
      "y": 12.5,
      "direction": 0
    },
    "spawns": {
      "fromPass": {
        "x": 2.5,
        "y": 12.5,
        "direction": 0
      },
      "fromMarch": {
        "x": 25.5,
        "y": 12.5,
        "direction": 3.14159
      },
      "fromCitadel": {
        "x": 13.5,
        "y": 2.5,
        "direction": 1.5708
      }
    },
    "map": [
      "1111111111111111111111111111",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000033330000000003333000001",
      "1000033330000000003333000001",
      "1000033330000000003333000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000222222220000000001",
      "1000000000222222220000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1111111111111111111111111111"
    ],
    "floorZones": [
      {
        "x1": 1,
        "y1": 1,
        "x2": 26,
        "y2": 22,
        "material": "stone"
      }
    ],
    "entities": [
      {
        "id": "city-to-pass",
        "kind": "portal",
        "name": "Cesta do průsmyku",
        "x": 1.5,
        "y": 12.5,
        "solid": false,
        "render": false,
        "interaction": {
          "type": "transition",
          "prompt": "Cesta do průsmyku",
          "targetZone": "silverPass",
          "targetSpawn": "fromCity"
        }
      },
      {
        "id": "city-to-march",
        "kind": "portal",
        "name": "Brána do Popelavého pochodu",
        "x": 26.5,
        "y": 12.5,
        "solid": false,
        "render": false,
        "interaction": {
          "type": "transition",
          "prompt": "Brána do Popelavého pochodu",
          "targetZone": "ashenMarch",
          "targetSpawn": "fromCity",
          "requiresFlag": "access:ashenMarch",
          "lockedText": "Cesta zůstává uzavřená, dokud nepokročí hlavní výprava."
        }
      },
      {
        "id": "city-to-citadel",
        "kind": "portal",
        "name": "Severní výstup ke Koruně",
        "x": 13.5,
        "y": 1.5,
        "solid": false,
        "render": false,
        "interaction": {
          "type": "transition",
          "prompt": "Severní výstup ke Koruně",
          "targetZone": "crownCitadel",
          "targetSpawn": "fromCity",
          "requiresFlag": "access:crownCitadel",
          "lockedText": "Cesta zůstává uzavřená, dokud nepokročí hlavní výprava."
        }
      },
      {
        "id": "council-scribe",
        "kind": "npc",
        "name": "Radní Serin",
        "x": 13.5,
        "y": 10.5,
        "solid": true,
        "dialogueId": "councilScribe",
        "interaction": {
          "type": "dialogue",
          "prompt": "Promluvit: Radní Serin"
        }
      },
      {
        "id": "leader-watch",
        "kind": "npc",
        "name": "Velitelka Ilyra",
        "x": 8.5,
        "y": 8.5,
        "solid": true,
        "dialogueId": "leaderWatch",
        "interaction": {
          "type": "dialogue",
          "prompt": "Promluvit: Velitelka Ilyra"
        }
      },
      {
        "id": "leader-caravans",
        "kind": "npc",
        "name": "Mistr karavan Oren",
        "x": 13.5,
        "y": 15.5,
        "solid": true,
        "dialogueId": "leaderCaravans",
        "interaction": {
          "type": "dialogue",
          "prompt": "Promluvit: Mistr karavan Oren"
        }
      },
      {
        "id": "leader-archive",
        "kind": "npc",
        "name": "Archivářka Vesna",
        "x": 19.5,
        "y": 8.5,
        "solid": true,
        "dialogueId": "leaderArchive",
        "interaction": {
          "type": "dialogue",
          "prompt": "Promluvit: Archivářka Vesna"
        }
      },
      {
        "id": "city-board",
        "kind": "sign",
        "name": "Zakázková tabule přístavu",
        "x": 4.5,
        "y": 18.5,
        "solid": false,
        "dialogueId": "cityBoard",
        "interaction": {
          "type": "dialogue",
          "prompt": "Prohlédnout zakázky"
        }
      },
      {
        "id": "city-note-0",
        "kind": "satchel",
        "name": "Ztracený dopis",
        "x": 4.5,
        "y": 4.5,
        "solid": false,
        "interaction": {
          "type": "collect",
          "prompt": "Vzít: Ztracený dopis",
          "itemId": "courier-note",
          "itemName": "Ztracený dopis",
          "event": "collect",
          "target": "courier-note",
          "text": "Získáno: Ztracený dopis."
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "cityLetters",
            "status": "active"
          }
        ]
      },
      {
        "id": "city-note-1",
        "kind": "satchel",
        "name": "Ztracený dopis",
        "x": 13.5,
        "y": 4.5,
        "solid": false,
        "interaction": {
          "type": "collect",
          "prompt": "Vzít: Ztracený dopis",
          "itemId": "courier-note",
          "itemName": "Ztracený dopis",
          "event": "collect",
          "target": "courier-note",
          "text": "Získáno: Ztracený dopis."
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "cityLetters",
            "status": "active"
          }
        ]
      },
      {
        "id": "city-note-2",
        "kind": "satchel",
        "name": "Ztracený dopis",
        "x": 22.5,
        "y": 4.5,
        "solid": false,
        "interaction": {
          "type": "collect",
          "prompt": "Vzít: Ztracený dopis",
          "itemId": "courier-note",
          "itemName": "Ztracený dopis",
          "event": "collect",
          "target": "courier-note",
          "text": "Získáno: Ztracený dopis."
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "cityLetters",
            "status": "active"
          }
        ]
      },
      {
        "id": "city-shrine-0",
        "kind": "obelisk",
        "name": "Městská svatyně",
        "x": 7.5,
        "y": 18.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Městská svatyně",
          "title": "Městská svatyně",
          "text": "Svatyně připomíná jinou podobu brány.",
          "event": "inspect",
          "target": "city-shrine",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "cityShrines",
            "status": "active"
          }
        ]
      },
      {
        "id": "city-shrine-1",
        "kind": "obelisk",
        "name": "Městská svatyně",
        "x": 13.5,
        "y": 18.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Městská svatyně",
          "title": "Městská svatyně",
          "text": "Svatyně připomíná jinou podobu brány.",
          "event": "inspect",
          "target": "city-shrine",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "cityShrines",
            "status": "active"
          }
        ]
      },
      {
        "id": "city-shrine-2",
        "kind": "obelisk",
        "name": "Městská svatyně",
        "x": 20.5,
        "y": 18.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Městská svatyně",
          "title": "Městská svatyně",
          "text": "Svatyně připomíná jinou podobu brány.",
          "event": "inspect",
          "target": "city-shrine",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "cityShrines",
            "status": "active"
          }
        ]
      },
      {
        "id": "city-supply-0",
        "kind": "crate",
        "name": "Bedna zásob",
        "x": 22.5,
        "y": 16.5,
        "solid": false,
        "interaction": {
          "type": "collect",
          "prompt": "Vzít: Bedna zásob",
          "itemId": "watch-supplies",
          "itemName": "Bedna zásob",
          "event": "collect",
          "target": "watch-supplies",
          "text": "Získáno: Bedna zásob."
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "citySupplies",
            "status": "active"
          }
        ]
      },
      {
        "id": "city-supply-1",
        "kind": "crate",
        "name": "Bedna zásob",
        "x": 5.5,
        "y": 12.5,
        "solid": false,
        "interaction": {
          "type": "collect",
          "prompt": "Vzít: Bedna zásob",
          "itemId": "watch-supplies",
          "itemName": "Bedna zásob",
          "event": "collect",
          "target": "watch-supplies",
          "text": "Získáno: Bedna zásob."
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "citySupplies",
            "status": "active"
          }
        ]
      },
      {
        "id": "city-thief-a",
        "kind": "enemyRaider",
        "enemyId": "ashRaider",
        "name": "Noční lupič",
        "x": 23.5,
        "y": 20.5,
        "homeX": 23.5,
        "homeY": 20.5,
        "solid": true,
        "groupId": "city-thieves"
      },
      {
        "id": "city-thief-b",
        "kind": "enemyRaider",
        "enemyId": "ashRaider",
        "name": "Noční lupič",
        "x": 21.5,
        "y": 21.5,
        "homeX": 21.5,
        "homeY": 21.5,
        "solid": true,
        "groupId": "city-thieves"
      },
      {
        "id": "city-tomar-shop",
        "kind": "npc",
        "name": "Tomarův městský stánek",
        "x": 6.5,
        "y": 15.5,
        "solid": true,
        "dialogueId": "tomar",
        "interaction": {
          "type": "dialogue",
          "prompt": "Promluvit: Tomarův městský stánek"
        }
      }
    ],
    "traps": []
  },
  "ashenMarch": {
    "id": "ashenMarch",
    "name": "Popelavý pochod",
    "subtitle": "Země, kde stíny kráčejí samy",
    "environment": "outdoor",
    "skyTop": "#4a5868",
    "skyBottom": "#a18a68",
    "floorNear": "#373d2a",
    "floorFar": "#1b2118",
    "fog": "#58605c",
    "music": [
      82.41,
      110,
      130.81,
      164.81,
      146.83,
      110
    ],
    "nightMusic": [
      65.41,
      82.41,
      98,
      130.81,
      110,
      82.41
    ],
    "start": {
      "x": 2.5,
      "y": 12.5,
      "direction": 0
    },
    "spawns": {
      "fromCity": {
        "x": 2.5,
        "y": 12.5,
        "direction": 0
      },
      "fromAbbey": {
        "x": 25.5,
        "y": 4.5,
        "direction": 3.14159
      }
    },
    "map": [
      "1111111111111111111111111111",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000003333000000000001",
      "1000000000003333000000000001",
      "1000000000003333000000000001",
      "1000000000003333000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000333000000000000000000001",
      "1000333000000000000000000001",
      "1000333000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000333000001",
      "1000000000000000000333000001",
      "1000000000000000000333000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1111111111111111111111111111"
    ],
    "floorZones": [
      {
        "x1": 1,
        "y1": 1,
        "x2": 26,
        "y2": 22,
        "material": "grass"
      }
    ],
    "entities": [
      {
        "id": "march-to-city",
        "kind": "portal",
        "name": "Cesta do Stříbrného přístavu",
        "x": 1.5,
        "y": 12.5,
        "solid": false,
        "render": false,
        "interaction": {
          "type": "transition",
          "prompt": "Cesta do Stříbrného přístavu",
          "targetZone": "silverhaven",
          "targetSpawn": "fromMarch"
        }
      },
      {
        "id": "march-to-abbey",
        "kind": "portal",
        "name": "Schody k Zatopenému opatství",
        "x": 26.5,
        "y": 4.5,
        "solid": false,
        "render": false,
        "interaction": {
          "type": "transition",
          "prompt": "Schody k Zatopenému opatství",
          "targetZone": "drownedAbbey",
          "targetSpawn": "entrance",
          "requiresFlag": "access:drownedAbbey",
          "lockedText": "Cesta zůstává uzavřená, dokud nepokročí hlavní výprava."
        }
      },
      {
        "id": "march-board",
        "kind": "sign",
        "name": "Výpravní rozkazy",
        "x": 3.5,
        "y": 20.5,
        "solid": false,
        "dialogueId": "marchBoard",
        "interaction": {
          "type": "dialogue",
          "prompt": "Prohlédnout zakázky"
        }
      },
      {
        "id": "broken-caravan",
        "kind": "crate",
        "name": "Rozbitá karavana",
        "x": 10.5,
        "y": 12.5,
        "solid": false,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Rozbitá karavana",
          "title": "Rozbitá karavana",
          "text": "Vozy nejsou vypálené. Jejich stíny byly odříznuty a odvedeny směrem k opatství.",
          "event": "inspect",
          "target": "broken-caravan",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "brokenCaravan",
            "status": "active"
          }
        ]
      },
      {
        "id": "march-beacon",
        "kind": "lever",
        "name": "Popelavý signální maják",
        "x": 22.5,
        "y": 4.5,
        "solid": true,
        "interaction": {
          "type": "lever",
          "prompt": "Zažehnout maják",
          "oneWay": true,
          "flag": "mechanism:march-beacon",
          "event": "mechanism",
          "target": "march-beacon",
          "targets": [],
          "text": "Nad pochodem se rozsvítil bílý plamen a odhalil schodiště k opatství."
        }
      },
      {
        "id": "march-signal-0",
        "kind": "sign",
        "name": "Starý signální kámen",
        "x": 7.5,
        "y": 5.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Starý signální kámen",
          "title": "Starý signální kámen",
          "text": "Značka zachycuje směr větru před Popelavou nocí.",
          "event": "inspect",
          "target": "march-signal",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "marchSignals",
            "status": "active"
          }
        ]
      },
      {
        "id": "march-signal-1",
        "kind": "sign",
        "name": "Starý signální kámen",
        "x": 14.5,
        "y": 7.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Starý signální kámen",
          "title": "Starý signální kámen",
          "text": "Značka zachycuje směr větru před Popelavou nocí.",
          "event": "inspect",
          "target": "march-signal",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "marchSignals",
            "status": "active"
          }
        ]
      },
      {
        "id": "march-signal-2",
        "kind": "sign",
        "name": "Starý signální kámen",
        "x": 21.5,
        "y": 9.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Starý signální kámen",
          "title": "Starý signální kámen",
          "text": "Značka zachycuje směr větru před Popelavou nocí.",
          "event": "inspect",
          "target": "march-signal",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "marchSignals",
            "status": "active"
          }
        ]
      },
      {
        "id": "march-herb-0",
        "kind": "herb",
        "name": "Měsíčník",
        "x": 6.5,
        "y": 18.5,
        "solid": false,
        "interaction": {
          "type": "collect",
          "prompt": "Vzít: Měsíčník",
          "itemId": "moonleaf",
          "itemName": "Měsíčník",
          "event": "collect",
          "target": "moonleaf",
          "text": "Získáno: Měsíčník."
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "marchHerbs",
            "status": "active"
          }
        ]
      },
      {
        "id": "march-herb-1",
        "kind": "herb",
        "name": "Měsíčník",
        "x": 9.5,
        "y": 20.5,
        "solid": false,
        "interaction": {
          "type": "collect",
          "prompt": "Vzít: Měsíčník",
          "itemId": "moonleaf",
          "itemName": "Měsíčník",
          "event": "collect",
          "target": "moonleaf",
          "text": "Získáno: Měsíčník."
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "marchHerbs",
            "status": "active"
          }
        ]
      },
      {
        "id": "march-herb-2",
        "kind": "herb",
        "name": "Měsíčník",
        "x": 18.5,
        "y": 18.5,
        "solid": false,
        "interaction": {
          "type": "collect",
          "prompt": "Vzít: Měsíčník",
          "itemId": "moonleaf",
          "itemName": "Měsíčník",
          "event": "collect",
          "target": "moonleaf",
          "text": "Získáno: Měsíčník."
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "marchHerbs",
            "status": "active"
          }
        ]
      },
      {
        "id": "march-herb-3",
        "kind": "herb",
        "name": "Měsíčník",
        "x": 23.5,
        "y": 16.5,
        "solid": false,
        "interaction": {
          "type": "collect",
          "prompt": "Vzít: Měsíčník",
          "itemId": "moonleaf",
          "itemName": "Měsíčník",
          "event": "collect",
          "target": "moonleaf",
          "text": "Získáno: Měsíčník."
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "marchHerbs",
            "status": "active"
          }
        ]
      },
      {
        "id": "march-raider-0",
        "kind": "enemyRaider",
        "enemyId": "ashRaider",
        "name": "Popelavý nájezdník",
        "x": 8.5,
        "y": 10.5,
        "homeX": 8.5,
        "homeY": 10.5,
        "solid": true,
        "groupId": "march-raiders"
      },
      {
        "id": "march-raider-1",
        "kind": "enemyRaider",
        "enemyId": "ashRaider",
        "name": "Popelavý nájezdník",
        "x": 12.5,
        "y": 9.5,
        "homeX": 12.5,
        "homeY": 9.5,
        "solid": true,
        "groupId": "march-raiders"
      },
      {
        "id": "march-raider-2",
        "kind": "enemyRaider",
        "enemyId": "ashRaider",
        "name": "Popelavý nájezdník",
        "x": 16.5,
        "y": 11.5,
        "homeX": 16.5,
        "homeY": 11.5,
        "solid": true,
        "groupId": "march-raiders"
      },
      {
        "id": "march-raider-3",
        "kind": "enemyRaider",
        "enemyId": "ashRaider",
        "name": "Popelavý nájezdník",
        "x": 20.5,
        "y": 13.5,
        "homeX": 20.5,
        "homeY": 13.5,
        "solid": true,
        "groupId": "march-raiders"
      },
      {
        "id": "march-raider-4",
        "kind": "enemyRaider",
        "enemyId": "ashRaider",
        "name": "Popelavý nájezdník",
        "x": 23.5,
        "y": 18.5,
        "homeX": 23.5,
        "homeY": 18.5,
        "solid": true,
        "groupId": "march-raiders"
      },
      {
        "id": "march-hound-0",
        "kind": "enemyHound",
        "enemyId": "echoHound",
        "name": "Ozvěnový honič",
        "x": 5.5,
        "y": 15.5,
        "homeX": 5.5,
        "homeY": 15.5,
        "solid": true,
        "groupId": "march-hounds"
      },
      {
        "id": "march-hound-1",
        "kind": "enemyHound",
        "enemyId": "echoHound",
        "name": "Ozvěnový honič",
        "x": 11.5,
        "y": 17.5,
        "homeX": 11.5,
        "homeY": 17.5,
        "solid": true,
        "groupId": "march-hounds"
      },
      {
        "id": "march-hound-2",
        "kind": "enemyHound",
        "enemyId": "echoHound",
        "name": "Ozvěnový honič",
        "x": 17.5,
        "y": 16.5,
        "homeX": 17.5,
        "homeY": 16.5,
        "solid": true,
        "groupId": "march-hounds"
      },
      {
        "id": "march-hound-3",
        "kind": "enemyHound",
        "enemyId": "echoHound",
        "name": "Ozvěnový honič",
        "x": 22.5,
        "y": 20.5,
        "homeX": 22.5,
        "homeY": 20.5,
        "solid": true,
        "groupId": "march-hounds"
      }
    ],
    "traps": []
  },
  "drownedAbbey": {
    "id": "drownedAbbey",
    "name": "Zatopené opatství",
    "subtitle": "Klenby pod hladinou času",
    "environment": "dungeon",
    "skyTop": "#12131a",
    "skyBottom": "#252331",
    "floorNear": "#292725",
    "floorFar": "#101014",
    "fog": "#24242c",
    "music": [
      82.41,
      110,
      130.81,
      164.81,
      146.83,
      110
    ],
    "nightMusic": [
      65.41,
      82.41,
      98,
      130.81,
      110,
      82.41
    ],
    "start": {
      "x": 3.5,
      "y": 21.5,
      "direction": -1.5708
    },
    "spawns": {
      "entrance": {
        "x": 3.5,
        "y": 21.5,
        "direction": -1.5708
      },
      "fromGlasswood": {
        "x": 22.5,
        "y": 2.5,
        "direction": 3.14159
      }
    },
    "map": [
      "11111111111111111111111111",
      "10000000000000000000000001",
      "10000000000000000000000001",
      "10000000440000004400000001",
      "10000000440000004400000001",
      "10000000440000004400000001",
      "10000000440000004400000001",
      "10000000440000004400000001",
      "10000000440000004400000001",
      "10000000000000000000000001",
      "10000000000000000000000001",
      "10000000000000000000000001",
      "10000000000000000000000001",
      "10000000000444400000000001",
      "10000000000444400000000001",
      "10000000000000000000000001",
      "10000000000000000000000001",
      "10000000000000000000000001",
      "10000000000000000000000001",
      "10000000000000000000000001",
      "10000000000000000000000001",
      "10000000000000000000000001",
      "10000000000000000000000001",
      "11111111111111111111111111"
    ],
    "floorZones": [
      {
        "x1": 1,
        "y1": 1,
        "x2": 24,
        "y2": 22,
        "material": "crypt"
      }
    ],
    "entities": [
      {
        "id": "abbey-to-march",
        "kind": "portal",
        "name": "Schody do Popelavého pochodu",
        "x": 2.5,
        "y": 22.5,
        "solid": false,
        "render": false,
        "interaction": {
          "type": "transition",
          "prompt": "Schody do Popelavého pochodu",
          "targetZone": "ashenMarch",
          "targetSpawn": "fromAbbey"
        }
      },
      {
        "id": "abbey-to-glasswood",
        "kind": "portal",
        "name": "Průchod do Skleněného hvozdu",
        "x": 23.5,
        "y": 2.5,
        "solid": false,
        "render": false,
        "interaction": {
          "type": "transition",
          "prompt": "Průchod do Skleněného hvozdu",
          "targetZone": "glasswood",
          "targetSpawn": "fromAbbey",
          "requiresFlag": "access:glasswood",
          "lockedText": "Cesta zůstává uzavřená, dokud nepokročí hlavní výprava."
        }
      },
      {
        "id": "abbey-reliquary",
        "kind": "obelisk",
        "name": "Reliikviář tří tváří",
        "x": 13.5,
        "y": 4.5,
        "solid": false,
        "dialogueId": "reliquaryVoice",
        "interaction": {
          "type": "dialogue",
          "prompt": "Promluvit: Reliikviář tří tváří"
        }
      },
      {
        "id": "abbey-board",
        "kind": "sign",
        "name": "Seznam nedokončených vigilií",
        "x": 5.5,
        "y": 21.5,
        "solid": false,
        "dialogueId": "abbeyBoard",
        "interaction": {
          "type": "dialogue",
          "prompt": "Prohlédnout zakázky"
        }
      },
      {
        "id": "abbey-candle-0",
        "kind": "torch",
        "name": "Věčná svíce",
        "x": 5.5,
        "y": 6.5,
        "solid": false,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Věčná svíce",
          "title": "Věčná svíce",
          "text": "Plamen hoří pod vodou a vrhá stín vzhůru.",
          "event": "inspect",
          "target": "abbey-candle",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "abbeyCandles",
            "status": "active"
          }
        ]
      },
      {
        "id": "abbey-candle-1",
        "kind": "torch",
        "name": "Věčná svíce",
        "x": 9.5,
        "y": 9.5,
        "solid": false,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Věčná svíce",
          "title": "Věčná svíce",
          "text": "Plamen hoří pod vodou a vrhá stín vzhůru.",
          "event": "inspect",
          "target": "abbey-candle",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "abbeyCandles",
            "status": "active"
          }
        ]
      },
      {
        "id": "abbey-candle-2",
        "kind": "torch",
        "name": "Věčná svíce",
        "x": 16.5,
        "y": 9.5,
        "solid": false,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Věčná svíce",
          "title": "Věčná svíce",
          "text": "Plamen hoří pod vodou a vrhá stín vzhůru.",
          "event": "inspect",
          "target": "abbey-candle",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "abbeyCandles",
            "status": "active"
          }
        ]
      },
      {
        "id": "abbey-candle-3",
        "kind": "torch",
        "name": "Věčná svíce",
        "x": 20.5,
        "y": 6.5,
        "solid": false,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Věčná svíce",
          "title": "Věčná svíce",
          "text": "Plamen hoří pod vodou a vrhá stín vzhůru.",
          "event": "inspect",
          "target": "abbey-candle",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "abbeyCandles",
            "status": "active"
          }
        ]
      },
      {
        "id": "abbey-relic-0",
        "kind": "fragment",
        "name": "Relikvie opatství",
        "x": 7.5,
        "y": 15.5,
        "solid": false,
        "interaction": {
          "type": "collect",
          "prompt": "Vzít: Relikvie opatství",
          "itemId": "abbey-relic",
          "itemName": "Relikvie opatství",
          "event": "collect",
          "target": "abbey-relic",
          "text": "Získáno: Relikvie opatství."
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "abbeyRelics",
            "status": "active"
          }
        ]
      },
      {
        "id": "abbey-relic-1",
        "kind": "fragment",
        "name": "Relikvie opatství",
        "x": 13.5,
        "y": 16.5,
        "solid": false,
        "interaction": {
          "type": "collect",
          "prompt": "Vzít: Relikvie opatství",
          "itemId": "abbey-relic",
          "itemName": "Relikvie opatství",
          "event": "collect",
          "target": "abbey-relic",
          "text": "Získáno: Relikvie opatství."
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "abbeyRelics",
            "status": "active"
          }
        ]
      },
      {
        "id": "abbey-relic-2",
        "kind": "fragment",
        "name": "Relikvie opatství",
        "x": 19.5,
        "y": 15.5,
        "solid": false,
        "interaction": {
          "type": "collect",
          "prompt": "Vzít: Relikvie opatství",
          "itemId": "abbey-relic",
          "itemName": "Relikvie opatství",
          "event": "collect",
          "target": "abbey-relic",
          "text": "Získáno: Relikvie opatství."
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "abbeyRelics",
            "status": "active"
          }
        ]
      },
      {
        "id": "abbey-shade-0",
        "kind": "enemyShade",
        "enemyId": "echoShade",
        "name": "Utopená ozvěna",
        "x": 6.5,
        "y": 11.5,
        "homeX": 6.5,
        "homeY": 11.5,
        "solid": true,
        "groupId": "abbey-shades"
      },
      {
        "id": "abbey-shade-1",
        "kind": "enemyShade",
        "enemyId": "echoShade",
        "name": "Utopená ozvěna",
        "x": 10.5,
        "y": 12.5,
        "homeX": 10.5,
        "homeY": 12.5,
        "solid": true,
        "groupId": "abbey-shades"
      },
      {
        "id": "abbey-shade-2",
        "kind": "enemyShade",
        "enemyId": "echoShade",
        "name": "Utopená ozvěna",
        "x": 14.5,
        "y": 11.5,
        "homeX": 14.5,
        "homeY": 11.5,
        "solid": true,
        "groupId": "abbey-shades"
      },
      {
        "id": "abbey-shade-3",
        "kind": "enemyShade",
        "enemyId": "echoShade",
        "name": "Utopená ozvěna",
        "x": 18.5,
        "y": 12.5,
        "homeX": 18.5,
        "homeY": 12.5,
        "solid": true,
        "groupId": "abbey-shades"
      },
      {
        "id": "abbey-shade-4",
        "kind": "enemyShade",
        "enemyId": "echoShade",
        "name": "Utopená ozvěna",
        "x": 21.5,
        "y": 10.5,
        "homeX": 21.5,
        "homeY": 10.5,
        "solid": true,
        "groupId": "abbey-shades"
      },
      {
        "id": "abbey-shade-5",
        "kind": "enemyShade",
        "enemyId": "echoShade",
        "name": "Utopená ozvěna",
        "x": 13.5,
        "y": 7.5,
        "homeX": 13.5,
        "homeY": 7.5,
        "solid": true,
        "groupId": "abbey-shades"
      },
      {
        "id": "abbey-sentinel-0",
        "kind": "enemySentinel",
        "enemyId": "hollowSentinel",
        "name": "Kamenný bratr",
        "x": 5.5,
        "y": 18.5,
        "homeX": 5.5,
        "homeY": 18.5,
        "solid": true,
        "groupId": "abbey-sentinels"
      },
      {
        "id": "abbey-sentinel-1",
        "kind": "enemySentinel",
        "enemyId": "hollowSentinel",
        "name": "Kamenný bratr",
        "x": 13.5,
        "y": 18.5,
        "homeX": 13.5,
        "homeY": 18.5,
        "solid": true,
        "groupId": "abbey-sentinels"
      },
      {
        "id": "abbey-sentinel-2",
        "kind": "enemySentinel",
        "enemyId": "hollowSentinel",
        "name": "Kamenný bratr",
        "x": 21.5,
        "y": 18.5,
        "homeX": 21.5,
        "homeY": 18.5,
        "solid": true,
        "groupId": "abbey-sentinels"
      }
    ],
    "traps": []
  },
  "glasswood": {
    "id": "glasswood",
    "name": "Skleněný hvozd",
    "subtitle": "Les, který si pamatuje jiné nebe",
    "environment": "outdoor",
    "skyTop": "#4a5868",
    "skyBottom": "#a18a68",
    "floorNear": "#373d2a",
    "floorFar": "#1b2118",
    "fog": "#58605c",
    "music": [
      82.41,
      110,
      130.81,
      164.81,
      146.83,
      110
    ],
    "nightMusic": [
      65.41,
      82.41,
      98,
      130.81,
      110,
      82.41
    ],
    "start": {
      "x": 2.5,
      "y": 12.5,
      "direction": 0
    },
    "spawns": {
      "fromAbbey": {
        "x": 2.5,
        "y": 12.5,
        "direction": 0
      },
      "fromArchive": {
        "x": 25.5,
        "y": 12.5,
        "direction": 3.14159
      }
    },
    "map": [
      "1111111111111111111111111111",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000003333000000000001",
      "1000033300003333000033300001",
      "1000033300003333000033300001",
      "1000033300000000000033300001",
      "1000000000000000000033300001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000033333300000000001",
      "1000000000033333300000000001",
      "1000000000033333300000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1111111111111111111111111111"
    ],
    "floorZones": [
      {
        "x1": 1,
        "y1": 1,
        "x2": 26,
        "y2": 22,
        "material": "grass"
      }
    ],
    "entities": [
      {
        "id": "glass-to-abbey",
        "kind": "portal",
        "name": "Cesta k opatství",
        "x": 1.5,
        "y": 12.5,
        "solid": false,
        "render": false,
        "interaction": {
          "type": "transition",
          "prompt": "Cesta k opatství",
          "targetZone": "drownedAbbey",
          "targetSpawn": "fromGlasswood"
        }
      },
      {
        "id": "glass-to-archive",
        "kind": "portal",
        "name": "Černá brána archivu",
        "x": 26.5,
        "y": 12.5,
        "solid": false,
        "render": false,
        "interaction": {
          "type": "transition",
          "prompt": "Černá brána archivu",
          "targetZone": "obsidianArchive",
          "targetSpawn": "fromGlasswood",
          "requiresFlag": "access:obsidianArchive",
          "lockedText": "Cesta zůstává uzavřená, dokud nepokročí hlavní výprava."
        }
      },
      {
        "id": "memory-tree-0",
        "kind": "obelisk",
        "name": "Paměťový strom",
        "x": 8.5,
        "y": 6.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Paměťový strom",
          "title": "Paměťový strom",
          "text": "Kůra se otevřela jako oko a ukázala cestu vyrytou ve vzpomínce.",
          "event": "inspect",
          "target": "memory-tree",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "memoryOrchard",
            "status": "active"
          }
        ]
      },
      {
        "id": "memory-tree-1",
        "kind": "obelisk",
        "name": "Paměťový strom",
        "x": 14.5,
        "y": 12.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Paměťový strom",
          "title": "Paměťový strom",
          "text": "Kůra se otevřela jako oko a ukázala cestu vyrytou ve vzpomínce.",
          "event": "inspect",
          "target": "memory-tree",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "memoryOrchard",
            "status": "active"
          }
        ]
      },
      {
        "id": "memory-tree-2",
        "kind": "obelisk",
        "name": "Paměťový strom",
        "x": 23.5,
        "y": 6.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Paměťový strom",
          "title": "Paměťový strom",
          "text": "Kůra se otevřela jako oko a ukázala cestu vyrytou ve vzpomínce.",
          "event": "inspect",
          "target": "memory-tree",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "memoryOrchard",
            "status": "active"
          }
        ]
      },
      {
        "id": "glass-enemy-0",
        "kind": "enemyHound",
        "enemyId": "echoHound",
        "name": "Tvor Skleněného hvozdu",
        "x": 6.5,
        "y": 17.5,
        "homeX": 6.5,
        "homeY": 17.5,
        "solid": true,
        "groupId": "glass-pack"
      },
      {
        "id": "glass-enemy-1",
        "kind": "enemyHound",
        "enemyId": "echoHound",
        "name": "Tvor Skleněného hvozdu",
        "x": 10.5,
        "y": 18.5,
        "homeX": 10.5,
        "homeY": 18.5,
        "solid": true,
        "groupId": "glass-pack"
      },
      {
        "id": "glass-enemy-2",
        "kind": "enemyCrawler",
        "enemyId": "mireCrawler",
        "name": "Tvor Skleněného hvozdu",
        "x": 18.5,
        "y": 16.5,
        "homeX": 18.5,
        "homeY": 16.5,
        "solid": true,
        "groupId": "glass-pack"
      },
      {
        "id": "glass-enemy-3",
        "kind": "enemyShade",
        "enemyId": "echoShade",
        "name": "Tvor Skleněného hvozdu",
        "x": 22.5,
        "y": 18.5,
        "homeX": 22.5,
        "homeY": 18.5,
        "solid": true,
        "groupId": "glass-pack"
      }
    ],
    "traps": []
  },
  "obsidianArchive": {
    "id": "obsidianArchive",
    "name": "Obsidiánový archiv",
    "subtitle": "Katalog pravých a zakázaných jmen",
    "environment": "dungeon",
    "skyTop": "#12131a",
    "skyBottom": "#252331",
    "floorNear": "#292725",
    "floorFar": "#101014",
    "fog": "#24242c",
    "music": [
      82.41,
      110,
      130.81,
      164.81,
      146.83,
      110
    ],
    "nightMusic": [
      65.41,
      82.41,
      98,
      130.81,
      110,
      82.41
    ],
    "start": {
      "x": 2.5,
      "y": 12.5,
      "direction": 0
    },
    "spawns": {
      "fromGlasswood": {
        "x": 2.5,
        "y": 12.5,
        "direction": 0
      }
    },
    "map": [
      "1111111111111111111111111111",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000004000000004000000001",
      "1000000004000000004000000001",
      "1000000004000000004000000001",
      "1000000004000000004000000001",
      "1000000004000000004000000001",
      "1000000004000000004000000001",
      "1000000004000000004000000001",
      "1000000004000000004000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000004444000000000001",
      "1000000000004444000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1111111111111111111111111111"
    ],
    "floorZones": [
      {
        "x1": 1,
        "y1": 1,
        "x2": 26,
        "y2": 22,
        "material": "crypt"
      }
    ],
    "entities": [
      {
        "id": "archive-to-glass",
        "kind": "portal",
        "name": "Cesta do Skleněného hvozdu",
        "x": 1.5,
        "y": 12.5,
        "solid": false,
        "render": false,
        "interaction": {
          "type": "transition",
          "prompt": "Cesta do Skleněného hvozdu",
          "targetZone": "glasswood",
          "targetSpawn": "fromArchive"
        }
      },
      {
        "id": "archive-to-city",
        "kind": "portal",
        "name": "Zrcadlový průchod do města",
        "x": 13.5,
        "y": 22.5,
        "solid": false,
        "render": false,
        "interaction": {
          "type": "transition",
          "prompt": "Zrcadlový průchod do města",
          "targetZone": "silverhaven",
          "targetSpawn": "fromCitadel"
        }
      },
      {
        "id": "archive-board",
        "kind": "sign",
        "name": "Okrajový katalog",
        "x": 3.5,
        "y": 20.5,
        "solid": false,
        "dialogueId": "archiveBoard",
        "interaction": {
          "type": "dialogue",
          "prompt": "Prohlédnout zakázky"
        }
      },
      {
        "id": "archive-seal",
        "kind": "lever",
        "name": "Pečetní páka archivu",
        "x": 5.5,
        "y": 12.5,
        "solid": true,
        "interaction": {
          "type": "lever",
          "prompt": "Aktivovat pečeť",
          "oneWay": true,
          "flag": "mechanism:archive-seal",
          "event": "mechanism",
          "target": "archive-seal",
          "targets": [],
          "text": "Černé sklo zaznělo hlubokým tónem a hlavní katalog se otevřel."
        }
      },
      {
        "id": "obsidian-tablet-0",
        "kind": "obelisk",
        "name": "Obsidiánová tabulka",
        "x": 8.5,
        "y": 7.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Obsidiánová tabulka",
          "title": "Obsidiánová tabulka",
          "text": "Tabulka popisuje část rituálu, který změnil člověka v příkaz.",
          "event": "inspect",
          "target": "obsidian-tablet",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "obsidianQuestions",
            "status": "active"
          }
        ]
      },
      {
        "id": "obsidian-tablet-1",
        "kind": "obelisk",
        "name": "Obsidiánová tabulka",
        "x": 14.5,
        "y": 7.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Obsidiánová tabulka",
          "title": "Obsidiánová tabulka",
          "text": "Tabulka popisuje část rituálu, který změnil člověka v příkaz.",
          "event": "inspect",
          "target": "obsidian-tablet",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "obsidianQuestions",
            "status": "active"
          }
        ]
      },
      {
        "id": "obsidian-tablet-2",
        "kind": "obelisk",
        "name": "Obsidiánová tabulka",
        "x": 20.5,
        "y": 7.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Obsidiánová tabulka",
          "title": "Obsidiánová tabulka",
          "text": "Tabulka popisuje část rituálu, který změnil člověka v příkaz.",
          "event": "inspect",
          "target": "obsidian-tablet",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "obsidianQuestions",
            "status": "active"
          }
        ]
      },
      {
        "id": "true-name-tablet",
        "kind": "fragment",
        "name": "Tabulka pravého jména",
        "x": 23.5,
        "y": 3.5,
        "solid": false,
        "interaction": {
          "type": "collect",
          "prompt": "Vzít: Tabulka pravého jména",
          "itemId": "true-name-tablet",
          "itemName": "Tabulka pravého jména",
          "event": "collect",
          "target": "true-name-tablet",
          "text": "Získáno: Tabulka pravého jména."
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "trueName",
            "status": "active"
          }
        ]
      },
      {
        "id": "archive-side-tablet-0",
        "kind": "obelisk",
        "name": "Vedlejší tabulka",
        "x": 6.5,
        "y": 4.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Vedlejší tabulka",
          "title": "Vedlejší tabulka",
          "text": "Okrajový zápis popisuje ztracený způsob čtení kamene.",
          "event": "inspect",
          "target": "archive-side-tablet",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "archiveTablets",
            "status": "active"
          }
        ]
      },
      {
        "id": "archive-side-tablet-1",
        "kind": "obelisk",
        "name": "Vedlejší tabulka",
        "x": 11.5,
        "y": 4.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Vedlejší tabulka",
          "title": "Vedlejší tabulka",
          "text": "Okrajový zápis popisuje ztracený způsob čtení kamene.",
          "event": "inspect",
          "target": "archive-side-tablet",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "archiveTablets",
            "status": "active"
          }
        ]
      },
      {
        "id": "archive-side-tablet-2",
        "kind": "obelisk",
        "name": "Vedlejší tabulka",
        "x": 17.5,
        "y": 4.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Vedlejší tabulka",
          "title": "Vedlejší tabulka",
          "text": "Okrajový zápis popisuje ztracený způsob čtení kamene.",
          "event": "inspect",
          "target": "archive-side-tablet",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "archiveTablets",
            "status": "active"
          }
        ]
      },
      {
        "id": "archive-side-tablet-3",
        "kind": "obelisk",
        "name": "Vedlejší tabulka",
        "x": 22.5,
        "y": 4.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Vedlejší tabulka",
          "title": "Vedlejší tabulka",
          "text": "Okrajový zápis popisuje ztracený způsob čtení kamene.",
          "event": "inspect",
          "target": "archive-side-tablet",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "archiveTablets",
            "status": "active"
          }
        ]
      },
      {
        "id": "archive-key-0",
        "kind": "key",
        "name": "Archivní klíč",
        "x": 7.5,
        "y": 17.5,
        "solid": false,
        "interaction": {
          "type": "collect",
          "prompt": "Vzít: Archivní klíč",
          "itemId": "archive-key",
          "itemName": "Archivní klíč",
          "event": "collect",
          "target": "archive-key",
          "text": "Získáno: Archivní klíč."
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "archiveKeys",
            "status": "active"
          }
        ]
      },
      {
        "id": "archive-key-1",
        "kind": "key",
        "name": "Archivní klíč",
        "x": 13.5,
        "y": 17.5,
        "solid": false,
        "interaction": {
          "type": "collect",
          "prompt": "Vzít: Archivní klíč",
          "itemId": "archive-key",
          "itemName": "Archivní klíč",
          "event": "collect",
          "target": "archive-key",
          "text": "Získáno: Archivní klíč."
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "archiveKeys",
            "status": "active"
          }
        ]
      },
      {
        "id": "archive-key-2",
        "kind": "key",
        "name": "Archivní klíč",
        "x": 20.5,
        "y": 17.5,
        "solid": false,
        "interaction": {
          "type": "collect",
          "prompt": "Vzít: Archivní klíč",
          "itemId": "archive-key",
          "itemName": "Archivní klíč",
          "event": "collect",
          "target": "archive-key",
          "text": "Získáno: Archivní klíč."
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "archiveKeys",
            "status": "active"
          }
        ]
      },
      {
        "id": "archive-secret-a",
        "kind": "mechanism",
        "name": "Chybějící police",
        "x": 8.5,
        "y": 10.5,
        "solid": false,
        "render": false,
        "secret": {
          "tileX": 9,
          "tileY": 10,
          "detectDifficulty": 2
        },
        "interaction": {
          "type": "secret",
          "prompt": "Odsunout polici",
          "tileX": 9,
          "tileY": 10,
          "openTile": 0,
          "event": "discover",
          "target": "archive-secret",
          "text": "Police ustoupila a odkryla zapomenutý průchod."
        }
      },
      {
        "id": "archive-secret-b",
        "kind": "mechanism",
        "name": "Slepý katalog",
        "x": 17.5,
        "y": 10.5,
        "solid": false,
        "render": false,
        "secret": {
          "tileX": 18,
          "tileY": 10,
          "detectDifficulty": 3
        },
        "interaction": {
          "type": "secret",
          "prompt": "Otevřít slepý katalog",
          "tileX": 18,
          "tileY": 10,
          "openTile": 0,
          "event": "discover",
          "target": "archive-secret",
          "text": "Černá deska se rozpadla na tichý prach."
        }
      },
      {
        "id": "archive-shade-0",
        "kind": "enemyShade",
        "enemyId": "echoShade",
        "name": "Indexová ozvěna",
        "x": 6.5,
        "y": 14.5,
        "homeX": 6.5,
        "homeY": 14.5,
        "solid": true,
        "groupId": "archive-shades"
      },
      {
        "id": "archive-shade-1",
        "kind": "enemyShade",
        "enemyId": "echoShade",
        "name": "Indexová ozvěna",
        "x": 10.5,
        "y": 15.5,
        "homeX": 10.5,
        "homeY": 15.5,
        "solid": true,
        "groupId": "archive-shades"
      },
      {
        "id": "archive-shade-2",
        "kind": "enemyShade",
        "enemyId": "echoShade",
        "name": "Indexová ozvěna",
        "x": 15.5,
        "y": 14.5,
        "homeX": 15.5,
        "homeY": 14.5,
        "solid": true,
        "groupId": "archive-shades"
      },
      {
        "id": "archive-shade-3",
        "kind": "enemyShade",
        "enemyId": "echoShade",
        "name": "Indexová ozvěna",
        "x": 20.5,
        "y": 15.5,
        "homeX": 20.5,
        "homeY": 15.5,
        "solid": true,
        "groupId": "archive-shades"
      },
      {
        "id": "archive-shade-4",
        "kind": "enemyShade",
        "enemyId": "echoShade",
        "name": "Indexová ozvěna",
        "x": 23.5,
        "y": 12.5,
        "homeX": 23.5,
        "homeY": 12.5,
        "solid": true,
        "groupId": "archive-shades"
      }
    ],
    "traps": []
  },
  "crownCitadel": {
    "id": "crownCitadel",
    "name": "Korunní citadela",
    "subtitle": "Pevnost kolem rány ve světě",
    "environment": "outdoor",
    "skyTop": "#362f4e",
    "skyBottom": "#9c625c",
    "floorNear": "#373d2a",
    "floorFar": "#1b2118",
    "fog": "#5b4d62",
    "music": [
      82.41,
      110,
      130.81,
      164.81,
      146.83,
      110
    ],
    "nightMusic": [
      65.41,
      82.41,
      98,
      130.81,
      110,
      82.41
    ],
    "start": {
      "x": 2.5,
      "y": 12.5,
      "direction": 0
    },
    "spawns": {
      "fromCity": {
        "x": 2.5,
        "y": 12.5,
        "direction": 0
      },
      "fromThrone": {
        "x": 25.5,
        "y": 12.5,
        "direction": 3.14159
      }
    },
    "map": [
      "1111111111111111111111111111",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000044400000000000044400001",
      "1000044400000000000044400001",
      "1000044400000000000044400001",
      "1000044400000000000044400001",
      "1000044400000000000044400001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000044444400000000001",
      "1000000000044444400000000001",
      "1000000000044444400000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1000000000000000000000000001",
      "1111111111111111111111111111"
    ],
    "floorZones": [
      {
        "x1": 1,
        "y1": 1,
        "x2": 26,
        "y2": 22,
        "material": "stone"
      }
    ],
    "entities": [
      {
        "id": "crown-to-city",
        "kind": "portal",
        "name": "Cesta do Stříbrného přístavu",
        "x": 1.5,
        "y": 12.5,
        "solid": false,
        "render": false,
        "interaction": {
          "type": "transition",
          "prompt": "Cesta do Stříbrného přístavu",
          "targetZone": "silverhaven",
          "targetSpawn": "fromCitadel"
        }
      },
      {
        "id": "crown-to-throne",
        "kind": "portal",
        "name": "Brána Prázdného trůnu",
        "x": 26.5,
        "y": 12.5,
        "solid": false,
        "render": false,
        "interaction": {
          "type": "transition",
          "prompt": "Brána Prázdného trůnu",
          "targetZone": "hollowThrone",
          "targetSpawn": "entrance",
          "requiresFlag": "access:hollowThrone",
          "lockedText": "Cesta zůstává uzavřená, dokud nepokročí hlavní výprava."
        }
      },
      {
        "id": "crown-anchor-0",
        "kind": "obelisk",
        "name": "Paměťová kotva",
        "x": 8.5,
        "y": 6.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Paměťová kotva",
          "title": "Paměťová kotva",
          "text": "Kotva praskla a z kamene vytekla vzpomínka na svět, který nikdy neexistoval.",
          "event": "inspect",
          "target": "crown-anchor",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "threeAnchors",
            "status": "active"
          }
        ]
      },
      {
        "id": "crown-anchor-1",
        "kind": "obelisk",
        "name": "Paměťová kotva",
        "x": 14.5,
        "y": 12.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Paměťová kotva",
          "title": "Paměťová kotva",
          "text": "Kotva praskla a z kamene vytekla vzpomínka na svět, který nikdy neexistoval.",
          "event": "inspect",
          "target": "crown-anchor",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "threeAnchors",
            "status": "active"
          }
        ]
      },
      {
        "id": "crown-anchor-2",
        "kind": "obelisk",
        "name": "Paměťová kotva",
        "x": 23.5,
        "y": 6.5,
        "solid": true,
        "interaction": {
          "type": "inspect",
          "prompt": "Prozkoumat: Paměťová kotva",
          "title": "Paměťová kotva",
          "text": "Kotva praskla a z kamene vytekla vzpomínka na svět, který nikdy neexistoval.",
          "event": "inspect",
          "target": "crown-anchor",
          "experience": 20
        },
        "visibleWhen": [
          {
            "type": "questStatus",
            "questId": "threeAnchors",
            "status": "active"
          }
        ]
      },
      {
        "id": "crown-guard-0",
        "kind": "enemyRaider",
        "enemyId": "ashRaider",
        "name": "Strážce Koruny",
        "x": 6.5,
        "y": 17.5,
        "homeX": 6.5,
        "homeY": 17.5,
        "solid": true,
        "groupId": "crown-guard"
      },
      {
        "id": "crown-guard-1",
        "kind": "enemyRaider",
        "enemyId": "ashRaider",
        "name": "Strážce Koruny",
        "x": 10.5,
        "y": 18.5,
        "homeX": 10.5,
        "homeY": 18.5,
        "solid": true,
        "groupId": "crown-guard"
      },
      {
        "id": "crown-guard-2",
        "kind": "enemySentinel",
        "enemyId": "hollowSentinel",
        "name": "Strážce Koruny",
        "x": 18.5,
        "y": 17.5,
        "homeX": 18.5,
        "homeY": 17.5,
        "solid": true,
        "groupId": "crown-guard"
      },
      {
        "id": "crown-guard-3",
        "kind": "enemySentinel",
        "enemyId": "hollowSentinel",
        "name": "Strážce Koruny",
        "x": 22.5,
        "y": 18.5,
        "homeX": 22.5,
        "homeY": 18.5,
        "solid": true,
        "groupId": "crown-guard"
      },
      {
        "id": "crown-guard-4",
        "kind": "enemyShade",
        "enemyId": "echoShade",
        "name": "Strážce Koruny",
        "x": 14.5,
        "y": 6.5,
        "homeX": 14.5,
        "homeY": 6.5,
        "solid": true,
        "groupId": "crown-guard"
      }
    ],
    "traps": []
  },
  "hollowThrone": {
    "id": "hollowThrone",
    "name": "Prázdný trůn",
    "subtitle": "Konec lži, nebo její nové jméno",
    "environment": "dungeon",
    "skyTop": "#12131a",
    "skyBottom": "#252331",
    "floorNear": "#292725",
    "floorFar": "#101014",
    "fog": "#24242c",
    "music": [
      82.41,
      110,
      130.81,
      164.81,
      146.83,
      110
    ],
    "nightMusic": [
      65.41,
      82.41,
      98,
      130.81,
      110,
      82.41
    ],
    "start": {
      "x": 3.5,
      "y": 21.5,
      "direction": -1.5708
    },
    "spawns": {
      "entrance": {
        "x": 3.5,
        "y": 21.5,
        "direction": -1.5708
      }
    },
    "map": [
      "11111111111111111111111111",
      "10000000000000000000000001",
      "10000000000000000000000001",
      "10000000000000000000000001",
      "10000000000000000000000001",
      "10000044000000000044000001",
      "10000044000000000044000001",
      "10000044000000000044000001",
      "10000044000000000044000001",
      "10000044000000000044000001",
      "10000044004444440044000001",
      "10000044004444440044000001",
      "10000044000000000044000001",
      "10000044000000000044000001",
      "10000044000000000044000001",
      "10000044000000000044000001",
      "10000044000000000044000001",
      "10000044000000000044000001",
      "10000044000000000044000001",
      "10000000000000000000000001",
      "10000000000000000000000001",
      "10000000000000000000000001",
      "10000000000000000000000001",
      "11111111111111111111111111"
    ],
    "floorZones": [
      {
        "x1": 1,
        "y1": 1,
        "x2": 24,
        "y2": 22,
        "material": "crypt"
      }
    ],
    "entities": [
      {
        "id": "throne-to-crown",
        "kind": "portal",
        "name": "Návrat do citadely",
        "x": 2.5,
        "y": 22.5,
        "solid": false,
        "render": false,
        "interaction": {
          "type": "transition",
          "prompt": "Návrat do citadely",
          "targetZone": "crownCitadel",
          "targetSpawn": "fromThrone"
        }
      },
      {
        "id": "mor-kharr",
        "kind": "enemyWarden",
        "enemyId": "morKharr",
        "name": "Mor-Kharr, pán prázdné koruny",
        "x": 13.5,
        "y": 4.5,
        "homeX": 13.5,
        "homeY": 4.5,
        "solid": true,
        "groupId": "final-throne"
      },
      {
        "id": "throne-sentinel-0",
        "kind": "enemySentinel",
        "enemyId": "hollowSentinel",
        "name": "Strážce pravého jména",
        "x": 9.5,
        "y": 7.5,
        "homeX": 9.5,
        "homeY": 7.5,
        "solid": true,
        "groupId": "final-throne"
      },
      {
        "id": "throne-sentinel-1",
        "kind": "enemySentinel",
        "enemyId": "hollowSentinel",
        "name": "Strážce pravého jména",
        "x": 17.5,
        "y": 7.5,
        "homeX": 17.5,
        "homeY": 7.5,
        "solid": true,
        "groupId": "final-throne"
      }
    ],
    "traps": []
  }
});
