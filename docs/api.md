# Public API

The Worker returns JSON. Its base URL is configured in `src/core/config.js`. These endpoints are implementation contracts used by the portal, not a promise of a versioned public platform. Consumers should handle unavailable upstream data and cache directives.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | Current station observation; persisted asynchronously when appropriate. |
| GET | `/history?days=&resolution=` | Historical observations. |
| GET | `/quality` | Data-quality information. |
| GET | `/health` | Service health. |
| GET | `/alerts?fresh=` | Current warnings. |
| GET | `/alert-history?page=&pageSize=&q=&year=&month=&level=&source=&phenomenon=` | Paginated, filtered warning archive. |
| GET | `/stations?period=now&lat=&lon=&name=` | Nearby station comparison payload. |
| GET | `/met-forecast?lat=&lon=&timezone=` | MET Norway forecast proxy. |
| GET | `/forecast-verification?days=7..180` | Forecast-snapshot verification metrics. |
| GET | `/version` | Worker version, build date and environment name. |

`POST /contact`, `POST /meteo-ai` and `POST /push-test` support the portal. They are subject to validation and are not suitable for unauthorised automation. `/admin/*`, OAuth and social-card routes are operational or authenticated interfaces and intentionally omitted from the public contract.

Do not treat portal output as an official alert service. Follow the source links and official authorities for safety decisions.
