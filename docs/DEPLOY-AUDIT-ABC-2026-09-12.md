# Desplegament aprovat A/B/C · 12 de setembre de 2026

Autorització humana: «Desplega i fes el seguent paquet de millores», després del merge de la PR 139.

## Versió publicada

- Revisió aprovada: `a718689882a95f3474204dff2df734118c1b312f`.
- Worker 22.29.7, built 2026-09-12; frontend/PWA `audit-c`.
- Staging completat correctament: [execució 34704304562](https://github.com/marcelfonta/observatori-fontanillas/actions/runs/34704304562).
- Dry-run revisat abans de producció.

## Transició de publicacions

1. Còpia immutable del merge, separada de la branca del paquet D.
2. Desplegament amb `--keep-vars` i `SOCIAL_AUTOMATION_ENABLED=false`. Versió de pausa `9c62d651-bfb8-43ae-9858-5d3080960409`, creada a les 16:11:05 UTC; finalització confirmada abans de les 16:11:18 UTC.
3. Pausa superior a 15 minuts per deixar finalitzar possibles cron antics. Es va indicar que no es fessin enviaments manuals. Cap canvi de credencials, pla, migració o horari; els fluxos separats de vídeo no s’han pausat.
4. Revisió només de lectura dels últims estats. Els dos errors antics de Threads trobats (esborranys 2805/2807) ja tenien un èxit posterior al mateix canal i constaven publicats. No s’han reenviat ni alterat registres.
5. Mateix codi aprovat desplegat amb `SOCIAL_AUTOMATION_ENABLED=true`, després de les 16:26:36 UTC. Versió final `4b06592c-1f59-4e17-a34c-d15fd907b22a`, creada a les 16:27:05 UTC.

## Evidència final

Configuració remota verificada amb automatització d’imatges activa; `/version` retorna 22.29.7 i `/health` retorna healthy, sense camps absents. L’arxiu havia avançat de 12.070 a 12.073 lectures durant la pausa. La web pública serveix el service worker `audit-c`.

No s’ha forçat cap publicació de prova ni s’han rellançat peces antigues. La verificació de configuració i salut no equival a comprovar el pròxim lliurament de cada xarxa. El paquet D (22.29.8) queda exclusivament a la seva PR; no forma part d’aquest desplegament.
