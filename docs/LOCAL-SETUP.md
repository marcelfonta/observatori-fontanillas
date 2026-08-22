# Preparació del Mac

## Estat comprovat el 22 d'agost de 2026

- macOS 26.5.2, Apple M5 de 10 nuclis i 32 GB de memòria.
- Git 2.50.1 i Homebrew 6.0.15 instal·lats.
- El shell del sistema exposa Node 26.0.0, mentre que l'entorn gestionat de pnpm executa Node 24.19.0; pnpm és 11.19.0.
- Ollama 0.32.15 està actiu com a servei i `qwen3-coder:30b` està descarregat i provat. GitHub CLI 2.98.0 està instal·lat; falta autenticar GitHub.
- Wrangler s'ha de mantenir com a dependència del projecte, no global.
- El CI actual utilitza Node 22. Cal provar sempre amb Node 22 abans de convertir comprovacions en obligatòries; Node 24 és compatible amb les eines locals, però Node 26 queda fora del rang validat.

## Instal·lacions previstes

```bash
brew install ollama gh node@22
pnpm install
```

Hi ha aproximadament 487 GB lliures. El model principal escollit ocupa uns 19 GB; el fallback, uns 9 GB. Després d'iniciar Ollama:

```bash
ollama serve
ollama pull qwen3-coder:30b
ollama run qwen3-coder:30b
```

Fallback: `ollama pull qwen2.5-coder:14b`. Els noms i mides disponibles canvien; cal tornar a consultar el catàleg d'Ollama abans d'una actualització.

## GitHub

```bash
gh auth login
gh auth status
```

GitHub CLI està autenticat com `marcelfonta`. El repositori és públic i `main` encara no té protecció. Configura PR obligatoris i comprovacions requerides després que el workflow de qualitat s'hagi executat almenys una vegada. No posis tokens dins del repositori.

La comprovació `Qualitat del projecte / Proves Node 22` s'executa a cada PR i push a `main`. La protecció de branca s'activa quan aquest workflow existeix al repositori remot i ha completat almenys una execució.

## Cloudflare

Wrangler està autenticat amb OAuth. L'inventari verificat és a `docs/CLOUDFLARE-INVENTORY.md`.

1. Copia `ops/wrangler.example.jsonc` a `wrangler.jsonc` només quan tinguis el nom real del Worker, D1 i crons actuals.
2. Compara la plantilla amb la configuració de producció existent.
3. Crea secrets per entorn; no els posis a `vars`.
4. Genera tipus i executa una compilació en sec.
5. Prova primer a staging.

No despleguis des d'aquesta base fins completar aquest inventari.

Wrangler 4.125.0 és una dependència local. `pnpm-workspace.yaml` aprova explícitament només els scripts de compilació necessaris d'`esbuild` i `workerd`.
