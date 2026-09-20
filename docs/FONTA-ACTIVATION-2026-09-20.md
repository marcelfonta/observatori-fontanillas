# Fonta — activació, còpia real i estat dels cinc passos

20/09/2026, comprovacions fins a les 16:10 Europe/Madrid.
Continuació del PR 165 fusionat a `d2da930bdd6ff6988ecbfe4e55e9a892a9c08597`.
Autorització del responsable: executar els cinc passos si és possible.
No implica promoció operativa, publicacions socials ni autorització sobre XEMA.

## 1. Single Runs activat, cron encara pendent

- `FONTA_SINGLE_RUNS_ENABLED=true`, verificat a GitHub; actualització
  2026-09-20T13:58:37Z. Workflow `362676348` actiu.
- Una execució diària a les 08:20 UTC: 10:20 en horari d'estiu i 09:20 a l'hivern.
  Primera prevista després de l'activació: 21/09/2026 a les 10:20 local.
- Tres GET, sense reintents, job limitat a vuit minuts, arxiu v2 separat;
  reutilitza observacions del pilot sense afegir consultes D1. Límit d'arxiu:
  90 dies i 25 MiB. No s'ha forçat una captura fora de la finestra.
- Repositori públic verificat i runner estàndard. La facturació del compte
  no s'ha pogut consultar (404 amb els permisos existents); no s'han ampliat
  permisos ni contractat serveis. La quota de fonts és compartida i l'activació
  no acredita disponibilitat futura ni cost total nul del compte.

## 2. R2 privat: còpia i recuperació reals completades

Bucket separat `fonta-research-archive`, Standard, creat el 20/09 a les
13:58:31Z amb preferència WEUR. És una indicació de localització, **no una
garantia de jurisdicció UE**. Accés gestionat públic desactivat i cap domini
personalitzat. No s'han modificat altres buckets, Worker, bindings o secrets.

Còpia coherent de `fonta-data`, commit
`f33b97daf20075992a41eb64ae9d9e606ef7bcac`, exportada i verificada abans de pujar.
S'ha utilitzat l'OAuth existent de Wrangler per a aquesta operació manual,
no una credencial dedicada d'automatització.

| Objecte | Bytes | SHA-256 (també identifica la clau) |
| --- | ---: | --- |
| `captures/<sha256>.json` | 412534 | `8f2fd6bb7369791590713f1783a9bc5b9feb2fda01d0ad345badc41d0810ab60` |
| `manifests/<sha256>.json` | 468 | `14a953fb8d2e4dd3e3e5e7faae65b4770804421bf3d14b8d9d7946233df99d1e` |

Ordre: pujar captura, descarregar-la en un destí nou i verificar hash;
només llavors pujar manifest, descarregar-lo i verificar l'exportació sencera.
Inventari remot comprovat: dos objectes, 413.002 bytes, per sota del pressupost
local de 100 MiB. Cap fotografia, secret o dada XEMA inclosa.

La restauració retorna `verified:true`, una captura, zero dies de Single Runs
i 412.534 bytes de dades. Informe reconstruït a les 14:08:05Z:
`status:collecting`, `pairedDays:0`, `evaluatedDays:0`,
`productionEnabled:false`. No s'han alterat originals ni fabricat resultats.

**Encara no hi ha còpies automàtiques.** Falta credencial restringida al bucket,
validar el transport REST/inventari amb aquests permisos i configurar la
programació amb pressupost i fallada segura. La prova manual amb Wrangler no
substitueix aquesta validació d'integració. No s'ha configurat expiració
d'objectes; el límit d'arxiu local no elimina automàticament còpies remotes.

## 3. XEMA: consulta enviada, no permís concedit

Consulta a `smc.meteocat@gencat.cat`, adreça contrastada a l'avís legal oficial,
enviada amb Outlook des del compte del projecte el 20/09 a les 16:09 local.
Enviament verificat a Enviats. Assumpte: «Condicions de reutilització XEMA en
un laboratori local no comercial». Sense fotografies ni ubicació privada.
Contingut a [`FONTA-XEMA-CONSULTA.md`](FONTA-XEMA-CONSULTA.md).

Resposta pendent. No iniciar ingestió automàtica ni redistribució amb aquest
enviament com a justificació; cal resoldre també validació i períodes SH/HO.

## 4. Execucions programades i acumulació

Auditoria de només lectura a les 13:57:27Z: zero execucions `schedule`
observades (`not-observed-in-window`). La primera del pilot és a les 20:10 UTC
(22:10 local), encara futura en el moment de comprovar. La captura pm ja existeix
i s'espera reutilització, no noves consultes. Cal comprovar event, conclusió,
logs i integritat després de l'execució; una variable activa no és aquesta prova.

Comprovar també pilot am del 21/09 a les 10:10 local i Single Runs a les 10:20.
No es promet seguiment autònom des d'aquesta nota: són comprovacions pendents.
Zero dies aparellats/avaluats; les proves sintètiques no substitueixen dies reals.
Es mantenen mínim d'entrenament i protocol sense accelerar una promoció.

## 5. Estació: fotos revisades i 0,70 m declarats

Sis fotos inspeccionades en privat, sense incorporar-les a Git ni a R2.
Muntatge sobre teules vermelles, abric blanc de plats i conjunt compacte;
obstacles llunyans visibles no permeten mesurar distàncies ni certificar tot
l'horitzó. Precisió del responsable: **0,70 m de teules a sensor**, no 1 m.
És una precisió documental, no una reubicació: conservar l'època instrumental.

Pendents model exacte/manual, ventilació, altura sobre terreny, altitud
verificada i historial de manteniment/calibratge. No deduir un biaix quantitatiu
de fotos ni restar graus. L'objectiu continua sent la temperatura d'aquesta
estació, no una temperatura oficial representativa de tot el Baix Montseny.

## Aturada i límits

Per aturar Single Runs, `FONTA_SINGLE_RUNS_ENABLED=false`; el pilot v1 té la
seva variable separada. Conservar l'arxiu i les evidències. Cap esborrat R2
necessari per aturar captures. No s'han tocat els programadors socials,
desplegat Worker, migrat D1 ni activat validació territorial.

Verificació d'aquesta entrega documental: `npm run test:quick`, `npm run check`,
`npm run worker:dry-run` i `git diff --check` superats. El dry-run utilitza la
configuració d'exemple i no desplega res ni acredita l'estat remot.

Fonts operatives: [R2](https://developers.cloudflare.com/r2/pricing/),
[GitHub Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions),
[Open-Meteo](https://open-meteo.com/en/pricing),
[contacte Meteocat](https://www.meteo.cat/wpweb/avis-legal/).
