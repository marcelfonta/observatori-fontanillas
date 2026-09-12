# Auditoria H — Conciliació dels vídeos de Meta

## Abast

- Reels i Stories de Facebook que ja tenen un `video_id` i una URL de pujada desats.
- Represa després d’una resposta perduda durant la fase final de publicació.
- Compatibilitat amb els estats de Story creats abans d’aquesta correcció.

No modifica les publicacions d’imatge, Instagram, els horaris, els interruptors d’automatització ni les credencials.

## Comportament segur

1. La reserva D1 existent continua impedint dues execucions simultànies de la mateixa data i franja.
2. Si Facebook va rebre la petició final però el Worker no en va rebre la resposta, el reintent consulta `/{video_id}?fields=status`.
3. Només `status.publishing_phase.status = complete` es considera una confirmació inequívoca de publicació.
4. Quan Facebook confirma la publicació, es reutilitza el mateix identificador i no es repeteix la petició final.
5. Quan l’estat és pendent, es reprèn el mateix `video_id`; no s’inicia una segona sessió de vídeo.
6. Si la consulta d’estat falla, l’intent queda registrat com a error i no es fa una nova crida final a cegues.

Les publicacions d’imatge que van perdre la resposta abans de rebre un identificador remot continuen bloquejades per a conciliació humana: no hi ha una consulta fiable que permeti deduir-ne l’èxit sense risc de duplicat.

## Referències oficials

- La col·lecció oficial de Meta descriu el `video_id` com a identificador compartit pels passos de pujada, estat i publicació.
- La mateixa col·lecció documenta la consulta `GET /{video_id}?fields=status` i les fases `uploading`, `processing` i `publishing`.
- La fase final del Reel utilitza el mateix `video_id` amb `upload_phase=finish` i `video_state=PUBLISHED`.

Referència: https://www.postman.com/meta/facebook/documentation/r56bjfd/facebook-api

## Validació i desplegament

1. Executar la suite completa i la simulació de desplegament del Worker.
2. Integrar la PR.
3. Desplegar i validar a staging sense forçar cap publicació social.
4. Només amb una autorització humana posterior, desplegar el Worker 22.29.12 a producció.
5. Confirmar una franja automàtica real abans de retirar qualsevol control manual.

Staging de la branca: execució 34711239681 superada, inclosa la validació de rutes públiques. GitHub mostra un avís no bloquejant perquè `cloudflare/wrangler-action@v3` i `pnpm/action-setup@v4` encara declaren internament Node 20; el runner les força a Node 24.

## Reversió

Aturar temporalment l’automatització de vídeos de Meta abans de revertir. Conservar les files `monitor_state` i els identificadors remots; no reiniciar ni marcar com a reintentables en bloc les franges incertes.
