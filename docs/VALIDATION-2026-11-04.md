# Validació de pendents — 4 de novembre de 2026

## Indexació i SEO

`npm run audit:seo` ha passat contra producció per a la portada, predicció,
avisos, centre de dades, història, resum i ruta editorial desconeguda. Comprova
metadades i la resposta 404/noindex de la ruta inexistent; no prova que Google
hagi indexat les pàgines.

Search Console mostra 55 URL no indexats i cap d'indexat. L'informe es va
actualitzar el 23 d'octubre, abans de diverses correccions. Desglossament:
40 descoberts sense indexar, 8 rastrejats sense indexar, 4 amb una canònica
diferent de la triada per Google, 2 duplicats sense canònica declarada i
1 alternativa amb canònica correcta. Els dos duplicats visibles són les
variants `http://fontanillas.cat/` i `https://fontanillas.cat/`. Els exemples
descoberts encara sense rastreig inclouen variants d'idioma i rutes antigues.
Cal revisar l'informe després d'un rastreig nou abans d'atribuir-hi cap regressió.

## Idiomes i accessibilitat

`npm run test:quick` ha passat (60 fitxers). La prova de navegador
`tests/browser/i18n-standalone.spec.mjs` ha passat (2 casos). La suite inclou
controls de traducció i accessibilitat del codi. Aquestes proves no equivalen a
una revisió editorial completa en català, castellà, anglès i francès ni a
una prova amb lector de pantalla en dispositius reals. Seguir la pauta de
[`SITE-AUDIT-2026-10-28.md`](SITE-AUDIT-2026-10-28.md) per tancar-les.

## Publicacions i incidència #299

La qualitat de GitHub del commit de fusió del PR #362 ha passat. També consten
correctes les execucions recents del workflow de YouTube Short del 4 de novembre
i del timelapse del 2 de novembre. Una execució correcta no acredita per si sola
la publicació a Instagram, Facebook i TikTok, ni exclou duplicats. La
[incidència #299](https://github.com/marcelfonta/observatori-fontanillas/issues/299)
continua oberta fins a comprovar per canal el proper dia programat. No s'ha
enviat cap publicació de prova.

## WhatsApp

El panell d'administració ja prepara el text i la imatge d'un esborrany aprovat
o publicat. La persona administradora confirma l'enviament al canal. Falten la
cadència, l'avís a l'administrador i una prova real controlada des d'un mòbil.
