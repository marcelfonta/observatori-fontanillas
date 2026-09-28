# Fonta 0.2 · política prospectiva tolerant als retards del programador

27/09/2026. Canvi preparat per revisar; no desplegat ni activat encara.
No modifica publicacions, avisos, Worker, D1, secrets ni la font XEMA.

## Problema observat amb dades reals

La captura principal, Single Runs i les còpies R2 s'executen programadament i
acaben correctament. L'arxiu real `fonta-data`, consultat en només lectura el
27/09, conté set captures principals, sis dies Single Runs i vuit dies observats
aptes. Les còpies R2 programades també han acabat correctament.

Tot i això, els dos informes indiquen **zero dies comparables**. La causa no és
una manca de dades meteorològiques: GitHub ha iniciat diverses captures previstes
a les 08:10/08:20 UTC cap a les 13 UTC. El protocol 0.1 només acceptava recepcions
entre 08:00 i 09:59 UTC. Per tant, les conservava però les excloïa totes. A més,
el tall de nom de fitxer a les 12 UTC feia que la captura retardada del matí
ocupés el fitxer `pm` i impedís conservar després la captura nocturna del mateix
dia.

No és correcte solucionar-ho reconstruint pronòstics antics o triant una hora
segons quin model hagi encertat. La correcció és operativa, es versiona abans de
tenir cap resultat Fonta i només s'aplica a captures noves.

## Política 0.2 congelada

- Identificador: `fonta-first-prospective-08-18z-v2`.
- Primera captura completa rebuda entre les 08:00:00 i les 17:59:59 UTC.
- Objectiu: màxima i mínima del dia natural següent a `Europe/Madrid`.
- La captura ha de continuar sent anterior a l'inici del dia objectiu i contenir
  els quatre models complets. No hi ha reintents per buscar una sortida millor.
- La primera captura apta per dia preval; les duplicades queden visibles però no
  s'utilitzen dues vegades.
- Les captures 0.1 es preserven i poden aportar observacions originals, però no
  es converteixen retroactivament en emissions 0.2 ni en resultats comparables.
- El fitxer diürn es reserva fins a les 18 UTC; així una execució retardada cap a
  les 13 UTC no bloqueja el fitxer nocturn.
- El mateix identificador governa Single Runs. Els paquets antics continuen
  llegibles i verificables, però s'etiqueten com a política antiga i no es
  puntuen dins la nova sèrie.

La finestra més ampla no afirma que totes les hores siguin equivalents. Defineix
un experiment nou i reproduïble que tolera la infraestructura real. Si un cron
arriba després de les 18 UTC, falla de manera segura per a l'avaluació: s'arxiva,
però no es força dins la mostra.

## Compatibilitat, observabilitat i rollback

- `status.json` continua amb esquema 1 i `single-runs-status.json` amb esquema 2.
- Fonta passa d'algoritme `0.1.0` a `0.2.0`; els paquets prospectius nous usen
  `fonta-paired-daily-v2`.
- El diagnòstic mostra la política, la finestra i diferencia captures antigues,
  fora de política, incompletes, duplicades i aptes.
- El web admet temporalment els paquets aparellats v1 i v2, sense presentar-los
  com una prova independent ni permetre promoció.
- La promoció continua bloquejada i els mínims de 30 dies d'entrenament, 14 dies
  exploratoris i el protocol independent posterior no es redueixen.
- Rollback: revertir aquesta entrega. Les captures 0.2 queden a l'arxiu com a
  evidència immutable; la versió anterior no les seleccionarà perquè l'algoritme
  i la política no coincideixen.

## Estat de XEMA

La consulta a Meteocat continua pendent. Aquesta correcció no consumeix XEMA,
no redistribueix dades oficials i no substitueix la futura validació territorial.
Quan arribi una resposta, l'adaptador existent es podrà activar sota una política
de llicència i períodes compatible, sense canviar aquesta sèrie prospectiva.
