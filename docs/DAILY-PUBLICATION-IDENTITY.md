# Identitat de les publicacions diàries — candidat intern

La previsió meteorològica conserva la prioritat visual. Al vespre, el símbol de la franja descriu el temps previst; la fase lunar és una dada astronòmica secundària, obtinguda de l’USNO per a les 12 h locals del dia previst. No representa visibilitat de la Lluna. Si l’USNO no respon o la data no coincideix, es mostra «Fase lunar no disponible» sense ocultar el temps. Si manca el codi meteorològic, no es dedueix del cel lunar.

La música de prova és sintetitzada localment, sense mostres ni composicions de tercers. Les variants de matí, vespre i episodi comparteixen un motiu de quatre notes, amb ritme i intensitat moderats i entrada/sortida suaus. «Episodi» és un accent editorial i no implica un avís oficial. Els fitxers de prova es generen amb `VIDEO_MUSIC_VARIANT=morning|evening|event node scripts/youtube-music.mjs`; la ruta de sortida es pot fixar amb `VIDEO_MUSIC_OUTPUT`. La variant per defecte continua sent `current`.

Abans d’activar una variant: comparar A/B amb dues peces reals de matí i vespre; escoltar-les en altaveu de mòbil i auriculars; comprovar nivells, saturació, missatge sense so i marges de Shorts i Meta. Fer l’activació com a canvi independent, reversible retornant `VIDEO_MUSIC_VARIANT=current`. La publicació automàtica no canvia en aquest paquet.

Mesura preliminar de les mostres de 30 s: la peça actual fa −20,2 dB de volum mitjà; matí −23,9 dB, vespre −25,6 dB i episodi −23,4 dB. Cap mostra nova no satura (pics entre −11,8 i −9,3 dB). Cal igualar el nivell percebut abans de l’A/B; aquests valors de `volumedetect` són orientatius i no substitueixen una mesura de loudness ni l’escolta.

## Validació visual local (23/10/2026)

Playwright ha renderitzat targeta Meta de 1080 × 1350 i pantalla de Short de 1080 × 1920 per a serè, parcial, cobert, boira, pluja, neu i tempesta, més codi meteorològic absent i fase lunar absent (18 casos). Tots passen les comprovacions de marges, retalls i separació entre símbol i distintiu; les captures es generen als resultats locals de les proves i no s’envien a producció. La primera publicació real de vespre encara requereix comprovació operativa.

El 23/10, la franja automàtica de les 20:30 no va generar esborrany: ni el planificador ni les observacions guardades s’havien actualitzat des de les 20:05. Es va reaplicar el trigger de producció `*/5 * * * *`; el planificador va tornar a registrar èxit a les 20:43 i l’observació es va actualitzar a les 20:44:58. No es va forçar cap publicació manual per evitar duplicats. Cal verificar la pròxima franja real de vespre.
