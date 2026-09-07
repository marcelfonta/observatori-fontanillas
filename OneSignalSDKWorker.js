// Worker únic: combina les notificacions OneSignal amb la PWA de l'Observatori.
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
// El paràmetre de versió obliga el Worker compartit de OneSignal a detectar
// també les actualitzacions de la lògica PWA importada.
importScripts('/service-worker.js?v=records-v1');
