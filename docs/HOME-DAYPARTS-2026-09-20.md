# Portada per franges · revisió visual

## Abast i criteris

La portada reutilitza `fetchForecast` → `renderForecast` → `renderHomeForecast`.
No hi ha endpoint, consulta periòdica, llindar ni publicador nou. Es conserva
`summarizeForecastDayparts`: franges futures locals, absències explícites i
probabilitat màxima horària, no probabilitat acumulada del període.

- Una, dues o tres targetes ocupen la graella disponible sense reservar una tercera columna buida; una sola franja queda centrada i amb amplada acotada.
- Símbols SVG locals per tots els codis WMO acceptats; codi desconegut mai representa sol.
- Nit només amb `is_day=0` a totes les hores esperades. Una transició real
  dia/nit mostra una posta recognoscible; una absència mostra un cel genèric,
  no l'antic cercle ambigu. La icona de lluna no és la fase lunar.
- Temperatures arrodonides iguals es mostren un sol cop; una absència no és 0° ni 0%.
- Data segons idioma i dia Europe/Madrid; pluja i ratxa mantenen qualificadors.
- Informació textual accessible al costat d'icones decoratives; botons de 44 px
  i focus visible; cap animació ni recurs gràfic remot addicional.

## Verificació

- Proves unitàries: franges locals, arrodoniment, zero real, absències,
  tots els codis acceptats, dia/nit, transicions i hores incompletes.
- Navegador: 320, 390, 768 i 1440 px; una/dues/tres franges, cap desbordament,
  quatre idiomes, enllaç a previsió i error sense icones o zeros ficticis.
- Captures locals revisades en mòbil i escriptori, amb dades sintètiques:
  **no són una previsió real ni publicacions a les xarxes**.
- Guia de navegació/verificació aplicada amb Playwright del projecte com a
  alternativa local: `agent-browser` no està instal·lat. Cap petició externa
  durant les proves de navegador; errors deliberats de proveïdor separats
  dels errors JavaScript, que han de ser zero.

## Lliurament i retorn enrere

Preparat per PR, sense desplegament en aquesta entrega. Nova cache PWA
`home-dayparts-v3`, amb el mòdul SVG al precache; cap canvi de dades persistents.
Després del merge, verificar preview abans d'autoritzar producció. Si cal
revertir, revertir el commit de presentació i publicar amb una nova clau de
cache PWA perquè els dispositius instal·lats també rebin el retorn enrere.
No cal migrar D1, modificar secrets ni desplegar el Worker.
