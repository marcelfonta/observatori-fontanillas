# Integració social 05 — 20 de setembre de 2026

## Abast i estat

Format visual aprovat integrat al circuit de vídeo i a les imatges diàries.
No canvia cap horari, credencial, deduplicació, reserva, recuperació ni esquema D1.
No s'han enviat publicacions de prova. Producció requereix revisió humana, merge
i desplegament; comprovar els primers lliuraments reals continua pendent.
El pol·len queda explícitament fora d'aquest paquet.

## Vídeo

- `scripts/social-production.mjs` recull un snapshot nou en cada execució:
  observació Fontanillas, previsió horària Open-Meteo, tendència observada,
  pluja AROME HD amb reserves Best Match/puntual, UV CAMS global i fase USNO.
- Rebutja snapshots pilot, data canviada, observació absent/desfasada i franges
  incompletes. Comprova la frescor també després del render.
- `scripts/social-pilot/render.mjs --production` reutilitza el disseny aprovat,
  però no les dades ni els fitxers congelats del pilot. 30 s, 900 fotogrames,
  1080×1920, sis escenes, logo real, música original i sense veu.
- Matí/tarda/vespre del dia objectiu, observació datada, tres dies següents,
  mapa de pluja sempre al final. Vespre: previsió de demà, observació d'avui.
- UV secundari a la tarda. Fase lunar del dia objectiu, referència 12 h locals,
  no predicció de visibilitat. Errors ambientals/USNO no bloquegen la previsió.
- Pluja absent no es transforma en zero. Una reserva puntual no es dibuixa
  com si fos un mapa regional.
- El workflow existent conserva l'upload compartit i la coordinació atòmica.
  És el vídeo consumit pels canals de vídeo existents, no un nou publicador.

## Imatges

- Worker **22.29.20** desa `socialFormat: cinematic-v5` als nous esborranys
  diaris i els renderitza amb `worker/social-daily-v5.js`.
- Matí: tres franges d'avui. Migdia: tarda recalculada des de les 14 h i vespre.
  Vespre: tres franges de demà. Lectura real i tendència separades de previsió.
- Pluja prominent; UV discret i qualitat de l'aire amb índex europeu,
  període i models separats. No es presenta CAMS com a sensor local.
- Les dues peticions ambientals són paral·leles, amb timeout de 12 s i
  fallada degradada explícita. No hi ha noves consultes d'històric complet.
- Els esborranys antics conserven el renderer anterior i les imatges
  materialitzades en R2 no es reescriuen.
- Browser Rendering espera inactivitat de xarxa abans de capturar el logo.

## Validació i límits

- 78 fitxers de proves Node; 24 proves de navegador, incloses sis noves de
  targetes (tres edicions amb contingut normal i dades absents/textos llargs).
- Dos vídeos complets generats localment amb dades públiques actuals, 900
  fotogrames validats cadascun, 30 s amb pistes H.264/AAC, logo i mapa revisats.
- Staging desplegat sense crons ni automatització social; smoke de salut,
  avisos i històric. Salut `degraded` esperada: no té font d'estació configurada.
- Prova remota addicional disponible a `Qualitat del projecte`:
  `workflow_dispatch` amb `social_preview=true`, matriu matí/vespre,
  mateix render i imatges, només artefactes de GitHub, sense secrets socials
  ni uploads a YouTube/R2. No és una publicació.
- Les captures deterministes i els renders locals no demostren un lliurament
  real a cap xarxa. Tampoc validen OAuth ni l'acceptació externa del fitxer.

Evidència remota: [renders matí/vespre i imatges](https://github.com/marcelfonta/observatori-fontanillas/actions/runs/35500018164)
i [desplegament/validació staging](https://github.com/marcelfonta/observatori-fontanillas/actions/runs/35500019494),
completats correctament. La revisió visual posterior afegeix marge entre
valors i separadors, prova d'aquest marge i titular del vespre que distingeix
«Ara» de «la previsió de demà»; no modifica el render de vídeo validat.

## Activació i comprovació pendent

1. Revisió humana i merge del PR. El workflow nou entra a `main`; desplegar
   Worker 22.29.20 perquè les imatges també adoptin el format.
2. Mantenir 06:45, 14:00 i 20:30, Europe/Madrid. No recuperar franges d'avui
   ja publicades ni regenerar uploads compartits que ja existeixen.
3. En la primera franja nova de cada edició comprovar el workflow, el vídeo
   compartit, cada canal configurat i els identificadors/URLs reals.
   Diferenciar `scheduled`, `processing` i `published`; no marcar èxit només
   perquè una tasca hagi arrencat. Reintentar només canals fallits.
4. Només després tancar la verificació operativa i abordar el pol·len.

## Rollback

- GitHub repository variable `SOCIAL_VIDEO_FORMAT=legacy`: següents vídeos
  amb el renderer anterior. Valor absent o `cinematic-v5`: format nou.
- Worker variable `SOCIAL_CARD_FORMAT=legacy`: nous esborranys amb format
  anterior. Els ja creats continuen amb el seu marcador, per no reescriure
  imatges publicades. Per restaurar els renderer antics completament,
  desplegar el commit de producció previ, sense tocar les files de lliurament.
- No eliminar reserves, claus de deduplicació ni fitxers ja publicats.
