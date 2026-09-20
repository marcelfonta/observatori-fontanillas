# Seguiment de la renovació social · 20/09/2026

## Fita i límits

Preparar la validació dels primers lliuraments, el lector XAC només local i
el registre d'impacte. Cap enviament, desplegament, secret, cron, migració ni
canvi dels publicadors en aquest paquet. L'ús no comercial del pol·len ha
estat confirmat explícitament per Marcel el 20/09/2026.

## Producció i primers lliuraments

PR 160 integrat a `6b30ae5033fe9f52c606553ec58afeb5a5eb07b7`.
Worker 22.29.20 desplegat a les 08:49 UTC, versió
`16a0e0e3-a68c-4bab-9cd2-9dd80c8dd83a`; Pages
`f021b80d-6eaf-4da3-ab4d-a80a0145cb9e`. Versió, salut i fitxers de la web
comprovats. Horaris 06:45, 14:00 i 20:30 conservats.

Consulta D1 de només lectura cap a les 11:07 locals: l'esborrany 2872 de
06:45 consta publicat a Bluesky, Telegram i Threads, amb identificadors
remots; no té `socialFormat`, perquè és anterior al desplegament. Això no
valida el format nou ni confirma per si sol la visibilitat en les apps.
Les franges 14:00 i 20:30 del dia 20 i 06:45 del dia 21 encara no tenen
esborrany. Les dues consultes D1 han escrit zero files.

| Edició nova | Estat a les 11:07 del dia 20 | Evidència necessària |
| --- | --- | --- |
| 20/09, 14:00 | Encara no toca | Identificadors per canal + imatge publicada |
| 20/09, 20:30 | Encara no toca | Vídeo compartit + URL/estat per canal |
| 21/09, 06:45 | Encara no toca | Vídeo compartit + URL/estat per canal |

Per cada canal configurat: comprovar acceptació, processament i publicació
per separat, amb URL/ID, data de consulta i captura de la peça. Revisar al
mòbil el logo, la primera/última escena, data, so, franges, retalls i elements
superposats de l'app. Una prova Chromium no equival a Instagram en un iPhone.
No recuperar franges ni regenerar fitxers existents per obtenir captures.
Cap monitor nou creat en aquesta sessió; aquestes comprovacions futures no
es donen per executades ni programades.

## Pol·len: lector verificable, encara no integrat

Fonts revisades:

- [API PIA/XAC](https://aerobiologia.cat/pia/en/api).
- [Condicions PIA](https://aerobiologia.cat/pia/en/terms).
- [Butlletí de Bellaterra](https://aerobiologia.cat/pia/ca/forecast/bellaterra).

L'API diferencia **nivell actual del butlletí** (0–4) i **tendència prevista**
(augment, estable, descens, excepcional). No sumem ni convertim aquests camps
en un nivell futur inventat. Separem pòl·lens i espores, i no generem un
indicador global de risc d'al·lèrgia. L'absència no es converteix en zero.

Consulta real del dia 20: l'API de Bellaterra ja retorna el període **21–27
de setembre**. El lector marca `future` per a una consulta del dia 20, no
`in-period`. També rebutja XML mal format, declaracions d'entitats, dates
impossibles, tàxons duplicats, estació diferent i canvis d'escala/llicència.
Una fila incompleta conserva `null` i marca tot el resultat `incomplete`.

Bellaterra és només la mostra tècnica, no una selecció aprovada ni una
equivalència amb Sant Celoni. La integració requereix confirmar la referència
territorial amb la XAC; la proximitat no garanteix representativitat.

La previsualització inclou autoria, enllaç, adaptació i CC BY-NC-SA 4.0, sense
logotip PIA ni aparença de suport institucional. Cal comunicar l'ús als
autors segons la seva petició; no s'ha enviat cap missatge. Si l'ús canvia a
comercial, reobrir la revisió de condicions abans de reutilitzar les dades.

### Reproduir localment

```sh
node scripts/pollen-xac-preview.mjs bellaterra 2026-09-20
```

Una única petició GET pública; Chromium interpreta XML amb DOMParser, amb
xarxa bloquejada durant el render. Genera JSON, HTML i captura mòbil a
`build/pollen-xac-preview/` (ignorat). No consulta historials ni gràfics
reals de pol·len, no accedeix a secrets i no té cap ruta de publicació.
La data i l'estació són obligatòries; no hi ha selecció automàtica ni cron.
El resultat sempre porta `publishing:false` i `referenceApproved:false`.

### Consulta preparada, NO enviada

Destinatari: contacte indicat a la [pàgina oficial de l'API](https://aerobiologia.cat/pia/en/api).

**Assumpte: Referència aerobiològica per a Sant Celoni i ús no comercial de la previsió XAC**

Bon dia,

Soc en Marcel, del projecte Meteo Fontanillas, un observatori meteorològic
local de Sant Celoni (https://meteo.fontanillas.cat/).

Voldríem incorporar una síntesi de la vostra previsió setmanal de pòl·lens
i espores a la web i a les xarxes, amb ús exclusivament no comercial,
autoria, enllaç al PIA, període de validesa i llicència CC BY-NC-SA 4.0.
No la presentaríem com una mesura local ni com una valoració clínica.

Ens podríeu indicar quina estació de referència és més adequada per a
Sant Celoni i el Baix Montseny, i quines limitacions territorials convé
remarcar? Hem fet una prova tècnica amb Bellaterra, sense publicar-la.
També us agrairíem orientació sobre l'atribució i l'avís de llicència en
imatges o vídeos breus a les xarxes socials.

Gràcies per la vostra feina,
Marcel · Meteo Fontanillas

## Prova editorial de mal temps

Encara pendent d'un episodi real amb dades de la data objectiu. No activar
enviaments de prova ni crear alarmisme per fer-ne una mostra. Conservar la
instantània datada, generar només previsualitzacions i revisar: dates, franges,
fenomen breu significatiu, pluja, qualitat de les dades i avisos oficials
separats del model. Si no hi ha episodi, anotar «no avaluable», no «superat».

## Seguiment d'impacte: plantilla, no dades inventades

Objectiu: veure si milloren retenció, comparticions, desats i seguiments;
no prometre creixement per haver renovat el disseny.

Per publicació, copiar una fila d'aquesta plantilla i afegir les xifres de
les estadístiques natives/exportació de la plataforma. `—` significa no
disponible, no zero. No s'ha connectat cap API nova d'analítica.

| Xarxa / URL | Format i edició | Publicat (fus) | Consulta (fus) / antiguitat | Visualitzacions | Abast | Temps mitjà vist | Compleció | Comparticions | Desats | Seguiments atribuïts | Font/captura |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — | — | — | — | — | — | — |

Proposta de comparació: recollir a les 24 h i 72 h, començar amb 14 dies
abans/després, separar xarxa, edició, format i meteorologia ordinària o
episodi. És una mostra exploratòria, no una demostració causal ni un A/B.
Comparar a igual antiguitat; no un vídeo nou de dues hores amb un d'una
setmana. Guardar la definició exacta de «visualització», «abast» i
«compleció» que mostra cada plataforma; no barrejar denominadors.

- Temps mitjà vist / 30 s: ràtio de durada vista, **no** taxa de compleció;
  pot superar el 100% per repeticions, i no s'ha de truncar.
- Comparticions o desats / abast: només quan el proveïdor ofereixi les dues
  magnituds per a la mateixa peça i finestra; sense abast, no calcular-les.
- Seguiments atribuïts: només quan la plataforma els atribueix a la peça.
  El canvi total de seguidors del compte s'anota separat, no s'atribueix al vídeo.
- No comparar taxes de xarxes diferents com si mesuressin el mateix.
- Revisar mediana i dispersió, amb nombre de peces i episodis excepcionals;
  decidir després un únic canvi editorial per volta.

## Rollback i acceptació

Validació local: `npm run test:quick` (32 fitxers), `npm run check` (79
fitxers) i `npm run test:browser` (27 proves) superats. El lector s'ha provat
també amb XML real de l'API; les proves automàtiques fan servir una mostra
sintètica explícita. Previsualitzacions comprovades a 360 i 390 px, sense
desbordament horitzontal. No equival a una peça editorial final ni a una
validació clínica/territorial de Bellaterra per a Sant Celoni.

Aquest paquet només afegeix eines locals, proves i documentació. Revertir-lo
no afecta producció; no hi ha registres remots per eliminar ni recursos per
republicar. Per activar pol·len cal un paquet posterior revisat, amb referència
aprovada, llicència/atribució adequades, proves, staging i autorització.
