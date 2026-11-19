# Mapa multimodel del Baix Montseny

La portada obre el camp regional AROME. També permet consultar ARPEGE regional, la comparació mostrejada i la coincidència per famílies en la mateixa hora. Els mapes WMS EPSG:4326 es reprojecten al mapa base. Per al consens, la vista local ocupa una pantalla. Mostra 49 coordenades a la graella regional de set per set o 25 a la graella del Baix Montseny de cinc per cinc, amb la mediana per família o una de les vuit sortides seleccionada. Les consultes demanen les quatre variables en UTC i la interfície mostra l’hora d’Europa/Madrid. El reproductor avança entre l’hora inicial i +24 h amb les mateixes sèries. El mapa acoloreix exclusivament el rectangle mostrejat. Temperatura, vent i nuvolositat utilitzen interpolació bilineal visual entre quatre mostres vàlides. La pluja es representa per cel·les de mostra més propera. Els detalls puntuals conserven el valor consultat. Un guió indica absència de dades.

El radar, el mapa natiu AROME, els meteogrames i la verificació retrospectiva es consulten a `analisi.html`. El projecte Pages publica només el directori `visor/`. Per tornar a la portada anterior es pot restaurar el desplegament anterior del visor.



- Radar RainViewer: fotogrames observats.
- Météo-France AROME: imatges oficials via Worker, amb temps vàlid i variable seleccionada.
- Els productes ACA es consulten al web de l’Observatori.
- Open-Meteo: comparació puntual Best Match, ECMWF IFS, GFS, ICON, AROME HD, ARPEGE Europa, GEM global i UKMO global. Les dades són prediccions consultades per coordenada i **la mateixa hora vàlida**. AROME HD i ARPEGE tenen abast més curt; si una sortida no cobreix l’hora, es mostra com a no disponible. Font i condicions: [Open-Meteo](https://open-meteo.com/en/terms). Les dades UKMO i els productes que en deriven estan subjectes a [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- El consens és la mediana i l’interval mínim–màxim de les famílies de models disponibles per temperatura, pluja, vent i núvols. La pluja també mostra quantes famílies preveuen almenys 0,2 mm en aquella hora. Best Match queda fora del càlcul perquè la selecció automàtica pot duplicar un model de la llista; AROME i ARPEGE representen una sola família Météo-France (es prefereix AROME HD si té dada). Les famílies no són estadísticament independents. L’acord **no és una probabilitat d’encert, un interval estadístic de confiança ni un avís**. No es calcula cap camp espacial de consens.
- Estació Fontanillas: lectura local via `widget-observation`. Si té més de 30 minuts, s’etiqueta com a no recent.

No hi ha avisos oficials, predicció de tempestes ni índex de risc derivat en aquesta primera versió. Les fallades de font es mostren com a absència de dades, mai com a zero. Mapa base: OpenStreetMap.

La cortina compara les dues imatges regionals de Météo-France. L’hora escrita sobre el mapa correspon al fotograma visible. En avançar el temps, les dues imatges noves es carreguen abans de substituir les anteriors. Si una font falla, el visor retira la parella i permet reintentar.
