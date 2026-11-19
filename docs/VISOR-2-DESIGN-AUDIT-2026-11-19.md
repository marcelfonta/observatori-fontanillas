# Fontanillas Visor 2.0 — auditoria inicial i especificació de producte
Data: 2026-11-19. Estat: proposta, pendent de proves reals i aprovació. Cap canvi a producció.

## 1. Objectiu
Combinar un mapa meteorològic visual, intuïtiu i ràpid amb comparació multimodel, incertesa expressada correctament i verificació retrospectiva de prediccions amb observacions pròpies. Conservar les capacitats existents abans d'afegir capes noves.

## 2. Base verificada al repositori
- Frontend estàtic independent a `visor/`, publicat amb Cloudflare Pages sense build. Mapa amb Leaflet 1.9.4, HTML, CSS propi i JS modular.
- Modes actuals: radar RainViewer observat; models amb comparació puntual, coincidència en cinc punts i capa oficial AROME via Worker.
- Vuit sortides Open-Meteo: Best Match, ECMWF IFS, GFS, ICON, AROME HD, ARPEGE Europa, GEM global i UKMO global.
- Consens de temperatura/pluja/vent/núvols: mediana i rang de famílies disponibles; Best Match exclòs i AROME/ARPEGE agrupats. No presentar-lo com a probabilitat calibrada.
- Evolució de 24 h i verificació retrospectiva de temperatura a Sant Celoni ja implementades; són la base, no funcionalitats noves.
- L'estació consulta `widget-observation`; lectures de més de 30 minuts no són recents. Dades absents ≠ zero.
- Segons `ROADMAP.md` i `docs/VALIDATION-2026-11-18.md`, hi ha canvis del visor en branques separades i comprovacions reals encara pendents.

## 3. Auditoria UX inicial (hipòtesis a confirmar en navegador)
1. `intro` de gran alçada abans de l'espai de treball: a mòbil retarda l'accés al mapa. Reduir hero i prioritzar controls, hora de validesa i mapa per sobre del primer plec.
2. A `@media(max-width:700px)`, `.workspace{display:block}` col·loca tots els controls abans del mapa; moure controls secundaris a calaix inferior/plegable sense amagar font ni hora.
3. Llistat de vuit models amb quatre columnes a gran pantalla i una sola per sota de 520px; oferir una comparació compacta, amb model destacat, unitat, estat de disponibilitat i accés al detall.
4. El gràfic d'evolució SVG usa `min-width:500px` amb scroll horitzontal en mòbil; substituir per gràfic responsiu o mode de consulta horària accessible, sense perdre precisió.
5. La navegació actual és per modes dins de controls; reorganitzar en quatre vistes: Explora, Models, Verificació i Territori, conservant coordenades i selecció temporal quan correspongui.
6. Verificar contrast, enfocament de teclat, lectura per lector de pantalla, tamanys tàctils, etiquetes de llegenda i animació reduïda; no afirmar conformitat WCAG sense prova.
7. El frontend fa consultes a vuit endpoints per punt i en alguns modes a cinc punts; mesurar càrrega i límits de l'API abans de canviar política de memòria cau. `modelData` ja té cache de promeses de cinc minuts; evitar refetch duplicat.
8. Revisar al navegador els missatges d'error parcial, una capa AROME absent, peticions expirades, canvis ràpids de punt/hora i radar inaccessible.
9. No fer servir un punt observat de l'estació com a observació de qualsevol altre punt. Mostrar context geogràfic de la lectura.
10. Confirmar si la producció correspon al `main` actual o a un desplegament anterior i quines branques/PR s'han d'integrar abans de començar canvis funcionals.

## 4. Arquitectura funcional proposta
### Explora
- Mapa persistent amb radar observat i capa AROME prevista; llegenda física, hora vàlida i font sempre visibles.
- Línia temporal amb temps d'observació separat de temps de predicció.
- Punt seleccionat al mapa, localitzacions predefinides i coordenades; conservar la selecció entre pestanyes.
- Afegir satèl·lit, llamps i altres capes NOMÉS després de validar cobertura, permisos, latència i condicions d'ús.

### Models
- Comparador de 8 sortides, amb controls de variable, hora, punt i models destacats.
- Meteograma de temperatura, pluja, vent i núvols; llegenda interactiva, dades tabulars accessibles i gràfic responsive.
- Franja de rang i mediana descriptiva de famílies; incloure mida de mostra, horitzó i models absents. Cap probabilitat inventada.

### Verificació
- Conservar l'actual comparació retrospectiva de temperatura; ampliar només amb prediccions realment arxivades abans de l'esdeveniment i observacions amb QC.
- Mètriques: MAE, RMSE, biaix per temperatura; per pluja detecció/falses alarmes/CSI per llindars amb mostra mínima; Brier només amb probabilitats calibrables reals.
- Filtre per horitzó, hora, període i model. Mostrar N, cobertura, període i incertesa.

### Territori
- Comparació de punts existents sense interpolació fictícia.
- Context de relleu i estacions regionals amb origen explícit. Enllaçar a medi ambient/ACA existent en lloc de duplicar-ho.

## 5. Disseny i accessibilitat
- Dark-first opcional, mode clar accessible; mapa protagonista i controls en panells plegables.
- Desktop: mapa + panell lateral i detall; tablet: panell plegable; mòbil: mapa visible d'entrada i controls en bottom sheet.
- Estats UI: carregant, actualitzat, dades antigues, font indisponible, consulta parcial, sense previsió per a l'hora.
- Escales de color científiques i llegendes amb unitats; no dependre únicament del color.
- WCAG 2.2 AA com a objectiu verificable, focus, teclat, `prefers-reduced-motion`, text alternatiu i taula accessible de dades.

## 6. Implementació segura per etapes
**P0 — Baseline i regressions:** comparar branca principal, desplegament i PR oberts; proves automàtiques existents; provar dades reals en PC i mòbil. Congelar els contractes del consens i els estats de font.
**P1 — Estructura responsive sense migració:** navegació, hero compacte i mapa prioritari; CSS modular progressiu. No reescriure la integració Leaflet.
**P2 — Models i meteogrames:** composició de gràfics i controls, sincronització punt/hora, carregues diferides i taula de dades.
**P3 — Verificació i rigor:** filtres, estadístiques, documentació metodològica i integració d'arxiu prospectiu.
**P4 — Capes noves verificades i poliment:** només les disponibles legalment; avaluar MapLibre o altres frameworks després de mesurar limitacions concretes.

## 7. Criteris d'acceptació de la primera entrega
- Radar, AROME, consens, cinc punts, vuit sortides, evolució i verificació mantenen funcionalitat i fonts.
- Punt/variable/hora visibles i coherents; cap observació es confon amb previsió.
- En mòbil el mapa i l'estat de dades apareixen abans dels controls secundaris.
- Cap error crític ni degradació injustificada de temps de càrrega; mesuraments documentats en xarxa lenta.
- Sense canvis Worker, D1, PWA o domini de producció a la primera fase.
- Previsualització Pages i revisió humana abans de fusionar o publicar.

## 8. Proves que encara falten
Captures reals a desktop/iPhone/Android, Lighthouse i xarxa, resultats de Playwright, prova de font caiguda, validació de llicències de noves capes i comparació de la versió desplegada amb la branca de base. Aquesta auditoria és de codi i documentació: no acredita encara aquests resultats.
