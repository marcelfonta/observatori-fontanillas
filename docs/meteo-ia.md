# Meteo IA

Meteo IA is designed as a traceable interpretation layer, not a source of invented weather facts. Its core implementation is in `src/features/meteo-ai.js`; it receives already loaded portal context and uses the same central weather service as the rest of the application.

## Behaviour

- Answers local questions using displayed observations, alerts, forecasts, history, comparison and environmental context.
- Can resolve another locality through Open-Meteo geocoding and obtain its forecast.
- Identifies sources and time, and labels an unverified alert state rather than translating a failed request into “no alerts”.
- Keeps only functional context for a tab in `sessionStorage`, not the full conversation text.
- Does not store conversations or send them to an external model in its standard deterministic flow.

The Worker also exposes `POST /meteo-ai` for the project’s advanced path. It is rate limited and must keep its context bounded; any future model-backed behaviour must preserve source attribution, safety wording, privacy review and the rule that official authorities prevail.

Meteo IA is not emergency guidance, a medical service or a replacement for Meteocat, AEMET, Protecció Civil or 112.
