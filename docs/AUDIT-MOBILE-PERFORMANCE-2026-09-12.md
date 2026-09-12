# Auditoria mòbil de rendiment i accessibilitat — 2026-09-12

## Abast

- Portada pública `https://meteo.fontanillas.cat/`.
- Emulació mòbil de 390 × 844, Fast 4G i CPU ×4 amb Chrome DevTools.
- Comprovació addicional local a 320 × 720.
- Sense publicacions, canvis de secrets, migracions ni desplegament.

## Mesura de producció abans dels canvis

- LCP: 408 ms.
- TTFB: 23 ms.
- CLS: 0,00.
- Dades de camp CrUX: no disponibles.
- Elements DOM: 3.475; Chrome no estima cap estalvi directe i no es proposa una reestructuració de risc sense evidència d’impacte.
- Accessibilitat Lighthouse: 89.
- SEO Lighthouse: 100.

## Incidències demostrades

1. La mateixa webcam de 1920 × 830 es demanava amb dos marcadors temporals diferents, fins i tot quan una de les dues imatges estava amagada. Chrome calcula 474,5 kB potencialment evitables i la xarxa mostra dues transferències d’uns 258 kB cadascuna.
2. El retorn de focus durant la càrrega inicial podia iniciar una segona execució concurrent i repetir les peticions actuals i les dues consultes d’històric.
3. Lighthouse identifica atributs ARIA incompatibles al cercador i al mapa del radar, noms accessibles divergents a tres controls i dues fonts oficials del radar amb una zona tàctil inferior a 24 px.
4. Faltava la metaetiqueta PWA vigent i `llms.txt` no existia.

## Correccions

- Una única promesa comparteix la càrrega inicial mentre continua en curs.
- La URL de webcam es calcula una vegada i només s’assigna als elements visibles.
- El cercador declara el patró `combobox`; idioma i municipi tenen identificadors de formulari.
- El mapa incorpora un rol compatible amb el seu nom accessible.
- Els noms de la webcam, l’avís ràpid i «Més» concorden amb el text visible.
- Les fonts Meteocat i AEMET del radar tenen una alçada tàctil mínima de 28 px.
- S’afegeixen la metaetiqueta PWA moderna i un `llms.txt` breu i factual.

## Verificació local

- Lighthouse mòbil en mode instantani: accessibilitat 100, bones pràctiques 100 i SEO 100.
- Xarxa: una sola petició de webcam i una sola petició per cadascuna de les dues resolucions d’històric.
- Amplada 320 px: `scrollWidth` igual a 320 px, sense desplaçament horitzontal del document.
- `npm run test:quick` i la prova dirigida de YouTube superats.
- La cerca de webcams respon correctament a Sant Celoni, Tòquio i Sydney, amb quatre resultats i radi de 50 km en tots tres casos.
- La vista audiovisual carrega sota demanda el reproductor sense galetes de Meteocat; els accessos oficials d’AEMET i 3Cat continuen visibles. Aquesta comprovació de Chrome no substitueix la validació en dispositius físics.

## Límits i següent comprovació

- La puntuació de producció només canviarà després d’integrar i desplegar la V22.31.4.
- La webcam és de tercers i no permet demanar una mida menor; l’estalvi segur és evitar-ne el duplicat, no recomprimir una imatge aliena.
- El diagnòstic OAuth de YouTube és manual i deliberadament no s’executa en aquesta branca. Després del merge s’ha d’executar una vegada i confirmar només l’èxit o l’error segur.
