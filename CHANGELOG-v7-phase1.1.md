# V7 Fase 1.1

- Corregit el botó **Compartir** de `index.html`.
- `share.js` passa a ser un mòdul ES importat directament per `src/app.js`, de manera que la portada l'inicialitza sempre juntament amb la resta de l'aplicació.
- `metodologia.html` reutilitza el mateix mòdul.
- Afegit `Cache-Control: no-cache` per a `/src/*`.
- Actualitzada la clau de memòria cau del Service Worker per forçar la renovació dels fitxers a les PWA instal·lades.
- Cap altre canvi funcional o visual.
