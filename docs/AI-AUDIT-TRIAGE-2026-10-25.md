# Seguiment de les auditories externes · 25 d'octubre de 2026

Fonts revisades: auditoria tècnica del 24/10, captures de Claude, Gemini i DeepSeek i auditoria de Perplexity aportades pel propietari. Les propostes són hipòtesis fins que el repositori, les proves o la producció les confirmen. Aquest document no substitueix el `ROADMAP.md`.

## Corregit abans d'aquest PR

| Tema | Evidència al projecte |
| --- | --- |
| Metadades, canòniques, H1 i dades estructurades per ruta; sitemap sense redireccions i 404 reals | PR #321; `npm run audit:seo` i `tests/seo-deep-routes.mjs` |
| Mode offline en una primera visita i coexistència amb OneSignal | `src/core/service-worker-registration.js`; prova de navegador de primera visita |
| Fonts externes, privacitat i diferència entre IGCC i ERA5 | `privacitat.html`, `metodologia.html`, `canvi-climatic` i `CHANGELOG.md` |
| CO₂ comparat, timelapse de més qualitat, previsió de pluja futura i vídeo meteorològic | PR #321 i #322; prova local completa de 207 fotogrames a la Raspberry |

## Aquest PR

| Troballa | Correcció i límit |
| --- | --- |
| Els enllaços profunds obren la capçalera genèrica | Històries i resums desplacen la vista fins a la peça demanada; prova de navegador. |
| El vídeo absent del 4/10 provoca un 404 de reproductor | La història comprova l'existència amb una petició HEAD i només mostra el reproductor quan hi ha vídeo. Una fallada de comprovació deixa visible l'enllaç general a l'arxiu. |
| Textos molt petits a la primera lectura mòbil | Metadades de les targetes essencials i copyright lateral passen a 12 px com a mínim en mòbil; prova d'ample i llegibilitat. No equival a una auditoria tipogràfica completa. |
| Imatge social massa pesant | JPEG públic de 242 KB a partir del PNG original de 1,2 MB, sense dades en directe; totes les metadades que l'usaven apunten al JPEG. |
| Caché de scripts i servei offline | El middleware posa `no-cache, must-revalidate` a JS, CSS i service workers; prova del contracte HTTP. |
| Connexions inicials lentes | `preconnect` als orígens de dades del Worker i d'Open-Meteo. Cal mesurar-ne l'impacte real després de publicar. |

## Feina que continua oberta

- **Mesura i rendiment:** repetir Lighthouse i dades de camp després del desplegament. Diferir OneSignal, empaquetar tots els mòduls, incrustar CSS crític i reduir `/api/history` poden afectar notificacions, PWA i gràfics; només fer-los amb perfils de xarxa i regressions reals. Revisar també la mida de les icones i el conjunt de textos menors de 12 px.
- **Contingut propi:** ampliar la fitxa de l'aiguat del 4/10, contrastar la dada amb altres pluviòmetres, crear sèries catalanes i context històric només amb fonts i cobertura verificades. No inventar «normals» ni vídeos absents.
- **SEO real:** reenviar sitemap, iniciar «Valida la correcció» i esperar el nou rastreig a Search Console. Només considerar documents estàtics separats si persisteix un problema d'indexació. RSS, DOI i imatges socials dinàmiques requereixen una decisió editorial i dades estables.
- **Operació:** validar la publicació real de TikTok/X després del límit de Buffer del 27/10, la qualitat de YouTube, la música en dispositiu i un avís Meteocat/CECAT real. El visor ACA continua en manteniment extern.
- **Higiene de desplegament:** valorar `.assetsignore` amb una previsualització Pages que provi rutes de documentació necessàries abans d'excloure carpetes del lloc.

## No incorporar ara

WebSockets/SSE cada pocs segons quan el sensor publica cada cinc minuts; IndexedDB massiu sense límit mesurat; vibracions hàptiques i «cockpit» ornamental; migració de base de dades o arquitectura només per seguir una recomanació genèrica. Aquestes idees poden reobrir-se amb una necessitat d'usuari i una mètrica observable.
