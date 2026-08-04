OBSERVATORI FONTANILLAS · PUBLICAR LA VERSIÓ 5.1

1. Copia tot el contingut d’aquesta carpeta dins de la teva carpeta habitual:

/Users/marcelfontanillas/Library/Mobile Documents/com~apple~CloudDocs/observatori-fontanillas

Quan el Mac ho pregunti, accepta substituir els fitxers amb el mateix nom.

2. Obre Terminal directament dins de la carpeta observatori-fontanillas.

3. Executa aquestes tres ordres, una per una:

git add .
git commit -m "Publica la versió 5.1 del dashboard"
git push origin main

4. Cloudflare iniciarà el desplegament automàtic. Normalment el canvi apareix al web al cap d’un o dos minuts.

5. Si encara veus la versió anterior, recarrega meteo.fontanillas.cat amb Command + Shift + R.

No cal modificar el Worker ni cap clau secreta. La V5.1 és una actualització del dashboard: incorpora navegació mòbil, correccions responsive, millor accessibilitat, etiquetes clares de les hores de sol i càrrega progressiva dels ginys externs.
