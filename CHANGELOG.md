# Changelog

## V12.1.0 — 2026-08-10

### Corregit

- Substituït el visor de llamps d’AEMET per l’embed vectorial en temps real de Blitzortung, centrat a Catalunya i comprovat en una amplada mòbil de 390 px.
- Substituït el visor ArcGIS del Pla Alfa, lent i inestable en alguns telèfons, pel mapa oficial diari dels Agents Rurals amb data i llegenda visibles.
- L’índex UV de Medi Ambient utilitza prioritàriament el valor real del sensor de Fontanillas; CAMS només actua com a fallback identificat.

### Millorat

- Targetes de Comparar més petites: menys alçada i farciment, temperatura més compacta i sis variables distribuïdes en tres columnes.
- Alçada del visor de llamps reduïda i adaptada a escriptori i mòbil.

### Branding · Milestone 5

- Nom curt de la PWA unificat com a «Observatori» per evitar truncaments.
- Nova guia d’identitat amb nom, símbol, colors, tipografia, pictogrames i criteris d’ús.

### Preservat

- API i Worker sense canvis de contracte; avisos oficials, PWA, compartir, comparativa històrica i fonts de Medi Ambient continuen actius.

## V12.0.0 — 2026-08-10

### Afegit

- Visors ambientals integrats i carregats sota demanda: Pla Alfa oficial, estat de sequera de l’ACA i albiraments de MedusApp (UPV i Universitat d’Alacant).
- Enllaços complementaris a PlatgesCat i Meduseo, diferenciant la font oficial, la ciència ciutadana i el servei internacional extern.
- Interpretació visual baixa, raonable, moderada, alta o extrema per als índexs europeus de PM10, PM2,5, NO₂, O₃ i SO₂.
- Pàgina separada `historial-avisos.html` amb cerca i filtres per any i nivell.
- Descobriment automàtic d’estacions meteorològiques properes per ampliar la comparativa fins a sis ubicacions, amb fallback estable.
- Nou sistema coherent de pictogrames SVG al menú lateral, primera actuació del Milestone 5.

### Millorat

- Capçaleres de totes les subpàgines més compactes, amb la mateixa alçada visual, tipografia i separació.
- Títol de Comparar reescrit per explicar clarament que mostra les diferències meteorològiques del Baix Montseny.
- Distància a Fontanillas visible per a les estacions descobertes automàticament.
- L’historial de la pàgina principal queda limitat als cinc episodis més recents i disposa d’un únic desplaçament intern.
- Metodologia incorpora la mateixa capçalera visual que la resta del portal.

### Preservat

- Contractes existents de `/stations` i `/alert-history`: només s’amplien camps i criteris sense retirar-ne cap.
- Avisos AEMET/Meteocat, radar, Centre de Dades, PWA, compartir, push, contacte i dades de l’estació.

## V11.0.0 — 2026-08-10

### Afegit

- Primera fase de Medi Ambient amb AQI europeu, PM10, PM2,5, NO₂, O₃, CO, SO₂, radiació UV i cinc tipus de pol·len a partir del model CAMS via Open‑Meteo.
- Accessos prioritaris als mapes oficials de Pla Alfa, sequera de l’ACA i PlatgesCat amb informació de meduses.
- Invitació inicial per configurar avisos, amb resposta recordada al navegador perquè només aparegui una vegada.
- Visor oficial de llamps d’AEMET carregat sota demanda dins de la pàgina Radar.
- Capçalera visual compartida per a totes les subpàgines del portal.

### Corregit

- Etiqueta de la webcam de portada més petita i menys invasiva.
- Substituït el visor de llamps de Meteocat, que quedava tallat, per la imatge oficial adaptable d’AEMET.
- Corregit el farciment superior de la capçalera d’Estació i unificat amb la resta de vistes.
- Eliminada la confusió entre espai exterior de pàgina i farciment interior de les capçaleres.

### Planificat

- Redisseny dels pictogrames del menú lateral incorporat al Milestone 5 de branding.

### Preservat

- Worker i contractes de dades sense canvis; també es preserven avisos AEMET/Meteocat, historial, Centre de Dades, comparativa, PWA, compartir i contacte.

## V10.0.0 — 2026-08-10

### Afegit

- Títol i introducció propis per a la pàgina Estació.
- Nova pàgina «Cel de dia i de nit» al menú lateral, reutilitzant tots els càlculs d’astronomia existents.
- Producte oficial combinat radar + llamps de Meteocat integrat dins de la pàgina Radar.
- Selecció de webcams properes al Montseny amb quatre accessos verificats.
- Comparador avançat amb mapa interactiu del Baix Montseny, marcadors, llegenda i cinc variables commutables.
- Comparació actual i històrica per temperatura, humitat, pressió, vent i pluja en els períodes Ara, Avui i 24 h.

### Millorat

- Webcam de portada més ampla, centrada i proporcionada segons la referència visual de l’usuari.
- Finestra de compartir amb fons sòlid, més contrast i botons clarament llegibles.
- Distribució de la portada ajustada per donar més amplada a temperatura i webcam sense afectar la lectura ràpida.

### Preservat

- Worker i contractes de l’API sense canvis.
- Centre de Dades, avisos AEMET/Meteocat, PWA, compartir, push i resta de funcions de V9.
- Milestone 4 i posteriors sense iniciar.

## V9.0.0 — 2026-08-10

### Afegit

- Centre de Dades complet amb selecció de 7, 30 i 365 dies.
- Cobertura, nombre real de mostres, temperatura mitjana i desviació estàndard, pluja acumulada i ratxa màxima.
- Resums del dia, del mes i de l’any; arxiu d’extrems i efemèrides segons la cobertura disponible.
- Descàrregues locals en CSV, Excel, JSON i PDF, sense enviar dades a tercers.
- Miniatura discreta de la webcam a la portada, enllaçada amb la vista completa de Webcams.

### Corregit

- Eliminada la doble compensació vertical entre la capçalera fixa i la primera secció de cada pàgina.
- Preservat el farciment interior original de la portada en aplicar la correcció d’espaiat.
- Eliminats Comparar i Metodologia de tots els peus; continuen disponibles al menú principal.
- Mantingut un únic «Tornar amunt» al peu de cada pàgina.

### Preservat

- API i Worker sense canvis de contracte.
- Avisos AEMET/Meteocat, PWA, compartir, push, comparativa, radar i resta de mòduls existents.

## V8.0.1 — 2026-08-10

### Corregit

- Capçalera fixa i visible durant el desplaçament en totes les pàgines.
- Barra lateral compartida també a Comparar i Metodologia.
- Eliminats sis enllaços «Torna amunt» que havien quedat fora de les seves seccions i apareixien agrupats.
- Eliminada la navegació mòbil antiga duplicada; la hamburguesa és ara l’única navegació compacta.
- Eliminat el botó redundant «Tornar a l’inici» del principi de Metodologia.
- Enllaços de marca i retorn adaptats a les noves vistes del portal.
- Nous recursos comuns incorporats a la memòria cau de la PWA.

## V8.0.0 — 2026-08-10

### Afegit

- Governança del projecte amb `PROJECT.md`, `ROADMAP.md` i aquest registre.
- Menú lateral compacte en escriptori i menú hamburguesa en mòbil.
- Vistes especialitzades per Inici, Estació, Predicció, Avisos, Radar, Webcams, Centre de Dades, Medi Ambient i Contacte.
- Accés preservat a les pàgines existents Comparar i Metodologia.
- Router lleuger sense dependències ni canvis als contractes de dades.

### Canviat

- Portada reduïda a consulta ràpida: situació actual, mètriques, avisos, predicció i radar resumits.
- Contingut extens distribuït entre vistes, reutilitzant el mateix DOM i els mateixos mòduls.

### Preservat

- Avisos visibles d’AEMET i Meteocat, historial d’avisos i notificacions push.
- Comparativa, compartir, Worker, API, PWA, Service Worker i manifest.
- Capçalera, estat en directe i estètica general de la V7.

### Abast ajornat

- No s’han implementat funcions dels milestones 2–10. Medi Ambient només disposa de la nova ubicació estructural.
