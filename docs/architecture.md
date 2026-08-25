# Architecture

## System boundaries

Observatori Fontanillas is a static, multi-page web application served by Cloudflare Pages and backed by a Cloudflare Worker. There is no frontend compilation step and no production frontend dependency bundle.

```text
Cloudflare Pages                         Cloudflare Worker + D1
HTML/CSS/ES modules ─── HTTPS ────────► current observation and history
  src/app.js                              alerts and forecast verification
  src/modules/                            protected administration
  src/features/                           scheduled persistence and integrations
  src/services/weather-api.js
```

`src/app.js` composes the portal. `src/modules/` contains weather-domain views; `src/features/` contains cross-cutting functions such as PWA, sharing, analytics, learning, push and Meteo IA. `src/services/weather-api.js` is the frontend’s central HTTP boundary. `src/core/` provides configuration and DOM utilities.

## Backend

`worker/index.js` is the canonical backend. It retrieves station data, exposes public read endpoints, stores durable records in D1 and runs scheduled observation, forecast, alert, social and integration-health work. Public presentation code must not be copied into the Worker.

`worker/schema.sql` defines observations, alert history, social drafts/publications and forecast snapshots. The Worker also creates additional operational tables when needed. Any schema or contract change needs a reviewed migration, compatibility plan and rollback.

## Trust model

- The station and external providers are data sources, not interchangeable ground truth.
- Meteocat, AEMET, Protecció Civil and 112 have priority for warnings and emergency decisions.
- Administration endpoints require `ADMIN_TOKEN`; credentials are never returned by the Worker.
- D1 and outbound integrations are production state. Test them only in a separate staging environment.

See [deployment](deployment.md), [API](api.md) and the historical design record in `ARQUITECTURA-V7.md`.
