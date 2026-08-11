# Activació del panell d’Administració

La pàgina `administracio.html` està protegida pel Worker. La clau no forma part dels fitxers públics i no s’ha d’afegir mai a `src/core/config.js`.

## Activació

1. Publica `worker/index.js` mantenint els bindings i secrets existents.
2. A la configuració del Worker de Cloudflare, crea un secret anomenat `ADMIN_TOKEN`.
3. Utilitza una clau aleatòria d’almenys 24 caràcters; se’n recomanen 48 o més.
4. Publica els fitxers web i obre `/administracio.html`.
5. Introdueix la mateixa clau. Només es conservarà a `sessionStorage` fins que es tanqui la pestanya o la sessió des del mateix panell.

Si `ADMIN_TOKEN` no existeix, el Worker retorna “panell no configurat”. Una clau incorrecta retorna accés no autoritzat. El diagnòstic copiat exclou sempre la clau.

## Proteccions incorporades

- Validació de la clau al Worker mitjançant una comparació de hashes.
- Límit de deu intents fallits per IP cada quinze minuts quan D1 està disponible.
- Endpoint `/admin/status` amb `no-store` i sense valors de secrets.
- La PWA no desa les respostes `/admin/` a la memòria cau.
- Pàgina exclosa de cercadors i del sitemap.
- Sense operacions de supressió, reinici o modificació de dades.
- Orígens permesos limitats a la web de l’Observatori i als entorns locals ja autoritzats.

Si canvia el domini públic, cal afegir-lo a `ALLOWED_CONTACT_ORIGINS` del Worker abans de desplegar-lo.

## Cua social V21

El panell mostra si `META_SYSTEM_USER_TOKEN` està configurat i resumeix `social_drafts`, però no retorna mai la credencial. A V21 la cua és exclusivament de revisió: no hi ha cap botó ni endpoint de publicació. Per activar-la cal aplicar `worker/schema.sql` a D1 i desplegar el Worker V21.
