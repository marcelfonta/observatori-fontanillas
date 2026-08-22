# Observatori Meteorològic Fontanillas

## Missió

Ser el portal meteorològic de referència del Baix Montseny: informació local fiable, visual, ràpida, accessible i sense publicitat per a població general, aficionats, famílies i escoles.

## Principis

- La informació essencial s’ha de trobar en menys de deu segons.
- Les dades han de ser traçables; no s’inventen sensors ni observacions.
- Cada font externa s’identifica i els avisos oficials sempre prevalen.
- Les funcionalitats existents es reutilitzen; no es dupliquen API, lògica ni components.
- Cada fita ha de deixar una versió publicable i funcional.
- Rendiment, accessibilitat, mòbil i PWA són requisits, no extres.

## Arquitectura actual

- `index.html`: portal i vistes principals.
- `comparativa.html`: comparador d’estacions existent.
- `historial-avisos.html`: arxiu complet d’episodis amb cerca i filtres.
- `metodologia.html`: metodologia ampliada existent.
- `privacitat.html`: informació pública sobre dades, emmagatzematge i serveis opcionals.
- `css/`: variables, disseny base i navegació del portal.
- `src/core/`: configuració i utilitats comunes.
- `src/services/`: accés únic als serveis meteorològics.
- `src/modules/`: estació, avisos, predicció, radar, gràfiques, astronomia i altres mòduls.
- `src/features/`: PWA, push, compartir, historial d’avisos, analítica, router del portal, Centre de Dades i Meteo IA.
- `worker/`: Worker actiu i esquema de dades. No modificar-ne els contractes sense migració documentada.

## Fonts i serveis que cal preservar

Estació Fontanillas, Worker propi, Weather Underground, Open-Meteo, AEMET, Meteocat, RainViewer i els ginys meteorològics ja integrats. Les claus i URLs es centralitzen en la configuració existent.

## Navegació V12

Inici, Meteo IA, Estació, Predicció, Cel de dia i de nit, Avisos, Radar, Webcams, Centre de Dades, Comparar, Medi Ambient, Aprendre, Contacte i Metodologia. Escriptori: lateral fi. Mòbil: hamburguesa. La capçalera, l’estat en directe i la identitat visual es preserven.

La capçalera és fixa. La primera secció de cada vista compensa l’altura de la capçalera una sola vegada. Els peus ofereixen Privacitat, un únic «Tornar amunt» i Compartir quan correspon; la navegació entre àrees pertany al menú lateral o a l’hamburguesa.

## Centre de Dades V9

La vista consumeix el mateix `/history` ja utilitzat per les gràfiques i els extrems. `src/features/data-center.js` calcula resums només al navegador i genera exportacions sense llibreries ni serveis nous. El Worker i els formats de resposta es mantenen intactes.

## Comparador V12

`comparativa.html` i `src/features/stations-comparison.js` consumeixen `/stations?period=now|today|24h`. El Worker manté Fontanillas com a referència i utilitza el servei de proximitat de The Weather Company per completar automàticament fins a sis estacions en un radi màxim de 20 km, amb fallback a la selecció estable anterior. El mapa, les targetes i la gràfica de cinc variables parteixen d’un únic payload normalitzat. Leaflet es carrega sota demanda i Chart.js continua sent l’únic motor de gràfiques.

La vista «Cel de dia i de nit» reutilitza el mòdul d’astronomia existent. El radar conserva la capa oficial de Meteocat i mostra l’activitat elèctrica amb el mapa vectorial incrustable de Blitzortung, una xarxa col·laborativa no oficial. La interfície indica que els avisos de Meteocat, AEMET i Protecció Civil sempre prevalen.

## Medi Ambient V12

`src/features/environment.js` consulta directament l’API de qualitat de l’aire d’Open‑Meteo per mostrar l’estimació CAMS europea a les coordenades de Sant Celoni, també desglossada per contaminant. L’UV es rep des del mateix payload de l’estació Fontanillas que alimenta la portada; només usa CAMS si el sensor no retorna cap valor. La interfície mostra el mapa oficial diari del Pla Alfa com una imatge lleugera, i carrega sota demanda els visors de l’ACA i MedusApp. Meduseo s’ofereix només com a enllaç extern.

Totes les subpàgines del portal comparteixen el component visual `portal-view-header`. La invitació inicial d’avisos desa una única decisió local al navegador i no torna a interrompre la navegació després de respondre.

La pàgina principal d’avisos demana com a màxim cinc episodis. `historial-avisos.html` consulta el mateix endpoint amb paginació de 10, 20 o 50 registres, filtres executats a D1 i estadístiques agregades. No duplica dades ni crea un segon arxiu.

## Identitat visual V12.2

El menú lateral utilitza un únic sistema de pictogrames SVG de línia, amb el mateix gruix, mida i color. Són codi local, no depenen de fonts d’icones ni de serveis externs i mantenen etiquetes textuals visibles.

V12.1 fixa «Observatori» com a nom curt instal·lat i incorpora `assets/logos/BRAND-GUIDE.md` com a font de criteri per al símbol, colors, tipografies i pictogrames.

V12.2 tanca el sistema amb fonts vectorials del símbol i la composició horitzontal, i genera un paquet PNG complet i reproduïble des de `scripts/build-brand-assets.py`. Les icones normals i maskable tenen fitxers diferents i una zona segura real. El manifest utilitza una paleta més lluminosa i exposa accessos ràpids a Estació, Avisos i Radar. Totes les pàgines especialitzades comparteixen la mateixa targeta social, sense xifres en directe que puguin quedar desactualitzades.

## Meteo IA V13

`src/features/meteo-ai.js` és una capa d’interpretació local, no un generador de dades. Rep el context ja carregat per `src/app.js` i escolta els mateixos esdeveniments d’avisos i medi ambient que alimenten la interfície. Les consultes del comparador i d’altres poblacions passen per funcions centralitzades a `src/services/weather-api.js`.

La conversa no es desa ni s’envia a cap model extern. Només s’envia a Open‑Meteo el nom d’una població quan l’usuari demana explícitament consultar-la. Les respostes mostren fonts i hora, i qualsevol fallada dels avisos es presenta com a «estat no verificat», mai com a «sense avisos». L’assistent no substitueix Meteocat, AEMET, Protecció Civil ni el 112.

V13.1 amplia l’intèrpret temporal a dies concrets, cap de setmana i setmana següent. Les consultes geogràfiques disposen de 14 dies i utilitzen el primer resultat rellevant d’Open‑Meteo, sense forçar coincidències espanyoles. Les fonts incorporen enllaços cap a la vista interna o el servei extern corresponent. `initMeteoAIWidget()` crea un xat flotant compartit també per `portal-static.js`: resol una primera consulta i després deriva cap a la pàgina completa per continuar.

## Evolució V14

Meteo IA manté a `sessionStorage` únicament el context funcional de la pestanya —destinació, període i activitat—, mai el text complet de la conversa. Això permet resoldre pronoms i preguntes encadenades com «quin temps hi farà?» després de parlar de la Vall d’Aran. La destinació sempre es resol abans de la intenció d’activitat, de manera que bici, running o excursió utilitzen la predicció del lloc demanat. «Vall d’Aran» es consulta amb Vielha e Mijaran com a referència meteorològica identificada.

`src/features/long-range.js` interpreta les anomalies setmanals del conjunt ECMWF EC46, consultades de manera centralitzada a `src/services/weather-api.js`. La interfície limita l’horitzó a sis setmanes, treballa amb mitjanes i anomalies i evita presentar valors diaris a un termini on no serien fiables. AEMET i ECMWF queden enllaçats com a fonts metodològiques i oficials.

El Centre de Dades calcula la pluviometria avançada a partir del mateix arxiu `/history`: intensitat, acumulacions d’avui/ahir/24 h/mes/any, episodi recent, dies plujosos, dies des de llindars d’1, 10 i 20 mm i màxim anual. Quan l’arxiu no arriba a l’últim episodi, mostra «Més de» en lloc d’inventar una data.

`src/features/seo.js` centralitza les metadades de les vistes del portal. La fase tècnica de SEO inclou canòniques, descripcions locals, Open Graph, X, Schema.org, sitemap i instruccions de publicació. La propietat de domini es va verificar per DNS i el sitemap es va processar correctament el 10 d’agost de 2026. Les mètriques de camp de Search Console dependran del trànsit acumulat.

## Evolució V15

Centre de Dades té un únic selector de 7, 30 o 365 dies que governa resum, gràfiques, extrems i exportacions mitjançant l’esdeveniment intern `observatori:data-period-change`. Les dades fixes d’avui, mes i any i el quadre pluviomètric queden agrupats com a calendari actual, explícitament independent del selector. No s’ha duplicat l’arxiu ni s’ha modificat `/history`.

Meteo IA continua sent determinista i traçable. Afegeix una base didàctica acotada, enllaços a AEMET, Meteocat i l’Atles Internacional de Núvols de l’OMM, guia per escollir fonts i efemèrides calculades amb l’arxiu propi. Quan falta una sèrie comparable, ho declara i deriva cap a serveis climatològics oficials.

La Compartició Premium viu a `src/features/share.js`. Genera targetes PNG de 1200 × 630 px al navegador i rep el mateix context actual, de predicció i d’avisos que la resta del portal. La targeta mai introdueix una observació absent; en pàgines sense context meteorològic mostra una composició editorial. El menú natiu amb fitxer s’utilitza quan el dispositiu l’admet i sempre hi ha descàrrega i còpia com a alternatives.

## Evolució V16

`administracio.html` i `src/features/admin.js` formen un panell operatiu separat del portal públic. La ruta no s’indexa, no forma part del sitemap i només obté dades després que `worker/index.js` validi `ADMIN_TOKEN`. La clau es conserva exclusivament a `sessionStorage` i no apareix en URL, diagnòstics o fitxers públics.

El nou endpoint de només lectura `/admin/status` informa de versió i latència del Worker, frescor i disponibilitat de l’estació, D1, arxiu d’avisos i estat de configuració de Weather Underground, contacte i push. El navegador hi afegeix l’estat local de la PWA i de l’analítica, i identifica xarxes socials com a fase ajornada. Només es retornen booleans de configuració, mai credencials. Les respostes són privades, `no-store` i queden excloses explícitament de la memòria cau del Service Worker.

El panell registra únicament incidències de JavaScript de la pestanya actual i permet copiar un diagnòstic segur. No incorpora supressió, reinici, escriptura sobre D1 ni cap altra operació destructiva. L’activació queda documentada a `admin/README.md`.

## Evolució V17

`/alert-history` manté el paràmetre compatible `limit` i afegeix `page`, `pageSize`, `q`, `year`, `month`, `level`, `source` i `phenomenon`. El Worker construeix només condicions predefinides, envia els valors a D1 com a paràmetres i retorna `pagination`, `stats` i `facets`; cap text de l’usuari s’insereix directament a SQL.

`historial-avisos.html` consumeix aquest contracte sota demanda. Els gràfics són HTML i CSS accessibles, sense afegir una llibreria ni carregar tots els episodis al navegador. CSV i PDF recorren les pàgines filtrades únicament quan l’usuari demana una descàrrega. El PDF es genera localment i pot ocupar diverses pàgines.

Meteo IA utilitza `fetchAlertHistory()` només per preguntes inequívocament històriques, com «quants avisos hi ha hagut aquest any?» o «quan va ser l’últim avís?». Les preguntes sobre la situació actual continuen passant per `/alerts`, evitant confondre arxiu i vigilància activa.

## Evolució V18

`src/data/meteorological-ephemerides.js` és un catàleg editorial acotat, no una nova font d’observació. Cada entrada conté una data, un resum prudent i l’URL oficial de Meteocat o de l’Arxiu de Rècords de l’OMM. Centre de Dades i Meteo IA consumeixen exactament el mateix catàleg. Les efemèrides locals tenen prioritat i les curiositats externes s’etiqueten explícitament com a no locals.

La cronologia es calcula al navegador amb `buildWeatherTimeline()`: combina el període seleccionat de `/history` amb els avisos del mateix `/alert-history` de V17. No desa cap còpia, no modifica D1 i no converteix màxims del període en rècords històrics.

Les preferències push viuen a `src/core/notification-preferences.js`. El navegador transforma fenomen i nivell mínim en etiquetes de OneSignal; el Worker exigeix alhora l’etiqueta de categoria i la del nivell de l’episodi. `INSERT OR IGNORE` continua sent la protecció contra notificacions duplicades. OneSignal web i Worker van quedar activats i verificats el 10 d’agost de 2026; la clau REST continua existint exclusivament com a secret del Worker.

## Evolució V19

La quadrícula de calendari del Centre de Dades utilitza dues columnes equivalents i passa a una única columna abans que els resums de dia, mes i any perdin llegibilitat. Els valors principals i les etiquetes explicatives estan separats semànticament.

`src/features/learning.js` afegeix interaccions educatives locals sense API ni seguiment. La vista Aprendre reutilitza el router, la capçalera, les fonts i la PWA existents. `privacitat.html` documenta el tractament real; el Worker aplica SHA-256 als identificadors temporals del control antiabús abans de guardar-los a D1.

OneSignal es carrega dinàmicament només quan `oneSignalAppId` és present. El panell separa la configuració pública de la del Worker i comprova la base de publicació. `docs/SEARCH-CONSOLE-ACTIVACIO.md`, `docs/RENDIMENT-I-PUBLICACIO.md` i `social/` deixen definits els passos que depenen de comptes externs sense exposar secrets ni activar serveis abans d’hora.

V19.1 amplia el diagnòstic local amb `PerformanceObserver`. El panell mostra LCP, CLS, INP i TTFB de la càrrega actual, interpreta els llindars recomanats i incorpora els valors al diagnòstic copiable. V19.1.1 hi afegeix la detecció del beacon de Cloudflare Web Analytics, activat des de Cloudflare per obtenir dades agregades de camp sense incorporar Google Analytics.

## Evolució V20

`src/data/learning-resources.js` és el catàleg editorial de la biblioteca educativa. Cada entrada conté títol, institució, URL HTTPS, descripció, nivells, temes, idiomes, format i una icona clara. `src/features/learning.js` només filtra i renderitza aquest catàleg amb nodes DOM segurs; no injecta HTML extern, no carrega contingut de tercers i no envia cerques.

La vista Aprendre ofereix itineraris per Primària, ESO, Batxillerat i docents, cerca tolerant als accents, filtres combinables i accessos interns a dades locals. La selecció prioritza serveis meteorològics, organismes científics i centres educatius reconeguts. Els enllaços externs s’obren amb `noopener noreferrer` i indiquen idioma i responsable abans de sortir del portal.

L’analítica diferencia tres conceptes: configuració al domini, proveïdor i beacon detectat en la càrrega actual. `cloudflareWebAnalyticsEnabled` reflecteix l’activació confirmada al tauler de Cloudflare; la detecció DOM continua existint només com a diagnòstic addicional. Això evita mostrar un fals «No configurat» a l’administració.

## Evolució V21

`src/features/environment.js` converteix les concentracions de pol·len en una lectura orientativa per espècie. Les bandes no són un diagnòstic mèdic: serveixen per distingir una presència residual, baixa, moderada, alta o molt alta i sempre mostren la concentració original en grans per metre cúbic. L’estil reutilitza el llenguatge visual dels contaminants sense confondre les dues escales.

`src/features/footer-social.js` és l’únic component que afegeix els accessos oficials a Instagram, Facebook, Bluesky i Telegram. Les adreces viuen a `src/core/config.js`, els enllaços tenen etiqueta accessible, obren una pestanya nova i no introdueixen SDK, píxels ni seguiment de tercers al frontend. El component reutilitza les mateixes icones a la capçalera, al menú lateral i al peu, sense duplicar configuració.

`assets/images/observatori-fontanillas-avatar-v21.png` és l’avatar rodó de 1024 × 1024 px compartit per les capçaleres del portal i els perfils socials. El menú lateral incorpora una targeta contextual superior i un peu propi amb copyright; en pantalles petites el copyright continua al peu general. El peu reserva espai al xat flotant perquè els accessos socials no quedin tapats.

El Worker crea com a màxim un esborrany diari a `social_drafts`, amb fets derivats de l’última observació i una clau de deduplicació. `/admin/status` només retorna booleans de configuració i un resum de la cua; mai les credencials. La publicació queda separada del cron i només existeix sota autenticació administrativa, per a continguts aprovats i amb confirmació explícita.

## Evolució V21.2

`administracio.html` i `src/features/admin.js` converteixen la cua social en un gestor editorial protegit. Els esborranys es poden editar, passar a revisió, aprovar, descartar i restaurar. Aprovar és només una decisió editorial: no executa cap publicació. Els continguts ja publicats queden immutables per evitar correccions accidentals sobre un registre històric.

`worker/index.js` exposa sota `ADMIN_TOKEN` la consulta i actualització de la cua, un diagnòstic de només lectura i una acció de publicació manual per canal. Facebook, Instagram, Bluesky i Telegram poden provar-se per separat; cada publicació exigeix confirmació explícita des del panell. La comprovació prèvia no crea cap publicació.

`social_publications` registra per esborrany i canal l’estat, l’identificador extern, la URL resultant, l’error normalitzat i l’hora de cada intent. Aquest registre no conté credencials. El cron continua cridant exclusivament `createDailySocialDraft()` i no pot aprovar ni publicar. Per tant, no existeix cap camí de publicació automàtica en V21.2.

## Evolució V22.2

La publicació automàtica de V22 manté l’aïllament per canal: una incidència a Instagram o Threads no impedeix que Facebook, Bluesky o Telegram completin el seu enviament. A les 07:45, `runDailyIntegrationPreflight()` valida els comptes i permisos de les sis integracions configurades sense crear contingut. El resultat queda a `monitor_state`, apareix al panell d’administració i genera un correu operatiu si cal intervenir abans de les 08:00.

La invitació d’avisos deixa de competir amb la primera lectura de la portada. El navegador espera deu segons, comprova que la pestanya sigui visible i evita obrir-la si la persona ja està gestionant les preferències. La decisió de l’usuari continua persistint localment i no s’activa cap subscripció sense consentiment explícit.

## Normes de canvi

1. Treballar una sola fita cada vegada.
2. No canviar el Worker, les API, la PWA o els formats de dades si la fita no ho requereix.
3. Mantenir els avisos AEMET/Meteocat visibles i accessibles.
4. Validar enllaços locals, mòduls ES, selectors crítics, manifest i Service Worker abans de lliurar.
5. Actualitzar `CHANGELOG.md` i l’estat de `ROADMAP.md` en cada versió.
