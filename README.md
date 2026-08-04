# Observatori Meteorològic Fontanillas

Dashboard meteorològic modular per a Sant Celoni i el Montseny. Mostra les observacions actuals de l’estació ISANTC198, sensació tèrmica i Humidex, un arxiu propi persistent amb extrems i tendències, sis famílies de gràfiques de fins a un any, control de qualitat de les dades, avisos oficials de proximitat, predicció de 48 hores i 7 dies amb hores de llum i sol previst, comparació de cinc fonts fiables, visor temporal de models, radar animat i Meteocat, astronomia solar i nocturna, webcam i contacte privat.

## Novetats de la versió 5.2

- Base de dades pròpia Cloudflare D1 preparada per conservar les observacions de l’estació sense el límit temporal de Weather Underground.
- Captura automàtica cada cinc minuts mitjançant un Cron Trigger del Worker, sense duplicar lectures.
- Històric híbrid: la base pròpia té prioritat i Weather Underground continua actuant com a suport recent mentre l’arxiu creix.
- Resolució automàtica segons l’horitzó: detall brut per als períodes curts, resum horari fins a 45 dies i resum diari per als períodes llargs.
- Nou panell «Dades sota control» amb salut general, latència, antiguitat de la lectura, disponibilitat de les últimes 24 hores i cobertura de 24 h, 7 dies, 30 dies i un any.
- Control individual de temperatura, humitat, pressió, vent, pluja, radiació solar i UV per detectar sensors incomplets.
- Pluja acumulada calculada amb increments reals entre observacions, evitant sumar repetidament els totals diaris.
- Rutes noves del Worker: `/quality` per a l’observabilitat i `/history` ampliada fins a 366 dies.
- Funcionament progressiu: el dashboard continua sent compatible amb el Worker anterior fins que s’activi D1.

## Posada en marxa

És una web estàtica: no necessita compilació ni dependències. Per provar-la localment, obre una terminal dins la carpeta i executa:

```bash
python3 -m http.server 8080
```

Després visita `http://localhost:8080`.

> Cal servir la carpeta amb un servidor local. Obrir `index.html` directament pot bloquejar els mòduls JavaScript al navegador.

## Dades actuals

La configuració de l’API és a `js/config.js`. El dashboard consulta:

`https://fonta-meteo.marcelfonta.workers.dev`

Si l’API no està disponible, la interfície activa un mode demo identificat clarament. El Worker ofereix dades actuals a `/`, històric propi i de suport a `/history`, diagnosi tècnica a `/health`, qualitat i cobertura a `/quality` i recepció segura del formulari a `POST /contact`. La predicció utilitza Open-Meteo i està identificada com a dada de model.

Les targetes principals mostren temperatura, sensació tèrmica, temperatura de xafogor o Humidex, humitat, punt de rosada, vent, ratxa i direcció, pressió, pluja acumulada, intensitat de precipitació, radiació solar i índex UV. El Worker ja facilita les lectures directes i el navegador calcula la sensació i l’Humidex amb fórmules meteorològiques. El panell de diagnosi afegeix bulb humit, dèficit de pressió de vapor, base estimada del núvol, humitat absoluta, Beaufort, pressió de vapor, raó de mescla i densitat de l’aire, sempre identificats com a càlculs.

L’arxiu d’extrems permet seleccionar 24 hores, 7 dies, 30 dies o 1 any i resumeix temperatura, pluja, vent, radiació, UV, pressió i humitat. Si l’estació encara no té tot el període, el web mostra la cobertura real disponible en comptes d’omplir els buits. La V5.2 crea una observació D1 cada cinc minuts i adapta la resolució abans d’enviar-la al navegador, de manera que l’històric anual es manté àgil.

## Històric persistent i qualitat

El directori `worker/` inclou el Worker V4 i l’esquema SQL de referència. El Worker crea automàticament la taula necessària quan detecta la vinculació D1 `DB`, desa les lectures programades i conserva Weather Underground com a font de suport. La ruta `/quality` calcula:

- estat i antiguitat de l’última observació;
- latència de la consulta a l’estació;
- nombre de lectures pròpies desades;
- disponibilitat real de les últimes 24 hores;
- cobertura temporal acumulada;
- completitud de cada família de sensors.

Per activar aquesta part cal seguir `GUIA-ACTIVAR-DADES-V5.2.md`. No s’ha de publicar cap clau API al repositori.

Les escales de color de les targetes són interpretatives: descriuen confort, intensitat o risc, però no representen encara una anomalia respecte d’una normal climàtica. L’índex UV segueix les categories internacionals emprades per AEMET: baix, moderat, alt, molt alt i extrem.

## Fonts de predicció i radar

- Open-Meteo: previsió horària i diària pròpia del dashboard a les franges principals de 48 hores i 7 dies.
- Meteocat: ginys oficials municipals de 72 hores i 8 dies, més el giny oficial del radar amb zoom.
- AEMET: giny municipal oficial configurat en català amb cel, temperatura, sensació tèrmica, pluja, humitat, vent i avisos, més accessos a les taules horàries i de 7 dies.
- eltiempo.es: giny oficial complet per a Sant Celoni, configurat en català, graus Celsius i vent en km/h.
- Yr / MET Norway: giny oficial fosc de 8 dies per a Sant Celoni amb temperatura, precipitació i vent.
- Meteoblue: giny oficial amb fons meteorològic i previsió cada 3 hores durant 4 dies, generat per a Sant Celoni i conservat amb l’enllaç d’atribució obligatori.
- Ventusky: visor cartogràfic inserit amb línia temporal, capes i canvi entre GFS, ICON i GEM. ECMWF es manté disponible mitjançant el visor extern identificat.
- RainViewer: mapa de radar interactiu amb les imatges disponibles de les dues últimes hores.
- AEMET Barcelona–Gelida: accés directe per contrastar el radar oficial.

## Avisos meteorològics

El bloc de vigilància mostra directament el giny oficial de Situacions Meteorològiques de Perill de Meteocat. La lectura de proximitat identifica els dos àmbits de referència de Sant Celoni: el Vallès Oriental a Meteocat i el Prelitoral de Barcelona a AEMET. També incorpora l’escala de perill de Meteocat i accessos directes a les dues fonts oficials.

Els avisos no es reinterpreten ni es converteixen en un estat propi del dashboard, perquè provenen de serveis externs i poden canviar ràpidament. En cas de temps advers cal consultar el detall oficial i seguir les indicacions de Protecció Civil i del 112. No cal modificar el Worker ni afegir cap clau per utilitzar aquest bloc.

Els recursos oficials es mostren en pestanyes perquè el seu disseny extern no trenqui la lectura general del dashboard. Els contenidors de Meteocat i AEMET adapten l’alçada al contingut útil per eliminar grans franges blanques, mentre que eltiempo.es combina el giny amb un resum visual. En la vista horària de Meteocat també s’ajusta l’amplada al contingut real, i Meteoblue rep un fons fosc propi perquè el seu tema transparent sigui llegible. Meteocat ofereix dades horàries riques dins del seu propi giny, però el navegador no pot remaquetar el contingut d’un iframe extern. AEMET OpenData necessita una clau d’API per construir una taula nativa, i eltiempo.es no ofereix una API pública equivalent al seu giny. Per això el projecte conserva els ginys i enllaços oficials, sense scraping ni dades simulades.

## Astronomia local

El mòdul astronòmic calcula la fase i la il·luminació lunar, les pròximes fases, la posició actual del Sol, elevació, azimut, hora solar aparent, sortida, posta, migdia solar, durada de la nit i una puntuació orientativa per observar el cel. També identifica l’estació astronòmica actual i mostra els pròxims equinoccis i solsticis amb data i hora local. Quan és accessible, contrasta les fases, els horaris i les estacions amb l’API de l’Observatori Naval dels Estats Units (USNO); si no, conserva un càlcul local de reserva. Els esdeveniments destacats utilitzen com a referència l’IGN i el calendari de l’IMO.

## Contacte privat

El correu destinatari no forma part d’aquest repositori. El Worker necessita aquests secrets de Cloudflare:

- `RESEND_API_KEY`: clau privada de l’API d’enviament.
- `CONTACT_TO`: bústia privada que rebrà els missatges.
- `CONTACT_FROM` (opcional): remitent tècnic del domini verificat.

La configuració utilitza Resend només per enviar. La recepció de correu continua desactivada a Resend i els registres MX actuals del domini principal es conserven. El formulari incorpora validació, límit de longitud, comprovació d’origen, camp antispam invisible i temps mínim d’emplenament.

## Arquitectura

```text
index.html
css/                 Disseny, variables i estructura responsive
js/                  Arrencada, API, configuració i utilitats
modules/             Estació, gràfiques i connectors futurs
assets/              Logotips, icones i imatges
data/                Catàlegs i dades estàtiques futures
worker/              Worker Cloudflare V4 i esquema de la base D1
```

## Funcions actives

1. Històric persistent propi a D1, amb Weather Underground com a suport recent.
2. Línia temporal exacta de 48 hores, previsió de 7 dies amb hores de llum i comparador Meteocat/AEMET/eltiempo.es/Yr/Meteoblue.
3. Minigràfics de les últimes hores, UV a 3 hores, sis gràfiques compactes i extrems de 24 h, 7 dies, 30 dies i 1 any.
4. Visor temporal Ventusky, taula diària navegable ECMWF/GFS/ICON, animació RainViewer predeterminada i radar oficial Meteocat alternatiu.
5. Posició del Sol, hora solar, Lluna, qualitat nocturna, equinoccis, solsticis i esdeveniments observables.
6. Formulari de contacte sense publicar la bústia privada.
7. Avisos oficials de Meteocat i accés local d’AEMET per al Vallès Oriental i el Prelitoral de Barcelona.
8. Escales interpretatives i explicacions pedagògiques dels valors calculats.
9. Panell de qualitat, disponibilitat, cobertura i salut individual dels sensors.

## Desplegament a Cloudflare Pages

- Framework: cap
- Ordre de compilació: buit
- Directori de sortida: `.`

## Publicar canvis a GitHub

```bash
git add .
git commit -m "Publica la versió 5.2 amb historial propi"
git push origin main
```

Cloudflare Pages publicarà automàticament el nou commit.
