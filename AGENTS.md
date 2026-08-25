# Guia dels agents del projecte

## Objectiu

Continuar l'Observatori Meteorològic Fontanillas sense perdre qualitat, traçabilitat ni seguretat. La font de veritat és aquest repositori i la documentació que conté; una conversa o la memòria d'un model mai no substitueixen el codi, les proves ni les decisions registrades.

## Abans de canviar res

1. Llegeix `docs/AGENT-START.md`, `PROJECT.md`, `docs/AI-WORKFLOW.md`, `docs/DECISIONS.md` i la part rellevant de `ROADMAP.md`.
2. Comprova `git status` i no sobreescriguis canvis aliens.
3. Treballa en una branca `feature/`, `fix/`, `docs/` o `chore/`; no facis canvis directes a `main`.
4. Defineix una fita petita, els criteris d'acceptació i les proves afectades.

## Regles no negociables

- No inventis dades meteorològiques, sensors, estats d'avisos ni fonts.
- Meteocat, AEMET, Protecció Civil i el 112 prevalen sobre qualsevol resum o recomanació.
- No posis secrets en fitxers, commits, logs, captures ni prompts. Usa `.dev.vars` només en local i secrets de Cloudflare/GitHub en remot.
- No publiquis, despleguis, migris D1 ni activis automatitzacions sense confirmació humana explícita.
- Mantén separats desenvolupament local, previsualització/staging i producció.
- No canviïs contractes del Worker, D1, PWA o API sense migració, compatibilitat i rollback documentats.
- Cada promesa del Worker s'ha d'esperar, retornar o passar a `ctx.waitUntil()`.
- No desis estat específic d'una petició en variables globals del Worker.

## Definició de fet

- Canvi focalitzat i revisable.
- Proves rellevants superades; si alguna no es pot executar, queda explicat al PR.
- `CHANGELOG.md`, `ROADMAP.md` o `docs/DECISIONS.md` actualitzats quan pertoqui.
- Sense secrets ni artefactes locals al diff.
- `npm run test:quick` superat durant el desenvolupament i `npm run check` superat abans del PR. Quan existeixi una configuració Wrangler real i revisada, afegeix també `npm run worker:dry-run`.
- `docs/RELEASE-CHECKLIST.md` revisat abans de demanar merge.
- Qualsevol desplegament passa primer per previsualització o staging i requereix aprovació humana per producció.

## Ús de models

- Model local: exploració, resums, documentació, canvis repetitius i primer esborrany de codi.
- Codex/ChatGPT: arquitectura, canvis sensibles, revisió, seguretat, migracions i control de qualitat.
- Cap model pot aprovar el seu propi canvi: el resultat final necessita proves i revisió humana.
