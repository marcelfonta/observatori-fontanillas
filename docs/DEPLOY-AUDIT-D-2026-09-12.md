# Desplegament del paquet D · 12-09-2026

## Versió aprovada

- Petició humana: «Merge fet. Desplega i digam que queda».
- PR 140 integrada; commit `d077120b032ec5edb443d8ea2b696fc32e0308ec`.
- Worker de producció `22.29.8`, compilació `2026-09-12`.
- Identificador del desplegament: `27a7cf14-e097-4772-b427-9900a1289982`.
- Web pública amb revisió de service worker `audit-d`.
- Configuració de producció existent preservada amb `--keep-vars`: mateix cron, secrets i automatitzacions. Cap migració, reescriptura històrica, publicació forçada ni activació de pla de pagament.

## Validació prèvia

- Suite completa: 66 fitxers superats amb Node 22.23.2.
- Compilació de Worker en simulació correcta.
- Staging del mateix commit: [execució 34705495511](https://github.com/marcelfonta/observatori-fontanillas/actions/runs/34705495511), correcta.
- `/history` a staging retorna HTTP 200, intervals correctes i contracte esperat per 7, 30 i 365 dies. Staging té l’arxiu buit: aquesta comprovació **no és una prova de càrrega amb volum**.

## Porta de seguretat de consum

Analítica de Wrangler consultada abans de desplegar, sobre finestres mòbils de les últimes 24 hores, no un comptador exacte del dia UTC:

| Base | Files llegides | Files escrites |
| --- | ---: | ---: |
| fonta-meteo-history | 2.488.638 | 1.492 |
| punt-extraccio-db | 28.089 | 150 |
| fonta-meteo-staging | 48 | 0 |
| punt-extraccio-restore-2026-08-26 | 0 | 0 |

Total aproximat: 2.516.775 lectures. Les consultes d’informació de les bases no inspeccionen contingut personal de l’altre projecte.

Les consultes agregades horàries havien consumit 204.792 files en 72 execucions; les diàries, 728.873 en 65 execucions. Substituint aquests dos costos per una lectura conservadora de tot l’arxiu actual (12.075 files per execució), l’estimació és d’uns **3,24–3,25 milions de lectures per 24 h** amb el mateix trànsit i la resta de càrrega constant. No és una garantia: índexs, canvis de trànsit i creixement de l’arxiu poden alterar el resultat.

El marge observat permet el desplegament puntual. Continua sent prioritària la memòria cau compartida de l’històric i del resum d’arxiu, independent del refresc de cada client. No s’ha fet una prova de càrrega remota ni contractat més quota.

## Verificació posterior

- `/version`: HTTP 200, `22.29.8`, `env=production`.
- `/health`: HTTP 200, `healthy`, cap camp absent; 12.075 lectures emmagatzemades, 287 mostres de les últimes 24 h i 39,08 dies d’interval d’arxiu.
- `/history?days=7&resolution=hourly`: 163 observacions; 06–12 de setembre.
- `/history?days=30&resolution=hourly`: 697 observacions; 14 d’agost–12 de setembre.
- `/history?days=365&resolution=daily`: 40 observacions diàries disponibles des del 4 d’agost. No es presenten com un any complet de dades.
- Centre de Dades → Gràfiques comprovat al navegador en escriptori i a 390 px: dades visibles, cap error de consola i amplada de document igual a la de pantalla mòbil (390 px).
- La guia de navegador indicada no disposava de `agent-browser` instal·lat; s’ha utilitzat el navegador disponible, sense instal·lar eines.

## Pendent real de l’auditoria

1. Reduir lectures D1 amb memòria cau i mesurar el cost amb volum.
2. Completar cobertura intradiària, mitjanes ponderades, direcció circular del vent i consistència de dates locals antigues. Millorar també la llegibilitat dels eixos: Chart.js amplia automàticament el domini més enllà de les observacions; intensitat i acumulació de pluja necessiten unitats diferenciades.
3. Estendre les garanties de reserva i conciliació d’èxits incerts als fluxos de vídeo separats, amb verificació específica de cada proveïdor.
4. Revisar etiquetes, traduccions antigues i SEO.
5. Validar visualment la primera publicació real de canvi d’estació. El codi astronòmic ja està inclòs en la versió desplegada; la casella antiga de desplegament V22.29.5 del roadmap no significa que estigui absent.

Les observacions antigues no s’han recalculat: un zero desat no es pot convertir en absència sense evidència.
