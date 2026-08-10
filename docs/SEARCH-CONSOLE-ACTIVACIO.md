# Activació de Google Search Console

La base tècnica ja és dins del projecte: canòniques, metadades per pàgina, dades estructurades, `robots.txt` i `sitemap.xml`.

## Passos després de publicar V19

1. Obrir Google Search Console i crear una propietat de domini amb `fontanillas.cat` (sense `https://` ni cap ruta).
2. Copiar el registre TXT que dona Google a la zona DNS de Cloudflare.
3. Esperar la propagació i prémer «Verifica» a Search Console.
4. Obrir «Sitemaps» i enviar `https://meteo.fontanillas.cat/sitemap.xml`.
5. Inspeccionar la portada, Predicció, Centre de Dades, Aprendre i Privacitat.

La propietat de domini és preferible perquè cobreix protocol, `www` i subdominis. Si s’utilitza excepcionalment una propietat per prefix d’URL, es pot copiar només el valor del meta-tag a `googleSiteVerification` dins de `src/core/config.js`.

No cal afegir la verificació de Google al repositori si es fa per DNS. No és una clau secreta, però mantenir la verificació a Cloudflare evita carregar una etiqueta innecessària.
