# Guia rapida per continuar el projecte

## Lectura minima

1. `AGENTS.md`
2. `PROJECT.md`
3. Ultima entrada de `CHANGELOG.md`
4. Primer bloc de `ROADMAP.md`
5. Aquesta guia

Amb aixo n'hi ha prou per entendre l'estat actual sense rellegir converses antigues.

## Abans de tocar codi

1. Comprova la branca i l'estat del repositori.
2. Identifica si el canvi afecta frontend, Worker, D1, PWA, socials o avisos.
3. Si afecta produccio, secrets, publicacions, programadors o D1, confirma que hi ha autoritzacio humana explicita.
4. Mantingues el canvi petit i verificable.

## Punts que es trenquen facilment

- Versions desalineades entre web, service worker, Worker i tests.
- Targetes socials generades en una URL de Worker antiga.
- OneSignal amb subscripcio local correcta pero clau API server-side incorrecta.
- Canvis a SQL sense indexos o sense compatibilitat amb taules existents.
- Automatitzacions socials que dupliquen publicacions quan un canal falla parcialment.

## Proves habituals

- Canvi petit i local: `npm run test:quick`
- Abans de PR: `npm run check`
- Canvi de Worker: afegeix revisio manual de rutes afectades i dry-run si hi ha configuracio real.
- Canvi visual/mobile: prova amplades estretes i capcalera/menu flotant.

## Estat operatiu conegut

- La publicacio social depen de `PUBLIC_WORKER_URL` i de la versio desplegada del Worker.
- La prova real d'avisos depen de `ONESIGNAL_API_KEY`; `ONESIGNAL_REST_API_KEY` continua acceptat com a alias temporal.
- YouTube Shorts es gestiona amb GitHub Actions.
- TikTok pot estar connectat sense tenir encara `Direct Post` aprovat.

