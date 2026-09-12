# Auditoria B · cua i enviament segur

## Abast i contracte

Worker 22.29.7. Flux `social_drafts` d’imatges: Facebook, Instagram, Telegram, Bluesky, Threads i X via Buffer. Cron i publicació manual comparteixen la mateixa reserva. No modifica vídeos Meta, episodis de vídeo, YouTube, TikTok, horaris ni credencials. Web 22.31.0 amb revisió de memòria cau `audit-b`.

Cada intent s’insereix com a `pending` amb una única sentència `INSERT … SELECT … WHERE NOT EXISTS`. D1/SQLite serialitza aquesta escriptura; no s’utilitza un bloqueig en memòria del Worker ni una lectura seguida d’un insert incondicional. La reserva exigeix un esborrany aprovat/publicable i absència de `pending`, `uncertain` o `published` en aquell canal.

Es reutilitza la taula existent, sense columnes, índexs ni migracions nous. Les consultes per esborrany utilitzen l’índex existent; cada reserva afegeix una escriptura prèvia a l’enviament i una marca abans de la petició pública. No es creen serveis de pagament ni s’afirma que el consum sigui zero.

## Estats d’intent

- `pending`: reserva creada, en preparació, en enviament o execució interrompuda. Bloqueja reenviaments sense caducitat automàtica.
- `failed`: preparació fallida abans de la petició pública; es pot reintentar fins a quatre intents totals per canal.
- `failed_terminal`: preparació amb error definitiu; no es reintenta automàticament.
- `uncertain`: s’ha iniciat la petició pública però no tenim confirmació fiable. Inclou errors després de l’enviament; el criteri és deliberadament conservador, també quan la plataforma podria haver rebutjat la petició.
- `published`: identificador retornat per la plataforma i desat, o confirmat manualment. A X, manté el contracte existent d’acceptació a Buffer: no certifica la visibilitat final a X.

Un error de D1 després d’un èxit remot no s’enregistra com a `failed`: es conserva `pending` i no es reenvia. Un procés interromput abans d’enviar també pot quedar bloquejat; es prioritza no duplicar. No s’aplica cap arrendament que s’alliberi al cap d’uns minuts.

La recuperació mira fins a deu candidats per família. Els caducats passen a esborrany; els esgotats, definitius o incerts, a revisió. Continua buscant dins del mateix lot i els lots següents avancen. Un `pending` recent es deixa tranquil durant 45 minuts; després pot passar a revisió, però la reserva continua bloquejant el canal. Si els deu candidats estan encara actius, la passada no continua més enllà: límit conscient de consum.

Els quatre intents inclouen els errors antics d’X de longitud que abans s’exceptuaven. L’acció manual pot repetir una preparació fallida després d’esgotar intents, però mai un `pending`, `uncertain` o `published`.

Threads consulta l’estat del contenidor abans de fer una sola petició de publicació; ja no repeteix cegament el POST final.

## Conciliació humana

El panell mostra els canals bloquejats i desactiva els seus botons d’enviament. «Ja el veig publicat: registrar identificador» demana l’enllaç o identificador i una segona confirmació. La ruta autenticada `POST /admin/social-drafts/:id/confirm-delivery` només actualitza un intent `pending`/`uncertain` que pertany a l’esborrany indicat; no envia res ni consulta la plataforma.

Això és una comprovació humana, **no** verificació automàtica del proveïdor. No hi ha botó d’alliberament cec quan no es troba el post. Cal investigar la plataforma abans d’autoritzar una nova publicació. No s’infereix que «no el veig» equivalgui a «no s’ha publicat».

## Proves i límits

`tests/audit-social-delivery.mjs` executa SQL real amb SQLite en memòria: concurrència cron/manual per sis canals, quatre intents, error definitiu, resposta perduda, D1 fallant després d’acceptació, conciliació amb autorització, cua de més de deu candidats i publicació Telegram amb HTTP simulat. Cap petició a xarxes reals. Node 22 mostra l’avís experimental de `node:sqlite`; no s’introdueix al runtime del Worker.

Revisió visual local del component real amb dades fictícies: 320 i 360 px, sense desbordament horitzontal i botons de conciliació de 58 px a 320 px. No equival a una prova de publicació real ni a staging. La guia de navegador s’ha seguit amb el navegador disponible perquè `agent-browser` no estava instal·lat.

Referències: [D1 i sentències preparades](https://developers.cloudflare.com/d1/worker-api/d1-database/), [Bones pràctiques Workers](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/), [estat del contenidor Threads, col·lecció oficial Meta](https://www.postman.com/meta/threads/request/ohuldvi/check-container-s-publishing-status).

## Desplegament i retorn segur

Pendent: revisió humana reforçada i staging aïllat. Abans de desplegar amb autorització: aturar els enviaments del flux afectat, esperar les execucions anteriors i revisar els intents antics amb resposta dubtosa. Una versió anterior que encara executi POST no participa en la reserva nova; no s’ha de fer desplegament gradual amb escriptors antics i nous actius alhora.

**No fer un rollback directe amb l’automatització en marxa.** El codi antic no respecta els nous estats. Aturar el flux social amb autorització, esperar les execucions actives i conciliar les reserves abans de tornar a una versió anterior. Mantenir el bloqueig i preferir una correcció endavant. No esborrar files de publicació ni convertir-les en errors reintentables en bloc. Les còpies antigues del panell manual tampoc s’han d’utilitzar per reenviar intents incerts.
