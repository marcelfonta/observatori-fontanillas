# Auditoria E · consum D1 i claredat de les gràfiques

## Objectiu

Reduir les lectures repetides de l’històric després de corregir els intervals del paquet D i fer inequívoca la lectura temporal i pluviomètrica dels gràfics.

## Canvis

- Clau canònica per `start`, `end` i `resolution`; s’exclou deliberadament `fresh`, que només és un marcador de refresc del navegador.
- TTL de cinc minuts, igual a la cadència ordinària de captura. Una còpia plana dins de l’isolate evita repetir consultes mentre aquest continua actiu; la Cache API afegeix una capa regional quan l’entorn la suporta. No es presenta com una única còpia global.
- Només es desen respostes amb observacions. Una fallada de Cache API no interromp `/history`; queda registrada de manera estructurada i la consulta continua.
- Les escriptures de memòria cau passen per `ctx.waitUntil()`. No hi ha estat de petició en variables globals, binding nou, secret, migració ni reescriptura de D1.
- `X-History-Cache` permet distingir `MISS`, `RUNTIME_HIT` i `HIT` a staging. No exposa dades sensibles.
- Domini horitzontal fixat als timestamps reals, evitant dates visuals anteriors o posteriors a les observacions.
- Doble escala pluviomètrica: acumulació en mm a l’esquerra i intensitat en mm/h a la dreta.

## Acceptació

- Dues peticions equivalents amb valors `fresh` diferents generen la mateixa clau.
- Data o resolució diferents generen una altra clau.
- Cap resposta buida queda desada.
- Un primer accés a staging retorna `MISS` i una repetició equivalent retorna `RUNTIME_HIT` o `HIT`, segons la capa disponible.
- Proves de 7, 30 i 365 dies, suite completa, dry-run i revisió visual en escriptori i mòbil.
- Abans de producció, comparar lectures D1 i conservar un procediment de reversió al Worker 22.29.8.

## Límits

La Cache API no replica entrades entre centres de dades i no elimina totes les lectures fredes o simultànies. Aquest paquet no modifica mitjanes, direcció del vent, dades antigues ni cobertura intradiària; són el següent bloc estadístic.
