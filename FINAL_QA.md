# Full Release 4.0 — QA matice

## Automaticky potvrzeno

- 63 testovacích skupin pro data, systémy, renderer, audio, PWA a build,
- 10 platných map a 19 přechodů,
- dokončitelná hlavní osa a 9 epilogů,
- 240 mapových a 100 bojových entit,
- 16 nepřátelských archetypů a 18 nepřátelských schopností,
- 99 validních PBR PNG map,
- 96 MP3 souborů s SHA-256 indexem,
- lokální modulový graf Three.js včetně `three.core.min.js`,
- save format 12, checksum, backup, import a export,
- PWA manifest, ikony, service worker a oddělená audio cache,
- responzivní breakpointy pro landscape výšku 620 a 430 px,
- přístupnost, zoom, fokus, high contrast a reduced motion,
- čistý build a shoda distribučních souborů po rozbalení.

## Ruční release checklist

- [ ] nová hra na fyzickém iPhonu v landscape,
- [ ] pokračování ze save po zavření PWA,
- [ ] 30minutová kontrola stability a teploty,
- [ ] kontrola Low / Auto / High profilu,
- [ ] kontrola joysticku na levé a pohledu na pravé části obrazovky,
- [ ] kontrola, že se desktopový HUD nezobrazuje současně s mobilním,
- [ ] přechod všech deseti oblastí a změna hudby,
- [ ] souboj s každým typem nepřítele,
- [ ] kompletní dohrání bez vývojových zásahů,
- [ ] ověření všech devíti zakončení,
- [ ] poslech hudby přes reproduktor telefonu a sluchátka,
- [ ] test offline spuštění po předchozím kompletním načtení.

## Kritéria blokující distribuci

Release se nesmí označit jako ověřený na konkrétním zařízení, pokud nebyl proveden výše uvedený fyzický test. Automatická validace potvrzuje integritu a logiku, nikoli subjektivní ergonomii, mastering ani tepelný výkon telefonu.
