OBSERVATORI FONTANILLAS · CORRECCIÓ 5.5.1

Aquesta correcció necessita actualitzar UNA VEGADA el Worker i després publicar el dashboard.
Un cop fet, els avisos caducaran i desapareixeran automàticament sense intervenció manual.


1. ACTUALITZAR EL WORKER

- Cloudflare → Workers i Pages → fonta-meteo → Editar codi.
- Substitueix el codi pel contingut complet de:

worker/fonta-meteo-worker-v5.5.1.js

- Prem «Implementar».
- No canviïs la vinculació DB, el cron ni cap secret.


2. PUBLICAR EL DASHBOARD

- Copia tot el contingut d’aquesta carpeta dins de:

/Users/marcelfontanillas/Library/Mobile Documents/com~apple~CloudDocs/observatori-fontanillas

- Accepta substituir els fitxers repetits.
- Obre Terminal dins d’aquesta carpeta i executa, una ordre cada vegada:

git add .
git commit -m "Corregeix avisos caducats i menu mobil"
git push origin main


3. COMPROVAR

- Espera un o dos minuts i recarrega meteo.fontanillas.cat.
- Si no hi ha avisos vigents, la capçalera ha de dir «Sense avisos oficials actius».
- Al menú mòbil, «Completa» i «Essencial» han d’aparèixer dins del selector, sense solapar-se.
- Si encara veus la versió anterior, recarrega amb Command + Shift + R.


QUÈ QUEDA AUTOMÀTIC

- Els avisos es tornen a consultar cada 10 minuts.
- Cada avís desapareix exactament quan arriba la seva hora final, encara que la pestanya continuï oberta.
- El Worker descarta els avisos vençuts encara que AEMET els mantingui temporalment al seu canal.
- El radar renova les imatges disponibles cada 5 minuts mentre és visible.
- Les dades de l’estació i la qualitat es renoven cada 5 minuts; la previsió i els models, cada hora.
