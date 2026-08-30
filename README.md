# Observatori Meteorològic Fontanillas — V22.23.0

Portal meteorològic multipàgina de Sant Celoni i el Baix Montseny. La V22.23.0 eleva la qualitat de les publicacions automàtiques amb símbols meteorològics reals, missatges adaptats a la previsió i Reels amb moviment i transicions suaus.

### Predicció vs realitat

La V22 desa snapshots de previsió a D1 amb data d’emissió, data vàlida, horitzó, model, temperatura, pluja, vent i estat del cel. La secció pròpia mostra l’error i el biaix de temperatura, l’encert de pluja i l’error de vent per horitzons. Fins a tenir set dies complets, presenta clarament l’estat de recollida i no publica percentatges reconstruïts a posteriori.

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

El codi actiu és `worker/index.js`. Conserva la vinculació D1 `DB`, secrets, crons i contractes existents. En publicar V21.2.0 també s’ha de desplegar aquest Worker i aplicar `worker/schema.sql`, que manté `social_drafts` i afegeix el registre `social_publications`. Les credencials `META_SYSTEM_USER_TOKEN`, `BLUESKY_HANDLE`, `BLUESKY_APP_PASSWORD`, `TELEGRAM_BOT_TOKEN` i `TELEGRAM_CHANNEL_ID` es mantenen només a Cloudflare; el Worker no en retorna mai els valors.

La V22.23.0 publica a les 07:00, 14:00 i 20:30. Facebook i Instagram fan Reel + Story al matí i al vespre i imatge al migdia; X fa vídeo, imatge i vídeo a través de Buffer; Bluesky, Telegram i Threads mantenen les tres targetes. TikTok i YouTube conserven els dos vídeos diaris. Els vídeos i les targetes mostren el símbol corresponent a la predicció, mentre les observacions reals es presenten sense confondre-les amb una previsió. X registra l’identificador remot, comprova el lliurament, evita duplicats, fa fins a quatre intents i només envia correu si tots fallen.

Per a Meta es poden definir opcionalment `META_FACEBOOK_PAGE_ID`, `META_FACEBOOK_PAGE_NAME`, `META_INSTAGRAM_ACCOUNT_ID`, `META_GRAPH_VERSION` i `META_INSTAGRAM_IMAGE_URL`. Si no s’indiquen els identificadors, el Worker intenta resoldre la pàgina i el compte professional a partir del token del sistema. La imatge predeterminada d’Instagram és `assets/images/observatori-fontanillas-social.jpg`.

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

## Documentació i contribucions

- Arquitectura: [docs/architecture.md](docs/architecture.md)
- Desenvolupament i proves: [docs/development.md](docs/development.md)
- Desplegament: [docs/deployment.md](docs/deployment.md)
- API i fonts de dades: [docs/api.md](docs/api.md) i [docs/data-sources.md](docs/data-sources.md)
- Contribucions, seguretat i suport: [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md) i [SUPPORT.md](SUPPORT.md)

El projecte es distribueix sota la [llicència MIT](LICENSE). Les credencials i la configuració de producció no formen part del repositori.
