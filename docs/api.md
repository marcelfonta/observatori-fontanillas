# Public API

The Worker returns JSON. Its base URL is configured in `src/core/config.js`. These endpoints are implementation contracts used by the portal, not a promise of a versioned public platform. Consumers should handle unavailable upstream data and cache directives.

Own station observations returned by `/` and `/history` are available under
[CC BY 4.0](DADES-OBERTES.md). The licence does not extend to forecasts,
warnings, maps, webcams or third-party data returned by other endpoints.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | Current station observation; persisted asynchronously when appropriate. |
| GET | `/widget-observation` | Lightweight latest stored observation for the private iPhone widget, with live fallback when the archive is empty. |
| GET | `/history?days=&resolution=` | Historical observations. |
| GET | `/quality` | Data-quality information. |
| GET | `/health` | Service health. |
| GET | `/alerts?fresh=` | Current warnings. |
| GET | `/alert-history?page=&pageSize=&q=&year=&month=&level=&source=&phenomenon=` | Paginated, filtered warning archive. |
| GET | `/stations?period=now&lat=&lon=&name=` | Nearby station comparison payload. |
| GET | `/met-forecast?lat=&lon=&timezone=` | MET Norway forecast proxy. |
| GET | `/webcams-nearby?lat=&lon=` | Up to four nearby Windy Webcams, when the Worker has the `WINDY_WEBCAMS_API_KEY` secret. Preview URLs are temporary and are never cached by the portal. |
| GET | `/forecast-verification?days=7..180` | Forecast-snapshot verification metrics, separated by Best Match, ECMWF, ICON, GFS and AROME HD, with local weights after the minimum real sample. |
| GET | `/fires-nearby?lat=&lon=&radius=25..250` | Nearby NASA FIRMS thermal detections when the Worker has the `FIRMS_MAP_KEY` secret. These are observations, not fire warnings. |
| GET | `/version` | Worker version, build date and environment name. |

`POST /contact`, `POST /meteo-ai` and `POST /push-test` support the portal. They are subject to validation and are not suitable for unauthorised automation. `/admin/*`, OAuth and social-card routes are operational or authenticated interfaces and intentionally omitted from the public contract.

Do not treat portal output as an official alert service. Follow the source links and official authorities for safety decisions.

`FIRMS_MAP_KEY` must be stored as a Worker secret, never in `wrangler.jsonc`, the
browser or a repository variable. Without it, `/fires-nearby` returns an explicit
`configured: false` response and the rest of the environmental viewer remains
available.
