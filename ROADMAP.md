# Roadmap viu — cap a un observatori meteorològic local de referència

Actualitzat el 22 d’octubre de 2026. Aquest document conté únicament feina
pendent, aplicable i amb un criteri de finalització observable. Les fases
completades es documenten a [`CHANGELOG.md`](CHANGELOG.md), als informes de
`docs/` i a l’historial Git.

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

### Model Fonta

- [ ] Revisar els resultats als 60 i 90 dies, separant temperatura màxima,
  temperatura mínima i pluja, abans de modificar els pesos locals.
- [ ] Exigir una mostra representativa de dies amb pluja abans de concloure
  quin model resol millor la precipitació a Sant Celoni.

**Fet quan:** cada model comparat té prou casos prospectius, la mostra de pluja
no és anecdòtica i qualsevol canvi de pesos queda justificat amb mètriques.

### Publicació social i timelapse

- [ ] Confirmar en una jornada real que el timelapse arriba a tots els canals
  habilitats, especialment TikTok, sense duplicats i amb un màxim d’una
  publicació diària.
- [ ] Validar una franja automàtica completa de Meta abans de retirar els
  controls manuals de recuperació.

**Fet quan:** hi ha evidència d’una publicació completa i correcta a cada canal
durant una execució automàtica real.

### Avisos i dispositius

- [ ] Confirmar una notificació OneSignal real amb la web tancada o en segon pla
  en, com a mínim, un mòbil i un ordinador subscrits.
- [ ] Verificar durant un avís oficial actiu que territori, nivell, vigència i
  enllaç oficial es mostren correctament.
- [ ] Validar el primer comunicat CECAT real detectat en mode revisió, comprovant
  municipi, nivell, franja horària, mapa i enllaç oficial.

**Fet quan:** cada circuit ha superat almenys un cas real de punta a punta.
L’autopublicació CECAT requerirà una autorització posterior explícita.

## P1 — Confiança, autoria i dades obertes

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

### Contacte de seguretat

- [ ] Revisar les capçaleres amb una eina externa sense ampliar HSTS a
  `includeSubDomains` o `preload` fins a auditar tots els subdominis.

**Fet quan:** existeix un canal verificable per comunicar vulnerabilitats i no
s’ha introduït cap política irreversible sense comprovar-ne l’abast.

## P1 — Contingut útil, local i diferencial

### Primera lectura humana

- [ ] Refinar «Què cal saber ara?» en una frase breu que combini observació,
  tendència, predicció immediata i avisos, sense presentar probabilitats com
  certeses.
- [ ] Mostrar sempre hora i font de cada component; si no hi ha prou dades,
  ometre la conclusió en lloc d’inventar-la.
- [ ] Afegir context d’arxiu només quan la mostra sigui representativa i mostrar
  el període comparat. No etiquetar-lo encara com a normal climàtica.

**Fet quan:** la portada respon en pocs segons «què passa, què pot passar i què
he de vigilar?» amb dades traçables.

### FAQ i utilitat dels indicadors

- [ ] Publicar una FAQ inicial sobre diferències amb Meteocat, fiabilitat de
  l’estació, dades provisionals, observació versus predicció, model Fonta i
  interpretació dels avisos.
- [ ] Afegir una frase pràctica i prudent als indicadors calculats: punt de
  rosada, dèficit de pressió de vapor, sensació tèrmica, pressió i altres.
- [ ] Preparar una guia «Què fer en cas d’avís» basada i enllaçada a Protecció
  Civil per calor, vent, tempesta, neu i pluja intensa.

**Fet quan:** cada concepte important explica què significa, per a què serveix i
quins límits té, amb font autoritzada quan hi ha implicacions de seguretat.

### Històries meteorològiques pròpies

- [ ] Publicar manualment les primeres 2 o 3 històries permanents d’episodis
  reals, amb gràfics, cronologia, dades, fotografia o timelapse i fonts.
- [ ] Fer que les històries siguin indexables i compartibles, amb URL, títol,
  descripció i imatge social propis.
- [ ] Utilitzar la detecció automàtica només per preparar candidats o esborranys;
  la publicació editorial continuarà requerint revisió.

**Fet quan:** la secció mostra exemples reals i complets encara que aquell dia
no es detecti cap episodi nou.

### Resums climatològics permanents

- [ ] Generar un primer resum mensual amb màxima, mínima, pluja total, ratxa
  màxima, dies destacats, cobertura i incidències de qualitat.
- [ ] Crear URLs permanents del tipus `/resums/2026-10`, afegir-les al sitemap i
  oferir una targeta social revisable.
- [ ] Comparar només períodes realment disponibles; incorporar normals oficials
  únicament quan siguin espacialment representatives, citables i compatibles.
- [ ] Preparar després un resum setmanal web i, si aporta valor, distribuir-lo
  per Telegram o correu amb consentiment explícit.

**Fet quan:** cada resum es pot citar, compartir i reproduir des de dades
traçables, sense exagerar la significació climàtica d’un arxiu curt.

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

- [ ] Enviar i verificar el sitemap actual a Search Console.
- [ ] Inspeccionar les rutes prioritàries, Rich Results, canonical, `hreflang`,
  títols, descripcions, H1 i dades estructurades.
- [ ] Afegir `lastmod` fiable només per a pàgines amb una modificació real.
- [ ] Comprovar què rep un robot sense executar JavaScript. Si les rutes hereten
  les metadades de portada, prototipar HTML o metadades generades al Worker per
  ruta abans de migrar tota l’arquitectura.

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

### Tipografies i actius propis

- [ ] Allotjar localment només els pesos WOFF2 utilitzats de DM Sans i Manrope,
  conservar-ne les llicències i eliminar les connexions a Google Fonts.
- [ ] Ajustar `font-display`, precàrrega i subconjunts només després de mesurar
  la primera càrrega.
- [ ] Auditar les imatges que controlem i aplicar dimensions i formats moderns
  on aportin estalvi; no recomprimir indiscriminadament mapes, GIF o actius de
  tercers.

**Fet quan:** la tipografia no depèn de dominis externs, no provoca regressions
visuals i el canvi millora o manté les mètriques.

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

- [ ] Conservar l’última lectura, predicció consultada i avisos recents que siguin
  segurs per a ús sense connexió.
- [ ] Mostrar de manera inequívoca que són dades desades, amb l’hora original i
  una opció de reintent.
- [ ] Provar connexió lenta, pèrdua de xarxa, recuperació i canvi de versió del
  service worker.
- [ ] Revisar si tots els mòduls diferits han de formar part de la precàrrega
  inicial offline o poden guardar-se quan es visiten per primera vegada.

**Fet quan:** la consulta bàsica continua sent útil sense xarxa i mai confon una
dada antiga amb una dada actual. No cal migrar a Workbox si el service worker
actual compleix aquests criteris.

## P2 — Educació i servei públic

### Aula oberta amb material propi

- [ ] Crear una primera fitxa descarregable per a ESO basada en el CSV real de
  l’estació: punt de rosada, interpretació d’una gràfica o estadística bàsica.
- [ ] Documentar objectius, nivell, solució orientativa, autoria, llicència i
  data de les dades.
- [ ] Provar el material amb almenys una persona docent abans d’ampliar la
  col·lecció.

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

- [ ] Incorporar a «El cel, de dia i de nit» un visor carregat de manera
  diferida, centrat per defecte a Sant Celoni i orientat segons l’horitzó local.
- [ ] Permetre arrossegar el cel en 360°, ampliar-lo, tornar a la vista inicial i
  saltar als punts cardinals sense exigir coneixements astronòmics.
- [ ] Mostrar estrelles brillants, constel·lacions, planetes, Sol, Lluna,
  eclíptica i horitzó; deixar catàlegs profunds i imatges astronòmiques com a
  capes opcionals per no saturar la vista inicial.
- [ ] Afegir un control temporal amb «Ara», posta de sol, inici de la nit
  astronòmica, franges horàries i data; qualsevol canvi ha d’actualitzar el cel
  i mantenir visible la zona horària utilitzada.
- [ ] Permetre cercar una localitat mitjançant el geocodificador existent,
  confirmar-ne el nom i les coordenades i tornar fàcilment a Sant Celoni. La
  geolocalització del dispositiu serà opcional i requerirà una acció explícita.
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

Decisió de producte: el visor principal utilitzarà Stellarium Web Engine, no un
mapa estel·lar simplificat ni un iframe genèric. La integració ha de conservar
la capacitat visual del motor i afegir-hi la capa local de l’Observatori.

- [ ] Construir una prova tècnica integrada amb la versió fixada del motor,
  WebAssembly i actius necessaris; no dependre de l’etiqueta `latest` ni d’un
  servei remot sense control de versió.
- [ ] Configurar Sant Celoni com a observador inicial i sincronitzar latitud,
  longitud, altitud, data, hora i zona horària amb els controls del portal.
- [ ] Exposar orientació lliure de 360°, camp de visió, zoom, pantalla completa,
  punts cardinals i accions ràpides «nord», «est», «sud», «oest» i «zenit».
- [ ] Permetre seleccionar una localitat i una hora sense reconstruir el visor,
  i oferir una acció clara per tornar a «Sant Celoni · ara».
- [ ] Definir una vista inicial neta: atmosfera, paisatge o horitzó, estrelles,
  planetes i línies de constel·lació. Catàlegs profunds, art de constel·lacions i
  imatges HiPS quedaran en un mode avançat opcional.
- [ ] Integrar sobre Stellarium les targetes pròpies «Aquesta nit», qualitat
  meteorològica, objectes recomanats i millor franja, sense alterar el significat
  de les dades astronòmiques del motor.
- [ ] Carregar el motor només quan el visor entri a la pantalla o l’usuari premi
  «Explora el cel»; mostrar abans una previsualització lleugera i mantenir les
  targetes actuals funcionals si WebGL, WebAssembly o els catàlegs fallen.
- [ ] Mesurar memòria, transferència, temps d’arrencada i estabilitat en iPhone,
  Android i ordinador; descarregar resolució o capes abans que degradar tota la
  pàgina «Cel».
- [ ] Revisar i complir AGPL-3.0: conservar avisos i atribució, documentar la
  versió, publicar el codi font corresponent de qualsevol modificació del motor
  i revisar separadament les llicències dels paisatges, textures i cultures del
  cel utilitzats.
- [ ] Adaptar CSP, service worker i memòria cau només per als dominis i actius
  indispensables, amb una estratègia explícita per a versions i mode offline.
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

- [ ] Valorar un subdomini propi per a la càmera només si simplifica CSP,
  presentació pública o independència del Worker sense duplicar infraestructura.
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

1. **Confiança:** Sobre l’Observatori, autoria, equipament i `security.txt`.
2. **Dades obertes:** decisió de llicència, abast, Dataset i documentació.
3. **Utilitat:** FAQ, indicadors pràctics i frase humana de situació actual.
4. **Editorial:** 2–3 històries permanents i primera guia local.
5. **Climatologia:** primer resum mensual permanent i compartible.
6. **SEO verificat:** Search Console, Rich Results i HTML inicial per ruta només
   si les proves ho exigeixen.
7. **Qualitat tècnica:** tipografies locals, dispositius, lector de pantalla i
   refinament offline.
8. **Educació:** primera fitxa pròpia d’Aula oberta.
9. **Cel nocturn:** Stellarium integrat, càrrega diferida, prova en mòbil,
   accessibilitat i validació astronòmica.
10. **Experiments:** continuar acumulant mostres de Fonta, XEMA i nowcasting.

Les millores d’un paquet s’han de desplegar, mesurar i documentar abans d’obrir
el següent. L’objectiu no és tenir més funcions que altres portals, sinó ser la
font local més clara, fiable, útil i transparent.
