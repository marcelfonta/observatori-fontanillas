# Security policy

## Reporting a vulnerability

Please do **not** open a public issue for vulnerabilities, exposed credentials, authentication bypasses, injection risks, data leaks or unsafe notification/publishing behaviour.

Use the project contact form at [meteo.fontanillas.cat](https://meteo.fontanillas.cat) and select a security-related subject, or contact the maintainer through the repository owner’s public GitHub profile. Include a clear reproduction, impact and any suggested mitigation. Do not include live secrets in your report.

We aim to acknowledge reports promptly, assess impact, coordinate a fix and disclose responsibly once users are protected. No response-time guarantee is made.

## Scope and safeguards

The main security boundaries are the Cloudflare Worker, D1, administrative endpoints, contact rate limiting, OneSignal integration and third-party publishing integrations. Production secrets must exist only in Cloudflare/GitHub secret stores; local secrets belong in ignored files. Public configuration values are not a substitute for credentials.

Contributors must not test against production in a way that sends alerts, publishes content, modifies data or disrupts availability without written maintainer approval.
