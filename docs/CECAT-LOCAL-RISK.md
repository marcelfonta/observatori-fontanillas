# Actualitzacions locals CECAT / INUNCAT

## Objectiu

Aportar una informació oficial addicional quan Protecció Civil publica un mapa de risc que situa Sant Celoni o l'entorn immediat en taronja o vermell. No substitueix ni replica les publicacions d'avisos meteorològics de Meteocat.

## Fonts i freqüència

- Plans actius: conjunt oficial `wj9c-j6vf` de Dades Obertes de Catalunya.
- Document: PDF oficial enllaçat pel CECAT, sempre sota `documents.dadesobertes.gencat.cat`.
- Comprovació: cada 30 minuts, 48 franges diàries com a màxim.
- El Worker no descarrega ni interpreta el PDF; reserva el comunicat a D1 i dispara un workflow aïllat.

## Criteri editorial

- Pla actiu: només INUNCAT.
- Àrea: punt de l'estació de Sant Celoni i radi aproximat de 12 km sobre el mapa municipal oficial.
- Llindar: cal almenys una franja activa o futura taronja o vermella. La targeta conserva igualment les quatre franges del dia —també les verdes i grogues— per mostrar-ne l'evolució completa.
- Vigència: avui i els tres dies següents; la peça caduca al final de l'última franja oficial del dia convertida a hora local.
- El mapa es conserva amb els colors oficials. Només s'hi afegeix un marcador local i la capa de marca/explicació.
- El text sempre diu «actualització de risc local», identifica CECAT/Protecció Civil i explica que no és probabilitat de pluja.

## Antiduplicació

- Una reserva D1 per cada franja impedeix repetir la consulta dins la mateixa mitja hora.
- Una reserva per URL oficial impedeix disparar repetidament el mateix comunicat.
- L'esborrany social es deduplica per data, fenomen i perfil complet de les quatre franges. Un comunicat nou amb la mateixa situació no repeteix la publicació; un canvi material d'alguna franja sí que pot generar una actualització.
- Si hi ha un avís Meteocat per a la mateixa data, el text declara que el mapa CECAT és el detall local complementari.
- La recuperació per canal reutilitza les mateixes reserves i límits del sistema social principal.

## Seguretat i degradació

- Domini PDF, tipus, mida, capçalera, dates, estructura d'imatges i paleta es validen abans de generar res.
- Els comunicats oficials només textuals són un resultat normal sense peça: es
  conserven a l'auditoria com a `no_supported_risk_maps`, no publiquen i no
  provoquen una falsa alarma de GitHub Actions.
- Qualsevol canvi de plantilla o resultat geogràfic insuficientment segur falla tancat.
- El workflow no rep credencials de xarxes; només el token de retorn ja utilitzat per les automatitzacions socials.
- El Worker torna a validar totes les metadades, la vigència, el nivell i les dues imatges abans de crear l'esborrany.
- No hi ha canvi d'esquema D1.

## Activació segura

1. Desplegar el codi amb els dos interruptors a `false`.
2. Activar `SOCIAL_CECAT_LOCAL_RISK_ENABLED=true` i mantenir `SOCIAL_CECAT_LOCAL_RISK_AUTOPUBLISH_ENABLED=false`.
3. Validar almenys una mostra real: document, quatre mapes, marcadors, nivells, quatre franges locals, text, font, PNG i JPEG.
4. Només amb una nova autorització humana, activar `SOCIAL_CECAT_LOCAL_RISK_AUTOPUBLISH_ENABLED=true`.

## Rollback

- Posar primer `SOCIAL_CECAT_LOCAL_RISK_AUTOPUBLISH_ENABLED=false` i després `SOCIAL_CECAT_LOCAL_RISK_ENABLED=false`.
- No esborrar esborranys, publicacions ni files `monitor_state`: formen part de l'auditoria i eviten duplicats.
- Revertir Worker, workflow i script conjuntament. Meteocat i la resta de publicacions no depenen d'aquesta família.
