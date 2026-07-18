# Full Release 4.0 — produkční zpráva

## Stav

`Kroniky Stříbrné brány 4.0.0` je obsahově uzavřený statický browserový build připravený k nasazení na GitHub Pages nebo libovolný HTTPS hosting. Kampaň má začátek, rozhodovací osu, finální souboj a devět epilogů. Release nevyžaduje backend ani externí runtime CDN.

## Rozsah

| Oblast | Hodnota |
|---|---:|
| Kampaně oblasti | 10 |
| Hlavní / vedlejší questy | 20 / 30 |
| Mapové entity | 240 |
| Bojové entity | 100 |
| Nepřátelské archetypy | 16 |
| Nepřátelské schopnosti | 18 |
| Lore objekty | 41 |
| Truhly | 10 |
| Pasti | 11 |
| Předměty | 46 |
| Hráčské schopnosti | 16 |
| Zakončení | 9 |

## Svět a prostředí

Každá oblast má vlastní profil v `WorldArtDirector.js`: materiály podlah a stěn, oblohu, mlhu, hemisférické a směrové světlo, ambientní intenzitu a sadu regionálních objektů. Výtvarné sady pokrývají údolí, horský průsmyk, kryptu, přístav, popelavou krajinu, zatopené opatství, krystalický les, obsidiánový archiv, korunní citadelu a Prázdný trůn.

Materiálová knihovna obsahuje 33 sad a 99 map o rozlišení 128×128. Každá sada má diffuse, normal a roughness mapu. Textury jsou generovatelné deterministickým build nástrojem a zůstávají lokální.

## Modely

`CreatureFactory.js` vytváří 16 samostatných low-poly dark-fantasy archetypů. Modely používají odlišnou anatomii, zbroj, zbraně, emissive prvky a animované části. `WorldArtDirector.js` vytváří regionální stromy, skály, budovy, věže, stánky, doky, vozy, oblouky, sarkofágy, knihovny, sloupy, cimbuří, bannery, trůn, hroby, vodu a krystaly.

## Audio

Každá oblast má vlastní ambientní stopu. Sedm pozdějších oblastí dostalo nové hudební téma a původní tři oblasti si zachovaly denní/noční nebo dungeonové varianty. Celá banka má 15 hudebních témat, 10 ambientů a 71 krátkých efektů. Integrita každého MP3 je evidována v `audio-index.json` pomocí SHA-256.

## Renderer a výkon

- Three.js `0.179.1` je uložen lokálně včetně požadovaného `three.core.min.js`.
- WebGL výstup prochází 12bitovým postprocessem a Bayerovým ditheringem.
- `PerformanceGovernor` upravuje interní rozlišení, stíny a detail podle FPS.
- Nouzový Canvas renderer zachovává hratelnost bez WebGL.
- PWA cache odděluje kritické assety a audio načítané při použití.

## Ukládání

Save format zůstává verze 12. Uložená data mají kontrolní součet, rotační zálohu, obnovu při poškození, export/import a migraci starších podporovaných verzí.

## Validace

Release prochází 61 automatickými testovacími skupinami. Navíc je před vydáním znovu sestaven v čistém adresáři, rozbalen z obou ZIP archivů a ověřen přes HTTP včetně velikostí a SHA-256 všech distribučních souborů.

## Neautomatizované QA

Automatizace nenahrazuje:

- kompletní lidské dohrání bez vývojových zkratek,
- posouzení obtížnosti a ekonomiky více hráči,
- měření teploty, baterie a FPS na fyzickém iPhonu,
- subjektivní mastering hudby na více reproduktorech,
- kontrolu každé kombinace rozlišení a browser chrome.

Tyto body musí být provedeny na živém produkčním nasazení a nejsou v reportu označeny jako splněné.
