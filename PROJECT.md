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
- `css/`: variables, disseny base i navegació del portal.
- `src/core/`: configuració i utilitats comunes.
- `src/services/`: accés únic als serveis meteorològics.
- `src/modules/`: estació, avisos, predicció, radar, gràfiques, astronomia i altres mòduls.
- `src/features/`: PWA, push, compartir, historial d’avisos, analítica, router del portal, Centre de Dades i Meteo IA.
- `worker/`: Worker actiu i esquema de dades. No modificar-ne els contractes sense migració documentada.

## Fonts i serveis que cal preservar

Estació Fontanillas, Worker propi, Weather Underground, Open-Meteo, AEMET, Meteocat, RainViewer i els ginys meteorològics ja integrats. Les claus i URLs es centralitzen en la configuració existent.

## Navegació V12

Inici, Meteo IA, Estació, Predicció, Cel de dia i de nit, Avisos, Radar, Webcams, Centre de Dades, Comparar, Medi Ambient, Contacte i Metodologia. Escriptori: lateral fi. Mòbil: hamburguesa. La capçalera, l’estat en directe i la identitat visual es preserven.

La capçalera és fixa. La primera secció de cada vista compensa l’altura de la capçalera una sola vegada. Els peus només ofereixen «Tornar amunt» i «Compartir»; la navegació entre àrees pertany al menú lateral o a l’hamburguesa.

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

`src/features/seo.js` centralitza les metadades de les vistes del portal. La fase tècnica de SEO inclou canòniques, descripcions locals, Open Graph, X, Schema.org, sitemap i instruccions de publicació. Search Console i les mètriques de camp només es poden activar després del desplegament.

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

Les preferències push viuen a `src/core/notification-preferences.js`. El navegador transforma fenomen i nivell mínim en etiquetes de OneSignal; el Worker exigeix alhora l’etiqueta de categoria i la del nivell de l’episodi. `INSERT OR IGNORE` continua sent la protecció contra notificacions duplicades. L’activació externa requereix les credencials descrites a `docs/PUSH-ACTIVACIO.md`.

## Normes de canvi

1. Treballar una sola fita cada vegada.
2. No canviar el Worker, les API, la PWA o els formats de dades si la fita no ho requereix.
3. Mantenir els avisos AEMET/Meteocat visibles i accessibles.
4. Validar enllaços locals, mòduls ES, selectors crítics, manifest i Service Worker abans de lliurar.
5. Actualitzar `CHANGELOG.md` i l’estat de `ROADMAP.md` en cada versió.
