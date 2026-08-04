# Activar l’històric propi de la V5.2

La V5.2 té dues parts:

1. El dashboard nou, que pots publicar com sempre.
2. L’arxiu persistent del Worker, que necessita una base de dades D1 i una captura programada.

La web continuarà funcionant encara que publiquis primer el dashboard. El panell de qualitat indicarà que el Worker V5.2 està pendent fins que completis aquesta guia.

## 1. Crear la base de dades

1. Entra al panell de Cloudflare.
2. Ves a **Storage & Databases → D1 SQL Database**.
3. Prem **Create database**.
4. Escriu aquest nom:

   `fonta-meteo-history`

5. Crea la base de dades. No cal afegir taules manualment: el Worker les crearà automàticament en la primera execució.

Documentació oficial: https://developers.cloudflare.com/d1/get-started/

## 2. Connectar D1 amb el Worker fonta-meteo

1. Ves a **Workers & Pages**.
2. Obre el Worker **fonta-meteo**.
3. Entra a **Vinculaciones / Bindings**. Segons la versió del panell també pot aparèixer dins de **Configuración → Variables y vinculaciones**.
4. Prem **Añadir vinculación / Add binding**.
5. Selecciona **D1 database**.
6. A **Variable name**, escriu exactament:

   `DB`

7. Selecciona la base de dades **fonta-meteo-history**.
8. Desa la vinculació.

No modifiquis ni eliminis aquestes variables existents:

- `WU_API_KEY`
- `RESEND_API_KEY`
- `CONTACT_TO`
- `CONTACT_FROM`

## 3. Actualitzar el codi del Worker

1. Dins de **fonta-meteo**, prem **Editar código**.
2. Obre el fitxer inclòs en aquesta versió:

   `worker/fonta-meteo-worker-v4.js`

3. Copia tot el contingut.
4. Substitueix el codi actual del Worker pel nou.
5. Prem **Implementar / Deploy**.

El codi conserva les dades actuals, l’històric de Weather Underground, el control `/health` i el formulari de contacte. Afegeix D1, `/quality` i la captura programada.

## 4. Programar una lectura cada cinc minuts

1. Torna a la pàgina del Worker **fonta-meteo**.
2. Ves a **Configuración → Desencadenadores / Triggers → Cron Triggers**.
3. Prem **Add Cron Trigger**.
4. Escriu aquesta expressió:

   `*/5 * * * *`

5. Desa el desencadenador.

Això executa el Worker cada cinc minuts i desa una lectura sense duplicats. Cloudflare avisa que un Cron Trigger nou pot trigar fins a uns 15 minuts a propagar-se.

Documentació oficial: https://developers.cloudflare.com/workers/configuration/cron-triggers/

## 5. Fer la primera comprovació

Obre aquestes adreces, una per una:

1. `https://fonta-meteo.marcelfonta.workers.dev/`
2. `https://fonta-meteo.marcelfonta.workers.dev/health`
3. `https://fonta-meteo.marcelfonta.workers.dev/quality`

A `/health` hauries de veure:

- `"ok": true`
- dins de `storage`, `"enabled": true`

A `/quality` hauries de veure:

- `"status": "healthy"`
- `"storedReadings"` amb un valor d’1 o superior després de la primera captura.

La ruta principal també intenta guardar la lectura actual. Per tant, obrir-la una vegada ajuda a iniciar la base de dades sense esperar el primer Cron Trigger.

## 6. Publicar el dashboard V5.2

Copia tot el contingut de la carpeta V5.2 dins de la carpeta habitual del repositori:

`/Users/marcelfontanillas/Library/Mobile Documents/com~apple~CloudDocs/observatori-fontanillas`

Després obre Terminal dins d’aquesta carpeta i executa:

```bash
git add .
git commit -m "Publica la versió 5.2 amb historial propi"
git push origin main
```

## Com evolucionarà l’històric

- Immediatament: Weather Underground continuarà aportant l’històric horari recent.
- Després de 24 hores: la targeta de 24 h quedarà coberta per dades pròpies.
- Després de 7 dies: els resums i gràfics setmanals seran completament propis.
- Després de 30 dies: quedarà construït el primer arxiu mensual.
- Després d’un any: els rècords anuals tindran cobertura completa.

La base conserva les lectures indefinidament. No desa dades personals ni el contingut dels formularis de contacte.
