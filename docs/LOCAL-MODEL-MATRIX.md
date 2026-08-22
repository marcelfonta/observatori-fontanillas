# Models locals validats

Validació inicial: 22 d'agost de 2026, MacBook Pro M5 amb 32 GB de memòria unificada.

| Model | Mida local | Paper recomanat | Resultat inicial |
| --- | ---: | --- | --- |
| `qwen3-coder:30b` | 18 GB | Implementació i anàlisi principal | Resposta útil en uns 17 s; ràpid, però el pseudodiff va ser massa genèric. |
| `devstral-small-2` | 15 GB | Revisió independent, multifitxer i visió | Diagnòstic més desenvolupat, però més lent i amb una captura d'errors massa àmplia. |

La prova comuna va ser un cas real descobert a staging: `/health` retornava 500 quan faltava `WU_API_KEY`. Cap proposta es va aplicar automàticament. La solució final restringeix la captura a l'error de configuració conegut, retorna `not_configured` amb 503 i conserva els errors inesperats.

## Decisió

- Qwen és el model local principal per velocitat i qualitat general.
- Devstral és la segona opinió abans de canvis importants.
- Codex revisa la decisió final, les proves i qualsevol operació remota.
- No s'instal·la `qwen3-coder-next`: la versió local disponible ocupa aproximadament 52 GB i no és operativa amb 32 GB de memòria unificada.

La classificació és provisional. Cal repetir proves sobre correccions petites, refactors multifitxer i lectura de captures abans de canviar el model principal.
