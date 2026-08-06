# Full de ruta per a xarxes socials autònomes

Aquest document deixa preparada l’arquitectura de la futura fase social. **La V5.5 encara no publica res automàticament a cap xarxa** i no necessita cap contrasenya ni token nou.

## Objectiu

Publicar informació útil de l’Observatori de forma automàtica, coherent i verificable, sense haver d’entrar cada dia a les xarxes:

- resum del matí amb mínimes, estat actual i previsió;
- resum del vespre amb màxima, pluja, vent i posta de sol;
- avís extraordinari només quan una font oficial afecti realment la zona;
- rècords o episodis destacables basats en l’arxiu D1;
- imatge de webcam o gràfic quan aporti informació i la llicència ho permeti.

## Arquitectura recomanada

1. Un procés programat de Cloudflare llegeix les dades estructurades del Worker, la base D1, la previsió i els avisos oficials.
2. Un generador crea un text breu amb plantilles meteorològiques controlades. Les xifres sempre provenen de camps numèrics, no d’una captura del web.
3. Un filtre decideix si la informació és prou nova i rellevant per publicar-la.
4. Una cua de publicació envia el contingut a les APIs oficials de les xarxes autoritzades.
5. D1 conserva el text, l’hora, la xarxa, el resultat i l’identificador de la publicació per evitar duplicats i facilitar auditories.

## Fases segures

### A. Mode esborrany

Durant una o dues setmanes el sistema prepara propostes, però no publica. Permet revisar to, freqüència i criteris.

### B. Publicació programada

S’activen només els resums diaris. Els avisos i rècords encara demanen aprovació.

### C. Autonomia completa

S’activen els avisos oficials i els episodis destacables amb límits estrictes de freqüència, deduplicació i registre de cada decisió.

## Criteris obligatoris

- Cap token o clau dins de GitHub: sempre Secrets de Cloudflare.
- Només APIs oficials de cada xarxa; mai automatització simulant clics.
- Cap publicació repetida sobre el mateix avís o episodi.
- En alertes, citar AEMET/Meteocat i enllaçar la font original.
- No presentar una predicció com una certesa.
- Botó de desactivació global i registre d’errors.
- Màxim de publicacions diàries i franja nocturna sense missatges no urgents.
- Text alternatiu per a totes les imatges.

## Decisions que prendrem al final del disseny

- Xarxes prioritàries: Instagram/Facebook, Bluesky, Mastodon, X o altres.
- Freqüència exacta i idioma de cada canal.
- Si les publicacions inclouran webcam, gràfics o targetes generades.
- Quin tipus de contingut podrà ser totalment autònom i quin requerirà aprovació.

La V5.5 centralitza la lectura «Què importa ara?» i els avisos locals dins d’un únic centre de vigilància, afegeix l’accés immediat des de la capçalera i incorpora les metadades i la targeta visual necessàries per compartir enllaços. Aquest bloc servirà de base conceptual, però el futur publicador reconstruirà el missatge al servidor a partir de dades fiables, sense dependre del text visible al navegador.
