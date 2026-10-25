# Registre de decisions

## ADR — Domini públic propi per a la càmera (proposta, 2026-10-25)

- `camera.fontanillas.cat` apuntarà al Worker `fonta-meteo` existent, sense un segon Worker ni còpia de l'R2. El nom només publica imatges i vídeos de la càmera amb GET o HEAD; rebutja qualsevol altra ruta o mètode abans d'arribar al router general.
- El web intenta carregar la miniatura des del domini propi. Si no respon, conserva la imatge i els enllaços al domini `workers.dev` actual. Les pujades de la Raspberry, OAuth i les API no canvien d'URL.
- L'ordre de desplegament és Worker amb la barrera de host, després web, i finalment el domini personalitzat a Cloudflare un cop autoritzat. Si falla, es treu el domini personalitzat: el web continua servint la càmera per la URL anterior. La prova de previsualització ha de comprovar que `/camera/nord/latest.jpg` respon i que `/admin/camera-timelapses` i `/camera/nord/upload` queden rebutjats.

## ADR — Mapa XVPCA sota demanda i avisos de portada (2026-10-24)

- El mapa d'estacions consulta directament el fitxer públic del visor de la Generalitat quan l'usuari obre la pestanya, sense duplicar dades a Worker o D1. Les coordenades, lectures, hores i categories provenen de la font oficial; el mapa s'actualitza en tornar-hi després de quinze minuts. Si la font falla, queda l'enllaç al visor complet.
- Les estacions amb registres de més de tres hores no mostren lectures antigues. Un contaminant sense categoria ICQA no es transforma en categoria inventada.
- La drecera d'avisos de portada es rendeix independentment de la pàgina de detall. Només una resposta oficial correcta i sense avisos pot produir l'estat «Sense avisos»; un error es mostra com a verificació no disponible.

## ADR — ICQA local i mesures oficials a la fitxa ambiental (2026-10-24)

- La fitxa principal de Medi Ambient substitueix els camps de concentració CAMS per les sis lectures disponibles de l'estació XVPCA ES1275A. La font, l'hora, les unitats i el caràcter provisional queden visibles al costat de les targetes.
- L'ICQA és categòric: es mostra la categoria més desfavorable publicada entre els contaminants recents mesurats, seguint la metodologia de la Generalitat. No es converteix en un número europeu ni es dedueix a partir de CAMS. Si les mesures falten o caduquen, el resum queda sense dada local.
- La radiació UV i el pol·len conserven les seves fonts pròpies, etiquetades de forma independent. La càmera continua mostrant els tres contaminants de l'estació i el CO₂ global separat.

## ADR — Estació oficial XVPCA de Sant Celoni per a les mesures d'aire (2026-10-24)

- El fitxer públic que alimenta el visor oficial de la Generalitat conté l'estació `ES1275A` de Sant Celoni, data d'actualització i mesures provisionals per contaminant. La pàgina de medi ambient mostra aquestes lectures separades de l'índex i les estimacions CAMS.
- La càmera només dibuixa NO₂, O₃ i PM10 si el registre de l'estació té menys de tres hores i la lectura de cada component correspon a l'hora publicada. No substitueix una absència amb CAMS. El color representa la categoria `qualitat` publicada pel visor, no un llindar recalculat per nosaltres.
- PM10 és una mitjana de les darreres 24 hores segons el visor oficial; la resta són lectures horàries. Les dades són provisionals i poden ser revisades. El CO₂ de Mauna Loa continua completament separat.

## ADR — Colors dels contaminants a la càmera (2026-10-24)

- Els cercles NO₂, O₃ i PM10 classifiquen la concentració horària estimada per CAMS Europe via Open-Meteo segons els llindars per contaminant de l'índex europeu de qualitat de l'aire revisats el 2024. S'empren sis franges, de bona a extremadament dolenta, sense calcular un índex agregat amb només tres contaminants.
- La imatge mostra només etiqueta, valor i color per no tapar el cel; la pàgina de la webcam manté font, unitats, escala i límits. Els colors no provenen d'un sensor local, no són el mapa oficial de l'EEA ni constitueixen un avís de salut pública. Si la dada és absent o antiga, el cercle no es mostra.

## ADR — Stellarium oficial i aïllat per al planetari local (2026-10-23)

- El visor principal incrusta l’aplicació oficial de Stellarium Web en un marc
  aïllat; no reimplementa ni modifica el motor astronòmic.
- Els controls de l’Observatori passen localitat, hora i orientació mitjançant
  els paràmetres públics del visor. Qualsevol canvi rellevant recarrega només el
  marc, i el moviment 360° continua dins l’aplicació oficial.
- La càrrega requereix una acció explícita. El service worker conserva la
  carcassa i l’alternativa textual, però no desa el motor ni els catàlegs
  astronòmics pesants a la memòria cau offline.
- Aquesta decisió evita redistribuir el frontal, el WebAssembly i els catàlegs,
  i elimina els errors CORS detectats en el prototip local. La pàgina explica
  que en activar el visor s’estableix una connexió amb Stellarium i enllaça la
  seva privacitat, llicència i codi font.
- Les targetes del Sol, la Lluna, la qualitat nocturna i els esdeveniments són
  la degradació accessible si WebGL, WebAssembly o els catàlegs fallen. La capa
  «Aquesta nit», l’alternativa objecte-direcció-altura, les mesures mòbils i la
  validació astronòmica continuen com a feina posterior.

## ADR — Confiança multimodel, pesos locals i satèl·lit sense duplicacions (2026-10-11)

- Open-Meteo continua sent el gateway numèric públic: s’hi afegeix l’ensemble
  ICON per mesurar dispersió, no una segona previsió paral·lela ni Meteomatics
  de pagament. AEMET i Météo-France continuen com a fonts oficials específiques.
- La confiança visible combina acord determinista i dispersió de membres. El
  rang mostrat és central i la proporció de membres amb pluja és descriptiva;
  no es presenta com una certesa ni com un avís oficial.
- El Worker congela Best Match, ECMWF, ICON, GFS i AROME HD per model i horitzó.
  Els pesos locals són inversos a l’error i exigeixen almenys set casos reals
  comparables. No es reconstrueix l’històric ni s’altera la previsió operativa
  abans d’acumular mostra suficient.
- El Pla Alfa conserva el significat de risc i restriccions oficials. NASA FIRMS
  mostra deteccions tèrmiques observades, que poden tenir falsos positius i no
  confirmen per si soles un incendi. No generen alertes ni publicacions socials.
- La clau FIRMS és un secret opcional del Worker. La web es degrada amb un
  missatge explícit mentre no estigui configurada. EUMETSAT es manté com a visor
  oficial extern per evitar duplicar una ingestió satel·litària sense necessitat.

## ADR — Timelapses periòdics des de la ubicació definitiva (2026-10-12)

- Confirmada la ubicació definitiva, la Raspberry genera cada dia a les 00:20
  el vídeo del dia anterior. El temporitzador és local, persistent i reversible;
  no depèn d'obrir ports ni d'una entrada des d'Internet.
- La prova MP4 usa la mateixa credencial revocable de pujada de la càmera i
  manté una còpia diària i la previsualització més recent al bucket privat.
- Els vídeos corresponents a dilluns, dimecres i divendres es lliuren l'endemà
  a Instagram, Facebook, TikTok via Buffer i YouTube via un workflow dedicat.
  Els quatre canals es registren per separat i els intents pendents es reprenen
  sense repetir els canals ja confirmats.
- L'administració permet previsualitzar qualsevol dia i publicar-lo manualment
  als quatre canals amb confirmació explícita. X queda fora d'aquest format.
- Abans de pujar cap derivat públic es difuminen les cases immediates amb sis
  trams moderats que segueixen millor la silueta urbana. L'original net queda
  exclusivament a l'arxiu local privat.

## ADR — Càmera local amb pujada sortint i original privat (2026-10-07)

- La Raspberry inicia totes les comunicacions cap al Worker. No s'obren ports
  del router ni es publiquen RTSP, IP local o credencials de la Reolink.
- La pujada usa una credencial pròpia revocable, diferent de l'administració i
  de les xarxes socials. El Worker només accepta JPEG complets dins del límit
  acordat i valida una hora de captura recent.
- R2 és privat. L'únic recurs públic inicial és l'últim JPEG de la càmera nord;
  la marca, les retallades, els timelapses i l'arxiu públic seran derivats i no
  substituiran la imatge mestra neta.
- Rollback: eliminar la ruta del Worker, revocar `CAMERA_UPLOAD_TOKEN` i retirar
  el binding `CAMERA_BUCKET`; la captura local de la Raspberry continua intacta.

## ADR — Un únic avís social i vídeo només si aporta evolució (2026-10-04)

- La targeta estàtica Meteocat és la publicació automàtica canònica de cada
  avís. El mapa comarcal és l’element visual principal i el text llarg queda a
  la descripció social.
- No es genera un Reel a partir d’una sola fotografia ni es repeteix la mateixa
  alerta en un segon format. Un vídeo futur exigirà canvis verificables entre
  franges oficials, nivell taronja o vermell, i una clau de deduplicació pròpia.
- Qualsevol animació territorial haurà de representar les dades de cada franja
  de Meteocat, no interpolacions ni trajectòries inventades.

## ADR — Referència aerobiològica XAC per a Sant Celoni (2026-09-29)

- La recomanació directa de la XAC/UAB estableix Bellaterra com a referència
  principal per a Sant Celoni i Girona —o Manresa— com a senyal complementari
  de vegetació més humida. El producte usa Girona per defecte i Manresa només
  com a reserva identificada si Girona no està disponible.
- No es calcula cap mitjana ni un nivell sintètic entre estacions. Cada valor
  conserva estació, tàxon, tipus, nivell, tendència i període. La interfície diu
  que és una referència territorial, no una mesura feta a Sant Celoni.
- Només s’automatitza la predicció setmanal publicada a l’API oficial. Les
  gràfiques de dades reals no s’extreuen automàticament perquè les condicions
  d’ús ho exclouen. Llicència i atribució: CC BY-NC-SA 4.0, PIA–XAC / UAB.
- El Worker només actua de proxy restringit per Bellaterra, Girona i Manresa:
  valida mida, llicència i estructura mínima, aplica memòria cau i no desa
  dades a D1. El navegador aplica el parser estricte compartit amb les proves.
- La capa web pot activar-se després de staging. Les publicacions socials
  romanen bloquejades fins a revisar una mostra real i acordar llindar,
  freqüència, text i composició visual; no es pot interpretar un nivell com a
  diagnòstic ni com a risc homogeni per a tota la població.

## ADR — CECAT com a actualització de risc local complementària (2026-09-28)

- Meteocat continua sent l'única font de les publicacions anomenades «avís meteorològic». CECAT/Protecció Civil s'incorpora com una família diferent: «actualització de risc local», mai com un segon avís ni com una probabilitat de pluja. Aquesta decisió precisa i amplia l'ADR de baixa freqüència del 31 d'agost.
- El Worker consulta cada 30 minuts el conjunt oficial de plans actius i només accepta INUNCAT actiu amb PDF al domini oficial `documents.dadesobertes.gencat.cat`. D1 reclama cada franja i cada comunicat abans de disparar cap processament.
- GitHub Actions extreu els mapes incrustats del PDF oficial, converteix UTC a `Europe/Madrid` i avalua Sant Celoni amb un entorn aproximat de 12 km. Verd i groc no generen peça; només taronja o vermell. Estructura, colors, dates o mapes desconeguts fallen de manera tancada.
- La targeta conserva sense recolorir els quatre mapes oficials del dia, els presenta en una graella 2 × 2 amb les hores convertides a Sant Celoni, marca l'àrea local, acredita CECAT/Protecció Civil i indica que són mapes de risc, no de probabilitat. Només es genera si alguna franja activa o futura és taronja o vermella. Si ja existeix un avís comarcal Meteocat per a la data, el text diu explícitament que el detall local el complementa.
- La reserva de processament identifica cada PDF oficial; l'esborrany social es deduplica per data, fenomen i perfil complet de les quatre franges. Un dispatch acceptat o incert no es repeteix automàticament; els errors confirmats tenen com a màxim tres intents espaiats. La cua social conserva la deduplicació i la recuperació per canal existents.
- `SOCIAL_CECAT_LOCAL_RISK_ENABLED` controla detecció i processament; `SOCIAL_CECAT_LOCAL_RISK_AUTOPUBLISH_ENABLED` controla l'enviament. Tots dos neixen desactivats. El desplegament inicial activa només detecció/revisió; l'autopublicació requereix una segona autorització humana després d'una mostra real correcta.
- Detall operatiu, riscos, validació i rollback a `docs/CECAT-LOCAL-RISK.md`.
- El registre de plans actius també es pot consultar públicament a la pàgina
  d’Avisos. Per defecte només acredita «Actiu a Catalunya»; la menció de Sant
  Celoni exigeix una verificació local vigent del circuit anterior. Aquest bloc
  no activa notificacions ni publicacions i no canvia l’avís Meteocat.

## ADR — Previsió social per franges sense allargar els vídeos (2026-09-17)

- Objectiu i acceptació: tres escenes consecutives de matí (06–12 h), tarda (12–19 h) i vespre (19–24 h), avui al vídeo matinal i demà al del vespre. Conservar les sis escenes i el límit de 30 segons; mantenir observació, gràfica tèrmica, tendència i animació de pluja. La targeta del migdia omet el matí i comença a les 14 h.
- Càlcul compartit pur a `src/core/forecast-dayparts.js`. Temperatura i codi meteorològic usen instants `[inici,final)`; probabilitat de pluja i ratxa usen els extrems `(inici,final]`, perquè descriuen l’hora precedent. La darrera franja inclou la probabilitat i ratxa de mitjanit del dia següent.
- Font del contracte horari: [documentació oficial d’Open-Meteo](https://open-meteo.com/en/docs). Mostrar explícitament «màx. horària»: no sumar probabilitats ni presentar-ne el màxim com a probabilitat de tot el període.
- Símbol: fenomen significatiu de més impacte quan existeix; si només hi ha cel sec, condició predominant amb empat a favor del cel més cobert. Fenomen intermitent indicat com a possibilitat. No és un avís oficial. Dades incompletes: ocultar la mètrica afectada amb «—» i marcar incompletes, sense substituir-les pel resum diari.
- Compatibilitat: camps diaris existents conservats, `dayparts` és additiu dins del JSON de l’esborrany. Sense canvis d’esquema D1, consultes D1 addicionals, secrets, horaris, reserves, recuperacions ni canals. Una sola consulta horària/diària al proveïdor, amb la memòria cau existent de 15 minuts al Worker. Esborranys antics conserven el renderitzat anterior i els recursos R2 ja generats no es reescriuen.
- Rollback: revertir aquest paquet en Worker i generador/workflow conjuntament. Els JSON nous continuen llegibles pel codi anterior perquè els camps diaris persisteixen i el codi antic ignora `dayparts`. No repetir ni eliminar publicacions durant el desplegament; validar primer un esborrany de staging sense enviament.
- Verificació local: proves de límits, mitjanit, canvi d’any i DST, franges seques/plujoses, camps absents, textos curts i constructor real d’esborrany amb fronteres simulades; suite completa, compilació Wrangler `--dry-run`, render local amb el mateix filtre del workflow i comprovació visual amb Chrome. Evidència operativa a `docs/DAYPARTS-VALIDATION-2026-09-17.md`.

## ADR — Publicacions astronòmiques verificades i condicionades (2026-09-11)

- El calendari visible i les publicacions comparteixen un únic catàleg; no es mantenen dues llistes de dates.
- Els equinoccis i solsticis publiquen l’instant oficial i expliquen que no impliquen un canvi meteorològic sobtat.
- Cada fenomen anual confirmat genera un avanç dos dies abans. El recordatori només es publica quan la previsió local de la finestra d’observació queda per sota dels llindars de núvols i pluja.
- Una data genèrica o encara no confirmada per a l’any pot aparèixer al calendari, però queda exclosa de l’automatització amb `social:false`.
- La família reutilitza la cua D1, la deduplicació i la recuperació per canal. Les imatges es distribueixen als sis canals estàtics; TikTok i YouTube continuen separats fins que existeixi una peça de vídeo justificada.

## ADR-001 — Sistema híbrid, no substitució total

**Estat:** acceptada, 2026-08-22.

El model local s'utilitza per privacitat, velocitat i tasques acotades. Codex/ChatGPT continua intervenint en arquitectura, seguretat, migracions i revisió. Motiu: preservar qualitat és un problema de context, proves i governança, no només de mida del model.

## ADR-002 — Git és la memòria oficial

**Estat:** acceptada, 2026-08-22.

Les decisions duradores viuen al repositori i als PR. Els xats són context d'entrada, però no són la font de veritat.

## ADR-003 — `main` protegida i canvis via PR

**Estat:** acceptada, 2026-08-22.

Cada canvi es fa en una branca curta, supera comprovacions i es revisa abans de fusionar. Els canvis d'alt risc requereixen staging i aprovació humana explícita.

## ADR-004 — Producció separada del desenvolupament local

**Estat:** acceptada, 2026-08-22.

Wrangler s'instal·la al projecte i els entorns es declaren explícitament. No es versionen secrets ni identificadors provisionals. La configuració d'exemple no és desplegable fins que es completen els valors reals i es revisa contra la configuració existent de Cloudflare.

## ADR-005 — Llamafile queda com a opció secundària

**Estat:** acceptada, 2026-08-22.

Ollama és el servidor local principal perquè facilita gestionar models i integrar agents. Llamafile pot servir per proves portables d'un model concret, però no serà el centre del flux.

## ADR-006 — AROME HD per a l'evolució territorial de pluja a curt termini

**Estat:** acceptada, 2026-08-30.

Els vídeos del matí i del vespre utilitzen AROME France HD per representar quatre franges de precipitació sobre el nord-est de Catalunya. La resolució espacial no s'ha de presentar com una certesa local: la peça indica sempre que és una estimació orientativa del model. Si AROME falla, s'utilitza Open-Meteo Best Match i, si tampoc hi ha graella, una reserva exclusivament puntual per a Sant Celoni; mai no s'extrapola una dada puntual com si fos un mapa territorial.

## ADR-007 — AROME HD públic i candidat Fonta sense trencar la sèrie

**Estat:** acceptada, 2026-10-04.

La previsió pública compara AROME France HD amb ECMWF, GFS i ICON només dins
del seu horitzó disponible. AROME France continua dins l'algoritme Fonta 0.2.0
per preservar la comparabilitat de les captures ja congelades. AROME HD es
recull com a candidat experimental addicional, però queda exclòs del blend,
de la correcció i de qualsevol promoció fins a disposar de prou dies
prospectius aparellats. Canviar el model base exigirà una nova versió del
protocol, llindars previs i revisió humana.

## ADR-008 — Visor AROME local mostrejat, no raster natiu

**Estat:** acceptada, 2026-10-04.

El visor públic consulta AROME France HD a través d’Open-Meteo en una graella
regular de 49 punts sobre el Baix Montseny i presenta temperatura, precipitació,
vent i nuvolositat amb pas horari i un màxim de 48 hores. Les cel·les només
representen el valor del punt mostrejat: no s’interpolen ni es presenten com el
raster complet d’1,5 km de Météo-France. La interfície mostra font, escala,
instant i nombre de punts; si la graella falla, manté disponibles la comparació
numèrica i els visors globals. El símbol diari d’AROME, quan falta a l’origen, és
una síntesi explícitament derivada de la pluja acumulada i la nuvolositat mitjana.

## ADR-009 — Gateway segur per als productes directes de Météo-France

**Estat:** acceptada, 2026-10-05.

Les claus de Météo-France només existeixen com a secrets de GitHub i del Worker;
mai no s'envien al navegador ni formen part de les claus públiques de memòria cau.
El Worker valida models, variables, dimensions i capes mitjançant llistes blanques,
i cada producte pot degradar-se sense fer caure la previsió principal.

AROME, AROME-PI i ARPEGE es poden visualitzar quan ofereixen WMS. PE-AROME
i PE-ARPEGE són productes WCS/GRIB i es presenten com a fonts probabilístiques,
no com a mapes equivalents. No entren al pes del model Fonta fins que existeixi
una ingestió numèrica privada, predicció congelada, verificació prospectiva i
una decisió de versió separada.

**Esmena, 2026-10-20:** PIAF es retira del circuit operatiu. La credencial
configurada era present i vigent, però el servei professional no va arribar a
donar una resposta verificable i retornava HTTP 520. No es continua sondejant,
no apareix al selector i no bloqueja la validació dels cinc productes reals.
## ADR-010 — Windy com a explorador visual, separat del càlcul local

**Estat:** acceptada, 2026-10-17.

Windy és la porta principal per explorar visualment models globals i regionals
sobre Sant Celoni. Els enllaços poden incloure ECMWF, GFS, ICON, AROME, NEMS o
ALADIN quan Windy els ofereixi, però la seva presència al selector visual no els
incorpora al blend, als pesos locals ni a la verificació de l’Observatori.

La comparació numèrica pròpia continua limitada a les fonts amb ingestió,
predicció congelada i verificació prospectiva. Els visors directes de
Météo-France es mantenen com a circuit tècnic independent i totes les vistes
externes conserven l’atribució i l’enllaç a la font original.

## ADR-011 — ESTOFEX geomètric i WMS EUMETSAT restringit

**Estat:** acceptada, 2026-10-18.

ESTOFEX només es destaca localment després de llegir els polígons XML vigents:
Sant Celoni ha de quedar dins del polígon o la seva vora ha de passar a menys de
120 km. El nivell més alt proper preval sobre una zona de tro, però sempre es
presenta com a context europeu no oficial; Meteocat, AEMET, Protecció Civil i
112 continuen sent les fonts operatives.

EUMETView s’integra mitjançant una passarel·la WMS del Worker. El navegador no
pot triar cap URL arbitrària: només s’accepten tres capes i tres regions
predefinides. La resposta es desa temporalment, manté l’atribució i falla de
manera visible sense convertir una absència d’imatge en una absència de fenomen.

# ADR — Automatització editorial de baixa freqüència i episodis locals (2026-08-31)

- Les noves publicacions no s’activen amb el desplegament: cada família té un interruptor explícit i es valida gradualment.
- Un resum només es crea amb prou cobertura; un extrem de l’arxiu local necessita almenys 90 dies i no es presenta com a rècord climàtic oficial.
- Els avisos oficials continuen sent exclusivament els de Meteocat. Les lectures destacades de l’estació, la pols CAMS i la tendència estacional es descriuen com observació o model, mai com a avís.
- Les dades externes escollides són l’ACA per a sequera, CAMS Europe per a pols i ECMWF Seasonal per a tendència estacional. Cada targeta explicita la font, escala i limitació principal.
- La pols queda bloquejada mentre `SOCIAL_DUST_THRESHOLD_UG_M3` sigui `0`; el llindar editorial s’ha d’acordar abans d’activar-la.
- Es reutilitza la cua social existent, amb deduplicació D1 i recuperació de canals pendents, per evitar una segona arquitectura de publicació.

**Activació de producció, 2026-08-31:** s’activen els resums periòdics a les 12:00, els episodis locals, els canvis ambientals a les 12:00 i les efemèrides a les 17:00. El llindar editorial de pols CAMS queda fixat en 50 µg/m³ durant almenys tres hores consecutives. Els avisos socials de Meteocat continuen pendents de rebre i configurar la clau oficial de l’API.

# ADR — Vídeos automàtics per canvis de temps previstos (2026-09-07)

- Un model sol no pot iniciar una peça. Cal coincidència d’almenys dos entre ECMWF, GFS i ICON per al mateix fenomen i dia.
- Els llindars inicials són deliberadament conservadors: canvi de temperatura mitjana diària de 5 °C, pluja diària de 5 mm o probabilitat del 65% amb almenys 2 mm, ratxes de 55 km/h amb augment de 12 km/h, o senyal de tempesta amb probabilitat de precipitació mínima del 45%.
- Es crea com a màxim una peça per tipus d’episodi i data, i dues peces totals en set dies. Un canvi posterior dels models no genera una publicació duplicada.
- La visualització territorial es calcula amb una graella real del model coincident. Si cap model retorna la graella, no es fabrica ni s’interpola una animació aparent: el flux falla i queda pendent de revisió.
- El text parla en condicional, explica quants models coincideixen i inclou sempre «Predicció de models, no avís oficial», amb accés als avisos de Meteocat i Protecció Civil.
- Es mantenen separats tres interruptors: detecció i esborrany, generació de vídeo i publicació. Els tres neixen desactivats; primer es valida una previsualització real i només després es pot autoritzar la publicació automàtica.
- La publicació es coordina amb D1 i R2, recorda els canals ja completats i només reprèn els pendents. Això evita duplicats si una plataforma respon amb retard o falla a mig procés.
- Un flux de vídeo que GitHub ja ha acceptat no es torna a disparar automàticament. Si queda interromput, es revisa i es rellança manualment amb el mateix esborrany: és preferible perdre temporalment una peça que duplicar una publicació que potser ja ha arribat a YouTube.

# ADR — Pressupost mensual de consultes Meteocat (2026-08-31)

- El pla oficial permet 100 consultes mensuals de predicció; el cron general de cinc minuts no pot consultar directament l’API SMP.
- Es fan tres consultes diàries persistents: 06:30 per al dia actual, 12:30 per a l’endemà i 18:30 novament per al dia actual. En un mes de 31 dies el màxim és 93, i se’n reserven set per a comprovacions excepcionals.
- D1 reclama cada franja abans de consultar. Una execució repetida o fallida no torna a consumir quota dins la mateixa franja.
- El recompte visible a l’administració és el registrat pel Worker, no substitueix el comptador oficial de Meteocat i no inclou consultes manuals alienes al Worker.

# ADR — Col·laboracions tècniques transparents (2026-09-01)

- La primera proposta a fabricants demana material cedit o en préstec i suport tècnic, no una aportació econòmica.
- Qualsevol cessió, préstec o accés especial es declara de manera visible a la pàgina o contingut corresponent.
- La marca no controla el text, les dades ni les conclusions, i no se li promet una ressenya positiva ni xifres d’audiència no acreditades.
- Abans d’integrar un producte es revisen compatibilitat, manteniment, propietat de les dades, llicències, atribució i condicions de retorn.
- La pàgina pública de col·laboracions manté l’estat actualitzat, inclosa l’absència de patrocinis comercials actius.
