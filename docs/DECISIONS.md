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
# ADR — Automatització editorial de baixa freqüència i episodis locals (2026-08-31)

- Les noves publicacions no s’activen amb el desplegament: cada família té un interruptor explícit i es valida gradualment.
- Un resum només es crea amb prou cobertura; un extrem de l’arxiu local necessita almenys 90 dies i no es presenta com a rècord climàtic oficial.
- Els avisos oficials continuen sent exclusivament els de Meteocat. Les lectures destacades de l’estació, la pols CAMS i la tendència estacional es descriuen com observació o model, mai com a avís.
- Les dades externes escollides són l’ACA per a sequera, CAMS Europe per a pols i ECMWF Seasonal per a tendència estacional. Cada targeta explicita la font, escala i limitació principal.
- La pols queda bloquejada mentre `SOCIAL_DUST_THRESHOLD_UG_M3` sigui `0`; el llindar editorial s’ha d’acordar abans d’activar-la.
- Es reutilitza la cua social existent, amb deduplicació D1 i recuperació de canals pendents, per evitar una segona arquitectura de publicació.

**Activació de producció, 2026-08-31:** s’activen els resums periòdics a les 12:00, els episodis locals, els canvis ambientals a les 12:00 i les efemèrides a les 17:00. El llindar editorial de pols CAMS queda fixat en 50 µg/m³ durant almenys tres hores consecutives. Els avisos socials de Meteocat continuen pendents de rebre i configurar la clau oficial de l’API.

# ADR — Pressupost mensual de consultes Meteocat (2026-08-31)

- El pla oficial permet 100 consultes mensuals de predicció; el cron general de cinc minuts no pot consultar directament l’API SMP.
- Es fan tres consultes diàries persistents: 06:30 per al dia actual, 12:30 per a l’endemà i 18:30 novament per al dia actual. En un mes de 31 dies el màxim és 93, i se’n reserven set per a comprovacions excepcionals.
- D1 reclama cada franja abans de consultar. Una execució repetida o fallida no torna a consumir quota dins la mateixa franja.
- El recompte visible a l’administració és el registrat pel Worker, no substitueix el comptador oficial de Meteocat i no inclou consultes manuals alienes al Worker.

# ADR — Col·laboracions tècniques transparents (2026-09-01)

- La primera proposta a fabricants demana material cedit o en préstec i suport tècnic, no una aportació econòmica.
- Qualsevol cessió, préstec o accés especial es declara de manera visible a la pàgina o contingut corresponent.
- La marca no controla el text, les dades ni les conclusions, i no se li promet una ressenya positiva ni xifres d’audiència no acreditades.
- Abans d’integrar un producte es revisen compatibilitat, manteniment, propietat de les dades, llicències, atribució i condicions de retorn.
- La pàgina pública de col·laboracions manté l’estat actualitzat, inclosa l’absència de patrocinis comercials actius.
