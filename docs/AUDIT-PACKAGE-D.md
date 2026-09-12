# Auditoria D · origen de l’històric i gràfiques

## Abast i acceptació

Paquet posterior a les PR 137–139. La nova PR no es desplega a producció abans del merge i l’aprovació humana. Worker proposat 22.29.8, frontend 22.31.0 amb revisió PWA `audit-d`.

- Corregir els intervals del servei d’històric: un dia són 86.400.000 ms, no 8.640.000. Proves d’1/7/30/366 dies i límit explícit.
- La persistència futura no converteix null, booleans o blancs en zero. Es manté la inserció sense sobreescriure observacions existents.
- Comptador pluviomètric: el primer valor diari conegut és un total des de mitjanit; amb predecessor absent o reinici dins del mateix dia no s’inventa cap increment. Un zero conegut es conserva.
- Agregats de Weather Underground: les absències no entren a mitjanes/extrems, i la pluja diària suma només increments coneguts. D1 conserva el comportament NULL de SUM/AVG.
- Camp additiu opcional `rainSamples`: nombre de files amb increment conegut. Comparat amb `samples` permet conservar el senyal de suma parcial dins d’un agregat. No demostra cobertura temporal completa.
- Gràfiques: cap reserva fictícia de 20 °C/1.013 hPa, ni dos punts fabricats a les miniatures. Temps real a l’eix horitzontal, absències visibles, sense suavitzat que pugui crear pics artificials.
- Tall orientatiu si passen més de 15 min en dades raw, 90 min en horàries o 36 h en diàries. No reconstrueix buits interns de cada agregat. Es conserva cada punt rebut, sense descartar increments de pluja ni pics per reduir la sèrie.
- Dates UTC/epoch prioritàries, rebuig de dates invàlides/futures i duplicats al navegador. La compatibilitat amb dates locals antigues es manté; no es garanteix la desambiguació d’aquests registres sense zona horària.

## Proves

`tests/audit-history-charts.mjs`: funcions reals de renderitzat amb Chart simulat, SQLite real amb la mateixa SQL/persistència que D1, absències, zeros, booleans, reinicis, agregats parcials, intervals, duplicats, futurs i 600 punts amb pic aïllat.

`tests/fixtures/history-chart-preview.html`: pàgina local reproduïble amb Chart.js real, dades explícitament fictícies, estat buit/parcial i canvi a francès. Comprovació visual en escriptori i a 320/360 px, sense errors de consola ni desbordament. Verificació de navegador amb l’eina disponible, perquè agent-browser no està instal·lat.

Suite completa i compilació de Worker en simulació abans de la PR. La prova local no és una validació de dades reals de producció del paquet D.

## Compatibilitat i límits

Cap migració, secret o horari nou. No s’han reescrit zeros ja desats: sense evidència no es poden distingir d’un zero real. Les absències que ja fabriqui una altra font/transformació queden fora d’aquest paquet, com també mitjanes ponderades, direcció mitjana circular del vent i l’auditoria completa de cobertura intradiària.

La correcció dels intervals pot consultar més files de D1 que la versió defectuosa. Abans de desplegar D, revisar la quota i les respostes de 7/30/365 dies a staging; no activar un pla de pagament. Queda pendent optimitzar la memòria cau de l’històric, independent de les marques de refresc del client, i provar el cost amb volum. Les proves SQL són locals, no generen escriptures facturables remotes.

## Reversió

Revertir només D i renovar la revisió PWA, amb aprovació per al Worker. No revertir A/B ni perdre la reserva social. Les files amb NULL són compatibles amb l’esquema existent, però tornar al comportament anterior podria tornar a fabricar zeros en noves captures; preferible correcció endavant. No omplir NULL ni recalcular l’arxiu en bloc.
