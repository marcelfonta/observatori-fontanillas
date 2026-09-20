# Fonta: protocol i següents fases

20/09/2026 · Proposta v1 per revisió. **No autoritza promocions ni publicacions.**

Continuació tècnica posterior al PR 163 a
[`FONTA-FOUNDATIONS-2026-09-20.md`](FONTA-FOUNDATIONS-2026-09-20.md): comparadors
prospectius aparellats, prova Single Runs i exportació local implementats per
revisar, sense donar per iniciat el holdout ni integrar estacions externes.

## 1. Què es valida

Objectiu inicial: màxima i mínima de demà a l'estació ISANTC198, separadament.
No és la temperatura representativa de tota la població ni del Baix Montseny.
L'objectiu observat actual són extrems de lectures d'uns cinc minuts, no extrems
continus instrumentals. Un model pot aprendre l'emplaçament sense representar
millor la temperatura de l'aire regional: això s'ha d'explicar, no amagar.

Declaració del responsable, 20/09: sensor a aproximadament 1 m sobre teules
vermelles; sense obstacles que tapin sol/vent en uns 50 m. Fotografia, model
exacte, abric/ventilació, altura sobre el terreny, altitud i calibratge pendents.
No s'ha deduït cap correcció numèrica d'aquesta declaració. Qualsevol canvi de
sensor o ubicació obre una nova època instrumental; no barrejar-la silenciosament.

## 2. Pilot vigent i evidència

- Activació autoritzada: ús no comercial, arxiu meteorològic públic, dues
  execucions diàries limitades a 8 min, sense contractar serveis.
- PR 162 fusionat a `ea5e925fb4385dad815800a4b602bee2de933c5a`.
- [Primera execució manual correcta](https://github.com/marcelfonta/observatori-fontanillas/actions/runs/35509945260):
  20/09 a les 12:12 UTC, quatre models, observacions, cinc hashes verificats;
  una captura, dos dies observats elegibles i zero dies comparables/avaluats.
- `FONTA_SHADOW_ENABLED=true`; Pages exclou només `fonta-data` dels builds de
  preview (mode custom, inclusió `*`). Producció continua a `main`.
- La prova manual no acredita el cron. La primera captura ocupa la franja pm:
  l'execució de les 20:10 UTC del mateix dia ha de reutilitzar-la sense HTTP.
- En aquesta entrega no es rellança el collector ni es canvia la configuració
  remota. El nou informe s'incorpora després de merge i d'una execució posterior.

## 3. Mesurament abans de veure els resultats

Es mantenen els paràmetres de l'experiment 0.1.0: primera emissió completa
08:00–09:59 UTC per dia, entrenament mínim 30 dies anteriors disponibles,
finestra de 60, correcció limitada ±3 °C. No baixar els filtres per assolir una
data de llançament. Els 14 dies avaluats només obren una lectura exploratòria.

Comparadors sobre EXACTAMENT els mateixos dies: Best Match, IFS, ICON-EU,
AROME, mitjana dels tres models explícits i persistència. Best Match no compta
com un quart membre independent de la mitjana.

- Publicar MAE, biaix, RMSE i nombre de dies per a màxima i mínima.
- Mostrar cobertura i descartaments; un buit o un nul no és zero.
- No seleccionar el comparador o els dies després d'observar el resultat.
- Separar backtest recalculat i prediccions congelades. La sèrie prospectiva
  actual selecciona la primera predicció congelada per data, pot tenir hores
  diferents i **no és encara un holdout de promoció**.
- Abans del holdout, cal implementar comparadors prospectius congelats a la
  mateixa hora que Fonta. No comparar dues MAE amb conjunts de dies diferents.

### Porta de promoció proposada (no implementada ni acceptada com a resultat)

Abans d'iniciar-la: revisar l'estació, fixar versió/codi/fonts/filtres i registrar
data d'inici i criteris sense consultar els errors futurs. Els paràmetres de la
correcció poden actualitzar-se amb dades passades seguint l'algoritme congelat;
no canviar hiperparàmetres segons el holdout. Si es canvia el mètode, nova versió
i nou període, conservant també els resultats desfavorables anteriors.

Proposta de treball del projecte, **no llindars oficials**:

1. Almenys 60 dies elegibles sobre un període d'almenys 90 dies naturals,
   amb cobertura publicada. Això no substitueix estacions ni estacionalitat.
2. Per variable, reducció MAE de com a mínim 0,2 °C i 5% respecte de Best Match
   i de la mitjana; si la MAE base és zero, no calcular un percentatge infinit.
3. Biaix absolut ≤0,5 °C i RMSE no empitjorada >5% davant aquests comparadors.
   Publicar també els altres models i persistència, encara que superin Fonta.
4. Quantificar la incertesa de la diferència aparellada preservant dependència
   temporal (proposta: bootstrap per blocs de set dies, interval 95%, llavor i
   repeticions preregistrades). No executar una prova independent per cada dia
   com si els episodis meteorològics no estiguessin correlacionats.
5. Si manquen episodis, la mostra és curta o el resultat és inconcloent:
   continuar experimental. Cal revisió humana, no un interruptor automàtic.

Aquests valors s'han de revisar i aprovar abans de començar el període de prova;
el PR només prepara el protocol. No calcular una puntuació de «precisió global».
Abans d'ús operatiu calen també degradació segura, versions i rollback provats.

## 4. Sortides identificades: estudi real, no canvi silenciós de font

La [Single Runs API](https://open-meteo.com/en/docs/single-runs-api) identifica
la inicialització UTC amb `run`; no acredita l'instant de disponibilitat pública.
La Forecast API actual pot combinar les darreres sortides. No es pot assignar
retroactivament una hora de run a les captures actuals, ni reconstruir amb
reanàlisi allò que «s'hauria predit».

Prova limitada de sis peticions públiques el 20/09/2026, 12:27 UTC, sense
escriure a l'arxiu actiu ni modificar cap workflow:

| Consulta run 2026-09-20T00:00 | IFS 0,25° | ICON-EU | AROME France |
| --- | --- | --- | --- |
| hourly + daily, Europe/Madrid | HTTP 400 | HTTP 400 | HTTP 400 |
| només hourly temperature_2m | HTTP 200 | HTTP 200 | HTTP 200 |
| punts horaris / valors nuls | 72 / 0 | 72 / 0 | 72 / 20 |

El servei rebutja `daily` quan el run no comença a les 00:00 del fus demanat.
No és correcte canviar a UTC i anomenar els agregats «dia local». Tampoc
substituir els nuls d'AROME per zeros. Aquesta limitació es detecta amb resposta
real, encara que la documentació general digui que accepta paràmetres Forecast.

Següent implementació separada: arxiu v2, temperatura horària, cobertura exacta
del dia Europe/Madrid (23/24/25 h), màxim/mínim de mostres horàries identificats
com a tals, objectiu observacional coherent. Conservar run sol·licitat, primer
instant de recepció verificat, URL, model, graella, unitats i hash. Fixar una
política de selecció amb disponibilitat real i sense reintents il·limitats.
No barrejar mètriques v1 diàries i v2 horàries. Revisar pressupost abans
d'augmentar les cinc consultes del collector actual.

## 5. Validació territorial, sense triar encara una estació guanyadora

Font candidata: [dades obertes XEMA de Meteocat](https://www.meteo.cat/wpweb/serveis/dades-obertes/).
Les metadades inclouen codi/ubicació/estat i les observacions tenen indicadors
de validació. No reutilitzar avisos SMP ni consumir-ne la quota per recollir
observacions. Verificar la llicència, atribució, fus, disponibilitat i control
de qualitat del conjunt concret abans d'activar una descàrrega automàtica.

Preparar una fitxa per candidat amb: identificador oficial, altitud, relleu
(fons de vall/vessant/cota alta), distància, variables, èpoques instrumentals,
cobertura temporal i autorització. No atribuir representativitat només per
proximitat. Reservar estacions no usades per entrenar; contrastar el model a
les coordenades de cada estació, no contra la previsió puntual de Fontanillas.

No s'han escollit ni integrat noves estacions en aquesta entrega. Pluja i vent
queden per a protocols separats (esdeveniment, període, unitats i mètriques);
no aprofitar un bon resultat tèrmic com a prova de qualitat en altres variables.

## Fonts i operació

- [ECMWF: forecast evaluation](https://www.ecmwf.int/en/research/modelling-and-prediction/forecast-evaluation)
- [Open-Meteo Single Runs: inicialització i disponibilitat](https://open-meteo.com/en/docs/single-runs-api)
- [Meteocat: dades i metadades XEMA](https://www.meteo.cat/wpweb/serveis/dades-obertes/)

Les fonts orienten la metodologia; no avalen els llindars proposats del projecte.
Rollback d'aquesta entrega: revertir web, informe i sufix de memòria cau. Camps
diagnostics/reasons additius, arxiu original intacte; sense migració D1 ni Worker.
Per aturar el pilot: variable `FONTA_SHADOW_ENABLED=false`, conservant les dades.

## Verificació del paquet de seguiment

- `npm run check`: 80 fitxers de proves Node superats.
- Suite de navegador completa: 32 proves superades; després, sis proves Fonta
  dirigides, inclosa una nova prova de caducitat amb la pàgina oberta (sense
  consultes HTTP addicionals).
- Diagnòstic regenerat contra una còpia local de l'arxiu real `fonta-data`:
  una captura, zero dies comparables/avaluats i `productionEnabled:false`.
- Proves de dades sintètiques separades de l'evidència real; no s'han publicat
  puntuacions sintètiques, modificat captures originals ni activat Single Runs.
