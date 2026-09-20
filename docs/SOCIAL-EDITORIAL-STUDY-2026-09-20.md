# Estudi editorial: més utilitat en 30 segons

Estat: proposta, no activada. Sol·licitud de Marcel: estudiar aire, pol·len i
altres dades de la web sense allargar el vídeo. Cap publicació ni canvi de cron.

## Conclusió

És viable i pot fer les peces més útils per al dia a dia. No és millor posar-hi
més xifres: és millor seleccionar la dada que canvia una decisió. No prometem
millores de retenció o seguidors sense una comparació real posterior.

## Què hi ha realment

Revisió de `src/features/environment.js`, `src/modules/astronomia.js`,
`worker/index.js` (família de pols) i fonts primàries el 20-09-2026.

| Dada | Viabilitat i ús recomanat | Condició abans d'automatitzar |
| --- | --- | --- |
| Aire: índex europeu, PM2,5, PM10, NO₂, O₃ | Sí, especialment si es deteriora. Una categoria i contaminant dominant; evitar sis concentracions. | CAMS ENSEMBLE via Open-Meteo, estimació regional (~11 km), no sensor Fontanillas. Validar escala/versió contra el proveïdor i no confondre índex amb límit legal. |
| Pol·len | Sí, condicionat, no un indicador universal d'al·lèrgia. Mostrar espècie i període. | La web consulta gramínies, olivera, bedoll, artemísia i ambrosia; no cobreix xiprer, plàtan, parietària ni espores. Contrastar/ampliar amb XAC-UAB, verificar API, condicions d'ús i correspondència territorial. |
| UV | Prioritat alta al matí i migdia: màxim PREVIST i franja; al migdia es pot afegir lectura OBSERVADA amb hora. | No usar el sensor nocturn a zero per resumir demà. Font, cobertura, unitat d'índex sense °C i vigència explícites. |
| Sol i Lluna | Sí, com a detall compacte. Sortida/posta i fase datades. | Astronomia calculada no és previsió de visibilitat: núvols, horitzó i relleu importen. |
| Pols sahariana | Sí, quan hi ha episodi modelitzat. | Coordinar amb la família social existent; no duplicar alertes ni convertir el llindar editorial en llindar sanitari. |
| Sequera/incendi | Només canvis significatius de font oficial i àmbit pertinent. | Un visor o enllaç web no és necessàriament una API integrable. No inferir risc oficial d'incendi a partir de calor/vent locals. |

CAMS Europa ofereix resolució horària, però la documentació d'Open-Meteo indica
actualització del model cada 24 hores. L'hora de validesa no és l'hora de generació
ni una mesura acabada de rebre. La consulta `current` de la web no basta per
descriure la tarda o demà: cal demanar la sèrie horària del període corresponent.

La XAC publica nivells/prediccions per localitats i períodes setmanals: no
convertir-los en una predicció horària exacta de Sant Celoni. Un valor baix entre
cinc espècies CAMS no justifica «poc pol·len» o «sense risc d'al·lèrgia» en general.

## Riscos detectats en el codi actual (no corregits dins d'aquest estudi)

1. `number`, `aqiReading` i `componentReading` fan `Number(value)`: `null` o
   cadena buida es converteixen en zero. Això pot produir «Bona» sense dades.
2. `pollenName` admet `null` al filtre numèric, encara que `pollenReading` el
   rebutgi després; pot retornar una espècie amb «No disponible» com a dominant.
3. `notifyEnvironment` i `render` substitueixen una hora absent per l'hora del
   sistema: pot donar una falsa aparença d'actualització.
4. `updateEnvironmentStation` rep UV però aquí no comprova antiguitat de la
   lectura. Abans de reutilitzar-la, exigir timestamp i política de caducitat.
5. Els llindars locals de pol·len són orientatius; cal documentar-ne l'origen
   abans d'usar-los en contingut automàtic de salut. No equiparar escales XAC/CAMS.

Bloqueig editorial: no reutilitzar directament aquests formatadors per publicar.
Primer normalitzador compartit estricte, prova de null/buit/caducat i font/hora.

## Proposta de muntatge (mateixos 30 segons)

Primera versió de prova: conservar les sis escenes de cinc segons. Matí, tarda,
vespre, observació/gràfica real i tendència es mantenen; la sisena esdevé variable.

- Si la precipitació és rellevant: mapa horari del model, no radar.
- Si no ho és i hi ha un senyal ambiental sòlid: una sola escena d'aire, UV o
  pol·len, amb titular, valor/categoria, període, font i una orientació prudent.
- Si no hi ha un senyal ni dades suficients: contingut meteorològic ja verificat,
  sense forçar cap dada ambiental. La fase lunar pot continuar com a detall.
- Un avís oficial rellevant té prioritat des del titular inicial; no s'amaga al
  segon 25. No crear un resum ambiental combinat anomenat «risc» o «salut».

La selecció ha d'avaluar TOTA la finestra horària pertinent amb prou cobertura.
Quatre punts de mapa sense pluja no permeten concloure que no plourà en tot el dia
ni justificar sols la substitució del mapa. Cal també evitar ocultar un episodi
quan ja existeix un avís oficial pertinent.

No comprimir sis escenes fins a fer-les il·legibles. Una escena de cinc segons
ha de tenir una idea principal, no totes les dades de la web. Possibilitat per a
una fase posterior: fusionar observació i tendència només després de provar
lectura mòbil i comprensió, no com a canvi automàtic inicial.

### Per edició

- **06:45:** avui, franges, UV màxim previst; aire/pol·len si rellevants.
- **14:00, imatge:** lectura actual datada + tarda/vespre. Franja ambiental de
  màxim dos indicadors clars; detall al text/carrusel, no lletra petita.
- **20:30:** demà i les seves franges. No copiar l'aire o UV actual com si fos
  demà. Si apareix astronomia d'aquesta nit, posar-ne data pròpia; mai barrejar-la
  silenciosament amb la data de previsió de demà.

## Criteris d'acceptació abans d'activació

1. Font, tipus (mesura/model/butlletí), àmbit, validesa, hora de recuperació i
   cobertura persistits amb l'esborrany. Imatge, vídeo i text comparteixen dades.
2. No confondre l'hora vàlida amb l'emissió; no refrescar artificialment timestamps.
3. Absències, errors i caducitat fallen de manera segura, sense zeros o «aire bo».
4. Categories traçables al proveïdor. Recomanacions generals amb font sanitària,
   sense diagnòstic ni consells personals d'activitat segura.
5. Un únic detall ambiental prioritari, raó de selecció registrada; ordre
   determinista i revisable, no elecció lliure d'un model de llenguatge.
6. Mateixa cua/deduplicació, memòria cau compartida; cap nova publicació separada
   per cada indicador ni consulta per fotograma.
7. Proves de dia tranquil, UV rellevant, contaminació, pol·len parcial,
   avís/pluja prioritaris, canvi de data i proveïdor caigut. Etiquetar les dades
   sintètiques de QA; no presentar-les com a previsió real.
8. Revisió en mòbil, 30 s comprovats, fonts llegibles i música actual; després
   PR, staging i autorització explícita per activar.

## Ordre proposat

1. Fiabilitat dels valors ambientals i timestamps; no traslladar els defectes.
2. UV previst i aire per franges, pilot de sisena escena variable.
3. Pol·len amb cobertura/escala/font adequades, inclosa revisió de XAC.
4. Incorporar astronomia datada i sortida/posta sense saturar el muntatge.
5. Comparar peces després de publicar amb autorització: retenció, finalització,
   desats, comparticions i seguiments per abast; separar episodis meteorològics
   i plataformes. Cap garantia de creixement a partir del disseny sol.

## Fonts contrastades

- Open-Meteo / CAMS: https://open-meteo.com/en/docs/air-quality-api
- EEA, índex i metodologia: https://airindex.eea.europa.eu/AQI/
- XAC-UAB, cobertura i butlletins: https://aerobiologia.cat/pia/ca/forecast/catalunya
- XAC API (integració pendent): https://aerobiologia.cat/pia/en/api
- OMS, índex UV i protecció a partir de 3: https://www.who.int/news-room/fact-sheets/detail/ultraviolet-radiation
- USNO, fase/il·luminació a migdia local: https://aa.usno.navy.mil/data/api
