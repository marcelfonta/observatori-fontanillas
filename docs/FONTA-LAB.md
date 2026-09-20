# Fonta · laboratori de previsió local

Versió 0.1.0, 20-09-2026. Implementació experimental, **no desplegada ni activada**
en aquesta entrega. La previsió operativa, els avisos i les xarxes no canvien.

## Fita i límits

Estimar millor la màxima i mínima de **demà a Fontanillas**, primer en mode ombra.
No és un nou model atmosfèric global ni una previsió validada del Baix Montseny.
Cap LLM calcula valors meteorològics. Les fases científiques no es poden completar
amb proves sintètiques, simulant dies futurs o disminuint els filtres per obtenir
un resultat favorable.

| Fase | Entrega | Condició pendent |
| --- | --- | --- |
| 0 · auditoria | Arxiu i defecte de cobertura analitzats; contracte de qualitat | Revisar abric, emplaçament, altura i calibratge del sensor |
| 1 · arxiu | Quatre fonts, sèries horàries i diàries, originals i SHA-256, primera captura local real | Fusionar, revisar configuració i activar pilot independent |
| 2 · experiment | Mitjana de tres models, correcció limitada, avaluació cronològica i prediccions congelades | Acumular dies vàlids i executar seguiment prospectiu |
| 3 · web | Pàgina Fonta, navegació, comparadors, caducitat i metodologia | Revisió del PR i previsualització Pages |
| 4 · promoció | Bloqueig explícit de qualsevol promoció operativa | Prova independent, estacions/extrems, revisió humana |
| 5 · autonomia | Workflow, límits de recursos, arxiu independent, detecció de fallades | Activació després del merge; no hi ha autoreescriptura ni autodesplegament |
| Evolució regional | Pla de variables i estacions | Fonts, llicències, representativitat i evidència espacial |

## Auditoria de dades reals

Consultes D1 de només lectura el 20/09/2026: 29 dates entre 22/08 i 19/09 amb
previsió D+1 best_match i observacions. El filtre antic amb
`COUNT(DISTINCT floor(epoch/300))` acceptava només **1** dia. Això **no** implica
que només hi hagués un dia complet: la divisió en caselles absolutes penalitza
lectures de cinc minuts que oscil·len alguns segons al voltant del límit.

Comprovació amb l'històric brut públic: 18/09 té 287 lectures úniques (intervals
260–340 s); 19/09 té 289 (260–335 s). La comptabilització antiga en reduïa el
recompte a 175 i 193. El nou lector deduplica instants exactes i mesura la unió
d'intervals de representativitat de cinc minuts (±150 s), limitada al dia local.
No extrapola una sola lectura sobre un buit llarg.

Un filtre SQL preliminar amb instants exactes, ≥260 lectures, 24 hores presents
i cap buit interior >20 min retorna **22** dates. No és l'avaluació final: falten
la cobertura de les vores, salts, revisió instrumental i embargament de dades.
No s'han importat aquestes dates com si fossin captures horàries multimodel.
Les tres consultes d'auditoria no han escrit ni modificat cap fila.

El prototip històric `forecast-bias-experiment.js` queda com a experiment antic,
no s'utilitza per Fonta. El seu recompte de caselles és una limitació coneguda;
no reutilitzar-ne el SQL com a certificat de cobertura. No es modifica en aquest
PR per no barrejar metodologies retroactivament.

## Dades i identitat temporal

- Coordenades configurades: 41.6906, 2.489; estació ISANTC198. Elevació real del
  sensor pendent de confirmar. L'altitud retornada pel model és de la graella.
- Fonts fixes: Open-Meteo `best_match` (comparador), `ecmwf_ifs025`, `icon_eu`,
  `meteofrance_arome_france`. La mitjana Fonta usa els tres darrers; best_match
  pot coincidir amb un d'ells i no es tracta com un membre independent.
- Tres dies de temperatura horària i extrems diaris; UTC unix per als instants,
  Europe/Madrid per als dies. La captura conserva originals, coordenades de
  graella, unitats, URL pública, recepció, finalització i hash del JSON canònic.
- `modelRunAt:null`: l'API forecast no proporciona aquí la identitat exacta del
  run. **Captura ≠ emissió del model**. Aquest és un arxiu de respostes disponibles,
  no un arxiu complet de runs meteorològics. Single Runs és la següent ampliació.
- No reconstruir el passat amb reanàlisi o sortides que encara no eren públiques.
- Les observacions es coneixen, conservadorament, quan es recullen. Cap imputació
  ni interpolació. Fonts degradades es registren; no substitució silenciosa.
- Qualitat: temperatura −40..55 °C com a filtre tècnic, ≥90% de cobertura i de
  lectures esperades, totes les hores UTC del dia local presents, buit màxim
  20 min i cap salt >6 °C en ≤10 min. Són filtres conservadors del projecte,
  no llindars oficials. Un episodi extrem pot requerir revisió manual.
- Canvis d'hora: 23/24/25 hores, 276/288/300 mostres esperades. Les hores repetides
  no es col·lapsen. Els extrems mostrejats no són extrems continus instrumentals.

## Aprenentatge i verificació

1. Seleccionar la primera captura completa de 08:00–09:59 UTC per dia. Si GitHub
   arriba més tard, s'arxiva però no entra en la comparació D+1. D+1 és el dia
   natural següent, no un únic termini de +24 h; la finestra i DST es documenten.
2. Comparar best_match, els tres models fixos, mitjana, persistència i Fonta sobre
   **els mateixos dies**. Persistència: extrems del dia complet anterior a la
   captura, només si ja s'havien recollit. No omplir-ne absències amb zero.
3. Entrenar amb almenys 30 dies elegibles anteriors ja disponibles i, com a màxim,
   els últims 60. Correcció additiva mitjana separada per màxima i mínima ±3 °C.
   Si inverteix mínima/màxima, mantenir la mitjana original i registrar-ho.
4. Backtest walk-forward sense barreja aleatòria: cada prova utilitza només el
   passat conegut en aquell moment. Mostrar MAE, biaix i RMSE i nombre de dies.
   14 dies de prova obren la lectura exploratòria, **no una promoció**.
5. Quan hi ha prou entrenament, cada captura nova desa un `shadowPrediction`
   immutable per demà, versió, correcció i dates d'entrenament. L'informe separa
   els errors d'aquestes prediccions realment congelades (`prospective`) dels
   errors recalculats del backtest. No s'edita una predicció després dels fets.
6. `promotion.allowed:false` i `productionEnabled:false` sempre. Cap importació
   de Fonta als publicadors ni al Worker. Primer s'ha de revisar l'estació i
   reservar un període independent amb criteris de promoció pactats, variabilitat
   estacional, extrems i incertesa estadística. Una millora de poques setmanes no
   és suficient per afirmar superioritat.

## Execució local

```sh
node scripts/fonta/collect.mjs build/fonta-pilot-v1
node scripts/fonta/report.mjs build/fonta-pilot-v1
node tests/fonta-model.mjs
npx playwright test tests/browser/fonta.spec.mjs
```

Primera captura local real validada: 20/09/2026, quatre fonts disponibles i dos
dies observats. Cap dia multimodel encara verificable ni model entrenat. Els
fitxers `build/` són locals ignorats per Git, no s'envien a producció. Repetir
la mateixa franja am/pm no fa peticions ni sobreescriu el fitxer existent.

## Automatització independent i pressupost

Workflow `fonta-shadow.yml`, dues captures a les 08:10 i 20:10 UTC (no són
hores locals fixes). Únicament a main i amb `FONTA_SHADOW_ENABLED=true`.
Màxim cinc consultes HTTP per captura, timeout per font 25 s, job 8 min; sense
reintents agressius, credencials socials, secrets Cloudflare ni escriptures D1.
L'horari no canvia ni dispara les publicacions de 06:45, 14:00 o 20:30.

Arxiu pilot durable en branca separada `fonta-data`: originals create-only,
informe actualitzable, historial Git i push sense force. Fins a 180 captures
(aproximadament 90 dies amb dues al dia) o 100 MiB; en assolir el límit s'atura
amb error i **no esborra dades**. Cal migrar a emmagatzematge d'objectes revisat
abans d'escalar, no augmentar indefinidament el repositori. No s'han contractat
serveis ni promès cost zero: els minuts Actions depenen del compte.

### Activació després de revisió humana

1. Fusionar aquest PR, verificar CI i la previsualització Pages.
2. Excloure `fonta-data` dels builds de Pages (la branca conté dades, no una web).
   Verificar que altres automatitzacions no reaccionin a aquesta branca.
3. Confirmar ús no comercial del pilot, condicions Open-Meteo, pressupost Actions
   i visibilitat pública dels arxius meteorològics. Mai afegir secrets a la branca.
4. Posar `FONTA_SHADOW_ENABLED=true` i executar una vegada manualment. Revisar
   l'estat del job, quatre fonts, hashes, branca i `status.json`; després, comprovar
   una execució programada real. No dir «actiu» només perquè existeix el YAML.
5. Comprovar la pàgina Fonta amb dades reals. El botó consulta només l'informe
   públic; si falla o té més de 30 h, no mostra una previsió com si fos actual.
6. Revisar el pilot abans de 180 captures/100 MiB. Les fallades queden vermelles
   a Actions; la recepció de correus depèn de les notificacions de GitHub.

Rollback: desactivar la variable o el workflow; conservar l'arxiu. Revertir els
fitxers web/navegació i renovar la revisió de service worker si cal retirar el
laboratori. No cal revertir Worker, migrar D1 ni tocar publicacions.

## Següents fases, no presentades com a fetes

- Revisió instrumental i estacions XEMA/PWS representatives amb permisos.
- Identitat real de runs i disponibilitat, arxiu durable escalable, recuperació
  de captures perdudes només amb dates de disponibilitat verificables.
- Validació espacial amb estacions no usades a l'entrenament; valls, vessants,
  altituds i episodis diferents abans de dir «especialista del Baix Montseny».
- Probabilitats de pluja amb la mateixa definició d'esdeveniment en previsió i
  observació; Brier, calibratge i falses alarmes. **No usar el màxim horari de
  probabilitat com si fos la probabilitat de pluja de tot el dia.**
- Humitat, vent i ratxes, ara-per-ara amb radar llicenciat; model per variable.
- Intervals calibrats i guanys sobre baselines en períodes independents.
- Promoció per variable, degradació segura a baseline i rollback de versions,
  només després de criteris explícits i revisió humana. Ni avisos ni xarxes
  automàtiques noves en aquest pilot.

## Comprovacions d'aquesta entrega

- `npm run check`: 80 fitxers de proves Node superats.
- `npm run test:browser`: 31 proves Chromium superades, incloent Fonta a
  360, 390 i 1280 px, navegació mòbil, caducitat i dades absents.
- Primera captura real: quatre models, dos dies observats acceptats amb cobertura
  temporal 94,4% i 94,8%; cap entrenament ni predicció Fonta inventada.
- La suite usa dades sintètiques identificades per provar millores i errors;
  aquests valors no són resultats públics ni evidència de qualitat real.
- Cap desplegament, activació, escriptura D1 ni publicació a xarxes.

## Fonts metodològiques

- [Open-Meteo: contracte de previsió](https://open-meteo.com/en/docs)
- [Single Runs i diferència entre inicialització i disponibilitat](https://open-meteo.com/en/docs/single-runs-api)
- [Condicions d'ús Open-Meteo](https://open-meteo.com/en/terms), atribució CC BY 4.0
- [ECMWF: avaluació de prediccions](https://www.ecmwf.int/en/research/modelling-and-prediction/forecast-evaluation)
- [Meteocat: dades obertes i xarxes oficials](https://www.meteo.cat/wpweb/serveis/dades-obertes/)
