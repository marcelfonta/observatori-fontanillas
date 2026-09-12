# Auditoria F — estadística, vent i temps local

Data: 12 de setembre de 2026. Estat: implementació local preparada per revisar; sense migració ni desplegament.

## Problemes confirmats

1. El navegador combinava agregats diaris i horaris donant el mateix pes a cada fila. Una mitjana anual podia quedar esbiaixada perquè una fila amb centenars de lectures comptava igual que una fila horària parcial.
2. La direcció del vent s’agregava amb una mitjana lineal. Per exemple, 350° i 10° donaven 180° (sud) en lloc de 0° (nord).
3. L’agregació horària D1 aplicava a tot l’arxiu el desplaçament de Madrid vigent en el moment de la consulta. Això podia moure dades antigues quan l’arxiu travessava CET, CEST o l’hora repetida de tardor.
4. Els valors locals sense zona horària es podien interpretar segons la zona del dispositiu del visitant.

## Correccions

- Mitjana i desviació ponderades pel recompte real `samples`; el Centre de Dades i l’arxiu d’extrems comparteixen el mateix criteri.
- Cobertura intradiària visible amb lectures rebudes, lectures esperades cada cinc minuts i percentatge de continuïtat. La cobertura de calendari continua separada.
- Mitjana circular del vent tant als agregats D1 com a la reserva de Weather Underground. Si les direccions es cancel·len, el resultat és absent i no s’inventa una orientació.
- Hores D1 agrupades per hora UTC transcorreguda. Les dues 02:30 del canvi de tardor es conserven com a intervals diferents.
- `time`, `timeUtc`, `local_time` i `local_date` es deriven de l’epoch amb `Europe/Madrid` en llegir o capturar dades noves. Les files antigues no es reescriuen.
- Els temps locals heretats del client s’interpreten explícitament a `Europe/Madrid`; una hora inexistent durant el salt de primavera es descarta.

## Verificació i límits

- Proves unitàries de ponderació, cobertura, hivern/estiu i hora inexistent.
- Proves SQLite reals de direcció 350° + 10°, cancel·lació 90° + 270° i hora repetida de tardor.
- Cap canvi d’esquema D1, cap secret nou i cap publicació social.
- Després d’integrar: desplegar primer a staging, comprovar `/history` en `raw`, `hourly` i `daily`, i només després proposar producció.

## Rollback

Revertir el commit i tornar a desplegar les versions anteriors. No cal revertir cap migració ni restaurar dades.
