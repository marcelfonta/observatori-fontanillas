# Recuperació fiable dels YouTube Shorts

GitHub Actions pot retardar o ometre un esdeveniment `schedule`. Per això el Worker comprova cada cinc minuts les franges de les 06:40 i les 18:40 de Sant Celoni. Si el flux de GitHub no ha començat, el Worker el crida una vegada per API.

## Configuració única necessària

1. A GitHub, crea un **fine-grained personal access token** restringit al repositori `marcelfonta/observatori-fontanillas`.
2. Concedeix únicament el permís de repositori **Actions: Read and write**.
3. Desa el valor a Cloudflare Worker `fonta-meteo` com a secret amb el nom `GITHUB_SHORTS_DISPATCH_TOKEN`.
4. Desplega el Worker després d'haver integrat la PR corresponent.

No copiïs el valor del token en cap fitxer, captura ni conversa. El Worker no el retorna mai.

## Comportament

- El cron original de GitHub continua sent el primer intent.
- Si no ha començat, Cloudflare el recupera a la franja prevista.
- D1 registra una única execució per dia i franja. Un cron de GitHub que arribi tard es tanca sense generar un segon vídeo.
- Si el flux falla abans d'acabar, la recuperació només es considera obsoleta al cap de vint minuts; així s'eviten reintents immediats o duplicats.

## Prova segura

Després de configurar el secret i desplegar el Worker, comprova en el panell de GitHub que el flux apareix com a `workflow_dispatch` prop de la franja. El Short s'ha de pujar privat i mantenir l'hora pública configurada.
