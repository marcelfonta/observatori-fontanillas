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

## Milestone 4 — V11–V12 Medi Ambient — Completat

- Qualitat de l’aire a Sant Celoni: AQI, PM10, PM2.5, NO₂, O₃, CO i SO₂ segons disponibilitat oficial.
- Radiació UV, pol·len, risc d’incendi, sequera i estat hidrològic.
- Costa catalana i meduses: mapa, presència, espècie, risc, actualització i informació pràctica amb font fiable automàtica.

Completat i estabilitzat a V12.1.0: índex europeu general i per contaminant amb interpretació baixa/moderada/alta, PM10, PM2,5, NO₂, O₃, CO, SO₂ i cinc tipus de pol·len amb CAMS/Open‑Meteo; l’UV prové prioritàriament del sensor de Fontanillas. La pàgina mostra el mapa oficial diari i lleuger del Pla Alfa, el visor de sequera de l’ACA i el mapa d’albiraments de MedusApp (UPV i Universitat d’Alacant). PlatgesCat i Meduseo es mantenen com a fonts complementàries externes.

## Milestone 5 — Branding i identitat visual — Completat

- Logotip aprovat, opció A: Montseny, sol i línia meteorològica minimalista.
- Favicon, Apple Touch Icon, icones Android/PWA/maskable, splash i Open Graph coherents.
- Redisseny coherent dels pictogrames del menú lateral i de les icones funcionals del portal.
- Revisió del nom curt instal·lat i guia d’identitat.

Primera evolució implementada a V12.0.0: substitució dels símbols tipogràfics poc clars del menú per un sistema de pictogrames SVG coherent, accessible i escalable.

Segona evolució implementada a V12.1.0: guia breu d’identitat a `assets/logos/BRAND-GUIDE.md` i nom curt de la PWA unificat com a «Observatori».

Milestone completat a V12.2.0: símbol vectorial i versió horitzontal reproduïbles, favicons de 16 i 32 px, Apple Touch Icon, icones PWA normals i maskable separades, colors d’instal·lació més lluminosos, accessos ràpids a Estació/Avisos/Radar i nova targeta social de 1200 × 630 px sense dades meteorològiques inventades.

## Milestone 6 — Meteo IA — Completat

- Assistent meteorològic basat en dades, no en suposicions.
- Consultes locals i d’altres poblacions, històrics, avisos, predicció, comparador i medi ambient.
- Recomanacions per famílies, running i excursions amb advertiments oficials quan correspongui.

Implementat a V13.0.0 com un assistent conversacional determinista i traçable al navegador. Interpreta les dades de Fontanillas, la predicció Open‑Meteo, els avisos AEMET/Meteocat, l’històric, el comparador i els indicadors ambientals; també geocodifica altres poblacions quan l’usuari ho demana. Cada resposta identifica font i hora, diferencia falta de dades d’absència d’avisos i no envia ni desa la conversa. Les recomanacions per córrer, excursions i activitats familiars donen prioritat als avisos oficials.

Evolucionat a V13.1.0: comprensió de dies de la setmana, cap de setmana i setmana següent; predicció de fins a 14 dies per a poblacions internacionals; selecció geogràfica sense prioritzar erròniament Espanya; fonts amb enllaços clicables i assistent flotant disponible a tot el portal per fer una primera pregunta ràpida.

Evolucionat a V14.0.0: context de conversa temporal per recordar lloc, període i activitat; separació robusta de frases com «Vall d’Aran aquest cap de setmana»; àlies territorial cap a Vielha; i recomanacions de bicicleta basades en temperatura, pluja i ratxes de la destinació, no en les dades locals de Sant Celoni.

## Milestone 7 — SEO i presència a Internet — Base tècnica completada

- Search Console, sitemap, robots, canòniques, metadades, Open Graph, Schema.org i Core Web Vitals.
- SEO local: Sant Celoni i Baix Montseny; pàgines específiques útils, no duplicades.
- Analítica, directoris meteorològics i estudi de Google Business Profile segons requisits.

Base tècnica implementada a V14.0.0: metadades i canòniques per vista, Open Graph i X dinàmics, dades estructurades `WebSite`, `WebPage`, `Dataset` i `BreadcrumbList`, sitemap ampliat i SEO local per Sant Celoni i el Baix Montseny. La verificació de Search Console, l’enviament del sitemap i les dades de camp de Core Web Vitals requereixen que la versió estigui publicada; queden documentats a `docs/SEO-PUBLICACIO.md`. No s’activa Google Business Profile ni analítica sense comprovar elegibilitat, identificador i privacitat.

## Milestone 8 — Compartició Premium — Completat

- Targetes automàtiques amb dades, predicció, marca i URL.
- Compartició robusta en mòbil i escriptori.

Implementat a V15.0.0: el diàleg genera al navegador una targeta de 1200 × 630 px amb la identitat de l’Observatori, URL i dades reals disponibles. Adapta el contingut a observació actual, predicció o avisos; si no hi ha dades, utilitza una targeta editorial sense inventar valors. Permet compartir el fitxer amb el menú natiu del dispositiu, descarregar-lo en PNG o copiar text i enllaç. Funciona també a Comparar, Metodologia i Historial d’avisos.

La mateixa versió reorganitza Centre de Dades amb un únic període per a resum, gràfiques, extrems i descàrrega, separat dels indicadors de calendari. Meteo IA incorpora explicacions meteorològiques, guia de fonts oficials i efemèrides basades en l’arxiu propi.

## Milestone 9 — Xarxes socials automàtiques

- Instagram, Facebook, X, Telegram, Bluesky i altres xarxes amb API viable.
- Resums, avisos, pluja, rècords, efemèrides i episodis.
- Regles, calendari, aprovació opcional i historial editorial.

## Milestone 10 — Panell administrador

- Estat d’API, Worker, memòria cau, analítica, errors, versions, push i xarxes.
- Accés protegit i monitoratge operatiu.

## Milestone transversal — Historial d’avisos — Primera fase completada

- Avisos actius i només els finalitzats recents a la vista principal.
- Historial separat amb paginació, filtres, cerca i consulta sota demanda.
- Estadístiques per any, tipus, nivell i organisme; exportació futura i accés des de Meteo IA.

V12 limita la vista principal als cinc episodis més recents i incorpora una pàgina d’arxiu separada amb cerca i filtres per any i nivell. Paginació, estadístiques i exportacions continuen al backlog.

## Backlog

Centre de notícies meteorològiques, calendari i cronologia meteorològica, API pública, widgets, recursos escolars, episodis destacats, fotografia automàtica, webcam amb detecció assistida, alertes intel·ligents i prediccions personalitzades.

## Definició de projecte madur

El projecte arribarà a 1.0 quan arquitectura, dades, comparador, medi ambient, Meteo IA, marca/PWA, SEO, compartició, xarxes i administració estiguin completats i validats.
