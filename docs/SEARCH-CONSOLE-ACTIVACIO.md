# Activació de Google Search Console

La base tècnica ja és dins del projecte: canòniques, metadades per pàgina, dades estructurades, `robots.txt` i `sitemap.xml`.

## Estat completat — 10 d’agost de 2026

- Propietat de domini `fontanillas.cat` verificada per DNS a Cloudflare.
- Sitemap `https://meteo.fontanillas.cat/sitemap.xml` processat correctament.
- 13 URL descobertes per Google.
- Portada enviada a la cua d’indexació prioritària.

## Procediment de referència

1. Obrir Google Search Console i crear una propietat de domini amb `fontanillas.cat` (sense `https://` ni cap ruta).
2. Copiar el registre TXT que dona Google a la zona DNS de Cloudflare.
3. Esperar la propagació i prémer «Verifica» a Search Console.
4. Obrir «Sitemaps» i enviar `https://meteo.fontanillas.cat/sitemap.xml`.
5. Inspeccionar la portada, Predicció, Centre de Dades, Aprendre i Privacitat.

La propietat de domini és preferible perquè cobreix protocol, `www` i subdominis. Si s’utilitza excepcionalment una propietat per prefix d’URL, es pot copiar només el valor del meta-tag a `googleSiteVerification` dins de `src/core/config.js`.

No cal afegir la verificació de Google al repositori si es fa per DNS. No és una clau secreta, però mantenir la verificació a Cloudflare evita carregar una etiqueta innecessària.

No s’ha d’eliminar el registre DNS de verificació. Search Console pot trigar dies o setmanes a mostrar rendiment, indexació completa i Core Web Vitals de camp.
