# Fase 3 · Comparar estacions

La pàgina `comparativa.html` consumeix `GET /stations?period=...` del Worker.

## Estacions inicials
- Fontanillas — ISANTC198
- Alvar · Montseny — ICATALUN213
- Sant Celoni · Centre — ICATALON13
- Santa Maria de Palautordera — ISANTA1397

## Política de fonts
La capa de dades està normalitzada i preparada per aplicar prioritat a fonts oficials (Meteocat/AEMET) quan existeixi una correspondència fiable i les credencials necessàries. Si una font no respon, l’estació queda marcada com a no disponible sense trencar la resta de la pàgina.

## Ampliació
Afegir una estació requereix incorporar-la a `COMPARISON_STATIONS` dins `worker/index.js`.
