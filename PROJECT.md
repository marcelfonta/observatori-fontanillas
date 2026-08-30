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
- El resum d’ús de D1 es conserva cinc minuts a memòria del Worker i una observació repetida no sobreescriu una fila existent.

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

## Estat V22.26.0

- Branca de treball: `feature/mapa-avisos-meteocat`.
- Versio codi: V22.26.0.
- Produccio queda pendent d’integrar la PR i desplegar la V22.26.0.
- Les publicacions d'avisos són exclusives de Meteocat i incorporen el mapa comarcal complet de Catalunya, amb el Vallès Oriental remarcat i un text prudent per a Sant Celoni.
- `xarxes.html` reuneix els nou perfils oficials en una destinació única i clicable; la creativitat vertical associada es pot publicar a qualsevol xarxa.
- Els Shorts i Reels utilitzen la predicció real per escollir icona, color, titular, dades destacades i consell pràctic; la pantalla d’observació no mostra cap símbol de previsió.
- Els vídeos incorporen moviment subtil i transicions, i els textos de Meta, TikTok i X resumeixen el fenomen i les temperatures de la franja corresponent.
- La targeta del migdia mostra una icona pròpia de la predicció d’avui.
- Configuració de producció prevista: `SOCIAL_AUTO_TIMES=07:00,14:00,20:30` i `SOCIAL_PREFLIGHT_TIME=06:45,13:45,20:15`.
- Accio externa pendent per avisos socials: rebre la clau sol·licitada a Meteocat i desar-la com a secret `METEOCAT_API_KEY` a Cloudflare abans d'activar l'automatització.
