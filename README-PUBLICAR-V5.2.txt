OBSERVATORI FONTANILLAS · PUBLICAR LA VERSIÓ 5.2

LA V5.2 TÉ DUES PASSES:

1. Publicar el dashboard com sempre.
2. Activar l’arxiu propi D1 seguint GUIA-ACTIVAR-DADES-V5.2.md.

Pots publicar primer la web. Continuarà funcionant amb el Worker anterior i el nou panell indicarà que l’arxiu propi encara està pendent.

PUBLICAR EL DASHBOARD

1. Copia tot el contingut d’aquesta carpeta dins de la teva carpeta habitual:

/Users/marcelfontanillas/Library/Mobile Documents/com~apple~CloudDocs/observatori-fontanillas

Quan el Mac ho pregunti, accepta substituir els fitxers amb el mateix nom.

2. Obre Terminal directament dins de la carpeta observatori-fontanillas.

3. Executa aquestes tres ordres, una per una:

git add .
git commit -m "Publica la versió 5.2 amb historial propi"
git push origin main

4. Cloudflare iniciarà el desplegament automàtic. Normalment el canvi apareix al web al cap d’un o dos minuts.

5. Si encara veus la versió anterior, recarrega meteo.fontanillas.cat amb Command + Shift + R.

ACTIVAR L’HISTÒRIC PROPI

Obre GUIA-ACTIVAR-DADES-V5.2.md i segueix els passos de Cloudflare. Hauràs de:

- crear una base D1 anomenada fonta-meteo-history;
- vincular-la al Worker amb el nom exacte DB;
- substituir el codi del Worker per worker/fonta-meteo-worker-v4.js;
- afegir una captura programada cada cinc minuts.

No eliminis les variables WU_API_KEY, RESEND_API_KEY, CONTACT_TO ni CONTACT_FROM.
