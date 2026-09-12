# Changelog

## Correcció — Neteja Cloudflare, webcam accessible i sincronització push · 2026-09-12

- S’ha retirat del compte la integració redundant de Workers Builds `observatori-fontanillas`; el projecte Pages del mateix nom i el Worker productiu `fonta-meteo` continuen actius.
- El nom accessible de la previsualització de la webcam coincideix literalment amb «Webcam · ara» i elimina l’avís detectat per Chrome.
- Les subscripcions push actives es refresquen al registre propi sense reenviar les mateixes etiquetes a OneSignal en cada visita, evitant l’operació redundant que retornava 409. Desar o desactivar preferències continua actualitzant els dos sistemes.
- El diagnòstic segur de YouTube confirma les credencials renovades sense generar ni pujar cap vídeo.
- Web proposada 22.31.5; Worker es manté en 22.29.13. Sense migracions, secrets, publicacions reals ni desplegament automàtic.

## Millora — Auditoria mòbil, càrrega única i diagnòstic segur de YouTube · 2026-09-12

- Una traça mòbil real en producció confirma un LCP de 408 ms i CLS 0,00; les correccions se centren en problemes mesurats, sense reestructurar el portal ni afegir dependències.
- La portada evita una segona càrrega simultània de les dades actuals i de l’històric quan el navegador recupera el focus durant l’arrencada.
- Només es descarrega la webcam visible: s’elimina una petició duplicada de la imatge de 1920 × 830, equivalent a uns 258 kB transferits i 475 kB potencialment evitables segons Chrome.
- Cercador, selector d’idioma, mapa de radar, avís ràpid, botó «Més» i fonts del radar corregeixen els defectes d’accessibilitat detectats; la comprovació local passa de 89 a 100 en accessibilitat.
- `llms.txt` descriu el projecte, les pàgines principals i la separació entre observació, models i avisos oficials.
- Un nou workflow manual permet comprovar les tres credencials OAuth de YouTube sense generar, llegir, programar ni pujar cap vídeo. No té horari automàtic i no s’executa amb aquest canvi.
- Web proposada 22.31.4; Worker es manté en 22.29.13. Sense migracions, secrets, publicacions reals ni desplegament automàtic.

## Correcció — Vigència social i límit de reintents de YouTube · 2026-09-12

- Els episodis de l’estació, resums periòdics, canvis ambientals i efemèrides només es poden reprendre durant el mateix dia local en què es van crear; l’endemà queden aparcats com a esborrany per revisar, sense eliminar l’historial ni tornar-los a publicar.
- YouTube conserva el número d’intent entre Cloudflare i GitHub Actions i admet un màxim de quatre intents per franja. Els estats intermedis `running` i `dispatching` ja no inflen el recompte de fallades.
- El procés de pujada classifica de manera segura els errors OAuth permanents, com `invalid_grant`, sense incloure tokens ni descripcions remotes. En aquest cas, Cloudflare atura immediatament els reintents de la franja i envia com a màxim l’avís operatiu ja previst.
- Tant el disparador principal de Cloudflare com la reserva programada de GitHub respecten el mateix bloqueig. Worker proposat 22.29.13; sense migracions, secrets, canvis d’horari, publicacions reals ni desplegament automàtic.

## Correcció — Conciliació segura dels vídeos de Meta · 2026-09-12

- Facebook consulta l’estat oficial del vídeo abans de reprendre la fase final d’un Reel o una Story després d’una resposta perduda.
- Si la fase de publicació ja consta com a completada, es reutilitza el mateix identificador i no es torna a enviar la petició final; si no hi ha una confirmació inequívoca, es conserva la represa del mateix vídeo sense iniciar una segona pujada.
- Les Stories adopten l’estat coherent `finish_pending` i continuen reconeixent l’antic `finish_failed` per no perdre intents ja desats.
- Les comprovacions i el desplegament de staging actualitzen pnpm Setup a v6 i Wrangler Action a v4, amb runtime Node 24 declarat pels proveïdors.
- Worker proposat 22.29.12. Sense canvis web, migracions, secrets, horaris, publicacions reals ni desplegament automàtic.

## Correcció — Contracte de l’històric a staging · 2026-09-12

- La validació de staging deixa d’exigir a `/history` un camp `ok` que aquesta ruta no exposa i comprova, en canvi, el contracte real: resolució, recompte, observacions i emmagatzematge.
- El recompte ha de coincidir amb la longitud retornada i es mantenen les comprovacions d’ordre temporal, mostres i cobertura quan hi ha dades.
- No canvia el Worker, el web, D1, els secrets ni les automatitzacions; evita un fals error després d’un desplegament correcte a staging.

## Correcció — Auditoria G · SEO, staging i vídeos — 2026-09-12

- Cada vista interna té una URL canònica pròpia i variants `hreflang` en català, castellà, anglès i francès; el sitemap ja inclou les vistes i els quatre idiomes.
- Títols, descripcions, Open Graph i dades estructurades canvien amb la vista i l’idioma. La cobertura del conjunt de dades comença el 4 d’agost de 2026 i no s’inventa una hora d’observació quan falta.
- Les pàgines estàtiques que tenien metadades incompletes incorporen alternances d’idioma i targetes socials. Les etiquetes visibles de versió i els recursos de la PWA queden alineats.
- La validació de staging comprova els contractes `raw`, `hourly` i `daily` de l’històric, inclosos ordre temporal, mostres i cobertura.
- Reels i Stories comparteixen una reserva atòmica per data i franja. Facebook conserva l’identificador, la URL de pujada i la fase del Reel per reprendre el mateix vídeo després d’una fallada sense començar-ne un altre.
- Web proposada 22.31.3, Worker proposat 22.29.11 i PWA `audit-g`. Sense migracions, secrets, publicacions ni desplegament automàtic.

## Correcció — Auditoria F · estadística, vent i temps local — 2026-09-12

- Les mitjanes i desviacions del Centre de Dades i de l’arxiu d’extrems ponderen cada agregat pel seu nombre real de mostres; la interfície separa dies amb dades i continuïtat intradiària.
- La direcció agregada del vent usa mitjana circular: 350° i 10° produeixen nord, mentre que direccions oposades sense orientació dominant queden sense valor.
- Els intervals horaris D1 segueixen hores UTC transcorregudes i conserven les dues hores repetides del canvi de tardor. Dates locals i UTC es reconstrueixen des de l’epoch a `Europe/Madrid` sense reescriure l’arxiu.
- Els temps locals heretats del navegador ja no depenen de la zona del visitant i es descarten durant una hora local inexistent.
- Web proposada 22.31.2, Worker proposat 22.29.10 i PWA `audit-f`. Sense migracions, secrets, publicacions ni desplegament automàtic.
- Es documenta per separat el projecte redundant de Workers Builds que origina checks vermells; no es converteix l’arrel del repositori en recursos públics per ocultar l’error.

## Correcció — Auditoria E · consum D1 i escales gràfiques — 2026-09-12

- L’històric comparteix durant cinc minuts una clau de memòria cau canònica per data i resolució, tant dins del Worker com a Cache API quan està disponible; el marcador `fresh` del navegador ja no força consultes D1 equivalents.
- La memòria cau només desa respostes amb observacions, funciona per centre de dades de Cloudflare i conserva la degradació normal si la memòria cau no està disponible.
- La resposta exposa `X-History-Cache: HIT`, `RUNTIME_HIT` o `MISS` per poder comprovar l’estalvi sense inspeccionar dades ni activar serveis de pagament.
- Els eixos temporals comencen i acaben a la primera i última observació reals. Pluja acumulada (`mm`) i intensitat (`mm/h`) utilitzen escales independents.
- Worker proposat 22.29.9 i PWA `audit-e`. Cap migració, reescriptura històrica, canvi d’horaris ni desplegament automàtic.

## Correcció — Auditoria D · històric i gràfiques — 2026-09-12

- Intervals d’històric corregits a dies de 24 hores; absències preservades en captures futures i agregats, amb recompte de mostres pluviomètriques conegudes.
- Gràfiques sense reserves fictícies, amb eix temporal proporcional i línies tallades als buits. Es conserven els punts i increments rebuts.
- Miniatures sense falsa línia plana quan falta historial; eixos ocults quan no hi ha dades. Llegenda pluviomètrica amb advertiment de parcialitat en quatre idiomes.
- Worker proposat 22.29.8 i PWA `audit-d`. Cap migració ni correcció retroactiva de dades. Proves SQLite, renderitzat i previsualització local; producció pendent de revisió humana.

## Correcció — Auditoria C · cobertura i pluja registrada — 2026-09-12

- Centre de Dades: sense dades pluviomètriques es mostra un guió, no 0 mm. Es preserven els zeros reals i s’indica que les sumes poden ser parcials.
- Dies amb registres separats de l’interval entre dates, amb calendari Europe/Madrid, inclosos canvis d’hora. Dates buides/futures i duplicats no inflen el recompte ni les sumes.
- Els comptadors expressen dies des de l’última pluja registrada, no una ratxa seca demostrada. Sense registre suficient no s’inventa un «Més de».
- La pluja de calendari es calcula amb l’arxiu seleccionat, sense atribuir una lectura actual sense data fiable al dia d’avui. La cobertura anual de pluja exclou dies sense dades pluviomètriques.
- Noves etiquetes en quatre idiomes i comprovació local a 320/360 px. Revisió de memòria cau `audit-c`; cap canvi de Worker, D1 ni automatitzacions.


## Correcció — Auditoria B · cua i reserva social — 2026-09-12

- Reserva atòmica D1 per esborrany i canal, compartida per enviaments manuals i automàtics d’imatges. Un intent incert o en curs no es reenvia.
- Separació entre preparació fallida, resposta incerta i èxit remot no registrat. Els errors definitius es conserven; quatre intents totals per canal.
- Recuperació limitada a deu candidats: retira esgotats i incerts a revisió i continua amb els següents; conserva l’historial i les reserves.
- Panell amb estats llegibles, botons bloquejats i conciliació manual d’un èxit comprovat sense publicació. Controls revisats a 320 i 360 px.
- Threads comprova el contenidor abans d’un únic POST de publicació. L’estat agregat de l’esborrany es calcula amb dades actuals en una sola sentència.
- Worker 22.29.7; sense migracions ni desplegament. Proves noves amb SQLite real i HTTP simulat. Abast i rollback segur a `docs/AUDIT-PACKAGE-B.md`.

## Correcció — Auditoria paquet A · dades i vigència — 2026-09-12

- Conversió numèrica compartida a la primera càrrega, Centre de Dades i calendari astronòmic: null, buits i booleans no es converteixen en zeros; els zeros reals es conserven.
- La primera càrrega no inventa una data actual quan falta l’instant d’observació i marca les lectures de cinc minuts o més com a desades. Les dates sense zona horària es descarten en aquesta via inicial.
- Els recordatoris astronòmics exigeixen tota la graella horària de la finestra, dades vàlides i llindars comprovats abans d’arrodonir. Es diferencien dia i nit, es mostra l’any i es corregeixen els articles dels canvis d’estació.
- Avisos oficials i astronomia: comprovació de vigència abans de publicar i durant recuperació; cap reutilització de text relatiu en un altre dia local. En avisos es comprova també el final de les franges comarcals, no només el final general de l’episodi.
- Un esborrany caducat passa a `draft` per revisió, sense esborrar intents ni identificadors remots. L’enviament manual també el bloqueja mentre la data no sigui vàlida.
- Worker V22.29.6, paquet web V22.31.0 amb revisió de memòria cau `astronomy-v2-audit-a`; es registren explícitament les dues versions a `project.json`. No hi ha migracions ni secrets nous.
- Proves noves dels creadors d’esborranys reals, dades nul·les, buits, duplicats horaris, canvi d’hora, canvi d’any i caducitat. Queden fora d’aquest paquet la reserva concurrent per canal i la recuperació dels intents esgotats.
- Rollback: revertir el canvi i desplegar la versió anterior amb aprovació. Els esborranys aturats continuen a D1 per revisió; no reaprovar-los ni reenviar-los en bloc.


## Millora — Publicacions de canvis d’estació i astronomia — 2026-09-11

- Els equinoccis i solsticis generen una publicació pròpia amb el dia i l’hora oficials, deixant clar que l’instant astronòmic no implica un canvi meteorològic sobtat.
- Els fenòmens anuals confirmats per l’IGN generen un avanç dos dies abans i un recordatori el mateix dia només si la previsió local ofereix una observació raonable.
- La targeta mostra la nit concreta, la font astronòmica i, al recordatori, nuvolositat i probabilitat de pluja. Les dates sense hora anual confirmada continuen al calendari web però no es publiquen automàticament.
- El calendari visible i el Worker comparteixen el mateix catàleg per evitar divergències; la deduplicació D1 i la recuperació per canal s’apliquen també a aquesta família.
- Distribució: Facebook, Instagram, Threads, Bluesky, Telegram i X. TikTok i YouTube continuen reservats als fluxos de vídeo i no reben una imatge estàtica disfressada de vídeo. Rollback: revertir aquest commit; no hi ha migracions ni secrets nous.

## Millora — Evolució tèrmica a les publicacions diàries — 2026-09-11

- Les imatges diàries incorporen una gràfica compacta de la temperatura observada durant les últimes 24 hores, amb punt actual, canvi i mínim i màxim del període.
- Els vídeos diaris mostren el mateix gràfic a la pantalla de dades reals i en dibuixen l’evolució de manera progressiva.
- El text identifica explícitament les dades com a observades perquè no es confonguin amb la predicció meteorològica.
- El resum es calcula una vegada des de l’arxiu D1 i es reutilitza a tots els canals; si no hi ha almenys sis hores vàlides, la composició anterior continua funcionant sense bloquejar cap publicació.
- La millora afecta els recursos compartits per Instagram, Facebook, Threads, Bluesky, Telegram, X, TikTok i YouTube. Rollback: revertir aquest commit; no hi ha migracions ni secrets nous.

## Correcció — Caixa de data dels vídeos diaris — 2026-09-11

- La pastilla superior reserva ara el marge horitzontal real del text i s’adapta a dies i mesos llargs sense que la data en sobresurti.
- L’amplada queda limitada a la zona segura de 928 píxels del format vertical, tant a l’edició del matí com a la del vespre i a totes les pantalles del vídeo.
- S’han afegit proves per a etiquetes curtes, la data «11 de setembre» i textos excepcionalment llargs. Rollback: revertir aquest commit; no modifica dades, secrets ni automatitzacions.

## Correcció — Valors anteriors i canvis sobtats — 2026-09-11

- Les publicacions puntuals d’observació ja no mostren «Valor anterior de l’arxiu: 0,0» quan no existeix cap rècord anterior associat.
- La comparació només apareix als extrems reals de l’arxiu i conserva correctament un zero quan aquest és una dada històrica vàlida.
- Els canvis sobtats de temperatura només generen una publicació a partir d’una diferència de 10,0 °C en aproximadament 24 hores; una variació inferior no l’activa.
- La correcció s’aplica a totes les publicacions esporàdiques de l’estació, no només a les d’índex UV. Rollback: revertir aquest commit; no hi ha migracions ni canvis de secrets.

## Manteniment — GitHub Actions sobre Node 24 — 2026-09-09

- Els workflows utilitzen les versions vigents d’`actions/checkout`, `actions/setup-node` i `actions/upload-artifact`, executades internament sobre Node 24.
- Els scripts del projecte es mantenen en Node 22 LTS; el canvi només elimina la dependència interna obsoleta de les accions de GitHub.
- Els dos fluxos de vídeo desactiven la memòria cau automàtica de paquets perquè no instal·len dependències i gestionen credencials de publicació.
- No canvia cap horari, secret, publicació, Worker ni dada meteorològica. Rollback: revertir aquest commit.

## Correcció — Fiabilitat del cercador municipal — 2026-09-08

- La cerca automàtica i «Buscar» comparteixen les peticions idèntiques en curs; enviar el formulari cancel·la el temporitzador pendent.
- Els dos cercadors descarten resultats obsolets després de canviar el text o l’idioma. La pàgina municipal també invalida la cerca quan se selecciona un resultat.
- Un únic reintent per errors de transport, temps d’espera, JSON truncat o resposta 5xx; sense reintentar 4xx ni límits 429. No desa cerques ni escriu a D1.
- El geocodificador rep el francès quan aquest és l’idioma seleccionat. Renovació de la memòria cau PWA per distribuir el canvi.
- La fallada inicial de Chamonix no s’ha pogut reproduir de manera sostinguda: el proveïdor ha tornat a respondre 200. La correcció resol defectes comprovats de concurrència i tolerància a errors, no atribueix sense proves la incidència a una causa externa concreta.
- Rollback: revertir el commit. Sense canvis al Worker, secrets, automatitzacions ni esquema de dades. Producció pendent de revisió i desplegament autoritzat.

## Correcció — Vigència destacada a les imatges d’avisos — 2026-09-07

- Les imatges `official_alert` mostren «PREVIST PER» i el dia complet abans del fenomen i del mapa, amb «NO ÉS PER AVUI» només quan el dia afectat és posterior al de creació de la publicació. La data de publicació acompanya aquesta indicació perquè sigui interpretable quan es comparteix més endavant.
- La data comarcal també encapçala el cos del missatge. Els esborranys antics poden recuperar-la de les franges; mai es dedueix de l’inici general de l’episodi ni de la data actual. Si falta una data comarcal vàlida, no es crea una publicació automàtica nova.
- La llegenda del mapa es refereix al dia indicat. Nova versió de la memòria cau només per a targetes d’avisos, sense reutilitzar imatges del format anterior ni modificar les altres famílies.
- Verificació: 59 fitxers de proves, dry-run del Worker i previsualització local de 1080 × 1350 sense solapaments. No modifica publicacions ja enviades; requereix merge i desplegament. Rollback: revertir el commit, sense migració D1.

## Correcció — Data visible als avisos socials futurs — 2026-09-07

- Les notificacions socials de Meteocat indiquen al començament si l’avís és per avui, demà o una data posterior, amb el dia de la setmana i la data visibles al títol.
- Quan l’avís encara no ha començat, el text aclareix que és una previsió oficial futura i que no descriu el temps actual.
- La data es pren del dia concret de l’evolució comarcal del Vallès Oriental, no de l’inici general de l’episodi, que pot començar abans en altres zones.

## Correcció — Capçalera mòbil en una sola fila — 2026-09-07

- L’hora redundant desapareix de la capçalera mòbil i només es conserva el punt verd que indica l’estat en directe.
- Menú, estat, cerca, idioma, Instagram, YouTube, TikTok i «Segueix-nos» comparteixen una única fila compacta, sense perdre les zones tàctils de 44 píxels.

## Correcció — Xarxes visibles en mòbil — 2026-09-07

- Instagram, YouTube i TikTok tornen a ser visibles directament a la capçalera mòbil en una franja pròpia, sense competir amb el menú, el rellotge, la cerca ni l’idioma.
- El desplegable «Segueix-nos» es conserva per donar accés a la resta de xarxes, i tots quatre controls mantenen una zona tàctil de 44 píxels.

## Correcció — Auditoria mòbil de navegació i llarg termini — 2026-09-07

- La predicció mensual respecta de nou el botó per desplegar els mesos següents; el contingut tancat ja no queda visible ni allarga innecessàriament la pàgina.
- Els mapes estacionals poden encongir-se dins la pantalla i ja no forcen una amplada d’escriptori en dispositius mòbils.
- El cercador i el selector d’idioma conserven sempre el text català com a font, de manera que es pot canviar consecutivament entre català, castellà, anglès i francès sense barrejar traduccions.
- En mòbil, els accessos socials s’agrupen en un únic control i els botons principals de capçalera, predicció, radar i Centre de Dades tenen una zona tàctil mínima de 44 píxels.
- La selecció inicial de pàgina passa a un fitxer propi permès per la política de seguretat, eliminant l’error CSP sense relaxar la protecció contra scripts en línia.
- La PWA renova la memòria cau i incorpora el nou inicialitzador perquè les correccions arribin també a les instal·lacions existents.

## Propera versió — Episodis automàtics de models — 2026-09-07

- Nova detecció automàtica de canvis destacats de temperatura, pluja, tempesta o vent a cinc dies vista, només quan coincideixen almenys dos dels models ECMWF, GFS i ICON.
- Cada episodi crea com a màxim una peça per fenomen i dia, amb un límit de dues peces en set dies per evitar alarmisme i saturació.
- Nou vídeo vertical de 18 segons amb text editorial en català, comparació dels models i quatre fotogrames horaris generats amb dades territorials reals del model coincident.
- La peça identifica sempre la font, el grau de coincidència i que es tracta d’una predicció de models, no d’un avís oficial.
- El flux desa una previsualització durant catorze dies, conserva el vídeo en un bucket privat i pot distribuir-lo a YouTube, Instagram, Facebook, TikTok i X sense duplicar canals ja completats.
- La creació d’esborranys, el vídeo i la publicació tenen tres interruptors independents, desactivats per defecte perquè la primera peça real es pugui revisar abans d’activar la publicació completa.

## Propera versió — Rècords de tot l’arxiu — 2026-09-07

- Nova secció «Rècords de l’Observatori» calculada sobre tot l’arxiu D1 disponible, independentment del selector d’un any del Centre de Dades.
- Cada extrem mostra el valor, la data, l’hora i l’antiguitat; el dia més plujós s’identifica explícitament com una acumulació del dia complet.
- El resum d’Estació presenta els sis rècords principals i el Centre de Dades conserva la taula completa de temperatura, vent, pluja, pressió, humitat, radiació i UV.
- La portada incorpora un accés directe als rècords i totes les vistes indiquen des de quina data hi ha arxiu, sense confondre aquests valors amb rècords climàtics oficials.
- El Worker calcula els extrems amb consultes agregades i conserva el resultat durant una hora a memòria i a la memòria cau de Cloudflare; no envia tot l’històric al navegador ni repeteix el càlcul a cada visita.
- Les màximes i mínimes d’humitat exigeixen un rang local plausible i una lectura veïna coherent: així una errada puntual o un bloc invàlid del sensor no es converteix en un rècord permanent, sense esborrar dades de l’arxiu.
- Els textos i les dates s’adapten al català, castellà, anglès i francès, i la PWA estrena una memòria cau pròpia.

## Propera versió — Centre de Dades per apartats — 2026-09-07

- El Centre de Dades s’organitza en cinc pestanyes: Resum, Gràfiques, Pluja, Episodis i Qualitat, conservant tot el contingut existent però evitant una pàgina única excessivament llarga.
- El selector de període continua governant el resum, les gràfiques, els extrems i les descàrregues encara que aquests continguts estiguin distribuïts entre pestanyes.
- L’acumulació de pluja anual mostra al mateix lloc l’interval cobert i quants dies contenen dades; ja no es pot interpretar com si representés necessàriament un any complet.
- La navegació per pestanyes admet teclat, conserva un enllaç compartible i reactiva les gràfiques quan es fan visibles.
- Els blocs compartits amb la pàgina Estació continuen visibles allí i les pestanyes només reorganitzen el Centre de Dades.
- Els controls nous disposen de traducció en català, castellà, anglès i francès, i la PWA utilitza una memòria cau nova.

## Propera versió — Bloc 1 de fiabilitat i lectura — 2026-09-07

- Els avisos queden separats entre vigents ara, previstos per a més tard avui, demà i dies posteriors; el recompte principal ja no barreja avisos futurs amb avisos actius.
- Cada avís mostra organisme, inici i final, i l’historial agrupa les actualitzacions solapades d’un mateix fenomen i organisme en un únic episodi sense perdre el nivell màxim.
- La verificació de la previsió contextualitza l’encert de pluja amb la composició real de la mostra, incorpora una comparació visual entre previsió i observació i explica l’índex Brier amb un exemple desplegable.
- La comparativa identifica les estacions amb l’identificador de Weather Underground i l’altitud quan la font la facilita; la pressió queda marcada com a orientativa si no consta una correcció comuna al nivell del mar.
- Les mesures de l’estació s’ordenen per temperatura i confort, vent i pluja, i sol i atmosfera, amb ajudes breus i l’Humidex presentat de manera coherent com a índex.
- El radar mostra l’hora exacta del fotograma, una llegenda d’intensitat i un control per tornar a Sant Celoni, i evita mostrar alhora un estat carregat i un missatge de càrrega.
- La secció astronòmica prioritza aquesta nit, calcula una finestra orientativa favorable i corregeix la qualificació de l’altura solar: 10,4° es considera sol baix, no sol alt.
- Els textos estàtics nous disposen de versions en català, castellà, anglès i francès, i la PWA estrena una memòria cau pròpia per aplicar els canvis sense conservar interfícies antigues.

## Correcció — Màxima i mínima del dia — 2026-09-06

- L’històric de l’estació es consulta des del mateix domini del portal, evitant que bloquejadors de contingut impedeixin recuperar les màximes i mínimes reals i forcin l’ús de dades antigues.
- El proxy conserva l’origen autoritzat del portal perquè el Worker combini també les lectures recents de D1, en lloc de retornar només l’arxiu parcial de Weather Underground.
- El Worker compartit de OneSignal referencia una versió explícita de la PWA, de manera que els navegadors instal·len la correcció immediatament i deixen d’executar el lector d’històric anterior.
- La lectura en directe participa sempre en el càlcul de la màxima i la mínima diàries, encara que l’històric remot arribi amb retard.
- La portada i el resum del dia ja no poden mostrar una màxima inferior a la temperatura actual ni una mínima superior, i associen l’hora correcta a l’extrem.
- Els extrems vistos pel navegador es conserven durant el dia i es combinen amb l’arxiu remot; una baixada posterior de temperatura ja no pot esborrar la màxima anterior.
- Les consultes de l’històric incorporen una renovació controlada i la PWA estrena una memòria cau nova per evitar respostes antigues després del desplegament.

## Propera versió — Portada, risc i llarg termini — 2026-09-05

- La predicció de sis setmanes i els mapes mensuals del Meteocat passen a una pàgina pròpia de llarg termini, amb enllaços d’anada i tornada des de la previsió operativa; no s’elimina cap contingut.
- La portada dona més pes als avisos oficials i hi mostra fenomen i vigència, a més del nivell, evitant resums meteorològics que puguin confondre estabilitat amb absència de risc.
- Afegida una entrada directa per desar municipis i configurar notificacions, mantenint aquestes preferències només al navegador de l’usuari.
- Clarificada la diferència entre temperatura, sensació tèrmica i Humidex, que ara es presenta correctament com a índex complementari de xafogor.
- La capçalera prioritza Instagram, YouTube i TikTok i agrupa la resta de canals sota «Segueix-nos».
- Els textos nous disposen de versions en català, castellà, anglès i francès, i la nova vista incorpora metadades pròpies.

## Propera versió — Mapes mensuals Meteocat — 2026-09-03

- Afegits a la secció de predicció els mapes oficials del Meteocat d’anomalia mensual de temperatura i precipitació, amb autoria, enllaç al portal i avís de limitacions.
- La predicció mensual mostra el mes actual per defecte i permet desplegar els tres horitzons següents amb un control «+», també traduït als quatre idiomes.

## Propera versió — Municipis, resum setmanal i SEO multilingüe — 2026-09-02

- Afegit a la portada un resum visual dels pròxims set dies, amb màximes, mínimes, probabilitat de pluja, ratxes i una lectura editorial separada de qualsevol avís oficial.
- La publicació social setmanal queda documentada com a família periòdica dels dilluns, amb deduplicació, cobertura mínima i distribució independent pels canals socials configurats.
- Les pàgines de municipis generen títol, descripció, canonical i dades estructurades específiques quan se selecciona una localitat, incloent-hi l’idioma triat.
- Afegides alternatives `hreflang` i entrades de sitemap per a català, castellà, anglès i francès a les pàgines públiques principals.

## V22.31.0 — Francès i col·laboracions tècniques — 2026-09-01

- Afegit el francès al selector d’idioma, als textos meteorològics dinàmics i a la configuració regional de dates i xifres.
- Auditoria automàtica del catàleg: cap frase registrada queda sense versió en castellà, anglès o francès.
- Nova pàgina pública de col·laboracions amb atribució visible, independència editorial i estat dels patrocinis declarat.
- Preparats dossiers professionals en castellà i anglès, en format editable i PDF, per proposar cessió o préstec de material.
- Preparats sis correus personalitzats per Bresser Iberia, Ecowitt, WeatherFlow–Tempest, Ambient Weather, Davis Instruments i Netatmo.
- La proposta inclou Instagram, Facebook, TikTok, YouTube i X, amb presentació inicial, actualitzacions periòdiques pactades i una peça final, sempre identificades com a col·laboració.
- La nova pàgina i el catàleg francès formen part de la PWA i del mapa del web.

## V22.30.1 — Traducció dinàmica i capçalera mòbil compacta — 2026-09-01

- Els textos que s’actualitzen quan arriben les dades meteorològiques conserven l’idioma triat, inclosos la lectura ràpida, l’estat dels avisos, les mètriques principals i les hores dels extrems.
- Els nombres, les hores i els punts cardinals utilitzen també la configuració regional de català, castellà o anglès.
- En mòbil, la pastilla d’estat mostra només el punt animat i l’hora; s’elimina «En directe» per guanyar espai a la capçalera.
- El prefix horari de màxima i mínima deixa de generar-se amb CSS i passa a ser text localitzat, evitant fragments fixos en català.

## V22.30.0 — Idiomes i cerca municipal global — 2026-09-01

- La capçalera incorpora una cerca de municipis basada en el mateix geocodificador d’«El temps arreu», amb suggeriments, navegació per teclat i selecció directa de la localitat.
- En seleccionar un resultat s’obre «El temps arreu» amb el municipi i les coordenades a l’URL, i la previsió corresponent es carrega automàticament.
- Nou selector propi de català, castellà i anglès, sense serveis externs de traducció, amb preferència desada només al navegador.
- La navegació, la capçalera, les presentacions principals i la cerca adapten els textos a l’idioma triat; les xifres i dates municipals utilitzen també la configuració regional corresponent.
- La cerca es mostra completa en escriptori i es converteix en un control compacte que s’expandeix a pantalla completa en mòbil, sense desplaçar les xarxes socials ni el menú.

## V22.29.2 — Vídeos socials nítids i titulars dins la zona segura — 2026-08-31

- Els titulars sense símbol meteorològic utilitzen un límit més conservador i «Ara mateix, dades reals» queda en dues línies completes dins del format vertical.
- Les pantalles es rasteritzen internament a 2160 × 3840 abans de reduir el vídeo final a 1080 × 1920, millorant vores, logotip i tipografia.
- El MP4 final passa d’un bitrate variable baix a H.264 High a 5 Mb/s constants, color BT.709 i fotogrames clau regulars perquè Stories, Reels, TikTok i YouTube disposin d’un original més resistent a la recompressió.

## V22.29.1 — Contrast del cercle de verificació — 2026-08-31

- El recompte i el text del cercle de predicció vs realitat utilitzen colors d’alt contrast, més pes i més amplada útil tant mentre es recullen dades com quan la mostra ja està disponible.

## V22.29.0 — Context temporal i quota oficial de Meteocat — 2026-08-31

- Totes les escenes dels vídeos del matí i del vespre mostren l’edició i la data completa de generació dins la zona segura de la imatge.
- Les etiquetes relatives «avui», «demà» i «demà passat» incorporen també el dia de la setmana, el dia del mes i el mes de la predicció.
- L’escena d’observació conserva la data i afegeix explícitament l’hora de lectura; els títols i la descripció de YouTube identifiquen també la data prevista.
- Les consultes d’avisos SMP de Meteocat queden limitades persistentment a les 06:30, 12:30 i 18:30: dues consultes del dia actual i una de l’endemà, amb un màxim planificat de 93 sobre les 100 mensuals disponibles.
- Cada franja es reclama una sola vegada a D1, fins i tot si el cron es repeteix o el Worker canvia d’instància; una fallada no provoca reintents que gastin més quota.
- L’administració mostra les consultes registrades pel Worker, el límit mensual i el màxim planificat sense exposar l’API Key.

## V22.28.1 — Imatges públiques i reintents segurs d’X — 2026-08-31

- Les targetes socials accepten `GET` i `HEAD`, de manera que Buffer pot validar-les com a imatges públiques abans de publicar-les a X.
- La publicació del migdia materialitza primer el PNG a R2 i reutilitza la mateixa URL estable durant tot el procés.
- Si Buffer crea una entrada però la marca amb error, el Worker conserva l’identificador remot i atura els reintents que abans omplien la cua amb duplicats.
- La diagnosi conserva el tipus de resposta, l’identificador remot i l’estat retornat per facilitar la recuperació sense afectar la resta de xarxes.

## V22.28.0 — Publicacions periòdiques i episodis destacats — 2026-08-31

- Preparats resums setmanals, mensuals, estacionals i anuals amb cobertura mínima de dades, extrems, pluja, vent, UV i verificació de la previsió de l’endemà.
- Afegits episodis puntuals de pluja intensa, vent, calor, glaçada, UV, canvis bruscos i nous extrems de l’arxiu local, amb límits diaris, períodes de descans i textos que no els confonen amb avisos oficials.
- Integrats l’estat oficial de sequera de l’ACA, la previsió de pols del servei CAMS Europe i la tendència estacional ECMWF, sempre amb font, resolució i limitacions visibles.
- Afegides efemèrides meteorològiques verificades procedents de la biblioteca existent del portal.
- Cada família disposa d’un interruptor independent, deduplicació a D1, fins a quatre intents per canal i estat operatiu consultable des de l’administració. Totes les funcions noves queden desactivades per defecte.
- Incorporades targetes verticals pròpies i proves de calendari, llindars, prudència editorial i regressió del Worker.

## V22.27.0 — Evolució territorial de la pluja als vídeos — 2026-08-30

- Els Shorts, Reels i vídeos de TikTok i X incorporen una sisena escena animada amb quatre franges horàries de precipitació sobre el nord-est de Catalunya i Sant Celoni remarcat.
- La font principal és AROME France HD, amb una graella de 64 punts, límits comarcals oficials de l'ICGC, escala en mm/h i textos que separen clarament estimació del model i observació real.
- Si AROME no respon, el generador prova Open-Meteo Best Match i, com a darrera reserva, mostra l'evolució puntual de Sant Celoni sense inventar una distribució territorial.
- El vídeo passa de 25 a 30 segons, conserva les cinc pantalles existents i amplia la música original, el muntatge i les proves per cobrir els quatre fotogrames nous.

## V22.26.0 — Mapa comarcal dels avisos de Meteocat — 2026-08-30

- Les publicacions d'avisos incorporen un mapa de Catalunya amb totes les comarques afectades i el nivell màxim vigent de cadascuna, construït amb dades SMP de Meteocat i límits oficials de l'ICGC.
- El Vallès Oriental queda remarcat i el text inferior explica de manera específica l'abast comarcal per a Sant Celoni, sense afirmar una afectació uniforme a tot el municipi.
- La capçalera, els textos, les etiquetes i el peu identifiquen exclusivament Meteocat; els avisos d'AEMET continuen disponibles per al web i les notificacions, però no generen publicacions socials automàtiques.

## V22.25.1 — Avisos grocs de Meteocat — 2026-08-30

- L'automatització incorpora també els avisos grocs vigents del Vallès Oriental, mantenint el filtre comarcal, les franges en hora local i la deduplicació.
- Les targetes i els textos diferencien explícitament GROC, TARONJA i VERMELL; cap avís groc es pot presentar erròniament com a taronja.
- El paràmetre passa a dir-se `METEOCAT_ALERT_SOCIAL_ENABLED`; el nom anterior es manté com a compatibilitat perquè cap entorn quedi desactivat durant la transició.

## V22.25.0 — Avisos severs de Meteocat — 2026-08-30

- El Worker consulta l'API oficial de Situacions Meteorològiques de Perill per avui i els dos dies següents, amb memòria cau de quinze minuts.
- Només prepara i publica avisos vigents taronja o vermell del Vallès Oriental (codi oficial 41); ignora grocs, altres comarques i esborranys.
- El text identifica Sant Celoni com a municipi de la comarca, manté la distribució local/extensa/general i les franges oficials de sis hores, i evita afirmar una afectació municipal que Meteocat no concreti.
- Cada combinació de fenomen, nivell, dia, llindar i franges queda deduplicada a D1. La funció roman inactiva si falta el secret `METEOCAT_API_KEY`.
- Si un canal falla, el Worker recupera només els canals pendents al cicle següent, amb un màxim de quatre intents i sense repetir els que ja han publicat.

## V22.24.0 — Directori social i publicació de presentació — 2026-08-30

- Nova pàgina pública `xarxes.html` amb els nou canals oficials i enllaços directes, pensada també com a destinació única des d’Instagram.
- Nova creativitat vertical de 1080 × 1350 px amb la identitat de l’Observatori, les nou xarxes i una crida clara al directori.
- Directori incorporat al sitemap i a la memòria cau de la PWA.

## V22.23.1 — Símbols meteorològics equilibrats — 2026-08-30

- Normalitzats tots els símbols dins un marc quadrat de 360 × 360 per evitar que el sol sembli petit o que els núvols quedin massa amples i baixos.
- Unificats centre, escala, proporció i cantonades del marc en les pantalles principals, la tendència de tres dies i la targeta del migdia.
- Afegides proves per protegir el quadrat i la proporció dels fenòmens meteorològics.

## V22.23.0 — Publicacions meteorològiques dinàmiques — 2026-08-30

- Eliminat el núvol fix dels Shorts i Reels: cada predicció mostra ara un símbol vectorial propi per cel serè, núvols, boira, pluja, neu, ruixats o tempesta.
- Separades visualment les dades observades de la predicció; la pantalla «Ara mateix» no mostra cap símbol de temps futur.
- Redissenyades les cinc pantalles amb jerarquia, colors per fenomen, consells útils, tendència de tres dies i textos protegits contra solapaments.
- Afegits moviment subtil i transicions suaus al vídeo de 25 segons, verificats amb una renderització completa local.
- Adaptats els textos de Facebook, Instagram, TikTok i X a la previsió real de la franja, mantenint els límits de cada plataforma.
- Afegit el símbol de la predicció d’avui a la targeta del migdia i proves de regressió per protegir la nova qualitat visual.

## V22.22.2 — Xarxes ordenades per prioritat — 2026-08-29

- Reordenats els accessos socials d’escriptori, peu i desplegable mòbil segons l’ús actual del projecte i la popularitat: Instagram, YouTube, TikTok, Facebook, X, WhatsApp, Threads, Telegram i Bluesky.
- Mantinguts Instagram, TikTok i YouTube com els tres accessos directes de la capçalera en mòbils petits.
- Afegida una prova de regressió que protegeix l’ordre acordat de les nou xarxes.

## V22.22.1 — Desplegable social mòbil complet — 2026-08-29

- Corregida una regla antiga que amagava, també dins del desplegable, les xarxes situades després de la quarta opció.
- El menú mòbil torna a oferir les nou xarxes configurades, mentre la capçalera conserva només Instagram, TikTok i YouTube com a accessos directes.
- Afegida una prova de regressió que diferencia les icones directes dels enllaços interiors del desplegable.

## V22.22.0 — X torna a la navegació social — 2026-08-29

- Recuperat l’accés a `@meteo_fonta` amb la icona oficial d’X a les agrupacions socials d’escriptori, el peu i el menú complet de mòbil.
- La capçalera en mòbils petits mostra directament Instagram, TikTok i YouTube; X, Facebook, Threads i la resta queden disponibles al desplegable per evitar saturar-la.
- Afegit el perfil d’X a les dades estructurades de l’organització perquè els cercadors el puguin associar correctament amb Meteo Fontanillas.
- Afegides proves de regressió per protegir l’enllaç, la icona, la disposició mòbil i el SEO.

## V22.21.0 — X automatitzat amb Buffer — 2026-08-29

- X publica automàticament el vídeo del matí a les 07:00, la targeta meteorològica a les 14:00 i el vídeo del vespre a les 20:30, cadascun amb text específic i límit segur de 280 caràcters.
- El Worker conserva l’identificador de Buffer, comprova l’estat real després de l’hora prevista i evita crear una segona publicació si la primera ja està programada o enviada.
- Les franges es recuperen cada cinc minuts durant un màxim de 90 minuts, amb fins a quatre intents i un únic correu només si tots fallen.
- L’administració mostra la connexió d’X, el darrer estat operatiu i l’inclou en la comprovació segura de xarxes sense publicar res.

## Correcció de fonts audiovisuals — 2026-08-29

- 3Cat passa a ser un accés extern directe a «El temps» de 3CatInfo, com AEMET, perquè el seu reproductor incrustat no completa la càrrega de manera fiable.
- La vista deixa de consultar i preparar el reproductor de 3Cat, reduint JavaScript, peticions i possibles bloquejos; Meteocat continua disponible sota demanda dins la web.

## En desenvolupament

- AEMET torna a ser visible a la predicció audiovisual com a accés oficial, sense presentar-lo erròniament com un vídeo diari.
- Les targetes de Meteocat i 3Cat creen un reproductor nou a cada selecció, mostren una càrrega inequívoca i porten l’usuari fins al vídeo.

- Afegida sota la predicció audiovisual una guia de sis fonts mundials diferenciades per funció: previsió oficial de l’OMM, previsions globals de Yr i Met Office, mapes d’ECMWF i comparadors Windy i meteoblue.
- La guia explica que cap model és universalment millor i prioritza sempre el servei meteorològic oficial del territori per a avisos i decisions de seguretat.
- La biblioteca educativa incorpora recursos actuals del Met Office i UCAR, i tres reptes pràctics que filtren directament materials de núvols, predicció o dades.

- Afegida una secció de predicció en vídeo amb Meteocat i el darrer vídeo meteorològic disponible de 3Cat, tots dos reproduïbles dins la web.
- AEMET es manté als apartats oficials de previsió i avisos, però es retira del visor audiovisual perquè el seu canal no publica una predicció diària i podia mostrar contingut no relacionat.
- Els reproductors externs només es carreguen quan l’usuari escull una font, evitant reproducció automàtica i connexions innecessàries amb tercers.
- La descoberta de 3Cat queda limitada, memoritzada i tolerant a errors: si la seva pàgina canvia o no hi ha vídeo recent, Meteocat continua disponible.

- Si una execució de YouTube falla després d'haver reservat la franja, GitHub ho comunica al Worker i Cloudflare la torna a intentar dins de la finestra segura, sense duplicar un Short ja completat.
- La recuperació de YouTube s'allarga fins als últims cinc minuts útils abans de publicar; els errors o cancel·lacions que deixin una execució penjada també poden recuperar-se quan expira el bloqueig temporal.
- TikTok ja no depèn d'una única crida de GitHub a Buffer: el programador de cinc minuts detecta el MP4 preparat i reintenta la programació pendent, reutilitzant l'identificador existent si Buffer ja l'havia acceptat.

- La franja matinal de totes les xarxes passa a les 07:00; el Short es prepara a les 06:20 i la comprovació preventiva social queda a les 06:45.
- Facebook i Instagram deixen de duplicar la targeta meteorològica amb el vídeo: al matí i al vespre publiquen només Reel + Story, mentre que al migdia conserven la imatge.
- Bluesky, Telegram i Threads mantenen les tres publicacions d’imatge diàries; YouTube i TikTok mantenen els dos vídeos, amb el del matí a les 07:00.

- Preparada l’automatització dels vídeos de Meta a les 07:00 i les 20:30: primer publica i confirma els Reels d’Instagram i Facebook, i només després inicia les Stories dels dos canals.
- Els contenidors d’Instagram pendents es reprenen al següent cicle de cinc minuts; Facebook i qualsevol canal ja completat es reutilitzen sense duplicar publicacions.
- Els errors definitius queden limitats a quatre intents automàtics, es registren al panell i generen un únic correu operatiu. La prova manual continua disponible com a recuperació controlada.

- Preparada una prova manual i protegida de Stories d’Instagram i Facebook amb el mateix vídeo vertical del Reel. Cada franja queda deduplicada i els canals ja publicats no es repeteixen en un reintent parcial.
- Instagram conserva el contenidor mentre Meta processa el vídeo; Facebook conserva la sessió i la fase de pujada per reprendre una resposta interrompuda sense començar una Story nova.
- La prova visual d’Instagram i Facebook s’ha completat correctament i permet activar el flux automàtic encadenat després dels Reels.

- La confirmació dels Shorts valida ara l'estat que YouTube retorna en completar la mateixa pujada, sense fer una consulta posterior que exigia permisos de lectura addicionals.
- Això evita marcar com a fallit —i arriscar un duplicat en reintentar— un vídeo que YouTube ja havia acceptat i programat correctament.
- La validació final de la pujada comparteix el marge mínim real de cinc minuts amb el planificador, evitant que la recuperació tardana passi el primer control però falli al segon.

- «Predicció vs realitat» calcula ara els indicadors principals només amb pronòstics de l’endemà guardats el dia anterior, sense barrejar actualitzacions del mateix dia ni horitzons de fins a set dies.
- La mostra informa quants casos corresponen a dies plujosos o secs, identifica les fonts i els llindars de pluja, i diferencia explícitament les comparacions secundàries per horitzó.
- La taula es descriu com a pronòstics de demà verificats i incorpora una indicació de desplaçament lateral en mòbil.

- Afegida una comprovació segura del permís `Actions: Write` del token que connecta Cloudflare amb GitHub: usa una referència deliberadament inexistent i, per tant, no inicia cap workflow ni crea cap vídeo.
- El diagnòstic manual d’automatitzacions valida ara tant el canal TikTok de Buffer com el disparador principal de YouTube.

- Auditoria reforçada de Buffer/TikTok: la comprovació de connexió valida ara el canal real de Buffer sense publicar, i queda disponible també com a flux manual independent de GitHub Actions.
- Els esborranys de prova ja no inclouen una hora passada; les publicacions reals exigeixen cinc minuts de marge, es registren al panell i envien un correu operatiu si Buffer falla.
- La còpia temporal del vídeo ha d’haver pujat correctament abans de programar TikTok. Una fallada de Buffer queda visible a GitHub sense impedir que Cloudflare confirmi una pujada de YouTube que sí hagi acabat, evitant reintents i duplicats del Short.

- Preparada la cua de TikTok mitjançant Buffer: el Short només es traspassa després que YouTube confirmi la seva pujada i conserva l’hora pública de cada franja.
- El vídeo continua en un bucket R2 privat; Buffer rep una URL opaca i limitada al fitxer temporal, estable mentre dura la cua i eliminada amb la neteja de tres dies.
- Afegida al panell una prova segura que crea un esborrany a Buffer, sense publicar-lo. La cua automàtica roman desactivada fins que es validi aquesta prova i s’activi explícitament el paràmetre corresponent.

- Cloudflare passa a ser el rellotge principal dels YouTube Shorts i inicia les preparacions a les 06:20 i les 19:45, en hora de Sant Celoni. GitHub conserva una reserva posterior compatible amb l’horari d’estiu i d’hivern.
- Si GitHub accepta el disparador però no confirma l’inici, Cloudflare el repeteix al cap de vuit minuts sense duplicar el renderitzat.
- El Worker registra l’estat específic del planificador de Shorts i envia un correu operatiu si falta el token o GitHub rebutja el disparador.
- Després de la pujada, el flux consulta YouTube i només acaba correctament si confirma l’ID, la privacitat i, quan correspon, l’hora pública de les 07:00 o les 20:30.
- L’administració mostra l’horari de preparació de YouTube i el resultat real del darrer disparador, separat de la simple presència de credencials.

- Avançades les dues execucions de YouTube Shorts perquè GitHub Actions tingui més marge davant retards del planificador; les publicacions públiques queden a les 07:00 i les 20:30 i es manté la recuperació alternativa del Worker.

- Els avisos push ja no depenen només de la propagació d’etiquetes d’OneSignal: cada dispositiu subscrit desa de forma verificable les seves preferències de fenomen i intensitat al registre tècnic del portal. Els avisos automàtics prioritzen aquest registre, especialment per a PWA d’iPhone.

- Corregit el flux manual de Reels de Meta: Facebook inicialitza la sessió, transfereix la URL temporal al servidor de pujada i només després finalitza la publicació. Instagram conserva el contenidor pendent i la mateixa prova el reprèn un minut més tard, sense crear duplicats mentre Meta processa el vídeo.

- Preparada una prova manual i única de Reels d’Instagram i Facebook des de l’administració. Reutilitza el MP4 privat del Short mitjançant una URL signada d’una hora, registra el resultat per franja i no activa cap publicació automàtica fins que es validin les dues plataformes.

- «El temps arreu» prepara una cerca de fins a quatre webcams properes per coordenades. Les miniatures es carreguen sota demanda, no reprodueixen vídeo automàticament i no es desen; per activar la cobertura mundial cal afegir el secret de Cloudflare `WINDY_WEBCAMS_API_KEY`.

- La programació dels Shorts admet ara cinc minuts de marge: l’execució real de les 20:24 podia acabar el renderitzat i la pujada, però el llindar anterior de quinze minuts la descartava sense necessitat.
- Abans d’enviar una imatge a Facebook, Instagram o Threads, el Worker genera i desa temporalment la targeta PNG/JPEG a R2. Meta rep així una imatge ja materialitzada, no una captura sota demanda que pugui respondre tard o amb un tipus invàlid.
- Les targetes temporals s’eliminen al cap de tres dies; una edició del contingut invalida les dues variants per evitar reutilitzar una imatge antiga.
- El registre editorial de l’administració es pagina de sis en sis i conserva el filtre actiu.
- Les publicacions publicades o descartades queden plegades fins que se’n demana el detall, sense eliminar-ne l’historial ni els resultats per canal.

## Recuperació independent dels Shorts — 2026-08-26

- El Worker comprova les franges de Shorts a les 06:40 i 18:40 de Sant Celoni i, si GitHub no ha iniciat el flux, el dispara per l'API amb una única execució per franja.
- La coordinació amb D1 evita vídeos duplicats entre el cron de GitHub, el disparador alternatiu i les recuperacions manuals.
- El mecanisme roman desactivat fins que Cloudflare rep el secret `GITHUB_SHORTS_DISPATCH_TOKEN`; cal un token restringit només al repositori amb permís «Actions: Write».

## Shorts amb dades més recents — 2026-08-26

- La preparació automàtica dels dos Shorts diaris queda a les 04:17 i 16:47 UTC, lluny de l'inici de l'hora però a menys de dues hores de les publicacions de les 08:00 i 20:30 locals.
- L'execució manual permet escollir `mati` o `vespre` i programar la publicació només si encara queda marge: és una recuperació segura si GitHub no ha iniciat un cron.
- El vídeo continua pujant-se privat a YouTube; la visibilitat pública es conserva a l'hora local prevista.
- Facebook i Instagram no s'activen encara per als vídeos: queda pendent una prova real de Reels amb els permisos de Meta, sense publicar cap Short accidentalment.

## Alertes de publicació social — 2026-08-26

- Un error temporal d’un canal queda registrat i es reintenta automàticament, però el correu d’alerta només s’envia si el canal continua fallant després de quatre intents. Així una recuperació correcta no genera una alarma definitiva.

## Higiene del sitemap — 2026-08-26

- Actualitzades les dates `lastmod` de la portada i de «El temps arreu» perquè reflecteixin els canvis públics recents sense introduir URLs duplicades.
## Correcció de municipis desats — 2026-08-26

- Quan s’obre un municipi ja desat en aquest navegador, el botó mostra des del primer moment «★ Desat» i permet retirar-lo sense un clic intermedi enganyós.

## Millores d’anàlisi i consulta local — 2026-08-26

- El Centre de Dades compara les últimes 24 hores amb les 24 anteriors, separant temperatura mitjana i pluja observada.
- «El temps arreu» permet desar fins a sis municipis en aquest navegador; aquesta preferència no s’envia al Worker.

## Correcció urgent de la targeta social — 2026-08-26

- Eliminada la comprovació interna que feia el Worker contra la seva pròpia URL pública abans d’enviar la targeta a Meta: Cloudflare la podia tractar com un bucle i respondre 404.
- Facebook, Instagram i Threads reben directament la URL signada de la targeta, que Meta descarrega des de fora del Worker.

## Vídeos socials temporals — Preparació segura

- Creat un bucket R2 privat europeu per als vídeos temporals de Shorts, sense domini ni accés públic.
- El Worker només accepta MP4 amb una clau prevista, autenticació separada per pujar-los i un màxim de 30 MB.
- Els vídeos només es poden recuperar amb una URL signada, d’un màxim d’una hora, i el manteniment elimina els fitxers amb més de tres dies.
- No s’activa ni es publica cap Story automàtica amb aquest canvi: queda pendent d’una prova explícita amb Meta.
- Els dos fluxos de YouTube deixen ara una còpia privada del Short al bucket només quan els secrets de vídeo estan configurats; una fallada o retirada del flux no modifica la publicació a YouTube.
## V22.14.1 — 2026-08-26

- Els dos YouTube Shorts diaris es pugen amb marge com a privats i es programen amb `publishAt` per fer-se públics exactament a les 08:00 i a les 20:30 de Sant Celoni.
- El flux rebutja una hora invàlida, massa propera o incompatible amb la privacitat privada requerida per YouTube, evitant publicacions imprevistes quan GitHub Actions s'endarrereix.
- Afegida una prova de canvi horari perquè les franges es mantinguin en hora local tant a l'estiu com a l'hivern.

## V22.20.0 — Barreres operatives i ús de D1 — En verificació

- Plantilla de configuració i flux manual de GitHub Actions per desplegar i validar únicament l'entorn de proves.
- Actualitzades les accions de GitHub per usar el runtime compatible actual.
- El panell d'administració mostra les files totals desades a D1, diferenciant-les del consum de lectures i escriptures diàries.
- Documentada la recuperació de staging i de les proves reals de notificacions.

## V22.19.0 — Validació de staging — En verificació

- Nova comprovació pública i sense secrets per validar la versió, la salut, l’historial i els avisos de l’entorn de proves.
- Disponible amb `npm run test:staging` i manualment des de GitHub Actions abans de valorar un desplegament a producció.

## V22.18.0 — Salut de staging — En verificació

- La ruta `/health` de staging respon com a degradada, sense error intern, quan no es configura cap font d’observacions independent.

## Entorn de staging — 2026-08-25

- Worker `fonta-meteo-staging` actualitzat amb D1 pròpia, IA i Browser Rendering; les xarxes socials estan desactivades i no hi ha cap programador actiu.
- La D1 de staging conserva l’esquema del projecte i no conté ni secrets ni dades de producció.

## V22.16.0 — En verificació

- OneSignal confirma que un missatge s’ha creat a partir del seu identificador, que és el resultat fiable de l’API; el recompte de destinataris pot arribar més tard.
- Els avisos acceptats no es tornen a enviar per un recompte inicial de destinataris a zero.

## V22.15.0 — En verificació

- El registre de notificacions delega la petició de permís a OneSignal Web SDK i espera la Subscription ID remota abans d’indicar que l’activació ha acabat.
- Quan no es crea la subscripció remota, el diàleg diferencia aquest cas dels permisos bloquejats i evita un èxit local enganyós.

## Documentació i manteniment obert

- Afegides guies d'arquitectura, desplegament, API, fonts de dades, desenvolupament i Meteo IA.
- Afegides normes de contribució, conducta, seguretat, suport, llicència MIT i plantilles d'incidències.

## V22.15.0 — 2026-08-25

- D1 deixa de persistir lectures en cada visita pública; les captures programades de cinc minuts són el camí normal de l’historial.
- La persistència d’una observació és idempotent i el resum de magatzem es conserva cinc minuts a memòria per reduir lectures.
- Els canals socials sol·licitats sense credencials queden registrats com a error explícit, reintentable i notificable per correu.
- La prova d’avisos push registra l’estat operatiu real i indica quin secret de OneSignal falta o és incorrecte.

## V22.13.0 — 2026-08-25

- Les publicacions automàtiques queden preparades per a tres franges diàries: 08:00, 14:00 i 20:30, amb comprovació preventiva independent abans de cadascuna.
- El panell conserva i mostra l’última comprovació preventiva encara que provingui d’una franja nova.
- Google rep metadades de rastreig completes i dades estructurades més riques de l’Organització i el conjunt d’observacions.
- S’actualitzen recursos de web i PWA perquè els navegadors no reutilitzin fitxers antics després del desplegament.
- La publicació social comprova que el Worker públic tingui la mateixa versió abans de preparar targetes, evitant errors 404 opacs quan producció va per darrere.
- OneSignal usa `ONESIGNAL_API_KEY` com a secret preferit i conserva `ONESIGNAL_REST_API_KEY` com a alias temporal; els errors 401/403 expliquen que cal revisar la clau server-side.
- Les neteges de rate limit passen a manteniment programat i s’afegeixen índexs compostos a D1 per reduir lectures innecessàries.
- Afegit executor de proves automàtic amb `npm run test:quick`.
- Simplificada la documentació principal i afegides guia d’arrencada, checklist d’entrega i auditoria del projecte.

## V22.11.0 — 2026-08-25

- Els avisos push exigeixen sempre el nivell escollit i apliquen la categoria només quan el fenomen es pot classificar amb seguretat.
- OneSignal ja no es considera saludable quan accepta una petició però no troba cap dispositiu destinatari.
- Els avisos oficials actius que no han arribat es reintenten cada 30 minuts mentre continuen vigents; un enviament reeixit queda deduplicat.
- La prova real informa quan el dispositiu no existeix com a destinatari, en comptes de mostrar un èxit enganyós.
- La pàgina d’avisos incorpora ESTOFEX com a context europeu complementari, separat dels avisos oficials locals i amb la jerarquia de fonts explícita.

## V22.10.0 — 2026-08-25

- «El temps arreu» incorpora icones meteorològiques accessibles a la lectura actual i a les previsions d’Open-Meteo i MET Norway.
- Les fonts globals queden ordenades en pestanyes: Yr/MET integrada i accessos separats a Meteoblue i eltiempo.es, sense barrejar-ne les dades.
- El cercador limita i desplaça els resultats llargs dins una capa pròpia perquè no quedin tapats pels blocs següents.
- La marca lateral alinea «Fontanillas» i «Sant Celoni» sense el separador decoratiu anterior.

## V22.8.0 — 2026-08-24

- En mòbil, el visor incrustat de meduses deixa de consumir dades i s’ofereix un accés directe al mapa complet de MedusApp.
- Els visors d’incendis, sequera i meduses incorporen navegació completa amb teclat i relacions accessibles entre pestanyes i contingut.
- Els avisos oficials mostren si Sant Celoni consta explícitament al detall o si l’abast publicat és zonal i la incidència local pot variar.
- Els principals indicadors ambientals utilitzen esquelets visuals accessibles mentre esperen les dades reals.
- Versions web, Worker i memòria cau PWA unificades a V22.8.0.

## V22.7.0 — 2026-08-24

- La portada substitueix els textos d’espera per esquelets visuals suaus que desapareixen tan bon punt arriba cada dada real.
- El mapa oficial d’avisos de Meteocat deixa de carregar-se a l’inici i s’activa només quan l’usuari s’acosta a l’apartat d’avisos.
- Les preferències d’avisos separen fenòmens i intensitat en dos passos visuals més clars.
- En mòbil, les opcions d’avisos són més compactes i el botó principal queda sempre accessible al peu del diàleg.
- La càrrega animada respecta la preferència del sistema de reduir el moviment.
- Versions web, Worker i memòria cau PWA unificades a V22.7.0.

## V22.6.0 — 2026-08-24

- La prova d’avisos passa pel servei real de OneSignal i s’adreça exclusivament al dispositiu des del qual es demana.
- La diagnosi d’avisos comprova permís, subscripció, identificació remota i servei en segon pla; el diàleg també millora la navegació amb teclat.
- Meteo IA resol noves preguntes directes sobre humitat, pressió, vent, radiació, índex UV, sortida i posta del sol.
- Cada avís oficial diferencia si Sant Celoni consta explícitament al detall o si es tracta d’un avís zonal amb afectació local variable.
- «Predicció vs realitat» mesura la maduresa amb dies únics, incorpora l’índex Brier de pluja i adapta quatre mètriques a qualsevol pantalla.
- Versions web, Worker i memòria cau PWA unificades a V22.6.0.

## V22.5.2 — 2026-08-24

- Restaurats els paràmetres públics de Bluesky, Telegram, correu operatiu i OneSignal perquè els desplegaments no conservin només els secrets i deixin canals aparentment sense configurar.
- El panell diferencia la connexió OAuth de TikTok de l'aprovació pendent de publicació automàtica, evitant mostrar un estat enganyós.
- La capçalera mòbil incorpora un accés compacte a totes les xarxes quan no caben a la pantalla.
- El mapa de meduses s'obre a pantalla completa en mòbil, on el visor extern funciona millor, i es manté integrat en escriptori.
- Els avisos expliquen l'abast real de les zones oficials del Prelitoral i el Vallès Oriental sense presentar-los com un avís municipal precís.
- Unificats el títol HTML i el títol social de la portada.

## V22.5.0 — 2026-08-24

- Nou control operatiu persistent de l'execució del programador, els avisos push, la publicació social automàtica i la comprovació preventiva de connexions.
- El panell d'administració mostra els horaris reals, la zona horària, l'últim resultat, la durada i la ratxa d'errors de cada automatització.
- Nova recuperació segura de publicacions socials: es poden reintentar només els canals que han fallat, sense duplicar els que ja s'han publicat correctament.
- Registres estructurats per facilitar el diagnòstic d'incidències i diferenciar execucions correctes, parcials i fallides.
- Versions web, Worker i memòria cau PWA unificades a V22.5.0.

## V22.2.0 — 2026-08-22

- La invitació per activar avisos espera deu segons i no s’obre sobre una pestanya amagada ni sobre el diàleg de preferències.
- Nova comprovació preventiva diària de Facebook, Instagram, Bluesky, Telegram, Threads i TikTok a les 07:45, abans de la publicació de les 08:00.
- El diagnòstic preventiu valida credencials, compte i permisos sense crear cap publicació.
- Si una connexió no està preparada, s’envia un correu operatiu i la resta de canals continuen funcionant de manera independent.
- El panell d’administració mostra el resultat i l’hora de la darrera comprovació preventiva.
- Versions web, Worker i memòria cau PWA unificades a V22.2.0.

## V22.1.0 — 2026-08-22

- Primera càrrega enriquida al servidor amb la darrera observació real, dades estructurades i alternativa segura si l’API no respon a temps.
- Meteo IA local ampliada amb boira, inversió tèrmica, tempestes, sensació tèrmica, vent i radiació UV; el mode de seguretat deixa de respondre amb un error genèric.
- «Predicció vs realitat» mostra el biaix de temperatura, la ratxa prevista i observada, una llegenda més clara i un progrés accessible.
- El panell d’administració diferencia el mode local de Meteo IA de l’ampliació avançada opcional.
- Versions web, Worker i memòria cau PWA unificades.

## V22.0.3 — 2026-08-22

- Nova navegació inferior mòbil amb cinc accessos clars, indicador de pàgina activa i accés complet a la resta de seccions.
- Portada mòbil més llegible: mostra primer les dades essencials i permet desplegar pressió, radiació, UV i indicadors calculats.
- Preferències d’avisos amb selecció simultània de nivells i un botó de prova local per verificar el dispositiu abans d’esperar un episodi real.
- «Predicció vs realitat» explica el període inicial de recollida, el progrés fins als set dies i diferencia clarament els exemples il·lustratius dels resultats reals.
- Ajustats el xat flotant, les àrees segures del mòbil, la jerarquia del menú lateral i la memòria cau de la PWA.
- Afegida la capçalera HSTS al domini i mantinguts els contractes del Worker, D1 i les fonts meteorològiques sense canvis.

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
