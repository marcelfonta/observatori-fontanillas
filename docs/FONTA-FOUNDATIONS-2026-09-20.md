# Fonta: avenç de les quatre fases

Preparació del 20/09/2026, posterior al desplegament del PR 163. No és un
certificat de qualitat predictiva ni una activació de fonts noves.

## Acceptació i abast

- Fonta és l'últim enllaç de «Previsió i risc», després d'Avisos, en mòbil i
  escriptori; sense afegir-li accessos destacats. Revisió PWA `fonta-lab-v3`.
- Cron, proves manuals i qualitat científica són evidències diferents.
- Comparadors prospectius amb els mateixos dies i sense reconstrucció posterior.
- Single Runs separat del pilot diari; cap zero inventat ni canvi d'unitats.
- Exportació local verificable, sense esborrar l'origen ni contractar serveis.
- Sense canvis al Worker, D1, socials, secrets ni horaris de cap automatització.

## 1. Execució programada

`node scripts/fonta/audit-schedule.mjs` consulta només metadades de les últimes
50 execucions de `fonta-shadow.yml`, amb el login existent de `gh`. No inicia
jobs ni desa tokens. Distingeix absència d'evidència, cua, èxit i error del
darrer cron observat. Una prova manual o un cron antic correcte no garanteixen
el següent. La finestra limitada queda explícita a la resposta.

Comprovació real 20/09 12:56 UTC: zero runs `schedule` observats, només les
proves manuals anteriors. Primera franja pendent: 20/09 a les 20:10 UTC
(22:10 a Catalunya); pot endarrerir-se a GitHub. Aquesta franja pm ja té una
captura immutable, per tant el collector l'ha de reutilitzar sense HTTP. La
primera oportunitat programada per a una nova captura am és el 21/09 a les
08:10 UTC. Cal comprovar els dos comportaments quan es produeixin; no s'ha
creat cap monitor ni nou programador.

## 2. Single Runs: contracte horari separat

Mòdul pur `src/core/fonta-single-runs.js` i prova local explícita:

```sh
node scripts/fonta/probe-single-runs.mjs --fetch build/fonta-prova-NOVA
```

El directori ha de ser nou: mai barrejar amb `fonta-data`. Màxim tres peticions,
sense reintents, una per model explícit. Política de prova: run de les 00 UTC
del dia de la consulta i objectiu demà; no cercar a posteriori el run més favorable.
No és un selector operatiu de sortides ni un substitut del collector actiu.

Conserva URL, run sol·licitat, recepció, original, SHA-256 i graella. El proveïdor
identifica el run amb el paràmetre de la petició; no deduïm la inicialització de
l'hora de recepció. `publiclyAvailableAt:null`: la recepció només prova que la
sortida era disponible com a màxim en aquell instant. Un hash detecta canvis
accidentals, no és una signatura del proveïdor.

Agregació explícita de **mostres horàries** del dia Europe/Madrid: 23/24/25
instants, incloses les dues hores civils repetides a la tardor. Si falta una hora
o hi ha un nul/valor invàlid, els extrems queden nuls i la cobertura incompleta.
Hores duplicades, desordenades, unitats inesperades i runs invàlids es rebutgen.
No es comparen aquests extrems amb els del protocol diari v1. L'objectiu
observacional horari coherent encara s'ha de definir i validar abans d'activar v2.

Prova real del 20/09, run `2026-09-20T00:00`, objectiu 21/09: IFS 0,25°,
ICON-EU i AROME France retornen 24/24 hores vàlides del dia objectiu. Això és
compatible amb haver trobat nuls fora del dia objectiu en l'estudi anterior:
no es completa ni es corregeix cap nul. Originals només a `build/`, no publicats.
Tres respostes correctes no demostren disponibilitat estable cada matí.

Font: [documentació Single Runs d'Open-Meteo](https://open-meteo.com/en/docs/single-runs-api).

## 3. Comparació prospectiva aparellada

Camp additiu `frozenComparison`, protocol `fonta-paired-daily-v1`, dins de les
**noves** captures v1, només a la finestra 08:00–09:59 UTC quan hi ha candidat
Fonta i persistència disponibles. No augmenta consultes ni inicia una publicació.
Guarda a la mateixa captura Best Match, IFS, ICON, AROME, mitjana, persistència
i Fonta, versió, revisió del codi, dates d'entrenament i disponibilitat de la
persistència. El paquet té un hash comprovat en llegir l'arxiu.

L'informe avalua exclusivament aquests valors congelats, primera captura apta
per data, contra la primera observació posterior que passa QC. Tots set mètodes
comparteixen les mateixes dates. Informa MAE, biaix i RMSE per màxima i mínima,
comptador de paquets invàlids i dates auditables. No omple els paquets absents
d'arxius antics ni recalcula els comparadors després d'observar el resultat.

`pairedProspective` és additiu: es mantenen el backtest i la sèrie congelada
anterior, identificada com a exploratòria no aparellada. Web antiga compatible;
web nova també accepta informes antics. No es canvien ni s'abaixen els 30 dies
d'entrenament, els filtres ni l'algoritme 0.1.0.

Època instrumental provisional `roof-red-tiles-2026-09-unreviewed`: no és una
homologació. Un canvi d'emplaçament/sensor requerirà versió/època nova. Aquest
seguiment **no inicia el holdout de promoció**: `holdout:false`,
`promotionAllowed:false`. Falta revisar l'estació i preregistrar el protocol
independent i la incertesa estadística abans de prendre decisions operatives.

## 4. Arxiu portable i candidates territorials

```sh
node scripts/fonta/export-archive.mjs export build/fonta-data build/fonta-export-NOU
node scripts/fonta/export-archive.mjs verify build/fonta-export-NOU
node scripts/fonta/report.mjs build/fonta-export-NOU build/fonta-restored-status.json
```

Copia exactament els JSON de captures, no `.git`, secrets ni l'informe derivat.
Manifest amb noms restringits, mides i hashes de fitxer complet; també verifica
els hashes interns de les fonts i els contractes prospectius. Rebutja symlinks,
sobreescriptures, path traversal, fitxers inesperats i alteracions. Destinació
nova obligatòria; en cas de fallada pot quedar una exportació incompleta que no
superarà la verificació. Origen intacte. Regenerar l'informe **fora** del paquet.

Assaig real amb la primera captura del pilot: exportació i lectura verificades,
412.534 bytes intactes; informe regenerat amb una captura i zero dies aparellats.
No és encara una còpia remota independent ni una migració a R2. Abans del límit
180 captures/100 MiB cal escollir destí, pressupost, accés i recuperació provada.

### Preselecció oficial, no estacions ja integrades

Metadades XEMA consultades el 20/09/2026. Totes consten operatives en aquella
consulta. Altitud és la publicada al catàleg, no alçada del sensor.

| Codi | Estació | Altitud (m) | Paper que cal estudiar |
| --- | --- | ---: | --- |
| XK | Puig Sesolles (1.666 m) | 1666 | Contrast d'alta muntanya |
| WS | Viladrau | 956 | Contrast d'un altre sector del Montseny |
| VX | Tagamanent - PN del Montseny | 1030 | Contrast de cota elevada |
| UQ | Dosrius - PN Montnegre Corredor | 462 | Contrast amb el massís veí |
| KX | la Roca del Vallès - ETAP Cardedeu | 164 | Candidata a contrast de baixa cota |
| KP | Fogars de la Selva | 42 | Candidata a contrast de baixa cota |

Aquests papers són hipòtesis de selecció, no una classificació topogràfica
verificada. Cap estació substitueix automàticament una referència de fons de
vall a Sant Celoni. Per a cada candidata falten fitxa instrumental, períodes,
variables, cobertura i representativitat; cada previsió s'haurà d'obtenir a
les coordenades pròpies. Reservar estacions independents de l'entrenament.

El catàleg retorna `licenseId: SEE_TERMS_OF_USE`, no una llicència concreta
que puguem donar per revisada. Cal confirmar les condicions del conjunt i
l'atribució abans d'automatitzar-ne reutilització. No es consulta l'API SMP.
Les dades mesurades XEMA tenen estats de validació: no tractar pendent/invalidat
com a veritat validada, ni copiar el llindar diari de representativitat com si
fos equivalent al QC de cinc minuts de Fontanillas.

Fonts: [Meteocat, dades obertes](https://www.meteo.cat/wpweb/serveis/dades-obertes/),
[catàleg oficial d'estacions](https://analisi.transparenciacatalunya.cat/Medi-Ambient/Metadades-estacions-meteorol-giques-autom-tiques/yqwd-vj5e/about_data),
[metadades de llicència i camps](https://analisi.transparenciacatalunya.cat/api/views/yqwd-vj5e.json).

## Posada en servei i rollback

Verificació local: `npm run test:quick` (34 fitxers), `npm run check` (81
fitxers) i `npm run test:browser` (33 proves) superats. Proves de menú a 360,
390 i 1280 px, taula prospectiva desplaçable en mòbil, compatibilitat amb
informes antics, caducitat i errors. Les mètriques de fixtures sintètiques no
es presenten com a resultats reals. Exportació/restauració de la captura real
i tres peticions Single Runs comprovades separadament.

Merge i desplegament només després de revisió humana. El collector existent
guardarà el camp prospectiu additiu en les captures futures amb prou dades;
no cal activar cap font ni nou workflow. Single Runs i exportació continuen
manuals locals. El cron continua pendent d'evidència real.

Rollback: revertir aquest paquet i renovar cache PWA. Captures noves llegibles
pel codi anterior (ignora camps additius); mai reescriure les captures originals.
Cap migració D1 ni Worker. El pilot segueix sense promoció operativa.
