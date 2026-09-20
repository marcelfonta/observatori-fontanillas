# Recuperació manual d’una franja de YouTube

## Què fa el botó

Administració mostra les dues franges d’avui i diferencia una execució completada
d’una publicació pública confirmada pel proveïdor. Els vídeos programats es mantenen
com a pendents: passar l’hora no demostra que hagin esdevingut públics.

«Recuperar aquesta franja» demana confirmació i només admet errors coneguts
anteriors a la pujada (OAuth, dades, render o hora de publicació).
No admet vídeos ja completats, execucions actives ni errors de pujada incerts.
Es limita al dia local vigent, des de la preparació fins a 90 minuts després
de l’hora pública. No altera els horaris 06:45 i 20:30.

1. El panell reserva atòmicament una petició en el registre existent.
2. GitHub comprova OAuth amb les credencials que realment utilitza per pujar.
3. Només després sol·licita el bloqueig exclusiu de la franja al Worker.
4. Genera i publica pel flux habitual. TikTok/X mantenen els seus deduplicadors.
5. Desa l’ID, privacitat i eventual hora programada retornats per YouTube.

No es guarden tokens nous i no hi ha migracions. Cal desplegar el Worker nou
i integrar el workflow abans d’utilitzar el botó. En un desplegament parcial
el botó pot quedar no disponible; no s’ha de forçar.

## Quan s’atura i requereix revisió

- OAuth falla abans de començar.
- GitHub no confirma el dispatch o hi ha un timeout (resultat incert).
- Ja s’ha sol·licitat o consumit un intent manual.
- Ja ha acabat la finestra o ha canviat el dia.
- La pujada pot haver-se completat però no se’n coneix el resultat.

En aquests casos, revisar GitHub Actions i YouTube Studio. No esborrar la fila,
no marcar-la pendent ni rellançar la publicació a cegues. Una segona recuperació
requereix conciliació humana explícita. No s’afegeix cap reintent automàtic.

## Proves abans de producció

- npm run test:quick i npm run check.
- npm run test:browser: geometria/captures amb dades de prova, cap enviament.
- npm run worker:dry-run.
- Desplegament a staging autoritzat, sense credencials de publicació reals.
- Revisió humana de les captures i confirmació abans de producció.

## Rollback

Revertir el canvi de Worker, web i workflow junts, sense tocar els registres
de publicació. El format de monitor_state és compatible amb el codi anterior,
però aquest no interpreta els nous bloquejos manuals. Si hi havia una recuperació
pendent, conciliar-la abans del rollback i no rellançar la franja.
