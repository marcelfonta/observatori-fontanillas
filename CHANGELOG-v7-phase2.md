# V7 · Fase 2

- Centre d’alertes ampliat amb historial real via D1.
- Preferències Push: pluja, vent, tempestes/llamps, neu i temperatura.
- Integració OneSignal preparada amb etiquetes per categories.
- Worker preparat per comprovar avisos en cron i enviar només episodis nous.
- Sense missatges tècnics visibles si OneSignal no està configurat.
- Compartir unificat a index i metodologia.
- Eliminat el link Contacte dels peus de pàgina.
- Versió visual actualitzada a V7 · Fase 2.

## Variables del Worker per activar push real
- `ONESIGNAL_APP_ID`
- `ONESIGNAL_REST_API_KEY` (secret)

Cal mantenir un Cron Trigger (p. ex. cada 10 minuts).
