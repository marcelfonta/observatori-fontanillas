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
- `src/features/`: PWA, push, compartir, historial d’avisos, analítica, router del portal i Centre de Dades.
- `worker/`: Worker actiu i esquema de dades. No modificar-ne els contractes sense migració documentada.

## Fonts i serveis que cal preservar

Estació Fontanillas, Worker propi, Weather Underground, Open-Meteo, AEMET, Meteocat, RainViewer i els ginys meteorològics ja integrats. Les claus i URLs es centralitzen en la configuració existent.

## Navegació V11

Inici, Estació, Predicció, Cel de dia i de nit, Avisos, Radar, Webcams, Centre de Dades, Comparar, Medi Ambient, Contacte i Metodologia. Escriptori: lateral fi. Mòbil: hamburguesa. La capçalera, l’estat en directe i la identitat visual es preserven.

La capçalera és fixa. La primera secció de cada vista compensa l’altura de la capçalera una sola vegada. Els peus només ofereixen «Tornar amunt» i «Compartir»; la navegació entre àrees pertany al menú lateral o a l’hamburguesa.

## Centre de Dades V9

La vista consumeix el mateix `/history` ja utilitzat per les gràfiques i els extrems. `src/features/data-center.js` calcula resums només al navegador i genera exportacions sense llibreries ni serveis nous. El Worker i els formats de resposta es mantenen intactes.

## Comparador V10

`comparativa.html` i `src/features/stations-comparison.js` consumeixen `/stations?period=now|today|24h`. El mapa, les targetes i la gràfica de cinc variables parteixen d’un únic payload normalitzat. Leaflet es carrega sota demanda i Chart.js continua sent l’únic motor de gràfiques.

La vista «Cel de dia i de nit» reutilitza el mòdul d’astronomia existent. El radar conserva la capa oficial de Meteocat i mostra l’activitat elèctrica amb la imatge oficial adaptable d’AEMET.

## Medi Ambient V11

`src/features/environment.js` consulta directament l’API de qualitat de l’aire d’Open‑Meteo per mostrar l’estimació CAMS europea a les coordenades de Sant Celoni. La interfície separa clarament aquestes estimacions dels visors operatius oficials de la Generalitat i l’ACA. El visor de llamps d’AEMET es carrega sota demanda dins de Radar i el Worker conserva intactes els seus contractes.

Totes les subpàgines del portal comparteixen el component visual `portal-view-header`. La invitació inicial d’avisos desa una única decisió local al navegador i no torna a interrompre la navegació després de respondre.

## Normes de canvi

1. Treballar una sola fita cada vegada.
2. No canviar el Worker, les API, la PWA o els formats de dades si la fita no ho requereix.
3. Mantenir els avisos AEMET/Meteocat visibles i accessibles.
4. Validar enllaços locals, mòduls ES, selectors crítics, manifest i Service Worker abans de lliurar.
5. Actualitzar `CHANGELOG.md` i l’estat de `ROADMAP.md` en cada versió.
