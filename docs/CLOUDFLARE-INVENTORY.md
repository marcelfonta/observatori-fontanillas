# Inventari Cloudflare

Comprovat en lectura el 22 d'agost de 2026. Aquest document no conté valors secrets.

## Producció actual

- Pages: `observatori-fontanillas` (`observatori-fontanillas.pages.dev`), connectat a Git.
- Domini públic documentat: `https://meteo.fontanillas.cat`.
- Worker: `fonta-meteo` (`https://fonta-meteo.marcelfonta.workers.dev`).
- La versió activa i l'historial de desplegaments s'han comprovat des de Wrangler.
- Compatibility date activa: `2026-08-21`.
- Handlers actius: `fetch` i `scheduled`.
- D1 de producció comprovada en una regió europea.
- Bindings de plataforma: D1 `DB`, Workers AI `AI` i Browser Rendering `BROWSER`.

## Staging actual

- Worker separat: `fonta-meteo-staging`, amb endpoint públic de versió i sense cap cron actiu.
- D1 separada: `fonta-meteo-staging`, en jurisdicció europea i amb l’esquema base aplicat.
- Binding de D1 `DB`, Workers AI `AI` i Browser Rendering `BROWSER`.
- Xarxes socials desactivades i cap secret de producció copiat a staging.
- Sense credencial independent de l’estació, les rutes que consulten dades en directe no s’han de considerar una prova funcional; `/health` informa explícitament l’estat degradat i el punt de partida segur és `/version` i les proves de contracte sense escriptura.

## Variables i secrets

S'han comprovat variables públiques i setze secrets configurats. Els noms detallats, identificadors i valors públics observats no es publiquen en aquest repositori. No s'ha llegit ni desat cap valor secret.

## Riscos detectats

1. No hi ha cap `wrangler.jsonc` canònic al repositori; els uploads poden dependre de configuració manual i són difícils de reproduir.
2. Producció ha rebut diversos uploads directes recents; els pròxims canvis sensibles han de passar primer per staging.
3. El cron real no es pot exportar amb les ordres de lectura disponibles. La documentació històrica parla de cinc minuts i la guia moderna recomana deu; s'ha de confirmar al tauler abans de versionar-lo.
4. No s'ha de reutilitzar `fonta-meteo-history` en proves d'escriptura; staging té la seva D1 separada.
5. `ops/wrangler.example.jsonc` manté l'automatització social desactivada i identificadors placeholder expressament.

## Següent pas segur

Configurar només secrets independents i imprescindibles per a una prova concreta de staging, fer un `deploy --dry-run`, desplegar staging i executar proves de contracte. Producció queda fora d'aquest procés fins a una aprovació humana separada.
