# Checklist abans d'entregar

## Sempre

- `git status` revisat.
- Canvi limitat a la fita demanada.
- Cap secret al diff.
- `PROJECT.md`, `ROADMAP.md` o `CHANGELOG.md` actualitzats si canvia comportament, arquitectura o estat.
- `npm run check` superat.

## Si toca el Worker

- Versions sincronitzades a `worker/index.js`, `package.json`, `project.json`, `service-worker.js` i tests.
- Cap promesa queda sense `await`, `return` o `ctx.waitUntil()`.
- Cap estat especific d'una peticio queda en variables globals.
- Rutes noves amb errors llegibles i cap dada sensible.
- D1 amb consultes parametrades i indexos si hi ha filtres nous o volum.
- No s'executa cap migracio ni desplegament sense confirmacio humana explicita.

## Si toca avisos

- El navegador pot subscriure's sense forcar permisos.
- La prova local i l'enviament real estan diferenciats.
- El missatge d'error explica si falla OneSignal, la clau API o el destinatari.
- No es marca cap avis oficial com a enviat si OneSignal no confirma destinataris.

## Si toca xarxes socials

- Cada canal pot fallar sense bloquejar els altres.
- Els canals publicats no es dupliquen en reintents parcials.
- Les targetes socials responen en una URL publica HTTPS.
- `PUBLIC_WORKER_URL` apunta al Worker correcte.
- TikTok i YouTube es mostren separats del flux social principal quan sigui necessari.

## Si toca frontend o PWA

- Menus i capcalera provats en mobil.
- No hi ha cap capa desplegable transparent que tapi dades.
- `manifest.json`, icones i service worker continuen coherents.
- Textos d'espera no degraden SEO ni accessibilitat.
