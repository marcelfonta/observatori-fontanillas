# Development

## Requirements

- Node `>=22 <25`
- pnpm (the repository declares `pnpm@11.19.0`)
- Python 3 for the static local server

```bash
pnpm install
pnpm serve
npm run check
```

`pnpm serve` starts `python3 -m http.server 8080`. Visit `http://localhost:8080`; ES modules do not work reliably through `file://`.

## Tests

`npm run check` runs the repository’s Node test suite, covering smoke paths, administration, alert history, data centre, long-range forecast, Meteo IA, sharing and versioned regressions. Run the full suite before a pull request; targeted test files can be used while iterating.

## Working safely

Read `AGENTS.md` and `PROJECT.md` before changing code. Do not put secrets in the repository. `ops/wrangler.example.jsonc` is an intentionally non-deployable template; do not turn it into production configuration or infer production identifiers from it.

Worker changes, D1, alerts, push, social publishing and OAuth are high-risk changes. They require review, staging validation and explicit approval before production.
