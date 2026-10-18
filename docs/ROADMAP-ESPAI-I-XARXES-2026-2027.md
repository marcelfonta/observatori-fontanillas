# Roadmap integrat 2026–2027 · web, espai i xarxes

## Visió

Convertir l’Observatori Fontanillas en una referència local que expliqui què
passa a Sant Celoni amb dades pròpies, fonts oficials i observació de la Terra,
sense sacrificar velocitat, traçabilitat ni prudència meteorològica.

La prioritat és estable: **fiabilitat → claredat → context espacial → difusió**.
NASA, ESA, Copernicus i EUMETSAT complementen l’estació, els avisos oficials i
la càmera; no els substitueixen.

## Estat d'execució

- **Fase 1 completada i desplegada** el 18 d'octubre de 2026.
- **Fase 2 completada i desplegada:** resum intel·ligent de portada.
- **Fase 3 en curs:** centre d'observació de la Terra per horitzons.
- Fases 4–6 planificades i subjectes a la porta de qualitat de la fase anterior.

## Fase 1 · Confiança operativa — completada

Objectiu: saber en menys de deu segons si el sistema està preparat.

- Centre operatiu a l’administració amb estat de dades, automatitzacions,
  xarxes i timelapses.
- Accions prioritzades que condueixen al diagnòstic existent, sense duplicar
  mètriques ni executar canvis destructius.
- Estat derivat exclusivament de proves i registres reals; una credencial no
  compta com una publicació completada.
- Proves deterministes de la lògica i revisió responsive abans de fusionar.

Porta de sortida: cap regressió a `test:quick` i `check`, lectura correcta en
mòbil i escriptori, i degradació comprensible quan una font no respon.

## Fase 2 · Portada intel·ligent

Objectiu: respondre «què cal saber ara?» sense obligar a navegar per deu
pantalles.

- Resum local amb observació actual, fenomen rellevant, confiança entre models,
  avisos oficials i frescor de les dades.
- Càrrega progressiva: primer contingut local i últim valor vàlid; després
  comparacions i mapes.
- Explicacions curtes sobre incertesa i origen de cada dada.

Primer lliurable: quatre lectures essencials —observació, previsió d'avui,
vigilància oficial i confiança multimodel— amb font visible, accés al detall i
estats útils quan una API encara no ha respost.

## Fase 3 · Centre d’observació de la Terra

Tres nivells de lectura, amb fonts i responsabilitats separades:

1. **Ara:** Meteosat/EUMETSAT, llamps MTG Lightning Imager, radar i webcam.
2. **Avui:** NASA FIRMS, CAMS (aire, pols i fum) i EONET per al context global.
3. **Evolució:** Sentinel-1/2/3 per comparar territori, vegetació, inundacions i
   temperatura superficial abans/després d’un episodi.

NASA Worldview/GIBS continua sent l’explorador global. Copernicus Data Space és
la font preferent per Sentinel. NASA POWER s’utilitza només com a context
climàtic, mai com a lectura meteorològica local en temps real.

Primer lliurable: una pàgina pròpia ordena nou eines verificades en «Ara»,
«Avui» i «Evolució», identifica si cada producte és observació, model o context
i evita carregar visors externs fins que l'usuari els obre.

## Fase 4 · Històries meteorològiques verificables

- Sincronitzar webcam, radar, satèl·lit i observacions locals en una línia
  temporal comuna.
- Crear fitxes d’episodi amb pluja, tempesta, calor, fum o canvis de vegetació.
- Conservar originals, timestamps, fonts i atribució; diferenciar observació,
  model i avís oficial.
- Mantenir un màxim d’un timelapse principal al dia, publicat només si aporta
  una evolució visible o acompanya un episodi rellevant.

## Fase 5 · Xarxes adaptades a cada canal

- Instagram: vertical, carrusel i comparacions visuals.
- TikTok: peça breu centrada en un sol fenomen.
- Facebook: més context i enllaç cap a la web.
- YouTube: explicació més llarga i arxiu de vídeos.
- X, Bluesky, Threads i Telegram: actualització ràpida, font i enllaç.

Cap canal es considera publicat fins a rebre confirmació i identificador o URL.
Els reintents només afecten els canals fallits. Els avisos oficials urgents són
l’única excepció possible al límit editorial diari.

## Fase 6 · Verificació i reputació

- Resultat mensual model versus realitat local amb mostra mínima explícita.
- Metodologia, cobertura, errors i canvis de pes consultables.
- Exportacions de dades pròpies i derivats compatibles amb les llicències.
- Pàgina pública de salut i historial d’incidències sense dades sensibles.

## Criteris permanents

- Rendiment: les capes pesades es carreguen sota demanda i disposen de reserva.
- Accessibilitat: teclat, contrast, text alternatiu i moviment reduït.
- Privacitat: la càmera publica únicament derivats aprovats; els originals nets
  romanen privats.
- Llicències: atribució i condicions visibles per NASA, ESA, Copernicus,
  EUMETSAT i qualsevol altra font.
- Seguretat: secrets només al Worker o al proveïdor corresponent.
- Honestetat: cap mapa de model o satèl·lit es presenta com a avís oficial.

