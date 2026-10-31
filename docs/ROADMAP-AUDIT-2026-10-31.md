# Auditoria del roadmap — 31 d’octubre de 2026

## Què s’ha comprovat

- **Codi:** el `main` incorpora el PR #353 de Meteo IA. `npm run test:quick` i `npm run check` han acabat correctament (60 i 134 fitxers de proves, respectivament). La simulació de desplegament del Worker ha acabat amb codi 0 i ha mostrat les vinculacions esperades; Wrangler no ha pogut escriure el seu registre opcional a `~/Library/Preferences` en aquest entorn.
- **Producció:** l’usuari ha confirmat el 31/10 que les publicacions i el timelapse del dia són visibles i tenen el format esperat. `npm run audit:seo` ha passat al domini públic per a portada, predicció, avisos, Centre de Dades, una història, un resum i un 404 editorial no indexable. El primer intent havia fallat per DNS restringit en aquest entorn; la repetició amb accés de xarxa ha passat. L’auditoria no acredita indexació a Google ni verifica visualment tots els fluxos.
- **Previsualització i dispositius:** no s’ha fet una nova revisió visual dels quatre idiomes ni una prova completa amb lector de pantalla, connexió lenta i PWA ja instal·lada. Aquests resultats continuen oberts.

## Tasques pròximes amb propietari

| Tema | Estat i següent prova | Qui hi intervé |
| --- | --- | --- |
| Meteo IA | PR #353 fusionat; comparar respostes, omissions, temps i consum dels models amb el mateix qüestionari en previsualització abans de canviar el model per defecte | Agent; validació editorial de l’usuari |
| Publicació social / #299 | L’usuari confirma el resultat visible del 31/10. Calen URL o identificadors de cada canal habilitat i comprovació d’absència de duplicats; el vídeo perdut del 21/10 no s’ha recuperat | Agent, amb accés als registres de canals; usuari valida el resultat |
| PWA i push | La correcció de memòria cau és pública; falta provar una instal·lació anterior amb nova versió i una notificació posterior al canvi | Agent i usuari en dispositiu existent |
| Atles ambiental | Revisar pestanyes i enllaços en mòbil i ordinador. El visor administratiu ACA de sequera depèn de la fi del manteniment; l’IPE només s’actualitza quan existeixi la cartografia oficial d’un nou mes | Agent i usuari; ACA/Meteocat per a la font |
| SEO | Auditoria de rutes i metadades de producció superada el 31/10; consultar la indexació real a Search Console | Agent; accés a Search Console |
| Idiomes i accessibilitat | Repassar visualment textos i controls en català, castellà, anglès i francès, amb teclat i lector de pantalla | Agent i usuari en dispositius reals |
| Model Fonta, avisos i estudis | Mantenir els experiments en observació fins a tenir la mostra de 60/90 dies, pluja representativa o un avís oficial real | Temps, fonts oficials i agent |

## Decisions de neteja

- Els apartats P0–P3 del [roadmap](../ROADMAP.md) inclouen també hipòtesis i experiments condicionats. Una casella oberta no sempre representa una tasca executable avui.
- Les millores de veu, resposta progressiva i targetes de Meteo IA són opcionals; l’activació d’un altre model requereix una comparació mesurada.
- No es tanca #299 fins que la publicació de cada canal i l’absència de duplicats tinguin evidència. La confirmació visual del timelapse del 29/10 i la confirmació de publicacions del 31/10 es conserven com a proves parcials.
- La comparació amb una «normal» climàtica local no es publicarà mentre la referència oficial representi la capital municipal i l’arxiu propi no tingui cobertura comparable.

La [guia editorial](EDITORIAL-TERMS.md) fixa els noms i les distincions de dades per a revisions futures.
