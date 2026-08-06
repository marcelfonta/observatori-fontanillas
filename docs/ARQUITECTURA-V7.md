# Arquitectura V7 — Fase 1

## Criteri
La Fase 1 és deliberadament conservadora: canvia la disposició del codi, no les fonts meteorològiques ni la lògica funcional. Això redueix el risc de regressions abans d’implementar avisos, llamps i Centre de Dades.

## Flux de dades

```text
Navegador
  ↓
src/app.js
  ↓
src/services/weather-api.js
  ├─ Worker Fontanillas (observació, històric, qualitat, avisos)
  └─ Open-Meteo (predicció i comparació de models)

Worker Fontanillas
  ├─ Weather Underground / estació
  ├─ D1 (històric persistent)
  ├─ AEMET avisos
  └─ contacte / serveis auxiliars
```

## Fronteres
- **Core** no ha de conèixer seccions del DOM.
- **Services** encapsulen HTTP i persistència local relacionada amb dades remotes.
- **Features** són transversals i independents del domini meteorològic.
- **Modules** renderitzen o controlen una secció concreta.
- **Worker** és backend i no ha d’incloure codi de presentació.

## API única
El frontend ja centralitza l’accés al Worker mitjançant `weather-api.js`. En una fase posterior es podrà migrar l’URL pública a `/api/` sota el domini propi sense haver de modificar tots els mòduls.

## Històrics
`data/exports/` queda reservat per artefactes estàtics. Les descàrregues dinàmiques futures han de sortir preferentment d’un endpoint del Worker, evitant duplicar grans volums al repositori.
