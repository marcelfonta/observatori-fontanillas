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
anterior. Si no hi ha un dia comparable, s'omet. Aquesta diferència entre dos
dies no és una taxa de creixement anual corregida pel cicle estacional.

La resposta indica `ageDays`; a partir de quatre dies, `fresh=false` i els
mitjans ometen la càpsula. Després de set dies no es retorna cap valor. La
webcam continua generant-se si NOAA o el Worker no responen. La composició en
dia i nit, mòbil i imatge compartida s'ha de verificar a staging amb captures
reals abans del desplegament. La comparació amb fa deu anys s'ha deixat per a
una sèrie mensual amb una metodologia explícita.
