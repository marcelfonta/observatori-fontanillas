# Fonta · arxiu recuperable, Single Runs i XEMA

20/09/2026. Implementació separada; **no substitueix el pilot v1 ni activa
cap publicador**. No hi ha nova versió del Worker, migració D1 ni canvi de PWA.

## 1. Arxiu remot: transport i recuperació

Implementats `scripts/fonta/remote-archive.mjs` i l'extensió de l'exportador:

- Exporta captures originals v1 i, si existeixen, els originals Single Runs de
  `single-runs/AAAA-MM-DD/`. No exporta secrets, Git ni informes derivats.
- Manifest v1 antic compatible. Manifest v2 per al paquet mixt: fins a 180
  captures v1 i 90 dies v2 (540 fitxers), màxim 100 MiB per exportació.
- Revalida hashes interns i torna a normalitzar els originals; no confia en
  resums guardats. Fitxers regulars, sense enllaços simbòlics ni rutes lliures.
- Bucket proposat, privat i separat: `fonta-research-archive`. No reutilitza
  l'espai dels vídeos socials ni el dels altres projectes.
- Claus derivades de SHA-256, originals primer, manifest al final; verifica
  cada pujada amb una lectura completa. Un conflicte s'atura: no es repara
  sobreescrivint-lo. Les execucions repetides reutilitzen objectes idèntics.
- Consulta l'inventari complet del bucket, rebutja inventaris truncats i
  s'atura abans de 100 MiB totals o 1.000 objectes. És un límit del programa,
  **no una quota imposada per R2**: cal un únic escriptor serialitzat i no fer
  pujades externes al mateix bucket. No hi ha cap operació DELETE.
- Restaura en un directori nou, verifica manifest i originals i després
  regenera els informes. No sobreescriu mai l'arxiu actiu. Una restauració
  interrompuda no es dona per bona ni s'utilitza automàticament.
- SHA-256 detecta corrupció; no és una signatura que provi autoria o hora real.

Proves: transport simulat amb viatge complet v1 i mixt v1/v2, idempotència,
corrupció, fallada de xarxa, límits, rutes malicioses i destí existent.
**Encara no s'ha fet una pujada/recuperació real a R2 ni creat el bucket.**
S'ha demanat autorització específica pel recurs i el seu possible cost.

### Activació amb revisió humana

1. Crear el bucket privat Standard, sense domini públic ni regla d'expiració.
   Verificar estat i política al tauler abans de la primera pujada.
2. Credencial dedicada al bucket: lectura/escriptura d'objectes i inventari,
   sense reutilitzar secrets del Worker ni enganxar-los al xat. El transport
   llegeix `FONTA_R2_ACCOUNT_ID`, `FONTA_R2_API_TOKEN` i, si escau,
   `FONTA_R2_JURISDICTION=eu` només de l'entorn. No desa ni imprimeix secrets.
3. Exportar una còpia coherent (cap altre escriptor durant l'exportació):

   ```sh
   node scripts/fonta/export-archive.mjs export build/fonta-data build/fonta-export-NOU
   node scripts/fonta/remote-archive.mjs plan build/fonta-export-NOU
   node scripts/fonta/remote-archive.mjs upload build/fonta-export-NOU --confirm
   node scripts/fonta/remote-archive.mjs restore MANIFEST_SHA build/fonta-restore-NOU
   node scripts/fonta/report.mjs build/fonta-restore-NOU build/fonta-restored-status.json
   node scripts/fonta/hourly-report.mjs build/fonta-restore-NOU build/fonta-restore-NOU/single-runs build/fonta-restored-hourly.json
   ```

   La darrera ordre només si el manifest inclou v2. Conservar l'identificador
   del manifest fora del bucket. Restaurar no activa ni publica res.
4. Només després de comprovar la recuperació real, acordar programació,
   permisos de GitHub i retenció. No s'ha instal·lat una automatització de còpia.

[Tarifa oficial R2](https://developers.cloudflare.com/r2/pricing/), consultada
el 20/09: Standard inclou 10 GB-mes, 1 milió d'operacions A i 10 milions B
gratuïts al mes, compartits pel compte. Fora de franquícia: 0,015 USD/GB-mes,
4,50 USD/milió A i 0,36 USD/milió B, amb arrodoniment d'unitats. No es garanteix
cost zero: també compta el consum dels altres projectes. El límit de 100 MiB
no és una ampliació del pilot autoritzada ni una promesa de durada il·limitada.

## 2. Single Runs: circuit horari independent complet

Protocol `fonta-hourly-nearest-150s-v1`:

- Mateixos tres models explícits (IFS, ICON-EU i AROME) i run de 00 UTC.
- Primera captura completa rebuda entre 08:00 i 09:59 UTC, objectiu demà en
  Europe/Madrid. No triar una altra sortida segons el resultat posterior.
- Recepció anterior a l'inici del dia previst. Run sol·licitat no equival a
  hora de disponibilitat pública; aquesta continua sent desconeguda.
- Previsió horària davant la lectura observada més propera dins de ±150 s;
  en empat, l'anterior. Temps efectiu i desfasament conservats. És una
  aproximació de mostreig declarada, no equivalència instrumental exacta.
- Observacions: filtre diari v1 més totes les 23/24/25 hores, absències,
  lectures invàlides i duplicats contradictoris descartats; sense interpolació.
- Errors MAE/biaix/RMSE horaris i dels extrems d'aquestes mostres horàries.
  La mitjana dels tres models es calcula primer hora a hora. No és l'extrem
  continu del dia ni l'agregat diari del pilot v1. No barrejar-ne les mètriques.
- Tres models i mitjana avaluats sobre els mateixos dies/hores. Primera
  observació apta coneguda conservada per dia, sense revisions oportunistes.
- Encara **no entrena una correcció Fonta v2**, ni inclou persistència amb
  hores incompatibles en canvis de fus. No acredita millora regional ni holdout.

Workflow nou `fonta-single-runs.yml`, **desactivat per defecte**. Després de
merge i autorització: `FONTA_SINGLE_RUNS_ENABLED=true`. Una execució/dia a
08:20 UTC (10:20 a l'estiu, 09:20 a l'hivern), màxim tres GET, sense reintents,
8 minuts de job, 90 dies i 25 MiB d'originals v2 amb reserva conservadora.
Una captura parcial del mateix dia no es repeteix; queda visible com a degradada.
Si GitHub arriba fora de la finestra, es conserva però s'exclou de puntuacions.

Es desa a `fonta-data/single-runs/` i `single-runs-status.json`. Reutilitza les
observacions originals ja capturades pel pilot: **zero consultes addicionals
d'històric/D1**. Comparteix la concurrència amb v1 per no competir en Git.
No canvia `status.json`, l'algoritme 0.1.0, les cinc consultes del collector v1
ni la web. El total nou seria tres peticions/dia i un job curt addicionals;
cal revisar quota d'Actions i del proveïdor abans d'activar.

### Proves reals, 20/09 a les 13:30 UTC

Reutilitzats els originals existents, sense repetir consultes Single Runs:

- Dia 18/09: 23/24 hores; manca la mitjanit local → descartat.
- Dia 19/09: 24/24 hores; desfasament absolut màxim 43 s → apte.
- La captura Single Runs de les 12:53 UTC és vàlida tècnicament però fora de
  finestra: exclosa; zero dies puntuats i totes les mètriques encara nul·les.

No es reconstrueix retrospectivament una predicció prospectiva ni es presenten
les proves sintètiques com a resultats del model.

## 3. XEMA: auditoria de sis candidates, no activació cega

Lector separat `src/core/fonta-xema.js` i prova explícita
`node scripts/fonta/probe-xema.mjs --fetch DIA_LOCAL DIRECTORI_NOU`.
Sis GET acotats: tres metadades de conjunts, estacions, variable 32 i lectures
del dia local. Cap clau SMP ni consum de quota dels avisos. Originals amb URL,
recepció i SHA-256; última actualització de cada conjunt preservada.

Les metadades oficials indiquen temperatura en °C; `data_lectura` en UTC amb
etiqueta inicial, bases SH/HO, `V` vàlida, `T` en validació o marca absent sense
validació iniciada. No tractar cap d'aquestes darreres com a dada validada.
El lector conserva períodes, rebutja solapaments/duplicats, buits i unitats
incorrectes. **No les puntua contra temperatures instantànies Single Runs**.

Resultat real del **19/09 local**, consultat 20/09:

| Codi | Estació | Altitud oficial | Registres SH | Cobertura | Validada |
| --- | --- | ---: | ---: | ---: | ---: |
| KP | Fogars de la Selva | 42 m | 48 | 100% | 0% |
| KX | la Roca del Vallès - ETAP Cardedeu | 164 m | 0 | 0% | 0% |
| UQ | Dosrius - PN Montnegre Corredor | 462 m | 48 | 100% | 0% |
| VX | Tagamanent - PN del Montseny | 1.030 m | 48 | 100% | 0% |
| WS | Viladrau | 956 m | 48 | 100% | 0% |
| XK | Puig Sesolles | 1.666 m | 48 | 100% | 0% |

0% validada no vol dir que les mesures siguin errònies: falta la marca `V`.
Cardedeu no es declara inactiva; només no retorna aquesta variable aquell dia.
Un sol dia no acredita cobertura anual, relleu representatiu o comparabilitat.
Les coordenades són les oficials; no s'ha classificat el terreny a ull ni
extrapolat Fontanillas a totes les estacions. Un futur contrast ha de consultar
la previsió a cada emplaçament i mantenir estacions independents de l'entrenament.

### Reutilització: resultat encara no concloent

Els tres conjunts tenen `SEE_TERMS_OF_USE`. La descripció de les lectures
remet expressament a la propietat intel·lectual/industrial i a
[l'avís legal de Meteocat](https://www.meteo.cat/wpweb/avis-legal/), que distingeix
continguts protegits de la informació reutilitzable. La
[llicència general de la Generalitat](https://web.gencat.cat/ca/generalitat/dades-indicadors/dades-obertes/llicencies)
també dona prioritat a les condicions específiques. Per tant, **no s'ha assignat
una llicència Creative Commons ni s'ha donat per autoritzada una extracció
sistemàtica**. Aquesta és una cautela operativa, no una conclusió jurídica.

Consulta preparada, **no enviada**: [`FONTA-XEMA-CONSULTA.md`](FONTA-XEMA-CONSULTA.md).
Fins a aclarir-ho: sense workflow XEMA, sense entrenament, sense redistribució
de lectures a GitHub/web/R2 i sense missatges a tercers.

## Verificació i rollback

- `npm run test:quick`: 35 fitxers; `npm run check`: 82 fitxers, correctes.
- Casos DST, zeros/nuls, recepcions futures, franges excloses, falsos duplicats,
  comparadors aparellats, dades provisionals, integritat i restauració mixta.
- No hi ha canvi visual: cap necessitat de desplegar Worker ni tocar secrets.
- No s'han activat nous workflows ni fet una còpia R2 real. Pilot actual intacte.
- Rollback: variable v2 a `false`; revertir scripts/workflow si cal; conservar
  originals i còpies. V1 ignora carpetes v2. No esborreu `fonta-data` ni R2.

Fonts tècniques:

- [Single Runs](https://open-meteo.com/en/docs/single-runs-api)
- [Meteocat dades obertes](https://www.meteo.cat/wpweb/serveis/dades-obertes/)
- [Metadades XEMA](https://analisi.transparenciacatalunya.cat/api/views/nzvn-apee.json)
- [Variables](https://analisi.transparenciacatalunya.cat/resource/4fb2-n3yi.json?codi_variable=32)
- [Estacions](https://analisi.transparenciacatalunya.cat/api/views/yqwd-vj5e.json)
- [API R2](https://developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/objects/)
