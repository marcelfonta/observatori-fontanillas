# CO₂ atmosfèric de Mauna Loa

La font és la [sèrie de mitjanes diàries de NOAA GML](https://gml.noaa.gov/ccgg/trends/data.html)
(`co2_daily_mlo.csv`). Indica concentració atmosfèrica en ppm a l'estació de
referència de Mauna Loa. NOAA explica que aquest valor pot diferir de la
mitjana mundial. No és una lectura de Sant Celoni ni un índex de qualitat de
l'aire local. Les dades recents són provisionals.

El Worker consulta el CSV com a màxim una vegada cada 23 hores i guarda a R2
una única instantània normalitzada. Només admet dates reals, valors entre 250
i 650 ppm i registres que no siguin futurs. Si NOAA falla o retorna un fitxer
invàlid, no sobreescriu l'última instantània bona. La ruta pública
`/climate/co2` serveix aquesta mateixa instantània a la webcam i als
generadors de publicacions, sense consultar NOAA en cada petició.

La diferència interanual compara el darrer dia vàlid amb el dia més proper
dins d'una finestra de tres dies al voltant de la mateixa data de l'any
anterior. La webcam afegeix el valor equivalent de fa deu anys amb el mateix
criteri. Si no hi ha un dia comparable, l'etiqueta corresponent s'omet. Aquestes
comparacions entre dies no són taxes de creixement anual corregides pel cicle
estacional ni mitjanes anuals.

La resposta indica `ageDays`; a partir de quatre dies, `fresh=false` i els
mitjans ometen la càpsula. Després de set dies no es retorna cap valor. La
webcam continua generant-se si NOAA o el Worker no responen. La composició en
dia i nit, mòbil i imatge compartida s'ha de verificar amb captures reals a la
Raspberry després d'instal·lar els scripts actualitzats. El timelapse inclou
la dada només si és recent i el filtre de text està disponible; els vídeos
ja publicats no s'editen. El desplegament de l'API s'ha de fer abans
d'instal·lar el script nou a la Raspberry; el client antic ignora els dos camps
afegits i el script nou omet els valors històrics mentre no els rebi.
