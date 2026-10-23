# Bloc 8 — qualitat tècnica

Data: 23 d’octubre de 2026

## Tipografies pròpies

DM Sans i Manrope es distribueixen des del mateix domini en WOFF2, amb un
subconjunt llatí i un de llatí ampliat per família. Els quatre fitxers ocupen
aproximadament 93 KiB en total i cobreixen tots els pesos que ja utilitzava el
portal mitjançant fonts variables:

- DM Sans: pesos 400–700;
- Manrope: pesos 500–800.

Les llicències SIL Open Font License 1.1 es conserven al costat dels fitxers.
S’han eliminat de l’HTML i de la CSP les connexions a `fonts.googleapis.com` i
`fonts.gstatic.com`. Es manté `font-display: swap`. No es precàrreguen fonts:
fer-ho competiria amb el CSS i la dada meteorològica crítica; qualsevol preload
futur s’haurà de justificar amb una mesura de camp.

## Mode sense connexió

El portal ja conserva a la memòria cau l’app shell i les respostes correctes de
l’API, i també conserva localment l’última observació i previsió que utilitza la
interfície. El banner ara:

- diferencia falta de xarxa d’una incidència temporal del servei;
- mostra l’antiguitat de la lectura desada;
- permet reintentar sense recarregar tota la pàgina;
- usa `role=status` i `aria-live=polite` per no interrompre el lector de
  pantalla cada vegada que canvia una dada.

El canvi renova la versió del service worker i inclou les fonts en l’app shell.

## Validació repetible

`tests/technical-quality.mjs` impedeix regressions en fonts, llicències, CSP,
cache i banner offline. La suite de navegador continua cobrint vista mòbil i
ordinador amb Chromium. La validació física en iPhone i Android i la passada
manual completa amb VoiceOver/TalkBack continuen sent comprovacions de
desplegament: una emulació no es documenta com si fos un dispositiu real.

## Pendent de dades de camp

Core Web Vitals només es podrà contrastar quan Search Console disposi de prou
trànsit. Cal repetir Lighthouse després del desplegament i separar el cost propi
del dels mapes i iframes de tercers.
