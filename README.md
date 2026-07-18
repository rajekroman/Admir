# Kroniky Stříbrné brány — Full Release 4.0.1

Původní first-person dark-fantasy RPG pro moderní prohlížeče, počítače a iPhone. Verze `4.0.1` obsahuje dokončitelnou kampaň, plně diferencovaných deset oblastí, vlastní bestiář, PBR materiálovou knihovnu, regionální hudební témata, adaptivní 12bitový WebGL renderer, mobilní ovládání a instalovatelnou PWA.

## Hotfix 4.0.1

Tato verze opravuje zastavení hry při prvním zobrazení nepřítele na iPhonu. Audio se dekóduje po jednotlivých scénách místo celé 96souborové banky, iPhone používá lehčí prostorové modely protivníků a výjimka rendereru už nemůže ukončit hlavní animační smyčku. Formát uložené pozice zůstává v12 a existující save je kompatibilní.

## Herní obsah

- 10 propojených oblastí,
- 20 hlavních a 30 vedlejších úkolů,
- 3 frakce a 9 variant epilogu,
- 4členná družina a 4 herní třídy,
- 46 předmětů a 16 aktivních schopností,
- 16 nepřátelských archetypů,
- 100 bojových entit a čtyřfázový finální boss,
- 240 mapových entit, 41 lore objektů, 10 truhel a 11 pastí,
- 15 dialogových stromů a 19 přechodů mezi oblastmi.

## Produkční výtvarná vrstva

Hlavní renderer používá lokální Three.js WebGL a automaticky přechází na Canvas fallback, pokud WebGL není dostupné.

- 10 samostatných světelných, mlhových a barevných profilů oblastí,
- 33 autorských materiálových sad,
- 99 texturových map: diffuse, normal a roughness,
- regionální architektura, vegetace, ruiny, voda, krystaly, bannery a interiérové dekorace,
- 16 prostorových archetypů protivníků s odlišnou siluetou a animací,
- 12bitová RGB kvantizace na 4096 barev s Bayerovým ditheringem,
- adaptivní interní rozlišení, stíny a hustota dekorací,
- jednotný kamenný HUD s portréty, minimapou, logem, hotbarem a rychlým inventářem.

Starší bitmapové atlasy jsou součástí nouzového Canvas fallbacku; hlavní WebGL zobrazení používá `WorldArtDirector`, `CreatureFactory` a PBR materiály.

## Hudba a zvuk

Zvuková banka obsahuje 96 komprimovaných MP3 souborů:

- 15 původních hudebních smyček,
- unikátní hudební téma každé kampaně oblasti,
- 10 samostatných ambientních vrstev,
- 71 efektů prostředí, magie, zbraní, UI a bestiáře,
- samostatný zvukový archetyp všech 16 typů nepřátel,
- crossfade hudebních scén a nezávislé audio sběrnice.

Audio se načítá na pozadí a PWA jej ukládá až při použití, takže neblokuje hlavní menu ani první instalaci.

## Ovládání

### Počítač

- `WASD` — pohyb,
- myš — rozhlížení,
- kliknutí nebo `R` — útok,
- `1–8` — schopnosti,
- `F` — interakce,
- `Tab` — další cíl,
- `T` — taktická pauza,
- `Esc` — menu.

### iPhone a dotykové zařízení

- dotyk vlevo vytvoří pohybový joystick,
- tažení vpravo ovládá pohled v obou osách,
- velké kontextové tlačítko provádí útok nebo interakci,
- samostatný landscape layout zabraňuje překrytí desktopového HUDu,
- lze měnit citlivost, měřítko HUDu, průhlednost joysticku a kvalitu obrazu.

## Spuštění a build

Projekt používá ES moduly a musí běžet přes HTTP:

```bash
python3 -m http.server 8080
```

Poté otevřete `http://localhost:8080`.

Testy a čistý distribuční build:

```bash
npm install
npm test
npm run build
```

Výstup pro GitHub Pages vznikne v adresáři `dist/`.

## Automatické ověření

Sada obsahuje 63 testovacích skupin. Kontroluje příběh, mapy, kampaň, souboje, AI, pathfinding, boss fáze, magii, inventář, ekonomiku, save recovery, PWA, přístupnost, audio, modulový graf, všechny PBR textury, obsahovou hustotu, adaptivní výkon a statický kontrakt Full Release 4.0.

## Dokumentace

- `FULL_RELEASE_4_REPORT.md` — architektura, obsah a validační výsledek,
- `CONTENT_COMPLETION.md` — inventura produkčního obsahu,
- `DISTRIBUTION_GUIDE.md` — nasazení a distribuce,
- `CREDITS_AND_LICENSES.md` — autorské a third-party informace,
- `FINAL_QA.md` — ruční validační body pro fyzická zařízení,
- `FULL_RELEASE_ASSET_SHEET.png` — inventura finálních výtvarných sad.

## Ověřená omezení

Automatické datové, modulové, buildové, PWA a HTTP kontroly jsou součástí repozitáře. Pracovní kontejner však neposkytuje spolehlivý EGL/ANGLE WebGL výstup pro Chromium. Pocit z dotykového ovládání, GPU výkon, čitelnost na konkrétním iPhonu a kompletní lidské dohrání je proto nutné potvrdit na živém nasazení. Tato omezení nejsou vydávána za úspěšně dokončené testy.
