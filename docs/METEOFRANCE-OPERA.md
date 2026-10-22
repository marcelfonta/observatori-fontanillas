# Integració del radar europeu EUMETNET OPERA

## Estat verificat

El 22 d’octubre de 2026, Météo-France va confirmar l’activació del cas
`T#169758` per a l’usuari del projecte. La sessió autenticada del portal permet
obrir **Utiliser**, consultar la consola i descarregar l’especificació OpenAPI
oficial. Les credencials temporals utilitzades en les proves privades no s’han
incorporat al repositori ni als informes.

La llicència comunicada al projecte és **CC-BY-4.0**. El portal precisa que
l’ús gratuït requereix autorització d’EUMETNET i està destinat a finalitats
pedagògiques i de recerca; altres usos, inclòs el comercial, es regeixen per
les condicions ECOMET. Abans d’ampliar l’ús cal revisar aquestes condicions.

## Contracte oficial RadarOpera

- Producte del portal: `RadarOpera`, consola `v1.0` i OpenAPI `1.3`.
- URL base: `https://partner-api.meteofrance.fr/partner/radar/opera/1.0`.
- Autenticació disponible a la consola: **OAuth2** o **API Key**.
- L’OpenAPI declara OAuth2 implícit amb autorització a
  `https://partner-api.meteofrance.fr/authorize` i accés de tipus
  `Application & Application User`.
- El token generat des de la consola té una validesa indicada d’**1 hora**.
- Els errors previstos inclouen `401`, `403`, `404`, `429`, `499`, `500`,
  `502`, `503` i `504`.

| Recurs | Contingut | Límit oficial |
| --- | --- | ---: |
| `GET /archive/odyssey` | Catàleg JSON, filtrable per país, identificador i data | 10.000/min |
| `GET /archive/odyssey/single/{country}/{id}/{date}` | TAR diari d’un radar | 60/min |
| `GET /archive/odyssey/composite/{product}/{date}` | TAR diari HDF5 o BUFR | 60/min |
| `GET /archive/cirrus/composite/{product}/{date}` | TAR de 12 hores, HDF5 | 60/min |
| `GET /archive/nimbus/composite/{product}/{date}` | TAR diari, HDF5 | 60/min |
| `GET /realtime/cirrus/composite/{product}/{date}` | Compost HDF5 de temps real | 6.000/min |
| `GET /realtime/nimbus/composite/{product}/{date}` | Compost HDF5 de temps real | 6.000/min |

### Productes, resolució i retenció

- **Cirrus**: `REFLECTIVITY`, resolució espacial d’1 km × 1 km i pas de 5
  minuts. El temps real conserva els darrers **5 dies**. L’arxiu Cirrus es
  descarrega en blocs de 12 hores: una hora entre 00 i 11 selecciona 00:00–11:55
  i una hora entre 12 i 23 selecciona 12:00–23:55.
- **Nimbus**: `RAINFALL_RATE` i `RAINFALL_ACCUMULATION`, resolució espacial de
  2 km × 2 km i pas de 15 minuts. El temps real conserva els darrers **5 dies**.
  El portal adverteix que Nimbus és preoperacional i no disposa de fitxa de
  producte.
- **Odyssey**: el catàleg declara `REFLECTIVITY`, `RAINFALL_RATE` i
  `RAINFALL_ACCUMULATION`; els compostos es poden obtenir en HDF5 o BUFR.
- Les dates de temps real segueixen `YYYY-MM-DDTHHMMSSZ`; els arxius diaris,
  `YYYY-MM-DD`.

Météo-France avisa que les descàrregues més grans de radars individuals poden
fallar. En aquest cas cal comunicar a `vd@meteo.fr` el radar i el període. Això
obliga a tractar l’arxiu com un servei recuperable, no com una dependència
síncrona del visor.

## Política de seguretat del projecte

- La credencial s’ha de guardar exclusivament com a **secret de Cloudflare**.
- El navegador no pot rebre ni el token, ni l’API key, ni la URL autenticada.
- El Worker ha d’exposar una llista tancada de productes i instants, validar
  formats i dates i aplicar límits molt inferiors als del proveïdor.
- No s’han d’escriure credencials, capçaleres d’autorització ni URLs signades en
  registres, analítica o missatges d’error.
- La generació i renovació de tokens es validarà en una prova privada abans de
  crear el proxy públic.

## Següent paquet: prova privada del catàleg

La primera petició real haurà de ser petita i no destructiva: consultar
`/archive/odyssey` i, després, obtenir un únic compost Cirrus recent. Cal
registrar només metadades no sensibles: cobertura, productes, mida, temps de
resposta, antiguitat, valors absents i capçaleres de memòria cau. No es
publicarà cap capa fins que aquesta prova confirmi el comportament real.

### Resultat de la primera prova privada — 22 d’octubre de 2026

El tauler mostra **Données radar composites et individuelles Opera**, estat
**En cours**, límit de 1.000 peticions/minut i final de subscripció el 5
d’octubre de 2031. Tot i això, la passarel·la no accepta encara la subscripció:

- OAuth2: HTTP `401`, codi `900909`, subscripció de l’API inactiva.
- API key temporal: HTTP `403`, codi `900908`, recurs prohibit.

La discrepància és externa i s’ha de comunicar a Météo-France amb la referència
`T#169758`. No s’ha intentat descarregar cap HDF5 després d’aquests errors. La
sonda reproduïble `scripts/opera-private-probe.mjs` només emet estat HTTP,
latència, tipus de contingut i un resum del catàleg; mai imprimeix la
credencial. Exemples d’ús privat:

```sh
OPERA_ACCESS_TOKEN='…' OPERA_AUTH_MODE=oauth2 node scripts/opera-private-probe.mjs
OPERA_ACCESS_TOKEN='…' OPERA_AUTH_MODE=apikey node scripts/opera-private-probe.mjs
```

La validació del catàleg i del compost Cirrus continuarà pendent fins que la
passarel·la reconegui la subscripció activa.
