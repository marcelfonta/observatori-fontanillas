# Data sources and provenance

The portal labels sources and keeps source-specific limits visible. It does not manufacture readings when a provider is unavailable.

| Source/service | Project use |
| --- | --- |
| Fontanillas station via Weather Underground | Current station observations, stored history and nearby-station comparison. |
| Meteocat and AEMET | Official weather-warning context; they take precedence over portal interpretation. |
| Open-Meteo | Forecasts, geocoding, selected environmental indicators and model comparisons. |
| MET Norway | Forecast access through the Worker proxy. |
| RainViewer / Blitzortung and embedded official viewers | Radar/lightning and visual context, identified in the interface. |
| Cloudflare Pages, Workers and D1 | Hosting, Worker execution and project persistence. |

The exact availability, licences and terms of each upstream service remain the providers’ responsibility. Contributors must review current provider terms before adding a new source or changing how a source is cached, redistributed or attributed.

Weather data is informative. In particular, local sensor coverage, forecast models and zonal warnings have limits that the UI should preserve rather than hide.
