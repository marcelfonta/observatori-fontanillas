# Previsió social per franges — Validació local

## Estat i abast

Preparació local a `feature/daily-forecast-dayparts`, des de `main` cd76cea. Worker proposat 22.29.17, web 22.31.6 intacta. Cap enviament social, reserva remota, desplegament o migració efectuat.

## Evidència

- Node 24.19.0, dins dels motors admesos pel projecte.
- Suite completa de 70 fitxers i prova dedicada `tests/forecast-dayparts.mjs`: límits civils de les tres franges, hores precedents per probabilitat/ratxa, mitjanit, dates inexistents, DST, canvi d’any, dades incompletes, prevalença de fenòmens significatius, matí/vespre, targeta del migdia, compatibilitat amb esborranys antics i textos curts.
- Constructor real d’esborrany provat amb proveïdor i emmagatzematge simulats; es manté en `draft`, sense enviar. Petició horària/diària única per esborrany; no es canvien la deduplicació ni les reserves de publicació.
- Wrangler 4.125.0: compilació final del nou punt d’entrada amb configuració productiva revisada en mode `deploy --dry-run`; sense pujada. Paquet 487,27 KiB, gzip 119,32 KiB.
- Generador local amb dades públiques reals del 17 de setembre: cinc SVG estàtics, quatre fotogrames tèrmics i quatre de pluja. Render amb el filtre i les entrades exactes del workflow, codificador `ultrafast` només per accelerar la previsualització; producció conserva `medium`.
- Fitxer MP4 resultant: 1080 × 1920, 30 fps, 897 fotogrames, durada efectiva 29,9 s. El límit de 30 s i les durades/transicions no s’han augmentat.
- Chrome: targetes locals amb logo incorporat i gràfica observada real. Matí i migdia: cap desbordament horitzontal a les franges; detall i tendència acaben a y=1163,45, abans del peu a y=1264,5 dins de 1080 × 1350. Ajust de peu relatiu a la targeta, independent de la mida de finestra del navegador.
- Vespre: les tres franges identifiquen «DEMÀ · 2026-09-18», sense desbordament ni solapament amb el peu. Cas llarg de precipitació engelant amb dades incompletes i tendència de boira: final y=1185,45, encara anterior al peu.
- Previsualitzacions fora de Git, a `output/daily-dayparts-preview` de l’espai de treball. No són publicacions de producció ni una edició matinal recuperada; les observacions corresponen a l’hora de consulta de la tarda.

## Pendent abans d’activar

1. Revisió humana i PR; no publicar el paquet sense confirmació.
2. Validació de staging sense automatització: generar un esborrany nou, renderitzar la seva targeta i comprovar data, franges i URL pública signada. No provar amb un esborrany productiu ja publicat.
3. Desplegar el Worker després d’autorització; el generador/workflow entrarà en vigor en integrar la branca. Coordinar els dos components abans del següent horari diari.
4. Verificar les primeres execucions programades i els resultats per canal sense reenviar canals ja completats.

El codi no garanteix disponibilitat de xarxa, proveïdors o credencials de tercers; les proteccions i recuperacions existents es conserven.
