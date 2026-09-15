# Widget privat d'iPhone — fase 1

## Objectiu

Mostrar informació breu de Meteo Fontanillas a la pantalla bloquejada sense
canviar el Worker, D1, la PWA ni les automatitzacions socials.

## Contractes llegits

- Observació: `GET https://fonta-meteo.marcelfonta.workers.dev/`.
- Predicció d'avui: Open-Meteo per a les coordenades públiques de l'estació.

L'observació i la predicció es presenten separades. El valor gran és sempre una
observació real. La icona, màxima, mínima i probabilitat de pluja són previsió.

## Resiliència

- Si la previsió falla, es conserva la temperatura observada.
- Si l'observació falla o no conté una temperatura numèrica, el widget mostra
  «Dades no disponibles» i no inventa cap valor.
- Si el Worker retorna `degraded` o `stale`, l'app identifica la lectura com a
  «Darrera lectura fiable» i mostra l'antiguitat disponible.
- El refresc sol·licitat és de vint minuts i passa a deu minuts després d'un
  error. WidgetKit pot ajornar-lo segons bateria, ús i pressupost del sistema.

## Privacitat i impacte

- No hi ha autenticació, secrets, geolocalització ni identificadors personals.
- No s'escriu a D1 i no s'activa cap publicació o notificació.
- No s'ha afegit cap ruta ni s'ha modificat cap contracte del Worker.

## Límit de la fase 1

És una instal·lació privada de desenvolupament. Abans d'una distribució pública
cal decidir el compte de desenvolupador, identificadors definitius, política de
privacitat de l'app, proves en dispositius i procés de TestFlight/App Store.
