# Meteo Fontanillas per a iPhone i Mac — fase privada

Aplicació nativa privada que acompanya la PWA i ofereix widgets de Meteo
Fontanillas a l'iPhone i al Mac. Tots dos targets comparteixen les mateixes
dades i components, però cada plataforma genera una app i una extensió pròpies.

## Què mostra

- Temperatura observada per l'estació Fontanillas.
- Condició prevista per a avui amb Open-Meteo.
- Màxima, mínima i probabilitat màxima de pluja prevista.
- Previsió dels quatre dies següents al format gran, amb símbol, màxima, mínima
  i probabilitat màxima de pluja de cada dia.
- Indicació explícita quan el Worker retorna l'última lectura fiable en mode
  degradat.

Inclou widgets en línia, circular i rectangular per a la pantalla bloquejada de
l'iPhone i ginys petit, mitjà i gran per a la pantalla d'inici. La versió nativa
de macOS ofereix els formats petit, mitjà i gran; el gran combina l'estació en
directe, el detall d'avui i els quatre dies següents. WidgetKit demana una
actualització cada vint minuts, però cada sistema decideix el moment efectiu.

Per evitar una targeta buida quan iOS dona poc temps a l'extensió, el widget
consulta una ruta lleugera amb l'última observació desada. Després d'una lectura
correcta també conserva localment durant un màxim de noranta minuts l'últim
snapshot vàlid. L'app principal demana explícitament a WidgetKit una renovació
quan acaba d'actualitzar-se correctament.

## Instal·lació privada

Cal un Mac amb la versió completa d'Xcode instal·lada i l'iPhone connectat:

1. Obre `MeteoFontanillas.xcodeproj` amb Xcode.
2. Selecciona el projecte i, a **Signing & Capabilities**, tria el teu equip a
   `MeteoFontanillas` i `MeteoFontanillasWidgetExtension`.
3. Si Xcode indica que l'identificador ja existeix, substitueix
   `cat.fontanillas.meteo` per un identificador propi i conserva `.widget` al
   final de l'extensió.
4. Connecta l'iPhone, selecciona'l com a destinació i prem **Run**.
5. A l'iPhone, mantén premuda la pantalla bloquejada i entra a
   **Personalitza → Pantalla bloquejada → Afegeix widgets → Meteo Fontanillas**.

## Instal·lació privada al Mac

1. Obre `MeteoFontanillas.xcodeproj` amb Xcode.
2. Selecciona l'esquema **MeteoFontanillas** i el teu Mac com a destinació.
3. Comprova que el teu equip estigui seleccionat als dos targets i prem
   **Run**. No cal activar **Ginys de l'iPhone**.
4. Obre l'app almenys una vegada. Després fes clic dret a l'escriptori, tria
   **Edita els ginys**, cerca **Meteo Fontanillas** i afegeix el format que
   prefereixis.

Aquest és un giny real de macOS: consulta les dades des del Mac i, quan es toca,
obre l'app nativa del Mac. No depèn de la Duplicació de l'iPhone.

No cal cap secret ni es modifica D1. Totes les peticions són GET a serveis
públics HTTPS.

## Comprovacions locals

El nucli de dades es pot provar sense executar l'app:

```sh
cd ios/MeteoFontanillas
swift test
```

La compilació i instal·lació a l'iPhone requereixen Xcode complet. Les Command
Line Tools, soles, no inclouen els SDK de WidgetKit per a iOS.

Cada PR que modifica aquesta carpeta conserva proves del nucli compartit i
comprova explícitament la configuració multiplataforma. La signatura personal i
la instal·lació física continuen sent un pas local i deliberat.
