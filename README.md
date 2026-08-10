# Observatori Meteorològic Fontanillas — V12.0.0

Portal meteorològic multipàgina de Sant Celoni i el Baix Montseny. La V12 completa Medi Ambient amb visors vius, amplia el comparador, separa l’arxiu d’avisos, compacta les capçaleres i inicia el redisseny coherent dels pictogrames.

## Estat actual

- Menú lateral en escriptori i hamburguesa en mòbil.
- Capçalera fixa i portada de consulta ràpida amb webcam discreta.
- Pàgina pròpia per a l’estació i per al cel de dia i de nit.
- Radar + llamps oficial de Meteocat integrat i accessos a webcams properes.
- Vistes independents sense duplicar mòduls ni serveis.
- Centre de Dades amb resums, extrems, efemèrides i exportacions CSV, Excel, JSON i PDF.
- Comparador amb mapa del Baix Montseny i cinc variables actuals o històriques.
- Avisos AEMET/Meteocat, comparativa, Worker, PWA, compartir i push preservats.

## Estructura activa

- `index.html`: portal i vistes principals.
- `comparativa.html` i `metodologia.html`: pàgines especialitzades amb la mateixa navegació.
- `css/`: sistema visual i shell del portal.
- `src/core/` i `src/services/`: configuració, utilitats i únic accés a l’API.
- `src/modules/`: mòduls meteorològics reutilitzables.
- `src/features/`: portal, Centre de Dades, compartir, PWA, push i analítica.
- `worker/`: Worker canònic i esquema D1, sense canvis a V9.

## Desenvolupament local

```bash
python3 -m http.server 8080
```

Obre `http://localhost:8080`. No obris l’HTML directament amb `file://`, perquè els mòduls ES poden quedar bloquejats.

## Desplegament

Cloudflare Pages continua servint el projecte com a web estàtica. No hi ha pas de compilació ni dependències de producció.

## Worker

El codi actiu és `worker/index.js`. Conserva la vinculació D1 `DB`, secrets, crons i contractes existents. V9 no requereix migració de Worker ni de base de dades.

## Configuració

La configuració de frontend és a `src/core/config.js`. Inclou URL de l’API, intervals d’actualització, coordenades, webcam i placeholders de GA4/OneSignal.

## Validació

```bash
node tests/smoke.mjs
```

La prova comprova navegació, selectors crítics, PWA, Centre de Dades, peus i absència de duplicacions de «Tornar amunt».

Consulta `PROJECT.md`, `ROADMAP.md` i `CHANGELOG.md` per a les normes, l’ordre de les fases i el detall de la versió.
