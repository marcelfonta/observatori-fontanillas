# Validació privada de Météo-France

El Worker comprova els cinc productes operatius sense exposar cap credencial:

- AROME, AROME-PI i ARPEGE: catàleg WMS i generació real d'una imatge PNG petita.
- PE-AROME i PE-ARPEGE: catàleg WCS i nombre de cobertures publicades.

El resultat només és accessible amb autenticació d'administració a
`/admin/meteofrance-validation`. Una resposta de catàleg no es considera prova
suficient d'un WMS: el resum separa els catàlegs disponibles dels mapes generats.

## Barrera per a la ingestió numèrica

Els WCS no entren automàticament al model Fonta. Per defecte tots queden
bloquejats amb `reuse-not-approved`. Una futura prova privada exigeix incloure
explícitament l'identificador (`pe-arome` o `pe-arpege`) a la variable privada
`METEOFRANCE_NUMERIC_REUSE_APPROVED_PRODUCTS`, a més de tenir la credencial
corresponent. Aquesta barrera no substitueix la predicció congelada ni la
validació prospectiva exigides pel roadmap.

## Reutilització

La pàgina oficial de Météo-France indica que els productes públics estan subjectes
a la Licence Ouverte d'Etalab, exigeix atribució a Météo-France i no autoritza la
redistribució de la informació en l'estat original. Per això el projecte conserva
la font, no exposa descàrregues WCS/GRIB i només contempla productes derivats i
un pilot privat abans de qualsevol ús públic.

PIAF es va retirar del circuit operatiu el 20 d'octubre de 2026: la clau estava
present i vigent fins al 2029, però l'API professional no havia ofert mai una
resposta verificable i retornava HTTP 520. Es conserva aquesta decisió a
`docs/DECISIONS.md`, però PIAF ja no compta com a producte pendent ni es consulta.

Font consultada el 20 d'octubre de 2026:
<https://donneespubliques.meteofrance.fr/?fond=dossier&id_dossier=12>
