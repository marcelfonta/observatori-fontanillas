# Predicció vs realitat · primer tall de 30 dies

20/09/2026 · Revisió prèvia al trentè cas. Consulta de només lectura a producció;
no modifica prediccions, observacions, estació, Worker ni publicadors.

## Estat abans del tall

La consulta de les 18:15 Europe/Madrid retorna **29 pronòstics de demà
verificats** i 189 comparacions entre tots els horitzons. Si el cas següent és
complet, el 21/09 s'assolirà el primer tall de 30 dies. El Worker ja canvia
automàticament l'estat de «Mostra en creixement» a «Mostra consolidada» quan
`sampleDays >= 30`; no cal una actuació manual per activar-lo.

Resum comparable de l'endemà, sempre desat el dia anterior:

| Indicador | Resultat a 29 dies | Lectura prudent |
| --- | ---: | --- |
| Error absolut mitjà de temperatura | 2,7 °C | És una línia base inicial; encara no justifica una correcció. |
| Biaix de temperatura combinat | −0,5 °C | Màxima i mínima poden compensar-se; cal publicar-les separadament abans d'interpretar-lo. |
| Encert binari de pluja | 86% | La mostra només té 3 dies plujosos i 26 de secs; el percentatge està dominat pels dies secs. |
| Brier de probabilitat de pluja | 0,020 | Resultat inicial bo, però amb poca varietat d'episodis de pluja. |
| Error absolut mitjà de ratxa | 9,3 km/h | Útil per seguir tendència; exposició i diferències de representativitat encara compten. |

Els altres horitzons tenen quantitats i períodes diferents. No és vàlid
concloure que un horitzó és millor només perquè la seva xifra agregada sigui
més baixa: cal comparar els mateixos dies i conservar la dependència temporal.

## Què permet fer ara

- Fixar una primera línia base pública i reproduïble.
- Detectar tendències inicials i problemes de cobertura.
- Fer seguiment a 60 i 90 dies sense reescriure el tall anterior.
- Usar el resultat com a comparador d'avaluació de Fonta, no com a permís per
  ajustar i validar sobre els mateixos casos.

## Què encara no permet

- Certificar la previsió, l'estació o una precisió anual.
- Restar o sumar un offset automàtic a temperatura, pluja o vent.
- Avaluar bé episodis plujosos amb només tres dies positius.
- Separar error de model, microclima local i exposició sobre teules.
- Generalitzar a altres estacions, estacions de l'any o al Baix Montseny sencer.

## Següent revisió tècnica

1. Publicar MAE i biaix separats per màxima i mínima per evitar cancel·lacions.
2. Repetir el tall als 60 i 90 dies, conservant els resultats desfavorables.
3. Informar sempre dies plujosos/secs i cobertura; un buit no és zero.
4. Estratificar només quan hi hagi prou casos per pluja, vent i insolació.
5. Qualsevol candidat d'ajust s'ha de validar després en dades futures separades.

El llindar de 30 dies és una fita de seguiment del projecte, no un estàndard
oficial ni una garantia d'exactitud.
