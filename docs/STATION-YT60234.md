# Estació Fontanillas · VEVOR YT60234

20/09/2026 · Fitxa documental i protocol proposat. No és un certificat de
calibratge, una correcció instrumental ni una autorització per moure el sensor.

## 1. Identificació i evidència

- Model **YT60234**, família VEVOR 7 en 1, llegit a la fotografia de l'etiqueta.
- Instal·lació sobre teules vermelles; **0,70 m entre teules i sensor**, segons
  el responsable. Substitueix l'aproximació anterior d'1 m; no és altura sobre terra.
- Sis fotos revisades en privat: abric blanc de plats visible. No acrediten
  ventilació efectiva ni calibratge.
- Absència d'obstacles al sol/vent en 50 m declarada pel responsable, no mesurada.
- El 20/09 el responsable confirma que la referència nord del conjunt està
  orientada al nord i que la bombolla de nivell incorporada queda centrada.
  És una comprovació directa declarada, no una certificació de calibratge.
- Pendents: revisió exacta de la unitat/manual inclòs, altura sobre el terreny,
  altitud verificada, distàncies a superfícies i historial de manteniment.
- Les fotografies originals, ubicació privada detallada i metadades EXIF no
  s'incorporen al repositori ni es publiquen.

### Fonts i límits

El [manual europeu del fabricant, en francès, YT60234](https://d2v0huudrf11kh.cloudfront.net/vevor-center-goods/SKU3%E6%AC%A7%E7%89%88%E8%AF%B4%E6%98%8E%E4%B9%A6%E7%BB%88-%E6%B3%95%E8%AF%AD_1689819310254.pdf)
identifica el model a la portada. Referències: ubicació p. 3 impresa (PDF 5),
especificacions p. 58 (PDF 60), diagnòstic p. 60 (PDF 62).
L'[article inicial de VEVOR](https://www.vevor.com/es/diy-ideas/product/vevor-7-in-1-wireless-weather-station-7-5-in-large-color-display-manual/)
correspon al **YT60231**, no al YT60234: no se n'importen precisions ni instruccions.

Especificacions nominals del manual, **no precisió comprovada d'aquesta unitat**:

| Magnitud | Declaració del fabricant | Límit d'interpretació |
| --- | --- | --- |
| Temperatura | ±1 °C entre 10 i 50 °C; ±1,5 °C entre −20 i 10 °C; ±2 °C en altres trams | El límit de 10 °C se solapa a la taula; no confondre resolució amb exactitud ni afegir un offset automàtic. |
| Humitat | ±5 punts percentuals al tram 40–80% HR, a 25 °C; ±8 punts fora, a 25 °C | No és una validació a qualsevol temperatura. |
| Pluja | ±7% | No inclou una prova del nivell, esquitxos, obstrucció o exposició local. |
| Vent | ±0,5 m/s per sota de 5 m/s; ±10% per sobre | No extrapolar a exposició sobre teulada ni resoldre el límit exacte de 5 m/s sense aclariment. |
| UV i llum | Rangs 0–16 i 0–200 klux | No s'hi ha verificat una precisió nominal; no inventar-la. |

Els 20 segons descrits per a la transmissió RF no són el ritme de publicació
de la web ni garanteixen extrems continus a l'arxiu de cinc minuts.

## 2. Emplaçament: què implica

El manual recomana espai obert i almenys **1,5 m de qualsevol edifici o estructura**.
Els 0,70 m declarats sobre teules no compleixen aquesta separació respecte de
la coberta. El mateix manual assenyala superfícies i fonts de calor properes
com a possibles causes de lectures diürnes altes. Això justifica investigar
l'exposició, però **no demostra ni quantifica un biaix**: no restar 1 °C, ni cap
altra quantitat, per intuïció. L'abric visible no elimina aquesta incertesa.

Fonta continua aprenent les lectures d'aquesta estació, no una temperatura
regional de referència. Es manté `roof-red-tiles-2026-09-unreviewed`: documentar
el model no és un canvi físic. Un trasllat, canvi de sensor o ajust real haurà
de tenir data, nova època instrumental i comparació separada del passat.

## 3. Protocol pràctic de comparació (proposta, no executada)

Objectiu: separar tant com sigui possible diferència entre instruments i
efecte d'exposició. No es considera cap model numèric o estació llunyana com
un patró exacte del terrat. No comprar material ni aplicar correccions en aquesta fase.

1. **Preparació sense tocar la instal·lació.** Registrar rellotge/fus horari,
   identificadors dels sensors, resolució, calibratge disponible, distàncies,
   altura, superfície, ombres i canvis de manteniment. Conservar lectures brutes.
2. **Si es pot disposar d'una referència independent:** documentar la seva
   exactitud i abric. Primera etapa amb exposició tan equivalent com sigui
   possible per estimar diferències entre instruments, sense alterar l'abric
   original. Segona etapa simultània amb la referència en una ubicació més
   allunyada de la coberta i ben documentada. Les diferències també poden
   incloure altura, ventilació i microclima: no atribuir-les totes a les teules.
3. **Campanya proposada:** 14–28 dies, ampliable si no hi ha dies assolellats
   amb poc vent, dies ennuvolats, vent i nits. És un disseny exploratori propi,
   no un mínim oficial ni suficient per certificar una correcció anual.
4. **Aparellament preregistrat:** comparar mitjanes dels mateixos intervals
   de cinc minuts quan ambdós equips les proporcionin. Si només hi ha lectures
   puntuals, parelles úniques amb distància temporal màxima de 60 s, sense
   interpolar ni reutilitzar una lectura. No barrejar mitjanes amb instants.
   Registrar cobertura i absències; un interval buit no és zero.
5. **Resultat:** nombre de parelles, dies i cobertura; mediana de la diferència
   (VEVOR menys referència), MAE i percentils 10/90, separats per dia/nit i
   règims de vent/nuvolositat documentats. Informar la incertesa de la referència.
   Associació amb insolació no prova per si sola causalitat tèrmica de la coberta.
6. **Decisió humana:** conservar dades originals i informe; decidir si cal
   millorar l'emplaçament abans d'estudiar una correcció. Qualsevol candidat de
   correcció es validarà amb dades futures separades, sense utilitzar el holdout
   per ajustar-lo. Cap promoció automàtica de Fonta.

**Sense referència disponible**, es pot fer ara el registre d'emplaçament,
qualitat, continuïtat i patrons dia/nit. És un diagnòstic descriptiu: no pot
quantificar l'error absolut ni validar una correcció. Les proves instrumentals
continuen pendents de disposar d'una comparació segura i independent.

## 4. Checklist d'instal·lació i manteniment

No cal pujar a la teulada per completar la primera part. Si no es pot verificar
des d'un lloc segur, deixar «pendent» i encarregar-ho a una persona qualificada.

### Ara: consola, documents o fotografies des d'un lloc segur

- [ ] Confirmar YT60234 també a la consola/manual subministrat i anotar revisió.
- [ ] Anotar els ajustos de calibratge actuals de la consola, **sense canviar-los**.
- [ ] Revisar continuïtat de recepció, rellotge/fus horari i estat de bateries.
- [ ] Documentar ombres/obstacles i fonts de calor visibles; no assumir 50 m mesurats.
- [ ] Anotar última neteja i incidències de pluja/vent; conservar data i observacions.

### Només quan hi hagi accés segur

- [x] Bombolla centrada i conjunt anivellat, confirmat pel responsable el 20/09.
- [ ] Comprovar fixació ferma: vibracions poden causar recomptes de pluja falsos.
- [x] Referència nord del conjunt orientada al nord segons les instruccions,
  confirmat pel responsable el 20/09; no s'ha deduït de la fotografia.
- [ ] Revisar desguassos/embut, brutícia de l'abric i llibertat dels elements del vent.
- [ ] Mesurar separacions i estudiar una ubicació compatible amb el manual,
  sense improvisar una elevació del màstil ni comprometre l'ancoratge.

El manual cita dos mesos en les indicacions d'ubicació i tres mesos en manteniment
per revisar el pluviòmetre. Adoptar una **revisió conservadora cada dos mesos**,
i després d'incidències, és una proposta local, no una cita única inequívoca.
Planificar-la amb accés segur. Les caselles marcades recullen només les
comprovacions declarades; no impliquen que tota la instal·lació compleixi el
manual ni que l'instrument estigui calibrat.
