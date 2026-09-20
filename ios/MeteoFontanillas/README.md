# Meteo Fontanillas per a iPhone — fase privada

Primera aplicació nativa privada que acompanya la PWA i ofereix widgets de
Meteo Fontanillas a la pantalla bloquejada de l'iPhone.

## Què mostra

- Temperatura observada per l'estació Fontanillas.
- Condició prevista per a avui amb Open-Meteo.
- Màxima, mínima i probabilitat màxima de pluja prevista.
- Indicació explícita quan el Worker retorna l'última lectura fiable en mode
  degradat.

Inclou widgets en línia, circular i rectangular per a la pantalla bloquejada i
un widget petit per a la pantalla d'inici. El widget demana una actualització
cada vint minuts, però iOS decideix el moment efectiu de refresc.

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

Cada PR que modifica aquesta carpeta també executa una compilació sense
signatura en un simulador d'iPhone mitjançant GitHub Actions. La signatura
personal i la instal·lació física continuen sent un pas local i deliberat.
