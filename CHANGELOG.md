# Changelog

## V22.0.0 — 2026-08-21

- Nova secció visual «Predicció vs realitat», basada exclusivament en pronòstics desats abans del dia verificat i lectures reals de l’estació.
- Captures de previsió Open-Meteo cada sis hores en D1, amb mètriques d’error de temperatura i vent i encert de pluja per horitzó.
- Publicació automàtica diària a Facebook, Instagram, Bluesky i Telegram quan el canal està configurat.
- Nova targeta social vertical 1080×1350 generada al Worker amb dades reals, hora i font; eliminada la imatge estàtica d’Instagram.
- Correu operatiu si una publicació automàtica falla i registre complet per canal.
- Enllaços web a Instagram, Facebook, Threads, X, Bluesky, Telegram, TikTok, WhatsApp i YouTube.
- Preparació d’estat de credencials per a Threads, X, TikTok i YouTube; Shorts queda pendent del flux OAuth i de vídeo.

## V21.5.0 — 2026-08-21

- Meteo IA passa a una arquitectura híbrida: manté les respostes calculades amb dades verificades i usa Workers AI per entendre preguntes obertes o formulades de manera imprevista.
- Afegits límits d’ús i context meteorològic acotat a l’endpoint d’IA.
- La comparació d’estacions mostra només les lectures actuals i elimina «Avui» i «24 h».
- El Worker detecta fallades consecutives de Weather Underground i envia correus d’incidència i recuperació, evitant avisos repetitius.
- Si Weather Underground falla, la portada mostra l’última observació fiable de D1 i identifica clarament el mode degradat.
- Definida la fase «Predicció vs realitat» amb snapshots previs de la predicció i verificació posterior contra D1.
- Renovada la memòria cau de la PWA a V21.5.0.

## V21.4.0 — 2026-08-21

- Ampliats els símbols meteorològics del resum de portada i forçada la presentació emoji en color perquè siguin més immediats d’interpretar.
- Afegida l’hora de la màxima i la mínima del dia al costat dels valors de la portada.
- Renovades les icones d’iPhone i PWA a partir de l’avatar actual de la web i les xarxes, amb un nom de fitxer nou per evitar la memòria cau antiga d’iOS.
- Consolidada la URL canònica de l’aplicació i eliminades del sitemap les vistes internes amb paràmetres per evitar senyals duplicats a Google Search Console.
- Renovada la memòria cau de la PWA a V21.4.0.

## V21.3.0 — 2026-08-13

### Portada més directa

- L’accés d’avisos de la capçalera de la portada obre directament la pàgina completa d’Avisos.
- Retirat de la portada el bloc extens d’avisos, que es manté íntegrament a la seva pàgina pròpia.
- Eliminada la duplicació de contingut i escurçat el recorregut principal de consulta.

### Predicció més fàcil de llegir

- Reorganitzada la lectura inicial en tres períodes clars: el que queda d’avui, demà i els pròxims dies.
- El resum d’avui utilitza només les hores que encara queden i mostra temperatura, probabilitat de pluja i vent.
- Demà disposa d’un resum de jornada amb màxima, mínima, pluja i ratxa prevista.
- Els tres dies següents es presenten en una franja visual compacta, mantenint a sota el detall de 48 hores i la previsió de set dies.

### Compatibilitat

- Renovada la memòria cau de la PWA a V21.3.0.
- Mantinguts els contractes de dades, D1, avisos oficials, push, administració i publicació social manual.
- Superades les dotze proves automatitzades del projecte.

## V21.2.0 — 2026-08-11

### Gestor editorial protegit

- Afegida al panell d’administració una cua editorial completa per revisar, editar, aprovar, descartar i restaurar els esborranys socials.
- Aprovar un contingut no el publica: cada xarxa només s’envia després de prémer el seu botó i acceptar una confirmació explícita.
- Els continguts publicats queden bloquejats contra modificacions accidentals i els descartats es conserven a l’historial.
- Afegits filtres, recompte d’estats, protecció contra pèrdua d’edicions i una disposició responsive per a ordinador i mòbil.

### Diagnòstic, publicació manual i traçabilitat

- Afegida una comprovació segura i individual de Facebook, Instagram, Bluesky i Telegram que valida comptes, permisos i credencials sense publicar.
- Incorporades publicacions manuals independents per als quatre canals, sempre des del Worker i sense exposar credencials al navegador.
- Facebook publica text i enllaç a la pàgina configurada; Instagram crea i valida el contenidor multimèdia abans de publicar la targeta social de 1200 × 630 px.
- Cada intent, correcte o fallit, queda registrat per canal a la nova taula D1 `social_publications` i és visible des del mateix esborrany.
- El cron només genera esborranys i mai envia contingut automàticament.
- Afegits endpoints administratius protegits per consultar i actualitzar la cua i executar únicament una publicació manual autoritzada.

### Compatibilitat i validació

- Actualitzats Worker, esquema D1, panell, PWA, proves i documentació a V21.2.0.
- Preservats els contractes públics de dades, avisos AEMET/Meteocat, OneSignal, Meteo IA, comparador, compartir i PWA.

## V21.0.2 — 2026-08-11

### Nova jerarquia de marca i capçalera

- Traslladats el nou avatar rodó i la identitat «Fontanillas · Sant Celoni» al capdamunt del menú lateral.
- Eliminada la marca repetida de les capçaleres públiques perquè la franja fixa sigui més neta i funcional.
- Reordenada la capçalera amb l’estat «En directe» i l’hora a l’esquerra, i Instagram, Facebook, Bluesky i Telegram alineats a la dreta.
- Mantingut el context de cada pàgina només quan hi ha espai suficient, sense competir amb l’estat en directe ni amb les xarxes.

### Menú lateral i adaptació mòbil

- Separats clarament marca, navegació desplaçable i peu social perquè la barra de desplaçament no envaeixi els accessos inferiors.
- Recompost el bloc social inferior com quatre botons circulars de mida uniforme, amb copyright propi sota les icones.
- Ajustats amplada, separacions, jerarquia tipogràfica i comportament de l’hamburguesa en pantalles estretes.
- Preservada la capçalera específica del panell d’administració, que continua identificant l’àrea protegida.

### Compatibilitat i validació

- Sense canvis als contractes de l’API, Worker, D1, PWA, OneSignal, avisos, compartir, comparador ni Meteo IA.
- Actualitzats la memòria cau, les versions, les proves i la documentació a V21.0.2.

## V21.0.1 — 2026-08-11

### Xarxes visibles sense interferències

- Afegits accessos oficials a Instagram, Facebook, Bluesky i Telegram, amb icones accessibles i sense carregar SDK ni seguiment de tercers.
- Les quatre icones apareixen a la capçalera d’escriptori, al peu i al menú lateral; al mòbil es prioritza l’espai útil i es mantenen al peu.
- Corregida l’adreça pública de Facebook a `facebook.com/meteofontanillas` i afegits els perfils públics de Bluesky i Telegram.
- Reservat espai al peu perquè el botó flotant de Meteo IA no tapi els enllaços socials.

### Menú lateral i marca

- Reequilibrat el menú lateral amb una targeta contextual superior de Sant Celoni i un peu propi amb xarxes i copyright.
- Traslladat el copyright principal al final del menú lateral en escriptori; continua disponible al peu en pantalles petites.
- Incorporat un avatar rodó i lluminós de 1024 × 1024 px, apte per al portal i per als perfils socials.
- Substituït el símbol antic de les capçaleres pel nou avatar, mantenint nom i identitat textual.
- Regenerats els favicons i les icones d’instal·lació amb la mateixa marca V21, incloses les variants maskable.

### Preparació social segura

- El panell administratiu diferencia les credencials de Meta, Bluesky i Telegram sense exposar-ne cap valor.
- Els esborranys diaris queden preparats per als quatre canals i continuen en mode `draft`.
- No s’ha implementat cap publicació automàtica: la revisió humana continua sent obligatòria.
- Actualitzats Service Worker, memòria cau, proves i documentació a V21.0.1.

## V21.0.0 — 2026-08-11

### Medi ambient i lectura del pol·len

- Afegits nivells orientatius específics per gramínies, bedoll, olivera, artemisa i ambrosia.
- Cada espècie mostra concentració, etiqueta, color i barra, amb un resum de l’espècie dominant i recomanacions prudents.
- Mantingudes les dades originals i les fonts; la interfície deixa clar que no és un diagnòstic mèdic.

### Marca, xarxes i accessibilitat

- Redibuixat el símbol de l’Observatori amb una paleta més lluminosa, una silueta més neta del Montseny i un pols meteorològic visible a mida petita.
- Regenerat el paquet complet de favicons i icones PWA des de la mateixa font vectorial.
- Afegits accessos accessibles a Instagram i Facebook al peu de totes les pàgines.
- Incorporat `© 2026` de manera coherent i retirats els accessos de compartició a X, que no forma part del projecte.

### Fase social segura

- Afegida la taula D1 `social_drafts` i una cua deduplicada que prepara un resum meteorològic diari.
- El panell d’administració mostra la credencial Meta com a booleà, l’estat de la cua i els últims esborranys sense exposar secrets.
- La publicació automàtica continua desactivada i no existeix cap petició a l’API de Meta per publicar.

### Compatibilitat

- Mantinguts avisos AEMET/Meteocat, OneSignal, Meteo IA, comparador, Centre de Dades, compartir, PWA i contractes previs.
- Actualitzades versions, documentació i proves bàsiques de V21.

## V20.0.0 — 2026-08-10

### Biblioteca educativa

- Reconstruïda completament la pàgina «Aprendre» com una biblioteca meteorològica rica en enllaços i no com una successió de quatre explicacions i un qüestionari.
- Incorporats 27 recursos seleccionats de Meteocat, AEMET, OMM, NOAA, NASA, UCAR, ESA, EUMETSAT, Copernicus, IPCC, ECMWF i Protecció Civil.
- Itineraris directes per a Primària, ESO, Batxillerat i docents, més un nivell avançat per a dades i modelització.
- Cerca sense accents i filtres combinables per nivell i nou àmbits: bases, observació, núvols, predicció, satèl·lits, riscos, clima, dades i projectes.
- Cada recurs identifica entitat, descripció, idioma i format abans d’obrir una pestanya externa.
- Nou «Laboratori Fontanillas» amb accessos a Estació, Radar, Centre de Dades i Avisos per aprendre amb observacions reals i locals.
- Disseny adaptat a ordinador i mòbil, amb icones més clares i lluminoses i sense carregar imatges de tercers.

### Analítica i administració

- El panell diferencia ara l’analítica activada al domini de la detecció puntual del beacon en la pàgina d’administració.
- Cloudflare Web Analytics apareix en verd com «Actiu al domini» quan la configuració confirmada és vigent, encara que Cloudflare no injecti el beacon en aquella càrrega concreta.
- El diagnòstic copiable conserva separats l’estat configurat, el proveïdor i la detecció local.

### Compatibilitat i validació

- Afegides proves de quantitat, HTTPS, organismes, filtres, selectors, PWA i estat d’analítica de la V20.
- Mantinguts API, D1, avisos AEMET/Meteocat, OneSignal, Meteo IA, comparador, compartir i contractes existents.

## V19.1.1 — 2026-08-10

- Corregida l’alçada desproporcionada del bloc «Context actiu» de Meteo IA: cada part del xat ocupa ara la seva fila correcta i «Esborrar context» es manté compacte també al mòbil.
- Meteo IA compara dies d’un període i respon directament quin serà més plujós, ventós, càlid, fred o favorable.
- Les recomanacions per córrer, anar amb bicicleta, fer excursions o activitats familiars utilitzen ara la data o el període demanat, en lloc de valorar sempre el dia actual.
- Millorades les preguntes encadenades: el lloc, el període i l’activitat continuen aplicant-se a comparacions i consultes concretes posteriors.
- Fixada de manera robusta la capçalera d’administració, amb compensació d’espai i fons opac a ordinador i mòbil.
- Integrada la detecció de Cloudflare Web Analytics al panell, actualitzada la política CSP i documentada l’analítica agregada a Privacitat.
- Mantinguts els contractes d’API, D1, Worker, OneSignal, PWA, compartir i comparador.

## V19.1.0 — 2026-08-10

- Confirmada l’activació completa de OneSignal: subscripcions web verificades i credencials del Worker reconegudes pel panell administratiu.
- Confirmada la propietat de domini `fontanillas.cat` a Google Search Console i el processament correcte del sitemap amb 13 URL descobertes.
- Corregides la nota antiga del panell i la ruta desfasada del Service Worker a la documentació de push.
- Afegida mesura local de LCP, CLS, INP i TTFB al panell, sense analítica externa, galetes ni enviament de dades.
- Incorporats llindars interpretables per detectar si les mètriques locals són bones, necessiten observació o requereixen millora.
- Mantinguts intactes els contractes d’API, D1, avisos, comparador, compartir, PWA i Meteo IA.

## V19.0.7 — 2026-08-10

- Corregits els bloquejos CSP confirmats per la consola de Firefox durant la càrrega de OneSignal.
- Autoritzats exclusivament els dominis oficials de OneSignal per a l'estil, l'SDK i la sincronització push.
- Mantingudes les restriccions específiques de scripts, connexions, imatges i marcs del portal.
- Conservada la protecció contra recàrregues repetides i el Worker compartit de la V19.0.6.

## V19.0.6 — 2026-08-10

- Corregit immediatament el bucle de recàrrega introduït a la V19.0.5.
- OneSignal és ara l'únic responsable de registrar el Worker compartit; la PWA reutilitza el registre actiu sense competir-hi.
- Afegida una protecció temporal que impedeix diverses recàrregues consecutives davant canvis de controlador.
- Es manté el Worker combinat necessari perquè Firefox pugui activar les notificacions sense perdre la PWA.

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
