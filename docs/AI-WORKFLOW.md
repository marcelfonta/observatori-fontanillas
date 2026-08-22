# Flux local i híbrid d'IA

## Arquitectura recomanada

```text
Cris
  -> Codex/ChatGPT: criteri, arquitectura, revisió i tasques complexes
  -> Agent local: treball privat i ràpid dins d'una branca
       -> Ollama
            -> Qwen3 Coder 30B: principal, planificació i codi
            -> Devstral Small 2 24B: revisió independent i visió
  -> Git: memòria verificable i historial
       -> GitHub: issues, branques, PR i comprovacions
  -> Cloudflare
       -> previsualització/staging
       -> aprovació humana
       -> producció i rollback
```

El sistema és híbrid deliberadament. El model local redueix dependència i manté tasques privades al Mac; Codex/ChatGPT conserva el nivell de criteri per als punts on una resposta aparentment correcta podria degradar el projecte.

## Memòria del projecte

- `AGENTS.md`: instruccions operatives que qualsevol agent ha de seguir.
- `PROJECT.md`: missió, arquitectura i invariants del producte.
- `ROADMAP.md`: fites, estat i ordre de treball.
- `docs/DECISIONS.md`: decisions que no s'han de redescobrir.
- `docs/LOCAL-MODEL-MATRIX.md`: models instal·lats, proves i repartiment de funcions.
- `docs/STAGING.md`: recursos de proves i límits de seguretat.
- `CHANGELOG.md`: què ha canviat a cada versió.
- Issues i PR de GitHub: debat, acceptació i evidència de revisió.

Una conversa antiga es resumeix aquí abans de continuar. Les decisions importants no poden quedar només dins d'un xat.

## Flux d'una tasca

1. Actualitzar `main` i confirmar que el directori és net.
2. Crear una branca curta: `feature/nom`, `fix/nom`, `docs/nom` o `chore/nom`.
3. Escriure objectiu, exclusions i criteris d'acceptació a l'issue o al PR.
4. Donar a l'agent només els fitxers necessaris i demanar-li que respecti `AGENTS.md`.
5. Executar `npm run check` i revisar el diff complet.
6. Obrir PR. Per a canvis de Worker, autenticació, D1, avisos, publicació social o PWA, demanar una revisió reforçada.
7. Validar en previsualització/staging. Producció només amb aprovació humana.
8. Registrar decisió, changelog i rollback quan correspongui.

## Política de qualitat

Classificació del canvi:

- Baix risc: text, documentació, estil aïllat. Model local + proves dirigides.
- Risc mitjà: frontend, PWA, dades derivades. Model local o Codex + suite completa + revisió.
- Alt risc: Worker, secrets, autenticació, D1, avisos, publicació externa i desplegament. Codex/ChatGPT + proves + PR + staging + aprovació humana.

## Desplegament segur

- El repositori i la configuració versionada són la font de veritat.
- `.dev.vars` i `.env*` estan ignorats; els secrets remots es creen amb Cloudflare o GitHub.
- La configuració real de Wrangler es deriva de `ops/wrangler.example.jsonc` després d'obtenir els identificadors correctes.
- La primera ordre remota sempre és un `deploy --dry-run` o una previsualització.
- Producció no és una tasca automàtica de l'agent.
- Abans d'una migració D1: còpia de seguretat, SQL revisat, prova a staging i procediment de rollback.

## Models locals al Mac de 32 GB

Model principal recomanat: `qwen3-coder:30b`, quantització Q4_K_M d'uns 19 GB. És un model MoE de 30,5B paràmetres totals i 3,3B actius, pensat per tasques agentiques i repositoris. En aquest Mac de 32 GB s'ha d'iniciar amb un context moderat —no els 256K màxims— i mesurar pressió de memòria, velocitat i qualitat.

Segona opinió recomanada: `devstral-small-2`, aproximadament 15 GB. Està especialitzat en enginyeria de programari agentica, edició de diversos fitxers i també accepta imatges. Serveix per revisar plans i canvis de Qwen amb una família de model diferent.

No es recomana `qwen3-coder-next` en local en aquest equip: la quantització disponible ocupa aproximadament 52 GB i supera clarament els 32 GB de memòria unificada. El model més gran no és el millor si obliga el Mac a intercanviar memòria amb el disc.

Repartiment recomanat:

- `qwen3-coder:30b`: implementació, anàlisi del repositori i proves.
- `devstral-small-2`: revisió independent, canvis multifitxer i tasques amb captures.
- Codex/ChatGPT: arquitectura, decisions de risc alt, revisió final i coordinació amb serveis remots.

No descarreguis diversos models grans alhora: conserva espai i tria per evidència, no només pel nombre de paràmetres.

Proves d'acceptació del model local:

1. Explicar correctament l'arquitectura sense inventar fitxers.
2. Resoldre una correcció petita amb totes les proves verdes.
3. Detectar que els avisos oficials prevalen.
4. No exposar secrets ni proposar un desplegament directe.
5. Produir un diff més petit que un llindar acordat i explicar-lo.
