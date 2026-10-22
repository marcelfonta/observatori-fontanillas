# Dades obertes de l’Observatori Fontanillas

## Llicència

Les **observacions meteorològiques pròpies de l’estació Fontanillas** es
publiquen sota la llicència
[Creative Commons Reconeixement 4.0 Internacional (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/deed.ca).
Es poden copiar, redistribuir, analitzar i adaptar, també amb finalitats
comercials, sempre que se’n reconegui l’autoria, s’enllaci la llicència i
s’indiquin els canvis.

Citació recomanada:

> Observatori Meteorològic Fontanillas — meteo.fontanillas.cat (CC BY 4.0),
> consulta: AAAA-MM-DD.

Si es transforma el conjunt, cal afegir «Adaptació pròpia a partir de…» i no
suggerir que l’Observatori avala el resultat.

## Abast i exclusions

La llicència cobreix les lectures pròpies distribuïdes al Centre de Dades i als
endpoints `/` i `/history`: temperatura, humitat relativa, pressió, velocitat i
ratxa del vent, precipitació, radiació solar i índex UV quan són disponibles.

No cobreix previsions, avisos oficials, mapes, radar, satèl·lit, llamps,
webcams, pol·len ni cap altra dada o imatge de tercers. Aquests recursos
conserven l’autoria, la llicència i les condicions de la font identificada a la
interfície. Els productes que barregen observació pròpia i dades externes, com
la verificació de prediccions, tampoc no s’han de considerar íntegrament CC BY
4.0.

La llicència MIT del repositori cobreix el programari, no substitueix la
llicència de les dades.

## Variables i unitats

| Camp d’exportació | Significat | Unitat |
| --- | --- | --- |
| `data` | Instant de la lectura en format ISO 8601 | data i hora |
| `temperatura_c` | Temperatura de l’aire | °C |
| `humitat_pct` | Humitat relativa | % |
| `pressio_hpa` | Pressió atmosfèrica | hPa |
| `vent_kmh` | Velocitat del vent | km/h |
| `ratxa_kmh` | Ratxa de vent | km/h |
| `pluja_increment_mm` | Precipitació de l’interval | mm |
| `pluja_acumulada_mm` | Comptador acumulat disponible | mm |
| `radiacio_wm2` | Radiació solar | W/m² |
| `uv` | Índex ultraviolat | índex UV |

Els camps absents es lliuren buits. El CSV usa punt i coma com a separador; el
JSON inclou un objecte `license`. CSV i Excel incorporen `llicencia` i
`atribucio` a cada registre, i el resum PDF també mostra aquesta informació.

## Cobertura, qualitat i exemple

L’arxiu comença el 4 d’agost de 2026. Pot contenir buits per indisponibilitat
del sensor, la xarxa o la font d’ingesta. Els totals de períodes incomplets
poden ser parcials i una absència de registres no equival a absència del
fenomen. El Centre de Dades mostra cobertura i continuïtat per a la selecció.

Exemple mínim en JavaScript:

```js
const response = await fetch('https://fonta-meteo.marcelfonta.workers.dev/history?days=7&resolution=hourly');
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const payload = await response.json();
console.log(payload.observations);
```

Els endpoints són contractes d’implementació i encara no una API pública
versionada. Cal respectar la memòria cau, gestionar errors i no usar el portal
com a servei oficial d’avisos.
