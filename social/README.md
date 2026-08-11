# Xarxes socials — mode segur V21

Facebook i Instagram ja estan connectats al portafolis de Meta i disposen d’una credencial privada al Worker. El portal només enllaça els perfils públics i no carrega cap SDK de Meta.

La publicació automàtica no està activa. El Worker només crea esborranys a `social_drafts`; no conté cap crida per publicar-los.

## Abans de connectar res

1. Aplicar `worker/schema.sql` a D1 i publicar el Worker V21.
2. Confirmar al panell que «Meta · Facebook i Instagram» mostra «Credencial activa».
3. Revisar diversos esborranys reals i corregir el format editorial abans d’autoritzar una primera prova manual.
4. Mantenir doble factor, permisos mínims i `META_SYSTEM_USER_TOKEN` exclusivament com a secret de Cloudflare.
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
