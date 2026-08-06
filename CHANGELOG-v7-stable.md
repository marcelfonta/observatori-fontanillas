# V7.0 STABLE — reparació d'estabilitat

## Correccions principals
- Restaurat `src/app.js` a la versió de Fase 1.1 que havia estat validada online amb dades meteorològiques funcionant.
- Separat l'historial d'avisos del procés d'arrencada meteorològic: si l'historial falla, ja no pot impedir que carreguin temperatura, humitat, vent, pressió o pluja.
- Restaurat el mòdul `share.js` validat de Fase 1.1.
- Afegit `share-page.js` per inicialitzar Compartir a `metodologia.html` sense scripts inline i sense dependre de `app.js`.
- El Compartir de la pàgina principal continua inicialitzat des de l'app principal, com a la versió validada.
- Afegit `alert-history-init.js` com a funcionalitat independent i no crítica.
- Renovada la cache PWA a `observatori-fontanillas-v7-stable-1` i activació immediata del nou Service Worker per evitar barreja de fitxers de versions anteriors.
- Mantingudes les preferències d'avisos de Fase 2 i l'eliminació de Contacte dels peus de pàgina.

## Principi d'estabilitat
Les funcionalitats opcionals de Fase 2 (historial, push, compartir en pàgines secundàries) queden desacoblades del nucli que carrega les dades meteorològiques.
