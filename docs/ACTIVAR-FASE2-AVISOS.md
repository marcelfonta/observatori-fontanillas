# Activar completament la Fase 2 d’avisos

La web ja queda preparada i no mostra errors tècnics als visitants. Perquè les notificacions Push siguin reals cal completar la configuració del servei extern.

## 1. OneSignal al frontend
A `src/core/config.js`, posa l’App ID:

```js
oneSignalAppId: 'EL-TEU-APP-ID'
```

## 2. Worker de Cloudflare
Actualitza el Worker amb `worker/index.js`. Mantén les variables i bindings actuals (`DB`, `WU_API_KEY`, etc.) i afegeix:

- Variable `ONESIGNAL_APP_ID`: el mateix App ID.
- Secret `ONESIGNAL_REST_API_KEY`: REST API Key de l’app OneSignal.

## 3. D1
Executa les sentències noves de `worker/schema.sql`. S’afegeixen les taules `alert_events` i `alert_state`; no s’esborra cap dada meteorològica existent.

## 4. Cron Trigger
Mantén o crea un Cron Trigger del Worker. Recomanat: cada 10 minuts. El `scheduled()` continua guardant l’observació i, a més, comprova avisos oficials nous.

## 5. Funcionament
- `/alerts`: estat actual AEMET i registre dels episodis.
- `/alert-history?limit=20`: historial recent.
- Cada episodi nou només s’insereix una vegada mitjançant fingerprint.
- Si hi ha OneSignal configurat, es notifica només els usuaris que hagin seleccionat aquella categoria.
- Meteocat continua com a font oficial visual/contrastada al mapa; l’automatització Push de Fase 2 utilitza el canal RSS/CAP d’AEMET que ja alimenta la lectura automàtica local.
