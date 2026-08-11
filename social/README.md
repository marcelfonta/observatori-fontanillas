# Xarxes socials — mode segur V21.0.2

Facebook i Instagram estan connectats al portafolis de Meta. Bluesky i Telegram també tenen les seves credencials privades al Worker. El portal només enllaça els quatre perfils públics i no carrega cap SDK social.

La publicació automàtica no està activa. El Worker només crea esborranys a `social_drafts`; no conté cap crida per publicar-los.

## Abans de connectar res

1. Aplicar `worker/schema.sql` a D1 i publicar el Worker V21.
2. Confirmar al panell que Meta, Bluesky i Telegram mostren «Credencial activa».
3. Revisar diversos esborranys reals i corregir el format editorial abans d’autoritzar una primera prova manual.
4. Mantenir doble factor, permisos mínims i totes les credencials exclusivament com a secrets de Cloudflare.
5. No afegir píxels, analítica o formularis de Meta sense una decisió explícita de privacitat.

## Pilars de contingut

- Dada del dia amb context i font.
- Avís oficial amb enllaç al portal, mai reinterpretat com una alerta pròpia.
- Imatge de webcam amb hora visible.
- Resum setmanal i curiositat meteorològica verificada.
- Contingut educatiu de la secció Aprendre.

## Regles

- Cap dada sense hora i font.
- Cap publicació automàtica d’un avís vermell sense comprovació humana inicial.
- Text alternatiu descriptiu a totes les imatges.
- Enllaços amb UTM: `utm_source`, `utm_medium=social`, `utm_campaign` i `utm_content`.
- Mai desar tokens de xarxes dins del frontend o del repositori; només secrets del Worker.
- X queda fora del projecte.

## Secrets de Cloudflare

- `META_SYSTEM_USER_TOKEN`: token del sistema Meta per a Facebook i Instagram.
- `BLUESKY_HANDLE`: `meteofontanillas.bsky.social`.
- `BLUESKY_APP_PASSWORD`: contrasenya d’aplicació, mai la contrasenya principal.
- `TELEGRAM_BOT_TOKEN`: token privat creat amb BotFather.
- `TELEGRAM_CHANNEL_ID`: identificador públic del canal, per exemple `@meteofontanillas`.

Que una credencial aparegui en verd només confirma que existeix al Worker. La publicació continua desactivada i els continguts es mantenen com a esborranys fins a una aprovació humana explícita.
