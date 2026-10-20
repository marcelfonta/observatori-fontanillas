# Línia base de rendiment web · 20 d’octubre de 2026

## Objectiu i mètode

Mesura de laboratori sobre la web pública amb Lighthouse 12.8.2 i Google
Chrome, en una càrrega nova per pàgina. S’han auditat sis entrades en perfil
mòbil i d’escriptori:

- portada;
- Predicció (`?page=prediccio`);
- Radar (`?page=radar`);
- Terra (`?page=terra`);
- Avisos (`?page=avisos`);
- Models francesos (`models-franca.html`).

Ordre de les puntuacions: rendiment, accessibilitat, bones pràctiques i SEO.
FCP, LCP i TBT són mil·lisegons; CLS no té unitats. Els resultats són una línia
base reproduïble, no Core Web Vitals de camp. INP requereix interaccions reals i
trànsit suficient.

## Resultats

| Perfil | Entrada | Puntuacions | FCP | LCP | TBT | CLS | Transferència | Peticions |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mòbil | Portada | 91 / 95 / 75 / 100 | 2.733 | 2.733 | 49 | 0,007 | 1.770 KB | 89 |
| Mòbil | Predicció | 97 / 94 / 75 / 100 | 2.054 | 2.054 | 0 | 0,034 | 1.648 KB | 83 |
| Mòbil | Radar | 49 / 94 / 71 / 100 | 2.352 | 8.113 | 0 | 0,674 | 1.793 KB | 87 |
| Mòbil | Terra | 98 / 94 / 71 / 100 | 1.902 | 1.902 | 0 | 0,033 | 2.203 KB | 86 |
| Mòbil | Avisos | 98 / 93 / 75 / 100 | 1.869 | 1.869 | 0 | 0,026 | 2.783 KB | 118 |
| Mòbil | Models francesos | 71 / 91 / 100 / 100 | 2.427 | 10.525 | 1 | 0,006 | 1.552 KB | 40 |
| Escriptori | Portada | 95 / 95 / 78 / 100 | 1.055 | 1.216 | 0 | 0,039 | 1.546 KB | 86 |
| Escriptori | Predicció | 99 / 93 / 78 / 100 | 806 | 806 | 0 | 0,025 | 1.425 KB | 80 |
| Escriptori | Radar | 69 / 94 / 78 / 100 | 920 | 2.647 | 0 | 0,311 | 2.106 KB | 106 |
| Escriptori | Terra | 94 / 94 / 74 / 100 | 1.051 | 1.318 | 0 | 0,058 | 2.298 KB | 105 |
| Escriptori | Avisos | 99 / 93 / 78 / 100 | 780 | 780 | 0 | 0,046 | 2.704 KB | 123 |
| Escriptori | Models francesos | 75 / 91 / 100 / 100 | 783 | 3.022 | 0 | 0,167 | 1.855 KB | 51 |

## Diagnòstic

## Revalidació després de les millores

Mesura repetida el 20 d’octubre de 2026, amb la mateixa versió de Lighthouse,
els mateixos perfils i una càrrega nova per pàgina. Entre totes dues rondes es
van desplegar la marca lleugera, l’estabilització del Radar, l’optimització dels
Models francesos, les correccions d’accessibilitat pròpia i la memòria cau de
24 hores de les capes immutables de Météo-France.

| Perfil | Entrada | Puntuacions | FCP | LCP | TBT | CLS | Transferència | Peticions |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mòbil | Portada | 97 / 100 / 75 / 100 | 1.963 | 1.963 | 67 | 0,007 | 822 KB | 89 |
| Mòbil | Predicció | 98 / 100 / 75 / 100 | 1.955 | 1.955 | 0 | 0,034 | 629 KB | 83 |
| Mòbil | Radar | 74 / 100 / 71 / 100 | 1.956 | 7.075 | 0 | 0,033 | 900 KB | 87 |
| Mòbil | Terra | 98 / 100 / 71 / 100 | 1.849 | 1.849 | 0 | 0,033 | 1.333 KB | 86 |
| Mòbil | Avisos | 98 / 100 / 75 / 100 | 1.884 | 1.884 | 0 | 0,026 | 1.895 KB | 118 |
| Mòbil | Models francesos | 72 / 100 / 100 / 100 | 2.418 | 7.413 | 0 | 0,006 | 613 KB | 40 |
| Escriptori | Portada | 98 / 100 / 78 / 100 | 792 | 916 | 0 | 0,038 | 667 KB | 86 |
| Escriptori | Predicció | 97 / 100 / 78 / 100 | 951 | 951 | 0 | 0,032 | 538 KB | 81 |
| Escriptori | Radar | 89 / 100 / 78 / 100 | 775 | 2.120 | 0 | 0,038 | 1.202 KB | 106 |
| Escriptori | Terra | 97 / 100 / 74 / 100 | 858 | 970 | 0 | 0,058 | 1.651 KB | 108 |
| Escriptori | Avisos | 92 / 100 / 78 / 100 | 1.062 | 1.410 | 0 | 0,077 | 1.815 KB | 117 |
| Escriptori | Models francesos | 77 / 100 / 100 / 100 | 875 | 2.652 | 0 | 0,167 | 955 KB | 51 |

La transferència baixa entre un 32 % i un 62 % a les entrades mòbils. Radar
passa de 49 a 74 punts de rendiment i el seu CLS baixa de 0,674 a 0,033. La
portada passa de 91 a 97 i totes les entrades arriben a 100 d’accessibilitat.
Models francesos redueix l’LCP mòbil de 10,5 a 7,4 segons, però encara no
compleix l’objectiu de 4 segons. Aquesta capa inicial és l’únic coll d’ampolla
propi prioritari que queda; el LCP mòbil del Radar depèn de les rajoles externes
i ja no provoca inestabilitat visual.

**Tancament posterior del paquet de Models francesos:** la capa AROME inicial i
Leaflet ara es demanen des de la capçalera, mentre el catàleg es resol en
paral·lel. La imatge mòbil passa de 960 × 544 a 720 × 408, suficient per a la
mida de presentació, i baixa de 62 a 42 KB. Tres execucions Lighthouse 12.8.2
sobre la previsualització comprimida de Cloudflare han donat LCP de `2.807`,
`2.591` i `2.951` ms, rendiment de `90`, `93` i `89`, CLS `0,006` i
accessibilitat `100`. El criteri de ≤ 4 segons queda complert.

### P0 · Radar inestable durant la càrrega

El Radar és l’única secció amb rendiment mòbil pobre i CLS crític. Lighthouse
identifica una rajola de Leaflet com a LCP. El contenidor i el mapa canvien de
geometria durant la inicialització: CLS 0,674 en mòbil i 0,311 en escriptori.

**Acció següent:** reservar la geometria final abans d’iniciar Leaflet, mantenir
la reserva durant els estats de càrrega/error i revisar el salt causat per
l’activació directa de `?page=radar`. Criteri: CLS ≤ 0,10 en tres execucions
consecutives, sense empitjorar l’ús tàctil.

**Resolució del 20 d’octubre:** la selecció inicial de ruta ara amaga la webcam
i fixa la columna única abans del primer pintat. Tres execucions mòbils locals
amb Lighthouse 12.8.2 han donat `0,0328`, `0,0328` i `0,0328` de CLS. La prova
de navegador també valida la reserva mínima del mapa i el mateix límit de
`0,10`. El P0 de geometria queda resolt; l’LCP de la capa externa es tractarà
separadament i no es dedueix d’aquesta comparació local.

### P0 · Imatge de marca desproporcionada

`observatori-fontanillas-avatar-v21.png` és una imatge de 1024 × 1024 i uns
888 KB, però la capçalera la mostra a 40–52 px. És el recurs individual més
pesant de la portada i de les seccions internes. A més, la instal·lació del
service worker desa aquesta imatge i les icones PWA de 192 i 512 px.

**Acció següent:** servir una variant pròxima a la mida de presentació i evitar
precargar actius de marca grans que no siguin necessaris per a la consulta
bàsica offline. Criteri: estalvi mínim de 750 KB en una primera visita, sense
perdre nitidesa ni trencar les icones instal·lables.

### P1 · Capa inicial dels Models francesos

La imatge meteorològica AROME és l’LCP: 10,5 s en mòbil i 3,0 s en escriptori.
La interfície respon aviat i el TBT és pràcticament zero, però una capa que
arriba tard substitueix l’element principal de pintura.

**Acció següent:** iniciar abans la petició de la capa inicial o presentar una
reserva estable i informativa que no bloquegi la lectura del producte. Criteri:
LCP mòbil ≤ 4,0 s en tres execucions, mantenint la degradació segura quan
Météo-France no respon.

### P1 · Cost extern dels Avisos i de Terra

Avisos transfereix uns 2,8 MB i 118 peticions en mòbil. Una part important
prové del giny de Meteocat i dels seus gestors d’etiquetes. Terra transfereix
uns 2,2 MB, inclosa una capa EUMETSAT d’uns 420 KB. Tot i així, FCP, LCP i CLS
són bons perquè aquests recursos només es carreguen dins la secció visitada.

**Decisió:** no bloquejar funcionalitat ni copiar dades externes només per reduir
la puntuació. Es revisaran després dels dos P0, diferenciant clarament recursos
propis i de tercers.

### P1 · Accessibilitat i bones pràctiques

Els avisos repetits són atributs ARIA incomplets, etiquetes visibles que no
coincideixen amb el nom accessible, enllaç de salt no enfocable i text massa
petit en algunes zones. Models francesos també conté controls enfocables dins un
element `aria-hidden`. Les penalitzacions de galetes i incidències de navegador
provenen principalment de tercers.

**Acció següent:** fer una correcció pròpia d’ARIA, focus, enllaç de salt i mida
de text; documentar per separat el que només pot resoldre el proveïdor extern.

**Resolució del 20 d’octubre:** el cercador declara l’estat inicial del
desplegable, el salt de teclat apunta sempre al contingut principal, la webcam
pren el nom accessible del seu estat visible i el mapa de models ja no amaga
controls enfocables als lectors de pantalla. Lighthouse d’accessibilitat passa
de `96` a `100` a la portada i de `91` a `100` als Models francesos. Les
incidències de tercers continuen separades de les correccions pròpies.

## Ordre d’execució

1. Fet: reduir l’actiu de marca carregat a totes les pàgines.
2. Fet: estabilitzar la geometria del Radar i repetir la matriu Radar.
3. Fet: avançar i emmagatzemar la capa inicial dels Models francesos, amb LCP
   mòbil inferior a 4 segons en tres execucions consecutives.
4. Fet: corregir l’accessibilitat pròpia.
5. Fet: tornar a mesurar les sis entrades i comparar-les amb la línia base.
6. Pendent: afegir Core Web Vitals de camp quan Search Console tingui prou
   mostra.

## Reproducció

Exemple de la portada mòbil:

```sh
npx --yes lighthouse@12.8.2 https://meteo.fontanillas.cat/ \
  --only-categories=performance,accessibility,seo,best-practices \
  --output=json --output-path=./lighthouse-home-mobile.json \
  --quiet --chrome-flags='--headless --no-sandbox' --preset=perf
```

Per a escriptori es repeteix amb `--preset=desktop`. Cal conservar la versió de
Lighthouse, la URL, el perfil i la data per poder comparar resultats.
