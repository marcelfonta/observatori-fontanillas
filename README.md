# Observatori Meteorològic Fontanillas — V7 · Fase 2

Refactorització d’arquitectura del projecte sense alterar intencionadament l’experiència visual ni les funcions meteorològiques actives.

## Objectiu de la Fase 1

Separar responsabilitats, eliminar fitxers de desenvolupament innecessaris del paquet publicable i preparar la base per a la V7 funcional: avisos push, llamps integrats, centre de dades i descàrrega d’històrics.

## Estructura activa

```text
index.html
metodologia.html
css/
  variables.css
  layout.css
  style.css
src/
  app.js
  core/
    config.js
    dom.js
  services/
    weather-api.js
  features/
    analytics.js
    push.js
    pwa.js
    share.js
  modules/
    *.js
assets/
data/
  catalogs/
  exports/
worker/
  index.js
  schema.sql
docs/
archive/
  worker-legacy/
admin/
service-worker.js
site.webmanifest
robots.txt
sitemap.xml
_headers
```

## Principis de l’arquitectura

- `src/core`: configuració i utilitats sense dependència de la interfície.
- `src/services`: únic punt d’accés del navegador a dades i APIs.
- `src/features`: funcionalitats transversals (Analytics, Push, PWA, Compartir).
- `src/modules`: lògica de les seccions meteorològiques del dashboard.
- `worker/index.js`: única versió activa/canònica del Worker. Les versions anteriors queden a `archive/worker-legacy/`.
- `data/exports`: espai reservat per a futures exportacions del Centre de Dades.
- `admin`: reservat per a eines privades futures; no hi ha cap panell públic actiu en aquesta fase.

## Desenvolupament local

```bash
python3 -m http.server 8080
```

Obre `http://localhost:8080`. No obris l’HTML directament amb `file://`, perquè els mòduls ES poden quedar bloquejats.

## Desplegament

Cloudflare Pages continua servint el projecte com a web estàtica. No hi ha pas de compilació.

```bash
git add .
git commit -m "V7 Fase 1 arquitectura"
git push
```

## Worker

El codi actiu és `worker/index.js`. Conserva la vinculació D1 `DB`, secrets i crons existents. La Fase 2 amplia el Worker amb historial d’avisos i notificacions automàtiques. Cal desplegar `worker/index.js` i aplicar `worker/schema.sql`.

## Configuració

La configuració de frontend és a `src/core/config.js`. Inclou URL de l’API, intervals d’actualització, coordenades, webcam i placeholders de GA4/OneSignal.

## Següents fases

1. **Fase 2 — Avisos:** notificacions push reals i motor d’avisos sense missatges tècnics.
2. **Fase 3 — Llamps:** visor integrat estable i font oficial/alternativa amb fallback.
3. **Fase 4 — Centre de Dades:** pàgina nova amb consulta, gràfics, rècords i descàrrega CSV/Excel/JSON/PDF.

Consulta `docs/ARQUITECTURA-V7.md` i `docs/ROADMAP-V7.md` per al detall.


## V7 · Fase 2: avisos

El frontend ja inclou preferències de notificacions i historial. El Worker desa episodis oficials a D1 i pot enviar notificacions automàtiques via OneSignal quan apareix un episodi nou.

Per activar l’enviament real:
1. Configura `oneSignalAppId` a `src/core/config.js`.
2. Al Worker, afegeix `ONESIGNAL_APP_ID` i el secret `ONESIGNAL_REST_API_KEY`.
3. Configura un Cron Trigger (recomanat: cada 10 minuts).
4. Executa/actualitza `worker/schema.sql` al D1 perquè existeixin `alert_events` i `alert_state`.

Sense aquestes credencials, la web funciona normalment però oculta el control Push per evitar missatges tècnics als visitants.
