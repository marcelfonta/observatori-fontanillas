# Roadmap oficial

## Visió

Construir el portal meteorològic del Baix Montseny combinant dades pròpies, fonts oficials i eines intel·ligents amb una experiència clara, moderna i sostenible.

## Milestone 1 — V8 Reorganització del portal — Completat

- Portal amb menú lateral fi en escriptori i hamburguesa en mòbil.
- Vistes: Inici, Estació, Predicció, Cel de dia i de nit, Avisos, Radar, Webcams, Centre de Dades, Comparar, Medi Ambient, Contacte i Metodologia.
- Portada curta: situació actual, resum, avisos, predicció i radar.
- Preservar capçalera, estètica, Worker, API, PWA, compartir, push, historial d’avisos i comparativa.

## Milestone 2 — V9 Centre de Dades — Completat

- Històrics de temperatura, humitat, vent, pluja, pressió, UV i radiació.
- Màxims, mínims, mitjanes, desviacions i nombre de mostres.
- Descàrregues CSV, Excel, JSON i PDF.
- Rècords, efemèrides i resums diaris, mensuals i anuals.

Implementat a V9.0.0 reutilitzant l’històric existent del Worker: períodes de 7, 30 i 365 dies, cobertura, mostres, mitjana i desviació tèrmica, pluja, ratxa, arxiu d’extrems, efemèrides, resums i exportacions CSV, Excel, JSON i PDF. No s’ha modificat cap contracte d’API.

## Milestone 3 — V10 Comparador avançat — Completat

- Evolució del comparador actual sense regressions.
- Mapa interactiu del Baix Montseny i marcadors amb dades en directe.
- Comparacions actuals i històriques per temperatura, vent, pluja, humitat i pressió.

Implementat a V10.0.0 amb el contracte `/stations` existent: mapa Leaflet del Baix Montseny, marcadors i llegenda d’estacions, períodes Ara/Avui/24 h, targetes normalitzades i una gràfica commutable per les cinc variables. No s’ha afegit cap dependència de compilació ni s’ha trencat la comparativa anterior.

## Milestone 4 — V11 Medi Ambient — En curs

- Qualitat de l’aire a Sant Celoni: AQI, PM10, PM2.5, NO₂, O₃, CO i SO₂ segons disponibilitat oficial.
- Radiació UV, pol·len, risc d’incendi, sequera i estat hidrològic.
- Costa catalana i meduses: mapa, presència, espècie, risc, actualització i informació pràctica amb font fiable automàtica.

Primera fase implementada a V11.0.0: índex europeu de qualitat de l’aire, PM10, PM2,5, NO₂, O₃, CO, SO₂, UV i cinc tipus de pol·len amb CAMS/Open‑Meteo; accés destacat als visors oficials de Pla Alfa, sequera de l’ACA i PlatgesCat. Pendent de completar: integrar dades locals oficials de risc, sequera i meduses només quan hi hagi una font automàtica estable que permeti mostrar municipi o platja sense induir a error.

## Milestone 5 — Branding i identitat visual

- Logotip aprovat, opció A: Montseny, sol i línia meteorològica minimalista.
- Favicon, Apple Touch Icon, icones Android/PWA/maskable, splash i Open Graph coherents.
- Redisseny coherent dels pictogrames del menú lateral i de les icones funcionals del portal.
- Revisió del nom curt instal·lat i guia d’identitat.

## Milestone 6 — Meteo IA

- Assistent meteorològic basat en dades, no en suposicions.
- Consultes locals i d’altres poblacions, històrics, avisos, predicció, comparador i medi ambient.
- Recomanacions per famílies, running i excursions amb advertiments oficials quan correspongui.

## Milestone 7 — SEO i presència a Internet

- Search Console, sitemap, robots, canòniques, metadades, Open Graph, Schema.org i Core Web Vitals.
- SEO local: Sant Celoni i Baix Montseny; pàgines específiques útils, no duplicades.
- Analítica, directoris meteorològics i estudi de Google Business Profile segons requisits.

## Milestone 8 — Compartició Premium

- Targetes automàtiques amb dades, predicció, marca i URL.
- Compartició robusta en mòbil i escriptori.

## Milestone 9 — Xarxes socials automàtiques

- Instagram, Facebook, X, Telegram, Bluesky i altres xarxes amb API viable.
- Resums, avisos, pluja, rècords, efemèrides i episodis.
- Regles, calendari, aprovació opcional i historial editorial.

## Milestone 10 — Panell administrador

- Estat d’API, Worker, memòria cau, analítica, errors, versions, push i xarxes.
- Accés protegit i monitoratge operatiu.

## Milestone transversal — Historial d’avisos

- Avisos actius i només els finalitzats recents a la vista principal.
- Historial separat amb paginació, filtres, cerca i consulta sota demanda.
- Estadístiques per any, tipus, nivell i organisme; exportació futura i accés des de Meteo IA.

## Backlog

Centre de notícies meteorològiques, calendari i cronologia meteorològica, API pública, widgets, recursos escolars, episodis destacats, fotografia automàtica, webcam amb detecció assistida, alertes intel·ligents i prediccions personalitzades.

## Definició de projecte madur

El projecte arribarà a 1.0 quan arquitectura, dades, comparador, medi ambient, Meteo IA, marca/PWA, SEO, compartició, xarxes i administració estiguin completats i validats.
