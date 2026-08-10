# Activació de les notificacions V19

La V19 manté la selecció per fenomen i nivell mínim, però les notificacions només s’envien quan OneSignal està configurat tant a la web com al Worker.

## Dades necessàries

1. Crear una aplicació Web Push a OneSignal per al domini `https://meteo.fontanillas.cat`.
2. Configurar el lloc exacte `https://meteo.fontanillas.cat` i el Worker a `/push/onesignal/OneSignalSDKWorker.js`, amb scope `/push/onesignal/`.
3. Copiar l’App ID públic a `oneSignalAppId` dins de `src/core/config.js`.
4. Afegir al Worker els secrets `ONESIGNAL_APP_ID` i `ONESIGNAL_REST_API_KEY`. La clau REST no s’ha de posar mai al web ni al ZIP públic.
5. Publicar la web i el Worker V19.

No s’ha d’escriure la REST API Key en cap HTML, JavaScript públic, captura o URL.

## Com funciona

- L’usuari escull pluja, vent, tempesta, neu, temperatura o tots els fenòmens.
- També tria el nivell mínim: groc, taronja o vermell.
- Les preferències es desen al dispositiu i, quan OneSignal està actiu, se sincronitzen com a etiquetes.
- El Worker només envia un episodi nou perquè `alert_events` impedeix repetir la mateixa empremta.
- AEMET, Meteocat, Protecció Civil i el 112 continuen sent les fonts de seguretat prioritàries.

## Comprovació

Després de publicar, el panell d’administració ha de mostrar per separat «OneSignal · web» i «OneSignal · Worker» com a configurats. Fes la primera prova amb un navegador secundari i una subscripció de prova abans d’anunciar el servei públicament. A iPhone/iPad cal iOS 16.4 o posterior i afegir la web a la pantalla d’inici.
