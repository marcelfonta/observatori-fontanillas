# Inventari Cloudflare

Comprovat en lectura el 12 de setembre de 2026. Aquest document no conté valors secrets.

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
- Abans de proposar un desplegament a producció, executar `npm run test:staging` o el flux manual «Validació de l'entorn de proves» de GitHub Actions. La prova no requereix secrets ni escriu dades.

## Variables i secrets

S'han comprovat variables públiques i setze secrets configurats. Els noms detallats, identificadors i valors públics observats no es publiquen en aquest repositori. No s'ha llegit ni desat cap valor secret.

## Riscos detectats

1. No hi ha cap `wrangler.jsonc` canònic al repositori; els uploads poden dependre de configuració manual i són difícils de reproduir.
2. Producció ha rebut diversos uploads directes recents; els pròxims canvis sensibles han de passar primer per staging.
3. El cron real no es pot exportar amb les ordres de lectura disponibles. La documentació històrica parla de cinc minuts i la guia moderna recomana deu; s'ha de confirmar al tauler abans de versionar-lo.
4. No s'ha de reutilitzar `fonta-meteo-history` en proves d'escriptura; staging té la seva D1 separada.
5. `ops/wrangler.example.jsonc` manté l'automatització social desactivada i identificadors placeholder expressament.
6. Hi ha un projecte redundant de Workers Builds anomenat `observatori-fontanillas`, connectat a `main`, que no és ni el Pages públic ni el Worker `fonta-meteo`. Executa `npx wrangler deploy --assets . --name observatori-fontanillas --compatibility-date 2026-08-04` des de l’arrel. Això intenta tractar tot el repositori, inclòs `node_modules`, com a recursos públics i falla quan troba el binari `workerd` de 144 MiB, per sobre del límit de 25 MiB per fitxer. És l’origen dels checks i correus vermells de Workers Builds, però no afecta el servei publicat.

## Integració redundant de Workers Builds

- No s’ha de fer funcionar aquest desplegament afegint només `.assetsignore`: continuar desplegant `--assets .` duplicaria Pages i podria publicar fitxers interns del repositori.
- La correcció segura és desconnectar o eliminar al tauler de Cloudflare el projecte de Workers Builds `observatori-fontanillas`.
- S’han de conservar Pages `observatori-fontanillas` i el Worker `fonta-meteo`; són els dos serveis reals.
- Aquesta acció externa no forma part del codi ni s’ha executat automàticament. Cal confirmar els tres noms al tauler abans de retirar exclusivament la integració redundant.

## Següent pas segur

Configurar només secrets independents i imprescindibles per a una prova concreta de staging, fer un `deploy --dry-run`, desplegar staging i executar proves de contracte. Producció queda fora d'aquest procés fins a una aprovació humana separada.
