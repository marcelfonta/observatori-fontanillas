# Roadmap viu

Actualitzat el 20 d’octubre de 2026. Aquest document conté únicament feina
pendent i decisions encara obertes. Les fases completades es documenten a
[`CHANGELOG.md`](CHANGELOG.md), als informes de `docs/` i a l’historial Git.

## Regles de treball

- No activar correccions, avisos ni publicacions noves només perquè el codi
  estigui preparat: primer cal una mostra real i una validació observable.
- No reconstruir prediccions passades per millorar artificialment els resultats.
- Observació, predicció, context i avís oficial han de continuar clarament
  separats.
- Cap font nova rep pes al model Fonta sense dades prospectives comparables.
- Les actuacions que requereixen comptes, credencials, dispositius o una decisió
  editorial es tanquen només amb confirmació humana.

## P0 — Validació operativa real

### Confiança multimodel

- [ ] Revisar de nou els resultats als 60 i 90 dies, separant temperatura màxima,
  temperatura mínima i pluja, abans de modificar els pesos locals.
- [ ] Exigir més dies amb pluja abans de concloure quin model resol millor la
  precipitació a Sant Celoni.

### Publicació social i timelapse

- [ ] Confirmar en una jornada real que el timelapse arriba a tots els canals
  habilitats, especialment TikTok, sense duplicats i mantenint el màxim d’una
  publicació de timelapse al dia.
- [ ] Validar una franja automàtica completa de Meta abans de considerar
  prescindibles els controls manuals de recuperació.

### Avisos i dispositius

- [ ] Confirmar una notificació OneSignal real amb la web tancada o en segon pla
  en, com a mínim, un mòbil i un ordinador subscrits.
- [ ] Verificar durant un avís oficial actiu que territori, nivell, vigència i
  enllaç oficial es mostren correctament.

## P1 — Nowcasting local en mode d’ombra

- [ ] Mesurar durant episodis reals la disponibilitat, continuïtat temporal i
  qualitat dels fotogrames futurs de radar.
- [ ] Preparar un circuit d’ombra que contrasti radar, llamps, satèl·lit i un
  model d’alta resolució sense mostrar hores d’arribada ni enviar avisos.
- [ ] Definir una mètrica prospectiva d’error i uns mínims de cobertura abans de
  provar trajectòries o probabilitats locals.
- [ ] Demanar una autorització específica abans de convertir qualsevol resultat
  experimental en avís o publicació automàtica.

## P1 — Model Fonta i qualitat de l’estació

- [ ] Avaluar AROME HD i AROME France sobre els mateixos dies prospectius abans
  de decidir una nova versió del model Fonta.
- [ ] Activar el pilot regional XEMA només després d’una captura manual
  verificada i d’un pla de validació temporal amb una estació deixada fora.
- [ ] Aclarir amb Meteocat les condicions de reutilització XEMA abans de mostrar
  lectures per estació, redistribuir originals o publicar un producte derivat.
- [ ] Comprovar ventilació, altura sobre el terreny i altitud de l’estació, i
  executar el protocol de comparació independent quan hi hagi una referència i
  accés segur.
- [ ] Acumular prou dies de comparació abans de corregir lectures, ampliar
  variables o donar ús operatiu a una correcció.

## P1 — Fonts numèriques de Météo-France

- [ ] Validar a staging els sis catàlegs configurats i confirmar quines capes
  WMS són reals, estables i reutilitzables.
- [ ] Construir ingestió WCS/GRIB en un circuit privat només per als productes
  que aportin dades numèriques comparables i una llicència compatible.
- [ ] Congelar-ne les prediccions i verificar-les prospectivament abans de
  donar-los cap pes al model Fonta.

## P1 — Validació en dispositius reals

- [ ] Revisar «El temps arreu», Meteocat, XAC, avisos i els visors principals en
  un iPhone, un Android i un ordinador, inclosos desplegables, pestanyes,
  reproductors i mida dels controls.
- [ ] Fer una passada de navegació amb teclat i lector de pantalla pels fluxos
  principals.
- [ ] Mesurar Core Web Vitals de camp quan Search Console disposi de prou trànsit
  i corregir només els colls d’ampolla observats.
- [ ] Separar físicament l’HTML per ruta només si les dades de camp mostren que
  els bytes del document continuen sent un problema després de la càrrega
  selectiva de JavaScript i la poda del DOM.

## P2 — Integracions externes pendents

### Meteoclimatic

- [ ] Esperar resposta de Meteoclimatic i, quan arribi, completar o corregir
  l’alta de l’estació i l’enllaç de la webcam.
- [ ] Verificar que les dades i la imatge es mantenen actualitzades abans de
  donar la integració per tancada.

### Protecció Civil

- [ ] Validar el primer comunicat CECAT real detectat en mode revisió, comprovant
  municipi, nivell, franja horària, mapa i enllaç oficial.
- [ ] Autoritzar l’autopublicació CECAT només en un segon pas i sense modificar
  el circuit existent d’avisos Meteocat.

Les idees futures sense objectiu, dades, risc i criteri de finalització definits
no formen part d’aquest roadmap.
