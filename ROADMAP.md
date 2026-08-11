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

## Milestone 7 — SEO i presència a Internet — Activació principal completada

- Search Console, sitemap, robots, canòniques, metadades, Open Graph, Schema.org i Core Web Vitals.
- SEO local: Sant Celoni i Baix Montseny; pàgines específiques útils, no duplicades.
- Analítica, directoris meteorològics i estudi de Google Business Profile segons requisits.

Base tècnica implementada a V14.0.0: metadades i canòniques per vista, Open Graph i X dinàmics, dades estructurades `WebSite`, `WebPage`, `Dataset` i `BreadcrumbList`, sitemap ampliat i SEO local per Sant Celoni i el Baix Montseny. El 10 d’agost de 2026 es va verificar `fontanillas.cat` per DNS a Search Console, es va processar el sitemap i Google va descobrir 13 URL. V19.1 afegeix mesura local de LCP, CLS, INP i TTFB; V19.1.1 documenta i detecta Cloudflare Web Analytics per obtenir dades agregades de camp. V20 diferencia correctament l’activació al domini de la detecció puntual del beacon. Google Analytics continua desactivat.

## Milestone 8 — Compartició Premium — Completat

- Targetes automàtiques amb dades, predicció, marca i URL.
- Compartició robusta en mòbil i escriptori.

Implementat a V15.0.0: el diàleg genera al navegador una targeta de 1200 × 630 px amb la identitat de l’Observatori, URL i dades reals disponibles. Adapta el contingut a observació actual, predicció o avisos; si no hi ha dades, utilitza una targeta editorial sense inventar valors. Permet compartir el fitxer amb el menú natiu del dispositiu, descarregar-lo en PNG o copiar text i enllaç. Funciona també a Comparar, Metodologia i Historial d’avisos.

La mateixa versió reorganitza Centre de Dades amb un únic període per a resum, gràfiques, extrems i descàrrega, separat dels indicadors de calendari. Meteo IA incorpora explicacions meteorològiques, guia de fonts oficials i efemèrides basades en l’arxiu propi.

## Milestone 10 — Panell administrador — Completat

- Estat d’API, Worker, memòria cau, analítica, errors, versions, push i xarxes.
- Accés protegit i monitoratge operatiu.

Implementat a V16.0.0 com un panell de diagnòstic protegit pel Worker: estat de l’estació i la qualitat de dades, base D1, arxiu d’avisos, formulari, push, versions, PWA, memòries cau locals i incidències de la sessió. La clau només viu durant la pestanya, les respostes administratives no es desen a la PWA i no s’exposa cap secret. Per seguretat, la primera versió és de només lectura i no inclou operacions destructives.

## Milestone 9 — Xarxes socials — En curs amb V21.2

- Connectar amb l’usuari Instagram i Facebook; X queda descartat per decisió del projecte.
- Resums, avisos, pluja, rècords, efemèrides i episodis.
- Regles, calendari, aprovació opcional i historial editorial.

V21 incorpora Instagram, Facebook, Bluesky i Telegram al portal i prepara una cua D1 d’esborranys diaris. V21.2 hi afegeix revisió, edició, aprovació, descart, restauració, historial per canal, diagnòstic sense publicació i enviament manual confirmat als quatre canals. Aprovar mai no publica i el cron només crea esborranys. La fita quedarà completa després de validar una publicació real controlada a cada xarxa i, només llavors, definir el calendari automàtic i els límits editorials.

## Milestone transversal — Historial d’avisos — Completat

- Avisos actius i només els finalitzats recents a la vista principal.
- Historial separat amb paginació, filtres, cerca i consulta sota demanda.
- Estadístiques per any, mes, tipus, nivell i organisme; exportació i accés des de Meteo IA.

V12 limita la vista principal als cinc episodis més recents i incorpora una pàgina d’arxiu separada. V17 completa la fita: paginació real al Worker, cerca i filtres combinables, comptadors, distribució mensual i per fenomen, CSV, PDF i consultes des de Meteo IA. L’endpoint antic amb `limit` continua funcionant perquè la portada i les versions anteriors no es trenquin.

## V18 — Memòria meteorològica i avisos intel·ligents — Completat

- Efemèrides externes verificades com a alternativa quan encara no existeixen anys comparables a Fontanillas.
- Cronologia meteorològica amb avisos, pluja i extrems del període.
- Preferències de notificació per fenomen i nivell mínim, preparades per activar amb OneSignal.

V18 reutilitza l’arxiu existent i no inventa registres locals. L’activació efectiva del push es va completar i validar a V19.1: el web registra subscripcions i el Worker reconeix les credencials privades de OneSignal sense exposar-les al projecte públic.

## V19 — Portal útil, transparent i preparat per créixer — Completat

- Centre de Dades estable en escriptori, tauleta i mòbil.
- Primera àrea educativa pròpia amb fonts identificades.
- Privacitat pública i minimització de dades al formulari.
- Base de Search Console i mesura de rendiment preparada per validar després del desplegament.
- OneSignal preparat sense carregar tercers mentre estigui inactiu.
- Flux editorial de xarxes documentat sense crear ni connectar comptes.

V19 avança la branca de recursos escolars sense convertir el portal en un curs llarg. També tanca la preparació local de SEO, privacitat, push i xarxes; les activacions externes continuen requerint comptes, DNS o credencials del propietari.

## V19.1 — Activacions externes i observabilitat local — Completat

- Search Console verificat per DNS i sitemap processat amb 13 URL descobertes.
- OneSignal web i Worker configurats; subscripcions reals i prova controlada verificades.
- Panell administratiu actualitzat amb l’estat real de les activacions.
- Core Web Vitals locals —LCP, CLS, INP i TTFB— mesurats sense activar analítica externa.
- Documentació de notificacions, publicació i rendiment posada al dia.

## V20 — Biblioteca meteorològica educativa — Completat

- Pàgina «Aprendre» reconstruïda al voltant de recursos externs verificats, no d’un curs tancat.
- Itineraris per Primària, ESO, Batxillerat i docents, amb nivell avançat complementari.
- Cerca i filtres per nivell i tema, amb idioma, format i organisme visibles a cada fitxa.
- Selecció de 27 recursos de serveis meteorològics, agències científiques, organismes internacionals i centres acadèmics.
- Connexió educativa amb les dades reals de Fontanillas mitjançant Estació, Radar, Centre de Dades i Avisos.
- Estat de Cloudflare Web Analytics clarificat al panell: «Actiu al domini» és un estat correcte i verd.

La biblioteca es manté en dades estructurades a `src/data/learning-resources.js`, de manera que es pot revisar, ampliar o retirar un enllaç sense duplicar el disseny. Els recursos externs sempre s’obren en una pestanya nova i mostren abans l’idioma i la institució responsable.

## V21 — Pol·len interpretable, marca i fase social segura — Completat

- Nivells de pol·len orientatius per espècie amb colors, etiquetes, barres i consell pràctic.
- Instagram, Facebook, Bluesky i Telegram visibles i accessibles a la capçalera, al menú lateral i al peu.
- Símbol de l’Observatori redibuixat amb més llum, contrast i lectura a mida petita.
- Avatar rodó de 1024 px preparat per a capçaleres i perfils socials.
- Copyright traslladat al peu del menú lateral en escriptori i preservat al peu general en mòbil.
- Menú lateral reequilibrat amb context local superior i accessos socials inferiors.
- Cua `social_drafts` al Worker, deduplicada per dia i visible des del panell d’administració.
- Credencials de Meta, Bluesky i Telegram detectades només com a booleans; cap token s’exposa i cap crida de publicació està implementada.

## Fases pendents després de V21

1. Recollir dades de camp de Core Web Vitals quan Search Console disposi de prou trànsit i corregir només els colls d’ampolla observats.
2. Revisar les primeres dades de Cloudflare Web Analytics quan hi hagi prou visites i contrastar-les amb Search Console; Google Analytics continua descartat mentre no aporti una necessitat clara.
3. Ampliar les proves automàtiques del Worker i el seguiment dels primers avisos push reals.
4. Provar amb l’usuari una publicació manual controlada a Telegram i una a Bluesky; revisar-ne el registre abans de valorar Meta o qualsevol automatització.
5. Revisar periòdicament els llindars i les fonts del pol·len, els enllaços educatius i valorar un centre de notícies meteorològiques verificades com a evolució separada.

## Backlog

Centre de notícies meteorològiques, calendari, API pública, widgets, recursos escolars, episodis destacats, fotografia automàtica, webcam amb detecció assistida i prediccions personalitzades.

## Definició de projecte madur

El projecte arribarà a 1.0 quan arquitectura, dades, comparador, medi ambient, Meteo IA, marca/PWA, SEO, compartició, xarxes i administració estiguin completats i validats.
