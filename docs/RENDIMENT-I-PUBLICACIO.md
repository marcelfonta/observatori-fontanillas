# Rendiment i comprovació de publicació

## Millores incloses a V19

- El JavaScript de OneSignal només es descarrega quan hi ha un App ID configurat.
- La pàgina de privacitat i l’àrea Aprendre formen part de la memòria cau de la PWA.
- Els fitxers de codi es revaliden i les imatges/icones mantenen memòria cau de set dies.
- El panell administratiu mostra el temps de càrrega observat al navegador actual i comprova `sitemap.xml`, `robots.txt` i Privacitat.

## Observabilitat local incorporada a V19.1

El panell administratiu mesura directament al navegador:

- LCP, càrrega del contingut principal.
- CLS, estabilitat visual.
- INP, resposta després d’interactuar amb el panell.
- TTFB, temps fins a la primera resposta del servidor.

Els valors només corresponen a la càrrega actual. No creen galetes, no activen Google Analytics i no s’envien al Worker ni a cap tercer. Els llindars serveixen per detectar problemes evidents; la priorització final s’ha de fer amb dades de camp.

## Validació després de desplegar

1. Obrir PageSpeed Insights amb la portada, Predicció, Centre de Dades i Medi Ambient.
2. Fer una prova mòbil i una d’ordinador.
3. Revisar LCP, INP i CLS; no perseguir només la puntuació global.
4. Repetir la prova amb una finestra privada per evitar extensions i memòries cau antigues.
5. Comprovar a Search Console les dades de camp quan hi hagi prou trànsit.

Search Console ja està verificat i el sitemap ha estat processat. Les dades del panell continuen sent de laboratori i d’un sol navegador; les dades de camp de Search Console, quan n’hi hagi prou, són les que permetran prioritzar la fase següent.
