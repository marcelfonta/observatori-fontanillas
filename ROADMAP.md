# Roadmap viu — cap a un observatori meteorològic local de referència


## Feina que es pot fer ara (28-10-2026)

- **Fet:** el PR #343 és a `main` i la referència climàtica ja es veu a `/canvi-climatic`; l'auditoria SEO de producció ha tornat a passar el 28/10. No hi havia canvis del Worker ni dels scripts de la Raspberry en aquest PR.
- **Agent:** repetir l'auditoria tècnica de producció després dels pròxims paquets fusionats i registrar separadament proves de codi, previsualització i producció.
- **Agent i usuari:** seguir la pauta editorial i visual dels quatre idiomes i l'auditoria d'accessibilitat en dispositius reals de [`docs/SITE-AUDIT-2026-10-28.md`](docs/SITE-AUDIT-2026-10-28.md).
- **Agent:** dissenyar una comparació climàtica només si es pot corregir la diferència entre la capital municipal de l'Atles i el sensor Fontanillas; la referència oficial 1991–2020 i els seus límits ja estan documentats.
- **Tots dos:** revisar el pròxim timelapse automàtic amb la targeta de CO₂ corregida i les lectures XVPCA guardades durant el dia; confirmar canals i absència de duplicats.

La revisió visual i editorial dels quatre idiomes, l'accessibilitat amb lector de pantalla, l'índex real a Search Console i el pròxim timelapse automàtic continuen pendents d'evidència en dispositius o serveis reals. Les proves de codi i un HTTP 200 no tanquen aquests punts.

## Atles ambiental de Medi Ambient (publicat, pendent de validació real)

Els set visors existents es presenten sota cinc temes dins de la mateixa pàgina.
Un catàleg complementari, plegat d'entrada i filtrat pel tema, dona accés a
fonts catalanes, europees i globals sense carregar-les automàticament. Cada
accés diferencia mesura, model, previsió, anàlisi històrica o mapa de risc;
els continguts nous es tradueixen a català, castellà, anglès i francès.

- [ ] Revisar visualment en producció mòbil i ordinador les pestanyes, el
  catàleg desplegable i els enllaços.
- [ ] Afegir capes natives només després de validar cobertura local, escala,
  actualització, llicència i estabilitat de cada servei. Els accessos a
  Resource Watch, Living Atlas, MapX i Lemuriant són exploració externa,
  no lectures locals ni dades importades al Worker.
- [ ] Reavaluar el mapa de sequera de l'ACA quan torni del manteniment. Mentrestant,
  la web mostra cartografia mensual IPE de Meteocat, separada explícitament de
  les fases administratives de l'ACA i datada setembre de 2026. Actualitzar la
  cartografia quan Meteocat publiqui un nou mes, sense assumir cap URL futura.

Actualitzat el 28 d’octubre de 2026. Aquest document recull feina pendent i el
context necessari per entendre-la. Les fases
completades es documenten a [`CHANGELOG.md`](CHANGELOG.md), als informes de
`docs/` i a l’historial Git.

La revisió de producció posterior al PR #296 és a [`docs/POST-MERGE-AUDIT-2026-10-23.md`](docs/POST-MERGE-AUDIT-2026-10-23.md). La ruta de canvi climàtic i l’accés des del menú ja estan publicats. El cron de producció es va tornar a crear el 24/10 després d'una aturada; dos cicles consecutius van actualitzar el planificador, la previsió i la càmera. Les proves OneSignal amb la web tancada van arribar a l'iPhone i al Centre de notificacions de l'ordinador. Encara cal validar les publicacions i els avisos oficials reals.

L'auditoria de primera visita del 24/10 va detectar que el mode sense connexió
no s'activava quan OneSignal encara no havia registrat el servei en segon pla.
La correcció i les regions accessibles són a producció. A la previsualització,
una visita nova sense permís va instal·lar el servei, crear la memòria cau i
recarregar la portada sense xarxa. Resta repetir la prova en dispositius reals
amb les subscripcions push existents.

L'auditoria SEO del 25/10 ha detectat canòniques i entrades del mapa del lloc
que redirigien, variants d'idioma inexistents en documents estàtics i rutes
desconegudes amb una portada 200. La correcció es va integrar amb el PR #321 i
es va verificar en producció. Les propostes de les auditories externes i els
seus límits consten a `docs/AI-AUDIT-TRIAGE-2026-10-25.md`.

## Visió

Convertir l’Observatori Meteorològic Fontanillas en la referència digital de
Sant Celoni i el Baix Montseny per consultar, entendre i reutilitzar informació
meteorològica local. La diferenciació no ha de venir d’acumular més fonts, sinó
de combinar:

- observacions pròpies transparents i ben documentades;
- prediccions verificades contra la realitat local;
- avisos oficials presentats amb responsabilitat;
- context local, històries i material educatiu que altres portals no ofereixen;
- una experiència ràpida, accessible, resilient i respectuosa amb la privacitat.

## Principis de decisió

- Mesurar abans de reestructurar: cap migració gran es justifica només per una
  auditoria teòrica.
- Observació, predicció, context, orientació pràctica i avís oficial han de
  continuar clarament separats.
- No reconstruir prediccions passades ni donar pes a una font nova sense dades
  prospectives comparables.
- No parlar de «normal climàtica» amb un arxiu propi encara curt. Qualsevol
  comparació ha d’indicar font, període, cobertura i limitacions.
- Les dades guardades o sense connexió sempre han de mostrar-ne l’hora, l’origen
  i l’estat de frescor.
- Prioritzar contingut propi, permanent i útil abans d’afegir més visors o
  llistes d’enllaços externs.
- Les accions que requereixen comptes, credencials, dispositius, llicències o
  una decisió editorial es tanquen només amb confirmació humana.
- Mantenir una marca coherent: «Observatori Meteorològic Fontanillas» és el
  projecte; «Meteo Fontanillas» pot continuar com a nom social i «Fonta» com a
  nom del model, sempre que s’expliqui.

## Estat de partida que no s’ha de reconstruir

El projecte ja disposa de rutes amigables, sitemap, canonical, `hreflang`, SEO
per ruta, dades estructurades, càrrega dinàmica de mòduls, PWA amb memòria cau,
notificacions segmentades, formulari validat i limitat al servidor, capçaleres
de seguretat, pol·len, qualitat de l’aire, històries meteorològiques, resums
socials, gràfics ràpids i una base D1 indexada. La línia base Lighthouse i els
colls d’ampolla de tercers són a
[`docs/performance-baseline-2026-10-20.md`](docs/performance-baseline-2026-10-20.md).

No s’han de reobrir aquests fronts sense una regressió o una mètrica nova que ho
justifiqui.

## P0 — Validació operativa real

### Widgets personals

El widget Garmin està instal·lat al fēnix 7X Pro i va mostrar una lectura
recent després de reconnectar Garmin Connect per Bluetooth. L'app de l'iPhone
15 Pro també es va instal·lar i l'usuari va confirmar que funciona. Queden les
proves de dades antigues i de manca de xarxa als dos dispositius.
- [ ] Validar al Garmin i als iPhone les lectures antigues, l'absència de xarxa
  i l'hora visible de l'última actualització.

**Fet quan:** els dos dispositius mostren l'observació amb hora o antiguitat
correctes, sense presentar una lectura antiga com a actual.

### Caché del domini públic i actualitzacions de la PWA

El 25/10 es va confirmar al tauler de Cloudflare que el **Browser Cache TTL** de
`fontanillas.cat` era de quatre hores. Amb autorització humana es va canviar a
«Respectar les capçaleres existents». Després, tant `/service-worker.js` com
`/OneSignalSDKWorker.js`, CSS i JS van respondre al domini públic amb
`Cache-Control: no-cache, must-revalidate`; la icona va conservar els set dies
previstos. La URL habitual del service worker, sense paràmetres, també va
respondre correctament. No es va fer cap purga general ni canviar el codi.

- [ ] Comprovar que una actualització de la PWA arriba a un navegador que ja la
  tenia instal·lada i repetir la recepció d'un avís push després del canvi.

**Fet quan:** una instal·lació existent rep la versió nova sense perdre els
avisos. La capçalera dels dos hosts ja és correcta.

### Model Fonta

- [ ] Revisar els resultats als 60 i 90 dies, separant temperatura màxima,
  temperatura mínima i pluja, abans de modificar els pesos locals.
- [ ] Exigir una mostra representativa de dies amb pluja abans de concloure
  quin model resol millor la precipitació a Sant Celoni.

**Fet quan:** cada model comparat té prou casos prospectius, la mostra de pluja
no és anecdòtica i qualsevol canvi de pesos queda justificat amb mètriques.

### Publicació social i timelapse

El 25/10 la revisió de producció va identificar una resposta 429 de Buffer
compartida per TikTok i X. El servei ha indicat que no s'hi torni a contactar
fins al 27/10/2026 a les 10:31 UTC; la resta de canals continuen independents.
L'usuari va confirmar que TikTok va reprendre una publicació automàtica el
27/10 al vespre. Encara falta verificar-ne la continuïtat i els altres canals.

El 27/10 la comprovació de les 06:45 ha tornat a avisar de la mateixa pausa,
abans de les 10:31 UTC: aquest correu no demostra un segon bloqueig. El paquet
de seguiment evita correus repetits durant la pausa i conservarà la finestra
de quota que indiqui Buffer en el pròxim 429. Després de les 10:31 UTC cal
verificar una sola consulta i l'estat real dels canals; si torna a esgotar-se
la finestra de 30 dies, estudiar la reducció de consultes o el pla de Buffer.
Per TikTok, l'alternativa immediata és la càrrega manual del vídeo vertical;
Direct Post exigeix aprovació de l'app i del permís abans d'automatitzar-la.

- [ ] Confirmar la pròxima publicació automàtica del timelapse, amb el CO₂ a la
  imatge, sense duplicats i en tots els canals habilitats.

La millora de qualitat del timelapse a 1280 × 720 i la variant vertical a
720 × 1280 s’han validat en una mostra sintètica amb límit de taxa i un sol fil.
El 25/10 la Raspberry també ha generat sense publicar el dia complet del 24/10
amb 207 fotogrames: fitxers de 6,1 MB i 3,4 MB, dimensions comprovades i servei
correcte. Els scripts nous han quedat instal·lats i la imatge pública ja mostra
el CO₂ actual, el de fa un any i el de fa deu anys. Encara cal comprovar el
resultat d'una publicació automàtica real, inclosa la qualitat a YouTube.
La targeta final del PR #340 es va provar a la Raspberry. El PR #341 en va
corregir el solapament amb l'hora de la càmera i va afegir una captura local de
lectures XVPCA vàlides del dia per generar el vídeo l'endemà. Els dos scripts
es van instal·lar el 28/10: les sumes de verificació van coincidir, el servei
va acabar amb `Result=success` i els dos temporitzadors eren actius. La nova
composició i les lectures guardades encara s'han de verificar en un vídeo
automàtic posterior a aquesta instal·lació.
El PR #345 es va instal·lar el 29/10 i la mostra vertical confirma el CO₂
des del primer fotograma. La comparació anual es llegeix massa petita i la
franja groga i XVPCA només apareixen a la pausa final. El paquet següent
amplia el text i manté aquests elements durant tot el vídeo amb l'etiqueta
«lectura de tancament» per a XVPCA; queda pendent la prova visual física.

El 21 d'octubre, dia programat, no es va preparar cap vídeo complet: FFmpeg va acabar amb `Killed` en una Raspberry de 415 MiB. La incidència [#299](https://github.com/marcelfonta/observatori-fontanillas/issues/299) continua oberta. El generador amb reducció fotograma a fotograma va superar la prova real i es va instal·lar el 23/10. El 25/10 els vídeos del 23 i del 24 responen 200 al Worker, mentre que el del 21 encara respon 404; la generació posterior al canvi, per tant, funciona, però l'episodi perdut no s'ha recuperat. El timelapse del 23/10 s’ha publicat a Instagram i el workflow de YouTube del mateix dia va acabar correctament. Encara falta evidència visible de la següent execució automàtica a cada canal habilitat, sense duplicats i amb la càpsula de CO₂, abans de tancar #299. El panell d'administració pot assenyalar dies programats absents.

- [ ] Confirmar en una jornada real que el timelapse arriba a tots els canals
  habilitats, especialment TikTok, sense duplicats i amb un màxim d’una
  publicació diària.
- [ ] Validar una franja automàtica completa de Meta abans de retirar els
  controls manuals de recuperació.

**Fet quan:** hi ha evidència d’una publicació completa i correcta a cada canal
durant una execució automàtica real.

### Avisos i dispositius

Prova completada el 24/10: notificació rebuda a l'iPhone amb la web tancada i
al Centre de notificacions de macOS amb Chrome i la web tancats. Resta comprovar
la presentació d'un avís oficial real quan n'hi hagi un.
- [ ] Verificar durant un avís oficial actiu que territori, nivell, vigència i
  enllaç oficial es mostren correctament.
- [ ] Validar el primer comunicat CECAT real detectat en mode revisió, comprovant
  municipi, nivell, franja horària, mapa i enllaç oficial.

**Fet quan:** cada circuit ha superat almenys un cas real de punta a punta.
L’autopublicació CECAT requerirà una autorització posterior explícita.

## P1 — Confiança, autoria i dades obertes

### Context local i lectura mensual

La comparació de les dues darreres finestres de 24 hores, el resum mensual visual
i tres guies introductòries del Baix Montseny s'han preparat en un únic PR.
Encara no s'ha establert cap «índex de normalitat»: l'arxiu local és massa curt.

La referència externa ja s'ha identificat: Atles Climàtic de Meteocat 1991–2020
per a la capital municipal de Sant Celoni. La pàgina de canvi climàtic mostra
el context anual i adverteix que encara no hi ha mètode validat per
comparar-lo diàriament amb l'estació Fontanillas. Detall a
[`docs/SITE-AUDIT-2026-10-28.md`](docs/SITE-AUDIT-2026-10-28.md).

**Fet quan:** les diferències respecte d'una referència climàtica tenen font,
període i límits visibles; les comparacions recents continuen diferenciades.

### Sobre l’Observatori

- [ ] Afegir fotografies públiques revisades de l’estació i l’entorn general,
  sense EXIF, adreça exacta ni elements que comprometin la ubicació privada.
- [ ] Completar altura sobre el terreny i historial de manteniment quan aquestes
  dades s’hagin mesurat i verificat de manera segura.

**Fet quan:** una persona externa pot saber qui hi ha darrere, com es produeixen
les dades, quines garanties tenen i com comunicar una incidència.

### Llicència i reutilització

- [ ] Revisar l’abast si un futur export combina observacions pròpies amb una
  font externa o incorpora una variable nova.

**Fet quan:** qualsevol export nou manté l’abast de CC BY 4.0 separat dels drets
de tercers i documenta la llicència de cada component.

## P1 — Contingut útil, local i diferencial

### Context d’arxiu a la primera lectura

- [ ] Afegir context d’arxiu només quan la mostra sigui representativa i mostrar
  el període comparat. No etiquetar-lo encara com a normal climàtica.

**Fet quan:** la comparació utilitza prou cobertura, identifica el període i no
presenta una mitjana curta com una normal climàtica.

### Resums climatològics periòdics

El primer resum mensual permanent és `/resums/2026-09`: inclou extrems, pluja,
vent, cobertura, incidències de qualitat, sitemap i targeta social. No presenta
l'arxiu curt de l'estació com una normal climàtica.

- [ ] Preparar un resum setmanal web i, si aporta valor, distribuir-lo
  per Telegram o correu amb consentiment explícit.

**Fet quan:** cada resum es pot citar, compartir i reproduir des de dades
traçables, sense exagerar la significació climàtica d’un arxiu curt.

### CO₂ atmosfèric de referència a la webcam

La dada seguirà el criteri de les càmeres d’El Temps de 3Cat: no serà una
lectura local de la càmera ni de l’estació, sinó la concentració atmosfèrica de
referència de Mauna Loa publicada per NOAA Global Monitoring Laboratory. NOAA
adverteix que aquesta estació no és equivalent a una mitjana mundial. Les
etiquetes públiques indicaran sempre «Mauna Loa» i evitaran dir «mitjana global».

La ingestió diària, el resum compartit al Worker, la comparació amb fa un i deu
anys i la càpsula discreta de la webcam estan desplegats. La Raspberry genera
la imatge pública amb la font NOAA i deixa la dada fora si no és prou recent.
Hi ha mostres de dia i nit revisades; falta verificar la composició en totes
les destinacions i la propera publicació automàtica real.

- [ ] Revisar la càpsula de CO₂ en mòbil, pantalla gran, miniatures i peces
  compartides després d'una publicació automàtica, comprovant atribució,
  frescor, privacitat i llegibilitat.

**Fet quan:** la webcam mostra una dada oficial, datada, atribuïda i degradable,
clarament diferenciada dels contaminants locals PM10, NO₂ i O₃.

### Contaminants i temperatura superficial del mar

La franja de NO₂, O₃ i PM10 de la webcam va començar amb estimacions CAMS.
La nova proposta consulta les mesures provisionals de l'estació XVPCA ES1275A
de Sant Celoni. La pàgina de medi ambient presenta les mesures d'aquesta
estació a les targetes visuals principals. El resum ICQA adopta la pitjor
categoria oficial mesurada, sense barrejar-la amb un índex numèric de CAMS.
El visor d'estacions XVPCA de Catalunya permet explorar les altres estacions
amb un mapa carregat sota demanda i les lectures publicades per la Generalitat.
El visor de Copernicus Marine és una pestanya de Medi
Ambient, carregada només quan se selecciona; representa temperatura superficial
analitzada i prevista, no mesures instantànies de cada punt del mar.
El visor ara destaca l'obertura a pantalla completa per fer zoom i enllaça
separadament a Portus per consultar temperatura de l'aigua mesurada per boies.
La càmera disposa d'un mode de prova local que no publica les imatges.
Les primeres mostres reals de dia han confirmat el disseny compacte. El CO₂
continua en una etiqueta mínima i els contaminants en tres cercles petits. El
color ara correspon a la categoria publicada per l'estació oficial. PM10 és una
mitjana de 24 hores; les altres lectures són horàries. Una mostra diürna es va
comparar amb el visor oficial i el script es va instal·lar el 24/10; el servei
de la Raspberry va acabar amb resultat correcte.

- [ ] Comprovar en una mostra nocturna els valors XVPCA de la càmera i verificar
  en producció l'absència segura quan la font oficial falla.
- [ ] Validar en staging i en dispositius reals els visors de l'ACA i Copernicus,
  incloent les versions mòbils, abans de desplegar-los a producció.
- [ ] Quan l'ACA retorni el mapa interactiu al servei, comprovar-ne el contingut
  real i decidir si es pot recuperar la vista incrustada. Mentrestant, la pestanya
  ha de mostrar accessos oficials sense presentar la pàgina de manteniment com un mapa.

### Pàgina de canvi climàtic de referència

Crear una ruta permanent `/canvi-climatic` amb narrativa pròpia, dades
traçables i tres escales que no es barregin: planeta, Catalunya i Observatori.
No s’utilitzarà una oscil·lació meteorològica local com a prova d’una tendència
climàtica.

La primera versió de la ruta i l’accés des del menú ja estan implementats: quatre indicadors amb font i període, CO₂ diari de Mauna Loa quan és recent, una sèrie anual NOAA de 1959–2025 descarregable i una explicació dels límits de l’arxiu local. Continuen pendents les comparacions climàtiques detallades de Catalunya, la revisió editorial externa i les traduccions reals de la pàgina. Fins aleshores la ruta climàtica es presenta als cercadors només en català.

- [ ] Dissenyar una primera lectura curta amb quatre indicadors datats: CO₂
  atmosfèric global, temperatura global, evolució observada a Catalunya i
  estat/cobertura de l’arxiu local.
- [ ] Construir la pàgina com un relat i no com un tauler saturat: una portada
  que respongui «què està canviant?», quatre xifres com a màxim i accés
  progressiu al detall, les fonts i la metodologia.
- [ ] Organitzar la narració en cinc capítols: «Ara mateix», «El planeta»,
  «Catalunya», «Baix Montseny i l’Observatori» i «Entendre les dades», amb una
  conclusió pràctica i enllaços a les sèries originals.
- [ ] Revisar editorialment la corba de Keeling i les comparacions amb fa un any, deu anys i el
  nivell preindustrial, indicant estació, unitats, provisionalitat i font NOAA.
- [ ] Utilitzar fonts climàtiques primàries i estables —NOAA/WMO o Copernicus a
  escala global i Meteocat/SMC a Catalunya— amb metodologia, enllaç, data
  d’actualització i llicència visibles.
- [ ] Explicar en gràfics accessibles l’evolució de temperatura, precipitació,
  sequera i extrems a Catalunya sense atribuir un episodi individual al canvi
  climàtic si la font no ho sosté.
- [ ] Reservar l’escala «Observatori» per a observacions pròpies, cobertura i
  comparacions descriptives; no calcular tendències climàtiques ni «normals»
  fins que la longitud i qualitat de la sèrie ho permetin.
- [ ] Fer visible la diferència entre CO₂ atmosfèric global, contaminants de
  l’aire local i meteorologia; explicar també la diferència entre variabilitat
  d’un dia, tendència climàtica i atribució d’un episodi extrem.
- [ ] Afegir peces locals que aportin criteri propi —sequera, nits càlides,
  precipitació i extrems— només quan una sèrie oficial o la cobertura de
  l’arxiu permeti sostenir-les, sempre amb el període de comparació visible.
- [ ] Preparar text alternatiu, taules descarregables, definicions, metodologia,
  preguntes freqüents i un apartat «Què sabem / què no podem concloure».
- [ ] Definir un sistema visual propi, sobri i memorable: una escala cromàtica
  accessible, gràfics amb anotacions que expliquin el perquè dels canvis i una
  versió en taula que no depengui del color ni de la interacció.
- [ ] Mostrar a cada indicador la data efectiva, la pròxima actualització,
  l’estat provisional o definitiu i una degradació clara si la font no respon;
  conservar l’últim valor bo sense fer-lo passar per actual.
- [ ] Afegir metadades pròpies, canonical, JSON-LD, imatge social, sitemap i una
  prova sense JavaScript perquè la pàgina sigui citable i indexable.
- [ ] Validar contingut, unitats, gràfics, llenguatge i actualització automàtica
  amb proves de dades absents abans de destacar-la a la navegació principal.

**Fet quan:** una persona pot entendre què està canviant al planeta i a
Catalunya, què mesura realment l’Observatori i quines fonts sostenen cada
afirmació, sense confondre temps, contaminació local i clima.

### Publicacions diàries: nova identitat sonora, CO₂ i vespre complet

El distintiu lunar separat i les mostres musicals estan desplegats. Les variants de música de matí, vespre i episodi i la icona meteorològica del vespre estan preparades al codi per a revisió. Les proves locals de vídeo i de nivell d’àudio passen; resta confirmar una publicació real, fer una escolta en mòbil i valorar el resultat editorial.

Les peces diàries han de sonar i veure’s com una sola marca, però sense
convertir una previsió meteorològica en un missatge climàtic confús. La dada de
CO₂ serà la mateixa fotografia global oficial que aparegui a la webcam; no serà
una mesura local.

- [ ] Crear una breu guia sonora de marca i comparar prototips abans del canvi:
  conservar un motiu reconeixible, però substituir la peça sintètica única
  actual per una sintonia més càlida, agradable i menys repetitiva.
- [ ] Preparar variants coherents de matí, vespre/nit i episodi destacat, amb el
  mateix ADN musical i transicions suaus; evitar que una música dramàtica
  exageri una previsió ordinària o un risc que no és un avís oficial.
- [ ] Mantenir la música original o amb llicència compatible amb totes les
  xarxes, documentar-ne autoria i drets, normalitzar volum, evitar saturació i
  provar-la amb altaveu de mòbil, auriculars i reproducció sense so.
- [ ] Fer una prova A/B interna de les sintonies amb una previsualització de
  matí i una de vespre, i conservar una reversió immediata abans d’aplicar el
  canvi a totes les publicacions automàtiques.
- [ ] Reutilitzar una única instantània normalitzada de NOAA per a webcam, web i
  publicacions; no crear tres ingestes ni tres criteris de frescor diferents.
- [ ] Afegir a cada peça diària una càpsula breu i no invasiva —preferentment al
  tancament— amb «CO₂ atmosfèric global · Mauna Loa, NOAA», ppm, data efectiva
  i variació interanual. Ometre-la si és antiga o no està verificada.
- [ ] Explicar a la descripció que el CO₂ és global i no és qualitat de l’aire
  de Sant Celoni; la càpsula no ha de competir amb la previsió ni aparèixer
  repetida a totes les escenes del vídeo.
- [ ] Separar en el vespre dues informacions que ara competeixen: mantenir
  sempre el símbol meteorològic de la franja —serè, núvols, boira, pluja, neu o
  tempesta, amb variant nocturna— i mostrar la fase lunar real com a distintiu
  astronòmic secundari, etiquetat i atribuït.
- [ ] No utilitzar la fase lunar com a substitut de l’estat del cel ni la lluna
  genèrica de «nit» com si fos una fase calculada. Si falla una font, conservar
  l’altra i mostrar el seu estat de disponibilitat de manera independent.
- [ ] Aplicar la mateixa jerarquia a Shorts, targetes de Meta i la resta de
  formats diaris, incloent text i descripció; revisar que cada xarxa respecti
  marges segurs i no retalli el símbol meteorològic o la fase lunar.
- [ ] Afegir proves visuals de vespre serè, parcialment ennuvolat, cobert,
  boira, pluja, neu i tempesta; cobrir també absència de codi meteorològic,
  absència de fase lunar, CO₂ antic i generació amb el so desactivat.

**Fet quan:** matí i vespre comparteixen una identitat sonora agradable, les
publicacions incorporen CO₂ global sense confondre’l amb una mesura local i una
persona pot distingir d’un cop d’ull quin temps farà i quina fase lunar hi haurà.

### Llenguatge i criteri editorial

- [ ] Definir una guia curta de marca i terminologia per a «predicció»,
  «previsió», «avís», «alerta», «observació», «Fonta» i noms del projecte.
- [ ] Revisar advertiments repetits: conservar cada advertiment necessari al
  costat del risc, però evitar repetir el mateix paràgraf sense valor nou.
- [ ] Ordenar fonts externes per criteri i recomanar-ne poques de manera
  argumentada, mantenint la resta com a alternatives o atribucions.
- [ ] Incorporar una revisió ortogràfica i una prova sense JavaScript abans de
  publicar contingut editorial nou.

**Fet quan:** el portal utilitza noms i conceptes de manera consistent i el
lector entén per què es recomana cada font.

## P1 — Indexació i descobriment

### Validació SEO real

L’auditoria real del 22 d’octubre és a `docs/SEO-AUDIT-2026-10-22.md`. Search
Console manté el sitemap correcte amb 52 URL descobertes, però l’informe anterior
encara no en mostra cap d’indexada. La prova sense JavaScript va detectar l’HTML
genèric i s’ha activat la generació de metadades, canonical, H1 i JSON-LD a
l’edge, incloses les rutes profundes. Els `lastmod` editorials corresponen a una
publicació real.

- [ ] Després del desplegament, executar l’auditoria de producció, reenviar el
  sitemap i iniciar «Valida la correcció» a Search Console.
- [ ] Revisar l’evolució d’indexació quan Google acabi el nou rastreig; no crear
  més pàgines només per forçar volum.

**Fet quan:** cada ruta prioritària és indexada separadament i mostra el títol,
descripció, canonical, idioma i contingut esperats.

### Noves pàgines d’entrada

- [ ] Crear només 3–5 pàgines de municipis veïns si cadascuna pot aportar
  introducció, relació amb l’estació, font del model i contingut local únic.
- [ ] Evitar pàgines massives generades automàticament o que facin passar una
  predicció modelitzada per una observació local.
- [ ] Provar primer guies amb demanda real com boira al Vallès Oriental,
  tempestes del Montseny, calor nocturna o neu al Turó de l’Home.
- [ ] Valorar un feed RSS/Atom per a històries i resums propis; no republicar
  avisos oficials sense revisar-ne llicència, atribució i responsabilitat.

**Fet quan:** cada pàgina nova resol una cerca concreta amb contingut original i
no existeix només per captar trànsit.

## P2 — Qualitat i velocitat de la web

### Mesura de camp

- [ ] Contrastar les proves de laboratori amb Core Web Vitals de camp quan
  Search Console disposi de prou trànsit.
- [ ] Repetir Lighthouse després de canvis importants i separar problemes
  propis de limitacions de mapes, iframes o scripts de tercers.

**Fet quan:** existeix una línia base repetible que identifica colls d’ampolla
reals i permet comparar qualsevol canvi posterior.

### Actius propis

- [ ] Auditar les imatges que controlem i aplicar dimensions i formats moderns
  on aportin estalvi; no recomprimir indiscriminadament mapes, GIF o actius de
  tercers.

**Fet quan:** els actius propis no provoquen regressions visuals i qualsevol
optimització millora o manté les mètriques mesurades.

### Validació en dispositius i accessibilitat

- [ ] Revisar «El temps arreu», Meteocat, XAC, avisos i els visors principals en
  un iPhone, un Android i un ordinador.
- [ ] Comprovar desplegables, pestanyes, reproductors, controls tàctils,
  ampliació de text, orientació de pantalla i `prefers-reduced-motion`.
- [ ] Fer una passada completa amb teclat i lector de pantalla pels fluxos
  principals i assegurar que gràfics i mapes ofereixen resum o taula accessible.
- [ ] Confirmar que canvis de valors importants s’anuncien de manera moderada
  amb `aria-live` sense saturar el lector de pantalla.

**Fet quan:** no hi ha bloquejos funcionals ni problemes d’accessibilitat crítics
en els tres entorns i la informació essencial no depèn només del color o del
gràfic.

## P2 — Primera lectura i mode sense connexió

### HTML inicial amb l’última dada coneguda

- [ ] Prototipar una instantània segura de la lectura principal i la predicció
  resumida, generada pel Worker o durant el desplegament.
- [ ] Mostrar sempre hora, font i estat de frescor, i substituir la instantània
  quan arribi la dada en directe.
- [ ] Comparar el prototip amb l’estat actual en temps de primera lectura,
  indexació, robustesa i risc de mostrar dades antigues.

**Fet quan:** la informació útil apareix abans que amb el sistema actual, sense
fer passar una dada desada per una observació en directe. No es regenerarà tota
la web cada cinc minuts si una resposta del Worker resol el mateix problema.

### Memòria cau útil i honesta

- [ ] Provar connexió lenta, pèrdua de xarxa, recuperació i canvi de versió del
  service worker.
- [ ] Revisar si tots els mòduls diferits han de formar part de la precàrrega
  inicial offline o poden guardar-se quan es visiten per primera vegada.

**Fet quan:** la consulta bàsica continua sent útil sense xarxa i mai confon una
dada antiga amb una dada actual. No cal migrar a Workbox si el service worker
actual compleix aquests criteris.

## P2 — Educació i servei públic

### Aula oberta amb material propi

- [ ] Provar el material amb almenys una persona docent abans d’ampliar la
  col·lecció.

La primera fitxa, «Quan va ploure més?», ja ofereix una activitat imprimible,
el CSV real, solucions orientatives, rúbrica, autoria, llicència i data. Abans
d’ampliar la col·lecció cal recollir una revisió docent i aplicar-ne els canvis.

**Fet quan:** existeix un recurs propi, reproduïble i pedagògicament revisat que
una escola pot utilitzar sense assistència tècnica.

### Calendari i guies locals

- [ ] Preparar contingut estacional curt i verificat sobre tardor, hivern,
  primavera i estiu al Baix Montseny.
- [ ] Separar clarament climatologia, observació recent i heurístiques
  orientatives sobre bolets, pol·len, neu, calor o tempestes.
- [ ] Afegir itineraris de lectura per a hortolans, excursionistes, corredors i
  famílies només quan cada recomanació tingui dades i fonts suficients.

**Fet quan:** els perfils troben informació accionable sense que el portal faci
afirmacions sanitàries, agrícoles o de seguretat que no pot sostenir.

## P2 — Cel nocturn interactiu

### Planetari local de 360°

Pilot implementat el 23 d’octubre de 2026: el visor oficial de Stellarium Web
s’inicia a Sant Celoni només després d’una acció explícita i ofereix moviment
360°, zoom, retorn a l’estat inicial, punts cardinals, zenit, pantalla completa,
localitat i hora. També permet saltar a la posta de sol o a l’inici de la nit
astronòmica i mostra explícitament `Europe/Madrid` amb canvi CET/CEST. Les
targetes textuals actuals continuen disponibles si el motor no arrenca.

Completat: controls «Ara», posta de sol, inici de la nit astronòmica i data;
qualsevol canvi actualitza el cel i manté visible la zona horària utilitzada.
- [ ] Valorar franges horàries suggerides quan la capa meteorològica i els
  objectes recomanats estiguin disponibles.
- [ ] Oferir controls tàctils, teclat, preferència de moviment reduït i una
  alternativa textual amb objecte, direcció, altura i millor hora.

**Fet quan:** una persona pot respondre «què veuré, cap on he de mirar i a quina
hora?» des de Sant Celoni o una localitat escollida, tant amb ratolí com amb
teclat o lector de pantalla.

### Capa d’observabilitat meteorològica

- [ ] Creuar la posició astronòmica amb nuvolositat, precipitació, visibilitat,
  boira i llum lunar per mostrar franges «favorables», «variables» o «poc
  favorables», sempre com a estimació meteorològica.
- [ ] Preparar una targeta «Aquesta nit» amb els 3–5 objectes més fàcils de
  reconèixer, hora recomanada, punt cardinal, altura màxima i interferència de
  la Lluna.
- [ ] Distingir objectes geomètricament sobre l’horitzó d’objectes realment
  observables; arbres, edificis, relleu, contaminació lumínica i boira local
  poden impedir-ne la visió.
- [ ] Valorar en una fase posterior un perfil d’horitzó o panorama propi de
  l’estació, sense publicar informació que comprometi la ubicació privada.

**Fet quan:** el visor no promet que un objecte serà visible només perquè sigui
sobre l’horitzó i explica les principals limitacions locals.

### Integració de Stellarium Web Engine

Decisió de producte: el visor principal utilitza l’aplicació oficial de
Stellarium Web en un marc aïllat, no un mapa estel·lar simplificat. Això manté
el motor i els catàlegs al seu origen i permet afegir-hi la capa local de
l’Observatori sense modificar-los ni redistribuir-los.

Completat: Sant Celoni és l’observador inicial i latitud, longitud, altitud,
data, hora i zona horària se sincronitzen amb els controls del portal;
`Europe/Madrid` és visible i les conversions CET/CEST tenen proves d’hivern i
estiu.
- [ ] Integrar sobre Stellarium les targetes pròpies «Aquesta nit», qualitat
  meteorològica, objectes recomanats i millor franja, sense alterar el significat
  de les dades astronòmiques del motor.
- [ ] Mesurar memòria, transferència, temps d’arrencada i estabilitat en iPhone,
  Android i ordinador; descarregar resolució o capes abans que degradar tota la
  pàgina «Cel».
- [ ] Revisar periòdicament els canvis del servei, la política de privacitat i
  les condicions de l’aplicació oficial; mantenir visibles l’atribució i els
  enllaços a la llicència i al codi font.
- [ ] Afegir una alternativa textual navegable amb objecte, direcció, altura i
  millor hora, perquè el Canvas/WebGL no sigui l’única via d’accés.
- [ ] Validar posicions del Sol, Lluna i planetes contra una font astronòmica de
  referència per a diverses dates, hores, orientacions i localitats abans de
  publicar-lo.

**Fet quan:** Stellarium funciona integrat en mòbil i escriptori amb localitat,
hora, orientació i moviment 360°, la càrrega és diferida, les obligacions de
llicència estan documentades, existeix una alternativa accessible i les
posicions han superat les proves astronòmiques definides.

## P2 — Experiments meteorològics

### Radar europeu EUMETNET OPERA

Estat confirmat el 22 d’octubre de 2026: Météo-France ha aprovat el cas
`T#169758` i ha activat per a l’usuari `meteofontanillas` tots els compostos
OPERA, tant en temps real com arxivats. La llicència i l’alta ja no són un
bloqueig. El contracte oficial —autenticació, endpoints, formats, límits i
retenció— està verificat a `docs/METEOFRANCE-OPERA.md`; la integració continuarà
tancada al públic fins a validar el catàleg real i la degradació segura.

- [ ] Validar amb una prova privada el catàleg real: cobertura geogràfica,
  productes disponibles, resolució, passos temporals, retard, valors absents i
  accés a l’arxiu.
- [ ] Guardar la credencial exclusivament com a secret de Cloudflare i crear un
  proxy del Worker amb llista tancada de productes i temps, validació de
  paràmetres, límits de mida, temps d’espera i memòria cau adequada.
- [ ] Incorporar OPERA al visor com a capa europea diferenciada de Meteocat i
  RainViewer, amb hora i frescor visibles i atribució **EUMETNET OPERA · CC BY
  4.0**.
- [ ] Conservar Meteocat com a referència oficial local i RainViewer com a
  reserva quan OPERA no respongui; cap fallada europea ha de deixar inutilitzat
  el radar ni presentar una imatge antiga com si fos actual.
- [ ] Provar temps real i arxiu en mòbil i escriptori, mesurar latència i
  disponibilitat i afegir monitoratge operatiu sense exposar URLs signades,
  usuaris, claus ni detalls sensibles als missatges d’error.
- [ ] Valorar l’arxiu OPERA per a històries d’episodis i validació retrospectiva
  només després de documentar-ne la traçabilitat i separar-lo del nowcasting
  prospectiu.

**Fet quan:** la capa europea mostra un producte OPERA real amb temps,
atribució i cobertura correctes, passa per un proxy segur, es degrada cap a les
fonts actuals sense trencar el visor i l’accés històric conserva una traça
reproduïble.

### Nowcasting local en mode d’ombra

- [ ] Mesurar durant episodis reals la disponibilitat, continuïtat temporal i
  qualitat dels fotogrames futurs de radar.
- [ ] Acumular com a mínim 288 mostres i un 90% de radar útil abans d’avaluar
  episodis; el circuit d’ombra continuarà contrastant radar, llamps, satèl·lit i
  AROME HD sense mostrar hores d’arribada ni enviar avisos.
- [ ] Definir l’error espacial prospectiu només quan una projecció guardada es
  pugui comparar amb l’observació posterior corresponent.

**Fet quan:** el conjunt permet mesurar encerts i errors. Qualsevol avís o
publicació automàtica requerirà autorització específica.

### Model Fonta i qualitat de l’estació

- [ ] Avaluar AROME HD i AROME France sobre els mateixos dies prospectius abans
  de decidir una nova versió del model Fonta.
- [ ] Activar el pilot regional XEMA només després d’una captura manual
  verificada, un pla de validació temporal i una estació deixada fora.
- [ ] Aclarir amb Meteocat les condicions de reutilització XEMA abans de mostrar
  lectures per estació, redistribuir originals o publicar un producte derivat.
- [ ] Comprovar ventilació, altura sobre el terreny i altitud de l’estació, i
  executar el protocol de comparació independent quan hi hagi una referència i
  accés segur.
- [ ] Acumular prou dies abans de corregir lectures, ampliar variables o donar
  ús operatiu a una correcció.

**Fet quan:** les fonts i l’estació tenen una validació prospectiva documentada
i les condicions de reutilització estan resoltes.

### Fonts numèriques de Météo-France

- [ ] Construir ingestió WCS/GRIB privada només per a PE-AROME i PE-ARPEGE si
  aporten dades numèriques comparables i una llicència compatible.
- [ ] Congelar-ne les prediccions i verificar-les prospectivament abans de
  donar-los cap pes al model Fonta.

**Fet quan:** hi ha dades estables, legalment reutilitzables i comparables amb
els models existents; en cas contrari, el paquet es tanca sense integrar-les.

## P3 — Evolució condicionada per evidència

`camera.fontanillas.cat` es va activar el 2026-10-25 sobre el Worker i l'R2
existents. Les imatges públiques responen al domini propi; les rutes privades
hi retornen 404 i el web conserva el retorn a `workers.dev` si falla la càrrega.
- [ ] Valorar una animació lleugera de la webcam només després de mesurar-ne el
  cost, amb preferència de moviment reduït i mantenint la imatge estàtica com a
  opció principal.
- [ ] Separar físicament l’aplicació, generar documents estàtics o servir
  metadades a l’edge només si Search Console demostra un problema d’indexació o
  les mètriques mostren que les rutes actuals no són suficients.
- [ ] Migrar D1 o afegir una base especialitzada en sèries temporals només quan
  es mesurin límits de volum, latència, retenció o consulta que D1 no resolgui.
- [ ] Introduir Web Workers o virtualització només si una traça mostra bloqueig
  del fil principal o llistes prou grans per justificar-ho.
- [ ] Crear imatges socials dinàmiques només amb dades estables i hora visible;
  no publicar temperatura en directe en una targeta que una xarxa pugui desar.
- [ ] Activar «Un dia com avui» quan hi hagi diversos anys comparables d’arxiu.
- [ ] Valorar integracions CWOP, MADIS o Meteoclimatic només després de revisar
  requisits, llicències, privacitat de la ubicació i manteniment.

## Fora d’abast actual

Aquestes idees no formen part del pla actiu perquè el cost o el risc supera el
benefici demostrat:

- fòrum, comentaris oberts o galeria pública sense un pla de moderació,
  privacitat, drets d’imatge i anti-spam;
- alertes hiperlocals del tipus «plourà en 15 minuts» abans de validar el
  nowcasting prospectivament;
- memòria persistent de converses de Meteo IA sense una necessitat, política de
  privacitat i límits de retenció clars;
- migració a Workbox, Hono, microserveis, KV o una nova base de dades només per
  seguir una recomanació genèrica;
- `Speculation Rules`, precàrregues globals o transformació indiscriminada
  d’imatges sense una mesura que n’acrediti el benefici;
- `HSTS preload` o `includeSubDomains` sense una auditoria completa de tots els
  subdominis.

## Ordre recomanat de pròxims paquets

0. **Idiomes (publicats, pendents de revisió editorial real):** catàleg dels 1.605 textos inventariats en 13 documents públics, atributs accessibles, metadades, pàgines independents i manifestos de la PWA en castellà, anglès i francès. Vegeu `docs/I18N-AUDIT-2026-10-27.md` per a l'abast i els límits. Cal la validació visual i editorial als dispositius reals.
1. **Fiabilitat operativa:** comprovar la PWA i el push en una instal·lació existent després de corregir el caché; observar el proper vespre i timelapse reals sense duplicats a cada canal; mantenir #299 obert fins a aquesta evidència. Falta observar un avís oficial real.
2. **Clima:** validar visualment el CO₂ ja integrat a webcam i peces diàries; verificar la nova sèrie llarga NOAA, afegir sèries oficials catalanes de temperatura/precipitació amb mètode comparable i completar la revisió editorial. Les traduccions publicades continuen pendents de revisió humana. La ruta i la primera lectura ja són públiques.
3. **Qualitat real:** provar en iPhone, Android i ordinador els visors, els controls tàctils, l’accessibilitat i la recuperació sense connexió; repetir l’auditoria SEO a Search Console.
4. **Contingut:** revisió docent de la primera fitxa d’Aula oberta, guia local estacional i següent resum periòdic només amb cobertura suficient.
5. **Cel i experiments:** completar la guia d’objectes del cel nocturn i la prova física; continuar acumulant mostres prospectives de Fonta, XEMA i nowcasting. OPERA continua condicionat a la credencial i al catàleg privat real.

Les millores d’un paquet s’han de desplegar, mesurar i documentar abans d’obrir
el següent. L’objectiu no és tenir més funcions que altres portals, sinó ser la
font local més clara, fiable, útil i transparent.
