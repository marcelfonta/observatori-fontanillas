# Observatori Meteorològic Fontanillas — V19.0.2

Portal meteorològic multipàgina de Sant Celoni i el Baix Montseny. La V19 estabilitza el Centre de Dades, incorpora una àrea educativa, privacitat explícita i deixa preparades Search Console, OneSignal, rendiment i la futura fase de xarxes socials.

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
- Notificacions preparades per triar fenomen i nivell mínim, amb activació documentada a `docs/PUSH-ACTIVACIO.md`.
- Àrea «Aprendre» amb explicacions breus, interaccions accessibles i fonts de divulgació.
- Privacitat publicada i control antiabús del formulari amb identificadors irreversibles.
- OneSignal carregat només quan està configurat, Search Console documentat i diagnòstic de publicació al panell administratiu.
- Plantilles editorials i convencions UTM preparades a `social/`, sense connectar cap compte.

## Estructura activa

- `index.html`: portal i vistes principals.
- `comparativa.html` i `metodologia.html`: pàgines especialitzades amb la mateixa navegació.
- `css/`: sistema visual i shell del portal.
- `src/core/` i `src/services/`: configuració, utilitats i únic accés a l’API.
- `src/modules/`: mòduls meteorològics reutilitzables.
- `src/features/`: portal, Centre de Dades, Meteo IA, compartir, PWA, push i analítica.
- `worker/`: Worker canònic, esquema D1 i API paginada de l’historial.

## Desenvolupament local

```bash
python3 -m http.server 8080
```

Obre `http://localhost:8080`. No obris l’HTML directament amb `file://`, perquè els mòduls ES poden quedar bloquejats.

## Desplegament

Cloudflare Pages continua servint el projecte com a web estàtica. No hi ha pas de compilació ni dependències de producció.

## Worker

El codi actiu és `worker/index.js`. Conserva la vinculació D1 `DB`, secrets, crons i contractes existents. V19 requereix publicar el Worker nou perquè el control antiabús utilitzi identificadors irreversibles; no necessita cap migració de base de dades.

## Configuració

La configuració de frontend és a `src/core/config.js`. Inclou URL de l’API, intervals d’actualització, coordenades, webcam i placeholders de GA4/OneSignal.

El panell `/administracio.html` necessita el secret `ADMIN_TOKEN` al Worker. La guia d’activació i les garanties de seguretat són a `admin/README.md`.

## Validació

```bash
node tests/smoke.mjs
node tests/admin.mjs
node tests/alert-history.mjs
node tests/v18.mjs
```

Les proves comproven navegació, selectors crítics, PWA, Meteo IA, icones, Centre de Dades, peus, protecció administrativa i absència de duplicacions de «Tornar amunt». `node tests/meteo-ai.mjs` valida conversa geogràfica, coneixement, fonts i efemèrides; `node tests/share-card.mjs` valida que les targetes no inventin dades.

Consulta `PROJECT.md`, `ROADMAP.md` i `CHANGELOG.md` per a les normes, l’ordre de les fases i el detall de la versió.
