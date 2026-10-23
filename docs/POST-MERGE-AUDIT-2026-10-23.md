# Revisió de producció després del PR #296

Data: 23 d’octubre de 2026, 21.42–21.47 h (Europe/Madrid). Commit de Pages: `03bff5b`.

## Confirmat en producció

- Cloudflare Pages i les proves Node 22 de GitHub han acabat correctament per al commit fusionat.
- Les 20 rutes del portal responen HTTP 200 amb la ruta, el títol i la URL canònica corresponents. L’auditoria SEO de producció passa per les rutes prioritàries i els 404 editorials.
- Nou navegador d’escriptori: portada, canvi climàtic, Medi Ambient, estació, predicció, avisos, radar, cel i Centre de Dades mostren títol i secció sense excepcions JavaScript ni errors HTTP del domini.
- `/canvi-climatic` mostra quatre indicadors, el valor NOAA recent (`426,46 ppm`, Mauna Loa, 22/10/2026) i l’accés des del menú i de Medi Ambient. La capsa sísmica antiga ja no existeix.
- Després de la càrrega inicial, la pestanya de terratrèmols obre el mapa i fusiona els catàlegs USGS i ICGC. El 23/10 a les 21.44 h mostrava 234 esdeveniments a 24 hores.
- A 390 px, la pàgina climàtica no desborda horitzontalment i el menú mòbil s’obre i es tanca; l’accés a la nova ruta és visible.
- L’API `/health` estava saludable amb una lectura de l’estació d’un minut d’antiguitat. `/alerts`, `/met-forecast`, `/forecast-videos` i `/climate/co2` responien correctament.

## Incidència externa observada

`/public-status` va marcar el planificador com a `degraded/stale` a les 21.44 h (últim cicle 21.23 h), tot i que la lectura actual de l’estació responia. A les 21.46 h havia tornat a `healthy` amb cicle a les 21.44 h. La cobertura de l’històric de les últimes 24 h era del 88,9% (256/288 mostres) en la consulta feta.

Cloudflare investigava una incidència de [Workers Cron Triggers tardans, perduts o duplicats](https://cloudflare.statuspage.io/) iniciada a les 15.27 h UTC. Coincideix amb la degradació, però aquesta revisió no demostra que en sigui l’única causa. No s’ha forçat cap execució ni publicació manual per evitar duplicats. Cal verificar el següent cicle automàtic i la publicació real de vespre.

## Límits d’aquesta revisió

No s’ha confirmat recepció OneSignal amb la web tancada, publicació real a cada xarxa, primer avís Meteocat/CECAT actiu, ni l’experiència en dispositius físics. Els visors de tercers i els reproductors només s’han comprovat superficialment; la pàgina climàtica encara no disposa de gràfics de sèries llargues ni traducció editorial completa. Aquests punts continuen al `ROADMAP.md`.
