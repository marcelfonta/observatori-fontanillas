# Correcció local de temperatura — experiment fora de producció

Implementació exploratòria, no un nou model meteorològic. Cap component de la web,
Worker, cron o publicació importa aquest experiment. No substitueix Open-Meteo ni
els avisos oficials. No s’activa automàticament encara que les mètriques millorin.

## Dades i execució

L’arxiu actual desa previsions **diàries**, no una sèrie horària de pronòstics
emesos. Aquesta primera prova compara màxima i mínima de demà:
Open-Meteo best_match contra l’estació ISANTC198.

1. Utilitza una còpia local de D1 o una exportació de només lectura autoritzada.
2. Executa-hi ops/forecast-bias-export.sql; desa les files com un array JSON
   (també s’accepta la sortida JSON de Wrangler amb results).
3. Executa: node scripts/forecast-bias-experiment.mjs export.json

No cal cap credencial per executar l’anàlisi. No fa peticions de xarxa ni escriu
a D1. No s’ha executat cap exportació de producció amb aquest canvi.

## Mètode fixat abans de mirar els resultats

- Fins a 180 dies; una previsió per data, l’última emesa el dia abans.
- Valors absents no són zero. S’exigeixen 260 intervals diferents de cinc minuts
  i presència de temperatura en les 24 hores locals. Els dies incomplets i alguns
  dies de canvi d’hora queden exclosos de forma conservadora.
- Primer 70% de dates per entrenar, últim 30% per avaluar, sense barreja aleatòria.
- Embargament: només s’entrena amb dies acabats i registres ja disponibles abans
  de l’emissió de totes les previsions del bloc de prova. Les incorporacions
  tardanes a l’arxiu no poden introduir informació futura.
- Mínim 30 dies d’entrenament i 14 de prova. Són llindars del projecte,
  no una garantia estadística ni una norma meteorològica.
- Correcció additiva mitjana separada per màxima i mínima, limitada a ±3 °C.
  Si invertís màxima/mínima, es conserva la previsió original i es compta el cas.
- Es comparen MAE, biaix i RMSE sobre els mateixos dies. Una degradació es mostra;
  no es retoca el model mirant el bloc de prova.

## Interpretació i següent decisió humana

Un resultat favorable en poques setmanes no prova que s’hagin superat models
globals. Cal estudiar estacions de l’any, canvis del best_match, ubicació i
calibratge del sensor, extrems i estabilitat en nous períodes independents.
L’extrem mostrejat cada cinc minuts pot diferir del màxim/mínim real.
Una eventual prova en viu requereix un altre canvi revisat i autorització.

Referència metodològica: [ECMWF — conceptes estadístics i verificació determinista](https://confluence.ecmwf.int/pages/viewpage.action?pageId=333775635).
El biaix, MAE i RMSE mesuren aspectes diferents; corregir un biaix no elimina
l’error aleatori. Els paràmetres d’aquest prototip són decisions del projecte,
no una implementació oficial d’ECMWF.
