# Observatori Meteorològic Fontanillas

Dashboard meteorològic modular per a Sant Celoni i el Montseny. Mostra les observacions actuals de l’estació ISANTC198, sensació tèrmica i Humidex, extrems i tendències reals de Weather Underground, sis famílies de gràfiques de fins a un any, avisos oficials de proximitat, predicció de 48 hores i 7 dies amb hores de llum i sol previst, comparació de cinc fonts fiables, visor temporal de models, radar animat i Meteocat, astronomia solar i nocturna, webcam i contacte privat.

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

Si l’API no està disponible, la interfície activa un mode demo identificat clarament. El Worker ofereix dades actuals a `/`, històric horari real a `/history`, control de qualitat a `/health` i recepció segura del formulari a `POST /contact`. La predicció utilitza Open-Meteo i està identificada com a dada de model.

Les targetes principals mostren temperatura, sensació tèrmica, temperatura de xafogor o Humidex, humitat, punt de rosada, vent, ratxa i direcció, pressió, pluja acumulada, intensitat de precipitació, radiació solar i índex UV. El Worker ja facilita les lectures directes i el navegador calcula la sensació i l’Humidex amb fórmules meteorològiques. El panell de diagnosi afegeix bulb humit, dèficit de pressió de vapor, base estimada del núvol, humitat absoluta, Beaufort, pressió de vapor, raó de mescla i densitat de l’aire, sempre identificats com a càlculs.

L’arxiu d’extrems permet seleccionar 24 hores, 7 dies, 30 dies o 1 any i resumeix temperatura, pluja, vent, radiació, UV, pressió i humitat. Si l’estació encara no té tot el període, el web mostra la cobertura real disponible en comptes d’omplir els buits.

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
```

## Funcions actives

1. Històric horari real de Weather Underground / VEVOR.
2. Línia temporal exacta de 48 hores, previsió de 7 dies amb hores de llum i comparador Meteocat/AEMET/eltiempo.es/Yr/Meteoblue.
3. Minigràfics de les últimes hores, UV a 3 hores, sis gràfiques compactes i extrems de 24 h, 7 dies, 30 dies i 1 any.
4. Visor temporal Ventusky, taula diària navegable ECMWF/GFS/ICON, animació RainViewer predeterminada i radar oficial Meteocat alternatiu.
5. Posició del Sol, hora solar, Lluna, qualitat nocturna, equinoccis, solsticis i esdeveniments observables.
6. Formulari de contacte sense publicar la bústia privada.
7. Avisos oficials de Meteocat i accés local d’AEMET per al Vallès Oriental i el Prelitoral de Barcelona.
8. Escales interpretatives i explicacions pedagògiques dels valors calculats.

## Desplegament a Cloudflare Pages

- Framework: cap
- Ordre de compilació: buit
- Directori de sortida: `.`

## Publicar canvis a GitHub

```bash
git add .
git commit -m "Publica la versió 5.0 del dashboard"
git push origin main
```

Cloudflare Pages publicarà automàticament el nou commit.
