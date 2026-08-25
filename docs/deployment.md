# Deployment

## Topology

Cloudflare Pages serves the static site. The Cloudflare Worker supplies the API and scheduled processing; D1 stores historical and operational data. The public frontend configuration currently points to the Worker URL in `src/core/config.js`.

## Safe deployment process

1. Run `npm run check` and review the complete diff.
2. Validate the static site in a preview environment.
3. For Worker work, create an independent staging Worker and D1 database.
4. Compare a reviewed staging configuration with `ops/wrangler.example.jsonc`; keep actual IDs and secrets out of Git.
5. Run `npm run worker:dry-run` only after providing a reviewed Wrangler configuration.
6. Apply and test schema changes in staging with a rollback plan.
7. Obtain explicit human approval before production.

The repository deliberately does not include a canonical production `wrangler.jsonc`. Existing deployment inventory and outstanding risks are documented in [CLOUDFLARE-INVENTORY.md](CLOUDFLARE-INVENTORY.md). Do not use the production D1 database for write tests.

## Secrets

Use Cloudflare or GitHub secret stores for credentials, including Weather Underground, administrative, OneSignal, email and social/OAuth credentials. Never add a secret to frontend code, commit history, screenshots or issue text.

`ONESIGNAL_API_KEY` is a Worker secret and must contain the App API key belonging to the same OneSignal app as the public `ONESIGNAL_APP_ID`. Verify it with a real test after deployment; a browser permission by itself does not prove that delivery works.

## D1 operating policy

Scheduled captures are the normal writer to D1. Do not enable `PERSIST_ON_REQUEST` in production unless investigating a specific incident, and disable it afterwards. Check D1 daily row reads and writes after a release that changes a public endpoint.
