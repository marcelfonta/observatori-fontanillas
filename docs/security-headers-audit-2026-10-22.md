# Auditoria de capçaleres de seguretat — 22 d’octubre de 2026

## Resultat extern

El domini de producció `meteo.fontanillas.cat` s’ha analitzat amb
[MDN HTTP Observatory](https://developer.mozilla.org/en-US/observatory/analyze?host=meteo.fontanillas.cat)
després del desplegament del paquet de dades obertes.

| Camp | Resultat |
| --- | --- |
| Data UTC | 2026-10-22 19:02:21 |
| Motor | MDN HTTP Observatory, algoritme 6 |
| Identificador de l’escaneig | `130171905` |
| Qualificació | **A+** |
| Puntuació | **115/115** |
| Controls | **12 superats, 0 fallits** |
| Estat HTTP | 200 |

Resposta resumida de l’API pública:

```json
{
  "id": 130171905,
  "algorithm_version": 6,
  "scanned_at": "2026-10-22T19:02:21.852Z",
  "grade": "A+",
  "score": 115,
  "status_code": 200,
  "tests_failed": 0,
  "tests_passed": 12,
  "tests_quantity": 12
}
```

## Decisió

No es modifiquen capçaleres que ja superen tots els controls només per afegir
directives genèriques. Es mantenen, entre d’altres, CSP, HSTS, protecció MIME,
política de permisos i política de referència.

HSTS continua com `max-age=31536000`, sense `includeSubDomains` ni `preload`.
Aquestes dues opcions poden afectar de manera duradora altres serveis del domini
i només s’activaran després d’inventariar i auditar tots els subdominis.

El resultat A+ no certifica tota la seguretat de l’aplicació: no substitueix les
proves d’autorització, validació, dependències, secrets o lògica del Worker. El
canal públic per comunicar vulnerabilitats continua sent
`/.well-known/security.txt`, que deriva al formulari protegit.

## Repetició de la prova

```sh
curl -X POST 'https://observatory-api.mdn.mozilla.net/api/v2/scan?host=meteo.fontanillas.cat'
```

Cal repetir-la després de modificar `_headers`, canviar de plataforma o afegir
un nou origen a la política CSP.
