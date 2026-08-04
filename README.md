# Observatori Meteorològic Fontanillas

Dashboard meteorològic modular per a Sant Celoni i el Montseny. Mostra les observacions actuals de l’estació ISANTC198, sensació tèrmica i Humidex, extrems i tendències reals de Weather Underground, gràfiques de fins a un any, predicció de 48 hores i 7 dies, quatre escenaris comparables, visor temporal de models, radar interactiu, astronomia solar i nocturna, webcam i contacte privat.

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

Les targetes principals mostren temperatura, sensació tèrmica, temperatura de xafogor o Humidex, humitat, punt de rosada, vent, ratxa i direcció, pressió, pluja acumulada, intensitat de precipitació, radiació solar i índex UV. El Worker ja facilita les lectures directes i el navegador calcula la sensació i l’Humidex amb fórmules meteorològiques. El panell de diagnosi afegeix bulb humit, dèficit de pressió de vapor, base estimada del núvol, humitat absoluta i Beaufort, sempre identificats com a càlculs.

L’arxiu d’extrems permet seleccionar 24 hores, 7 dies, 30 dies o 1 any i resumeix temperatura, pluja, vent, radiació, UV, pressió i humitat. Si l’estació encara no té tot el període, el web mostra la cobertura real disponible en comptes d’omplir els buits.

Les escales de color de les targetes són interpretatives: descriuen confort, intensitat o risc, però no representen encara una anomalia respecte d’una normal climàtica. L’índex UV segueix les categories internacionals emprades per AEMET: baix, moderat, alt, molt alt i extrem.

## Fonts de predicció i radar

- Open-Meteo: previsió horària i diària, Best Match local i comparació homogènia amb ECMWF, GFS i ICON.
- Meteocat, AEMET i eltiempo.es: centre de contrast compacte, sense ginys visuals externs.
- Ventusky: visor cartogràfic inserit amb línia temporal, capes i canvi entre GFS, ICON i GEM. ECMWF es manté disponible mitjançant el visor extern identificat.
- RainViewer: mapa de radar interactiu amb les imatges disponibles de les dues últimes hores.
- Meteocat i AEMET Barcelona–Gelida: accessos directes per contrastar el radar oficial.

Per convertir AEMET i eltiempo.es en una comparació numèrica unificada cal disposar d’una clau d’AEMET OpenData i d’una via oficial d’integració d’eltiempo.es. El projecte no extreu dades d’altres webs mitjançant scraping.

## Astronomia local

El mòdul astronòmic calcula la fase i la il·luminació lunar, les pròximes fases, la posició actual del Sol, elevació, azimut, sortida, posta, migdia solar, durada de la nit i una puntuació orientativa per observar el cel. També identifica l’estació astronòmica actual i mostra els pròxims equinoccis i solsticis amb data i hora local. Quan és accessible, contrasta les fases, els horaris i les estacions amb l’API de l’Observatori Naval dels Estats Units (USNO); si no, conserva un càlcul local de reserva. Els esdeveniments destacats utilitzen com a referència l’IGN i el calendari de l’IMO.

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
2. Línia temporal exacta de 48 hores, previsió de 7 dies i quatre escenaris comparables.
3. Minigràfics de les últimes hores, gràfiques i extrems de 24 h, 7 dies, 30 dies i 1 any.
4. Visor temporal Ventusky, taula ECMWF/GFS/ICON i radar interactiu RainViewer.
5. Posició del Sol, Lluna, qualitat nocturna, equinoccis, solsticis i esdeveniments observables.
6. Formulari de contacte sense publicar la bústia privada.
7. Escales interpretatives i explicacions pedagògiques dels valors calculats.

## Desplegament a Cloudflare Pages

- Framework: cap
- Ordre de compilació: buit
- Directori de sortida: `.`

## Publicar canvis a GitHub

```bash
git add .
git commit -m "Afegeix dades solars, extrems anuals i visor de models"
git push origin main
```

Cloudflare Pages publicarà automàticament el nou commit.
