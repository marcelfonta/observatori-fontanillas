# Validació de producció i estat operatiu — 18/11/2026

## Abast

Comprovacions de lectura, sense publicar contingut, activar tasques ni modificar
configuració. Els canvis de codi del visor continuen en una branca separada.

## Web i PWA

- `node scripts/seo-production-audit.mjs` ha passat per portada, predicció,
  avisos, centre de dades, una història i un resum. Ha comprovat títol inicial,
  ruta, canonical i JSON-LD; una ruta editorial inexistent retorna 404 i
  `noindex`.
- `https://meteo.fontanillas.cat/service-worker.js` i
  `/OneSignalSDKWorker.js` responen 200 amb `Cache-Control: no-cache,
  must-revalidate`.
- Els manifestos en català, castellà, anglès i francès que enllaça la web
  responen 200 amb `application/manifest+json`. El català usa `no-cache,
  must-revalidate`; els altres tres `max-age=0, must-revalidate`.

Això no demostra que una PWA ja instal·lada hagi rebut la versió nova, que
continuïn arribant avisos amb la web tancada ni que Google hagi indexat les
pàgines. Search Console necessita una lectura nova del seu informe.

## Publicacions i dispositius

La [incidència #299](https://github.com/marcelfonta/observatori-fontanillas/issues/299)
ja consta tancada des del 04/11. L'usuari confirma el 18/11 que les publicacions
i el timelapse funcionen bé, i que Garmin i les apps d'iPhone funcionen en ús
normal. Aquesta confirmació tanca el seguiment operatiu ordinari; les proves
específiques sense xarxa, amb lectures antigues i durant un avís oficial real
continuen com a controls de qualitat.

## Model Fonta i XEMA

El [PR #381](https://github.com/marcelfonta/observatori-fontanillas/pull/381)
és a `main` i les comprovacions de fusió han passat. L'últim estat públic del
laboratori Fonta (18/11, 02:24 UTC) registra 94 captures, 25 dies aparellats i
cap dia avaluat. L'estat públic regional XEMA (15/11, 15:50 UTC) registra 47
captures i 244 parelles estació-dia. Continuen en mode d'ombra; aquests
comptadors no justifiquen promocionar cap model.

Les darreres fallades conegudes van utilitzar el codi anterior al PR #381.
Cal revisar una captura programada posterior per saber si el reintent acotat
redueix les interrupcions de connexió a Open-Meteo.
