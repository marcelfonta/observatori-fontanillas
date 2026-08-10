# Observatori Meteorològic Fontanillas

## Missió

Ser el portal meteorològic de referència del Baix Montseny: informació local fiable, visual, ràpida, accessible i sense publicitat per a població general, aficionats, famílies i escoles.

## Principis

- La informació essencial s’ha de trobar en menys de deu segons.
- Les dades han de ser traçables; no s’inventen sensors ni observacions.
- Cada font externa s’identifica i els avisos oficials sempre prevalen.
- Les funcionalitats existents es reutilitzen; no es dupliquen API, lògica ni components.
- Cada fita ha de deixar una versió publicable i funcional.
- Rendiment, accessibilitat, mòbil i PWA són requisits, no extres.

## Arquitectura actual

- `index.html`: portal i vistes principals.
- `comparativa.html`: comparador d’estacions existent.
- `metodologia.html`: metodologia ampliada existent.
- `css/`: variables, disseny base i navegació del portal.
- `src/core/`: configuració i utilitats comunes.
- `src/services/`: accés únic als serveis meteorològics.
- `src/modules/`: estació, avisos, predicció, radar, gràfiques, astronomia i altres mòduls.
- `src/features/`: PWA, push, compartir, historial d’avisos, analítica i router del portal.
- `worker/`: Worker actiu i esquema de dades. No modificar-ne els contractes sense migració documentada.

## Fonts i serveis que cal preservar

Estació Fontanillas, Worker propi, Weather Underground, Open-Meteo, AEMET, Meteocat, RainViewer i els ginys meteorològics ja integrats. Les claus i URLs es centralitzen en la configuració existent.

## Navegació V8

Inici, Estació, Predicció, Avisos, Radar, Webcams, Centre de Dades, Comparar, Medi Ambient, Contacte i Metodologia. Escriptori: lateral fi. Mòbil: hamburguesa. La capçalera, l’estat en directe i la identitat visual es preserven.

## Normes de canvi

1. Treballar una sola fita cada vegada.
2. No canviar el Worker, les API, la PWA o els formats de dades si la fita no ho requereix.
3. Mantenir els avisos AEMET/Meteocat visibles i accessibles.
4. Validar enllaços locals, mòduls ES, selectors crítics, manifest i Service Worker abans de lliurar.
5. Actualitzar `CHANGELOG.md` i l’estat de `ROADMAP.md` en cada versió.

