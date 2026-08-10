# Rendiment i comprovació de publicació

## Millores incloses a V19

- El JavaScript de OneSignal només es descarrega quan hi ha un App ID configurat.
- La pàgina de privacitat i l’àrea Aprendre formen part de la memòria cau de la PWA.
- Els fitxers de codi es revaliden i les imatges/icones mantenen memòria cau de set dies.
- El panell administratiu mostra el temps de càrrega observat al navegador actual i comprova `sitemap.xml`, `robots.txt` i Privacitat.

## Validació després de desplegar

1. Obrir PageSpeed Insights amb la portada, Predicció, Centre de Dades i Medi Ambient.
2. Fer una prova mòbil i una d’ordinador.
3. Revisar LCP, INP i CLS; no perseguir només la puntuació global.
4. Repetir la prova amb una finestra privada per evitar extensions i memòries cau antigues.
5. Comprovar a Search Console les dades de camp quan hi hagi prou trànsit.

Les dades del panell són de laboratori i d’un sol navegador. Les dades de camp de Search Console són les que permetran prioritzar la fase següent.
