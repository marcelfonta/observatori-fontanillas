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

## Variables i secrets

S'han comprovat variables públiques i setze secrets configurats. Els noms detallats, identificadors i valors públics observats no es publiquen en aquest repositori. No s'ha llegit ni desat cap valor secret.

## Riscos detectats

1. No hi ha cap `wrangler.jsonc` canònic al repositori; els uploads poden dependre de configuració manual i són difícils de reproduir.
2. Producció ha rebut diversos uploads directes recents; encara no hi ha staging independent.
3. El cron real no es pot exportar amb les ordres de lectura disponibles. La documentació històrica parla de cinc minuts i la guia moderna recomana deu; s'ha de confirmar al tauler abans de versionar-lo.
4. No s'ha creat una D1 de staging. No s'ha de reutilitzar `fonta-meteo-history` en proves d'escriptura.
5. `ops/wrangler.example.jsonc` manté l'automatització social desactivada i identificadors placeholder expressament.

## Següent pas segur

Crear `fonta-meteo-staging` i una D1 de staging només després d'aprovar noms, cost i política de dades. Després: aplicar l'esquema, configurar secrets mínims independents, fer un `deploy --dry-run`, desplegar staging i executar proves de contracte. Producció queda fora d'aquest procés fins a una aprovació humana separada.
