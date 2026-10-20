# Roadmap viu

Actualitzat el 20 d’octubre de 2026. Aquest document conté únicament feina
pendent, aplicable i amb un criteri de finalització observable. Les fases
completades es documenten a [`CHANGELOG.md`](CHANGELOG.md), als informes de
`docs/` i a l’historial Git.

## Principis

- Mesurar abans de reestructurar: cap migració gran es justifica només per una
  auditoria teòrica.
- Observació, predicció, context i avís oficial han de continuar clarament
  separats.
- No reconstruir prediccions passades ni donar pes a una font nova sense dades
  prospectives comparables.
- Les dades guardades o sense connexió sempre han de mostrar-ne l’hora i
  l’origen.
- Les accions que requereixen comptes, credencials, dispositius o una decisió
  editorial es tanquen només amb confirmació humana.

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

## P1 — Qualitat i velocitat de la web

### 1. Mesura de referència

- [ ] Registrar Lighthouse/PageSpeed en mòbil i escriptori per a la portada i
  les seccions Predicció, Radar, Terra, Avisos i Models francesos.
- [ ] Anotar LCP, INP, CLS, pes transferit, JavaScript inicial i recursos externs
  més lents en un informe reproduïble.
- [ ] Contrastar les proves de laboratori amb Core Web Vitals de camp quan
  Search Console disposi de prou trànsit.

**Fet quan:** existeix una línia base repetible que identifica els colls
d’ampolla reals i permet comparar qualsevol canvi posterior.

### 2. Càrrega diferida guiada per dades

- [ ] Corregir primer els recursos que la línia base identifiqui com a
  bloquejants o excessius.
- [ ] Carregar visors, mapes, GIF i integracions externes només en entrar a la
  secció corresponent, sempre que encara generin cost inicial mesurable.
- [ ] Repetir exactament les mateixes proves i conservar només els canvis que
  millorin les mètriques sense trencar la navegació.

**Fet quan:** la portada compleix els objectius acordats de Core Web Vitals i no
carrega cap recurs pesant d’una secció que l’usuari no ha obert.

### 3. Validació en dispositius i accessibilitat

- [ ] Revisar «El temps arreu», Meteocat, XAC, avisos i els visors principals en
  un iPhone, un Android i un ordinador.
- [ ] Comprovar desplegables, pestanyes, reproductors, controls tàctils,
  ampliació de text i orientació de pantalla.
- [ ] Fer una passada completa amb teclat i lector de pantalla pels fluxos
  principals.

**Fet quan:** no hi ha bloquejos funcionals ni problemes d’accessibilitat crítics
en els tres entorns.

## P1 — Navegació, enllaços i indexació

### 1. Enllaços profunds fiables

- [ ] Fer que cada secció actualitzi una URL estable i llegible.
- [ ] Assegurar que recarregar, compartir, enrere i endavant restauren la secció
  correcta, incloses les rutes antigues amb `?page=`.
- [ ] Definir redireccions o compatibilitat perquè cap enllaç existent deixi de
  funcionar.

**Fet quan:** totes les seccions principals es poden obrir directament i la
navegació del navegador funciona com en una web multipàgina.

### 2. Rutes i metadades pròpies

- [ ] Introduir progressivament rutes com `/prediccio`, `/radar`, `/avisos`,
  `/terra` i `/models`, començant per les de més valor públic.
- [ ] Donar a cada ruta títol, descripció, canonical, Open Graph, Twitter Card i
  contingut introductori propis.
- [ ] Generar sitemap i comprovar les rutes amb Rich Results Test i Search
  Console.

**Fet quan:** cada ruta prioritària retorna contingut útil sense dependre de la
navegació prèvia i és indexable per separat. No cal separar físicament tot
l’HTML si la solució manté bon rendiment i accessibilitat.

### 3. Contingut meteorològic indexable

- [ ] Preparar entrades clares per a Sant Celoni, radar del Baix Montseny,
  models, nowcasting, terratrèmols i metodologia del model Fonta.
- [ ] Enllaçar cada explicació amb el visor o la dada operativa corresponent,
  sense duplicar ni inflar textos.

**Fet quan:** una persona o un cercador pot entendre el valor de cada servei
sense executar tota l’aplicació i arribar després al visor adequat.

## P2 — Primera lectura i mode sense connexió

### HTML inicial amb l’última dada coneguda

- [ ] Prototipar una instantània segura de la lectura principal i la previsió
  resumida, generada pel Worker o durant el desplegament.
- [ ] Mostrar sempre hora, font i estat de frescor, i substituir la instantània
  quan arribi la dada en directe.
- [ ] Comparar el prototip amb l’estat actual en temps de primera lectura,
  robustesa i risc de mostrar dades antigues.

**Fet quan:** la informació útil apareix abans que amb el sistema actual, sense
fer passar una dada desada per una observació en directe. No es regenerarà tota
la web cada cinc minuts si una resposta del Worker resol el mateix problema.

### Memòria cau útil i honesta

- [ ] Conservar l’última lectura, previsió consultada i avisos recents que siguin
  segurs per a ús sense connexió.
- [ ] Mostrar de manera inequívoca que són dades desades, amb l’hora original i
  una opció de reintent.
- [ ] Provar connexió lenta, pèrdua de xarxa, recuperació i canvi de versió del
  service worker.

**Fet quan:** la consulta bàsica continua sent útil sense xarxa i mai confon una
dada antiga amb una dada actual. No cal migrar a Workbox si el service worker
actual compleix aquests criteris.

## P2 — Experiments meteorològics

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

## P3 — Millores condicionals

- [ ] Valorar un subdomini propi per a la càmera només si simplifica CSP,
  presentació pública o independència del Worker sense duplicar infraestructura.
- [ ] Valorar una animació lleugera de la webcam només després de mesurar-ne el
  cost, amb preferència de moviment reduït i mantenint la imatge estàtica com a
  opció principal.
- [ ] Separar físicament l’aplicació en múltiples documents o adoptar un
  generador estàtic només si les mètriques mostren que les rutes i la càrrega
  selectiva no resolen el problema.

Aquestes opcions no s’executen mentre no tinguin benefici mesurable, risc
controlat i criteri de finalització. Les idees sense aquests tres elements no
formen part del roadmap.
