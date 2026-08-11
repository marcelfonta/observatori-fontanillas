# Observatori Meteorològic Fontanillas — V21.1.0

Portal meteorològic multipàgina de Sant Celoni i el Baix Montseny. La V21.1.0 incorpora un gestor editorial protegit per revisar els continguts socials i publicar-los manualment a Telegram o Bluesky, sense activar cap automatització ni exposar credencials.

## Estat actual

- Menú lateral en escriptori i hamburguesa en mòbil.
- Capçalera fixa i portada de consulta ràpida amb webcam discreta.
- Pàgina pròpia per a l’estació i per al cel de dia i de nit.
- Radar oficial i mapa col·laboratiu de llamps integrat, amb accessos a webcams properes.
- Vistes independents sense duplicar mòduls ni serveis.
- Centre de Dades amb resums, extrems, efemèrides i exportacions CSV, Excel, JSON i PDF.
- Comparador amb mapa del Baix Montseny i cinc variables actuals o històriques.
- Avisos AEMET/Meteocat, comparativa, Worker, PWA, compartir i push preservats.
- Marca coherent en web, instal·lació i compartició, amb accessos ràpids de la PWA a Meteo IA, Estació, Avisos i Radar.
- Meteo IA per consultar situació actual, predicció, avisos, històrics, comparador, medi ambient, activitats i altres poblacions.
- Botó flotant per fer una primera pregunta ràpida i continuar després a la pàgina completa de Meteo IA.
- Curiositats històriques de Meteocat i l’OMM quan encara no hi ha anys locals comparables.
- Cronologia conjunta d’avisos, pluja i extrems al Centre de Dades.
- Notificacions actives per fenomen i nivell mínim, amb web i Worker verificats i activació documentada a `docs/PUSH-ACTIVACIO.md`.
- Àrea «Aprendre» amb 27 recursos verificats, itineraris per nivells, cerca i filtres per tema.
- Privacitat publicada i control antiabús del formulari amb identificadors irreversibles.
- OneSignal operatiu, Search Console verificat per DNS, sitemap processat, Cloudflare Web Analytics actiu i LCP, CLS, INP i TTFB locals visibles al panell administratiu.
- Instagram, Facebook, Bluesky i Telegram visibles a la dreta de la capçalera i en un bloc compacte al peu del menú lateral, amb una cua D1 editable, aprovació humana i historial de publicacions per canal.
- Nou avatar rodó de marca, clar i lluminós, preparat per al portal i els perfils socials.
- Identitat «Fontanillas · Sant Celoni» fixada al capdamunt del menú; la capçalera pública queda alliberada de la marca i prioritza l’estat «En directe», l’hora i els accessos socials.
- Pol·len desglossat per espècie amb nivell, color, barra i una explicació prudent del risc orientatiu.

## Estructura activa

- `index.html`: portal i vistes principals.
- `comparativa.html` i `metodologia.html`: pàgines especialitzades amb la mateixa navegació.
- `css/`: sistema visual i shell del portal.
- `src/core/` i `src/services/`: configuració, utilitats i únic accés a l’API.
- `src/modules/`: mòduls meteorològics reutilitzables.
- `src/features/`: portal, Centre de Dades, Meteo IA, biblioteca educativa, compartir, PWA, push i analítica.
- `src/data/learning-resources.js`: catàleg verificable de recursos educatius per nivell, tema, idioma i format.
- `worker/`: Worker canònic, esquema D1 i API paginada de l’historial.

## Desenvolupament local

```bash
python3 -m http.server 8080
```

Obre `http://localhost:8080`. No obris l’HTML directament amb `file://`, perquè els mòduls ES poden quedar bloquejats.

## Desplegament

Cloudflare Pages continua servint el projecte com a web estàtica. No hi ha pas de compilació ni dependències de producció.

## Worker

El codi actiu és `worker/index.js`. Conserva la vinculació D1 `DB`, secrets, crons i contractes existents. En publicar V21.1.0 també s’ha de desplegar aquest Worker i aplicar `worker/schema.sql`, que manté `social_drafts` i afegeix el registre `social_publications`. Les credencials `META_SYSTEM_USER_TOKEN`, `BLUESKY_HANDLE`, `BLUESKY_APP_PASSWORD`, `TELEGRAM_BOT_TOKEN` i `TELEGRAM_CHANNEL_ID` es mantenen només a Cloudflare; el Worker no en retorna mai els valors.

La V21.1 permet publicar manualment un esborrany aprovat a Telegram o Bluesky des de l’àrea protegida. Aprovar mai no publica i cada canal exigeix una confirmació separada. El cron continua limitat a preparar esborranys; Meta continua sense cap crida de publicació i no hi ha cap enviament automàtic.

## Configuració

La configuració de frontend és a `src/core/config.js`. Inclou URL de l’API, intervals d’actualització, coordenades, webcam, OneSignal i el camp opcional de GA4, que continua buit. Cloudflare Web Analytics s’activa des de Cloudflare i no necessita cap clau dins del projecte.

El panell `/administracio.html` necessita el secret `ADMIN_TOKEN` al Worker. La guia d’activació i les garanties de seguretat són a `admin/README.md`.

## Validació

```bash
node tests/smoke.mjs
node tests/admin.mjs
node tests/alert-history.mjs
node tests/v18.mjs
node tests/v19.mjs
node tests/v20.mjs
node tests/v21.mjs
node tests/v21-1.mjs
```

Les proves comproven navegació, selectors crítics, PWA, Meteo IA, icones, Centre de Dades, peus, protecció administrativa i absència de duplicacions de «Tornar amunt». `node tests/meteo-ai.mjs` valida conversa geogràfica, coneixement, fonts i efemèrides; `node tests/share-card.mjs` valida que les targetes no inventin dades.

Consulta `PROJECT.md`, `ROADMAP.md` i `CHANGELOG.md` per a les normes, l’ordre de les fases i el detall de la versió.
