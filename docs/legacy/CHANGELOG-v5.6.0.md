# CHANGELOG — Observatori Meteorològic Fontanillas v5.6.0

**Data:** 5 d'agost de 2026  
**Versió anterior:** 5.5.1  
**Versió nova:** 5.6.0  
**Repositori:** meteo.fontanillas.cat

---

## Resum executiu

La versió 5.6.0 corregeix un error de zona horària crític al backend, millora la seguretat amb capçaleres CSP, implementa el mode sense connexió per al frontend, i optimitza l'ús de l'API de Weather Underground. No hi ha canvis visuals a la interfície d'usuari (excepte el nou banner offline).

---

## Canvis al Worker (`worker/fonta-meteo-worker-v5.6.0.js`)

### 🐛 Correcció crítica: agrupació horària en UTC → hora local (Madrid)

**Problema:** La consulta SQL d'historial per hores usava:
```sql
strftime('%Y-%m-%dT%H', observed_epoch, 'unixepoch') as hour_key
```
Això agrupa per hora UTC. Espanya és UTC+1 (CET, octubre–març) o UTC+2 (CEST, abril–octubre), de manera que els buckets horaris al frontend apareixien desplaçats 1 o 2 hores.

**Solució:** Afegida la funció `madridOffsetSeconds()` que calcula l'offset de `Europe/Madrid` dinàmicament amb `Intl.DateTimeFormat` i l'aplica a la query com a paràmetre bind:
```sql
strftime('%Y-%m-%dT%H', observed_epoch + ?, 'unixepoch') as hour_key
```
L'offset canvia automàticament entre CET (+3600 s) i CEST (+7200 s) sense cap intervenció manual.

---

### 🔒 Rate limiting al formulari de contacte (`/contact`)

**Problema:** L'endpoint `POST /contact` no tenia cap limitació de velocitat; qualsevol IP podia fer spam.

**Solució:** Nova taula D1 `contact_rate_limit (ip, email, sent_at)` amb els límits:
- Màxim **3 enviaments per IP** en la darrera hora
- Màxim **5 enviaments per email** en les darreres 24 hores
- En superar el límit: resposta `429 Too Many Requests` amb el missatge `"Massa sol·licituds. Torna-ho a provar més tard."`
- Els registres de més de 24 hores s'esborren automàticament a cada enviament

**Acció requerida al desplegament:** Executar a D1 (o deixar que el Worker ho faci en arrencar):
```sql
CREATE TABLE IF NOT EXISTS contact_rate_limit (
  ip TEXT NOT NULL,
  email TEXT NOT NULL,
  sent_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contact_rate_limit_sent_at ON contact_rate_limit(sent_at);
```
> El Worker ho crea automàticament a `schemaReady()` si no existeix.

---

### 🔐 Capçaleres de seguretat a totes les respostes

Afegides a totes les respostes del Worker:

| Capçalera | Valor |
|---|---|
| `Content-Security-Policy` | `default-src 'none'` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

---

### 🆕 Nou endpoint `/version`

`GET /version` retorna:
```json
{
  "version": "5.6.0",
  "built": "2026-08-05",
  "env": "production"
}
```
Útil per verificar quin Worker està actiu sense mirar el dashboard de Cloudflare.

---

### ⚡ Optimització de `/quality` (estalvi de crides a WU)

**Problema:** L'endpoint de diagnòstic `/quality` cridava sempre `currentObservation()` (una trucada a l'API de Weather Underground), cosa que consumia Worker Units innecessàriament.

**Solució:** Ara `/quality` consulta primer D1. Si hi ha una observació de fa menys de **5 minuts**, la usa directament sense cridar WU. La resposta inclou el camp `source: "cache" | "api"` per indicar l'origen.

---

## Canvis al Frontend

### 📴 Mode sense connexió amb dades de localStorage (`js/api.js`, `js/app.js`)

**Problema:** Si el Worker no responia, la web mostrava `—` a totes les mètriques.

**Solució:**
- Quan les dades del Worker es carreguen correctament, es desen a `localStorage` amb la clau `fontanilles-last-obs` (incloent un timestamp).
- Si la crida al Worker falla (error de xarxa, 5xx), el frontend llegeix les dades del localStorage (si tenen menys de 6 hores) i les renderitza.
- El banner `#offline-banner` es mostra amb el text: *"Mostrant dades de fa X min (mode sense connexió)"*
- El banner es desactiva quan les dades es tornen a carregar correctament.

---

### 🔔 Banner offline (`index.html`, `css/style.css`)

Nou element HTML:
```html
<div id="offline-banner" hidden role="alert" class="offline-banner">
  Mostrant dades de la darrera lectura disponible. Comprova la connexió.
</div>
```
El text es personalitza dinàmicament amb l'edat real de les dades en cache.

---

### ♿ Millores d'accessibilitat (`index.html`)

Afegit `aria-live="polite"` als elements de temperatura actual, resum de situació i franja de predicció, de manera que els lectors de pantalla anuncien les actualitzacions automàtiques.

---

### 🌐 Capçaleres CSP a Cloudflare Pages (`_headers`)

Afegida la capçalera `Content-Security-Policy` completa a la secció `/*`:
- Permet iframes de: Meteocat, AEMET, El Tiempo, Yr.no, Meteoblue, Windy, YouTube
- Permet scripts de: `cdn.jsdelivr.net`, `unpkg.com`, `ca.eltiempo.es`
- Permet connexions a: Worker API, Open-Meteo, USNO, RainViewer
- `default-src 'none'` per a la resta (política restrictiva per defecte)

---

### 📲 PWA: separació de propòsits d'icones (`site.webmanifest`)

**Problema:** El manifest usava `"purpose": "any maskable"` combinat (forma deprecada).

**Solució:** Cada icona es declara dues vegades: una amb `"purpose": "any"` i una altra amb `"purpose": "maskable"`, tal com requereix la especificació W3C vigent.

---

### 🔄 Service Worker: estratègia stale-while-revalidate (`service-worker.js`)

El Service Worker ara implementa *stale-while-revalidate* per a les crides a l'API del Worker (`fonta-meteo.marcelfonta.workers.dev`):
1. Si hi ha resposta en cache, la retorna immediatament (ràpid).
2. Al mateix temps, actualitza la cache en background.
3. Les respostes de l'API es guarden al bucket `fontanilles-api-v1` amb TTL de 30 minuts.

Avantatge: si l'usuari obre la web amb connexió dolenta o offline, veu les dades de la visita anterior en comptes d'una pàgina en blanc.

---

## Instruccions de desplegament

### Pas 1: Desplegar el Worker nou a Cloudflare

1. Obre el **Cloudflare Dashboard** → Workers & Pages → `fonta-meteo`
2. Edita el Worker i **substitueix tot el codi** pel contingut de `worker/fonta-meteo-worker-v5.6.0.js`
3. Fes clic a **Save & Deploy**
4. Verifica que funciona:
   ```
   GET https://fonta-meteo.marcelfonta.workers.dev/version
   → {"version":"5.6.0","built":"2026-08-05","env":"production"}
   ```

> ⚠️ La taula `contact_rate_limit` es crearà automàticament en la primera execució del Worker.  
> ⚠️ No cal modificar el binding D1 ni les variables d'entorn existents.

### Pas 2: Desplegar el frontend a Cloudflare Pages

El frontend es desplega automàticament via `git push`:

```bash
cd /ruta/al/teu/repositori
git add -A
git commit -m "feat: v5.6.0 — mode offline, CSP, webmanifest, service worker stale-while-revalidate"
git push origin main
```

Cloudflare Pages detectarà el push i desplegarà automàticament en 1–2 minuts.

### Pas 3: Verificació post-desplegament

| Verificació | Com comprovar |
|---|---|
| Worker correcte | `GET /version` → `{"version":"5.6.0"}` |
| CSP activa | DevTools → Network → Headers de `index.html` |
| Webmanifest correcte | DevTools → Application → Manifest → cap error de `purpose` |
| Mode offline | DevTools → Network → posar en mode Offline i recarregar |
| Capçaleres Worker | `curl -I https://fonta-meteo.marcelfonta.workers.dev/` → veure CSP, X-Frame-Options |
| Rate limiting | Enviar >3 missatges seguits → ha d'aparèixer error 429 |
| Agrupació horària | A la secció Gràfiques, verificar que les hores coincideixen amb l'hora local |

---

## Fitxers modificats

| Fitxer | Tipus de canvi |
|---|---|
| `worker/fonta-meteo-worker-v5.6.0.js` | **NOU** — Worker complet v5.6.0 |
| `js/api.js` | Modificat — localStorage caching + `getLastCachedObs()` |
| `js/app.js` | Modificat — mode offline, banner, import `getLastCachedObs` |
| `index.html` | Modificat — `#offline-banner`, `aria-live` |
| `_headers` | Modificat — CSP completa |
| `site.webmanifest` | Modificat — icon purposes separats |
| `service-worker.js` | Modificat — stale-while-revalidate per a l'API |
| `css/style.css` | Modificat — estils `.offline-banner` |

**Fitxer NO modificat:** `worker/fonta-meteo-worker-v5.5.1.js` (conservat intacte com a referència).

---

## Pròximes versions (roadmap)

### v5.7 — Rendiment i càrrega progressiva
- Skeleton loading states per a les mètriques principals (eliminar els `—` inicials)
- Prioritat de càrrega: dades actuals → avisos → predicció → historial → astronomia/radar
- IntersectionObserver per a les seccions pesades (radar, Windy) — algunes ja implementades via `initWhenVisible`

### v5.8 — Experiència avançada
- Gràfiques comparatives any anterior (si D1 té prou historial)
- Mode fosc/clar amb preferència del sistema
- Notificacions push per avisos de temps sever (requereix backend addicional)

---

*Document generat automàticament per l'Abacus AI Agent · Projecte Meteo Fonta*
