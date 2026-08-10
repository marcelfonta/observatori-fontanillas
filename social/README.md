# Preparació de xarxes socials

No hi ha cap compte connectat ni cap publicació automàtica activa. Aquesta carpeta deixa preparada la fase final perquè crear els canals no obligui a redissenyar el flux.

## Abans de connectar res

1. Crear els comptes amb un correu propietat de Marcel i activar doble factor.
2. Reservar un nom coherent, preferentment `ObservatoriFontanillas` o una variant curta comprovada a cada xarxa.
3. Aprovar descripció, avatar, imatge de capçalera i enllaç canònic.
4. Definir quins avisos poden publicar-se automàticament i quins exigeixen revisió humana.
5. Revisar Privacitat abans d’afegir píxels, analítica o formularis de tercers.

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
