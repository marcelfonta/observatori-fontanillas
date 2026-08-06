# Observatori Meteorològic Fontanillas · V6.0

## Què incorpora

- Llamps AEMET en substitució de LightningMaps.
- Google Analytics 4 preparat.
- Google Search Console preparat amb `robots.txt` i `sitemap.xml`.
- Avisos Web Push amb OneSignal. S'ha triat OneSignal en lloc de Firebase perquè dona suport directe a Web Push en iPhone/iPad quan la PWA està afegida a la pantalla d'inici.
- PWA millorada: comprovació de nova versió, botó **Actualitzar ara**, actualització en tornar del segon pla i API meteorològica amb estratègia *network first*.

## 1. Activar Google Analytics 4

Crea una propietat GA4 i copia el Measurement ID, amb format `G-XXXXXXXXXX`.

A `js/config.js` substitueix:

```js
analyticsMeasurementId: '',
```

per:

```js
analyticsMeasurementId: 'G-XXXXXXXXXX',
```

No cal tocar cap altre fitxer.

## 2. Activar avisos push

1. Crea una app Web Push a OneSignal amb URL `https://meteo.fontanillas.cat`.
2. Copia l'**App ID** de OneSignal.
3. A `js/config.js` posa'l a:

```js
oneSignalAppId: 'EL-TEU-APP-ID',
```

El projecte ja inclou `push/onesignal/OneSignalSDKWorker.js` amb un scope separat, de manera que no interfereix amb el service worker de la PWA.

A iPhone/iPad, Web Push requereix iOS/iPadOS 16.4 o posterior i que l'usuari hagi afegit la web a la pantalla d'inici. El mateix botó de la web ho explica si detecta que encara s'està obrint des del navegador.

Els avisos es poden enviar des del panell de OneSignal a tots els subscrits o a segments concrets.

## 3. Google Search Console

Afegeix `https://meteo.fontanillas.cat` a Search Console. Recomanació: verificar el domini mitjançant DNS a Cloudflare. Després envia aquest sitemap:

`https://meteo.fontanillas.cat/sitemap.xml`

## 4. Actualització a iPhone / PWA

La V6.0 elimina la memòria cau de 30 minuts per a l'API en primer pla. Quan la PWA torna a estar visible, actualitza les dades si l'última càrrega té més de 30 segons. També comprova una nova versió del service worker en `pageshow`, `focus` i `visibilitychange`.
