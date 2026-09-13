# Observatori Meteorologic Fontanillas

## Missio

Portal meteorologic local de Sant Celoni i el Baix Montseny amb dades reals, avisos oficials, prediccio entenedora, historial, comparatives, publicacions socials i PWA. La prioritat del projecte es:

1. Fiabilitat.
2. Simplicitat.
3. Mantenibilitat.
4. Eficiencia de context i credits.
5. Noves funcionalitats.

## Principis no negociables

- No inventar observacions, sensors, avisos ni fonts.
- Separar sempre observacio real, prediccio, avisos oficials i interpretacio.
- Meteocat, AEMET, Proteccio Civil i el 112 prevalen sobre qualsevol resum automatitzat.
- Cada canvi ha de deixar una versio funcional recuperable.
- Cap secret en codi, docs, logs, captures o prompts.
- Cap desplegament, migracio D1 o publicacio externa sense confirmacio humana explicita.

## Arquitectura actual

- Frontend estatic: `index.html`, pagines especialitzades, `css/`, `src/core/`, `src/services/`, `src/modules/` i `src/features/`.
- Worker Cloudflare: `worker/index.js` concentra APIs, programadors, D1, avisos push, socials, IA i targetes socials.
- D1: historic meteorologic, avisos, prediccions, social drafts/publications, estat operatiu i control antiabus.
- PWA: `manifest.json`, `service-worker.js`, icones i instal.lacio al mobil.
- Administracio: `administracio.html` i `src/features/admin.js`, sempre darrere `ADMIN_TOKEN`.
- Automatitzacions externes: GitHub Actions per YouTube Shorts; Cloudflare scheduled events per avisos, prediccions, manteniment i socials.

## Fluxos sensibles

### Avisos push

- El navegador pot tenir permis i subscripcio activa, pero l'enviament real depen de la clau server-side de OneSignal.
- Secret preferit: `ONESIGNAL_API_KEY`.
- Alias temporal compatible: `ONESIGNAL_REST_API_KEY`.
- Un error `Access denied` a la prova real indica clau absent, incorrecta o d'una app de OneSignal diferent.

### Publicacions socials

- La cua social es registra a D1 i cada canal publica de manera independent.
- Facebook, Instagram i Threads necessiten una targeta social publica generada pel Worker.
- `PUBLIC_WORKER_URL` ha d'apuntar al Worker public real i tenir la mateixa versio que el codi desplegat.
- Si produccio va per darrere del repositori, la publicacio pot fallar amb targeta no preparada. Des de V22.13 el codi ho detecta amb un missatge explicit de versio.
- Si es demana un canal sense credencials, es registra com a error explicit i reintentable; no es considera una publicacio feta ni es descarta silenciosament.
- TikTok queda diferenciat entre compte connectat i direct post aprovat per la plataforma.
- X publica mitjançant el canal connectat a Buffer: vídeo a les 07:00, targeta a les 14:00 i vídeo a les 20:30, amb estat remot, deduplicació i reintents al Worker.
- YouTube Shorts va per GitHub Actions, no pel mateix boto de publicacio social.

### D1 i limits

- Cloudflare D1 te limits diaris al pla gratuit; cal evitar neteges per peticio i consultes sense index.
- Les taules de rate limit tenen indexos compostos i neteja programada diaria.
- `monitor_state` guarda ultims estats operatius per evitar reprocessaments i facilitar diagnosi.
- Les captures programades de cinc minuts son l’escriptor normal d’observacions. En produccio, `PERSIST_ON_REQUEST` ha de romandre desactivat.
- El resum d’ús i les respostes públiques de l’històric es conserven cinc minuts amb claus canòniques que ignoren marcadors de refresc; una observació repetida no sobreescriu una fila existent.

## Ordres de comprovacio

- Rapida abans de continuar: `npm run test:quick`
- Completa abans de PR: `npm run check`
- Worker local quan pertoqui: `npm run worker:dry-run`

## Documentacio clau

- `AGENTS.md`: normes obligatories per agents.
- `docs/AGENT-START.md`: lectura rapida per continuar sense rellegir converses.
- `docs/RELEASE-CHECKLIST.md`: checklist minim abans de lliurar.
- `docs/PROJECT-AUDIT-2026-08-25.md`: auditoria tecnica i decisions de simplificacio.
- `docs/AI-WORKFLOW.md`: com treballar amb models i revisions.
- `docs/DECISIONS.md`: decisions arquitectoniques.
- `ROADMAP.md`: estat viu de properes fites.
- `CHANGELOG.md`: historial detallat de versions.

## Estat V22.31.5 / Worker 22.29.14

- Branca de treball: `fix/youtube-queue-resilience`.
- Versions desplegades: web V22.31.5 i Worker V22.29.14.
- La cua de vídeo tolera fins a 90 minuts de retard sense publicar abans d’hora ni repetir el disparador cada deu minuts. TikTok i X continuen encara que un dels dos canals falli.
- El Short del matí del 13-09-2026 s’ha recuperat manualment i YouTube l’ha confirmat com a públic amb l’identificador `eg4HRkShnJY`. TikTok i X han quedat enviats, i els Reels i Stories d’Instagram i Facebook s’han recuperat reutilitzant els identificadors remots, sense duplicats.
- El Worker redundant d’actius estàtics `observatori-fontanillas` s’ha eliminat del tauler; Pages `observatori-fontanillas` i el Worker productiu `fonta-meteo` continuen actius.
- El nom accessible de la webcam inclou literalment el text visible i la càrrega normal d’una subscripció push ja no reenvia etiquetes redundants a OneSignal. Els canvis explícits de preferències continuen sincronitzant tant OneSignal com el registre propi D1.
- El diagnòstic OAuth de YouTube ha superat l’execució 34716271807 sense preparar ni publicar cap vídeo.
- El diagnòstic remot 34716813993 confirma la connexió de Buffer/TikTok i el permís del disparador Cloudflare → GitHub, també sense crear esborranys ni iniciar vídeos.
- Les tres franges automàtiques d’X del 12-09-2026 consten enviades al primer intent (07:00, 14:06 i 20:30, hora local), amb estat remot `sent` i enllaç de publicació; la seqüència diària completa queda validada sense intervenció manual.
- Una traça mòbil real en producció mesura LCP 408 ms i CLS 0,00. El paquet elimina la descàrrega duplicada de la webcam, agrupa les càrregues inicials concurrents i corregeix els defectes d’accessibilitat detectats per Lighthouse.
- El diagnòstic manual de YouTube comprova el client, el secret i el refresh token mitjançant l’intercanvi OAuth, però s’atura abans de generar o llegir cap fitxer de vídeo. No té programació automàtica.
- El Worker 22.29.14 s’ha validat a staging i s’ha desplegat a producció amb autorització humana el 13-09-2026, sense migracions ni secrets nous.
- Les mitjanes de l’arxiu ponderen cada agregat pel nombre de lectures, la cobertura intradiària és visible i la direcció del vent utilitza estadística circular.
- Les hores històriques es deriven de l’epoch amb `Europe/Madrid` i s’agrupen per temps UTC transcorregut, sense migrar ni reescriure D1.
- El selector ofereix català, castellà, anglès i francès. Una prova automàtica impedeix publicar un catàleg amb frases registrades sense traducció.
- `colaboracions.html` explica què ofereix i què demana el projecte, declara que no hi ha patrocinis actius i preserva la independència editorial.
- Els dossiers en castellà i anglès i sis correus adaptats permeten proposar material cedit o en préstec sense inventar audiències ni prometre opinions positives.
- La contrapartida social preveu una presentació inicial, actualitzacions periòdiques pactades i una peça final a Instagram, Facebook, TikTok, YouTube i X, sempre amb identificació visible del patrocini o cessió.
- La capçalera reutilitza el geocodificador d’«El temps arreu» i envia la localitat escollida amb coordenades perquè la previsió s’obri ja carregada.
- La preferència d’idioma es desa només al navegador i les traduccions pròpies eviten enviar el contingut a tercers.
- El Worker prepara resums setmanals, mensuals, estacionals i anuals amb cobertura mínima, context de predicció i targetes socials pròpies.
- Els episodis destacats de l’estació, els extrems de l’arxiu local, la sequera de l’ACA, la pols modelitzada per CAMS i les efemèrides disposen de deduplicació, límits i interruptors independents.
- Les publicacions d'avisos són exclusives de Meteocat i incorporen el mapa comarcal complet de Catalunya, amb el Vallès Oriental remarcat i un text prudent per a Sant Celoni.
- `xarxes.html` reuneix els nou perfils oficials en una destinació única i clicable; la creativitat vertical associada es pot publicar a qualsevol xarxa.
- Els Shorts i Reels utilitzen la predicció real per escollir icona, color, titular, dades destacades i consell pràctic; la pantalla d’observació no mostra cap símbol de previsió.
- Els vídeos incorporen una sisena escena animada d'evolució territorial de la pluja amb AROME France HD, Open-Meteo Best Match com a alternativa i reserva puntual segura per a Sant Celoni.
- Els vídeos duren 30 segons, incorporen moviment subtil i transicions, i els textos de Meta, TikTok i X resumeixen el fenomen i les temperatures de la franja corresponent.
- La targeta del migdia mostra una icona pròpia de la predicció d’avui.
- Configuració de producció prevista: `SOCIAL_AUTO_TIMES=07:00,14:00,20:30` i `SOCIAL_PREFLIGHT_TIME=06:45,13:45,20:15`.
- Els avisos socials de Meteocat tenen un pressupost persistent de tres consultes al dia —màxim 93 al mes— per respectar el pla de 100 consultes de predicció. La primera activació real queda pendent del desplegament conjunt del codi i el secret `METEOCAT_API_KEY`.
