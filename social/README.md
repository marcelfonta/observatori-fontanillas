# Xarxes socials — automatització segura V22.26.0

Els vídeos del matí i del vespre utilitzen símbols WMO, colors, titulars i consells que canvien amb la predicció real. La pantalla de l’estació identifica explícitament les dades observades i no hi afegeix cap icona predictiva. Les descripcions de Meta, TikTok i X també resumeixen el fenomen, la màxima, la mínima i la probabilitat de pluja. La targeta del migdia incorpora el símbol de la previsió d’avui.

X utilitza el perfil connectat a Buffer i la mateixa `BUFFER_API_KEY` privada del Worker. Publica vídeo a les 07:00, la targeta meteorològica de les 14:00 i vídeo a les 20:30. Cada franja desa l’identificador remot a D1, consulta el resultat després de l’hora prevista, evita duplicats i fa fins a quatre intents dins d’una finestra de 90 minuts. El correu operatiu només s’envia si la publicació continua fallant després de tots els intents.

Facebook i Instagram estan connectats al portafolis de Meta. Bluesky i Telegram també tenen les seves credencials privades al Worker. El portal enllaça els perfils públics configurats, inclòs X, i no carrega cap SDK social.

La publicació automàtica no està activa. El Worker crea esborranys a `social_drafts` i el panell protegit permet editar-los, aprovar-los o descartar-los. Només un contingut aprovat es pot enviar manualment a Facebook, Instagram, Bluesky o Telegram, amb un botó i una confirmació independents per canal.

## Abans de connectar res

1. Aplicar `worker/schema.sql` a D1 i publicar el Worker V21.2; l’esquema afegeix `social_publications` sense eliminar els esborranys existents.
2. Prémer «Comprovar les 4 connexions». Aquesta prova només valida compte, permisos i credencials; no publica res.
3. Confirmar que Facebook, Instagram, Bluesky i Telegram apareixen en verd. Si Meta no identifica bé els actius, definir `META_FACEBOOK_PAGE_ID` i `META_INSTAGRAM_ACCOUNT_ID` al Worker.
4. Revisar diversos esborranys reals, editar-los i aprovar-ne un de prova abans d’autoritzar una publicació manual per un sol canal.
5. Publicar el mateix esborrany, d’un en un, en aquest ordre recomanat: Telegram, Bluesky, Facebook i Instagram. Verificar la publicació externa abans de continuar al canal següent.
6. Mantenir doble factor, permisos mínims i totes les credencials exclusivament com a secrets de Cloudflare.
7. No afegir píxels, analítica o formularis de Meta sense una decisió explícita de privacitat.

## Pilars de contingut

- Dada del dia amb context i font.
- Avís oficial amb enllaç al portal, mai reinterpretat com una alerta pròpia.
- Imatge de webcam amb hora visible.
- Resum setmanal i curiositat meteorològica verificada.
- Contingut educatiu de la secció Aprendre.

## Regles

- Cap dada sense hora i font.
- Els avisos grocs, taronja i vermells de Meteocat es poden publicar automàticament quan l’API oficial identifica el Vallès Oriental (codi 41). El text ha d’explicar sempre que l’abast és comarcal i que no implica afectació a tot Sant Celoni.
- Cada targeta d'avís mostra el nivell màxim vigent de totes les comarques de Catalunya sobre límits oficials de l'ICGC, remarca el Vallès Oriental i identifica Meteocat com a única font de la publicació social.
- Els avisos d'AEMET es mantenen al web i al sistema de notificacions, però no creen ni recuperen publicacions socials automàtiques.
- L’automatització només crea la publicació si hi ha avís al Vallès Oriental; les altres comarques s'utilitzen exclusivament per completar el mapa de context. També ignora esborranys i repeticions del mateix fenomen, nivell, dia i franges.
- Text alternatiu descriptiu a totes les imatges.
- Enllaços amb UTM: `utm_source`, `utm_medium=social`, `utm_campaign` i `utm_content`.
- Mai desar tokens de xarxes dins del frontend o del repositori; només secrets del Worker.
- Aprovar i publicar són accions diferents; cada enviament demana confirmació i queda registrat, també si falla.
- Un contingut publicat és immutable al panell. Per corregir-lo, cal preparar un esborrany nou.
- Facebook i Instagram només es publiquen manualment des del panell protegit i amb confirmació explícita.
- X no forma part de la cua manual d’imatges: té un flux automàtic propi a Buffer per poder alternar vídeo, imatge i vídeo.

## Secrets de Cloudflare

- `META_SYSTEM_USER_TOKEN`: token del sistema Meta per a Facebook i Instagram.
- `META_FACEBOOK_PAGE_ID`: identificador opcional de la pàgina; evita ambigüitats si el token gestiona més d’una pàgina.
- `META_INSTAGRAM_ACCOUNT_ID`: identificador opcional del compte professional d’Instagram.
- `META_INSTAGRAM_IMAGE_URL`: imatge pública opcional per a Instagram; si falta s’utilitza la targeta social del portal.
- `BLUESKY_HANDLE`: `meteofontanillas.bsky.social`.
- `BLUESKY_APP_PASSWORD`: contrasenya d’aplicació, mai la contrasenya principal.
- `TELEGRAM_BOT_TOKEN`: token privat creat amb BotFather.
- `TELEGRAM_CHANNEL_ID`: identificador públic del canal, per exemple `@meteofontanillas`.
- `BUFFER_API_KEY`: clau privada de Buffer compartida pels canals de TikTok i X.
- `BUFFER_X_AUTOMATION_ENABLED`: `true` activa explícitament X; si encara no existeix, hereta temporalment l’estat de `BUFFER_TIKTOK_AUTOMATION_ENABLED` per mantenir compatibilitat amb producció.
- `METEOCAT_API_KEY`: clau privada gratuïta de l’API oficial de Meteocat; s’envia només des del Worker amb la capçalera `x-api-key`.
- `METEOCAT_ALERT_SOCIAL_ENABLED`: `true` activa la consulta dels tres dies d’avisos i la publicació deduplicada dels nivells groc, taronja i vermell del Vallès Oriental. L’antic nom `METEOCAT_SEVERE_SOCIAL_ENABLED` es conserva temporalment com a compatibilitat.

Que una credencial aparegui en verd només confirma que existeix al Worker. La comprovació de connexions valida també l’accés real sense publicar. Cap canal s’envia fins que un esborrany ha estat aprovat, es prem el seu botó i s’accepta la confirmació.
