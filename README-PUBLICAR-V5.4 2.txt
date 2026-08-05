OBSERVATORI FONTANILLAS · PUBLICAR LA VERSIÓ 5.4

LA V5.4 NOMÉS NECESSITA PUBLICAR EL DASHBOARD.

El Worker V5, la ruta d’avisos, la base D1, la vinculació DB, el cron i els secrets actuals ja estan bé. No els has de tocar.


PUBLICAR EL DASHBOARD

1. Copia tot el contingut d’aquesta carpeta dins de la teva carpeta habitual:

/Users/marcelfontanillas/Library/Mobile Documents/com~apple~CloudDocs/observatori-fontanillas

Quan el Mac ho pregunti, accepta substituir els fitxers amb el mateix nom.

2. Obre Terminal directament dins de la carpeta observatori-fontanillas.

3. Executa aquestes tres ordres, una per una:

git add .
git commit -m "Publica la versió 5.4 amb el centre de vigilància unificat"
git push origin main

4. Cloudflare iniciarà el desplegament automàtic. Normalment el canvi apareix al web al cap d’un o dos minuts.

5. Si encara veus la versió anterior, recarrega meteo.fontanillas.cat amb Command + Shift + R.


COMPROVACIONS FINALS

- El bloc d’avisos mostra l’estat oficial del Prelitoral de Barcelona.
- «Què importa ara?» apareix just sota els avisos, dins de la mateixa gran capsa.
- Ja no apareix entre les dades actuals i els valors calculats.
- La comparació ECMWF/GFS/ICON mostra quatre coincidències: temperatura, pluja, vent i cel.
- «Dades sota control» ha quedat just abans de «Contacte».
- El formulari, la base D1 i la resta del web continuen funcionant igual.
