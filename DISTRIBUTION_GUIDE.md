# Distribuční příručka

## GitHub Pages

1. Spusťte `npm install`, `npm test` a `npm run build`.
2. Obsah adresáře `dist/` nahrajte do kořene publikační větve.
3. V GitHub Settings → Pages nastavte `Deploy from a branch`, větev `main`, adresář `/ (root)`.
4. Ověřte HTTPS adresu a načtení `manifest.webmanifest`, `sw.js`, `vendor/three.module.min.js` a `vendor/three.core.min.js`.
5. Po vydání nové verze zvyšte query parametr assetů i `CACHE_VERSION` service workeru.

## Jiný statický hosting

Hosting musí poskytovat HTTPS, zachovávat strukturu adresářů a vracet správné MIME typy pro `.js`, `.json`, `.webmanifest`, `.png`, `.jpg` a `.mp3`. Není nutný serverový routing ani databáze.

## Předprodukční kontrola

```bash
npm install
npm test
npm run build
python3 -m http.server 8080 --directory dist
```

Kontrolujte:

- čisté načtení bez cache,
- instalaci PWA,
- novou hru a pokračování,
- zvuk po prvním dotyku,
- změnu oblasti a hudební crossfade,
- ukládání, export a import,
- WebGL i Canvas fallback,
- landscape režim na iPhonu.

## Cache

Full Release 4.0 používá cache prefix `ksb-4.0.1-combatfix`. Audio se ukládá odděleně při použití. Při problému se starým vzhledem odstraňte data webu nebo předchozí instalaci PWA a otevřete stránku znovu.

## Archivace releasu

Uchovávejte zdrojový ZIP, webový ZIP, oba `.sha256` soubory a výstup `npm test`. Distribuční ZIP nesmí obsahovat `.git`, `node_modules`, testovací screenshoty ani vývojové WAV soubory.
