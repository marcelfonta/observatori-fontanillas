# Observatori Meteorològic Fontanillas

**A local, privacy-conscious weather portal for Sant Celoni and the Baix Montseny.** It combines observations from the Fontanillas weather station with official alerts, forecasts, environmental context and transparent local interpretation.

The public site is available at [meteo.fontanillas.cat](https://meteo.fontanillas.cat). The interface and much project documentation are in Catalan, the language of its community.

## Why it exists

Local weather decisions deserve local context. Observatori Fontanillas makes current conditions, forecast, warnings, radar, historical observations and learning resources easier to find without advertising or invented data. Official safety information from Meteocat, AEMET, Protecció Civil and 112 always takes precedence.

## What it does

- Presents live and historical station observations, charts, extremes and browser-generated exports.
- Brings together official alerts, radar, nearby stations, webcam access and environmental indicators.
- Compares stored forecast snapshots with subsequent station observations, making forecast quality visible.
- Ships as an installable progressive web app, with opt-in web-push preferences.
- Includes **Meteo IA**, a deterministic, source-labelled local interpretation layer. It does not store conversations or send them to a language model for its standard operation.
- Provides a protected operational area for diagnostics and the editorial review of social drafts.

## Design commitments

1. **Traceability over apparent certainty.** Missing or stale data is labelled; observations and alerts are never fabricated.
2. **Official alerts first.** The portal is contextual information, not an emergency service.
3. **Privacy by design.** The standard Meteo IA flow is local; the contact anti-abuse control stores irreversible identifiers.
4. **Accessible, mobile-first delivery.** PWA support, semantic controls, keyboard navigation and reduced-motion support are maintained alongside features.
5. **Human control of consequential actions.** Secrets stay outside the repository, and production changes require human approval.

## Architecture at a glance

```text
Browser (static Pages site)
  ├─ src/modules/ and src/features/ render portal views
  ├─ src/services/weather-api.js centralises remote access
  └─ external, clearly identified sources where appropriate
                         │
                         ▼
Cloudflare Worker (worker/index.js)
  ├─ Weather Underground station data
  ├─ D1 observations, alerts, forecast snapshots and operational records
  ├─ AEMET alert feed and selected weather services
  └─ authenticated administration and scheduled maintenance jobs
```

Read the fuller [architecture guide](docs/architecture.md), [data-source policy](docs/data-sources.md) and [API reference](docs/api.md).

## Quick start

This project has no frontend build step. It expects Node `>=22 <25` for its checked toolchain.

```bash
git clone https://github.com/marcelfonta/observatori-fontanillas.git
cd observatori-fontanillas
pnpm install
pnpm serve
```

Open `http://localhost:8080`; do not open HTML files with `file://`, as the site uses ES modules. For the full workflow, tests and Worker safety boundary, see [development](docs/development.md).

## Documentation

- [Architecture](docs/architecture.md)
- [Local development and testing](docs/development.md)
- [Deployment guide](docs/deployment.md)
- [Public API](docs/api.md)
- [Data sources and provenance](docs/data-sources.md)
- [Meteo IA](docs/meteo-ia.md)
- [Roadmap](ROADMAP.md) and [release history](CHANGELOG.md)

## Contributing and security

Contributions are welcome when they improve reliability, accessibility, local usefulness or maintainability. Please read [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [SECURITY.md](SECURITY.md) first. For questions and non-security help, use [SUPPORT.md](SUPPORT.md).

## Open-source readiness

The repository is public, actively maintained and released under the [MIT License](LICENSE). Before contributing, read the project’s safety and data-provenance commitments above and in the contributor documentation.

## Acknowledgements

The project depends on data and services that remain their respective providers' responsibility, including the Fontanillas station via Weather Underground, Meteocat, AEMET, Open-Meteo, MET Norway and Cloudflare. See [data sources](docs/data-sources.md) for the project’s use and attribution approach.
