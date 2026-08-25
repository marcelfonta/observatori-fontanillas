# Roadmap oficial

## Manteniment obert — En curs

- [x] Publicar guies de contribució, seguretat, suport i arquitectura.
- [x] Afegir llicència MIT i plantilles per informar d'incidències o correccions de dades.
- [ ] Crear un entorn de prova separat amb Worker i D1 propis abans de canvis que escriguin dades reals.

## V22.14.0 — Protecció de D1 i diagnòstic operatiu — Preparada per revisar

- [x] Evitar escriptures a D1 en cada visita pública; les captures programades de cinc minuts mantenen l’historial.
- [x] Fer idempotent la persistència d’una observació ja existent i memoritzar cinc minuts el resum d’emmagatzematge.
- [x] Registrar explícitament els canals socials demanats sense credencials perquè puguin rebre reintent, correu i diagnòstic.
- [x] Fer explícit al diagnòstic push quin secret de OneSignal falta o cal revisar.

### Validacions externes abans de tancar

- [ ] Integrar la PR i desplegar el Worker V22.14.
- [ ] Configurar el secret real `ONESIGNAL_API_KEY` amb l’App API key correcta.
- [ ] Fer una prova real de OneSignal des de mòbil i ordinador.
- [ ] Confirmar les franges socials de les 08:00, 14:00 i 20:30 després del desplegament.
- [ ] Revisar el consum diari de files llegides i escrites a D1 durant la primera setmana de setembre.

## V22.13.0 — Fiabilitat operativa i auditoria — Preparada per revisar

- [x] Detectar explícitament el desalineament entre Worker públic i codi abans de publicar targetes socials.
- [x] Fer més clar l’error de OneSignal i prioritzar `ONESIGNAL_API_KEY`.
- [x] Reduir pressió sobre D1 movent neteges recurrents a manteniment programat i afegint índexs compostos.
- [x] Crear guia ràpida d’agents, checklist d’entrega i auditoria tècnica.

### Validacions externes abans de tancar

- [ ] Integrar la PR i desplegar el Worker V22.13.
- [ ] Configurar o verificar `ONESIGNAL_API_KEY` real a Cloudflare.
- [ ] Enviar una prova push real des de mòbil i portàtil.
- [ ] Confirmar una publicació automàtica de les 08:00 amb Facebook, Instagram i Threads després del desplegament.
- [ ] Monitorar D1 després de l’1 de setembre de 2026 per confirmar que els índexs i la neteja programada redueixen l’ús.

## V22.8.0 — Visors mòbils, abast dels avisos i accessibilitat — Preparada per revisar

- [x] Evitar que el visor incrustat de meduses es carregui en pantalles petites, on no ofereix una experiència fiable.
- [x] Mantenir un accés clar al mapa complet de MedusApp amb més espai i millor control tàctil.
- [x] Fer els tres visors ambientals navegables amb teclat i semàntica accessible de pestanyes.
- [x] Diferenciar visualment els avisos on Sant Celoni consta explícitament dels avisos oficials d’abast zonal.
- [x] Aplicar estats de càrrega visuals també als principals indicadors ambientals.

### Validacions després d’integrar

- [ ] Comprovar l’accés de MedusApp en un iPhone i un Android reals.
- [ ] Navegar pels visors amb teclat i lector de pantalla.
- [ ] Revisar la nova etiqueta territorial durant un avís oficial actiu.

## V22.7.0 — Experiència mòbil i rendiment percebut — Preparada per revisar

- [x] Substituir els principals textos d’espera de la portada per esquelets visuals accessibles.
- [x] Retirar automàticament l’estat de càrrega quan arriba cada lectura real.
- [x] Carregar el mapa oficial d’avisos només quan la secció és a prop de la pantalla.
- [x] Separar visualment fenòmens i nivells dins les preferències d’avisos.
- [x] Fer el diàleg d’avisos més compacte i accionable en pantalles petites.
- [x] Verificar que totes les imatges HTML disposen de text alternatiu.

### Validacions després d’integrar

- [ ] Comprovar el diàleg d’avisos en un iPhone petit i en Android.
- [ ] Confirmar visualment que el mapa de Meteocat apareix en arribar a Avisos.
- [ ] Mesurar de nou la portada amb Lighthouse en producció.

## V22.6.0 — Prioritat alta: avisos, IA i verificació — Preparada per revisar

- [x] Substituir la prova local d’avisos per un enviament real de OneSignal dirigit només al dispositiu que fa la prova.
- [x] Mostrar una diagnosi més completa del permís, la subscripció, la connexió remota i el servei en segon pla.
- [x] Millorar l’accessibilitat del diàleg d’avisos amb focus inicial, retorn del focus i navegació de teclat continguda.
- [x] Fer que Meteo IA respongui preguntes senzilles de pressió, humitat, vent, radiació, índex UV, sortida i posta del sol.
- [x] Afegir transparència territorial a cada avís zonal sense amagar ni alterar cap avís oficial.
- [x] Fer més rigorós «Predicció vs realitat» amb dies únics de mostra, nivell de maduresa i índex Brier de probabilitat de pluja.
- [x] Adaptar les quatre mètriques de verificació a escriptori, tauleta i mòbil.

### Validacions externes abans de donar-la per tancada

- [ ] Desplegar web i Worker només després de revisar i integrar la PR.
- [ ] Enviar una prova real des de cada mòbil i ordinador que hagi de rebre avisos.
- [ ] Confirmar que el missatge arriba també amb la web tancada o en segon pla.

## V22.5.2 — Mòbil, transparència i configuració resilient — Preparada per revisar

- [x] Evitar que un desplegament perdi els identificadors públics de Bluesky, Telegram, OneSignal i correu operatiu.
- [x] Mostrar totes les xarxes des de la capçalera mòbil amb un accés compacte.
- [x] Oferir una alternativa fiable al visor de meduses en pantalles petites.
- [x] Explicar que els avisos oficials són zonals i no necessàriament municipals.
- [x] Diferenciar TikTok connectat de TikTok aprovat per publicar automàticament.
- [ ] Confirmar a les 07:45 i les 08:00 una comprovació i una publicació completament automàtiques.
- [ ] Afegir les franges de les 14:00 i les 21:30 només després d'aquesta validació.
- [ ] Implementar TikTok Direct Post quan l'aplicació i l'abast `video.publish` constin com a aprovats.

## V22.5.0 — Control operatiu i recuperació segura — Preparada per revisar

- Estat persistent de l’última execució programada, amb registre del nombre de processos i dels errors reals.
- Seguiment separat de l’últim avís push, la darrera publicació automàtica i la comprovació preventiva de xarxes.
- Horari social real visible al panell, inclosa la zona horària, sense mostrar un valor fix que pugui quedar desactualitzat.
- Botó per repetir exclusivament els canals que han fallat en una publicació parcial, sense duplicar els canals completats.
- Registres estructurats dels processos programats per facilitar la diagnosi a Cloudflare.

### Validacions externes abans de donar-la per tancada

- Desplegar el Worker i confirmar que el panell registra una execució programada completa.
- Fer una prova controlada d’una publicació parcial i verificar el reintent exclusiu del canal amb error.
- Confirmar un avís push real i comprovar que el nombre de destinataris queda registrat.

## V22.4.0 — Meteo IA més útil i entenedora — Preparada per revisar

- Respostes locals immediates per a preguntes quotidianes: paraigua, roba, fred o calor, estendre roba i ajuda inicial.
- Interpretació de la franja horària de pluja amb probabilitat, inici, final i advertiment de revisar el radar.
- El model avançat rep també les pròximes 48 hores de predicció horària, sense exposar dades personals ni inventar valors.
- Fonts visibles mantenen separades l’observació real, la predicció, els avisos oficials i el raonament avançat.

### Validacions externes que continuen pendents

- Confirmar una notificació OneSignal real en cada dispositiu desitjat.
- Observar una execució automàtica completa de les 07:45 i les 08:00 després del desplegament.
- Completar TikTok només quan la plataforma aprovi l’accés de publicació.
- Activar nous horaris socials únicament després d’aprovar una vista prèvia per canal.

## V22.3.0 — Fiabilitat d’avisos i publicacions contextuals — Preparada per revisar

- Diagnosi visible de notificacions per dispositiu: compatibilitat, permís, subscripció i requisit PWA a iPhone.
- La prova de notificacions queda identificada com a prova local, diferenciada de l’enviament real de OneSignal.
- Les publicacions automàtiques adapten títol i redacció al matí, migdia i vespre sense duplicar contingut.
- La targeta social mostra tres dies, probabilitat de pluja i ratxa prevista, amb el logotip oficial.
- Hashtags locals ampliats de manera moderada per millorar descoberta sense semblar contingut brossa.
- YouTube Shorts queda visible al panell com a flux separat de GitHub Actions.

### Activació de les tres franges diàries

- [x] Codi preparat per a les franges `08:00`, `14:00` i `20:30`, amb textos diferents de matí, migdia i vespre.
- [x] Comprovació preventiva abans de cada franja: `07:45`, `13:45` i `20:15`.
- [ ] Aplicar a producció `SOCIAL_AUTO_TIMES=08:00,14:00,20:30` i `SOCIAL_PREFLIGHT_TIME=07:45,13:45,20:15` en desplegar el Worker V22.13.
- [ ] Confirmar una execució automàtica real de cada franja als cinc canals actius.
- [ ] Confirmar recepció d’un avís real de prova en Android/iPhone i escriptori.

## V22.2.0 — Publicacions preparades i avisos menys intrusius — Verificada

- [x] Retardar deu segons la invitació d’avisos i respectar la visibilitat de la pàgina.
- [x] Comprovar les sis connexions socials abans de l’horari automàtic sense publicar res.
- [x] Avisar per correu si una connexió social no està preparada.
- [x] Mostrar el resultat preventiu al panell d’administració.
- [ ] Confirmar una execució real de les 07:45 i una publicació real de les 08:00 després del desplegament.
- [ ] Completar TikTok quan la plataforma aprovi l’accés de publicació.

## V22.1.0 — Rendiment, comprensió i resiliència — En verificació

- [x] Pintat inicial amb dades reals i fallback segur.
- [x] Dades estructurades de la darrera observació abans d’executar JavaScript.
- [x] Més coneixement meteorològic local sense cost de model extern.
- [x] Verificació de prediccions més visual, completa i accessible.
- [x] Diagnòstic explícit del model avançat al panell.
- [ ] Validació a l’entorn de previsualització abans d’integrar a producció.

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

## Milestone 9 — Xarxes socials — En curs amb V22.2

- Connectar amb l’usuari Instagram i Facebook; X queda descartat per decisió del projecte.
- Resums, avisos, pluja, rècords, efemèrides i episodis.
- Regles, calendari, aprovació opcional i historial editorial.

V21 incorpora Instagram, Facebook, Bluesky i Telegram al portal i prepara una cua D1 d’esborranys diaris. V21.2 hi afegeix revisió, edició, aprovació, descart, restauració, historial per canal i enviament manual confirmat. V22 activa la publicació diària independent per canal i integra Threads; V22.2 comprova preventivament Facebook, Instagram, Bluesky, Telegram, Threads i TikTok abans de l’horari automàtic. TikTok continua pendent de l’aprovació externa del permís de publicació i YouTube manté el seu flux separat de Shorts.

## V22.0.3 — Experiència mòbil i avisos verificables — Completat

- Navegació inferior mòbil amb accessos directes a Inici, Ara, Previsió i Avisos, més un menú per a totes les seccions.
- Densitat progressiva a la portada: les mètriques essencials apareixen primer i la resta es poden desplegar.
- Prova local de notificacions i selecció múltiple dels nivells d’avís abans d’activar la subscripció.
- Estat inicial de «Predicció vs realitat» explicat amb progrés real fins als set dies, sense presentar mostres il·lustratives com a resultats.
- Renovació de la memòria cau PWA i revisió visual en pantalles mòbils.

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

## V22.9.0 — Consulta meteorològica per municipi — Pilot completat

- Pàgina pròpia «Altres municipis» integrada al menú lateral i a la PWA.
- Cerca amb suggeriments geogràfics per evitar confondre municipis amb el mateix nom.
- Previsió de set dies calculada per a les coordenades seleccionades i identificada explícitament com a model.
- Descobriment de fins a sis estacions PWS en un radi de 20 km, amb font, distància i hora de lectura visibles.
- Absència d’estacions tractada de forma honesta: es manté la previsió, però no es presenta cap estimació com si fos una observació.
- Enllaç compartible amb el municipi i les coordenades, sense crear milers de pàgines indexables de poca qualitat.

### Evolució pendent del cercador

1. Validar la cobertura real amb municipis de costa, interior i muntanya abans d’ampliar el radi.
2. Crear un catàleg curat d’estacions i propietaris quan es vulguin pàgines municipals estables per a Google.
3. Incorporar preferits i municipi inicial només després de comprovar l’ús real del pilot.
4. Afegir fonts oficials municipals quan ofereixin dades comparables i reutilitzables.

### V22.9 — Ampliació global i base social preparada

- La consulta accepta qualsevol lloc retornat pel cercador geogràfic, no només municipis catalans.
- Les estacions reals es busquen primer a 20 km i, si la cobertura és escassa, el radi s’amplia progressivament a 50, 100 o 200 km.
- La interfície mostra sempre el radi i la distància; una estació llunyana mai es presenta com si fos local.
- «Qualsevol lloc» passa al primer bloc del menú lateral i a la barra inferior mòbil.
- Es deixa preparada l’estructura de 08:00, 14:00 i 20:30 per a matí, migdia i balanç del dia. Només les hores presents a `SOCIAL_AUTO_TIMES` publiquen; el valor recomanat i predeterminat és `08:00,14:00,20:30`.

## V22.10.0 — El temps arreu i fonts independents

- La consulta global adopta el nom públic «El temps arreu» i l'accés mòbil breu «Arreu».
- Open-Meteo continua oferint la previsió principal i MET Norway / Yr s'incorpora com a segona previsió integrada per a les mateixes coordenades.
- Meteoblue i eltiempo.es apareixen com a consultes complementàries externes, sense presentar-ne les dades com si fossin pròpies.
- El Worker identifica correctament el projecte davant MET Norway, valida coordenades i conserva temporalment la resposta per evitar peticions innecessàries.
- El disseny separa previsió, contrast de models i observacions reals, també en pantalla petita.
- La lectura i els dies previstos incorporen iconografia meteorològica accessible, i els resultats geogràfics llargs queden limitats dins un desplegable desplaçable.
- Pendent de validació final: comprovar en dispositius reals la capa de resultats, les tres pestanyes de fonts i la mida de les icones.

## Definició de projecte madur

## V22.11.0 — Fiabilitat dels avisos i context convectiu europeu

- Corregit el filtre de destinataris de OneSignal perquè respecti nivell i fenomen sense perdre avisos no classificats.
- Afegit estat de lliurament i reintent controlat dels avisos oficials actius.
- La diagnosi diferencia una petició acceptada d’una notificació amb destinataris reals.
- ESTOFEX queda disponible dins d’Avisos com a orientació europea no oficial; no alimenta la porta d’avisos de la portada perquè no es pot garantir una delimitació automàtica fiable a l’entorn de Sant Celoni.
- Pendent de validació real: activar avisos en un mòbil i un ordinador, executar la prova individual i confirmar el primer avís oficial rebut.

El projecte arribarà a 1.0 quan arquitectura, dades, comparador, medi ambient, Meteo IA, marca/PWA, SEO, compartició, xarxes i administració estiguin completats i validats.
