# V7 · Fase 3 — Comparativa d’estacions

## Novetats
- Nova pàgina `comparativa.html`.
- Comparativa visual de Fontanillas i estacions properes.
- Variables principals: temperatura, humitat, vent, ratxa, pluja i pressió.
- Diferència tèrmica respecte Fontanillas i lectura automàtica.
- Gràfics de temperatura, pluja i vent.
- Selector Ara / Avui / 24 h.
- Nou endpoint Worker `/stations?period=now|today|24h`.
- Catàleg d’estacions ampliable i capa normalitzada preparada per fonts múltiples.
- Enllaç “Comparar” integrat a la navegació, menú mòbil i footers.
- Service Worker actualitzat per incloure la nova pàgina i el nou mòdul.

## Fonts
La primera versió funcional usa estacions Weather Underground properes perquè comparteixen esquema i unitats amb l’estació Fontanillas. L’arquitectura del Worker queda preparada per substituir o prioritzar estacions equivalents de Meteocat/AEMET quan es disposi de credencials i codis d’estació adequats.
