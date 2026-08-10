# Changelog

## V19.0.5 — 2026-08-10

- Corregit l'error real de Firefox durant la instal·lació de `/OneSignalSDKWorker.js`.
- OneSignal i la PWA utilitzen ara un únic Service Worker d'arrel que conserva tant les notificacions com el funcionament fora de línia.
- Evitat que els dos registres de Service Worker es reemplacin mútuament.
- Afegida política sense memòria cau per al Worker combinat, facilitant-ne les actualitzacions.

## V19.0.4 — 2026-08-10

- El permís de notificacions es demana directament al navegador des del clic de l’usuari, abans de completar la subscripció amb OneSignal.
- Afegida diferenciació entre permís pendent, denegat i encara no sincronitzat amb OneSignal.
- Millorat el missatge de recuperació quan Firefox té les notificacions bloquejades per al lloc.

## V19.0.3 — 2026-08-10

- L'activació d'avisos mostra ara cada pas dins la finestra: permís del navegador, creació de la subscripció i desament de preferències.
- El botó queda temporalment bloquejat durant el procés per evitar activacions duplicades i es recupera automàticament si hi ha un error.
- Afegida detecció d'espera o denegació del permís amb instruccions específiques per revisar les notificacions a Firefox.
- La finestra només es tanca quan OneSignal confirma que la subscripció està realment activa.

## V19.0.2 — 2026-08-10

- Corregida la política de seguretat perquè la consulta pública de configuració de OneSignal es pugui executar, no només connectar.
- Afegit un missatge de recuperació si el servei push no respon en quinze segons, evitant un estat «Preparant notificacions…» indefinit.

## V19.0.1 — 2026-08-10

- Connectat el frontend amb l’App ID públic de OneSignal creat per a l’Observatori.
- El SDK continua carregant-se sota demanda i manté el Service Worker de OneSignal separat de la PWA.
- Les claus privades continuen fora del projecte públic i s’han de configurar exclusivament al Worker de Cloudflare.

## V19.0.0 — 2026-08-10

### Centre de Dades

- Corregida la quadrícula de resums i efemèrides que s’estrenyia en pantalles d’escriptori.
- Columnes equilibrades, salt a una sola columna abans dels 1.200 px i valors de temperatura sense particions il·legibles.

### Educació i transparència

- Nova pàgina «Aprendre» amb sensors, pressió, predicció, avisos, regles pràctiques i una prova ràpida.
- Nova `privacitat.html` amb explicació de PWA, Meteo IA, contacte, serveis externs, avisos i analítica.
- El control antiabús del formulari desa hashes temporals de la IP i del correu en lloc dels valors en clar.

### Publicació, rendiment i OneSignal

- OneSignal deixa de descarregar-se quan no hi ha App ID configurat.
- Panell administratiu ampliat amb estat separat de OneSignal web/Worker, sitemap, robots, privacitat, verificació de Google i temps de càrrega local.
- Guies noves per Search Console i comprovació de Core Web Vitals/PageSpeed.
- Sitemap, PWA, SEO dinàmic i menú ampliats amb la pàgina Aprendre i Privacitat.

### Xarxes socials

- Carpeta `social/` amb guia de governança, calendari CSV, plantilla JSON, UTM i aprovació humana per defecte.
- Cap compte ni automatització externa s’ha activat.

### Compatibilitat

- Web, Worker, panell i memòria cau unificats a V19.0.0.
- API, D1, comparador, compartir, avisos i contractes existents preservats.

## V18.0.0 — 2026-08-10

### Efemèrides amb curiositats verificades

- «Un dia com avui» manté la comparació pròpia de Fontanillas quan hi ha anys disponibles.
- Quan l’arxiu local encara és curt, mostra episodis de Catalunya documentats per Meteocat i rècords mundials verificats per l’OMM.
- Cada curiositat indica data, any, àmbit, resum i enllaç directe a la font; mai es presenta com una dada de l’estació.
- Meteo IA reutilitza el mateix catàleg quan se li demanen efemèrides o curiositats meteorològiques.

### Cronologia meteorològica

- Nou bloc al Centre de Dades que combina avisos oficials desats, dies amb pluja, màxima, mínima i ratxa destacada.
- Filtres per avisos, pluja o extrems i sincronització amb el període general de 7, 30 o 365 dies.
- Les fites deriven del mateix arxiu de Fontanillas i de `/alert-history`, sense crear una base paral·lela.

### Avisos intel·ligents

- Preferències per pluja, vent, tempesta, neu, temperatura o tots els fenòmens.
- Nou nivell mínim configurable: groc, taronja o vermell.
- El Worker combina categoria i severitat abans d’enviar a OneSignal i continua evitant duplicats mitjançant l’empremta única de D1.
- Guia d’activació segura a `docs/PUSH-ACTIVACIO.md`; no s’inclou cap credencial al projecte.

### Compatibilitat

- No cal cap migració D1 i es conserven API, avisos visibles, historial, PWA, comparativa, compartir i administració.
- Web, Worker, panell i memòria cau unificats a V18.0.0.

## V17.0.0 — 2026-08-10

### Historial d’avisos complet

- Paginació real a D1 amb 10, 20 o 50 episodis per pàgina; la web ja no necessita carregar l’arxiu complet per començar.
- Filtres combinables per text, any, mes, nivell, organisme i fenomen, amb recompte total i resum dels filtres actius.
- Indicadors d’episodis, dies amb avís, nivells taronja o vermell i fenomen més freqüent.
- Gràfics lleugers d’evolució mensual i distribució per fenomen, adaptats a escriptori i mòbil sense dependències noves.
- Exportació de tots els resultats filtrats a CSV i PDF multipàgina generats al navegador.

### Worker i compatibilitat

- `/alert-history` amplia el contracte amb `pagination`, `stats` i `facets`, i executa filtres parametritzats a D1.
- El paràmetre antic `limit` es conserva; la portada continua mostrant només cinc episodis i no canvia el sistema visible d’avisos AEMET/Meteocat.
- No cal cap migració de D1: s’utilitza la taula `alert_events` existent.

### Meteo IA

- Respon consultes com «quants avisos hi ha hagut aquest any?», «quants han estat vermells?» i «quan va ser l’últim avís?». 
- Enllaça directament l’Historial d’avisos dins de Fonts i diferencia explícitament episodis antics d’avisos actius.

### Validació

- Proves específiques de paràmetres, paginació del Worker, CSV i intencions històriques de Meteo IA.
- Versions web, Worker, panell d’administració i memòria cau PWA unificades a V17.0.0.

## V16.0.0 — 2026-08-10

### Panell d’Administració · Milestone 10 completat

- Nova pàgina protegida `administracio.html`, exclosa de cercadors i separada de la navegació pública.
- Resum visual de Worker, estació, D1 i avisos, amb estat general i actualització manual o automàtica.
- Detall de frescor, disponibilitat de les últimes 24 hores, mostres, camps absents, cobertura històrica, episodis d’avís i activitat del formulari.
- Estat de configuració de Weather Underground, D1, correu, push, analítica, accés administratiu i fase futura de xarxes, sense exposar cap credencial.
- Diagnòstic de PWA, Service Worker, mode instal·lat, memòries cau i versions web/Worker.
- Registre d’incidències del navegador limitat a la sessió actual i còpia d’un diagnòstic que exclou la clau.

### Protecció i Worker

- Nou endpoint `/admin/status` de només lectura, protegit amb `ADMIN_TOKEN` i comparació de hashes.
- Clau conservada únicament a `sessionStorage`; mai en URL, configuració pública ni diagnòstics.
- Respostes privades amb `no-store` i exclusió explícita de la memòria cau de la PWA.
- Panell sense operacions destructives i amb guia d’activació a `admin/README.md`.

### Roadmap

- Les xarxes socials es traslladen al final per crear els comptes i permisos conjuntament amb l’usuari.
- Worker i contractes públics existents continuen compatibles; només s’afegeix una ruta administrativa protegida.

## V15.0.0 — 2026-08-10

### Centre de Dades reordenat

- Un únic selector de 7, 30 o 365 dies controla resum, gràfiques, extrems i descàrregues.
- Gràfiques i extrems se sincronitzen automàticament i deixen de mostrar controls paral·lels contradictoris.
- Les dades de calendari —avui, aquest mes, aquest any, pluviometria i «un dia com avui»— queden en un segon bloc clarament independent.
- La descàrrega se situa al costat del resum del període i explica exactament quin conjunt exporta.

### Meteo IA didàctica i amb efemèrides

- Explica conceptes com DANA, fronts, isòbares, humitat, probabilitat de pluja, radar, models i núvols.
- Recomana la font adequada segons si es busquen observacions, avisos, dades obertes, climatologia o classificació de núvols.
- Enllaça AEMET MeteoGlosario, AEMET OpenData, dades obertes de Meteocat, serveis climatològics d’AEMET i l’Atles de Núvols de l’OMM.
- Calcula «un dia com avui» només amb anys comparables de l’arxiu Fontanillas; si no n’hi ha, ho indica sense inventar registres.

### Compartició Premium · Milestone 8 completat

- Targeta automàtica de 1200 × 630 px amb marca, URL i observació, predicció o avisos reals segons la pàgina.
- Compartició de la imatge amb el menú natiu quan és compatible, descàrrega PNG i còpia conjunta de text i enllaç.
- Alternativa editorial sense xifres inventades quan una pàgina no disposa de context meteorològic.
- Compartició disponible també a l’Historial d’avisos.

### Validació i compatibilitat

- Proves específiques per a conceptes, fonts i efemèrides de Meteo IA i per al contingut de les targetes.
- Worker i contractes d’API sense canvis; PWA, push, avisos AEMET/Meteocat, comparativa i radar es mantenen compatibles.

## V14.0.0 — 2026-08-10

### Meteo IA amb context

- Recorda temporalment destinació, període i activitat dins de la pestanya, sense desar el text de la conversa.
- Entén preguntes encadenades: després de parlar de bicicleta a la Vall d’Aran, «quin temps hi farà?» conserva Vall d’Aran, cap de setmana i bicicleta.
- Separa correctament «Vall d’Aran» de «aquest cap de setmana» i resol el territori amb Vielha e Mijaran com a referència meteorològica.
- Prioritza la destinació abans de la paraula «bici», evitant respondre amb la calor i l’UV de Sant Celoni.
- Afegeix consells específics per bicicleta segons calor, probabilitat de pluja i ratxes de la destinació.
- Mostra el context actiu a la conversa i permet esborrar-lo; el botó flotant és una mica més petit sense perdre llegibilitat.

### Centre de Dades i predicció

- Nou quadre pluviomètric amb intensitat actual, avui, últimes 24 h, episodi recent, ahir, mes, any, dies plujosos, períodes secs, llindars d’1/10/20 mm i dia més plujós.
- Les dades incompletes s’expressen com a cobertura mínima, sense deduir dates fora de l’arxiu.
- Nova tendència de sis setmanes amb mitjana del conjunt ECMWF EC46 i anomalies setmanals de temperatura i precipitació.
- Enllaços directes a la predicció mensual oficial d’AEMET, la metodologia ECMWF i la font Open‑Meteo.

### SEO · Milestone 7

- Metadades, canòniques, Open Graph i X específics per a cada vista del portal.
- Dades estructurades `WebSite`, `WebPage`, `Dataset` i `BreadcrumbList`.
- Sitemap ampliat i SEO local per Sant Celoni i el Baix Montseny.
- Guia separada per activar Search Console i mesurar Core Web Vitals després de publicar.

### Preservat

- Worker i contractes d’API existents sense canvis; avisos AEMET/Meteocat, PWA, compartir, comparativa, radar, medi ambient i push continuen actius.

## V13.1.0 — 2026-08-10

### Meteo IA més flexible

- Entén dies concrets com dilluns, divendres o diumenge, a més d’avui i demà.
- Resumeix el cap de setmana i la setmana següent, amb una advertència explícita quan augmenta la incertesa.
- Amplia les consultes d’altres poblacions fins a 14 dies i elimina la preferència incorrecta per coincidències espanyoles.
- Interpreta ordres com «temps per divendres a Sant Celoni» i «la setmana que ve a Londres».
- Les fonts són enllaços clicables cap a Estació, Predicció, Avisos, Centre de Dades, Comparar, Medi Ambient o Open‑Meteo.

### Xat flotant

- Nou botó «Pregunta al temps» fix a la part inferior dreta del portal.
- Permet resoldre una primera pregunta ràpida des de qualsevol pàgina.
- Després de la resposta ofereix continuar a l’apartat complet de Meteo IA, evitant convertir el giny petit en una conversa difícil de llegir.
- També funciona a Comparar, Historial d’avisos i Metodologia.

### Preservat

- Worker i contractes existents sense canvis; la conversa continua sense desar-se ni enviar-se a cap model extern.

## V13.0.0 — 2026-08-10

### Meteo IA · Milestone 6 completat

- Nova pàgina «Meteo IA» al menú lateral i a l’hamburguesa mòbil.
- Accés ràpid directe a Meteo IA quan la PWA està instal·lada.
- Preguntes lliures i accessos suggerits per situació actual, avui/demà, avisos, evolució recent, comparació d’estacions i medi ambient.
- Recomanacions combinades per córrer, excursions i activitats familiars, amb prioritat absoluta per als avisos oficials.
- Consulta d’altres poblacions mitjançant geocodificació i predicció d’Open‑Meteo.
- Cada resposta mostra les fonts i l’hora disponibles; la falta d’avisos verificables no es presenta mai com una situació segura.
- Conversa processada al navegador, sense historial persistent ni enviament a un model generatiu extern.
- Nova prova específica amb dades controlades per validar vuit intencions meteorològiques.

### Arquitectura

- `src/features/meteo-ai.js` concentra interpretació, conversa i recomanacions.
- `src/services/weather-api.js` centralitza també les estacions properes i les consultes d’altres poblacions.
- Medi Ambient publica un context normalitzat reutilitzable i el Service Worker incorpora el nou mòdul.

### Preservat

- Worker i contractes existents sense canvis; avisos, estació, predicció, PWA, radar, comparar, compartir i push continuen actius.

## V12.2.0 — 2026-08-10

### Branding · Milestone 5 completat

- Creats el símbol vectorial i la composició horitzontal oficials de l’Observatori.
- Regenerats favicon, Apple Touch Icon i icones PWA de 192 i 512 px amb una paleta més lluminosa i llegible.
- Separades les icones maskable de les normals, amb zona segura pròpia perquè Android no retalli el Montseny, el sol ni la línia de dades.
- Nova targeta social de 1200 × 630 px, més clara i sense lectures meteorològiques fictícies o desactualitzables.
- Metadades Open Graph i X coherents a Inici, Comparar, Historial d’avisos i Metodologia.
- Afegits accessos ràpids de la PWA a Estació, Avisos i Radar.
- Guia de marca ampliada amb recursos mestres, paleta d’icones i criteri explícit d’evitar imatges excessivament fosques.

### Preservat

- Dades, API i Worker sense canvis; avisos AEMET/Meteocat, radar, Medi Ambient, Centre de Dades, comparativa, push i compartir continuen intactes.

## V12.1.0 — 2026-08-10

### Corregit

- Substituït el visor de llamps d’AEMET per l’embed vectorial en temps real de Blitzortung, centrat a Catalunya i comprovat en una amplada mòbil de 390 px.
- Substituït el visor ArcGIS del Pla Alfa, lent i inestable en alguns telèfons, pel mapa oficial diari dels Agents Rurals amb data i llegenda visibles.
- L’índex UV de Medi Ambient utilitza prioritàriament el valor real del sensor de Fontanillas; CAMS només actua com a fallback identificat.

### Millorat

- Targetes de Comparar més petites: menys alçada i farciment, temperatura més compacta i sis variables distribuïdes en tres columnes.
- Alçada del visor de llamps reduïda i adaptada a escriptori i mòbil.

### Branding · Milestone 5

- Nom curt de la PWA unificat com a «Observatori» per evitar truncaments.
- Nova guia d’identitat amb nom, símbol, colors, tipografia, pictogrames i criteris d’ús.

### Preservat

- API i Worker sense canvis de contracte; avisos oficials, PWA, compartir, comparativa històrica i fonts de Medi Ambient continuen actius.

## V12.0.0 — 2026-08-10

### Afegit

- Visors ambientals integrats i carregats sota demanda: Pla Alfa oficial, estat de sequera de l’ACA i albiraments de MedusApp (UPV i Universitat d’Alacant).
- Enllaços complementaris a PlatgesCat i Meduseo, diferenciant la font oficial, la ciència ciutadana i el servei internacional extern.
- Interpretació visual baixa, raonable, moderada, alta o extrema per als índexs europeus de PM10, PM2,5, NO₂, O₃ i SO₂.
- Pàgina separada `historial-avisos.html` amb cerca i filtres per any i nivell.
- Descobriment automàtic d’estacions meteorològiques properes per ampliar la comparativa fins a sis ubicacions, amb fallback estable.
- Nou sistema coherent de pictogrames SVG al menú lateral, primera actuació del Milestone 5.

### Millorat

- Capçaleres de totes les subpàgines més compactes, amb la mateixa alçada visual, tipografia i separació.
- Títol de Comparar reescrit per explicar clarament que mostra les diferències meteorològiques del Baix Montseny.
- Distància a Fontanillas visible per a les estacions descobertes automàticament.
- L’historial de la pàgina principal queda limitat als cinc episodis més recents i disposa d’un únic desplaçament intern.
- Metodologia incorpora la mateixa capçalera visual que la resta del portal.

### Preservat

- Contractes existents de `/stations` i `/alert-history`: només s’amplien camps i criteris sense retirar-ne cap.
- Avisos AEMET/Meteocat, radar, Centre de Dades, PWA, compartir, push, contacte i dades de l’estació.

## V11.0.0 — 2026-08-10

### Afegit

- Primera fase de Medi Ambient amb AQI europeu, PM10, PM2,5, NO₂, O₃, CO, SO₂, radiació UV i cinc tipus de pol·len a partir del model CAMS via Open‑Meteo.
- Accessos prioritaris als mapes oficials de Pla Alfa, sequera de l’ACA i PlatgesCat amb informació de meduses.
- Invitació inicial per configurar avisos, amb resposta recordada al navegador perquè només aparegui una vegada.
- Visor oficial de llamps d’AEMET carregat sota demanda dins de la pàgina Radar.
- Capçalera visual compartida per a totes les subpàgines del portal.

### Corregit

- Etiqueta de la webcam de portada més petita i menys invasiva.
- Substituït el visor de llamps de Meteocat, que quedava tallat, per la imatge oficial adaptable d’AEMET.
- Corregit el farciment superior de la capçalera d’Estació i unificat amb la resta de vistes.
- Eliminada la confusió entre espai exterior de pàgina i farciment interior de les capçaleres.

### Planificat

- Redisseny dels pictogrames del menú lateral incorporat al Milestone 5 de branding.

### Preservat

- Worker i contractes de dades sense canvis; també es preserven avisos AEMET/Meteocat, historial, Centre de Dades, comparativa, PWA, compartir i contacte.

## V10.0.0 — 2026-08-10

### Afegit

- Títol i introducció propis per a la pàgina Estació.
- Nova pàgina «Cel de dia i de nit» al menú lateral, reutilitzant tots els càlculs d’astronomia existents.
- Producte oficial combinat radar + llamps de Meteocat integrat dins de la pàgina Radar.
- Selecció de webcams properes al Montseny amb quatre accessos verificats.
- Comparador avançat amb mapa interactiu del Baix Montseny, marcadors, llegenda i cinc variables commutables.
- Comparació actual i històrica per temperatura, humitat, pressió, vent i pluja en els períodes Ara, Avui i 24 h.

### Millorat

- Webcam de portada més ampla, centrada i proporcionada segons la referència visual de l’usuari.
- Finestra de compartir amb fons sòlid, més contrast i botons clarament llegibles.
- Distribució de la portada ajustada per donar més amplada a temperatura i webcam sense afectar la lectura ràpida.

### Preservat

- Worker i contractes de l’API sense canvis.
- Centre de Dades, avisos AEMET/Meteocat, PWA, compartir, push i resta de funcions de V9.
- Milestone 4 i posteriors sense iniciar.

## V9.0.0 — 2026-08-10

### Afegit

- Centre de Dades complet amb selecció de 7, 30 i 365 dies.
- Cobertura, nombre real de mostres, temperatura mitjana i desviació estàndard, pluja acumulada i ratxa màxima.
- Resums del dia, del mes i de l’any; arxiu d’extrems i efemèrides segons la cobertura disponible.
- Descàrregues locals en CSV, Excel, JSON i PDF, sense enviar dades a tercers.
- Miniatura discreta de la webcam a la portada, enllaçada amb la vista completa de Webcams.

### Corregit

- Eliminada la doble compensació vertical entre la capçalera fixa i la primera secció de cada pàgina.
- Preservat el farciment interior original de la portada en aplicar la correcció d’espaiat.
- Eliminats Comparar i Metodologia de tots els peus; continuen disponibles al menú principal.
- Mantingut un únic «Tornar amunt» al peu de cada pàgina.

### Preservat

- API i Worker sense canvis de contracte.
- Avisos AEMET/Meteocat, PWA, compartir, push, comparativa, radar i resta de mòduls existents.

## V8.0.1 — 2026-08-10

### Corregit

- Capçalera fixa i visible durant el desplaçament en totes les pàgines.
- Barra lateral compartida també a Comparar i Metodologia.
- Eliminats sis enllaços «Torna amunt» que havien quedat fora de les seves seccions i apareixien agrupats.
- Eliminada la navegació mòbil antiga duplicada; la hamburguesa és ara l’única navegació compacta.
- Eliminat el botó redundant «Tornar a l’inici» del principi de Metodologia.
- Enllaços de marca i retorn adaptats a les noves vistes del portal.
- Nous recursos comuns incorporats a la memòria cau de la PWA.

## V8.0.0 — 2026-08-10

### Afegit

- Governança del projecte amb `PROJECT.md`, `ROADMAP.md` i aquest registre.
- Menú lateral compacte en escriptori i menú hamburguesa en mòbil.
- Vistes especialitzades per Inici, Estació, Predicció, Avisos, Radar, Webcams, Centre de Dades, Medi Ambient i Contacte.
- Accés preservat a les pàgines existents Comparar i Metodologia.
- Router lleuger sense dependències ni canvis als contractes de dades.

### Canviat

- Portada reduïda a consulta ràpida: situació actual, mètriques, avisos, predicció i radar resumits.
- Contingut extens distribuït entre vistes, reutilitzant el mateix DOM i els mateixos mòduls.

### Preservat

- Avisos visibles d’AEMET i Meteocat, historial d’avisos i notificacions push.
- Comparativa, compartir, Worker, API, PWA, Service Worker i manifest.
- Capçalera, estat en directe i estètica general de la V7.

### Abast ajornat

- No s’han implementat funcions dels milestones 2–10. Medi Ambient només disposa de la nova ubicació estructural.
