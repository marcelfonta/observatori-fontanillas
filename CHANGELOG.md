# Changelog

## 2026-10-25 — Previsió més clara i menys consultes a Buffer (en revisió)

- La previsió conserva el detall per hores i els set dies; s'elimina el resum setmanal duplicat de la part superior.
- Predicció en vídeo retira els dos enllaços de NacióDigital i incorpora, sota demanda, les publicacions recents del canal «El temps d’El Nacional».
- Un enviament d'X ja confirmat no torna a consultar Buffer cada cinc minuts. TikTok i X continuen respectant la pausa compartida que Buffer ha indicat fins al 27/10; no es força cap publicació ni es creen duplicats.

## 2026-10-25 — Mètode de l'indicador climàtic 2025 (en revisió)

- La xifra global de +1,39 °C queda identificada com l'indicador IGCC basat en diversos conjunts de dades. La pàgina explica per què el valor ERA5 de Copernicus C3S és +1,47 °C per al mateix any i enllaça les dues fonts originals.

## 2026-10-25 — Transparència dels visors externs (en revisió)

- La pàgina de privacitat identifica els visors i proveïdors afegits recentment, explica quan el navegador hi pot connectar i diferencia la consulta de CO₂ de NOAA que passa pel servidor de l'Observatori. També actualitza la data de revisió i l'enllaç a Metodologia.

## 2026-10-25 — URL canòniques i rutes inexistents (en revisió)

- Les pàgines estàtiques apunten a l'adreça neta que mostra el navegador; el mapa del lloc i els enllaços interns fan servir la mateixa adreça final. Les variants d'idioma que només retornaven el document català deixen d'anunciar-se com a traduccions.
- Les rutes de pàgines desconegudes retornen un error 404 i demanen que no s'indexin, en lloc de presentar la portada com una pàgina aparentment vàlida. Les rutes existents i els recursos conserven la resposta habitual.
- La memòria cau de la PWA conserva els documents estàtics amb els nous camins. La previsualització ha de validar les capçaleres i els enllaços abans de publicar.

## 2026-10-25 — Registre inicial de la PWA i regions accessibles (en revisió)

- La PWA deixa d'esperar indefinidament que OneSignal registri el servei en segon pla: reutilitza el registre existent i, després d'una espera breu, activa el servei propi si és una visita nova sense permís push. OneSignal continua podent registrar el seu worker compartit quan l'usuari activa els avisos.
- Les franges horàries, el resum setmanal i l'historial d'avisos es poden enfocar i desplaçar amb teclat, amb un nom accessible.
- Proves del registre inicial, del registre existent i de la cursa amb OneSignal. A la previsualització de Cloudflare, una primera visita ha creat el servei i la memòria cau i ha recarregat la portada sense xarxa. Encara cal confirmar una notificació real en un dispositiu ja subscrit abans de producció.

## 2026-10-25 — Previsió futura, CO₂ comparat i vídeo més llegible (en revisió)

- La portada calcula la pluja i el vent de les hores que queden del dia; ja no torna a presentar la pluja de matinada com una previsió futura. Si falta la sèrie horària, no reutilitza els màxims diaris. La càrrega periòdica de la previsió continua sent horària.
- L'API de CO₂ de Mauna Loa conserva el valor recent i afegeix les lectures comparables de fa un i deu anys quan NOAA les ofereix. La webcam les mostra en una càpsula compacta i la fitxa n'explica les dates i la font.
- El timelapse passa a 1280 × 720 i la versió social a 720 × 1280, amb fotogrames reduïts d'un en un i codificació amb un sol fil per protegir la memòria de la Raspberry. S'ha comprovat la cadena amb captures sintètiques; falta provar una jornada real i la mida dels fitxers a la Raspberry abans d'instal·lar-la.
- Els vídeos de matí, vespre i episodi trien la nova sintonia original corresponent. El vespre conserva un símbol meteorològic separat de la fase lunar; s'ha validat el disseny amb vuit casos visuals.
- Predicció en vídeo enllaça l'espai «Terra» i el canal de YouTube de NacióDigital. No s'ha pogut verificar un butlletí meteorològic diari propi de Nació, de manera que el web no el promet.

## 2026-10-24 — Pestanyes de Medi Ambient disponibles en entrar

- La pàgina de Medi Ambient prepara el visor en entrar i conserva la pestanya seleccionada mentre es carrega el mòdul. El mapa d'estacions respon també si es prem immediatament després d'obrir la pàgina.
- El roadmap distingeix la instal·lació ja feta a la Raspberry de les comprovacions pendents de la pròxima publicació automàtica.

## 2026-10-24 — Mapa oficial d'estacions i estat dels avisos a la portada

- Medi Ambient incorpora una pestanya amb mapa interactiu de les estacions XVPCA de Catalunya. En seleccionar-la carrega el fitxer oficial, permet filtrar per contaminant i mostra les lectures provisionals i l'hora de cada estació; les dades antigues no es presenten com a actuals.
- La targeta d'avisos de la portada s'actualitza encara que el detall d'avisos no formi part d'aquella pàgina. Diferencia la confirmació de cap avís actiu d'una consulta oficial fallida.

## 2026-10-24 — ICQA i targetes de l'estació de Sant Celoni

- Les sis targetes visuals de Medi Ambient mostren ara únicament les lectures provisionals de l'estació oficial XVPCA ES1275A (PM10, PM2,5, NO₂, O₃, SO₂ i H₂S); s'elimina el bloc duplicat i les concentracions CAMS de la fitxa principal.
- El resum de qualitat de l'aire segueix la regla publicada de l'ICQA: la categoria més desfavorable dels contaminants disponibles. S'elimina el número europeu modelitzat per no confondre'l amb una mesura local. Les lectures antigues o absents no es substitueixen amb estimacions.

## 2026-10-24 — Mesures oficials de qualitat de l'aire de Sant Celoni

- La pàgina de medi ambient incorpora les lectures provisionals de l'estació XVPCA ES1275A amb hora, unitats, categories oficials i accés al visor de la Generalitat. Les estimacions CAMS continuen en un bloc separat i identificat.
- Els cercles de NO₂, O₃ i PM10 de la webcam passen de CAMS a la mateixa estació; el color segueix la categoria oficial publicada. PM10 és una mitjana mòbil de 24 hores. Les dades antigues o absents no es dibuixen.
- La Raspberry necessita una prova local del nou script abans de substituir la versió instal·lada.

## 2026-10-24 — Cercles alineats i colors orientatius de qualitat de l'aire

- Les etiquetes i els números de NO₂, O₃ i PM10 se centren dins de cada cercle. Es retira de la imatge el rètol «CAMS · µg/m³».
- Cada cercle pren el color de la franja horària corresponent de l'índex europeu revisat el 2024 per aquell contaminant. La fitxa de la webcam n'explica la font CAMS/Open-Meteo, les unitats i el caràcter modelitzat; no es presenta com a sensor local ni com a avís oficial.
- El nou dibuix i els colors necessiten una mostra real de la Raspberry abans d'instal·lar-lo al servei.

## 2026-10-24 — Dades de la càmera amb cercles discrets

- El CO₂ queda en una etiqueta mínima amb valor i unitat; la data i Mauna Loa continuen a la fitxa de la webcam, però no tapen la imatge.
- NO₂, O₃ i PM10 passen de la franja superior a tres cercles petits a la part inferior dreta. Porten una atribució CAMS i unitats discretes; tots comparteixen el mateix color decoratiu, sense fingir un semàfor de risc.
- La fitxa explica que les concentracions són estimacions de model, no sensors locals. Cal validar una nova mostra real abans d'instal·lar aquesta versió a la Raspberry.

## 2026-10-24 — Etiquetes compactes a la càmera

- La mostra de la Raspberry mostrava dues capses molt grans damunt del cel. Es redueixen a dues franges translúcides de 250 píxels d'altura a la imatge original de 2.160 píxels, amb fonts, data i unitats visibles.
- El canvi queda pendent d'una nova mostra local de dia i de nit abans d'instal·lar-lo al servei de publicació de la Raspberry.

## 2026-10-24 — Consulta marítima detallada i prova local de la càmera

- El visor del mar destaca l'obertura del mapa ampliable de Copernicus i l'accés independent a mesures de temperatura de boies a Portus. Diferencia clarament els camps modelitzats de les observacions puntuals.
- El generador de la càmera admet `CAMERA_PREVIEW_ONLY=1` amb un directori temporal obligatori: crea les imatges localment sense pujar-les, per validar la franja de contaminants abans d'instal·lar-la.

## 2026-10-24 — Alternativa oficial quan el mapa de sequera és en manteniment

- La pestanya de sequera deixa d'incrustar la pàgina de manteniment de l'ACA i ofereix l'estat actual, les reserves dels embassaments i l'accés al mapa interactiu oficial. No infereix cap escenari de sequera ni reutilitza una dada antiga.

## 2026-10-24 — Visors ambientals i navegació de l'arxiu

- El visor de sequera torna a obrir l'entrada vigent de l'ACA. Medi Ambient incorpora el mapa de temperatura superficial de Copernicus Marine sota demanda, identificat com a anàlisi i previsió propera al temps real.
- Les rutes profundes d'històries i resums carreguen els recursos del web des de l'arrel. Les hores de les històries editorials es converteixen abans de formatar-les, i el menú lateral recorda el punt de lectura dins la sessió.
- El script de la càmera prepara una franja per a NO₂, O₃ i PM10 a partir de CAMS Europe via Open-Meteo, amb hora i atribució de model. Si la dada és absent o antiga, la franja no es dibuixa. Cal instal·lar-lo i validar-lo amb una captura real a la Raspberry abans de considerar-lo publicat.

## 2026-10-24 — Panoràmica completa a les previsualitzacions

- La portada i la pàgina de webcams mostren la miniatura sencera en proporció 32:9; el visor ja no retalla la càpsula de CO₂ ni la franja de Sant Celoni.
- L'estat de la portada es mou al cantó superior dret i s'elimina l'etiqueta superposada que trepitjava la franja inferior.

## 2026-10-24 — CO₂ visible a la webcam i als pròxims timelapses

- La pàgina de la webcam mostra la lectura recent de Mauna Loa separada de la imatge, amb NOAA, data i avís que no és una mesura local; l’omet si la dada és antiga o invàlida.
- La variant de webcam amb marca fa llegible la càpsula a la miniatura. El generador dels pròxims timelapses posa el CO₂ al vídeo horitzontal i a la zona superior del vertical, sense aturar la càmera si NOAA no respon.
- Els scripts de la Raspberry s’han d’instal·lar per separat; els vídeos ja publicats no es reescriuen ni es tornen a enviar.

## 2026-10-24 — Lectura essencial compacta al mòbil

- Les quatre targetes de «Què cal saber ara?» es distribueixen en dues columnes a la portada mòbil, amb text i espais ajustats però amb la font i l’accés al detall visibles.
- El peu de les targetes deixa d’heretar un espai inferior excessiu de l’estil general del lloc.

## 2026-10-24 — Dates diàries de Fonta durant el canvi d’hora

- El laboratori Fonta interpreta els dies diaris d’Open-Meteo amb el desplaçament fix que inclou cada resposta. Així evita marcar com a duplicats els dies del canvi d’horari CET/CEST.
- Les previsions continuen sent experimentals i no s’envien a cap publicador. La captura fallida del 24 d’octubre queda arxivada com a evidència parcial; la pròxima franja ha de confirmar la recuperació.

## 2026-10-23 — Timelapse amb menys memòria i detecció de buits

- El generador de la Raspberry redueix les fotografies de 7680×2160 una a una i desa els fitxers temporals al disc abans de codificar el vídeo. Això evita acumular captures originals dins d'un sol procés FFmpeg en una màquina de 415 MiB de RAM.
- El panell d'administració avisa quan falta un vídeo de dilluns, dimecres o divendres entre els dies que sí s'han preparat.
- La investigació del 21 d'octubre és a la incidència #299. La recuperació d'aquell vídeo i la confirmació als quatre canals continuen pendents de prova a la Raspberry; aquest canvi no els publica.

## 2026-10-23 — Històric climàtic i metadades fidels

- `/canvi-climatic` incorpora 67 mitjanes anuals de CO₂ de Mauna Loa (1959–2025), una gràfica, una taula resum i el CSV descarregable, amb el mètode de reproducció i els límits de la sèrie documentats.
- La ruta, escrita només en català, deixa d'anunciar als cercadors traduccions que encara no existeixen. Les metadades i les dades estructurades mantenen el català també després dels canvis d'idioma de la interfície.
- La gràfica i el CSV entren a la memòria cau de la PWA; la pàgina conserva el contingut principal sense JavaScript.

## 2026-10-23 — Accés al canvi climàtic i Medi Ambient més net

- La ruta `/canvi-climatic` apareix al menú amb quatre indicadors datats o contextualitzats, fonts originals i una lectura separada per planeta, Catalunya i observatori.
- El CO₂ de Mauna Loa només es mostra si la lectura NOAA és recent; si falla, la pàgina en declara l’absència.
- S’elimina la capsa sísmica redundant de Medi Ambient; el mapa USGS/ICGC continua al visor.

## 2026-10-23 — Estat del planificador caducat

- L’estat públic marca el planificador com a degradat si fa més de 16 minuts que no completa cap cicle, encara que l’últim resultat desat fos correcte.
- La resposta indica `stale` sense exposar detalls interns i permet detectar un cron aturat abans de confiar en dades o publicacions automàtiques.

## 2026-10-23 — Revisió visual del vespre

- La targeta social fa més llegible el distintiu lunar i indica que la dada d’USNO és de les 12 h.
- Divuit proves de navegador comproven targeta i Short de vespre per set fenòmens i les absències independents del temps i de la fase lunar, sense retalls ni solapament.


## 2026-10-23 — Vespre meteorològic i lunar; mostres de sintonia

- Els Shorts i les targetes socials de vespre mostren el símbol meteorològic i la fase lunar oficial de l’USNO en espais separats. Si falta una dada, l’altra continua disponible.
- El símbol nocturn genèric ara són estrelles i no suggereix una fase lunar calculada. La fase es refereix a les 12 h locals del dia previst.
- Hi ha tres variants de música original per comparar internament (matí, vespre i episodi). La publicació automàtica manté la sintonia actual fins a la revisió humana.


## 2026-10-23 — CO₂ NOAA compartit (preparat per a staging)

- El Worker llegeix diàriament la sèrie de mitjanes diàries de Mauna Loa de NOAA,
  en valida dates i valors i conserva l’última instantània bona a R2.
- Una ruta pública retorna la mateixa dada a la webcam i al generador de Shorts;
  les targetes socials diàries també llegeixen aquesta instantània.
- Les peces identifiquen Mauna Loa com a estació de referència, mostren ppm i
  data, i ometen la càpsula quan la dada és antiga o no està disponible.
- La verificació visual amb imatges reals i el desplegament queden pendents.

## 2026-10-23 — Controls solars i hora peninsular del planetari

- El visor permet saltar directament a la posta de sol o a l’inici de la nit
  astronòmica per a la localitat i data escollides.
- La data del planetari s’interpreta sempre en `Europe/Madrid` i mostra de manera
  explícita CET/CEST; les proves cobreixen l’horari d’hivern i el d’estiu.
- Els punts cardinals comuniquen quin està seleccionat amb estat accessible i
  el roadmap separa les millores ja resoltes de la futura guia d’objectes.

## 2026-10-23 — Pilot integrat del cel nocturn amb Stellarium

- «El cel, de dia i de nit» incorpora el visor oficial de Stellarium Web,
  carregat només després de prémer «Explora el cel» per evitar pes i connexions
  externes durant la visita normal.
- El visor parteix de Sant Celoni i permet canviar localitat i hora, tornar a
  l’instant actual, saltar als punts cardinals o al zenit i entrar en pantalla
  completa sense perdre les targetes astronòmiques textuals.
- La política de seguretat, la privacitat, l’atribució i la dependència externa
  queden documentades; els catàlegs pesants no entren a la memòria cau offline
  del portal.
- Es retira la reescriptura redundant de la primera fitxa educativa que, en
  combinar-se amb les URL netes de Cloudflare Pages, provocava un bucle 308.

## 2026-10-23 — Primera fitxa pròpia de l’Aula oberta

- «Quan va ploure més?» converteix les dades reals de l’aiguat del 4 d’octubre
  en una activitat imprimible per a ESO de ciències i matemàtiques.
- El recurs inclou CSV reutilitzable, objectius, preguntes, solucions
  orientatives, rúbrica, autoria, data, limitacions i llicència CC BY 4.0.
- La fitxa queda disponible sense connexió; la primera revisió externa per part
  d’una persona docent continua pendent abans d’ampliar la col·lecció.

## 2026-10-23 — Qualitat tècnica, fonts locals i mode offline

- DM Sans i Manrope es serveixen localment en WOFF2, amb les llicències
  preservades i sense connexions ni excepcions CSP per a Google Fonts.
- El service worker desa les fonts amb l’app shell i renova la memòria cau per
  fer arribar el canvi als dispositius instal·lats.
- El mode sense connexió mostra l’antiguitat de la dada, anuncia l’estat de
  manera moderada i incorpora un reintent accessible sense recarregar la web.

## 2026-10-22 — SEO de servidor verificat amb Search Console

- L’auditoria real detecta que Cloudflare servia el títol de portada a l’HTML
  inicial de totes les rutes i activa explícitament la capa SEO a l’edge.
- Històries i resums obtenen canonical, imatge social, H1 i dades estructurades
  pròpies abans d’executar JavaScript; les URL inexistents són 404 no indexables.
- Es documenta l’estat real de Search Console i s’afegeix una auditoria de
  producció repetible per evitar regressions d’indexació.

## 2026-10-22 — Primer resum climatològic mensual

- Nou resum permanent de setembre de 2026 amb temperatures, pluja, ratxa,
  evolució diària, dies destacats i cobertura de les observacions pròpies.
- La ruta `/resums/2026-09` té sitemap, metadades, dades estructurades i una
  targeta social pròpia per poder-la citar i compartir.
- Les incidències de cobertura es fan visibles i el resum evita presentar una
  sèrie curta com una normal climàtica.

## 2026-10-22 — Tres històries reals i una guia local

- Es publiquen tres peces editorials permanents basades en l’arxiu propi: els
  82,55 mm del 4 d’octubre, el canvi de calor i vent del 6 d’agost i el contrast
  tèrmic de 19,4 °C del 14 de setembre.
- Cada història té URL, cronologia, perfil horari, cobertura, fonts, imatge
  social pròpia i dades estructurades; els candidats automàtics queden separats.
- Nova guia local sobre la boira a la vall de la Tordera, amb límits explícits
  de l’estació i referència al manual d’observació de Meteocat.

## 2026-10-22 — Lectura útil i orientació pràctica

- La portada sintetitza observació, previsió immediata i avisos en una frase,
  amb fonts visibles i sense completar allò que no s’ha pogut confirmar.
- L’Aula oberta incorpora una FAQ sobre mesures, prediccions, fiabilitat, Fonta
  i avisos, també publicada com a dades estructurades.
- Els indicadors calculats guanyen una lectura pràctica i prudent, i una guia
  breu deriva sempre als consells oficials de Protecció Civil i al 112.

## 2026-10-22 — Capçaleres de producció auditades

- MDN HTTP Observatory confirma A+ i 115/115, amb 12 controls superats i cap
  error sobre `meteo.fontanillas.cat` després del desplegament.
- Es documenta el resultat, l’identificador verificable i quan cal repetir-lo.
- HSTS es manté durant un any sense `includeSubDomains` ni `preload` fins que
  tots els subdominis estiguin inventariats i auditats.

## 2026-10-22 — Observacions pròpies com a dades obertes

- Les observacions de l’estació es publiquen sota CC BY 4.0 amb una citació
  recomanada i un abast que exclou explícitament fonts i productes de tercers.
- El Centre de Dades explica la reutilització, les variables, les unitats, la
  cobertura i la qualitat, amb una guia pública detallada.
- CSV, Excel, JSON i PDF incorporen llicència o atribució, i el Dataset JSON-LD
  declara llicència, autoria i accés gratuït.

## 2026-10-22 — Autoria i confiança pública

- Nova ruta «Sobre l’Observatori» amb responsable, identitat del projecte,
  equipament, entorn general, freqüència, manteniment i limitacions conegudes.
- La pàgina separa Observatori Meteorològic Fontanillas, Meteo Fontanillas i el
  laboratori Fonta, i enllaça metodologia, qualitat, canvis i contacte.
- Nou `/.well-known/security.txt` que deriva les incidències al formulari
  protegit, amb caducitat, idiomes, URL canònica i política pública.
- El formulari incorpora un motiu específic per a seguretat o vulnerabilitats.

## 2026-10-21 — Pausa compartida davant dels límits de Buffer

- Un `429 Too many requests` desa ara un únic període de pausa compartit per
  tots els fluxos de Buffer.
- La comprovació preventiva i els programadors d’X i TikTok respecten el mateix
  `Retry-After`, sense fer noves peticions ni enviar un segon avís durant el
  bloqueig.
- El correu preventiu explica que la pausa afecta temporalment els dos canals
  gestionats per Buffer, mentre la resta de xarxes continuen independents.

## 2026-10-20 — Navegació correcta als models francesos

- L’enllaç «Models francesos» del menú conserva la ruta pròpia `/models` en lloc
  de convertir-la en la portada com si fos una secció interna del portal.
- La resta de rutes internes continuen mantenint idioma i navegació profunda.

## 2026-10-20 — Guies meteorològiques indexables

- La portada, la predicció, el radar i el visor ambiental incorporen explicacions
  breus que separen observació, estimació, nowcasting i avisos oficials.
- Les guies de radar i terratrèmols documenten les limitacions de les fonts i
  enllacen directament els visors operatius i els catàlegs oficials.
- La metodologia explica les entrades, la mostra mínima, la verificació
  prospectiva i la revisió humana del model Fonta, inclòs el paper experimental
  d’AROME HD.

## 2026-10-20 — Metadades de servidor per ruta

- Les rutes del portal reben des de Cloudflare Pages el títol, la descripció,
  la canònica, Open Graph, Twitter Card i JSON-LD corresponents abans que
  s'executi JavaScript.
- L'HTML inicial identifica la ruta activa i conserva una introducció útil amb
  enllaços oficials també quan JavaScript no està disponible, sense duplicar
  `index.html` ni afegir documents estàtics paral·lels.
- La primera observació de la portada reutilitza el mateix graf SEO que el
  navegador, amb la cobertura temporal real iniciada el 4 d'agost de 2026.

## 2026-10-20 — Visor de models consolidat a `/models`

- El laboratori oficial de Météo-France té una ruta pública, llegible i
  canònica a `/models`, sense incorporar-ne la càrrega pesada a la portada.
- L’adreça antiga `models-franca.html` redirigeix de manera permanent a la ruta
  nova, que també s’utilitza a la navegació, els enllaços interns i el sitemap.
- La PWA desa la ruta canònica i conserva el visor per a una consulta posterior
  quan ja s’hagi carregat almenys una vegada.

## 2026-10-20 — Enllaços profunds llegibles i compatibles

- Totes les seccions principals disposen d’una ruta pròpia, com `/prediccio`,
  `/radar`, `/avisos` o `/terra`, que es pot recarregar i compartir directament.
- Els enllaços antics amb `?page=` continuen funcionant i es normalitzen a la
  nova adreça sense afegir una entrada artificial a l’historial del navegador.
- La navegació principal, els enllaços interns, les canonical multilingües i el
  sitemap utilitzen les adreces llegibles.
- Cloudflare Pages reescriu les rutes a l’entrada correcta i la PWA conserva el
  selector de ruta també quan recupera la còpia fora de línia.

## 2026-10-20 — Radar estable des del primer pintat

- La ruta de Radar amaga la targeta de webcam i fixa la graella d’una columna
  abans que arrenqui l’aplicació, evitant que el mapa canviï d’amplada durant
  la càrrega.
- El contenidor del mapa conserva l’altura reservada mentre Leaflet i les capes
  externes encara no han respost.
- Tres passades Lighthouse mòbils consecutives donen un CLS de `0,033`, davant
  del `0,674` de la línia base pública.
- Una prova de navegador protegeix la columna única, la reserva mínima del mapa
  i el límit de CLS `≤ 0,10`.

## 2026-10-20 — Marca lleugera i memòria offline ajustada

- La marca visible del portal, l’administració i el laboratori Fonta reutilitza
  la icona de 192 px en lloc de descarregar l’avatar social de 1024 px.
- Una primera visita estalvia uns 871 KB en el logotip visible sense canviar-ne
  l’aspecte ni les dimensions reservades.
- La instal·lació del service worker deixa de precarregar icones grans i
  creativitats socials que no són necessàries per consultar dades sense xarxa;
  la memòria inicial evita aproximadament 2,8 MB d’actius prescindibles.
- Les icones PWA de 512 px i les imatges socials continuen disponibles a les
  seves URL per a instal·lació, SEO, compartició i publicacions.

## 2026-10-20 — Correccions verificades de l’auditoria externa

- Les pàgines de municipis i models francesos completen les metadades de cerca,
  compartició i PWA sense crear rutes artificials ni duplicar contingut.
- El catàleg Météo-France mostra cinc productes a tot el contingut estàtic.
- La política de privacitat incorpora municipis desats, consultes meteorològiques
  externes i la data real de revisió.
- La metodologia deixa d’enllaçar públicament l’accés administratiu i els textos
  base de memòria i verificació ja no exposen fases internes ni un zero fictici.
- Meteoclimatic surt del roadmap pendent després de verificar dades actualitzades
  i webcam visible a la fitxa pública de l’estació.

## 2026-10-20 — PIAF retirat del circuit operatiu

- PIAF deixa d'aparèixer al selector, al diagnòstic i al desplegament de staging.
- La decisió conserva la traça del diagnòstic: credencial present i vigent, però
  servei professional mai verificat i amb resposta HTTP 520.
- El laboratori Météo-France queda format pels cinc productes que sí responen:
  AROME, AROME-PI, ARPEGE, PE-AROME i PE-ARPEGE.

## 2026-10-20 — Validació privada dels sis productes Météo-France

- L'administració diferencia catàlegs disponibles de mapes WMS realment
  generats per AROME, AROME-PI, ARPEGE i PIAF.
- PE-AROME i PE-ARPEGE continuen bloquejats per a ingestió numèrica fins que
  cada producte rebi una aprovació privada explícita de reutilització.
- El contracte incorpora l'atribució, la llicència oberta i la prohibició de
  redistribuir les dades originals, sense exposar credencials ni fitxers GRIB.

## 2026-10-20 — Nowcasting local en mode d’ombra

- El Worker captura prospectivament la disponibilitat, frescor, cadència i
  horitzó dels fotogrames de radar i comprova al mateix instant les capes de
  núvols, llamps i la precipitació horària d’AROME HD.
- Les mostres queden en un registre privat de 120 dies amb un resum de cobertura
  consultable des de l’administració. El primer llindar exigeix 288 mostres i
  almenys un 90% de radar útil.
- El circuit no calcula trajectòries, probabilitats ni hores d’arribada, i no
  alimenta avisos ni publicacions. L’error espacial queda ajornat fins que una
  projecció guardada es pugui comparar honestament amb l’observació posterior.

## 2026-10-20 — Entrega social verificable dels timelapses

- Cada canal registra ara per separat si el vídeo ha estat acceptat, continua
  processant-se, ha quedat publicat o ha fallat. El panell només mostra el
  timelapse com a complet quan els quatre canals confirmen la publicació final.
- Instagram i Facebook es reconcilien amb Meta, TikTok conserva i consulta el
  mateix identificador de Buffer i YouTube retorna automàticament al Worker el
  resultat i l’identificador real del vídeo.
- Les recuperacions reutilitzen els identificadors ja creats i mantenen una
  única publicació per data, evitant duplicats encara que una plataforma trigui
  més d’un cicle a processar el vídeo.

## 2026-10-20 — Confiança multimodel comparable

- Confirmada en producció la primera mostra mínima: els cinc models disposen de
  vuit dies reals comuns, sense reconstrucció retrospectiva.
- La comparativa passa a usar exclusivament dates presents en tots cinc models,
  separa l’error de temperatura màxima i mínima i exposa els talls de revisió de
  60 i 90 dies.
- Els pesos continuen sent candidats no operatius. El pes de pluja queda
  bloquejat fins que hi hagi almenys set dies plujosos comuns; actualment n’hi
  ha tres.

## 2026-10-20 — Roadmap reduït a pendents reals

- El roadmap deixa de duplicar centenars de tasques ja completades i conserva
  només validacions, decisions i integracions encara obertes.
- Els pendents queden ordenats per prioritat i amb una condició observable per
  donar-los per acabats; les idees sense compromís passen fora del roadmap actiu.
- L’històric complet continua disponible al changelog, als informes del projecte
  i a Git.

## 2026-10-20 — DOM adaptat a cada ruta

- Abans d’inicialitzar l’aplicació, el navegador retira els blocs HTML de les
  seccions que no pertanyen a la ruta activa, en lloc de conservar-los ocults.
- Els blocs compartits continuen disponibles a totes les rutes corresponents i
  la navegació, el contingut indexable i el mode sense connexió mantenen el
  comportament existent.
- La reducció queda exposada com una mètrica local de diagnòstic per poder
  comparar elements retirats i conservats en cada pàgina.

## 2026-10-19 — JavaScript adaptat a cada secció

- Terra, ESTOFEX, històries, previsió estacional, vídeos, verificació, Centre de
  Dades, medi ambient i protecció civil es carreguen només quan la ruta els
  necessita, en lloc de formar part de l’arrencada de totes les pàgines.
- La portada redueix de 101 a 58 els recursos JavaScript observats en una
  càrrega neta local, sense perdre la disponibilitat posterior sense connexió.
- S’ha eliminat una inicialització duplicada de les gràfiques de la portada.

## 2026-10-19 — Fiabilitat i rendiment després de l’auditoria

- La previsió comparteix una única càrrega en curs entre l’arrencada, `pageshow`,
  `focus`, canvis de visibilitat i recuperacions de xarxa; així evita duplicar
  sis consultes a Open‑Meteo i provocar respostes `429`.
- La Raspberry genera i puja una miniatura pública de 960 px de la càmera. La
  portada i la vista de webcams la fan servir, mentre l’ampliació conserva la
  versió completa amb privacitat.
- Cada ruta activa només inicia els serveis que necessita: la resta ja no
  consulta previsió, qualitat, avisos, dos històrics, webcam o visors ocults.
  La lectura actual continua alimentant l’estat de connexió compartit.
- La imatge principal declara dimensions i els controls «Imatge recent»,
  «Segueix-nos», marca lateral i Meteo IA fan coincidir el text visible amb el
  nom accessible.

## 2026-10-19 — Timelapse vertical compatible amb TikTok

- La versió social del timelapse es codifica ara a 30 fps, dins del rang de
  23–60 fps exigit per TikTok, sense augmentar els fils d'FFmpeg ni el consum
  de memòria de la Raspberry.
- La prova de regressió fixa explícitament aquesta freqüència per evitar que
  una futura simplificació torni a generar vídeos rebutjats per TikTok.

## En preparació — Confirmació real dels timelapses a TikTok · 2026-10-19

- Un timelapse ja no consta com a publicat a TikTok només perquè Buffer n'hagi
  acceptat la petició: cal que l'estat final sigui `sent` i tingui data d'enviament.
- Les publicacions en procés conserven el mateix identificador de Buffer i es
  tornen a comprovar sense crear duplicats; els rebutjos mostren l'error real.

## En preparació — Catàleg sísmic ICGC integrat · 2026-10-18

- Fusiona al mapa els terratrèmols locals i regionals de l’ICGC/SISMOCAT amb
  la cobertura mundial de l’USGS i elimina coincidències duplicades.
- Identifica la font de cada sisme i ressalta els marcadors ICGC amb contorn
  blau, inclosos els esdeveniments que no consten al catàleg global.

## En preparació — Més terratrèmols febles · 2026-10-18

- El període de set dies deixa d’amagar els sismes inferiors a magnitud 2,5 i
  mostra totes les magnituds disponibles al catàleg mundial de l’USGS.
- Identifica l’ICGC/SISMOCAT com a font complementària per consultar la
  micro-sismicitat catalana que no sempre entra al catàleg global.

## En preparació — Informació meteorològica al visor terrestre · 2026-10-18

- Superposa al mapa topogràfic les observacions GeoColour de Meteosat-12, el
  producte RGB de masses d’aire i l’àrea acumulada de llamps MTG-I.
- Identifica la font, la freqüència aproximada i el significat d’una absència
  de senyals elèctrics, mantenint l’accés al visor oficial d’EUMETSAT.

## En preparació — Visor topogràfic estable · 2026-10-18

- Substitueix el mosaic satel·litari incomplet del centre d’observació per un
  mapa topogràfic estable, amb Sant Celoni identificat i enquadraments per a
  Catalunya, el Mediterrani occidental i Europa.
- Manté núvols, masses d’aire i llamps com a consultes explícites al visor
  oficial d’EUMETSAT, sense presentar una composició defectuosa com si fos una
  imatge contínua.

## En preparació — HARMONIE i nowcasting experimental · 2026-10-18

- El visor de models incorpora HARMONIE-AROME dins la pàgina mitjançant el
  visor oficial d’AEMET, amb resolució i horitzó identificats i sense donar-li
  pes local abans de disposar de verificació prospectiva comparable.
- El radar separa els fotogrames observats dels projectats i limita qualsevol
  projecció visible a les dues hores següents; si la font no publica futur, la
  web ho declara i conserva l’accés a la previsió oficial +1 h de Meteocat.
- La primera fase de nowcasting queda explícitament experimental: no calcula
  hores d’arribada, no inventa fotogrames i no activa avisos automàtics.

## En preparació — CECAT a través de mitjanit · 2026-10-18

- Accepta quatre franges oficials consecutives encara que comencin a mig dia i
  continuïn l'endemà, sense relaxar la caducitat ni els llindars de risc local.

## En preparació — Vídeo d’Històries meteo · 2026-10-18

- Autoritza explícitament a la CSP els timelapses servits pel Worker privat.

## En preparació — Històries meteo aïllades · 2026-10-18

- Converteix explícitament les dates de les històries abans de formatar-les.
- Impedeix que un error d’un mòdul editorial opcional degradi la lectura principal.

## En preparació — Recuperació de connexió · 2026-10-18

- Reintenta una lectura puntual abans de declarar indisponible el servei.
- Diferencia una caiguda temporal de l’API d’una desconnexió real del dispositiu.
- Actualitza automàticament la lectura quan el navegador recupera la connexió.

## En preparació — Salut de captura de prediccions · 2026-10-18

- Registra l'estat real de la captura multimodel després de cada execució del
  cron perquè el panell públic no quedi indefinidament en mode «recollint».
- Diferencia captura completa, parcial i fallida sense publicar detalls interns.

## En preparació — Fase 6: verificació i reputació · 2026-10-18

- Amplia la verificació pública amb exportacions CSV i JSON reproduïbles,
  mostra, data de generació, metodologia, fonts i llicències visibles.
- Publica un estat operatiu agregat dels serveis essencials sense detalls,
  credencials ni informació privada.
- Adapta també per canal els textos dels vídeos d'episodis meteorològics de
  Facebook, Instagram, TikTok i X, completant el circuit de la fase 5.
- Manté els pesos locals com a informació experimental: no alteren la
  predicció operativa sense mostra i revisió suficients.

## En preparació — Fase 5: xarxes adaptades per canal · 2026-10-18

- Genera una versió editorial pròpia per Facebook, Instagram, Bluesky,
  Threads, Telegram, X, TikTok i YouTube, amb límits i formats explícits.
- Mostra a l'administració la previsualització exacta de cada canal abans de
  publicar-la, inclosos el recompte de caràcters i el format visual recomanat.
- Connecta els publicadors directes a aquestes versions sense canviar les
  garanties existents de confirmació, identificador i reintents selectius.
- Marca la fase 4 com a completada i la fase 5 com a iniciada al roadmap.

## En preparació — Fase 4: històries meteorològiques · 2026-10-18

- Afegeix una pàgina pública d'episodis reconstruïts amb l'arxiu real de
  l'estació i una cronologia comuna d'inici, moment actiu i final de cobertura.
- Separa visualment observació local, context de radar/satèl·lit/timelapse i
  coincidències amb avisos oficials.
- Manté visibles la cobertura, el nombre de mostres i els buits, sense convertir
  absències en zeros ni presentar el context visual com una prova local.
- Recupera el timelapse diari sota demanda i degrada la fitxa amb claredat si
  aquell derivat no existeix.

## En preparació — Fase 3: centre d'observació de la Terra · 2026-10-18

- Incorpora una pàgina pròpia per consultar fonts espacials segons tres
  preguntes: què passa ara, quin context tenim avui i com ha evolucionat el
  territori.
- Reuneix Meteosat-12, MTG Lightning Imager, radar i webcam, NASA FIRMS i
  EONET, CAMS, Sentinel-1/2 i NASA Worldview.
- Identifica cada producte com a observació, model o context i explica frescor,
  ús correcte i limitacions abans d'obrir la font.
- Evita incrustacions pesades i connexions externes fins que l'usuari decideix
  obrir el visor oficial.

## En preparació — Fase 2: portada intel·ligent · 2026-10-18

- Resumeix a la portada què cal saber ara amb observació local, previsió del
  dia, avisos oficials i confiança entre ECMWF, GFS, ICON i AROME.
- Manté visible l'origen de cada lectura i enllaça al detall corresponent.
- Ofereix estats pendents i degradats que no bloquegen ni buiden la portada si
  una font triga o falla temporalment.
- Marca la fase 1 com a desplegada i la fase 2 com a iniciada al roadmap comú.

## En preparació — Centre operatiu i roadmap espacial · 2026-10-18

- Unifica el roadmap de web i xarxes amb les aportacions de NASA, ESA,
  Copernicus i EUMETSAT en sis fases amb portes de qualitat.
- Afegeix a l’administració una lectura operativa de dades, automatitzacions,
  xarxes i timelapses, amb incidències prioritzades i accés al diagnòstic.
- Reutilitza l’estat real existent i no introdueix cap petició externa ni cap
  acció destructiva nova.
- Manté la càrrega progressiva: l’estat de càmera s’incorpora quan arriba el
  catàleg de vídeos sense bloquejar la resta del panell.

## En preparació — Mapa mundial de terratrèmols · 2026-10-17

- Incorpora una pestanya de terratrèmols dins dels visors de Medi Ambient amb dades instrumentals mundials de l’USGS.
- Permet alternar entre les últimes 24 hores i set dies amb magnitud 2,5 o superior, i canviar ràpidament entre Catalunya i la vista mundial.
- Mostra magnitud, ubicació, hora local, profunditat i accés a la fitxa original de cada esdeveniment.
- Manté l’ICGC i SISMOCAT com a fonts complementàries per al detall oficial de Catalunya i evita presentar el catàleg com un sistema d’avisos.

## En preparació — Càrrega resilient de la previsió · 2026-10-17

- Mostra immediatament l’última previsió vàlida del navegador mentre demana dades noves a Open‑Meteo.
- Separa la càrrega de la previsió principal de la comparació multimodel perquè un model lent no bloquegi tota la pàgina.
- Si la font falla temporalment, manté les dades recents amb l’antiguitat visible en lloc de buidar la previsió.
- Tanca els estats de càrrega del resum diari i setmanal quan no existeix cap previsió reutilitzable.

## En preparació — Explorador visual multimodel amb Windy · 2026-10-17

- Separa la previsió numèrica pròpia de la consulta visual perquè obrir un mapa no alteri els pesos locals.
- Incorpora accessos directes centrats a Sant Celoni per a ECMWF, GFS, ICON-EU, ICON, AROME-HD, AROME França, NEMS i ALADIN.
- Manté dins la pàgina els visors globals provats i les fonts directes d’AROME i Météo-France com a circuit tècnic independent.
- El botó de Windy conserva el model i la variable seleccionats quan s’obre el mapa complet.

## En preparació — Compatibilitat amb finestres temporals CECAT · 2026-10-17

- El lector CECAT associa cada mapa amb la data i la franja UTC extretes del PDF, inclosos els comunicats que reparteixen una finestra oficial de 24 hores entre dues dates dins la mateixa pàgina.
- Les quatre franges consecutives que travessen mitjanit es mantenen com una sola peça i la targeta identifica les dues dates.
- Els noms interns consecutius (`img9`, `img11`, etc.) es reconeixen sense deixar d'aturar el procés davant panells ambigus o franges discordants.

## En preparació — Timelapses diaris i privacitat de la càmera · 2026-10-12

- La Raspberry prepara cada nit el timelapse del dia anterior i en conserva els
  darrers vídeos diaris per poder-los revisar des de l'administració.
- Els vídeos de dilluns, dimecres i divendres es publiquen automàticament a
  Instagram, Facebook, TikTok i YouTube; els altres disposen de publicació
  manual confirmada des de l'administració.
- La instal·lació usa un temporitzador systemd d'usuari, persistent i reversible.
- El registre per data i canal reprèn els processaments pendents de Meta i evita
  repetir una publicació completada.
- La còpia social passa a 9:16 per a Reels, TikTok i Shorts: manté la panoràmica
  amb un enquadrament central immersiu del cel i l'horitzó, elimina les franges
  negres i presenta data, ubicació i marca amb una jerarquia discreta. El peu de
  la panoràmica no es repeteix, la composició parteix de les captures originals
  per preservar nitidesa i la còpia 16:9 continua local.
- Les cases immediates queden difuminades per trams seguint la línia urbana,
  amb una intensitat moderada i sense tapar grans rectangles de cel, abans de
  qualsevol sortida pública, inclosos JPEG, web, Reels i timelapses. L'original
  net només roman a l'arxiu local privat de la Raspberry.

## En preparació — Mapes FIRMS i AROME de Catalunya · 2026-10-11

- Les anomalies tèrmiques de NASA FIRMS es representen en un mapa interactiu
  de Catalunya i l’entorn, amb antiguitat visual, detall en clicar i Fontanillas
  com a referència; les targetes queden com a resum secundari.
- El visor principal de models incorpora el WMS oficial d’AROME per a tota
  Catalunya, amb precipitació, temperatura, vent, núvols i línia temporal.
- AROME HD d’1,5 km es conserva com a vista separada de detall del Baix
  Montseny, sense presentar la graella local com si cobrís tot el territori.
- El mapa mundial de NASA continua disponible com a consulta externa, evitant
  carregar desenes de milers de deteccions globals dins del portal.

## En preparació — Confiança multimodel i deteccions satel·litàries · 2026-10-11

- La previsió combina l’acord entre models deterministes amb la dispersió de
  l’ensemble ICON i explica el rang central i els membres que esperen pluja.
- El Worker conserva prediccions independents de Best Match, ECMWF, ICON, GFS
  i AROME HD, i calcula l’encert i pesos locals només amb casos futurs reals.
- El visor ambiental separa el risc oficial del Pla Alfa de les anomalies
  tèrmiques observades per NASA FIRMS, sense convertir-les en avisos d’incendi.
- La integració FIRMS queda preparada i degradada de manera segura fins que
  s’hi configuri una clau gratuïta; no activa notificacions ni publicacions.
- S’afegeix un accés complementari al visor oficial d’EUMETSAT sense duplicar
  cap capa meteorològica operativa de la web.

## En preparació — Timelapses manuals de la càmera nord · 2026-10-08

- La Raspberry pot crear una previsualització MP4 a partir de les captures
  originals d'un dia, sense cron ni cap publicació social automàtica.
- El Worker accepta la prova amb la credencial exclusiva de la càmera, valida
  mida, format, data i fotogrames, i publica només una URL de previsualització.
- L'original JPEG, l'arxiu local i els fluxos socials existents no es modifiquen.

## V22.31.11 — Models francesos estables i amb línia temporal · 2026-10-07

- El Worker publica els instants vàlids de cada edició WMS i valida l’hora
  seleccionada abans de demanar el mapa oficial a Météo-France.
- El laboratori incorpora reproducció, pausa, passos anterior/següent i una
  línia temporal amb data local per veure l’evolució real del model.
- El mapa conserva una alçada estable, recalcula Leaflet quan canvia el
  contenidor i deixa d’alterar la composició en fer scroll o canviar d’amplada.
- La seqüència s’atura quan la pestanya queda oculta i cada producte falla de
  manera independent sense inutilitzar la resta del laboratori.
- Els instants normalitzats es converteixen al format ISO estricte que accepta
  el WMS oficial abans de generar cada fotograma de la seqüència.

## En preparació — càmera pròpia a la portada · 2026-10-07

- La portada i la pàgina de webcams utilitzen la captura pròpia de la càmera
  nord, amb hora real obtinguda de les metadades del servidor.
- La interfície diferencia imatge recent, retardada, desactualitzada i no
  disponible, amb text alternatiu i una reserva visual que manté accessibles
  les dades meteorològiques.

## Desplegament — pujada segura de la càmera nord · 2026-10-07

- El Worker accepta exclusivament JPEG autenticats amb una credencial dedicada,
  comprova tipus, mida, integritat bàsica i hora de captura, i no rep mai les
  credencials ni l'adreça local de la càmera.
- L'última captura queda en un bucket R2 privat separat i es publica en una URL
  estable de només lectura amb metadades de frescor i memòria cau curta.
- Una prova aïllada cobreix denegació sense token, pujada correcta, lectura
  pública i rebuig d'un fitxer que no és JPEG.
- La Raspberry Pi ja publica automàticament les captures i la credencial inicial
  s'ha rotat després de la configuració; només la credencial nova és vàlida.

## Correcció — validació real dels ensembles Météo-France · 2026-10-05

- El diagnòstic substitueix el membre obligatori `{run}` abans de consultar
  PE-AROME i PE-ARPEGE; una resposta de paràmetres invàlids ja no compta com a èxit.
- Staging diferencia la limitació temporal HTTP 429 d'una clau absent o una
  ruta incorrecta i valida imatges PNG reals d'AROME, AROME-PI i ARPEGE.
- L'estat públic conserva només el codi HTTP segur de la incidència i no revela
  mai la credencial ni el cos privat de la resposta del proveïdor.

## V22.31.10 — Laboratori directe de Météo-France · 2026-10-05

- Nou gateway segur al Worker per consultar els catàlegs oficials sense exposar
  cap clau al navegador, amb memòria cau, llistes blanques i degradació separada.
- Nova pàgina visual per a AROME, AROME previsió immediata, PE-AROME, ARPEGE,
  PE-ARPEGE i PIAF. Els productes WMS ofereixen mapa directe sobre Catalunya.
- Els ensembles indiquen membres, protocol i disponibilitat sense fingir un
  mapa raster: la seva ingestió WCS/GRIB queda separada de la interfície.
- PIAF pot fallar sense afectar cap altre model ni la previsió principal.
- El desplegament de staging sincronitza les sis credencials de GitHub amb el
  Worker de proves sense imprimir-ne els valors ni generar configuracions parcials.

## Millora — accés al visor AROME complet · 2026-10-04

- Quan se selecciona AROME, el peu del visor local ofereix un accés directe a
  les cartes completes del model sobre Catalunya a Meteologix.
- L’enllaç queda ocult amb ECMWF, GFS i ICON per evitar barrejar fonts i només
  complementa la graella local; no substitueix les dades d’Open-Meteo.

## Millora — AROME HD entra a la previsió i al laboratori · 2026-10-04

- La comparació pública afegeix AROME France HD (~1,5 km) durant les primeres
  48 hores, sense fingir un horitzó de set dies ni substituir ECMWF, GFS o ICON.
- Quan el proveïdor no lliura un codi meteorològic diari, la comparació mostra
  una síntesi identificada com a derivada a partir de pluja i nuvolositat.
- El nou visor AROME local mostra 49 punts del Baix Montseny, quatre capes i
  una animació horària de 48 hores. La interfície l’identifica com una graella
  mostrejada i no com el raster natiu complet de Météo-France.
- El visor de Windy continua separat i limitat als tres productes globals que
  permet inserir; AROME usa Open-Meteo i atribueix també Météo-France i OSM.
- Fonta conserva AROME HD com a candidat en ombra, però manté AROME France en
  l’algoritme vigent per no reiniciar ni contaminar la sèrie prospectiva.
- La renovació de la memòria cau PWA garanteix que la nova comparació arribi
  als dispositius que ja tenien instal·lada la web.

## Millora — avisos Meteocat amb mapa protagonista · 2026-10-04

- Les targetes automàtiques d’avisos abandonen la composició lateral que
  comprimia Catalunya i converteixen el mapa comarcal en l’element principal.
- El Vallès Oriental conserva el contorn blanc i guanya una identificació
  directa; recompte, llegenda i atribució queden ordenats sota el mapa.
- El detall local separa nivell, franges, distribució i llindar oficial. El
  comentari extens continua al text de la publicació i ja no satura la imatge.
- No s’afegeix una segona publicació automàtica ni un Reel redundant. Un futur
  format animat només serà admissible quan les franges oficials mostrin una
  evolució territorial rellevant i disposi de deduplicació pròpia.

## V22.33.0 — Plans actius de Protecció Civil · 2026-10-04

- La pàgina d’Avisos incorpora un bloc propi del CECAT amb tots els plans de
  protecció civil actius, la fase, l’actualització, la descripció i el comunicat
  oficial, actualitzat cada 30 minuts.
- El registre general es presenta com «Actiu a Catalunya» i mai com una
  afectació local. Només una anàlisi CECAT vigent, taronja o vermella, pot
  mostrar «Afectació confirmada a Sant Celoni o entorn».
- Meteocat continua sent la font dels avisos meteorològics. Aquesta capa és
  informativa, complementària i no genera notificacions ni publicacions noves.

## Correcció — el mapa estacional segueix el mes del calendari · 2026-10-02

- Abans de l'actualització Meteocat del dia 5, el bloc mensual mostra el mes
  actual a partir del segon horitzó de l'edició anterior, en lloc de continuar
  ensenyant el primer mapa amb el nom del mes acabat.
- Quan arriba la nova edició, el mes actual passa automàticament al primer
  horitzó i es recuperen els quatre mesos disponibles. Els mesos sense mapa
  oficial queden ocults, mai inventats ni duplicats.
- El text identifica alhora el mes representat i l'edició Meteocat d'origen.

## Correcció — llarg termini llegible i edició mensual inequívoca · 2026-10-02

- Les dates, descripcions, anomalies, fonts i notes de la tendència de sis
  setmanes augmenten de mida i deixen de truncar informació rellevant.
- El bloc estacional indica quina edició mensual de Meteocat està realment
  disponible i quan s'espera la següent. Abans de l'actualització oficial del
  dia 5 a la tarda, no presenta el mapa del mes anterior com si fos l'actual.
- Les imatges oficials incorporen una clau de l'edició disponible per evitar
  que el navegador o la PWA conservin una còpia d'un mes anterior.

## Millora — Fonta inicia el contrast regional privat amb XEMA · 2026-09-29

- La recollida diària XEMA ja activa conserva en R2 originals privats i
  previsió congelada abans dels fets per a sis referències regionals.
- KX queda formalment restringida a precipitació: no participa en cap
  avaluació tèrmica perquè Meteocat confirma que és un pluviòmetre.
- La pàgina Fonta incorpora un panell regional amb nombre de captures,
  estació-dies contrastables i capacitats de cada codi XEMA.
- El resum públic no conté lectures, originals, errors meteorològics ni
  paràmetres entrenats. Només informa del progrés operatiu i les salvaguardes.
- Fonta continua en mode ombra, sense alimentar la previsió operativa, els
  avisos ni les xarxes socials.

## Millora — referència aerobiològica XAC per al Baix Montseny · 2026-09-29

- La pàgina de Medi Ambient substitueix el resum parcial de cinc pòl·lens CAMS
  per la predicció setmanal oficial PIA–XAC / UAB de pòl·lens i espores.
- Bellaterra és la referència principal recomanada per a Sant Celoni i Girona
  aporta el contrast de vegetació més humida; Manresa només actua com a reserva
  explícita quan Girona no respon. Els nivells no es promitgen.
- Un proxy públic restringit del Worker valida estació, mida, estructura bàsica
  i llicència abans de lliurar l’XML, amb memòria cau per no carregar l’origen.
- La interfície mostra període, vigència, nivell 0–4, tendència, tots els tàxons,
  font i limitació territorial. Dades absents o caduques no es converteixen en
  zeros ni en una falsa mesura local de Sant Celoni.
- Reutilització no comercial `CC BY-NC-SA 4.0`, amb atribució i enllaç al PIA.
  No s’utilitzen logotips ni les gràfiques de dades reals, que no admeten
  extracció automatitzada pública.
- La publicació social continua bloquejada (`publishing:false`) fins que una
  mostra real sigui revisada visualment i editorialment. Sense D1, secrets,
  horaris ni publicacions noves.

## Correcció — comunicats CECAT textuals sense falsa avaria · 2026-09-29

- Les actualitzacions oficials INUNCAT sense els quatre mapes municipals es
  registren ara com a no publicables i finalitzen correctament, sense generar
  targetes ni correus de fallada.
- Un PDF amb mapes però amb plantilla desconeguda, colors insegurs o geometria
  insuficient continua fallant tancat perquè un canvi real de format no passi
  desapercebut.
- El comunicat `I-127696` s'ha confirmat com una actualització textual vàlida;
  no hi havia cap peça visual que el sistema pogués publicar amb seguretat.

## Millora — app i giny natius per a macOS · 2026-09-29

- El mateix projecte genera ara una app i una extensió WidgetKit pròpies de
  macOS, sense dependre dels «Ginys de l'iPhone» ni de la Duplicació de l'iPhone.
- El giny del Mac conserva els formats petit, mitjà i gran, les dades en directe,
  la memòria cau segura i la previsió de quatre dies; en tocar-lo obre l'app
  nativa del Mac.
- L'app adapta les instruccions i la barra d'eines a cada sistema. Els formats
  de pantalla bloquejada de l'iPhone i la compilació iOS queden preservats.
- Compilacions macOS signada i iPhone Simulator correctes; vuit proves Swift i
  control automàtic de la configuració multiplataforma superats.

## Correcció — lectura completa al giny gran · 2026-09-29

- La temperatura actual conserva espai prioritari i redueix la mida abans de
  truncar-se, també quan el giny de l'iPhone es mostra a l'escriptori del Mac.
- El bloc de mètriques té una amplada estable i etiquetes adaptables perquè la
  composició no amagui decimals, unitats ni valors meteorològics.
- No canvien les fonts, els càlculs, el refresc ni els altres formats del giny.

## Millora — giny gran amb previsió de quatre dies · 2026-09-29

- Nou format gran per al Mac i la pantalla d'inici de l'iPhone: lectura real,
  sensació, humitat, màxima, mínima i pluja d'avui, més quatre dies de previsió.
- Cada dia futur conserva el seu símbol, màxima, mínima i probabilitat màxima
  de pluja d'Open-Meteo; respostes parcials o absents no generen valors ficticis.
- La memòria cau antiga continua sent compatible i els formats bloquejat,
  petit i mitjà es mantenen sense canvis.

## Millora — giny mitjà per a l'escriptori del Mac · 2026-09-29

- El giny privat d'iPhone ofereix també un format mitjà reutilitzable al Mac
  mitjançant «Ginys de l'iPhone», sense crear cap servei ni credencial nous.
- La composició amplia la lectura real amb sensació tèrmica, humitat, condició,
  màxima, mínima, probabilitat de pluja i estat de vigència o memòria cau.
- Els formats petit i de pantalla bloquejada es mantenen intactes; la humitat
  absent continua mostrant-se com a dada no disponible, mai com a zero.

## Correcció — coherència del mapa d'avisos Meteocat · 2026-09-29

- Cada targeta oficial agrega el nivell comarcal només per al mateix fenomen
  meteorològic que explica el titular; un avís vermell de pluja en 30 minuts ja
  no pot tenyir de vermell el mapa d'un avís taronja de pluja en 3 hores.
- El peu del mapa explicita que els colors corresponen al mateix fenomen i una
  prova de regressió cobreix la coexistència real de dos avisos amb nivells
  diferents al Vallès Oriental.
- Worker 22.29.24. Sense canvis de D1, secrets, horaris ni criteris de publicació.

## Preparació — contrast regional diari Fonta · 2026-09-29

- Nou lector estricte del conjunt XEMA diari de dades d'alt valor: màxima,
  mínima i precipitació només amb estat representatiu, dies tancats, unitats i
  rangs verificats; zeros reals preservats i duplicats descartats.
- Previsions de quatre models congelades per a sis estacions i comparació sobre
  les mateixes estacions/dies, amb errors de temperatura i pluja i taula de
  contingència per episodis. Sense entrenament ni correcció de Fontanillas.
- Originals i procedència només al bucket R2 privat, objectes immutables,
  verificació de lectura i límits compartits. Cap dada XEMA crua a GitHub o web.
- Workflow diari opt-in desactivat, GitHub de només lectura i concurrència única
  per al bucket. Sense Worker, D1, publicacions, desplegament ni activació.
- La prova manual funciona amb el cron desactivat i crea de manera segura el
  directori pare absent en un checkout nou, mantenint el rebut create-only.
- Metodologia, cauteles de reutilització i fases a
  `docs/FONTA-XEMA-DAILY-2026-09-29.md`.

## Millora — quatre franges CECAT completes · 2026-09-28

- La targeta local deixa de resumir només la franja més crítica i mostra els quatre mapes oficials del dia en una graella 2 × 2, convertits a hora de Sant Celoni.
- La publicació continua exigint almenys una franja activa o futura taronja o vermella, però conserva també verd i groc per explicar l'evolució completa.
- La deduplicació utilitza el perfil de les quatre franges: un comunicat nou idèntic no repeteix la peça i qualsevol canvi material pot preparar una actualització.
- Worker 22.29.23. Sense canvi d'esquema D1 ni secrets nous; detecció i autopublicació continuen desactivades per defecte.

## Preparació — risc local CECAT complementari · 2026-09-28

- Consulta programada cada 30 minuts del conjunt oficial de plans actius del CECAT, limitada a INUNCAT i amb reserva persistent per franja i comunicat.
- Processament aïllat a GitHub Actions: PDF oficial, mapes incrustats sense captures externes, conversió UTC a hora local i filtre geogràfic de Sant Celoni més un entorn aproximat de 12 km.
- Llindar editorial conservador: verd i groc no publiquen; només taronja o vermell poden preparar una targeta. Formats desconeguts, dates caducades o colors no reconeguts s'aturen sense crear publicació.
- Targeta 1080 × 1350 amb mapa oficial sense recolorir, marcador local, franja, nivell, font i advertiment que és risc de Protecció Civil, no probabilitat de pluja. El text es presenta com a complement del possible avís comarcal Meteocat, mai com un duplicat.
- Dedupe per situació material —data, franja, fenomen i nivell— encara que el CECAT renovi el document; PNG/JPEG privats a R2 i lliurament per la cua social existent. Detecció i autopublicació separades i desactivades per defecte. Sense desplegament, activació, migració D1 ni publicació real en aquest paquet.
## Preparació — Fonta 0.2 i retards reals de GitHub · 2026-09-27

- Detectat amb l'arxiu real que els crons, Single Runs i R2 funcionen, però les
  captures del matí arriben sovint cap a les 13 UTC i la finestra 08–10 les
  deixava permanentment fora de l'avaluació: set captures i zero dies comparables.
- Nova política prospectiva `fonta-first-prospective-08-18z-v2`, aplicada només
  a captures noves; les 0.1 es conserven però no es reclassifiquen ni es puntuen
  retroactivament. Fonta passa a 0.2.0 i els paquets aparellats a v2.
- El fitxer diürn queda reservat fins a les 18 UTC perquè un cron retardat no
  ocupi la franja nocturna. Single Runs conserva els paquets antics com a llegibles
  però inicia una sèrie nova amb la mateixa política.
- Diagnòstic i web expliquen la política vigent i les exclusions. Sense XEMA,
  publicacions, Worker, D1, secrets, promoció ni canvi dels mínims científics.
- Evidència i rollback a `docs/FONTA-ISSUE-POLICY-V2-2026-09-27.md`.

## Correcció — Widget d'iPhone resilient · 2026-09-20

- El widget consulta `/widget-observation`, una ruta pública lleugera basada en
  l'última observació desada a D1, i conserva el fallback en directe si encara
  no hi ha cap captura disponible.
- L'app força la renovació de la línia temporal després d'una lectura correcta;
  l'extensió desa l'últim snapshot vàlid durant noranta minuts i el marca com a
  lectura guardada si una actualització posterior falla.
- Worker 22.29.21. Sense canvis de D1, secrets, horaris ni publicacions.

## Preparació — franges corregides i primer tall de verificació · 2026-09-20

- Separació real entre la portada i «El que queda d'avui», targeta única centrada i acotada, i contenidor visual propi per als símbols.
- Transicions dia/nit representades com una posta de sol recognoscible; absència d'`is_day` amb cel genèric, sense l'antic cercle ambigu. Nova cache PWA `home-dayparts-v3`.
- Avís específic en arribar a 29/30 pronòstics verificats: el primer tall detecta tendències, però no certifica ni activa correccions automàtiques; la poca mostra de dies plujosos queda explícita.
- Orientació nord i bombolla centrada registrades com a comprovacions declarades pel responsable. Ventilació, altura sobre terreny, altitud i calibratge continuen pendents.

## Preparació — portada per franges i fitxa YT60234 · 2026-09-20

- Targetes de portada adaptables a una, dues o tres franges, símbols SVG segons codi meteorològic, data local llegible, temperatura sense duplicats arrodonits i pluja/ratxa amb absències explícites.
- Símbol nocturn només quan totes les hores de la franja indiquen nit; motiu neutre en transicions o absència d'aquesta dada. La lluna és una icona meteorològica, no la fase lunar.
- Estils coherents amb la portada, controls accessibles, quatre idiomes i nova revisió de cache PWA `home-dayparts-v2`. Sense noves peticions, canvis al càlcul compartit de previsió ni publicadors.
- Model YT60234 identificat per etiqueta i manual correcte; precisions nominals separades de les comprovades. Protocol tèrmic i checklist de muntatge pendents d'execució física, sense correccions, compres, fotos publicades ni canvi d'època instrumental.

## Preparació — còpies automàtiques Fonta R2 · 2026-09-20

- Workflow independent dues vegades al dia, restringit a main i activació explícita; GitHub només lectura i credencials S3 pròpies del bucket.
- Exportació estable per snapshot, transport S3 amb SDK fixat, pujada condicional sense sobreescriure, hashes, restauració completa i reconstrucció dels informes abans d'emetre el rebut.
- Límit de 100 MiB i menys de 1.000 objectes, avís al 80%, sense esborrat ni caducitat automàtica. Cap modificació a observacions, publicacions o Worker.
- Proves de serialització/signatura S3, absències, inventari incomplet, corrupció, interrupció/reintent i pressupost. Prova remota amb credencial restringida i activació encara pendents.
- Estació declarada VEVOR 7 en 1; referència exacta i especificacions no inferides.

## Operació — Fonta, activació i recuperació real · 2026-09-20

- Single Runs activat amb autorització; primera execució programada pendent, separada de les proves manuals.
- Bucket R2 privat separat, captura i manifest pujats i recuperats amb integritat; informe reconstruït sense promoció. Còpies automàtiques pendents de credencial dedicada i validació del transport.
- Consulta XEMA enviada des d'Outlook i comprovada a Enviats; integració automàtica encara desactivada a l'espera de resposta.
- Fotos revisades en privat i altura declarada precisada a 0,70 m sobre teules. Sense canvi d'època instrumental, correcció tèrmica ni publicació de fotografies.
- Evidència, límits i passos pendents a `docs/FONTA-ACTIVATION-2026-09-20.md`; no modifica Worker, D1 ni publicadors.

## Preparació — Fonta, tres circuits independents · 2026-09-20

- Transport R2 acotat, claus per contingut, verificació després de pujar i restauració en destí nou; exportació compatible v1 i mixta v1/v2. Recurs remot, permisos i prova real encara pendents d'autorització.
- Comparació Single Runs hora a hora amb observacions properes ±150 s, filtre diari, DST i mateixos dies per als comparadors. Workflow propi desactivat; no canvia el pilot 0.1.0 ni les publicacions.
- Auditoria XEMA real de sis candidates: cinc amb cobertura completa però provisional, una sense temperatures al dia consultat. Condicions específiques ambigües: consulta preparada, sense activació ni redistribució.
- Proves de restauració, integritat, límits, hores i qualitat; evidència i activació a `docs/FONTA-INDEPENDENT-2026-09-20.md`.

## Preparació — Fonta, comparació aparellada i arxiu portable · 2026-09-20

- Fonta passa al final de «Previsió i risc», després d'Avisos, sense augmentar-ne la prominència. Cache PWA `fonta-lab-v3`.
- Paquets prospectius additius amb tots els comparadors congelats, integritat i mètriques sobre els mateixos dies; sense reconstruir el passat ni iniciar un holdout de promoció.
- Prova Single Runs local separada amb identitat explícita, cobertura horària Europe/Madrid i rebuig de nuls/duplicats; tres models amb 24/24 hores reals del dia objectiu. Font activa preservada.
- Auditoria de cron de només lectura, exportació portable verificada i preselecció oficial XEMA amb condicions encara pendents. Detall i límits a `docs/FONTA-FOUNDATIONS-2026-09-20.md`.
- Sense noves consultes periòdiques, serveis contractats, canvis de Worker/D1/socials ni reescriptura de captures.

## Preparació — Fonta, seguiment i protocol de validació · 2026-09-20

- Diagnòstic additiu a l'informe: fonts i hores de recepció, qualitat i motius de descartament, captures fora de finestra, pressupost i dies reals d'entrenament disponibles.
- Panell amb caducitat, franges recents sense captura i marges explícits, compatibilitat amb informes antics i neteja segura d'estats després d'errors. Backtest separat dels resultats de prediccions congelades.
- Activació autoritzada del PR 162 documentada; estació declarada a 1 m sobre teules vermelles, revisió fotogràfica pendent. Sense correcció instrumental inferida.
- Protocol de validació proposat i estudi Single Runs real: l'API rebutja agregats diaris per al run UTC en Europe/Madrid; sèries horàries disponibles però amb absències a AROME. No s'ha canviat la font activa.
- Algoritme 0.1.0 preservat. Cap nou secret, servei contractat, consulta periòdica, canvi de Worker, D1 o publicacions.

## Preparació — Fonta, laboratori de previsió local · 2026-09-20

- Nova pàgina experimental, integrada al menú, amb metodologia, comparadors, errors i estat de l'arxiu; sense afirmar superioritat ni extrapolar una estació a tot el Montseny.
- Captures horàries/diàries de quatre fonts, originals amb hashes, qualitat d'observacions sense zeros ficticis ni penalització per jitter, dies de 23/24/25 hores i límits de recursos.
- Correcció tèrmica limitada, verificació cronològica amb embargament i candidats immutables abans dels fets; resultats recalculats separats dels prospectius. Sense promoció automàtica.
- Workflow independent, desactivat fins a configuració explícita; cap canvi al Worker, D1, secrets, horaris ni publicacions. Auditoria real, operació i fases pendents a `docs/FONTA-LAB.md`.

## Preparació — seguiment social i pol·len XAC local · 2026-09-20

- Desplegament PR 160 documentat, separat de les comprovacions futures dels lliuraments reals.
- Lector/previsualització XAC fora dels publicadors, amb dates explícites, pòl·lens i espores separats, escala original, absències i atribució CC BY-NC-SA 4.0. Detectada en la resposta real una setmana futura respecte del dia de consulta.
- Ús no comercial confirmat. Referència territorial pendent; consulta a la XAC preparada, no enviada. No s'activa cap nova font social.
- Plantilla de seguiment de retenció, comparticions, desats i seguiments amb dades natives i comparacions homogènies. Sense mètriques inventades ni API d'analítica nova.
- Sense canvis de Worker, horaris, secrets, D1, publicacions ni desplegament.

## Preparació — format social 05 als publicadors · 2026-09-20

- Worker 22.29.20: noves imatges diàries amb franges, lectura i gràfica observades, pluja prominent, aire i UV secundari; esborranys i imatges antics preservats.
- Vídeos de 30 s integrats al workflow existent amb dades acabades de recollir, fase lunar datada i mapa final. Rebuig de snapshots de pilot o caducats; fonts opcionals poden fallar sense inventar zeros.
- Proves de dates, manca de dades, maquetació i rollback; workflow manual de previsualització sense secrets ni enviaments. Staging separat i revisió humana abans de producció.
- Horaris i deduplicació intactes. Lliuraments reals i pol·len pendents; detall a `docs/SOCIAL-PRODUCTION-V5-2026-09-20.md`.

## Preparació — vigència ambiental i pilot social 05 · 2026-09-20

- UV del sensor amb límit de 30 minuts i hora visible; estimacions actuals caducades als 90 minuts. Reavaluació cada minut i consulta de model cada quinze minuts amb la pàgina visible.
- Pol·len: abast de les cinc espècies explícit; no descarta altres al·lèrgens. Incorporació social ajornada fins a verificar referència territorial, nivells i llicència.
- Pilots locals de matí i vespre de 30 segons, fase lunar datada i mapa de pluja sempre a l'última escena. Revisió 05: UV com a nota discreta a la tarda, amb hora i font; no substitueix el mapa. Imatge del migdia amb lectura real, gràfica, franges restants, aire i UV de menor pes visual.
- UV global i aire regional separats, sense zeros ficticis. Proves de temps/DST, caducitat, errors i maquetació. Detall i fonts a `docs/SOCIAL-ENVIRONMENT-IMPLEMENTATION-2026-09-20.md`.
- Sense modificar Worker, D1, secrets, horaris ni publicacions. Format social nou no integrat al programador ni activat; pendent de revisió visual humana. Rollback frontend per reversió i renovació de memòria cau.

## Correcció local — dades ambientals absents · 2026-09-20

- Medi Ambient deixa de convertir absències, buits, booleans i valors invàlids en zeros o qualitat de l'aire bona. Es conserven els zeros reals i s'oculten els marcadors sense dades.
- Pol·len sense dades no escull una espècie dominant fictícia. UV diferencia sensor, model i absència, sense atribuir una font a un valor desconegut.
- La data/hora absent o invàlida no se substitueix per l'hora actual. La validesa del model inclou data i hora local de Sant Celoni, independent del fus del dispositiu.
- Meteo IA dona un estat neutral amb indicadors incomplets; manté precaució/advertiment si les dades disponibles ho justifiquen.
- Proves de regressió del render real i del consumidor Meteo IA incloses a la suite ràpida. Integrat a la PR 158 i verificat en producció el 20/09/2026. Sense canvis de llindars, disseny de vídeos, Worker, D1, horaris ni publicacions; rollback per reversió del paquet frontend.

## Sis paquets seqüencials — fiabilitat i consulta ràpida · 2026-09-20

- Administració: separa configuració, execució sol·licitada, programació i confirmació del proveïdor. Un horari de YouTube passat sense comprovació pública no apareix com a lliurament verificat.
- Recuperació de Shorts: confirmació humana al panell, només avui dins la finestra vigent, un intent manual, OAuth comprovat amb els secrets reals de GitHub i reserva atòmica. Errors de pujada incerts, resultats completats, execucions en curs i peticions ja sol·licitades queden bloquejats. Una recuperació fallida no reactiva reintents automàtics.
- GitHub Actions s’atura si falla la coordinació; calcula l’hora pública després del render i registra ID, privacitat i programació retornats per YouTube.
- Proves de maquetació Chromium a CI: mòbil 360/390/768 px, quatre dates de vídeo, sis targetes socials, Meteo IA i franges de portada; captures descarregables. No són una garantia estètica ni substitueixen la revisió de vídeo/iPhone.
- Portada: previsió restant per franges abans dels rècords; el detall complet es conserva a Predicció. Reutilitza les dades carregades, sense consultes addicionals. Absències visibles, màxim horari de probabilitat explícit i franges en hora de Sant Celoni.
- Meteo IA: quatre suggeriments principals, deu sota «Més preguntes» i exemples contextuals de demà.
- Prototip de correcció de temperatura diària només local: separació cronològica, embargament temporal, cobertura mínima, límit ±3 °C i comparació MAE/biaix/RMSE. No s’ha validat encara amb l’arxiu real ni modifica la previsió pública.
- Web 22.31.7 i Worker 22.29.19. Sense migracions, canvis d’horari, desplegament ni publicacions reals durant les proves. Requereix revisió humana, staging i desplegament autoritzat.

Rollback: revertir aquest paquet i desplegar versions prèvies autoritzades. Els registres de coordinació afegits són compatibles; no esborreu registres d’execucions o publicacions per forçar un reintent. Consulteu docs/YOUTUBE-RECOVERY.md.

## Correcció — Anys d’efemèrides sense decimals · 2026-09-18

- La targeta d’efemèrides mostra l’any com a enter sense decimals ni separadors de milers: `1971`, no `1971,0`. Les mesures meteorològiques mantenen la precisió anterior.
- Proves sobre tots els anys del catàleg, esborranys existents amb any numèric o cadena i valors absents o invàlids; aquests darrers mostren «—», sense inventar ni arrodonir anys.
- Worker proposat 22.29.18, pendent d’integració, staging i desplegament autoritzat. Sense migracions, consultes D1 noves, horaris ni enviaments. Les imatges ja publicades o desades a R2 no es reescriuen; revertir aquesta correcció permet rollback sense canviar dades.

## Millora — Previsió diària per matí, tarda i vespre · 2026-09-17

- Els vídeos substitueixen les escenes de resum general, detall repetit i segon dia per tres franges amb símbol, condició, temperatures i ratxa propis: 06–12 h, 12–19 h i 19–24 h, hora de Sant Celoni. Es conserven les sis escenes, transicions, gràfica tèrmica, tendència, mapa animat i límit de 30 segons.
- El matí explica avui; el vespre explica demà amb la data explícita. La targeta del migdia conserva les dades reals i la gràfica, i mostra la tarda des de les 14 h i el vespre, sense repetir el matí.
- Les franges s’obtenen de les dades horàries d’Open-Meteo, no del símbol ni de la probabilitat diària. La pluja es presenta com a màxim de les probabilitats horàries, no com a probabilitat conjunta de tota la franja. Probabilitat i ratxa respecten l’hora precedent indicada pel proveïdor.
- Les dades incompletes es mostren com a absents, mai com a zero. Una tempesta o ruixat curt no queda amagat pel cel predominant. Els textos curts mantenen les tres franges, la data i l’enllaç.
- Logo conservat, peu del vídeo separat en dues línies i maquetació compacta de la targeta. Els esborranys antics sense franges continuen compatibles i les imatges ja desades no s’invaliden.
- Worker proposat 22.29.17; web 22.31.6 sense canvis. Sense migracions, secrets, horaris ni publicacions forçades. Preparat localment; pendent de revisió, PR, staging i desplegament autoritzat.

## Funcionalitat — Widget privat d'iPhone · 2026-09-15

- Primera app nativa privada de Meteo Fontanillas amb widgets en línia, circular i rectangular per a la pantalla bloquejada, més un format petit per a la pantalla d'inici.
- La temperatura és l'observació real del Worker; la condició, la màxima, la mínima i la probabilitat de pluja s'identifiquen com a previsió d'avui d'Open-Meteo.
- Les dades absents no es converteixen en zeros i una lectura de reserva queda marcada com a «Darrera lectura fiable» amb la seva antiguitat.
- La fase no modifica el Worker, D1, la PWA, els horaris ni les publicacions. La instal·lació física queda pendent de disposar d'Xcode complet i seleccionar l'equip de signatura de l'usuari.

## Millora — Publicació matinal a les 06:45 · 2026-09-15

- La targeta diària, els Reels i Stories de Meta, TikTok, X i el YouTube Short passen de les 07:00 a les 06:45, hora de Sant Celoni.
- La comprovació preventiva s’avança a les 06:30 i el disparador principal del vídeo a les 06:05; la reserva de GitHub s’executa a les 06:20 tant a l’estiu com a l’hivern.
- Les finestres de recuperació de YouTube, TikTok i X mantenen els mateixos marges i la protecció contra duplicats. Les franges de les 14:00 i les 20:30 no canvien.
- Web 22.31.6 i Worker 22.29.16 desplegats a producció el 15-09-2026 després de superar staging. Sense migracions, secrets ni publicacions socials forçades durant el desplegament.

## Correcció — Represa segura de Threads · 2026-09-13

- Si Threads declara un contenidor d’imatge com a preparat però el pas final respon temporalment que el recurs no existeix, el Worker torna a provar una sola vegada reutilitzant exactament el mateix contenidor.
- La represa no crea una segona imatge ni torna a enviar els canals ja completats. Qualsevol segon resultat ambigu continua bloquejat per a comprovació humana.
- La incidència del vespre del 13-09-2026 s’ha recuperat després de comprovar primer el perfil públic; Bluesky i Telegram no s’han repetit.
- Worker proposat 22.29.15; web es manté en 22.31.5. Sense migracions ni secrets nous.

## Correcció — Cua resilient de vídeos i independència de canals · 2026-09-13

- Una execució de GitHub acceptada conserva la reserva durant 45 minuts: el Worker deixa d’enviar un nou intent cada deu minuts mentre el primer encara espera servidor.
- Si GitHub comença tard, YouTube publica immediatament dins dels 90 minuts posteriors a la franja; si encara falten menys de cinc minuts, espera l’hora prevista i no publica abans.
- TikTok adopta la mateixa recuperació de 90 minuts i envia immediatament quan el vídeo arriba després de l’hora, sense crear una programació amb data passada.
- Un error de TikTok ja no interromp els passos d’X ni converteix en fallida una pujada de YouTube que ja s’ha completat.
- La recuperació manual del matí del 13-09-2026 ha generat, desat a R2 i publicat correctament el Short de YouTube `eg4HRkShnJY`; no s’ha repetit cap publicació ja completada.
- Worker proposat 22.29.14; web es manté en 22.31.5. Sense migracions ni secrets nous.

## Correcció — Neteja Cloudflare, webcam accessible i sincronització push · 2026-09-12

- S’ha retirat del compte la integració redundant de Workers Builds `observatori-fontanillas`; el projecte Pages del mateix nom i el Worker productiu `fonta-meteo` continuen actius.
- El nom accessible de la previsualització de la webcam coincideix literalment amb «Webcam · ara» i elimina l’avís detectat per Chrome.
- Les subscripcions push actives es refresquen al registre propi sense reenviar les mateixes etiquetes a OneSignal en cada visita, evitant l’operació redundant que retornava 409. Desar o desactivar preferències continua actualitzant els dos sistemes.
- El diagnòstic segur de YouTube confirma les credencials renovades sense generar ni pujar cap vídeo.
- La diagnosi remota confirma la connexió de Buffer/TikTok i el permís del disparador Cloudflare → GitHub sense crear cap esborrany ni iniciar cap vídeo.
- Verificada una seqüència diària completa d’X: les franges de matí, migdia i vespre del 12-09-2026 es van enviar al primer intent, amb estat remot `sent` i enllaç de publicació.
- Web proposada 22.31.5; Worker es manté en 22.29.13. Sense migracions, secrets, publicacions reals ni desplegament automàtic.

## Millora — Auditoria mòbil, càrrega única i diagnòstic segur de YouTube · 2026-09-12

- Una traça mòbil real en producció confirma un LCP de 408 ms i CLS 0,00; les correccions se centren en problemes mesurats, sense reestructurar el portal ni afegir dependències.
- La portada evita una segona càrrega simultània de les dades actuals i de l’històric quan el navegador recupera el focus durant l’arrencada.
- Només es descarrega la webcam visible: s’elimina una petició duplicada de la imatge de 1920 × 830, equivalent a uns 258 kB transferits i 475 kB potencialment evitables segons Chrome.
- Cercador, selector d’idioma, mapa de radar, avís ràpid, botó «Més» i fonts del radar corregeixen els defectes d’accessibilitat detectats; la comprovació local passa de 89 a 100 en accessibilitat.
- `llms.txt` descriu el projecte, les pàgines principals i la separació entre observació, models i avisos oficials.
- Un nou workflow manual permet comprovar les tres credencials OAuth de YouTube sense generar, llegir, programar ni pujar cap vídeo. No té horari automàtic i no s’executa amb aquest canvi.
- Web proposada 22.31.4; Worker es manté en 22.29.13. Sense migracions, secrets, publicacions reals ni desplegament automàtic.

## Correcció — Vigència social i límit de reintents de YouTube · 2026-09-12

- Els episodis de l’estació, resums periòdics, canvis ambientals i efemèrides només es poden reprendre durant el mateix dia local en què es van crear; l’endemà queden aparcats com a esborrany per revisar, sense eliminar l’historial ni tornar-los a publicar.
- YouTube conserva el número d’intent entre Cloudflare i GitHub Actions i admet un màxim de quatre intents per franja. Els estats intermedis `running` i `dispatching` ja no inflen el recompte de fallades.
- El procés de pujada classifica de manera segura els errors OAuth permanents, com `invalid_grant`, sense incloure tokens ni descripcions remotes. En aquest cas, Cloudflare atura immediatament els reintents de la franja i envia com a màxim l’avís operatiu ja previst.
- Tant el disparador principal de Cloudflare com la reserva programada de GitHub respecten el mateix bloqueig. Worker proposat 22.29.13; sense migracions, secrets, canvis d’horari, publicacions reals ni desplegament automàtic.

## Correcció — Conciliació segura dels vídeos de Meta · 2026-09-12

- Facebook consulta l’estat oficial del vídeo abans de reprendre la fase final d’un Reel o una Story després d’una resposta perduda.
- Si la fase de publicació ja consta com a completada, es reutilitza el mateix identificador i no es torna a enviar la petició final; si no hi ha una confirmació inequívoca, es conserva la represa del mateix vídeo sense iniciar una segona pujada.
- Les Stories adopten l’estat coherent `finish_pending` i continuen reconeixent l’antic `finish_failed` per no perdre intents ja desats.
- Les comprovacions i el desplegament de staging actualitzen pnpm Setup a v6 i Wrangler Action a v4, amb runtime Node 24 declarat pels proveïdors.
- Worker proposat 22.29.12. Sense canvis web, migracions, secrets, horaris, publicacions reals ni desplegament automàtic.

## Correcció — Contracte de l’històric a staging · 2026-09-12

- La validació de staging deixa d’exigir a `/history` un camp `ok` que aquesta ruta no exposa i comprova, en canvi, el contracte real: resolució, recompte, observacions i emmagatzematge.
- El recompte ha de coincidir amb la longitud retornada i es mantenen les comprovacions d’ordre temporal, mostres i cobertura quan hi ha dades.
- No canvia el Worker, el web, D1, els secrets ni les automatitzacions; evita un fals error després d’un desplegament correcte a staging.

## Correcció — Auditoria G · SEO, staging i vídeos — 2026-09-12

- Cada vista interna té una URL canònica pròpia i variants `hreflang` en català, castellà, anglès i francès; el sitemap ja inclou les vistes i els quatre idiomes.
- Títols, descripcions, Open Graph i dades estructurades canvien amb la vista i l’idioma. La cobertura del conjunt de dades comença el 4 d’agost de 2026 i no s’inventa una hora d’observació quan falta.
- Les pàgines estàtiques que tenien metadades incompletes incorporen alternances d’idioma i targetes socials. Les etiquetes visibles de versió i els recursos de la PWA queden alineats.
- La validació de staging comprova els contractes `raw`, `hourly` i `daily` de l’històric, inclosos ordre temporal, mostres i cobertura.
- Reels i Stories comparteixen una reserva atòmica per data i franja. Facebook conserva l’identificador, la URL de pujada i la fase del Reel per reprendre el mateix vídeo després d’una fallada sense començar-ne un altre.
- Web proposada 22.31.3, Worker proposat 22.29.11 i PWA `audit-g`. Sense migracions, secrets, publicacions ni desplegament automàtic.

## Correcció — Auditoria F · estadística, vent i temps local — 2026-09-12

- Les mitjanes i desviacions del Centre de Dades i de l’arxiu d’extrems ponderen cada agregat pel seu nombre real de mostres; la interfície separa dies amb dades i continuïtat intradiària.
- La direcció agregada del vent usa mitjana circular: 350° i 10° produeixen nord, mentre que direccions oposades sense orientació dominant queden sense valor.
- Els intervals horaris D1 segueixen hores UTC transcorregudes i conserven les dues hores repetides del canvi de tardor. Dates locals i UTC es reconstrueixen des de l’epoch a `Europe/Madrid` sense reescriure l’arxiu.
- Els temps locals heretats del navegador ja no depenen de la zona del visitant i es descarten durant una hora local inexistent.
- Web proposada 22.31.2, Worker proposat 22.29.10 i PWA `audit-f`. Sense migracions, secrets, publicacions ni desplegament automàtic.
- Es documenta per separat el projecte redundant de Workers Builds que origina checks vermells; no es converteix l’arrel del repositori en recursos públics per ocultar l’error.

## Correcció — Auditoria E · consum D1 i escales gràfiques — 2026-09-12

- L’històric comparteix durant cinc minuts una clau de memòria cau canònica per data i resolució, tant dins del Worker com a Cache API quan està disponible; el marcador `fresh` del navegador ja no força consultes D1 equivalents.
- La memòria cau només desa respostes amb observacions, funciona per centre de dades de Cloudflare i conserva la degradació normal si la memòria cau no està disponible.
- La resposta exposa `X-History-Cache: HIT`, `RUNTIME_HIT` o `MISS` per poder comprovar l’estalvi sense inspeccionar dades ni activar serveis de pagament.
- Els eixos temporals comencen i acaben a la primera i última observació reals. Pluja acumulada (`mm`) i intensitat (`mm/h`) utilitzen escales independents.
- Worker proposat 22.29.9 i PWA `audit-e`. Cap migració, reescriptura històrica, canvi d’horaris ni desplegament automàtic.

## Correcció — Auditoria D · històric i gràfiques — 2026-09-12

- Intervals d’històric corregits a dies de 24 hores; absències preservades en captures futures i agregats, amb recompte de mostres pluviomètriques conegudes.
- Gràfiques sense reserves fictícies, amb eix temporal proporcional i línies tallades als buits. Es conserven els punts i increments rebuts.
- Miniatures sense falsa línia plana quan falta historial; eixos ocults quan no hi ha dades. Llegenda pluviomètrica amb advertiment de parcialitat en quatre idiomes.
- Worker proposat 22.29.8 i PWA `audit-d`. Cap migració ni correcció retroactiva de dades. Proves SQLite, renderitzat i previsualització local; producció pendent de revisió humana.

## Correcció — Auditoria C · cobertura i pluja registrada — 2026-09-12

- Centre de Dades: sense dades pluviomètriques es mostra un guió, no 0 mm. Es preserven els zeros reals i s’indica que les sumes poden ser parcials.
- Dies amb registres separats de l’interval entre dates, amb calendari Europe/Madrid, inclosos canvis d’hora. Dates buides/futures i duplicats no inflen el recompte ni les sumes.
- Els comptadors expressen dies des de l’última pluja registrada, no una ratxa seca demostrada. Sense registre suficient no s’inventa un «Més de».
- La pluja de calendari es calcula amb l’arxiu seleccionat, sense atribuir una lectura actual sense data fiable al dia d’avui. La cobertura anual de pluja exclou dies sense dades pluviomètriques.
- Noves etiquetes en quatre idiomes i comprovació local a 320/360 px. Revisió de memòria cau `audit-c`; cap canvi de Worker, D1 ni automatitzacions.


## Correcció — Auditoria B · cua i reserva social — 2026-09-12

- Reserva atòmica D1 per esborrany i canal, compartida per enviaments manuals i automàtics d’imatges. Un intent incert o en curs no es reenvia.
- Separació entre preparació fallida, resposta incerta i èxit remot no registrat. Els errors definitius es conserven; quatre intents totals per canal.
- Recuperació limitada a deu candidats: retira esgotats i incerts a revisió i continua amb els següents; conserva l’historial i les reserves.
- Panell amb estats llegibles, botons bloquejats i conciliació manual d’un èxit comprovat sense publicació. Controls revisats a 320 i 360 px.
- Threads comprova el contenidor abans d’un únic POST de publicació. L’estat agregat de l’esborrany es calcula amb dades actuals en una sola sentència.
- Worker 22.29.7; sense migracions ni desplegament. Proves noves amb SQLite real i HTTP simulat. Abast i rollback segur a `docs/AUDIT-PACKAGE-B.md`.

## Correcció — Auditoria paquet A · dades i vigència — 2026-09-12

- Conversió numèrica compartida a la primera càrrega, Centre de Dades i calendari astronòmic: null, buits i booleans no es converteixen en zeros; els zeros reals es conserven.
- La primera càrrega no inventa una data actual quan falta l’instant d’observació i marca les lectures de cinc minuts o més com a desades. Les dates sense zona horària es descarten en aquesta via inicial.
- Els recordatoris astronòmics exigeixen tota la graella horària de la finestra, dades vàlides i llindars comprovats abans d’arrodonir. Es diferencien dia i nit, es mostra l’any i es corregeixen els articles dels canvis d’estació.
- Avisos oficials i astronomia: comprovació de vigència abans de publicar i durant recuperació; cap reutilització de text relatiu en un altre dia local. En avisos es comprova també el final de les franges comarcals, no només el final general de l’episodi.
- Un esborrany caducat passa a `draft` per revisió, sense esborrar intents ni identificadors remots. L’enviament manual també el bloqueja mentre la data no sigui vàlida.
- Worker V22.29.6, paquet web V22.31.0 amb revisió de memòria cau `astronomy-v2-audit-a`; es registren explícitament les dues versions a `project.json`. No hi ha migracions ni secrets nous.
- Proves noves dels creadors d’esborranys reals, dades nul·les, buits, duplicats horaris, canvi d’hora, canvi d’any i caducitat. Queden fora d’aquest paquet la reserva concurrent per canal i la recuperació dels intents esgotats.
- Rollback: revertir el canvi i desplegar la versió anterior amb aprovació. Els esborranys aturats continuen a D1 per revisió; no reaprovar-los ni reenviar-los en bloc.


## Millora — Publicacions de canvis d’estació i astronomia — 2026-09-11

- Els equinoccis i solsticis generen una publicació pròpia amb el dia i l’hora oficials, deixant clar que l’instant astronòmic no implica un canvi meteorològic sobtat.
- Els fenòmens anuals confirmats per l’IGN generen un avanç dos dies abans i un recordatori el mateix dia només si la previsió local ofereix una observació raonable.
- La targeta mostra la nit concreta, la font astronòmica i, al recordatori, nuvolositat i probabilitat de pluja. Les dates sense hora anual confirmada continuen al calendari web però no es publiquen automàticament.
- El calendari visible i el Worker comparteixen el mateix catàleg per evitar divergències; la deduplicació D1 i la recuperació per canal s’apliquen també a aquesta família.
- Distribució: Facebook, Instagram, Threads, Bluesky, Telegram i X. TikTok i YouTube continuen reservats als fluxos de vídeo i no reben una imatge estàtica disfressada de vídeo. Rollback: revertir aquest commit; no hi ha migracions ni secrets nous.

## Millora — Evolució tèrmica a les publicacions diàries — 2026-09-11

- Les imatges diàries incorporen una gràfica compacta de la temperatura observada durant les últimes 24 hores, amb punt actual, canvi i mínim i màxim del període.
- Els vídeos diaris mostren el mateix gràfic a la pantalla de dades reals i en dibuixen l’evolució de manera progressiva.
- El text identifica explícitament les dades com a observades perquè no es confonguin amb la predicció meteorològica.
- El resum es calcula una vegada des de l’arxiu D1 i es reutilitza a tots els canals; si no hi ha almenys sis hores vàlides, la composició anterior continua funcionant sense bloquejar cap publicació.
- La millora afecta els recursos compartits per Instagram, Facebook, Threads, Bluesky, Telegram, X, TikTok i YouTube. Rollback: revertir aquest commit; no hi ha migracions ni secrets nous.

## Correcció — Caixa de data dels vídeos diaris — 2026-09-11

- La pastilla superior reserva ara el marge horitzontal real del text i s’adapta a dies i mesos llargs sense que la data en sobresurti.
- L’amplada queda limitada a la zona segura de 928 píxels del format vertical, tant a l’edició del matí com a la del vespre i a totes les pantalles del vídeo.
- S’han afegit proves per a etiquetes curtes, la data «11 de setembre» i textos excepcionalment llargs. Rollback: revertir aquest commit; no modifica dades, secrets ni automatitzacions.

## Correcció — Valors anteriors i canvis sobtats — 2026-09-11

- Les publicacions puntuals d’observació ja no mostren «Valor anterior de l’arxiu: 0,0» quan no existeix cap rècord anterior associat.
- La comparació només apareix als extrems reals de l’arxiu i conserva correctament un zero quan aquest és una dada històrica vàlida.
- Els canvis sobtats de temperatura només generen una publicació a partir d’una diferència de 10,0 °C en aproximadament 24 hores; una variació inferior no l’activa.
- La correcció s’aplica a totes les publicacions esporàdiques de l’estació, no només a les d’índex UV. Rollback: revertir aquest commit; no hi ha migracions ni canvis de secrets.

## Manteniment — GitHub Actions sobre Node 24 — 2026-09-09

- Els workflows utilitzen les versions vigents d’`actions/checkout`, `actions/setup-node` i `actions/upload-artifact`, executades internament sobre Node 24.
- Els scripts del projecte es mantenen en Node 22 LTS; el canvi només elimina la dependència interna obsoleta de les accions de GitHub.
- Els dos fluxos de vídeo desactiven la memòria cau automàtica de paquets perquè no instal·len dependències i gestionen credencials de publicació.
- No canvia cap horari, secret, publicació, Worker ni dada meteorològica. Rollback: revertir aquest commit.

## Correcció — Fiabilitat del cercador municipal — 2026-09-08

- La cerca automàtica i «Buscar» comparteixen les peticions idèntiques en curs; enviar el formulari cancel·la el temporitzador pendent.
- Els dos cercadors descarten resultats obsolets després de canviar el text o l’idioma. La pàgina municipal també invalida la cerca quan se selecciona un resultat.
- Un únic reintent per errors de transport, temps d’espera, JSON truncat o resposta 5xx; sense reintentar 4xx ni límits 429. No desa cerques ni escriu a D1.
- El geocodificador rep el francès quan aquest és l’idioma seleccionat. Renovació de la memòria cau PWA per distribuir el canvi.
- La fallada inicial de Chamonix no s’ha pogut reproduir de manera sostinguda: el proveïdor ha tornat a respondre 200. La correcció resol defectes comprovats de concurrència i tolerància a errors, no atribueix sense proves la incidència a una causa externa concreta.
- Rollback: revertir el commit. Sense canvis al Worker, secrets, automatitzacions ni esquema de dades. Producció pendent de revisió i desplegament autoritzat.

## Correcció — Vigència destacada a les imatges d’avisos — 2026-09-07

- Les imatges `official_alert` mostren «PREVIST PER» i el dia complet abans del fenomen i del mapa, amb «NO ÉS PER AVUI» només quan el dia afectat és posterior al de creació de la publicació. La data de publicació acompanya aquesta indicació perquè sigui interpretable quan es comparteix més endavant.
- La data comarcal també encapçala el cos del missatge. Els esborranys antics poden recuperar-la de les franges; mai es dedueix de l’inici general de l’episodi ni de la data actual. Si falta una data comarcal vàlida, no es crea una publicació automàtica nova.
- La llegenda del mapa es refereix al dia indicat. Nova versió de la memòria cau només per a targetes d’avisos, sense reutilitzar imatges del format anterior ni modificar les altres famílies.
- Verificació: 59 fitxers de proves, dry-run del Worker i previsualització local de 1080 × 1350 sense solapaments. No modifica publicacions ja enviades; requereix merge i desplegament. Rollback: revertir el commit, sense migració D1.

## Correcció — Data visible als avisos socials futurs — 2026-09-07

- Les notificacions socials de Meteocat indiquen al començament si l’avís és per avui, demà o una data posterior, amb el dia de la setmana i la data visibles al títol.
- Quan l’avís encara no ha començat, el text aclareix que és una previsió oficial futura i que no descriu el temps actual.
- La data es pren del dia concret de l’evolució comarcal del Vallès Oriental, no de l’inici general de l’episodi, que pot començar abans en altres zones.

## Correcció — Capçalera mòbil en una sola fila — 2026-09-07

- L’hora redundant desapareix de la capçalera mòbil i només es conserva el punt verd que indica l’estat en directe.
- Menú, estat, cerca, idioma, Instagram, YouTube, TikTok i «Segueix-nos» comparteixen una única fila compacta, sense perdre les zones tàctils de 44 píxels.

## Correcció — Xarxes visibles en mòbil — 2026-09-07

- Instagram, YouTube i TikTok tornen a ser visibles directament a la capçalera mòbil en una franja pròpia, sense competir amb el menú, el rellotge, la cerca ni l’idioma.
- El desplegable «Segueix-nos» es conserva per donar accés a la resta de xarxes, i tots quatre controls mantenen una zona tàctil de 44 píxels.

## Correcció — Auditoria mòbil de navegació i llarg termini — 2026-09-07

- La predicció mensual respecta de nou el botó per desplegar els mesos següents; el contingut tancat ja no queda visible ni allarga innecessàriament la pàgina.
- Els mapes estacionals poden encongir-se dins la pantalla i ja no forcen una amplada d’escriptori en dispositius mòbils.
- El cercador i el selector d’idioma conserven sempre el text català com a font, de manera que es pot canviar consecutivament entre català, castellà, anglès i francès sense barrejar traduccions.
- En mòbil, els accessos socials s’agrupen en un únic control i els botons principals de capçalera, predicció, radar i Centre de Dades tenen una zona tàctil mínima de 44 píxels.
- La selecció inicial de pàgina passa a un fitxer propi permès per la política de seguretat, eliminant l’error CSP sense relaxar la protecció contra scripts en línia.
- La PWA renova la memòria cau i incorpora el nou inicialitzador perquè les correccions arribin també a les instal·lacions existents.

## Propera versió — Episodis automàtics de models — 2026-09-07

- Nova detecció automàtica de canvis destacats de temperatura, pluja, tempesta o vent a cinc dies vista, només quan coincideixen almenys dos dels models ECMWF, GFS i ICON.
- Cada episodi crea com a màxim una peça per fenomen i dia, amb un límit de dues peces en set dies per evitar alarmisme i saturació.
- Nou vídeo vertical de 18 segons amb text editorial en català, comparació dels models i quatre fotogrames horaris generats amb dades territorials reals del model coincident.
- La peça identifica sempre la font, el grau de coincidència i que es tracta d’una predicció de models, no d’un avís oficial.
- El flux desa una previsualització durant catorze dies, conserva el vídeo en un bucket privat i pot distribuir-lo a YouTube, Instagram, Facebook, TikTok i X sense duplicar canals ja completats.
- La creació d’esborranys, el vídeo i la publicació tenen tres interruptors independents, desactivats per defecte perquè la primera peça real es pugui revisar abans d’activar la publicació completa.

## Propera versió — Rècords de tot l’arxiu — 2026-09-07

- Nova secció «Rècords de l’Observatori» calculada sobre tot l’arxiu D1 disponible, independentment del selector d’un any del Centre de Dades.
- Cada extrem mostra el valor, la data, l’hora i l’antiguitat; el dia més plujós s’identifica explícitament com una acumulació del dia complet.
- El resum d’Estació presenta els sis rècords principals i el Centre de Dades conserva la taula completa de temperatura, vent, pluja, pressió, humitat, radiació i UV.
- La portada incorpora un accés directe als rècords i totes les vistes indiquen des de quina data hi ha arxiu, sense confondre aquests valors amb rècords climàtics oficials.
- El Worker calcula els extrems amb consultes agregades i conserva el resultat durant una hora a memòria i a la memòria cau de Cloudflare; no envia tot l’històric al navegador ni repeteix el càlcul a cada visita.
- Les màximes i mínimes d’humitat exigeixen un rang local plausible i una lectura veïna coherent: així una errada puntual o un bloc invàlid del sensor no es converteix en un rècord permanent, sense esborrar dades de l’arxiu.
- Els textos i les dates s’adapten al català, castellà, anglès i francès, i la PWA estrena una memòria cau pròpia.

## Propera versió — Centre de Dades per apartats — 2026-09-07

- El Centre de Dades s’organitza en cinc pestanyes: Resum, Gràfiques, Pluja, Episodis i Qualitat, conservant tot el contingut existent però evitant una pàgina única excessivament llarga.
- El selector de període continua governant el resum, les gràfiques, els extrems i les descàrregues encara que aquests continguts estiguin distribuïts entre pestanyes.
- L’acumulació de pluja anual mostra al mateix lloc l’interval cobert i quants dies contenen dades; ja no es pot interpretar com si representés necessàriament un any complet.
- La navegació per pestanyes admet teclat, conserva un enllaç compartible i reactiva les gràfiques quan es fan visibles.
- Els blocs compartits amb la pàgina Estació continuen visibles allí i les pestanyes només reorganitzen el Centre de Dades.
- Els controls nous disposen de traducció en català, castellà, anglès i francès, i la PWA utilitza una memòria cau nova.

## Propera versió — Bloc 1 de fiabilitat i lectura — 2026-09-07

- Els avisos queden separats entre vigents ara, previstos per a més tard avui, demà i dies posteriors; el recompte principal ja no barreja avisos futurs amb avisos actius.
- Cada avís mostra organisme, inici i final, i l’historial agrupa les actualitzacions solapades d’un mateix fenomen i organisme en un únic episodi sense perdre el nivell màxim.
- La verificació de la previsió contextualitza l’encert de pluja amb la composició real de la mostra, incorpora una comparació visual entre previsió i observació i explica l’índex Brier amb un exemple desplegable.
- La comparativa identifica les estacions amb l’identificador de Weather Underground i l’altitud quan la font la facilita; la pressió queda marcada com a orientativa si no consta una correcció comuna al nivell del mar.
- Les mesures de l’estació s’ordenen per temperatura i confort, vent i pluja, i sol i atmosfera, amb ajudes breus i l’Humidex presentat de manera coherent com a índex.
- El radar mostra l’hora exacta del fotograma, una llegenda d’intensitat i un control per tornar a Sant Celoni, i evita mostrar alhora un estat carregat i un missatge de càrrega.
- La secció astronòmica prioritza aquesta nit, calcula una finestra orientativa favorable i corregeix la qualificació de l’altura solar: 10,4° es considera sol baix, no sol alt.
- Els textos estàtics nous disposen de versions en català, castellà, anglès i francès, i la PWA estrena una memòria cau pròpia per aplicar els canvis sense conservar interfícies antigues.

## Correcció — Màxima i mínima del dia — 2026-09-06

- L’històric de l’estació es consulta des del mateix domini del portal, evitant que bloquejadors de contingut impedeixin recuperar les màximes i mínimes reals i forcin l’ús de dades antigues.
- El proxy conserva l’origen autoritzat del portal perquè el Worker combini també les lectures recents de D1, en lloc de retornar només l’arxiu parcial de Weather Underground.
- El Worker compartit de OneSignal referencia una versió explícita de la PWA, de manera que els navegadors instal·len la correcció immediatament i deixen d’executar el lector d’històric anterior.
- La lectura en directe participa sempre en el càlcul de la màxima i la mínima diàries, encara que l’històric remot arribi amb retard.
- La portada i el resum del dia ja no poden mostrar una màxima inferior a la temperatura actual ni una mínima superior, i associen l’hora correcta a l’extrem.
- Els extrems vistos pel navegador es conserven durant el dia i es combinen amb l’arxiu remot; una baixada posterior de temperatura ja no pot esborrar la màxima anterior.
- Les consultes de l’històric incorporen una renovació controlada i la PWA estrena una memòria cau nova per evitar respostes antigues després del desplegament.

## Propera versió — Portada, risc i llarg termini — 2026-09-05

- La predicció de sis setmanes i els mapes mensuals del Meteocat passen a una pàgina pròpia de llarg termini, amb enllaços d’anada i tornada des de la previsió operativa; no s’elimina cap contingut.
- La portada dona més pes als avisos oficials i hi mostra fenomen i vigència, a més del nivell, evitant resums meteorològics que puguin confondre estabilitat amb absència de risc.
- Afegida una entrada directa per desar municipis i configurar notificacions, mantenint aquestes preferències només al navegador de l’usuari.
- Clarificada la diferència entre temperatura, sensació tèrmica i Humidex, que ara es presenta correctament com a índex complementari de xafogor.
- La capçalera prioritza Instagram, YouTube i TikTok i agrupa la resta de canals sota «Segueix-nos».
- Els textos nous disposen de versions en català, castellà, anglès i francès, i la nova vista incorpora metadades pròpies.

## Propera versió — Mapes mensuals Meteocat — 2026-09-03

- Afegits a la secció de predicció els mapes oficials del Meteocat d’anomalia mensual de temperatura i precipitació, amb autoria, enllaç al portal i avís de limitacions.
- La predicció mensual mostra el mes actual per defecte i permet desplegar els tres horitzons següents amb un control «+», també traduït als quatre idiomes.

## Propera versió — Municipis, resum setmanal i SEO multilingüe — 2026-09-02

- Afegit a la portada un resum visual dels pròxims set dies, amb màximes, mínimes, probabilitat de pluja, ratxes i una lectura editorial separada de qualsevol avís oficial.
- La publicació social setmanal queda documentada com a família periòdica dels dilluns, amb deduplicació, cobertura mínima i distribució independent pels canals socials configurats.
- Les pàgines de municipis generen títol, descripció, canonical i dades estructurades específiques quan se selecciona una localitat, incloent-hi l’idioma triat.
- Afegides alternatives `hreflang` i entrades de sitemap per a català, castellà, anglès i francès a les pàgines públiques principals.

## V22.31.0 — Francès i col·laboracions tècniques — 2026-09-01

- Afegit el francès al selector d’idioma, als textos meteorològics dinàmics i a la configuració regional de dates i xifres.
- Auditoria automàtica del catàleg: cap frase registrada queda sense versió en castellà, anglès o francès.
- Nova pàgina pública de col·laboracions amb atribució visible, independència editorial i estat dels patrocinis declarat.
- Preparats dossiers professionals en castellà i anglès, en format editable i PDF, per proposar cessió o préstec de material.
- Preparats sis correus personalitzats per Bresser Iberia, Ecowitt, WeatherFlow–Tempest, Ambient Weather, Davis Instruments i Netatmo.
- La proposta inclou Instagram, Facebook, TikTok, YouTube i X, amb presentació inicial, actualitzacions periòdiques pactades i una peça final, sempre identificades com a col·laboració.
- La nova pàgina i el catàleg francès formen part de la PWA i del mapa del web.

## V22.30.1 — Traducció dinàmica i capçalera mòbil compacta — 2026-09-01

- Els textos que s’actualitzen quan arriben les dades meteorològiques conserven l’idioma triat, inclosos la lectura ràpida, l’estat dels avisos, les mètriques principals i les hores dels extrems.
- Els nombres, les hores i els punts cardinals utilitzen també la configuració regional de català, castellà o anglès.
- En mòbil, la pastilla d’estat mostra només el punt animat i l’hora; s’elimina «En directe» per guanyar espai a la capçalera.
- El prefix horari de màxima i mínima deixa de generar-se amb CSS i passa a ser text localitzat, evitant fragments fixos en català.

## V22.30.0 — Idiomes i cerca municipal global — 2026-09-01

- La capçalera incorpora una cerca de municipis basada en el mateix geocodificador d’«El temps arreu», amb suggeriments, navegació per teclat i selecció directa de la localitat.
- En seleccionar un resultat s’obre «El temps arreu» amb el municipi i les coordenades a l’URL, i la previsió corresponent es carrega automàticament.
- Nou selector propi de català, castellà i anglès, sense serveis externs de traducció, amb preferència desada només al navegador.
- La navegació, la capçalera, les presentacions principals i la cerca adapten els textos a l’idioma triat; les xifres i dates municipals utilitzen també la configuració regional corresponent.
- La cerca es mostra completa en escriptori i es converteix en un control compacte que s’expandeix a pantalla completa en mòbil, sense desplaçar les xarxes socials ni el menú.

## V22.29.2 — Vídeos socials nítids i titulars dins la zona segura — 2026-08-31

- Els titulars sense símbol meteorològic utilitzen un límit més conservador i «Ara mateix, dades reals» queda en dues línies completes dins del format vertical.
- Les pantalles es rasteritzen internament a 2160 × 3840 abans de reduir el vídeo final a 1080 × 1920, millorant vores, logotip i tipografia.
- El MP4 final passa d’un bitrate variable baix a H.264 High a 5 Mb/s constants, color BT.709 i fotogrames clau regulars perquè Stories, Reels, TikTok i YouTube disposin d’un original més resistent a la recompressió.

## V22.29.1 — Contrast del cercle de verificació — 2026-08-31

- El recompte i el text del cercle de predicció vs realitat utilitzen colors d’alt contrast, més pes i més amplada útil tant mentre es recullen dades com quan la mostra ja està disponible.

## V22.29.0 — Context temporal i quota oficial de Meteocat — 2026-08-31

- Totes les escenes dels vídeos del matí i del vespre mostren l’edició i la data completa de generació dins la zona segura de la imatge.
- Les etiquetes relatives «avui», «demà» i «demà passat» incorporen també el dia de la setmana, el dia del mes i el mes de la predicció.
- L’escena d’observació conserva la data i afegeix explícitament l’hora de lectura; els títols i la descripció de YouTube identifiquen també la data prevista.
- Les consultes d’avisos SMP de Meteocat queden limitades persistentment a les 06:30, 12:30 i 18:30: dues consultes del dia actual i una de l’endemà, amb un màxim planificat de 93 sobre les 100 mensuals disponibles.
- Cada franja es reclama una sola vegada a D1, fins i tot si el cron es repeteix o el Worker canvia d’instància; una fallada no provoca reintents que gastin més quota.
- L’administració mostra les consultes registrades pel Worker, el límit mensual i el màxim planificat sense exposar l’API Key.

## V22.28.1 — Imatges públiques i reintents segurs d’X — 2026-08-31

- Les targetes socials accepten `GET` i `HEAD`, de manera que Buffer pot validar-les com a imatges públiques abans de publicar-les a X.
- La publicació del migdia materialitza primer el PNG a R2 i reutilitza la mateixa URL estable durant tot el procés.
- Si Buffer crea una entrada però la marca amb error, el Worker conserva l’identificador remot i atura els reintents que abans omplien la cua amb duplicats.
- La diagnosi conserva el tipus de resposta, l’identificador remot i l’estat retornat per facilitar la recuperació sense afectar la resta de xarxes.

## V22.28.0 — Publicacions periòdiques i episodis destacats — 2026-08-31

- Preparats resums setmanals, mensuals, estacionals i anuals amb cobertura mínima de dades, extrems, pluja, vent, UV i verificació de la previsió de l’endemà.
- Afegits episodis puntuals de pluja intensa, vent, calor, glaçada, UV, canvis bruscos i nous extrems de l’arxiu local, amb límits diaris, períodes de descans i textos que no els confonen amb avisos oficials.
- Integrats l’estat oficial de sequera de l’ACA, la previsió de pols del servei CAMS Europe i la tendència estacional ECMWF, sempre amb font, resolució i limitacions visibles.
- Afegides efemèrides meteorològiques verificades procedents de la biblioteca existent del portal.
- Cada família disposa d’un interruptor independent, deduplicació a D1, fins a quatre intents per canal i estat operatiu consultable des de l’administració. Totes les funcions noves queden desactivades per defecte.
- Incorporades targetes verticals pròpies i proves de calendari, llindars, prudència editorial i regressió del Worker.

## V22.27.0 — Evolució territorial de la pluja als vídeos — 2026-08-30

- Els Shorts, Reels i vídeos de TikTok i X incorporen una sisena escena animada amb quatre franges horàries de precipitació sobre el nord-est de Catalunya i Sant Celoni remarcat.
- La font principal és AROME France HD, amb una graella de 64 punts, límits comarcals oficials de l'ICGC, escala en mm/h i textos que separen clarament estimació del model i observació real.
- Si AROME no respon, el generador prova Open-Meteo Best Match i, com a darrera reserva, mostra l'evolució puntual de Sant Celoni sense inventar una distribució territorial.
- El vídeo passa de 25 a 30 segons, conserva les cinc pantalles existents i amplia la música original, el muntatge i les proves per cobrir els quatre fotogrames nous.

## V22.26.0 — Mapa comarcal dels avisos de Meteocat — 2026-08-30

- Les publicacions d'avisos incorporen un mapa de Catalunya amb totes les comarques afectades i el nivell màxim vigent de cadascuna, construït amb dades SMP de Meteocat i límits oficials de l'ICGC.
- El Vallès Oriental queda remarcat i el text inferior explica de manera específica l'abast comarcal per a Sant Celoni, sense afirmar una afectació uniforme a tot el municipi.
- La capçalera, els textos, les etiquetes i el peu identifiquen exclusivament Meteocat; els avisos d'AEMET continuen disponibles per al web i les notificacions, però no generen publicacions socials automàtiques.

## V22.25.1 — Avisos grocs de Meteocat — 2026-08-30

- L'automatització incorpora també els avisos grocs vigents del Vallès Oriental, mantenint el filtre comarcal, les franges en hora local i la deduplicació.
- Les targetes i els textos diferencien explícitament GROC, TARONJA i VERMELL; cap avís groc es pot presentar erròniament com a taronja.
- El paràmetre passa a dir-se `METEOCAT_ALERT_SOCIAL_ENABLED`; el nom anterior es manté com a compatibilitat perquè cap entorn quedi desactivat durant la transició.

## V22.25.0 — Avisos severs de Meteocat — 2026-08-30

- El Worker consulta l'API oficial de Situacions Meteorològiques de Perill per avui i els dos dies següents, amb memòria cau de quinze minuts.
- Només prepara i publica avisos vigents taronja o vermell del Vallès Oriental (codi oficial 41); ignora grocs, altres comarques i esborranys.
- El text identifica Sant Celoni com a municipi de la comarca, manté la distribució local/extensa/general i les franges oficials de sis hores, i evita afirmar una afectació municipal que Meteocat no concreti.
- Cada combinació de fenomen, nivell, dia, llindar i franges queda deduplicada a D1. La funció roman inactiva si falta el secret `METEOCAT_API_KEY`.
- Si un canal falla, el Worker recupera només els canals pendents al cicle següent, amb un màxim de quatre intents i sense repetir els que ja han publicat.

## V22.24.0 — Directori social i publicació de presentació — 2026-08-30

- Nova pàgina pública `xarxes.html` amb els nou canals oficials i enllaços directes, pensada també com a destinació única des d’Instagram.
- Nova creativitat vertical de 1080 × 1350 px amb la identitat de l’Observatori, les nou xarxes i una crida clara al directori.
- Directori incorporat al sitemap i a la memòria cau de la PWA.

## V22.23.1 — Símbols meteorològics equilibrats — 2026-08-30

- Normalitzats tots els símbols dins un marc quadrat de 360 × 360 per evitar que el sol sembli petit o que els núvols quedin massa amples i baixos.
- Unificats centre, escala, proporció i cantonades del marc en les pantalles principals, la tendència de tres dies i la targeta del migdia.
- Afegides proves per protegir el quadrat i la proporció dels fenòmens meteorològics.

## V22.23.0 — Publicacions meteorològiques dinàmiques — 2026-08-30

- Eliminat el núvol fix dels Shorts i Reels: cada predicció mostra ara un símbol vectorial propi per cel serè, núvols, boira, pluja, neu, ruixats o tempesta.
- Separades visualment les dades observades de la predicció; la pantalla «Ara mateix» no mostra cap símbol de temps futur.
- Redissenyades les cinc pantalles amb jerarquia, colors per fenomen, consells útils, tendència de tres dies i textos protegits contra solapaments.
- Afegits moviment subtil i transicions suaus al vídeo de 25 segons, verificats amb una renderització completa local.
- Adaptats els textos de Facebook, Instagram, TikTok i X a la previsió real de la franja, mantenint els límits de cada plataforma.
- Afegit el símbol de la predicció d’avui a la targeta del migdia i proves de regressió per protegir la nova qualitat visual.

## V22.22.2 — Xarxes ordenades per prioritat — 2026-08-29

- Reordenats els accessos socials d’escriptori, peu i desplegable mòbil segons l’ús actual del projecte i la popularitat: Instagram, YouTube, TikTok, Facebook, X, WhatsApp, Threads, Telegram i Bluesky.
- Mantinguts Instagram, TikTok i YouTube com els tres accessos directes de la capçalera en mòbils petits.
- Afegida una prova de regressió que protegeix l’ordre acordat de les nou xarxes.

## V22.22.1 — Desplegable social mòbil complet — 2026-08-29

- Corregida una regla antiga que amagava, també dins del desplegable, les xarxes situades després de la quarta opció.
- El menú mòbil torna a oferir les nou xarxes configurades, mentre la capçalera conserva només Instagram, TikTok i YouTube com a accessos directes.
- Afegida una prova de regressió que diferencia les icones directes dels enllaços interiors del desplegable.

## V22.22.0 — X torna a la navegació social — 2026-08-29

- Recuperat l’accés a `@meteo_fonta` amb la icona oficial d’X a les agrupacions socials d’escriptori, el peu i el menú complet de mòbil.
- La capçalera en mòbils petits mostra directament Instagram, TikTok i YouTube; X, Facebook, Threads i la resta queden disponibles al desplegable per evitar saturar-la.
- Afegit el perfil d’X a les dades estructurades de l’organització perquè els cercadors el puguin associar correctament amb Meteo Fontanillas.
- Afegides proves de regressió per protegir l’enllaç, la icona, la disposició mòbil i el SEO.

## V22.21.0 — X automatitzat amb Buffer — 2026-08-29

- X publica automàticament el vídeo del matí a les 07:00, la targeta meteorològica a les 14:00 i el vídeo del vespre a les 20:30, cadascun amb text específic i límit segur de 280 caràcters.
- El Worker conserva l’identificador de Buffer, comprova l’estat real després de l’hora prevista i evita crear una segona publicació si la primera ja està programada o enviada.
- Les franges es recuperen cada cinc minuts durant un màxim de 90 minuts, amb fins a quatre intents i un únic correu només si tots fallen.
- L’administració mostra la connexió d’X, el darrer estat operatiu i l’inclou en la comprovació segura de xarxes sense publicar res.

## Correcció de fonts audiovisuals — 2026-08-29

- 3Cat passa a ser un accés extern directe a «El temps» de 3CatInfo, com AEMET, perquè el seu reproductor incrustat no completa la càrrega de manera fiable.
- La vista deixa de consultar i preparar el reproductor de 3Cat, reduint JavaScript, peticions i possibles bloquejos; Meteocat continua disponible sota demanda dins la web.

## En desenvolupament

- AEMET torna a ser visible a la predicció audiovisual com a accés oficial, sense presentar-lo erròniament com un vídeo diari.
- Les targetes de Meteocat i 3Cat creen un reproductor nou a cada selecció, mostren una càrrega inequívoca i porten l’usuari fins al vídeo.

- Afegida sota la predicció audiovisual una guia de sis fonts mundials diferenciades per funció: previsió oficial de l’OMM, previsions globals de Yr i Met Office, mapes d’ECMWF i comparadors Windy i meteoblue.
- La guia explica que cap model és universalment millor i prioritza sempre el servei meteorològic oficial del territori per a avisos i decisions de seguretat.
- La biblioteca educativa incorpora recursos actuals del Met Office i UCAR, i tres reptes pràctics que filtren directament materials de núvols, predicció o dades.

- Afegida una secció de predicció en vídeo amb Meteocat i el darrer vídeo meteorològic disponible de 3Cat, tots dos reproduïbles dins la web.
- AEMET es manté als apartats oficials de previsió i avisos, però es retira del visor audiovisual perquè el seu canal no publica una predicció diària i podia mostrar contingut no relacionat.
- Els reproductors externs només es carreguen quan l’usuari escull una font, evitant reproducció automàtica i connexions innecessàries amb tercers.
- La descoberta de 3Cat queda limitada, memoritzada i tolerant a errors: si la seva pàgina canvia o no hi ha vídeo recent, Meteocat continua disponible.

- Si una execució de YouTube falla després d'haver reservat la franja, GitHub ho comunica al Worker i Cloudflare la torna a intentar dins de la finestra segura, sense duplicar un Short ja completat.
- La recuperació de YouTube s'allarga fins als últims cinc minuts útils abans de publicar; els errors o cancel·lacions que deixin una execució penjada també poden recuperar-se quan expira el bloqueig temporal.
- TikTok ja no depèn d'una única crida de GitHub a Buffer: el programador de cinc minuts detecta el MP4 preparat i reintenta la programació pendent, reutilitzant l'identificador existent si Buffer ja l'havia acceptat.

- La franja matinal de totes les xarxes passa a les 07:00; el Short es prepara a les 06:20 i la comprovació preventiva social queda a les 06:45.
- Facebook i Instagram deixen de duplicar la targeta meteorològica amb el vídeo: al matí i al vespre publiquen només Reel + Story, mentre que al migdia conserven la imatge.
- Bluesky, Telegram i Threads mantenen les tres publicacions d’imatge diàries; YouTube i TikTok mantenen els dos vídeos, amb el del matí a les 07:00.

- Preparada l’automatització dels vídeos de Meta a les 07:00 i les 20:30: primer publica i confirma els Reels d’Instagram i Facebook, i només després inicia les Stories dels dos canals.
- Els contenidors d’Instagram pendents es reprenen al següent cicle de cinc minuts; Facebook i qualsevol canal ja completat es reutilitzen sense duplicar publicacions.
- Els errors definitius queden limitats a quatre intents automàtics, es registren al panell i generen un únic correu operatiu. La prova manual continua disponible com a recuperació controlada.

- Preparada una prova manual i protegida de Stories d’Instagram i Facebook amb el mateix vídeo vertical del Reel. Cada franja queda deduplicada i els canals ja publicats no es repeteixen en un reintent parcial.
- Instagram conserva el contenidor mentre Meta processa el vídeo; Facebook conserva la sessió i la fase de pujada per reprendre una resposta interrompuda sense començar una Story nova.
- La prova visual d’Instagram i Facebook s’ha completat correctament i permet activar el flux automàtic encadenat després dels Reels.

- La confirmació dels Shorts valida ara l'estat que YouTube retorna en completar la mateixa pujada, sense fer una consulta posterior que exigia permisos de lectura addicionals.
- Això evita marcar com a fallit —i arriscar un duplicat en reintentar— un vídeo que YouTube ja havia acceptat i programat correctament.
- La validació final de la pujada comparteix el marge mínim real de cinc minuts amb el planificador, evitant que la recuperació tardana passi el primer control però falli al segon.

- «Predicció vs realitat» calcula ara els indicadors principals només amb pronòstics de l’endemà guardats el dia anterior, sense barrejar actualitzacions del mateix dia ni horitzons de fins a set dies.
- La mostra informa quants casos corresponen a dies plujosos o secs, identifica les fonts i els llindars de pluja, i diferencia explícitament les comparacions secundàries per horitzó.
- La taula es descriu com a pronòstics de demà verificats i incorpora una indicació de desplaçament lateral en mòbil.

- Afegida una comprovació segura del permís `Actions: Write` del token que connecta Cloudflare amb GitHub: usa una referència deliberadament inexistent i, per tant, no inicia cap workflow ni crea cap vídeo.
- El diagnòstic manual d’automatitzacions valida ara tant el canal TikTok de Buffer com el disparador principal de YouTube.

- Auditoria reforçada de Buffer/TikTok: la comprovació de connexió valida ara el canal real de Buffer sense publicar, i queda disponible també com a flux manual independent de GitHub Actions.
- Els esborranys de prova ja no inclouen una hora passada; les publicacions reals exigeixen cinc minuts de marge, es registren al panell i envien un correu operatiu si Buffer falla.
- La còpia temporal del vídeo ha d’haver pujat correctament abans de programar TikTok. Una fallada de Buffer queda visible a GitHub sense impedir que Cloudflare confirmi una pujada de YouTube que sí hagi acabat, evitant reintents i duplicats del Short.

- Preparada la cua de TikTok mitjançant Buffer: el Short només es traspassa després que YouTube confirmi la seva pujada i conserva l’hora pública de cada franja.
- El vídeo continua en un bucket R2 privat; Buffer rep una URL opaca i limitada al fitxer temporal, estable mentre dura la cua i eliminada amb la neteja de tres dies.
- Afegida al panell una prova segura que crea un esborrany a Buffer, sense publicar-lo. La cua automàtica roman desactivada fins que es validi aquesta prova i s’activi explícitament el paràmetre corresponent.

- Cloudflare passa a ser el rellotge principal dels YouTube Shorts i inicia les preparacions a les 06:20 i les 19:45, en hora de Sant Celoni. GitHub conserva una reserva posterior compatible amb l’horari d’estiu i d’hivern.
- Si GitHub accepta el disparador però no confirma l’inici, Cloudflare el repeteix al cap de vuit minuts sense duplicar el renderitzat.
- El Worker registra l’estat específic del planificador de Shorts i envia un correu operatiu si falta el token o GitHub rebutja el disparador.
- Després de la pujada, el flux consulta YouTube i només acaba correctament si confirma l’ID, la privacitat i, quan correspon, l’hora pública de les 07:00 o les 20:30.
- L’administració mostra l’horari de preparació de YouTube i el resultat real del darrer disparador, separat de la simple presència de credencials.

- Avançades les dues execucions de YouTube Shorts perquè GitHub Actions tingui més marge davant retards del planificador; les publicacions públiques queden a les 07:00 i les 20:30 i es manté la recuperació alternativa del Worker.

- Els avisos push ja no depenen només de la propagació d’etiquetes d’OneSignal: cada dispositiu subscrit desa de forma verificable les seves preferències de fenomen i intensitat al registre tècnic del portal. Els avisos automàtics prioritzen aquest registre, especialment per a PWA d’iPhone.

- Corregit el flux manual de Reels de Meta: Facebook inicialitza la sessió, transfereix la URL temporal al servidor de pujada i només després finalitza la publicació. Instagram conserva el contenidor pendent i la mateixa prova el reprèn un minut més tard, sense crear duplicats mentre Meta processa el vídeo.

- Preparada una prova manual i única de Reels d’Instagram i Facebook des de l’administració. Reutilitza el MP4 privat del Short mitjançant una URL signada d’una hora, registra el resultat per franja i no activa cap publicació automàtica fins que es validin les dues plataformes.

- «El temps arreu» prepara una cerca de fins a quatre webcams properes per coordenades. Les miniatures es carreguen sota demanda, no reprodueixen vídeo automàticament i no es desen; per activar la cobertura mundial cal afegir el secret de Cloudflare `WINDY_WEBCAMS_API_KEY`.

- La programació dels Shorts admet ara cinc minuts de marge: l’execució real de les 20:24 podia acabar el renderitzat i la pujada, però el llindar anterior de quinze minuts la descartava sense necessitat.
- Abans d’enviar una imatge a Facebook, Instagram o Threads, el Worker genera i desa temporalment la targeta PNG/JPEG a R2. Meta rep així una imatge ja materialitzada, no una captura sota demanda que pugui respondre tard o amb un tipus invàlid.
- Les targetes temporals s’eliminen al cap de tres dies; una edició del contingut invalida les dues variants per evitar reutilitzar una imatge antiga.
- El registre editorial de l’administració es pagina de sis en sis i conserva el filtre actiu.
- Les publicacions publicades o descartades queden plegades fins que se’n demana el detall, sense eliminar-ne l’historial ni els resultats per canal.

## Recuperació independent dels Shorts — 2026-08-26

- El Worker comprova les franges de Shorts a les 06:40 i 18:40 de Sant Celoni i, si GitHub no ha iniciat el flux, el dispara per l'API amb una única execució per franja.
- La coordinació amb D1 evita vídeos duplicats entre el cron de GitHub, el disparador alternatiu i les recuperacions manuals.
- El mecanisme roman desactivat fins que Cloudflare rep el secret `GITHUB_SHORTS_DISPATCH_TOKEN`; cal un token restringit només al repositori amb permís «Actions: Write».

## Shorts amb dades més recents — 2026-08-26

- La preparació automàtica dels dos Shorts diaris queda a les 04:17 i 16:47 UTC, lluny de l'inici de l'hora però a menys de dues hores de les publicacions de les 08:00 i 20:30 locals.
- L'execució manual permet escollir `mati` o `vespre` i programar la publicació només si encara queda marge: és una recuperació segura si GitHub no ha iniciat un cron.
- El vídeo continua pujant-se privat a YouTube; la visibilitat pública es conserva a l'hora local prevista.
- Facebook i Instagram no s'activen encara per als vídeos: queda pendent una prova real de Reels amb els permisos de Meta, sense publicar cap Short accidentalment.

## Alertes de publicació social — 2026-08-26

- Un error temporal d’un canal queda registrat i es reintenta automàticament, però el correu d’alerta només s’envia si el canal continua fallant després de quatre intents. Així una recuperació correcta no genera una alarma definitiva.

## Higiene del sitemap — 2026-08-26

- Actualitzades les dates `lastmod` de la portada i de «El temps arreu» perquè reflecteixin els canvis públics recents sense introduir URLs duplicades.
## Correcció de municipis desats — 2026-08-26

- Quan s’obre un municipi ja desat en aquest navegador, el botó mostra des del primer moment «★ Desat» i permet retirar-lo sense un clic intermedi enganyós.

## Millores d’anàlisi i consulta local — 2026-08-26

- El Centre de Dades compara les últimes 24 hores amb les 24 anteriors, separant temperatura mitjana i pluja observada.
- «El temps arreu» permet desar fins a sis municipis en aquest navegador; aquesta preferència no s’envia al Worker.

## Correcció urgent de la targeta social — 2026-08-26

- Eliminada la comprovació interna que feia el Worker contra la seva pròpia URL pública abans d’enviar la targeta a Meta: Cloudflare la podia tractar com un bucle i respondre 404.
- Facebook, Instagram i Threads reben directament la URL signada de la targeta, que Meta descarrega des de fora del Worker.

## Vídeos socials temporals — Preparació segura

- Creat un bucket R2 privat europeu per als vídeos temporals de Shorts, sense domini ni accés públic.
- El Worker només accepta MP4 amb una clau prevista, autenticació separada per pujar-los i un màxim de 30 MB.
- Els vídeos només es poden recuperar amb una URL signada, d’un màxim d’una hora, i el manteniment elimina els fitxers amb més de tres dies.
- No s’activa ni es publica cap Story automàtica amb aquest canvi: queda pendent d’una prova explícita amb Meta.
- Els dos fluxos de YouTube deixen ara una còpia privada del Short al bucket només quan els secrets de vídeo estan configurats; una fallada o retirada del flux no modifica la publicació a YouTube.
## V22.14.1 — 2026-08-26

- Els dos YouTube Shorts diaris es pugen amb marge com a privats i es programen amb `publishAt` per fer-se públics exactament a les 08:00 i a les 20:30 de Sant Celoni.
- El flux rebutja una hora invàlida, massa propera o incompatible amb la privacitat privada requerida per YouTube, evitant publicacions imprevistes quan GitHub Actions s'endarrereix.
- Afegida una prova de canvi horari perquè les franges es mantinguin en hora local tant a l'estiu com a l'hivern.

## V22.20.0 — Barreres operatives i ús de D1 — En verificació

- Plantilla de configuració i flux manual de GitHub Actions per desplegar i validar únicament l'entorn de proves.
- Actualitzades les accions de GitHub per usar el runtime compatible actual.
- El panell d'administració mostra les files totals desades a D1, diferenciant-les del consum de lectures i escriptures diàries.
- Documentada la recuperació de staging i de les proves reals de notificacions.

## V22.19.0 — Validació de staging — En verificació

- Nova comprovació pública i sense secrets per validar la versió, la salut, l’historial i els avisos de l’entorn de proves.
- Disponible amb `npm run test:staging` i manualment des de GitHub Actions abans de valorar un desplegament a producció.

## V22.18.0 — Salut de staging — En verificació

- La ruta `/health` de staging respon com a degradada, sense error intern, quan no es configura cap font d’observacions independent.

## Entorn de staging — 2026-08-25

- Worker `fonta-meteo-staging` actualitzat amb D1 pròpia, IA i Browser Rendering; les xarxes socials estan desactivades i no hi ha cap programador actiu.
- La D1 de staging conserva l’esquema del projecte i no conté ni secrets ni dades de producció.

## V22.16.0 — En verificació

- OneSignal confirma que un missatge s’ha creat a partir del seu identificador, que és el resultat fiable de l’API; el recompte de destinataris pot arribar més tard.
- Els avisos acceptats no es tornen a enviar per un recompte inicial de destinataris a zero.

## V22.15.0 — En verificació

- El registre de notificacions delega la petició de permís a OneSignal Web SDK i espera la Subscription ID remota abans d’indicar que l’activació ha acabat.
- Quan no es crea la subscripció remota, el diàleg diferencia aquest cas dels permisos bloquejats i evita un èxit local enganyós.

## Documentació i manteniment obert

- Afegides guies d'arquitectura, desplegament, API, fonts de dades, desenvolupament i Meteo IA.
- Afegides normes de contribució, conducta, seguretat, suport, llicència MIT i plantilles d'incidències.

## V22.15.0 — 2026-08-25

- D1 deixa de persistir lectures en cada visita pública; les captures programades de cinc minuts són el camí normal de l’historial.
- La persistència d’una observació és idempotent i el resum de magatzem es conserva cinc minuts a memòria per reduir lectures.
- Els canals socials sol·licitats sense credencials queden registrats com a error explícit, reintentable i notificable per correu.
- La prova d’avisos push registra l’estat operatiu real i indica quin secret de OneSignal falta o és incorrecte.

## V22.13.0 — 2026-08-25

- Les publicacions automàtiques queden preparades per a tres franges diàries: 08:00, 14:00 i 20:30, amb comprovació preventiva independent abans de cadascuna.
- El panell conserva i mostra l’última comprovació preventiva encara que provingui d’una franja nova.
- Google rep metadades de rastreig completes i dades estructurades més riques de l’Organització i el conjunt d’observacions.
- S’actualitzen recursos de web i PWA perquè els navegadors no reutilitzin fitxers antics després del desplegament.
- La publicació social comprova que el Worker públic tingui la mateixa versió abans de preparar targetes, evitant errors 404 opacs quan producció va per darrere.
- OneSignal usa `ONESIGNAL_API_KEY` com a secret preferit i conserva `ONESIGNAL_REST_API_KEY` com a alias temporal; els errors 401/403 expliquen que cal revisar la clau server-side.
- Les neteges de rate limit passen a manteniment programat i s’afegeixen índexs compostos a D1 per reduir lectures innecessàries.
- Afegit executor de proves automàtic amb `npm run test:quick`.
- Simplificada la documentació principal i afegides guia d’arrencada, checklist d’entrega i auditoria del projecte.

## V22.11.0 — 2026-08-25

- Els avisos push exigeixen sempre el nivell escollit i apliquen la categoria només quan el fenomen es pot classificar amb seguretat.
- OneSignal ja no es considera saludable quan accepta una petició però no troba cap dispositiu destinatari.
- Els avisos oficials actius que no han arribat es reintenten cada 30 minuts mentre continuen vigents; un enviament reeixit queda deduplicat.
- La prova real informa quan el dispositiu no existeix com a destinatari, en comptes de mostrar un èxit enganyós.
- La pàgina d’avisos incorpora ESTOFEX com a context europeu complementari, separat dels avisos oficials locals i amb la jerarquia de fonts explícita.

## V22.10.0 — 2026-08-25

- «El temps arreu» incorpora icones meteorològiques accessibles a la lectura actual i a les previsions d’Open-Meteo i MET Norway.
- Les fonts globals queden ordenades en pestanyes: Yr/MET integrada i accessos separats a Meteoblue i eltiempo.es, sense barrejar-ne les dades.
- El cercador limita i desplaça els resultats llargs dins una capa pròpia perquè no quedin tapats pels blocs següents.
- La marca lateral alinea «Fontanillas» i «Sant Celoni» sense el separador decoratiu anterior.

## V22.8.0 — 2026-08-24

- En mòbil, el visor incrustat de meduses deixa de consumir dades i s’ofereix un accés directe al mapa complet de MedusApp.
- Els visors d’incendis, sequera i meduses incorporen navegació completa amb teclat i relacions accessibles entre pestanyes i contingut.
- Els avisos oficials mostren si Sant Celoni consta explícitament al detall o si l’abast publicat és zonal i la incidència local pot variar.
- Els principals indicadors ambientals utilitzen esquelets visuals accessibles mentre esperen les dades reals.
- Versions web, Worker i memòria cau PWA unificades a V22.8.0.

## V22.7.0 — 2026-08-24

- La portada substitueix els textos d’espera per esquelets visuals suaus que desapareixen tan bon punt arriba cada dada real.
- El mapa oficial d’avisos de Meteocat deixa de carregar-se a l’inici i s’activa només quan l’usuari s’acosta a l’apartat d’avisos.
- Les preferències d’avisos separen fenòmens i intensitat en dos passos visuals més clars.
- En mòbil, les opcions d’avisos són més compactes i el botó principal queda sempre accessible al peu del diàleg.
- La càrrega animada respecta la preferència del sistema de reduir el moviment.
- Versions web, Worker i memòria cau PWA unificades a V22.7.0.

## V22.6.0 — 2026-08-24

- La prova d’avisos passa pel servei real de OneSignal i s’adreça exclusivament al dispositiu des del qual es demana.
- La diagnosi d’avisos comprova permís, subscripció, identificació remota i servei en segon pla; el diàleg també millora la navegació amb teclat.
- Meteo IA resol noves preguntes directes sobre humitat, pressió, vent, radiació, índex UV, sortida i posta del sol.
- Cada avís oficial diferencia si Sant Celoni consta explícitament al detall o si es tracta d’un avís zonal amb afectació local variable.
- «Predicció vs realitat» mesura la maduresa amb dies únics, incorpora l’índex Brier de pluja i adapta quatre mètriques a qualsevol pantalla.
- Versions web, Worker i memòria cau PWA unificades a V22.6.0.

## V22.5.2 — 2026-08-24

- Restaurats els paràmetres públics de Bluesky, Telegram, correu operatiu i OneSignal perquè els desplegaments no conservin només els secrets i deixin canals aparentment sense configurar.
- El panell diferencia la connexió OAuth de TikTok de l'aprovació pendent de publicació automàtica, evitant mostrar un estat enganyós.
- La capçalera mòbil incorpora un accés compacte a totes les xarxes quan no caben a la pantalla.
- El mapa de meduses s'obre a pantalla completa en mòbil, on el visor extern funciona millor, i es manté integrat en escriptori.
- Els avisos expliquen l'abast real de les zones oficials del Prelitoral i el Vallès Oriental sense presentar-los com un avís municipal precís.
- Unificats el títol HTML i el títol social de la portada.

## V22.5.0 — 2026-08-24

- Nou control operatiu persistent de l'execució del programador, els avisos push, la publicació social automàtica i la comprovació preventiva de connexions.
- El panell d'administració mostra els horaris reals, la zona horària, l'últim resultat, la durada i la ratxa d'errors de cada automatització.
- Nova recuperació segura de publicacions socials: es poden reintentar només els canals que han fallat, sense duplicar els que ja s'han publicat correctament.
- Registres estructurats per facilitar el diagnòstic d'incidències i diferenciar execucions correctes, parcials i fallides.
- Versions web, Worker i memòria cau PWA unificades a V22.5.0.

## V22.2.0 — 2026-08-22

- La invitació per activar avisos espera deu segons i no s’obre sobre una pestanya amagada ni sobre el diàleg de preferències.
- Nova comprovació preventiva diària de Facebook, Instagram, Bluesky, Telegram, Threads i TikTok a les 07:45, abans de la publicació de les 08:00.
- El diagnòstic preventiu valida credencials, compte i permisos sense crear cap publicació.
- Si una connexió no està preparada, s’envia un correu operatiu i la resta de canals continuen funcionant de manera independent.
- El panell d’administració mostra el resultat i l’hora de la darrera comprovació preventiva.
- Versions web, Worker i memòria cau PWA unificades a V22.2.0.

## V22.1.0 — 2026-08-22

- Primera càrrega enriquida al servidor amb la darrera observació real, dades estructurades i alternativa segura si l’API no respon a temps.
- Meteo IA local ampliada amb boira, inversió tèrmica, tempestes, sensació tèrmica, vent i radiació UV; el mode de seguretat deixa de respondre amb un error genèric.
- «Predicció vs realitat» mostra el biaix de temperatura, la ratxa prevista i observada, una llegenda més clara i un progrés accessible.
- El panell d’administració diferencia el mode local de Meteo IA de l’ampliació avançada opcional.
- Versions web, Worker i memòria cau PWA unificades.

## V22.0.3 — 2026-08-22

- Nova navegació inferior mòbil amb cinc accessos clars, indicador de pàgina activa i accés complet a la resta de seccions.
- Portada mòbil més llegible: mostra primer les dades essencials i permet desplegar pressió, radiació, UV i indicadors calculats.
- Preferències d’avisos amb selecció simultània de nivells i un botó de prova local per verificar el dispositiu abans d’esperar un episodi real.
- «Predicció vs realitat» explica el període inicial de recollida, el progrés fins als set dies i diferencia clarament els exemples il·lustratius dels resultats reals.
- Ajustats el xat flotant, les àrees segures del mòbil, la jerarquia del menú lateral i la memòria cau de la PWA.
- Afegida la capçalera HSTS al domini i mantinguts els contractes del Worker, D1 i les fonts meteorològiques sense canvis.

## V22.0.0 — 2026-08-21

- Nova secció visual «Predicció vs realitat», basada exclusivament en pronòstics desats abans del dia verificat i lectures reals de l’estació.
- Captures de previsió Open-Meteo cada sis hores en D1, amb mètriques d’error de temperatura i vent i encert de pluja per horitzó.
- Publicació automàtica diària a Facebook, Instagram, Bluesky i Telegram quan el canal està configurat.
- Nova targeta social vertical 1080×1350 generada al Worker amb dades reals, hora i font; eliminada la imatge estàtica d’Instagram.
- Correu operatiu si una publicació automàtica falla i registre complet per canal.
- Enllaços web a Instagram, Facebook, Threads, X, Bluesky, Telegram, TikTok, WhatsApp i YouTube.
- Preparació d’estat de credencials per a Threads, X, TikTok i YouTube; Shorts queda pendent del flux OAuth i de vídeo.

## V21.5.0 — 2026-08-21

- Meteo IA passa a una arquitectura híbrida: manté les respostes calculades amb dades verificades i usa Workers AI per entendre preguntes obertes o formulades de manera imprevista.
- Afegits límits d’ús i context meteorològic acotat a l’endpoint d’IA.
- La comparació d’estacions mostra només les lectures actuals i elimina «Avui» i «24 h».
- El Worker detecta fallades consecutives de Weather Underground i envia correus d’incidència i recuperació, evitant avisos repetitius.
- Si Weather Underground falla, la portada mostra l’última observació fiable de D1 i identifica clarament el mode degradat.
- Definida la fase «Predicció vs realitat» amb snapshots previs de la predicció i verificació posterior contra D1.
- Renovada la memòria cau de la PWA a V21.5.0.

## V21.4.0 — 2026-08-21

- Ampliats els símbols meteorològics del resum de portada i forçada la presentació emoji en color perquè siguin més immediats d’interpretar.
- Afegida l’hora de la màxima i la mínima del dia al costat dels valors de la portada.
- Renovades les icones d’iPhone i PWA a partir de l’avatar actual de la web i les xarxes, amb un nom de fitxer nou per evitar la memòria cau antiga d’iOS.
- Consolidada la URL canònica de l’aplicació i eliminades del sitemap les vistes internes amb paràmetres per evitar senyals duplicats a Google Search Console.
- Renovada la memòria cau de la PWA a V21.4.0.

## V21.3.0 — 2026-08-13

### Portada més directa

- L’accés d’avisos de la capçalera de la portada obre directament la pàgina completa d’Avisos.
- Retirat de la portada el bloc extens d’avisos, que es manté íntegrament a la seva pàgina pròpia.
- Eliminada la duplicació de contingut i escurçat el recorregut principal de consulta.

### Predicció més fàcil de llegir

- Reorganitzada la lectura inicial en tres períodes clars: el que queda d’avui, demà i els pròxims dies.
- El resum d’avui utilitza només les hores que encara queden i mostra temperatura, probabilitat de pluja i vent.
- Demà disposa d’un resum de jornada amb màxima, mínima, pluja i ratxa prevista.
- Els tres dies següents es presenten en una franja visual compacta, mantenint a sota el detall de 48 hores i la previsió de set dies.

### Compatibilitat

- Renovada la memòria cau de la PWA a V21.3.0.
- Mantinguts els contractes de dades, D1, avisos oficials, push, administració i publicació social manual.
- Superades les dotze proves automatitzades del projecte.

## V21.2.0 — 2026-08-11

### Gestor editorial protegit

- Afegida al panell d’administració una cua editorial completa per revisar, editar, aprovar, descartar i restaurar els esborranys socials.
- Aprovar un contingut no el publica: cada xarxa només s’envia després de prémer el seu botó i acceptar una confirmació explícita.
- Els continguts publicats queden bloquejats contra modificacions accidentals i els descartats es conserven a l’historial.
- Afegits filtres, recompte d’estats, protecció contra pèrdua d’edicions i una disposició responsive per a ordinador i mòbil.

### Diagnòstic, publicació manual i traçabilitat

- Afegida una comprovació segura i individual de Facebook, Instagram, Bluesky i Telegram que valida comptes, permisos i credencials sense publicar.
- Incorporades publicacions manuals independents per als quatre canals, sempre des del Worker i sense exposar credencials al navegador.
- Facebook publica text i enllaç a la pàgina configurada; Instagram crea i valida el contenidor multimèdia abans de publicar la targeta social de 1200 × 630 px.
- Cada intent, correcte o fallit, queda registrat per canal a la nova taula D1 `social_publications` i és visible des del mateix esborrany.
- El cron només genera esborranys i mai envia contingut automàticament.
- Afegits endpoints administratius protegits per consultar i actualitzar la cua i executar únicament una publicació manual autoritzada.

### Compatibilitat i validació

- Actualitzats Worker, esquema D1, panell, PWA, proves i documentació a V21.2.0.
- Preservats els contractes públics de dades, avisos AEMET/Meteocat, OneSignal, Meteo IA, comparador, compartir i PWA.

## V21.0.2 — 2026-08-11

### Nova jerarquia de marca i capçalera

- Traslladats el nou avatar rodó i la identitat «Fontanillas · Sant Celoni» al capdamunt del menú lateral.
- Eliminada la marca repetida de les capçaleres públiques perquè la franja fixa sigui més neta i funcional.
- Reordenada la capçalera amb l’estat «En directe» i l’hora a l’esquerra, i Instagram, Facebook, Bluesky i Telegram alineats a la dreta.
- Mantingut el context de cada pàgina només quan hi ha espai suficient, sense competir amb l’estat en directe ni amb les xarxes.

### Menú lateral i adaptació mòbil

- Separats clarament marca, navegació desplaçable i peu social perquè la barra de desplaçament no envaeixi els accessos inferiors.
- Recompost el bloc social inferior com quatre botons circulars de mida uniforme, amb copyright propi sota les icones.
- Ajustats amplada, separacions, jerarquia tipogràfica i comportament de l’hamburguesa en pantalles estretes.
- Preservada la capçalera específica del panell d’administració, que continua identificant l’àrea protegida.

### Compatibilitat i validació

- Sense canvis als contractes de l’API, Worker, D1, PWA, OneSignal, avisos, compartir, comparador ni Meteo IA.
- Actualitzats la memòria cau, les versions, les proves i la documentació a V21.0.2.

## V21.0.1 — 2026-08-11

### Xarxes visibles sense interferències

- Afegits accessos oficials a Instagram, Facebook, Bluesky i Telegram, amb icones accessibles i sense carregar SDK ni seguiment de tercers.
- Les quatre icones apareixen a la capçalera d’escriptori, al peu i al menú lateral; al mòbil es prioritza l’espai útil i es mantenen al peu.
- Corregida l’adreça pública de Facebook a `facebook.com/meteofontanillas` i afegits els perfils públics de Bluesky i Telegram.
- Reservat espai al peu perquè el botó flotant de Meteo IA no tapi els enllaços socials.

### Menú lateral i marca

- Reequilibrat el menú lateral amb una targeta contextual superior de Sant Celoni i un peu propi amb xarxes i copyright.
- Traslladat el copyright principal al final del menú lateral en escriptori; continua disponible al peu en pantalles petites.
- Incorporat un avatar rodó i lluminós de 1024 × 1024 px, apte per al portal i per als perfils socials.
- Substituït el símbol antic de les capçaleres pel nou avatar, mantenint nom i identitat textual.
- Regenerats els favicons i les icones d’instal·lació amb la mateixa marca V21, incloses les variants maskable.

### Preparació social segura

- El panell administratiu diferencia les credencials de Meta, Bluesky i Telegram sense exposar-ne cap valor.
- Els esborranys diaris queden preparats per als quatre canals i continuen en mode `draft`.
- No s’ha implementat cap publicació automàtica: la revisió humana continua sent obligatòria.
- Actualitzats Service Worker, memòria cau, proves i documentació a V21.0.1.

## V21.0.0 — 2026-08-11

### Medi ambient i lectura del pol·len

- Afegits nivells orientatius específics per gramínies, bedoll, olivera, artemisa i ambrosia.
- Cada espècie mostra concentració, etiqueta, color i barra, amb un resum de l’espècie dominant i recomanacions prudents.
- Mantingudes les dades originals i les fonts; la interfície deixa clar que no és un diagnòstic mèdic.

### Marca, xarxes i accessibilitat

- Redibuixat el símbol de l’Observatori amb una paleta més lluminosa, una silueta més neta del Montseny i un pols meteorològic visible a mida petita.
- Regenerat el paquet complet de favicons i icones PWA des de la mateixa font vectorial.
- Afegits accessos accessibles a Instagram i Facebook al peu de totes les pàgines.
- Incorporat `© 2026` de manera coherent i retirats els accessos de compartició a X, que no forma part del projecte.

### Fase social segura

- Afegida la taula D1 `social_drafts` i una cua deduplicada que prepara un resum meteorològic diari.
- El panell d’administració mostra la credencial Meta com a booleà, l’estat de la cua i els últims esborranys sense exposar secrets.
- La publicació automàtica continua desactivada i no existeix cap petició a l’API de Meta per publicar.

### Compatibilitat

- Mantinguts avisos AEMET/Meteocat, OneSignal, Meteo IA, comparador, Centre de Dades, compartir, PWA i contractes previs.
- Actualitzades versions, documentació i proves bàsiques de V21.

## V20.0.0 — 2026-08-10

### Biblioteca educativa

- Reconstruïda completament la pàgina «Aprendre» com una biblioteca meteorològica rica en enllaços i no com una successió de quatre explicacions i un qüestionari.
- Incorporats 27 recursos seleccionats de Meteocat, AEMET, OMM, NOAA, NASA, UCAR, ESA, EUMETSAT, Copernicus, IPCC, ECMWF i Protecció Civil.
- Itineraris directes per a Primària, ESO, Batxillerat i docents, més un nivell avançat per a dades i modelització.
- Cerca sense accents i filtres combinables per nivell i nou àmbits: bases, observació, núvols, predicció, satèl·lits, riscos, clima, dades i projectes.
- Cada recurs identifica entitat, descripció, idioma i format abans d’obrir una pestanya externa.
- Nou «Laboratori Fontanillas» amb accessos a Estació, Radar, Centre de Dades i Avisos per aprendre amb observacions reals i locals.
- Disseny adaptat a ordinador i mòbil, amb icones més clares i lluminoses i sense carregar imatges de tercers.

### Analítica i administració

- El panell diferencia ara l’analítica activada al domini de la detecció puntual del beacon en la pàgina d’administració.
- Cloudflare Web Analytics apareix en verd com «Actiu al domini» quan la configuració confirmada és vigent, encara que Cloudflare no injecti el beacon en aquella càrrega concreta.
- El diagnòstic copiable conserva separats l’estat configurat, el proveïdor i la detecció local.

### Compatibilitat i validació

- Afegides proves de quantitat, HTTPS, organismes, filtres, selectors, PWA i estat d’analítica de la V20.
- Mantinguts API, D1, avisos AEMET/Meteocat, OneSignal, Meteo IA, comparador, compartir i contractes existents.

## V19.1.1 — 2026-08-10

- Corregida l’alçada desproporcionada del bloc «Context actiu» de Meteo IA: cada part del xat ocupa ara la seva fila correcta i «Esborrar context» es manté compacte també al mòbil.
- Meteo IA compara dies d’un període i respon directament quin serà més plujós, ventós, càlid, fred o favorable.
- Les recomanacions per córrer, anar amb bicicleta, fer excursions o activitats familiars utilitzen ara la data o el període demanat, en lloc de valorar sempre el dia actual.
- Millorades les preguntes encadenades: el lloc, el període i l’activitat continuen aplicant-se a comparacions i consultes concretes posteriors.
- Fixada de manera robusta la capçalera d’administració, amb compensació d’espai i fons opac a ordinador i mòbil.
- Integrada la detecció de Cloudflare Web Analytics al panell, actualitzada la política CSP i documentada l’analítica agregada a Privacitat.
- Mantinguts els contractes d’API, D1, Worker, OneSignal, PWA, compartir i comparador.

## V19.1.0 — 2026-08-10

- Confirmada l’activació completa de OneSignal: subscripcions web verificades i credencials del Worker reconegudes pel panell administratiu.
- Confirmada la propietat de domini `fontanillas.cat` a Google Search Console i el processament correcte del sitemap amb 13 URL descobertes.
- Corregides la nota antiga del panell i la ruta desfasada del Service Worker a la documentació de push.
- Afegida mesura local de LCP, CLS, INP i TTFB al panell, sense analítica externa, galetes ni enviament de dades.
- Incorporats llindars interpretables per detectar si les mètriques locals són bones, necessiten observació o requereixen millora.
- Mantinguts intactes els contractes d’API, D1, avisos, comparador, compartir, PWA i Meteo IA.

## V19.0.7 — 2026-08-10

- Corregits els bloquejos CSP confirmats per la consola de Firefox durant la càrrega de OneSignal.
- Autoritzats exclusivament els dominis oficials de OneSignal per a l'estil, l'SDK i la sincronització push.
- Mantingudes les restriccions específiques de scripts, connexions, imatges i marcs del portal.
- Conservada la protecció contra recàrregues repetides i el Worker compartit de la V19.0.6.

## V19.0.6 — 2026-08-10

- Corregit immediatament el bucle de recàrrega introduït a la V19.0.5.
- OneSignal és ara l'únic responsable de registrar el Worker compartit; la PWA reutilitza el registre actiu sense competir-hi.
- Afegida una protecció temporal que impedeix diverses recàrregues consecutives davant canvis de controlador.
- Es manté el Worker combinat necessari perquè Firefox pugui activar les notificacions sense perdre la PWA.

## V19.0.5 — 2026-08-10

- Corregit l'error real de Firefox durant la instal·lació de `/OneSignalSDKWorker.js`.
- OneSignal i la PWA utilitzen ara un únic Service Worker d'arrel que conserva tant les notificacions com el funcionament fora de línia.
- Evitat que els dos registres de Service Worker es reemplacin mútuament.
- Afegida política sense memòria cau per al Worker combinat, facilitant-ne les actualitzacions.

## V19.0.4 — 2026-08-10

- El permís de notificacions es demana directament al navegador des del clic de l’usuari, abans de completar la subscripció amb OneSignal.
- Afegida diferenciació entre permís pendent, denegat i encara no sincronitzat amb OneSignal.
- Millorat el missatge de recuperació quan Firefox té les notificacions bloquejades per al lloc.

## V19.0.3 — 2026-08-10

- L'activació d'avisos mostra ara cada pas dins la finestra: permís del navegador, creació de la subscripció i desament de preferències.
- El botó queda temporalment bloquejat durant el procés per evitar activacions duplicades i es recupera automàticament si hi ha un error.
- Afegida detecció d'espera o denegació del permís amb instruccions específiques per revisar les notificacions a Firefox.
- La finestra només es tanca quan OneSignal confirma que la subscripció està realment activa.

## V19.0.2 — 2026-08-10

- Corregida la política de seguretat perquè la consulta pública de configuració de OneSignal es pugui executar, no només connectar.
- Afegit un missatge de recuperació si el servei push no respon en quinze segons, evitant un estat «Preparant notificacions…» indefinit.

## V19.0.1 — 2026-08-10

- Connectat el frontend amb l’App ID públic de OneSignal creat per a l’Observatori.
- El SDK continua carregant-se sota demanda i manté el Service Worker de OneSignal separat de la PWA.
- Les claus privades continuen fora del projecte públic i s’han de configurar exclusivament al Worker de Cloudflare.

## V19.0.0 — 2026-08-10

### Centre de Dades

- Corregida la quadrícula de resums i efemèrides que s’estrenyia en pantalles d’escriptori.
- Columnes equilibrades, salt a una sola columna abans dels 1.200 px i valors de temperatura sense particions il·legibles.

### Educació i transparència

- Nova pàgina «Aprendre» amb sensors, pressió, predicció, avisos, regles pràctiques i una prova ràpida.
- Nova `privacitat.html` amb explicació de PWA, Meteo IA, contacte, serveis externs, avisos i analítica.
- El control antiabús del formulari desa hashes temporals de la IP i del correu en lloc dels valors en clar.

### Publicació, rendiment i OneSignal

- OneSignal deixa de descarregar-se quan no hi ha App ID configurat.
- Panell administratiu ampliat amb estat separat de OneSignal web/Worker, sitemap, robots, privacitat, verificació de Google i temps de càrrega local.
- Guies noves per Search Console i comprovació de Core Web Vitals/PageSpeed.
- Sitemap, PWA, SEO dinàmic i menú ampliats amb la pàgina Aprendre i Privacitat.

### Xarxes socials

- Carpeta `social/` amb guia de governança, calendari CSV, plantilla JSON, UTM i aprovació humana per defecte.
- Cap compte ni automatització externa s’ha activat.

### Compatibilitat

- Web, Worker, panell i memòria cau unificats a V19.0.0.
- API, D1, comparador, compartir, avisos i contractes existents preservats.

## V18.0.0 — 2026-08-10

### Efemèrides amb curiositats verificades

- «Un dia com avui» manté la comparació pròpia de Fontanillas quan hi ha anys disponibles.
- Quan l’arxiu local encara és curt, mostra episodis de Catalunya documentats per Meteocat i rècords mundials verificats per l’OMM.
- Cada curiositat indica data, any, àmbit, resum i enllaç directe a la font; mai es presenta com una dada de l’estació.
- Meteo IA reutilitza el mateix catàleg quan se li demanen efemèrides o curiositats meteorològiques.

### Cronologia meteorològica

- Nou bloc al Centre de Dades que combina avisos oficials desats, dies amb pluja, màxima, mínima i ratxa destacada.
- Filtres per avisos, pluja o extrems i sincronització amb el període general de 7, 30 o 365 dies.
- Les fites deriven del mateix arxiu de Fontanillas i de `/alert-history`, sense crear una base paral·lela.

### Avisos intel·ligents

- Preferències per pluja, vent, tempesta, neu, temperatura o tots els fenòmens.
- Nou nivell mínim configurable: groc, taronja o vermell.
- El Worker combina categoria i severitat abans d’enviar a OneSignal i continua evitant duplicats mitjançant l’empremta única de D1.
- Guia d’activació segura a `docs/PUSH-ACTIVACIO.md`; no s’inclou cap credencial al projecte.

### Compatibilitat

- No cal cap migració D1 i es conserven API, avisos visibles, historial, PWA, comparativa, compartir i administració.
- Web, Worker, panell i memòria cau unificats a V18.0.0.

## V17.0.0 — 2026-08-10

### Historial d’avisos complet

- Paginació real a D1 amb 10, 20 o 50 episodis per pàgina; la web ja no necessita carregar l’arxiu complet per començar.
- Filtres combinables per text, any, mes, nivell, organisme i fenomen, amb recompte total i resum dels filtres actius.
- Indicadors d’episodis, dies amb avís, nivells taronja o vermell i fenomen més freqüent.
- Gràfics lleugers d’evolució mensual i distribució per fenomen, adaptats a escriptori i mòbil sense dependències noves.
- Exportació de tots els resultats filtrats a CSV i PDF multipàgina generats al navegador.

### Worker i compatibilitat

- `/alert-history` amplia el contracte amb `pagination`, `stats` i `facets`, i executa filtres parametritzats a D1.
- El paràmetre antic `limit` es conserva; la portada continua mostrant només cinc episodis i no canvia el sistema visible d’avisos AEMET/Meteocat.
- No cal cap migració de D1: s’utilitza la taula `alert_events` existent.

### Meteo IA

- Respon consultes com «quants avisos hi ha hagut aquest any?», «quants han estat vermells?» i «quan va ser l’últim avís?». 
- Enllaça directament l’Historial d’avisos dins de Fonts i diferencia explícitament episodis antics d’avisos actius.

### Validació

- Proves específiques de paràmetres, paginació del Worker, CSV i intencions històriques de Meteo IA.
- Versions web, Worker, panell d’administració i memòria cau PWA unificades a V17.0.0.

## V16.0.0 — 2026-08-10

### Panell d’Administració · Milestone 10 completat

- Nova pàgina protegida `administracio.html`, exclosa de cercadors i separada de la navegació pública.
- Resum visual de Worker, estació, D1 i avisos, amb estat general i actualització manual o automàtica.
- Detall de frescor, disponibilitat de les últimes 24 hores, mostres, camps absents, cobertura històrica, episodis d’avís i activitat del formulari.
- Estat de configuració de Weather Underground, D1, correu, push, analítica, accés administratiu i fase futura de xarxes, sense exposar cap credencial.
- Diagnòstic de PWA, Service Worker, mode instal·lat, memòries cau i versions web/Worker.
- Registre d’incidències del navegador limitat a la sessió actual i còpia d’un diagnòstic que exclou la clau.

### Protecció i Worker

- Nou endpoint `/admin/status` de només lectura, protegit amb `ADMIN_TOKEN` i comparació de hashes.
- Clau conservada únicament a `sessionStorage`; mai en URL, configuració pública ni diagnòstics.
- Respostes privades amb `no-store` i exclusió explícita de la memòria cau de la PWA.
- Panell sense operacions destructives i amb guia d’activació a `admin/README.md`.

### Roadmap

- Les xarxes socials es traslladen al final per crear els comptes i permisos conjuntament amb l’usuari.
- Worker i contractes públics existents continuen compatibles; només s’afegeix una ruta administrativa protegida.

## V15.0.0 — 2026-08-10

### Centre de Dades reordenat

- Un únic selector de 7, 30 o 365 dies controla resum, gràfiques, extrems i descàrregues.
- Gràfiques i extrems se sincronitzen automàticament i deixen de mostrar controls paral·lels contradictoris.
- Les dades de calendari —avui, aquest mes, aquest any, pluviometria i «un dia com avui»— queden en un segon bloc clarament independent.
- La descàrrega se situa al costat del resum del període i explica exactament quin conjunt exporta.

### Meteo IA didàctica i amb efemèrides

- Explica conceptes com DANA, fronts, isòbares, humitat, probabilitat de pluja, radar, models i núvols.
- Recomana la font adequada segons si es busquen observacions, avisos, dades obertes, climatologia o classificació de núvols.
- Enllaça AEMET MeteoGlosario, AEMET OpenData, dades obertes de Meteocat, serveis climatològics d’AEMET i l’Atles de Núvols de l’OMM.
- Calcula «un dia com avui» només amb anys comparables de l’arxiu Fontanillas; si no n’hi ha, ho indica sense inventar registres.

### Compartició Premium · Milestone 8 completat

- Targeta automàtica de 1200 × 630 px amb marca, URL i observació, predicció o avisos reals segons la pàgina.
- Compartició de la imatge amb el menú natiu quan és compatible, descàrrega PNG i còpia conjunta de text i enllaç.
- Alternativa editorial sense xifres inventades quan una pàgina no disposa de context meteorològic.
- Compartició disponible també a l’Historial d’avisos.

### Validació i compatibilitat

- Proves específiques per a conceptes, fonts i efemèrides de Meteo IA i per al contingut de les targetes.
- Worker i contractes d’API sense canvis; PWA, push, avisos AEMET/Meteocat, comparativa i radar es mantenen compatibles.

## V14.0.0 — 2026-08-10

### Meteo IA amb context

- Recorda temporalment destinació, període i activitat dins de la pestanya, sense desar el text de la conversa.
- Entén preguntes encadenades: després de parlar de bicicleta a la Vall d’Aran, «quin temps hi farà?» conserva Vall d’Aran, cap de setmana i bicicleta.
- Separa correctament «Vall d’Aran» de «aquest cap de setmana» i resol el territori amb Vielha e Mijaran com a referència meteorològica.
- Prioritza la destinació abans de la paraula «bici», evitant respondre amb la calor i l’UV de Sant Celoni.
- Afegeix consells específics per bicicleta segons calor, probabilitat de pluja i ratxes de la destinació.
- Mostra el context actiu a la conversa i permet esborrar-lo; el botó flotant és una mica més petit sense perdre llegibilitat.

### Centre de Dades i predicció

- Nou quadre pluviomètric amb intensitat actual, avui, últimes 24 h, episodi recent, ahir, mes, any, dies plujosos, períodes secs, llindars d’1/10/20 mm i dia més plujós.
- Les dades incompletes s’expressen com a cobertura mínima, sense deduir dates fora de l’arxiu.
- Nova tendència de sis setmanes amb mitjana del conjunt ECMWF EC46 i anomalies setmanals de temperatura i precipitació.
- Enllaços directes a la predicció mensual oficial d’AEMET, la metodologia ECMWF i la font Open‑Meteo.

### SEO · Milestone 7

- Metadades, canòniques, Open Graph i X específics per a cada vista del portal.
- Dades estructurades `WebSite`, `WebPage`, `Dataset` i `BreadcrumbList`.
- Sitemap ampliat i SEO local per Sant Celoni i el Baix Montseny.
- Guia separada per activar Search Console i mesurar Core Web Vitals després de publicar.

### Preservat

- Worker i contractes d’API existents sense canvis; avisos AEMET/Meteocat, PWA, compartir, comparativa, radar, medi ambient i push continuen actius.

## V13.1.0 — 2026-08-10

### Meteo IA més flexible

- Entén dies concrets com dilluns, divendres o diumenge, a més d’avui i demà.
- Resumeix el cap de setmana i la setmana següent, amb una advertència explícita quan augmenta la incertesa.
- Amplia les consultes d’altres poblacions fins a 14 dies i elimina la preferència incorrecta per coincidències espanyoles.
- Interpreta ordres com «temps per divendres a Sant Celoni» i «la setmana que ve a Londres».
- Les fonts són enllaços clicables cap a Estació, Predicció, Avisos, Centre de Dades, Comparar, Medi Ambient o Open‑Meteo.

### Xat flotant

- Nou botó «Pregunta al temps» fix a la part inferior dreta del portal.
- Permet resoldre una primera pregunta ràpida des de qualsevol pàgina.
- Després de la resposta ofereix continuar a l’apartat complet de Meteo IA, evitant convertir el giny petit en una conversa difícil de llegir.
- També funciona a Comparar, Historial d’avisos i Metodologia.

### Preservat

- Worker i contractes existents sense canvis; la conversa continua sense desar-se ni enviar-se a cap model extern.

## V13.0.0 — 2026-08-10

### Meteo IA · Milestone 6 completat

- Nova pàgina «Meteo IA» al menú lateral i a l’hamburguesa mòbil.
- Accés ràpid directe a Meteo IA quan la PWA està instal·lada.
- Preguntes lliures i accessos suggerits per situació actual, avui/demà, avisos, evolució recent, comparació d’estacions i medi ambient.
- Recomanacions combinades per córrer, excursions i activitats familiars, amb prioritat absoluta per als avisos oficials.
- Consulta d’altres poblacions mitjançant geocodificació i predicció d’Open‑Meteo.
- Cada resposta mostra les fonts i l’hora disponibles; la falta d’avisos verificables no es presenta mai com una situació segura.
- Conversa processada al navegador, sense historial persistent ni enviament a un model generatiu extern.
- Nova prova específica amb dades controlades per validar vuit intencions meteorològiques.

### Arquitectura

- `src/features/meteo-ai.js` concentra interpretació, conversa i recomanacions.
- `src/services/weather-api.js` centralitza també les estacions properes i les consultes d’altres poblacions.
- Medi Ambient publica un context normalitzat reutilitzable i el Service Worker incorpora el nou mòdul.

### Preservat

- Worker i contractes existents sense canvis; avisos, estació, predicció, PWA, radar, comparar, compartir i push continuen actius.

## V12.2.0 — 2026-08-10

### Branding · Milestone 5 completat

- Creats el símbol vectorial i la composició horitzontal oficials de l’Observatori.
- Regenerats favicon, Apple Touch Icon i icones PWA de 192 i 512 px amb una paleta més lluminosa i llegible.
- Separades les icones maskable de les normals, amb zona segura pròpia perquè Android no retalli el Montseny, el sol ni la línia de dades.
- Nova targeta social de 1200 × 630 px, més clara i sense lectures meteorològiques fictícies o desactualitzables.
- Metadades Open Graph i X coherents a Inici, Comparar, Historial d’avisos i Metodologia.
- Afegits accessos ràpids de la PWA a Estació, Avisos i Radar.
- Guia de marca ampliada amb recursos mestres, paleta d’icones i criteri explícit d’evitar imatges excessivament fosques.

### Preservat

- Dades, API i Worker sense canvis; avisos AEMET/Meteocat, radar, Medi Ambient, Centre de Dades, comparativa, push i compartir continuen intactes.

## V12.1.0 — 2026-08-10

### Corregit

- Substituït el visor de llamps d’AEMET per l’embed vectorial en temps real de Blitzortung, centrat a Catalunya i comprovat en una amplada mòbil de 390 px.
- Substituït el visor ArcGIS del Pla Alfa, lent i inestable en alguns telèfons, pel mapa oficial diari dels Agents Rurals amb data i llegenda visibles.
- L’índex UV de Medi Ambient utilitza prioritàriament el valor real del sensor de Fontanillas; CAMS només actua com a fallback identificat.

### Millorat

- Targetes de Comparar més petites: menys alçada i farciment, temperatura més compacta i sis variables distribuïdes en tres columnes.
- Alçada del visor de llamps reduïda i adaptada a escriptori i mòbil.

### Branding · Milestone 5

- Nom curt de la PWA unificat com a «Observatori» per evitar truncaments.
- Nova guia d’identitat amb nom, símbol, colors, tipografia, pictogrames i criteris d’ús.

### Preservat

- API i Worker sense canvis de contracte; avisos oficials, PWA, compartir, comparativa històrica i fonts de Medi Ambient continuen actius.

## V12.0.0 — 2026-08-10

### Afegit

- Visors ambientals integrats i carregats sota demanda: Pla Alfa oficial, estat de sequera de l’ACA i albiraments de MedusApp (UPV i Universitat d’Alacant).
- Enllaços complementaris a PlatgesCat i Meduseo, diferenciant la font oficial, la ciència ciutadana i el servei internacional extern.
- Interpretació visual baixa, raonable, moderada, alta o extrema per als índexs europeus de PM10, PM2,5, NO₂, O₃ i SO₂.
- Pàgina separada `historial-avisos.html` amb cerca i filtres per any i nivell.
- Descobriment automàtic d’estacions meteorològiques properes per ampliar la comparativa fins a sis ubicacions, amb fallback estable.
- Nou sistema coherent de pictogrames SVG al menú lateral, primera actuació del Milestone 5.

### Millorat

- Capçaleres de totes les subpàgines més compactes, amb la mateixa alçada visual, tipografia i separació.
- Títol de Comparar reescrit per explicar clarament que mostra les diferències meteorològiques del Baix Montseny.
- Distància a Fontanillas visible per a les estacions descobertes automàticament.
- L’historial de la pàgina principal queda limitat als cinc episodis més recents i disposa d’un únic desplaçament intern.
- Metodologia incorpora la mateixa capçalera visual que la resta del portal.

### Preservat

- Contractes existents de `/stations` i `/alert-history`: només s’amplien camps i criteris sense retirar-ne cap.
- Avisos AEMET/Meteocat, radar, Centre de Dades, PWA, compartir, push, contacte i dades de l’estació.

## V11.0.0 — 2026-08-10

### Afegit

- Primera fase de Medi Ambient amb AQI europeu, PM10, PM2,5, NO₂, O₃, CO, SO₂, radiació UV i cinc tipus de pol·len a partir del model CAMS via Open‑Meteo.
- Accessos prioritaris als mapes oficials de Pla Alfa, sequera de l’ACA i PlatgesCat amb informació de meduses.
- Invitació inicial per configurar avisos, amb resposta recordada al navegador perquè només aparegui una vegada.
- Visor oficial de llamps d’AEMET carregat sota demanda dins de la pàgina Radar.
- Capçalera visual compartida per a totes les subpàgines del portal.

### Corregit

- Etiqueta de la webcam de portada més petita i menys invasiva.
- Substituït el visor de llamps de Meteocat, que quedava tallat, per la imatge oficial adaptable d’AEMET.
- Corregit el farciment superior de la capçalera d’Estació i unificat amb la resta de vistes.
- Eliminada la confusió entre espai exterior de pàgina i farciment interior de les capçaleres.

### Planificat

- Redisseny dels pictogrames del menú lateral incorporat al Milestone 5 de branding.

### Preservat

- Worker i contractes de dades sense canvis; també es preserven avisos AEMET/Meteocat, historial, Centre de Dades, comparativa, PWA, compartir i contacte.

## V10.0.0 — 2026-08-10

### Afegit

- Títol i introducció propis per a la pàgina Estació.
- Nova pàgina «Cel de dia i de nit» al menú lateral, reutilitzant tots els càlculs d’astronomia existents.
- Producte oficial combinat radar + llamps de Meteocat integrat dins de la pàgina Radar.
- Selecció de webcams properes al Montseny amb quatre accessos verificats.
- Comparador avançat amb mapa interactiu del Baix Montseny, marcadors, llegenda i cinc variables commutables.
- Comparació actual i històrica per temperatura, humitat, pressió, vent i pluja en els períodes Ara, Avui i 24 h.

### Millorat

- Webcam de portada més ampla, centrada i proporcionada segons la referència visual de l’usuari.
- Finestra de compartir amb fons sòlid, més contrast i botons clarament llegibles.
- Distribució de la portada ajustada per donar més amplada a temperatura i webcam sense afectar la lectura ràpida.

### Preservat

- Worker i contractes de l’API sense canvis.
- Centre de Dades, avisos AEMET/Meteocat, PWA, compartir, push i resta de funcions de V9.
- Milestone 4 i posteriors sense iniciar.

## V9.0.0 — 2026-08-10

### Afegit

- Centre de Dades complet amb selecció de 7, 30 i 365 dies.
- Cobertura, nombre real de mostres, temperatura mitjana i desviació estàndard, pluja acumulada i ratxa màxima.
- Resums del dia, del mes i de l’any; arxiu d’extrems i efemèrides segons la cobertura disponible.
- Descàrregues locals en CSV, Excel, JSON i PDF, sense enviar dades a tercers.
- Miniatura discreta de la webcam a la portada, enllaçada amb la vista completa de Webcams.

### Corregit

- Eliminada la doble compensació vertical entre la capçalera fixa i la primera secció de cada pàgina.
- Preservat el farciment interior original de la portada en aplicar la correcció d’espaiat.
- Eliminats Comparar i Metodologia de tots els peus; continuen disponibles al menú principal.
- Mantingut un únic «Tornar amunt» al peu de cada pàgina.

### Preservat

- API i Worker sense canvis de contracte.
- Avisos AEMET/Meteocat, PWA, compartir, push, comparativa, radar i resta de mòduls existents.

## V8.0.1 — 2026-08-10

### Corregit

- Capçalera fixa i visible durant el desplaçament en totes les pàgines.
- Barra lateral compartida també a Comparar i Metodologia.
- Eliminats sis enllaços «Torna amunt» que havien quedat fora de les seves seccions i apareixien agrupats.
- Eliminada la navegació mòbil antiga duplicada; la hamburguesa és ara l’única navegació compacta.
- Eliminat el botó redundant «Tornar a l’inici» del principi de Metodologia.
- Enllaços de marca i retorn adaptats a les noves vistes del portal.
- Nous recursos comuns incorporats a la memòria cau de la PWA.

## V8.0.0 — 2026-08-10

### Afegit

- Governança del projecte amb `PROJECT.md`, `ROADMAP.md` i aquest registre.
- Menú lateral compacte en escriptori i menú hamburguesa en mòbil.
- Vistes especialitzades per Inici, Estació, Predicció, Avisos, Radar, Webcams, Centre de Dades, Medi Ambient i Contacte.
- Accés preservat a les pàgines existents Comparar i Metodologia.
- Router lleuger sense dependències ni canvis als contractes de dades.

### Canviat

- Portada reduïda a consulta ràpida: situació actual, mètriques, avisos, predicció i radar resumits.
- Contingut extens distribuït entre vistes, reutilitzant el mateix DOM i els mateixos mòduls.

### Preservat

- Avisos visibles d’AEMET i Meteocat, historial d’avisos i notificacions push.
- Comparativa, compartir, Worker, API, PWA, Service Worker i manifest.
- Capçalera, estat en directe i estètica general de la V7.

### Abast ajornat

- No s’han implementat funcions dels milestones 2–10. Medi Ambient només disposa de la nova ubicació estructural.
# V22.32.0 — Aigua i rius de la Tordera

- Nova pestanya «Aigua i rius» al costat del radar i els llamps, centrada en la conca de la Tordera.
- Lectures oficials de l’ACA de cabal i nivell a Sant Celoni i Montseny, amb hora, evolució recent i mapa propi.
- Nou proxy normalitzat al Worker amb memòria cau de cinc minuts, degradació segura i atribució explícita.
- Les dades automàtiques es presenten com a provisionals i no es converteixen en avisos ni llindars de perill inventats.
# V22.32.1 — Compatibilitat amb annexos parcials CECAT

### Corregit

- El lector de risc local ignora de manera segura les pàgines inicials que
  només contenen les dues franges restants del dia anterior i continua fins al
  següent bloc oficial complet de quatre mapes.
- Els canvis desconeguts en una pàgina que hauria de contenir quatre mapes
  continuen fallant de manera tancada i no poden generar publicacions.

# V22.32.2 — Càmera pròpia completada

### Afegit

- Ampliació accessible de la càmera nord des de la vista Webcams.
- Ruta separada per a la còpia amb marca pròpia, mantenint `latest.jpg` com a original net.
- Monitor periòdic que avisa per correu després de dues comprovacions amb una captura de més de 30 minuts i informa de la recuperació.
- Accessos directes a l'original i a la versió amb marca.
# V22.32.3 — Timelapse panoràmic i formats per canal · 2026-10-15

- Manté un enquadrament central 16:9 ampli en lloc del zoom vertical que retallava més de la meitat de la càmera.
- Genera una versió vertical 9:16 amb la panoràmica completa sobre un fons desenfocat.
- Publica la versió vertical a Instagram i TikTok, i la panoràmica a la web, Facebook i YouTube.
- Desa i serveix les dues variants per separat perquè cap canal degradi l'altre format.
- Ajusta les sortides a 960×540 i 540×960 i limita els filtres a un sol fil per evitar que la Raspberry es quedi sense memòria.
- Genera la còpia vertical a partir del panoràmic ja protegit, sense repetir els filtres sobre les 188 captures.

# V22.32.4 — Comprovació social silenciosa i eficient · 2026-10-15

- La comprovació preventiva ignora Bluesky, Telegram i qualsevol altre canal que encara no tingui credencials completes.
- X i TikTok comparteixen una sola consulta de canals a Buffer, reduint peticions innecessàries i el risc de límits 429.
- Els avisos idèntics queden agrupats durant sis hores; un límit temporal de Buffer genera un únic avís clar.

# V22.32.5 — Timelapse vertical sense desenfocament · 2026-10-15

- Substitueix les màscares desenfocades per un retall inferior del 10% que elimina les cases més pròximes.
- Genera el vertical amb la panoràmica completa centrada sobre un fons fosc estàtic, sense duplicar el vídeo.
- Redueix el consum de memòria d’FFmpeg perquè la Raspberry de 512 MB pugui completar la versió social.

# V22.32.6 — Selecció autònoma del timelapse · 2026-10-15

- Prepara cada dia les dues versions del timelapse i calcula el moviment meteorològic a la zona central del cel.
- Els dilluns, dimecres i divendres només publica quan el moviment és prou intens.
- La resta de dies exigeix alhora moviment intens i un avís oficial actiu groc, taronja o vermell.
- Manté com a màxim una publicació per data i deixa els vídeos descartats disponibles a l’administració.

# V22.32.7 — Timelapse amb memòria controlada · 2026-10-18

- Limita a un sol fil la descodificació, els filtres i la codificació de totes dues variants del timelapse.
- Redueix les arenas de memòria d’FFmpeg per evitar que la Raspberry de 512 MB activi l’OOM-killer.
- Aplica els mateixos límits a l’anàlisi de moviment sense alterar l’enquadrament ni la qualitat actuals.

# V22.39.0 — ESTOFEX local i visor EUMETSAT propi · 2026-10-18

- La secció d’avisos llegeix els polígons XML vigents d’ESTOFEX i calcula si Sant Celoni hi queda dins o a menys de 120 km.
- Quan hi ha context convectiu proper mostra el mapa oficial, nivell, distància i període de vigència, mantenint clar que no és un avís oficial.
- El Centre d’observació incorpora un visor propi amb núvols, masses d’aire i llamps MTG-I per Catalunya, el Mediterrani occidental i Europa.
- El Worker actua com a passarel·la WMS restringida per capa i regió, amb memòria cau, atribució EUMETSAT i degradació segura.
- Les imatges només es carreguen quan el visor s’aproxima a la pantalla, per evitar consum innecessari de dades.
