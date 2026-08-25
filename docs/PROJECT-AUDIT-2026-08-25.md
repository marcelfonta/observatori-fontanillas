# Auditoria del projecte - 2026-08-25

## Resum

El projecte es funcional i molt complet, pero ja te prou superficie per patir quan una versio de Worker, web, PWA o automatitzacio queda desalineada. La millor millora immediata no es afegir mes funcions, sino reforcar diagnosi, proves i documentacio curta.

## Incidencies revisades

- Publicacions Facebook, Instagram i Threads amb HTTP 404: causa probable confirmada, Worker public en V22.10 mentre el repositori ja esperava rutes/comportament de V22.12. S'ha afegit comprovacio de versio abans d'intentar usar una targeta social.
- Avisos push amb `Access denied`: subscripcio del dispositiu correcta, pero clau server-side de OneSignal absent, incorrecta o d'una app diferent. S'ha normalitzat el nom preferit del secret a `ONESIGNAL_API_KEY` i s'ha mantingut compatibilitat amb `ONESIGNAL_REST_API_KEY`.
- Avis de limits D1: hi havia neteges petites en camins de peticio. S'han mogut cap a manteniment programat i s'han afegit indexos compostos per reduir lectures.

## Simplificacions aplicades

- `PROJECT.md` queda com a mapa viu i curt del sistema; l'historial detallat passa a `CHANGELOG.md`.
- Nou executor de proves `scripts/run-tests.mjs` per descobrir tests automaticament.
- Nova ordre `npm run test:quick` per validar rapidament abans de continuar.
- Checklist d'entrega separada a `docs/RELEASE-CHECKLIST.md`.
- Guia d'arrencada per agents a `docs/AGENT-START.md`.

## Decisions de manteniment

- No s'ha dividit encara `worker/index.js`: es gran, pero una particio prematura podria trencar rutes sensibles. Primer cal consolidar proves i despres extreure blocs estables.
- No s'han eliminat funcionalitats: la prioritat era fiabilitat i diagnosi.
- No s'ha desplegat produccio: cal confirmacio humana abans de Worker real.

## Riscos que queden

- Worker encara massa gran i amb moltes responsabilitats.
- Automatitzacions socials depenen de secrets externs i permisos de plataformes que poden caducar.
- Les proves no cobreixen encara una execucio real completa de cron en produccio.
- Els avisos push depenen d'una configuracio OneSignal que cal verificar fora del repositori.

## Properes millores recomanades

1. Desplegar Worker V22.12 quan la PR estigui integrada.
2. Configurar `ONESIGNAL_API_KEY` correcte i fer prova real de push en mobil i ordinador.
3. Confirmar una publicacio automatica de les 08:00 amb tots els canals que tinguin permisos.
4. Afegir proves focalitzades per social cards, push real simulat i scheduled handlers.
5. Extreure del Worker nomes els blocs ja estables: socials, push i manteniment.

