# Auditoria d’estabilitat i pla de treball

## Correccions incloses a la 5.5.1

1. **Caducitat real dels avisos.** El Worker interpreta l’hora final publicada per AEMET i exclou els avisos vençuts encara que continuïn apareixent al RSS.
2. **Segona validació al navegador.** El dashboard no confia cegament en el recompte rebut: torna a filtrar els avisos i actualitza la capçalera, el menú mòbil, el bloc oficial i «Què importa ara?».
3. **Caducitat amb la pàgina oberta.** Un temporitzador elimina l’avís quan arriba l’hora final, sense esperar una recàrrega ni una intervenció manual.
4. **Menú mòbil corregit.** Els botons «Completa» i «Essencial» ja no hereten la mida del botó circular de tancament i s’apilen en pantalles molt estretes.
5. **Consultes amb límit de temps.** Les dades principals deixen d’esperar indefinidament si una font no respon.
6. **Radar renovat.** RainViewer actualitza automàticament els fotogrames cada cinc minuts mentre el web és visible.
7. **Memòria cau renovada.** La versió del Service Worker i dels fitxers CSS/JS s’ha incrementat perquè els mòbils rebin la correcció.

## Valoració de la revisió externa

### Recomanacions correctes i útils

- Cal reforçar els missatges d’error i reintent dels ginys de tercers.
- S’ha de provar específicament la franja de tablet, no només mòbil i escriptori.
- Una alternativa lleugera a Meteoblue en mòbil seria millor que ocultar el giny complet.
- Un resum de progrés de càrrega pot millorar la percepció en connexions lentes.
- Conservar l’última lectura correcta per a una caiguda temporal de l’API és una millora coherent amb l’arxiu D1.
- Abans de fer canvis SEO importants convé verificar la indexació real amb Google Search Console.

### Punts que ja estaven resolts o no eren exactes

- La pàgina ja té un únic `h1` i una jerarquia de seccions amb `h2`.
- Els visors de models i radar ja s’inicien amb `IntersectionObserver` quan s’apropen a la pantalla.
- AEMET, Yr, Meteoblue i eltiempo.es només es carreguen quan s’obre la seva pestanya.
- La webcam té text alternatiu, recàrrega periòdica i imatge de reserva.
- Ja existeix un Service Worker i una memòria cau de l’esquelet del web; el que falta és guardar també l’última dada meteorològica vàlida.
- La imatge social té la mida correcta de 1200 × 630 píxels. El seu pes, proper a 1 MB, és millorable però no crític.

## Pla proposat

### Pas 1 · Correcció 5.5.1 — ara

- Publicar el Worker corregit.
- Publicar el dashboard.
- Fer 48–72 hores de prova real, incloent un canvi d’avís i una caducitat.

### Pas 2 · Versió 5.6 — fiabilitat visible

- Estat propi per a cada font: carregant, disponible, degradada o no disponible.
- Temps màxim i botó «Tornar-ho a provar» per als ginys que es puguin supervisar.
- Resum de connexions carregades sense omplir la capçalera de soroll.
- Alternativa mòbil compacta de Meteoblue.
- Proves responsive documentades a 360, 390, 768, 820, 1024 i 1440 píxels.
- Registre intern dels errors més importants del navegador per detectar fallades repetides.

### Pas 3 · Versió 5.7 — rendiment i accessibilitat

- Carregar astronomia i altres blocs secundaris només quan s’acosten a la pantalla.
- Revisar l’ordre de càrrega perquè temperatura, avisos i previsió immediata tinguin prioritat.
- Afegir un anunci accessible únic quan les dades passen de «carregant» a «actualitzades», evitant que cada número interrompi el lector de pantalla.
- Mostrar esquelets compactes i estats de reserva coherents en lloc de guions sense context.
- Mesurar LCP, CLS i temps fins a contingut útil abans i després dels canvis.

### Pas 4 · Versió 5.8 — continuïtat i SEO

- Guardar l’última lectura vàlida al dispositiu, amb hora visible, per mostrar-la si l’API cau.
- Verificar Google Search Console abans de decidir si cal prerenderitzat o una arquitectura híbrida.
- Optimitzar la targeta social sense sacrificar compatibilitat amb WhatsApp i xarxes.
- Preparar una pàgina breu de metodologia, fonts, limitacions i privacitat.

### Xarxes socials

Es mantenen aturades fins que les versions anteriors hagin acumulat prou dies de prova. L’arquitectura de dades queda preparada, però no s’activarà cap publicació automàtica durant aquesta fase d’estabilització.
