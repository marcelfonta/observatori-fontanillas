# Auditoria G — SEO, staging i vídeos

## Abast

- Indexació independent de les vistes SPA i dels quatre idiomes.
- Metadades socials i dades estructurades coherents amb la vista visible.
- Contracte de l’històric verificat a staging en resolució crua, horària i diària.
- Reserva única dels vídeos de Meta i represa del mateix Reel de Facebook.

## Garanties de seguretat

- Una franja `running` o `healthy` no es torna a reservar, encara que la crida provingui del botó manual.
- Si el Worker s’atura després d’haver iniciat un enviament remot, la franja queda bloquejada per revisar-la; no es crea automàticament un segon vídeo.
- Els errors previs a l’enviament conserven els reintents existents. No hi ha cap migració de D1 ni cap secret nou.

## Validació i desplegament

1. Executar totes les proves i el `dry-run` del Worker.
2. Integrar la PR.
3. Desplegar primer a staging i executar la prova de les tres resolucions.
4. Només amb autorització humana separada, desplegar Worker 22.29.11 i web 22.31.3.

## Reversió

Revertir el commit i tornar a desplegar les versions anteriors. Abans de reactivar una franja de vídeo que hagi quedat `running`, confirmar manualment que el proveïdor no l’ha publicat.
