# Auditoria · paquet A

## Abast

Dades absents a la primera càrrega i mitjanes del Centre de Dades; previsió i text astronòmics; caducitat d’avisos oficials i astronomia abans de publicar. No modifica horaris, canals, credencials, dates oficials del catàleg ni activa cap família.

## Acceptació

- Les absències no generen zeros; un zero real continua sent vàlid.
- Una observació sense instant inequívoc no s’injecta com a actual. Les lectures antigues es marquen com a desades.
- La finestra astronòmica exigeix tots els punts horaris únics, incloses les hores de frontera en franges amb minuts; sense cobertura completa no hi ha recordatori. És una regla conservadora: pot ometre una publicació, però no inventa cel favorable.
- El text i la imatge indiquen la mateixa nit o dia, amb any. Els eclipsis solars no es descriuen com nocturns i conserven la precaució de protecció solar.
- El text relatiu només es pot enviar el dia local en què es va preparar. Un avanç per demà o passat demà sí que es permet dins del seu dia d’emissió.
- Un avís necessita final general vàlid i vigència comarcal interpretable. La comprovació usa les dades desades i no consumeix consultes addicionals de Meteocat; no detecta una revocació del proveïdor encara no incorporada al sistema.
- La recuperació retira el candidat caducat a `draft`. La passada següent pot triar un altre candidat. No s’eliminen intents publicats i la publicació manual continua rebutjant contingut caducat.

## Proves

`tests/audit-data-dates.mjs` utilitza els generadors reals, un substitut de D1 en memòria i respostes simulades d’Open-Meteo. No contacta les xarxes. Cobreix tots els esdeveniments activables del catàleg, les quatre estacions de 2026, canvi d’any, canvi d’hora, absències, zeros, duplicats i franges incompletes. Forma part de la suite ràpida i completa.

Abans de producció: staging autoritzat, revisió visual de les targetes amb logo/data i comprovació del pas a esborrany amb registres de prova. No reutilitzar un cron de producció ni fer enviaments reals per validar aquesta PR.

## Compatibilitat i límits

Sense taules o columnes noves. S’utilitza l’estat existent `draft`. Els esborranys antics amb dates insuficients queden aturats de manera conservadora; cal preparar-ne un d’actualitzat. Les altres famílies mantenen el comportament existent.

El Worker i el paquet web mantenen les seves sèries de versió existents: Worker 22.29.6, web 22.31.0 i nova revisió de memòria cau. El nou mòdul numèric forma part de l’app shell de la PWA.

La protecció concurrent, la conciliació amb proveïdors i la selecció després d’intents esgotats es reserven al paquet B. Tampoc es refan aquí els recomptes de cobertura, les etiquetes meteorològiques, els idiomes o el SEO.

## Rollback

Revertir aquesta PR i desplegar l’anterior amb aprovació humana. No cal migració inversa. Revisar individualment els esborranys que hagin passat a `draft`; no reaprovar-los automàticament.
