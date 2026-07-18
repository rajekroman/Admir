# Full Release 4.0 — profesionální vizuální systém

## Záměr

Vizuální jazyk kombinuje dospělou dark fantasy, hmotné materiály, omezenou 12bitovou paletu a rozhraní klasických party-based RPG. Cílem není dětská pixelová kresba ani hladký generický mobilní overlay, ale jednotná produkční prezentace s čitelnou siluetou, atmosférou a hierarchií.

## Renderer

`HybridRenderer` preferuje `CinematicRenderer` nad lokálním Three.js. Pokud WebGL není dostupné, aktivuje Canvas `Raycaster` jako funkční fallback.

Hlavní průchod používá:

- perspektivní kameru a prostorové světlo,
- exponential fog podle lokace,
- stíny upravované výkonovým profilem,
- PBR diffuse/normal/roughness mapy,
- offscreen `WebGLRenderTarget`,
- 16 úrovní na každý RGB kanál,
- Bayerův 4×4 dithering,
- nearest-neighbour prezentaci adaptivního interního rozlišení.

## Výtvarná režie oblastí

`WorldArtDirector` obsahuje deset profilů. Každý profil určuje podlahy, stěny, barvu oblohy a mlhy, intenzitu světel a regionální sadu objektů. Materiály jsou načítány pouze podle aktuální oblasti a používají opakování odpovídající podlahám nebo svislým stěnám.

Knihovna obsahuje 33 materiálových sad a 99 map. Regionální set dressing vytváří stromy, skály, budovy, věže, stánky, doky, spálené vozy, klášterní oblouky, sarkofágy, knihovny, obsidiánové sloupy, cimbuří, bannery, vodu, krystaly a trůnní prvky.

## Bestiář

`CreatureFactory` vytváří 16 modelových archetypů. Modely nepoužívají jeden zaměnitelný humanoidní základ: honič, lezoun, nájezdník, mnich, stopař, bludička, přízrak, golem, rytíř, herold a bossové mají odlišnou anatomii, proporce, zbraně a emissive prvky. Animace reagují na AI aktivitu, útok, zásah, životy a smrt.

## HUD

Rozhraní používá kamenné a obsidiánové panely, mosazné akcenty a oddělené sekce:

- čtyři portréty družiny,
- HP a mana,
- minimapa a kompas,
- textový quest tracker a log,
- hotbar schopností,
- rychlý inventář,
- cílový panel a stav boje.

Samostatná landscape pravidla pro nízké displeje zabraňují souběžnému zobrazení desktopového a dotykového HUDu.

## Adaptivní výkon

`PerformanceGovernor` volí Low, Balanced, High nebo Auto profil. Upravuje interní rozlišení, stíny a detail dekorací. Ruční profil není automaticky přepisován. PBR textury mají 128×128 pixelů, což odpovídá 12bitové stylizaci a omezuje paměť na mobilním GPU.

## Verze

- aplikace: `4.0.0`,
- PWA cache: `ksb-4.0.1-combatfix`,
- asset query: `v=4.0.1`,
- save format: `12`.
