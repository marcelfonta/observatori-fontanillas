# Auditoria del web · 28 d'octubre de 2026

## Producció

- `npm run audit:seo`: correcte a portada, predicció, avisos, Centre de Dades, una història, un resum mensual i una ruta editorial inexistent. Comprova metadades, canonical, JSON-LD, títol propi i 404 no indexable. No acredita que Google ja hagi indexat les pàgines; això s'ha de seguir a Search Console.
- Fonts dels visors consultades: Pla Alfa (GIF), XVPCA (JSON), cartografia IPE de setembre de 2026 (PNG), Copernicus Marine i MedusApp (HTML): totes han respost HTTP 200 el 28/10. Un HTTP 200 no prova que un iframe de tercers es pugui mostrar en tots els navegadors ni que el mapa sigui actual. La sequera administrativa de l'ACA continua separada de l'IPE.

## Previsualització local i accessibilitat

- 23 proves de navegador superades: estat i caducitat d'UV a 360, 390 i 1280 píxels, canvi d'idioma de pàgines independents i composició de portada. No hi ha desbordament horitzontal en els casos coberts.
- `npm run test:quick`: 60 fitxers correctes, incloent l'inventari de textos en català, castellà, anglès i francès. Les proves automàtiques no substitueixen una lectura editorial humana.
- Pauta pendent en dispositius reals: iPhone 15/16 Pro, un Android i ordinador; navegar amb teclat i lector de pantalla per menú lateral, pestanyes del visor, enllaços externs, gràfics, formularis i notificacions. Revisar contrast, focus visible, descripcions d'imatge, ordre de lectura i zoom al 200%. Llegir les quatre llengües a portada, predicció, Medi Ambient, Canvi climàtic, històries, resums i pàgines legals. Les traduccions legals requereixen revisió professional abans de considerar-les definitives.

## Referència climàtica oficial

L'[Atles Climàtic de Catalunya de Meteocat](https://www.meteo.cat/wpweb/climatologia/el-clima/atles-climatic/) cobreix 1991–2020. El [conjunt obert de mitjanes municipals](https://analisi.transparenciacatalunya.cat/Medi-Ambient/Atles-Clim-tic-de-mitjanes-per-municipi/9ehv-pmf5/data_preview) dona per a la capital municipal de Sant Celoni (codi 082021): temperatura mitjana anual 16,0 °C, màxima mitjana anual 21,3 °C, mínima mitjana anual 10,7 °C i precipitació mitjana anual 731,4 mm. Per a l'octubre, temperatura mitjana 17,1 °C i precipitació mitjana 101 mm. Consulta de l'API oficial el 28/10/2026.

És una referència territorial de la capital municipal, no una normal calculada a la ubicació ni amb l'instrumental Fontanillas. El valor de precipitació mensual és una mitjana de mesos complets: no serveix per valorar la pluja d'un dia ni un mes encara en curs. No calculem un «índex de normalitat» ni una anomalia sense estudiar coordenades, altitud, període, cobertura, homogeneïtzació i mètode de comparació. La pàgina de canvi climàtic només mostra el context anual i aquest límit.

## Seguiment

El PR #343 es va fusionar el 28/10/2026 (`7cea30a`). La ruta pública `/canvi-climatic` ja retorna HTTP 200 amb els valors 16,0 °C i 731,4 mm i l'enllaç a l'Atles. `npm run audit:seo` va tornar a passar en producció després de la fusió. Aquest PR només canviava la web; no hi havia res a instal·lar al Worker ni a la Raspberry.

Continua pendent la lectura visual en dispositius reals i en els quatre idiomes, així com observar a Search Console l'estat real d'indexació. Revisar el visor de l'ACA quan acabi el manteniment i actualitzar l'IPE només quan Meteocat publiqui el mes següent.
