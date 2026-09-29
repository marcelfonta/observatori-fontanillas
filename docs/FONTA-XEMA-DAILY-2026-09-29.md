# Fonta · contrast regional diari XEMA

29/09/2026. Primera fase executable per aprofitar el catàleg meteorològic de
dades d'alt valor sense convertir una font nova en una correcció automàtica.
És un circuit de recerca privat, additiu i reversible: **no modifica la previsió
pública, el Worker, D1 ni cap publicació social**.

## Què incorpora

- Conjunt XEMA diari oficial `7bvh-jvq2`: temperatura màxima (`1001`), mínima
  (`1002`) i precipitació acumulada (`1300`). Només s'accepta `Representatiu`;
  els estats diferents, dies encara oberts, duplicats, unitats i valors
  impossibles queden fora.
- Metadades oficials `yqwd-vj5e` de sis estacions operatives: Dosrius, Puig
  Sesolles, la Roca/Cardedeu, Tagamanent, Viladrau i Fogars de la Selva. La Roca
  pot contribuir a pluja encara que no disposi de temperatura aquell dia.
- A cada emplaçament es congela la previsió de demà de `best_match`, ECMWF IFS,
  ICON-EU i AROME. La consulta és específica per coordenada; no es reutilitza
  la graella de Fontanillas per representar tot el territori.
- Mètriques MAE, biaix i RMSE de màxima, mínima i pluja. Per pluja també es
  conserven encerts, omissions i falses alarmes als llindars de 0,2 i 20 mm.
  Tots els comparadors comparteixen els mateixos dies i estacions.

## Controls científics

La previsió queda registrada abans de començar el dia objectiu. L'observació
arriba després i mai reescriu la predicció. No es reconstrueixen dies passats,
no es tria un model després de conèixer el resultat i no es barregen mesures
diàries amb les mostres subdiàries provisionals.

La fase només avalua si els errors dels models tenen estructura espacial i
altitudinal útil. Encara no estima gradients, no corregeix Fontanillas i no
entrena cap paràmetre. Abans d'això caldrà una mostra suficient, separació
entrenament/validació, validació deixant una estació fora, cobertura de pluja i
extrems i revisió humana. `productionEnabled`, `trainingEnabled` i promoció
romanen a `false` per contracte i per prova.

## Privacitat, reutilització i traçabilitat

Els originals, URL, hora de recepció i SHA-256 es desen només a
`fonta-research-archive`, el bucket privat R2 ja existent. Les claus són de
contingut, les escriptures són condicionals i cada pujada es torna a llegir.
No hi ha operació d'esborrat. GitHub només conserva el codi; l'artefacte del job
conté un rebut agregat, no lectures XEMA.

La finalitat declarada és recerca no comercial. La classificació europea de
dades d'alt valor reforça l'obertura via API, però el portal encara mostra
condicions específiques i Meteocat no ha respost la consulta. Per prudència no
es redistribueixen originals, no es mostren lectures per estació a la web i no
se'n deriva cap producte públic. L'atribució i l'enllaç a les condicions es
preserven dins de cada captura.

## Operació preparada, no activada

El workflow `fonta-xema-daily.yml` funciona una vegada al dia a les 08:35 UTC,
amb sis consultes: metadades, observacions i quatre models multiubicació. Està
restringit a `main`, permisos GitHub de lectura i el mateix grup de concurrència
que la còpia R2. Té un pilot de 90 captures, 100 MiB i menys de 1.000 objectes
totals; en assolir un límit s'atura i no elimina res.

L'activació futura requereix, després de fusionar i revisar:

1. Amb `FONTA_XEMA_DAILY_ENABLED=false`, executar manualment `plan` i comprovar
   el rebut sense escriptures.
2. Executar manualment `run` i comprovar pujada i lectura completa.
3. Només amb confirmació humana, canviar `FONTA_XEMA_DAILY_ENABLED=true`.

Per aturar-lo n'hi ha prou amb posar la variable a `false`. Les proves ja
guardades es preserven; no s'han d'esborrar per forçar un nou resultat.

## Fases següents, condicionades a evidència

1. Acumular com a mínim una temporada útil i revisar absències per variable.
2. Analitzar error per altitud, distància, mes, situació de pluja i règim de
   vent, sempre amb comparadors aparellats.
3. Provar una correcció jeràrquica regularitzada amb validació temporal i
   `leave-one-station-out`; rebutjar-la si no supera els models en dades noves.
4. Incorporar normals climàtiques només com a control de plausibilitat, no com
   a substitut de l'observació ni com a drecera per inflar resultats.
5. Valorar entrenament de Fonta i qualsevol sortida pública només amb resposta
   de Meteocat, evidència independent i aprovació expressa.

Fonts oficials: [XEMA diari](https://analisi.transparenciacatalunya.cat/d/7bvh-jvq2),
[metadades d'estacions](https://analisi.transparenciacatalunya.cat/d/yqwd-vj5e)
i [avís legal de Meteocat](https://www.meteo.cat/wpweb/avis-legal/).
