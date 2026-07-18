# Full Release 4.0.1 — iPhone Combat Freeze Hotfix

## Nahlášená závada

Na iPhonu se hra po načtení uložené pozice zastavila při prvním zobrazení nepřítele. Screenshot zachytil aktivovaný cíl „Ozvěnový honič“ a neaktualizovaný banner oblasti.

## Kořenové příčiny

1. `AudioManager.unlock()` čekal na stažení a následně dekódoval celou banku 96 MP3 souborů. Hromadné `decodeAudioData()` mohlo na mobilním Safari zablokovat hlavní vlákno právě během prvního souboje.
2. Herní `Clock` plánoval další `requestAnimationFrame` až po dokončení renderu. Jediná výjimka při lazy vytvoření prvního 3D protivníka proto ukončila celý animační řetězec.
3. Mobilní Safari dostávalo stejné geometricky náročné modely s edge geometriemi jako desktop.

## Oprava

- okamžité odemčení AudioContextu bez čekání na celou banku,
- dekódování pouze hudby a ambientu aktuální scény,
- efekty se načítají a dekódují jednotlivě při prvním použití,
- 16 samostatných lightweight modelů pro iPhone,
- fallback professional model → lightweight model → billboard,
- safe mode vypne postprocess a stíny při chybě rendereru,
- ochrana proti `webglcontextlost`,
- další frame se plánuje před update/render fází,
- runtime chyba se zaznamená, ale pozice a herní logika pokračují.

## Kompatibilita

- save format: v12 beze změny,
- existující uložená pozice je kompatibilní,
- questy, inventář, postavy a stav nepřátel se nemažou.
