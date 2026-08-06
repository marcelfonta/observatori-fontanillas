# V7 · Fase 1 — Arquitectura

- Reorganitzat el frontend sota `src/`.
- Separats core, serveis, funcionalitats transversals i mòduls.
- `worker/index.js` passa a ser el Worker canònic.
- Versions antigues del Worker mogudes a `archive/worker-legacy/`.
- Eliminats `.git`, `.DS_Store` i metadades de macOS del paquet publicable.
- Service Worker actualitzat als nous paths i nova clau de cache.
- Preparada estructura per Centre de Dades i futur panell privat.
- No s’han canviat intencionadament dades, fonts, layout ni comportament funcional.
