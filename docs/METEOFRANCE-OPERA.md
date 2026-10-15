# Activació del radar europeu OPERA

## Estat

Météo-France ha confirmat que els compostos OPERA es distribueixen sota
CC-BY-4.0. La web ja identifica EUMETNET OPERA com a font europea oficial,
però no presenta una capa pròpia fins que el portal hagi activat l'accés i
se'n pugui validar el contracte tècnic real.

## Passos humans, sense compartir cap contrasenya

1. Crear el compte o iniciar sessió al portal d'API de Météo-France.
2. Obrir `https://portail-api.meteofrance.fr/web/fr/api/RadarOpera`.
3. Prémer **Souscrire à l’API gratuitement**.
4. Respondre al cas `T#169758` indicant només el nom d'usuari del portal.
5. Esperar la confirmació de Météo-France.

## Activació tècnica posterior

Quan Météo-France confirmi l'accés:

- validar `GetCapabilities` i els noms reals de capes, temps i cobertura;
- guardar la clau exclusivament com a secret de Cloudflare;
- servir les imatges mitjançant el Worker, sense exposar la clau al navegador;
- afegir la capa europea com a font diferenciada de Meteocat i RainViewer;
- atribuir **EUMETNET OPERA, CC-BY-4.0** i conservar sempre les fonts locals;
- provar disponibilitat, memòria cau i degradació segura abans de fer-la visible.

No s'ha d'inventar cap URL del servei ni publicar una capa buida abans de
rebre l'alta: el portal pot concretar un contracte diferent del d'AROME.
