# Observatori Meteorològic Fontanillas

Dashboard meteorològic modular per a Sant Celoni i el Montseny. Mostra les observacions actuals de l’estació ISANTC198, extrems i tendències reals de Weather Underground, gràfiques històriques, previsió horària de suport i la webcam.

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

Si l’API no està disponible, la interfície activa un mode demo identificat clarament. El Worker ofereix dades actuals a `/`, històric horari real a `/history` i control de qualitat a `/health`. La previsió horària de suport utilitza Open-Meteo i està identificada com a dada de model.

## Arquitectura

```text
index.html
css/                 Disseny, variables i estructura responsive
js/                  Arrencada, API, configuració i utilitats
modules/             Estació, gràfiques i connectors futurs
assets/              Logotips, icones i imatges
data/                Catàlegs i dades estàtiques futures
```

## Full de ruta

1. ✅ Històric horari real de Weather Underground / VEVOR.
2. Afegir radar i llamps de Meteocat / AEMET.
3. Agregar predicció local d’AEMET, Meteocat i eltiempo.es.
4. Comparar models ECMWF i GFS.
5. Afegir rècords, normals climàtiques i exportació de dades.

## Desplegament a Cloudflare Pages

- Framework: cap
- Ordre de compilació: buit
- Directori de sortida: `.`

## Publicar canvis a GitHub

```bash
git add .
git commit -m "Crea el dashboard inicial de l'observatori"
git push origin main
```

Cloudflare Pages publicarà automàticament el nou commit.
