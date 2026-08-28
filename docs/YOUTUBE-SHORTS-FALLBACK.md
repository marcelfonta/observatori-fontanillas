# Recuperació fiable dels YouTube Shorts

GitHub Actions pot retardar o ometre un esdeveniment `schedule`. Per això el Worker és el rellotge principal: comprova cada cinc minuts i inicia les franges de les 07:20 i les 19:45 de Sant Celoni. GitHub conserva una reserva a les 07:35 i les 20:00, amb dos crons per franja perquè funcioni tant a l’estiu com a l’hivern.

## Configuració única necessària

1. A GitHub, crea un **fine-grained personal access token** restringit al repositori `marcelfonta/observatori-fontanillas`.
2. Concedeix únicament el permís de repositori **Actions: Read and write**.
3. Desa el valor a Cloudflare Worker `fonta-meteo` com a secret amb el nom `GITHUB_SHORTS_DISPATCH_TOKEN`.
4. Desplega el Worker després d'haver integrat la PR corresponent.

No copiïs el valor del token en cap fitxer, captura ni conversa. El Worker no el retorna mai.

## Comportament

- Cloudflare inicia el primer intent a les 07:20 o 19:45, en hora local.
- Si GitHub accepta el disparador però no inicia cap flux, Cloudflare el torna a enviar al cap de vuit minuts; la coordinació de D1 impedeix renderitzats duplicats.
- GitHub conserva un segon intent estacional a les 07:35 o 20:00 i descarta automàticament el cron que no correspon al canvi horari.
- D1 registra una única execució per dia i franja. Un cron de GitHub que arribi tard es tanca sense generar un segon vídeo.
- Si el flux falla abans d'acabar, la recuperació només es considera obsoleta al cap de vint minuts; així s'eviten reintents immediats o duplicats.
- El panell registra l’estat del planificador. Si el token falta o GitHub rebutja el disparador, el Worker envia un correu operatiu com a màxim cada dotze hores.
- La pujada només es considera correcta quan YouTube torna a consultar el vídeo i confirma l’identificador, la privacitat i l’hora programada.

## Prova segura

Després de configurar el secret i desplegar el Worker, comprova en el panell de GitHub que el flux apareix com a `workflow_dispatch` a partir de les 07:20 o 19:45. El Short s'ha de pujar privat i mantenir l'hora pública de les 08:00 o 20:30.
