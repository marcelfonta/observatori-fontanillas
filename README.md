# Observatori Meteorològic Fontanillas

Dashboard meteorològic modular per a Sant Celoni i el Montseny. Mostra les observacions actuals de l’estació ISANTC198, extrems i tendències reals de Weather Underground, minigràfics, gràfiques històriques, predicció de 48 hores i 7 dies, comparació ECMWF/GFS/ICON, contrast de fonts, radar interactiu, astronomia local, webcam i contacte privat.

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

Les targetes principals mostren temperatura, sensació, humitat, punt de rosada, vent, ratxa i direcció, pressió, pluja acumulada, intensitat de precipitació, radiació solar i índex UV quan el sensor els facilita. El panell de diagnosi afegeix valors derivats —bulb humit, dèficit de pressió de vapor, base estimada del núvol, humitat absoluta i Beaufort— i els identifica sempre com a càlculs, no com a sensors addicionals.

Les escales de color de les targetes són interpretatives: descriuen confort, intensitat o risc, però no representen encara una anomalia respecte d’una normal climàtica. L’índex UV segueix les categories internacionals emprades per AEMET: baix, moderat, alt, molt alt i extrem.

## Fonts de predicció i radar

- Open-Meteo: previsió horària i diària i comparació dels models ECMWF, GFS i ICON.
- Meteocat, AEMET i eltiempo.es: centre de contrast compacte, sense ginys visuals externs.
- RainViewer: mapa de radar interactiu amb les imatges disponibles de les dues últimes hores.
- Meteocat i AEMET Barcelona–Gelida: accessos directes per contrastar el radar oficial.

Per convertir AEMET i eltiempo.es en una comparació numèrica unificada cal disposar d’una clau d’AEMET OpenData i d’una via oficial d’integració d’eltiempo.es. El projecte no extreu dades d’altres webs mitjançant scraping.

## Astronomia local

El mòdul nocturn calcula la fase i la il·luminació lunar, les pròximes fases, la durada de la nit i una puntuació orientativa per observar el cel segons els núvols, la pluja prevista i la llum de la Lluna. Quan és accessible, contrasta les fases i els horaris amb l’API d’efemèrides de l’Observatori Naval dels Estats Units (USNO). Els esdeveniments destacats de 2026 utilitzen com a referència l’IGN i el calendari de pluges de meteors de l’IMO.

## Contacte privat

El correu destinatari no forma part d’aquest repositori. El Worker v3 necessita aquests secrets de Cloudflare:

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
2. Línia temporal exacta de 48 hores, previsió de 7 dies i comparació ECMWF/GFS/ICON.
3. Minigràfics de les últimes hores a les targetes disponibles.
4. Radar interactiu RainViewer, contrast oficial Meteocat i centre Meteocat/AEMET/eltiempo.es.
5. Formulari de contacte sense publicar la bústia privada.
6. Escales interpretatives, explicacions pedagògiques i mòdul de cel nocturn.

## Desplegament a Cloudflare Pages

- Framework: cap
- Ordre de compilació: buit
- Directori de sortida: `.`

## Publicar canvis a GitHub

```bash
git add .
git commit -m "Afegeix el centre de prediccio i contacte privat"
git push origin main
```

Cloudflare Pages publicarà automàticament el nou commit.
