# QA report — Clean Rebuild 6.0

## Statické kontroly

- JavaScript syntaxe: OK (`node --check`).
- 70 odkazů na HTML prvky: všechny existují.
- Chybějící lokální assety: 0.
- Manifest: validní JSON.
- Hudba: 5 validních mono PCM WAV souborů, 16 bit / 16 kHz.
- Service worker: záměrně nepoužit.

## Browser testy

Test proběhl v headless Chromiu přes vložený obsah stránky, protože administrátorská politika prostředí blokuje navigaci na `localhost` i `file://`.

Ověřeno:

- mobilní viewport 390 × 844 px;
- landscape viewport 844 × 390 px;
- canvas přesně vyplní viewport;
- titulní obrazovka, brief a spuštění hry;
- inicializace všech pěti map a více než jedna sekunda vykreslování každé mapy;
- žádná JavaScriptová chyba v konzoli;
- Chlum: rozhovor s Václavem a první úspěšné kopání;
- Ločenice: pět správných určení a tři pravé kusy;
- Nesměň: souhlas, vykopání profilu a jeho zahrabání;
- Besednice: tři stopy, vznik ježkového profilu, tři úspěšné zásahy v minihře a upozornění „BYL JSI OKRADEN OD FEŤÁKA“;
- Besednice: spuštění Karla, tři zásahy a vrácení ježka;
- skutečné plnění nebezpečí v kuželu Karlovy svítilny;
- Malše: tři dokumenty, boss Franta a dokončení cíle;
- výběr tří kamenů, aktivace poroty a výsledná obrazovka.

## Omezení testu

Fyzický Safari/iPhone test zde nelze nahradit. Po GitHub deploymentu je nutná krátká kontrola zvuku, haptiky a dotykového joysticku na konkrétním zařízení.
