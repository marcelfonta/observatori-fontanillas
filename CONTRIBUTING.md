# Contributing to Observatori Fontanillas

Thank you for helping make local weather information more reliable and accessible. Small, focused contributions are easiest to review.

## Before opening an issue or pull request

- Search existing issues and documentation first.
- For substantial work, discuss the goal before coding.
- Do not report security issues publicly; follow [SECURITY.md](SECURITY.md).
- Do not add secrets, personal data, fabricated observations, unverified alerts or credentials to issues, commits or screenshots.

## Development workflow

1. Create a focused branch: `feature/…`, `fix/…`, `docs/…` or `chore/…`.
2. Read `AGENTS.md`, `PROJECT.md`, `docs/DECISIONS.md` and the relevant roadmap section.
3. Keep the Worker, public API, D1 schema and PWA contracts stable unless the change explicitly includes compatibility, migration and rollback.
4. Run `npm run check` before submitting.
5. Explain the user-facing effect, risks, tests run and any follow-up work in the pull request.

Do not deploy, migrate D1 or enable automations from a contribution. Those actions require explicit maintainer approval and staging validation.

## Project standards

- Official sources (Meteocat, AEMET, Protecció Civil and 112) prevail over portal summaries.
- Treat unavailable data as unavailable; never infer a measurement or warning.
- Keep the frontend’s remote access in `src/services/weather-api.js`.
- Keep credentials in platform secrets or local ignored files, never in `src/core/config.js` or version control.
- Prefer accessible semantic HTML, keyboard-operable interactions and reduced-motion-respecting UI.
- Update `CHANGELOG.md`, `ROADMAP.md` or `docs/DECISIONS.md` when the nature of the change warrants it.

## Review expectations

Changes involving authentication, D1, alerting, notifications, social publishing, the Worker, deployments or data contracts receive extra review. A model or author must not be the sole approver of its own change.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
