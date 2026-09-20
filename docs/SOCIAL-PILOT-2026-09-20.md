# Renovació social — fase 1, pilot local

## Pilot 04 — ampliació ambiental, no activada

Continuació i ordres actuals a [SOCIAL-ENVIRONMENT-IMPLEMENTATION-2026-09-20.md](SOCIAL-ENVIRONMENT-IMPLEMENTATION-2026-09-20.md).
Inclou matí, vespre i imatge del migdia; els pilots 01–03 es conserven com a
historial de disseny. Les afirmacions d'absència d'informació ambiental que
segueixen descriuen aquelles versions anteriors, no el pilot 04.

## Pilot 03 — fase lunar verificada

Variant local `--lunar`, sortida separada `build/social-pilot/v3-lunar/`.
Conserva les dades meteorològiques, música i 30 segons del pilot 02. Al vespre
substitueix la icona genèrica per fase USNO datada, percentatge il·luminat i
referència explícita a les 12 h locals. És un esquema, no orientació al cel ni
garantia de visibilitat. Font: https://aa.usno.navy.mil/data/api.

El 20-09-2026: gibosa creixent, 65% a migdia local. La resposta original queda
desada amb URL i hora de consulta. Data/fus discrepants o camps absents no
es converteixen en lluna nova. Quatre proves de parser, DST i geometria, més
quatre casos de maquetació lunar afegits als 23 del pilot 02.

Reproducció: `node scripts/social-pilot/collect-lunar.mjs`,
`node --test scripts/social-pilot/lunar.test.mjs` i
`node scripts/social-pilot/render.mjs --lunar`.

Estudi ambiental complementari: `SOCIAL-EDITORIAL-STUDY-2026-09-20.md`.
No s'han incorporat ni activat encara dades ambientals en publicacions.

## Segona direcció visual — Pilot 02

El segon pilot conserva la mateixa instantània, les sis escenes, la música i els
30 segons, per permetre comparar el disseny sense canviar el temps explicat.
El vídeo anterior continua disponible; no s'ha substituït cap recurs de producció.

- Titulars condicionats per les dades: matí de sol, màxima de la tarda i descens
  al vespre només si els cinc valors horaris són presents i baixen almenys 2 °C.
- Corba tèrmica horària prevista amb la franja activa ressaltada i un cursor
  que recorre les hores reals. La predicció i la corba observada són escenes separades.
- Artwork vectorial més lluminós, jerarquia editorial i foses de 0,32 s entre
  escenes. Cap recompte animat que presenti valors meteorològics ficticis.
- Tendència de tres dies connectada per una línia temporal, sense repetir targetes.
- Text del mapa condicionat als quatre mostrejos: només declara zeros quan totes
  les dades són presents i exactament zero. Mai ho generalitza a tot el dia.
- Revisió amb el procediment de navegador: alternativa Playwright/Chromium perquè
  `agent-browser` no està instal·lat. Comprovació de col·lisions a totes les escenes
  i cap xarxa durant el render, incloses les proves sintètiques.

Reproducció amb les dades ja recollides: `node scripts/social-pilot/render.mjs --v2`.
Sortida separada: `build/social-pilot/v2/`. Amb `--stills` no es crea el vídeo.
Les proves cobreixen set estats meteorològics per tres franges i dos casos de
mapa absent: 23 casos sintètics. L'exportació comprova els 900 fotogrames,
incloent les dues capes de les transicions. Els casos sintètics no es publiquen.

## Objectiu i límits

Primer vídeo pilot del matí amb direcció gràfica nova, mantenint sis escenes,
30 segons, franges, observació, gràfica tèrmica, tendència i precipitació prevista.
És una peça de revisió, identificada com a PILOT. No s'ha publicat, desplegat,
connectat a cron ni incorporat als workflows. No es modifica el generador actual.
Cap seguiment automàtic, petició d'amistat o missatge social.

## Contingut i direcció visual

- 00–05 s: matí, 06–12 h.
- 05–10 s: tarda, 12–19 h.
- 10–15 s: vespre, 19–24 h.
- 15–20 s: observació datada i evolució real de temperatura.
- 20–25 s: tres dies següents, màxima/mínima i condició prevista.
- 25–30 s: mapa de precipitació amb quatre hores i invitació a seguir el projecte.

Logo genuí, Manrope per a jerarquia i DM Sans per a explicacions, verd profund,
marfil i accents meteorològics. Franges sense caixetes de dades repetides.
Icones vectorials amb moviment discret, transicions sense flaixos i línia tèrmica
que es revela. Les ones del fons són decoratives: no són vent ni dades.
La lluna és una icona convencional del vespre, no la fase lunar observada.
La música és la mateixa composició original del generador diari, sense veu.

## Fonts i criteri científic

Instantània pública recollida el 20-09-2026 a les 08:20 (Europe/Madrid).
Observació de les 08:19. La data, fonts i URLs de consulta queden a `data.json`.

- Franges calculades amb el mòdul compartit existent `forecast-dayparts.js`.
- Temperatura instantània [inici, final); probabilitat/ratxa de l'hora precedent
  (inici, final], inclosa la mitjanit següent.
- Màxim de probabilitats horàries, no probabilitat de tota la franja.
- Precipitació en mm acumulats durant l'hora anterior a l'etiqueta, no radar.
- Graella mostrejada d'AROME France HD a través d'Open-Meteo, límits comarcals ICGC.
  Es mostren punts, no un camp continu inventat. Els valors absents no són zero.
- Símbol meteorològic, no simulació física ni trajectòria real de núvols.
- Fonts: https://open-meteo.com/en/docs i l'API pública de Fontanillas.

## Com reproduir localment

Node 22, dependències del projecte, Chromium de Playwright i FFmpeg instal·lats.
No calen credencials ni permisos d'administrador del Worker.

```sh
node scripts/social-pilot/collect.mjs
VIDEO_MUSIC_OUTPUT=build/social-pilot/music.wav node scripts/youtube-music.mjs
node scripts/social-pilot/render.mjs --stills
node scripts/social-pilot/render.mjs
```

La recollida consulta APIs públiques i les fonts de Google Fonts. El render és
completament offline i bloqueja la xarxa. Les dades i els fitxers generats són a
`build/social-pilot/` (ignorat a Git). Reproduir la instantània ja recollida només
requereix el render; no tornar a consultar els proveïdors a cada fotograma.

## Validació i límits pendents

- Sis escenes inspeccionades; correcció d'un solapament hora/text al mapa.
- Mesura real del text en canvas, límits de seguretat i col·lisions entre textos.
- Sis proves sintètiques amb etiquetes llargues, altres fenòmens i valors absents;
  són QA local, no dades d'una publicació ni evidència de predicció real.
- Validació del text a cadascun dels 900 fotogrames de l'exportació.
- Comprovació FFprobe de durada, resolució, còdecs i àudio després del render.
- Encara cal l'aprovació visual de Marcel i provar els overlays de les apps reals.
- No es dona per validat el comportament editorial d'un dia real de tempestes
  només perquè una prova sintètica de maquetació hagi passat.
- No hi ha encara comparació de retenció/seguidors ni promesa de creixement.

## Fases següents, després de l'aprovació

1. Ajustar el pilot segons la revisió i validar una instantània real de temps
   inestable, sense manipular les dades ni buscar dramatisme fictici.
2. Adaptar el vespre i la imatge del migdia conservant els seus contractes.
3. PR d'integració amb proves, staging i aprovació explícita de desplegament;
   preservar deduplicació, recuperacions, horaris i recursos ja publicats.
4. Comparar retenció, comparticions, desats i seguidors atribuïts quan les APIs
   ho permetin. No substituir mètriques absents per estimacions inventades.
