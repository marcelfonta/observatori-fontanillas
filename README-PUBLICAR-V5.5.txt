OBSERVATORI FONTANILLAS · PUBLICAR LA VERSIÓ 5.5

LA V5.5 NOMÉS NECESSITA PUBLICAR EL DASHBOARD.

El Worker V5, la ruta d’avisos, la base D1, la vinculació DB, el cron i els secrets actuals ja estan bé. No els has de tocar.


PUBLICAR EL DASHBOARD

1. Copia tot el contingut d’aquesta carpeta dins de la teva carpeta habitual:

/Users/marcelfontanillas/Library/Mobile Documents/com~apple~CloudDocs/observatori-fontanillas

Quan el Mac ho pregunti, accepta substituir els fitxers amb el mateix nom.

2. Obre Terminal directament dins de la carpeta observatori-fontanillas.

3. Executa aquestes tres ordres, una per una:

git add .
git commit -m "Publica la versió 5.5 preparada per mòbil i xarxes"
git push origin main

4. Cloudflare iniciarà el desplegament automàtic. Normalment el canvi apareix al web al cap d’un o dos minuts.

5. Si encara veus la versió anterior, recarrega meteo.fontanillas.cat amb Command + Shift + R.


COMPROVACIONS FINALS

- La lectura ràpida mostra l’estat dels avisos i permet anar directament al bloc oficial.
- Al mòbil, el botó «Més» obre un menú lateral amb totes les seccions.
- El menú mòbil permet canviar entre vista completa i vista essencial.
- El mapa temporal mostra Windy amb ECMWF, GFS i ICON-EU.
- En compartir https://meteo.fontanillas.cat apareix la nova targeta social.
- El web es pot afegir a la pantalla d’inici del mòbil.
- El formulari, la base D1 i la resta del web continuen funcionant igual.
