# V7 · Fase 2.1

- Corregit Compartir a `metodologia.html`: ja no usa JavaScript inline bloquejat per la CSP.
- `share.js` s’autoinicialitza i manté protecció contra doble inicialització, de manera que funciona a portada i metodologia.
- El botó d’avisos sempre respon i obre les preferències, fins i tot abans de connectar OneSignal.
- Les preferències d’avisos es poden desar localment; quan OneSignal està configurat, s’activa la subscripció real i se sincronitzen etiquetes.
- Millorat l’historial d’avisos: si no hi ha episodis, ho explica clarament; si el Worker encara no té historial, conserva localment els avisos oficials observats pel navegador.
- Nova cache PWA `v7-phase2-2`.
