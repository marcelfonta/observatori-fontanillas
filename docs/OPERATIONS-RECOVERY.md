# Recuperació operativa

## Abans de producció

1. Executa la validació de staging a GitHub Actions o `npm run test:staging`.
2. Si falla, no es proposa cap desplegament a producció.
3. Revisa el Worker i la D1 de proves; no reutilitzis credencials ni dades de producció.

## Si staging falla

- Consulta la resposta de `/version`, `/health`, `/alert-history?limit=1` i `/alerts?fresh=0`.
- Si `/health` diu `degraded` amb `weather_source_not_configured`, és l'estat previst quan staging no té una font d'observacions pròpia.
- Qualsevol altre error s'ha de corregir i validar de nou abans de continuar.

## Si falla una prova d'avisos

- Comprova al panell que el navegador té permís, subscripció i connexió remota identificada.
- La prova només es considera correcta quan el navegador rep la notificació i la capseta confirma l'èxit.
- No repeteixis l'enviament per un recompte inicial de destinataris: OneSignal confirma l'acceptació amb l'identificador de missatge.

## Configuració inicial del desplegament de staging

Al repositori de GitHub, crea l'entorn `staging`, afegeix la variable `CLOUDFLARE_ACCOUNT_ID`, la variable `STAGING_D1_DATABASE_ID` i el secret `CLOUDFLARE_API_TOKEN` amb permisos només per desplegar Workers. Després, executa «Desplegament controlat a staging». El flux no conté cap pas de producció.
