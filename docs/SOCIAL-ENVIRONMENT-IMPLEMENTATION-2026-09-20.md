# Dades fiables i pilot ambiental — 20/09/2026

## Abast i estat

Paquet seqüencial: correcció de vigència al frontend, vídeos locals de matí i
vespre, imatge local del migdia, revisió del pol·len i proves. **No activa el
nou disseny als programadors ni publica res.** El Worker, D1, secrets, hores,
deduplicació i recuperacions no canvien. La integració del render nou a la
cadena de producció i el desplegament queden després de la revisió humana de
les peces. Les publicacions actuals continuen amb el format anterior.

## 1. Vigència

- UV de l'estació: lectura vàlida, hora real, menys de 30 minuts; no accepta
  `stale` ni `degraded`. No confon l'hora de consulta amb l'observació.
- Model actual: màxim 90 minuts des de l'hora de validesa. No és la data
  d'emissió del model. Tolerància de rellotge futur: cinc minuts.
- Les dates locals es resolen a Europe/Madrid, no al fus del navegador. Les
  dates impossibles i l'hora ambigua del canvi de tardor sense offset es rebutgen.
- La pàgina reavalua cada minut. Si el sensor caduca passa al model vigent;
  sense model vigent mostra absència. Consulta ambiental cada quinze minuts
  només amb la pàgina visible, amb una única petició en curs i timeout de 12 s.
- Hora pròpia al costat de l'UV. Memòria cau PWA renovada.

## 2. Edició ambiental local

- Es conserva el disseny aprovat, logo real, música original, sis escenes i
  **30 segons**, sense veu sintètica. Exports 1080×1920, 30 fps, H.264/AAC.
- Matí: avui. Vespre: demà amb data explícita, fase lunar de demà a les 12 h
  locals (USNO), i observació de l'estació separada i amb la seva pròpia data.
- El migdia és 1080×1350: lectura real datada, evolució observada, tarda només
  de 14–19 h, vespre de 19–24 h i com a màxim dos indicadors ambientals.
  La mostra s'ha preparat al matí: la lectura indica l'hora real, no simula 14 h.
- UV: CAMS global (~45 km). Aire: CAMS europeu ENSEMBLE (~11 km). Peticions
  separades: `cams_europe` retorna UV absent en la prova real; no es transforma
  en zero ni en màxim del dia. Atribució visible a CAMS i Open-Meteo.
- S'exigeixen totes les mostres de la finestra i no s'accepten duplicats.
  Valors absents, negatius, booleans, hores inexistents o consulta de més de
  90 minuts no són candidats. L'hora de consulta queda desada, sense inventar
  una hora d'emissió. Les instantànies locals es reprodueixen amb el seu rellotge
  original: no s'han d'usar per publicar dies després.
- Revisió 05, a petició de Marcel: **l'última escena sempre és el mapa de
  pluja**, també en dies secs. Substitueix la selecció adaptativa UV/aire de
  la revisió 04. Si no hi ha mapa, mostra absència, no una previsió seca.
  Els zeros del mapa només descriuen els punts i les quatre hores seleccionades.
- L'UV queda com a nota secundària a l'escena de tarda: màxim horari previst
  del dia, hora i font CAMS via Open-Meteo. Només amb cobertura completa,
  consulta vigent i data coincident amb l'edició. Zero real visible; dada absent
  omesa. No ocupa una escena ni allarga el vídeo. Al migdia també es redueix
  la mida i el contrast de l'UV, conservant l'aire i la pluja per franges.
- No s'infereix absència d'avisos a partir del mapa ni d'un endpoint d'avui
  per parlar de demà. El render recalcula les dues edicions, incloses
  instantànies antigues que tenien una selecció UV desada.
- `environment.json` conserva respostes originals, dates, cobertura, motiu de
  selecció i text coherent amb la peça. Dades i imatges no van al repositori.

## 3. Pol·len: revisió tancada, incorporació no activada

Les cinc espècies consultades actualment no representen tots els al·lèrgens
locals. La web ho explicita: falten xiprer, plàtan, parietària i espores. Els
llindars existents continuen sent orientatius; **no s'han verificat com a escala
clínica oficial i no s'utilitzen al pilot social**. No es publica un nivell
general de pol·len baix a partir d'aquest subconjunt.

La XAC/PIA ofereix previsió setmanal per estació (API XML), no un sensor horari
de Sant Celoni. L'API no enumera Sant Celoni com a estació. Cal acordar quina
referència territorial mostrar, respectar inici/final de setmana i conservar
els nivells del proveïdor, sense convertir-los a una suposada dosi local.

Les condicions de PIA indiquen CC BY-NC-SA 4.0 per a la previsió, atribució i
avís als autors de l'ús. La reutilització comercial requereix acord addicional.
No s'ha enviat cap correu, acceptat cap acord ni incorporat una nova font al
programador. Abans d'automatitzar-ho, confirmar ús comercial/no comercial,
atribució/llicència i estació de referència. Proposta de missatge, no enviada:

> Som Meteo Fontanillas, un projecte meteorològic local de Sant Celoni. Voldríem
> incorporar una síntesi de la vostra previsió setmanal de pòl·lens i espores a
> la web i a les xarxes, sempre amb autoria, vigència i estació de referència.
> Ens podeu orientar sobre la referència territorial més adequada i les
> condicions de reutilització, inclosa una possible col·laboració futura?

Fonts revisades el 20/09/2026:

- [Open-Meteo: variables, índex, dominis i atribució](https://open-meteo.com/en/docs/air-quality-api).
- [OMS: protecció solar a partir d'UV 3](https://www.who.int/news-room/fact-sheets/detail/ultraviolet-radiation).
- [USNO: dades astronòmiques](https://aa.usno.navy.mil/data/api).
- [XAC/PIA: API de previsió](https://aerobiologia.cat/pia/en/api).
- [XAC/PIA: condicions d'ús](https://aerobiologia.cat/pia/en/terms).

## 4. Reproducció i control

Node 22, dependències del repositori, Chromium de Playwright i ffmpeg. Només
les ordres `collect*` consulten fonts públiques. El navegador de render té tota
la xarxa bloquejada. No hi ha cap ordre de pujada o publicació.

```sh
node scripts/social-pilot/collect.mjs build/social-pilot-environment --environment
node scripts/social-pilot/collect-lunar.mjs build/social-pilot-environment
node scripts/social-pilot/collect-lunar.mjs build/social-pilot-environment --evening
VIDEO_MUSIC_OUTPUT=build/social-pilot-environment/music.wav node scripts/youtube-music.mjs
node scripts/social-pilot/render.mjs --environment
node scripts/social-pilot/render.mjs --environment --evening
npm run check
npm run test:browser
```

`--stills` evita l'export MP4 però fa la validació estàtica. Cada render complet
comprova 900 fotogrames, límits de seguretat i solapaments de text. S'afegeixen
casos sintètics de mal temps, números absents, mapa absent, quatre fases lunars,
valors ambientals extrems i imatge amb dades incompletes. No són dades editorials.

La verificació visual és Chromium, no una prova física de Safari/iPhone. La
maquetació del navegador s'ha comprovat a 360, 390 i 1280 px. Cal revisió humana
del ritme, llegibilitat i estil abans d'adoptar el format.

Resultat local: `npm run check` — 77 fitxers superats; `npm run test:browser` —
18 proves superades a la revisió 04 del frontend (sense canvis de web a la 05).
Vídeo de matí revisió 05: 900 fotogrames i 44 casos de maquetació;
vespre: 900 fotogrames i 42 casos. Tots dos 30,000 s, 1080×1920, H.264/AAC,
sense errors de pàgina ni de text detectats. Revisió visual de les peces feta;
no equival a una validació editorial en un dia real de temps sever.

Exports 05: `build/social-pilot-environment/v5-rain-priority/` i `v5-evening/`.
La comparació de disseny reutilitza la instantània del 20/09 a les 09:40 locals;
no és una nova consulta en directe ni material llest per publicar dies després.

Rollback frontend: revertir el commit i renovar la memòria cau. Els pilots
estan aïllats dels programadors: eliminar-ne la integració futura no ha de
republicar ni esborrar registres de lliurament.
