# Meteo Fontanillas per al fēnix 7X Pro

Widget Connect IQ privat per a `fenix7xpro` i `fenix7xpronowifi`. La vista ràpida
mostra la temperatura observada i l'antiguitat de la lectura; en obrir-la es
veuen també la humitat, el vent i la pluja acumulada avui. Les dades provenen
exclusivament de l'endpoint públic de l'Observatori
`/widget-observation`. No s'hi presenta cap predicció com si fos una mesura.

El widget només consulta dades quan es mostra, amb un màxim d'una consulta cada
cinc minuts. Conserva l'última lectura al rellotge. A partir de 30 minuts (o
quan la font la marca degradada) indica «Darrera lectura»; després de 90 minuts
no mostra cap xifra com a actual. Sense cap lectura diu «Sense dades recents».
No utilitza secrets, ubicació ni permisos de sensors; només `Communications`.

## Compilació i prova privada

Cal instal·lar [Connect IQ SDK Manager](https://developer.garmin.com/connect-iq/sdk/)
i el dispositiu `fenix7xpro` al SDK. Cal també una clau de desenvolupador
privada, que **no** s'ha de desar en aquest repositori. Obre aquest directori
amb l'extensió Monkey C de VS Code i prova la vista `fenix7xpro` al simulador.
La [guia oficial de Garmin](https://developer.garmin.com/connect-iq/connect-iq-basics/your-first-app/)
explica com generar la clau i usar «Build for Device». Per instal·lar-la al
rellotge, connecta'l per USB, compila per al seu identificador i copia el fitxer
`.prg` generat a `GARMIN/APPS`. Cal provar tant la vista ràpida com la completa,
amb i sense connexió al mòbil.

El 26/10/2026 s'ha compilat amb l'SDK 9.3.0 per a `fenix7xpro` i
`fenix7xpronowifi`. El simulador `fenix7xpro` mostra correctament les dues
vistes amb una lectura recent. Els fitxers `.prg` signats es generen a `build/`,
carpeta ignorada per Git. La clau privada és externa al repositori; s'ha de
conservar per a les actualitzacions. La instal·lació física i la prova sense
connexió continuen pendents.

La publicació a Connect IQ Store requeriria un paquet `.iq`, una fitxa i revisió
separades. Aquest projecte no modifica el Worker ni la web, i no s'ha publicat.
