# Visor del territori · primera versió

Aplicació estàtica independent per a `visor.fontanillas.cat`. No està enllaçada des de l’Observatori ni registrada al seu service worker. El directori de publicació de Cloudflare Pages és `visor/`, sense comanda de compilació. Abans d’assignar el domini cal revisar la previsualització i obtenir l’aprovació humana de producció.

## Dades i criteris

- Radar RainViewer: fotogrames observats i extrapolats, separats al text del mapa.
- Météo-France AROME: imatges oficials via Worker, amb temps vàlid i variable seleccionada.
- ACA: cabals, pluviòmetres i embassaments via Worker, amb hora per estació.
- Open-Meteo: comparació puntual Best Match, ECMWF IFS, GFS, ICON, AROME HD, ARPEGE Europa, GEM global i UKMO global. Les dades són prediccions consultades per coordenada i **la mateixa hora vàlida**. AROME HD i ARPEGE tenen abast més curt; si una sortida no cobreix l’hora, es mostra com a no disponible. Font i condicions: [Open-Meteo](https://open-meteo.com/en/terms). Les dades UKMO i els productes que en deriven estan subjectes a [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- El consens és la mediana i l’interval mínim–màxim de les famílies de models disponibles per temperatura, pluja, vent i núvols. La pluja també mostra quantes famílies preveuen almenys 0,2 mm en aquella hora. Best Match queda fora del càlcul perquè la selecció automàtica pot duplicar un model de la llista; AROME i ARPEGE representen una sola família Météo-France (es prefereix AROME HD si té dada). Les famílies no són estadísticament independents. L’acord **no és una probabilitat d’encert, un interval estadístic de confiança ni un avís**. No es calcula cap camp espacial de consens.
- Estació Fontanillas: lectura local via `widget-observation`. Si té més de 30 minuts, s’etiqueta com a no recent.

No hi ha avisos oficials, predicció de tempestes ni índex de risc derivat en aquesta primera versió. Les fallades de font es mostren com a absència de dades, mai com a zero. Mapa base: OpenStreetMap.

## Prova local

Des de l’arrel del repositori, `python3 -m http.server 8080`; obre `http://localhost:8080/visor/`. Comprova les tres capes, les hores, el canvi de punt, el funcionament tàctil, els estats de fallada i la càrrega al mòbil.

## Publicació i retorn

Publicar primer com a previsualització de Pages. Per producció, configurar un projecte Pages separat amb arrel de sortida `visor/` i domini personalitzat `visor.fontanillas.cat`; no crear cap enllaç al lloc principal. Retorn: desassignar el domini o tornar a l’últim desplegament validat del projecte Pages. No cal canviar Worker, D1 ni PWA.
