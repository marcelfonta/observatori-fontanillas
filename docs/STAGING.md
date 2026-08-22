# Entorn de proves Cloudflare

L'entorn de proves està separat de producció:

- Worker: `fonta-meteo-staging`
- URL: `https://fonta-meteo-staging.marcelfonta.workers.dev`
- D1: `fonta-meteo-staging`, jurisdicció UE
- Configuració: `ops/wrangler.staging.jsonc`
- Automatització social: desactivada
- Tasques programades: cap
- Secrets de producció: no copiats

## Verificació segura

1. Executar `npm run check`.
2. Executar `npm run staging:dry-run`.
3. Revisar el diff i obrir un PR.
4. Desplegar staging només després de proves verdes.
5. Comprovar `/version` i `/health`.

Sense `WU_API_KEY`, `/health` ha de retornar HTTP 503 amb `status: not_configured`; això és intencionat i evita confondre un entorn incomplet amb una avaria interna.

No afegir rutes personalitzades, crons ni secrets a staging sense una decisió explícita. Producció requereix sempre una aprovació humana separada.
