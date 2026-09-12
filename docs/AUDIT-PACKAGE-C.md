# Auditoria C · cobertura i pluja del Centre de Dades

## Abast

Correcció de càlculs i etiquetes al navegador, sense canviar API, Worker, D1, horaris o publicacions. Continua sobre el merge de la PR 138. La integració de B no equival al seu desplegament: el procediment de pausa i revisió dels enviaments continua pendent d’autorització.

## Contracte

- S’accepten instants `t` en mil·lisegons normalitzats, finits i no futurs. Es rebutgen valors absents/booleans. Un mateix instant només compta una vegada; en cas de conflicte es conserva el primer registre, no se’n fabrica una combinació.
- Els dies amb registres es compten per dates diferents d’Europe/Madrid. L’interval inclou els dies de calendari entre primera i última data, no intervals arrodonits de 24 hores. Un dia amb registres no es declara complet.
- La suma de pluja usa increments no negatius vàlids. Sense cap increment conegut retorna `null`; un zero real continua sent zero. Si n’hi falten, la suma només reflecteix la part registrada.
- Només per a sèries antigues sense camp d’increment, es poden restar comptadors consecutius del mateix dia que no hagin retrocedit. Un comptador aïllat, un reinici o un canvi de dia no inventen un increment. No se substitueix un increment explícitament absent per un comptador.
- Les targetes avui/ahir/mes/any usen l’arxiu, no un `rainToday` sense comprovar-ne la data. Poden anar per darrere de la lectura instantània. Les sumes es presenten com a registrades i possiblement parcials.
- Els dies des de l’últim registre de pluja són l’antiguitat d’un esdeveniment trobat, no prova d’absència posterior de pluja. Sense coincidència es mostra un guió; no s’infereix una ratxa seca des de l’inici de l’arxiu.
- Sense episodi recent identificable es mostra un guió. L’agrupació d’episodis existent continua sent orientativa, no una reconstrucció de buits.

## Verificació

Proves de càlcul i de renderitzat real amb document simulat: absències, zeros, dades mixtes, duplicats, reinici de comptador, canvi de dia, canvi d’hora d’estiu/hivern, buits de diversos dies i lectura actual antiga. Nou mòdul inclòs a la PWA.

Prova visual local del fragment real de pluviometria amb dades fictícies: 320 i 360 px, textos nous en català/francès, estat buit i parcial, sense desbordament ni errors de consola. La guia de navegador s’ha aplicat amb el navegador disponible perquè `agent-browser` no està instal·lat. No és una prova del backend ni de dades reals de producció.

## Límits i següents passos

No es recalculen els increments a D1 ni les agregacions horàries/diàries de l’origen, ni es canvien gràfiques o publicacions. Un zero que ja arribi fabricat per la font no es pot distingir aquí d’un zero observat. La cobertura intradiària i les mitjanes ponderades requereixen una auditoria separada. Es conserven les traduccions antigues no relacionades; només es garanteixen les noves etiquetes d’aquest paquet.

## Reversió

Revertir només aquesta PR i renovar la memòria cau del frontend, amb el flux habitual d’aprovació. Cap migració ni dades a restaurar. No revertir els paquets de Worker A/B com a part d’aquesta reversió.
