# Visor del territori · primera versió

Aplicació estàtica independent per a `visor.fontanillas.cat`. No està enllaçada des de l’Observatori ni registrada al seu service worker. El directori de publicació de Cloudflare Pages és `visor/`, sense comanda de compilació. Abans d’assignar el domini cal revisar la previsualització i obtenir l’aprovació humana de producció.

## Dades i criteris

- Radar RainViewer: fotogrames observats i extrapolats, separats al text del mapa.
- Météo-France AROME: imatges oficials via Worker, amb temps vàlid i variable seleccionada.
- ACA: cabals, pluviòmetres i embassaments via Worker, amb hora per estació.
- Open-Meteo: comparació puntual Best Match, ECMWF, GFS, ICON i AROME HD. Les dades són prediccions, consultades per coordenada i hora. AROME HD pot tenir un abast més curt.
- Estació Fontanillas: lectura local via `widget-observation`. Si té més de 30 minuts, s’etiqueta com a no recent.

No hi ha avisos oficials, predicció de tempestes ni índex de risc derivat en aquesta primera versió. Les fallades de font es mostren com a absència de dades, mai com a zero. Mapa base: OpenStreetMap.

## Prova local

Des de l’arrel del repositori, `python3 -m http.server 8080`; obre `http://localhost:8080/visor/`. Comprova les tres capes, les hores, el canvi de punt, el funcionament tàctil, els estats de fallada i la càrrega al mòbil.

## Publicació i retorn

Publicar primer com a previsualització de Pages. Per producció, configurar un projecte Pages separat amb arrel de sortida `visor/` i domini personalitzat `visor.fontanillas.cat`; no crear cap enllaç al lloc principal. Retorn: desassignar el domini o tornar a l’últim desplegament validat del projecte Pages. No cal canviar Worker, D1 ni PWA.
