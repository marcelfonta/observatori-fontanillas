# Registre de decisions

## ADR-001 — Sistema híbrid, no substitució total

**Estat:** acceptada, 2026-08-22.

El model local s'utilitza per privacitat, velocitat i tasques acotades. Codex/ChatGPT continua intervenint en arquitectura, seguretat, migracions i revisió. Motiu: preservar qualitat és un problema de context, proves i governança, no només de mida del model.

## ADR-002 — Git és la memòria oficial

**Estat:** acceptada, 2026-08-22.

Les decisions duradores viuen al repositori i als PR. Els xats són context d'entrada, però no són la font de veritat.

## ADR-003 — `main` protegida i canvis via PR

**Estat:** acceptada, 2026-08-22.

Cada canvi es fa en una branca curta, supera comprovacions i es revisa abans de fusionar. Els canvis d'alt risc requereixen staging i aprovació humana explícita.

## ADR-004 — Producció separada del desenvolupament local

**Estat:** acceptada, 2026-08-22.

Wrangler s'instal·la al projecte i els entorns es declaren explícitament. No es versionen secrets ni identificadors provisionals. La configuració d'exemple no és desplegable fins que es completen els valors reals i es revisa contra la configuració existent de Cloudflare.

## ADR-005 — Llamafile queda com a opció secundària

**Estat:** acceptada, 2026-08-22.

Ollama és el servidor local principal perquè facilita gestionar models i integrar agents. Llamafile pot servir per proves portables d'un model concret, però no serà el centre del flux.

## ADR-006 — AROME HD per a l'evolució territorial de pluja a curt termini

**Estat:** acceptada, 2026-08-30.

Els vídeos del matí i del vespre utilitzen AROME France HD per representar quatre franges de precipitació sobre el nord-est de Catalunya. La resolució espacial no s'ha de presentar com una certesa local: la peça indica sempre que és una estimació orientativa del model. Si AROME falla, s'utilitza Open-Meteo Best Match i, si tampoc hi ha graella, una reserva exclusivament puntual per a Sant Celoni; mai no s'extrapola una dada puntual com si fos un mapa territorial.
