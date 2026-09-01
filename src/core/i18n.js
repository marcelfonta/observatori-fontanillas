import { FRENCH_PHRASES } from './i18n-fr.js';

const STORAGE_KEY='fontanillas-language-v1';
export const SUPPORTED_LANGUAGES=['ca','es','en','fr'];

export const PHRASES={
  'En directe':{es:'En directo',en:'Live'},
  'Consulta oberta':{es:'Consulta abierta',en:'Open search'},
  'Consulta ràpida':{es:'Consulta rápida',en:'Quick view'},
  'Cerca el teu municipi':{es:'Busca tu municipio',en:'Search for your town'},
  'Idioma':{es:'Idioma',en:'Language'},
  'Inici':{es:'Inicio',en:'Home'},
  'Ara':{es:'Ahora',en:'Now'},
  'Més':{es:'Más',en:'More'},
  'Estació':{es:'Estación',en:'Station'},
  'Predicció':{es:'Predicción',en:'Forecast'},
  'Predicció meteorològica':{es:'Predicción meteorológica',en:'Weather forecast'},
  'Predicció en vídeo':{es:'Predicción en vídeo',en:'Video forecast'},
  'Predicció vs realitat':{es:'Predicción vs realidad',en:'Forecast vs reality'},
  'Avisos':{es:'Avisos',en:'Alerts'},
  'Vigilància oficial':{es:'Vigilancia oficial',en:'Official alerts'},
  'Cel de dia i de nit':{es:'Cielo de día y de noche',en:'Day and night sky'},
  'Radar meteorològic':{es:'Radar meteorológico',en:'Weather radar'},
  'Centre de Dades':{es:'Centro de Datos',en:'Data Centre'},
  'Comparar':{es:'Comparar',en:'Compare'},
  'Comparativa':{es:'Comparativa',en:'Comparison'},
  'El temps arreu':{es:'El tiempo en todas partes',en:'Weather anywhere'},
  'Arreu':{es:'Lugares',en:'Places'},
  'Medi Ambient':{es:'Medio Ambiente',en:'Environment'},
  'Aprendre':{es:'Aprender',en:'Learn'},
  'Aprendre meteorologia':{es:'Aprender meteorología',en:'Learn meteorology'},
  'Contacte':{es:'Contacto',en:'Contact'},
  'Metodologia':{es:'Metodología',en:'Methodology'},
  'Col·laboracions':{es:'Colaboraciones',en:'Collaborations'},
  'Saltar al contingut principal':{es:'Saltar al contenido principal',en:'Skip to main content'},
  'Principis de col·laboració':{es:'Principios de colaboración',en:'Collaboration principles'},
  'Material i tecnologia':{es:'Material y tecnología',en:'Equipment and technology'},
  'Procés clar':{es:'Proceso claro',en:'Clear process'},
  'Transparència':{es:'Transparencia',en:'Transparency'},
  'Previsió i risc':{es:'Predicción y riesgo',en:'Forecast and risk'},
  'Explora':{es:'Explora',en:'Explore'},
  'Dades i projecte':{es:'Datos y proyecto',en:'Data and project'},
  'Observatori meteorològic local':{es:'Observatorio meteorológico local',en:'Local weather observatory'},
  'Sant Celoni · Vallès Oriental':{es:'Sant Celoni · Vallès Oriental',en:'Sant Celoni · Vallès Oriental'},
  'El Montseny,':{es:'El Montseny,',en:'The Montseny,'},
  'mesurat al moment.':{es:'medido al momento.',en:'measured live.'},
  'Lectura en directe des de l’estació Fontanillas. Una mirada precisa al temps que fa i al que està canviant.':{es:'Lectura en directo desde la estación Fontanillas. Una mirada precisa al tiempo actual y a cómo está cambiando.',en:'Live readings from the Fontanillas station. A precise view of current weather and how it is changing.'},
  'Actualitzat':{es:'Actualizado',en:'Updated'},
  'ara mateix':{es:'ahora mismo',en:'just now'},
  'Webcam · ara':{es:'Webcam · ahora',en:'Webcam · now'},
  'Observació en directe':{es:'Observación en directo',en:'Live observation'},
  'Carregant observació…':{es:'Cargando observación…',en:'Loading observation…'},
  'Analitzant l’ambient':{es:'Analizando el ambiente',en:'Analysing conditions'},
  'Esperant les dades de l’estació per generar una lectura contextual.':{es:'Esperando los datos de la estación para generar una lectura contextual.',en:'Waiting for station data to generate a contextual reading.'},
  'Ambient confortable':{es:'Ambiente confortable',en:'Comfortable conditions'},
  'Pluja activa':{es:'Lluvia activa',en:'Active rain'},
  'Vent destacable':{es:'Viento destacado',en:'Notable wind'},
  'Ambient humit':{es:'Ambiente húmedo',en:'Humid conditions'},
  'Calor marcada':{es:'Calor destacable',en:'Notable heat'},
  'Temperatura alta; la sensació tèrmica és el valor clau ara mateix.':{es:'Temperatura alta; la sensación térmica es el valor clave ahora mismo.',en:'High temperature; the feels-like value is the key reading right now.'},
  'Pluja a l’observatori':{es:'Lluvia en el observatorio',en:'Rain at the observatory'},
  'Vent moderat':{es:'Viento moderado',en:'Moderate wind'},
  'Condicions suaus i sense fenòmens destacables a l’estació.':{es:'Condiciones suaves y sin fenómenos destacables en la estación.',en:'Mild conditions with no significant weather at the station.'},
  'Confort tèrmic':{es:'Confort térmico',en:'Thermal comfort'},
  'Avisos oficials':{es:'Avisos oficiales',en:'Official alerts'},
  'Sense avisos oficials actius':{es:'Sin avisos oficiales activos',en:'No active official alerts'},
  'Sense avisos actius':{es:'Sin avisos activos',en:'No active alerts'},
  'Comprovant la situació':{es:'Comprobando la situación',en:'Checking conditions'},
  'Darrera comprovació oficial actualitzada':{es:'Última comprobación oficial actualizada',en:'Latest official check updated'},
  'Consultar →':{es:'Consultar →',en:'View →'},
  'Veure fonts →':{es:'Ver fuentes →',en:'View sources →'},
  'Cada 5 minuts':{es:'Cada 5 minutos',en:'Every 5 minutes'},
  'Lectura ràpida':{es:'Lectura rápida',en:'Quick view'},
  'Temperatura':{es:'Temperatura',en:'Temperature'},
  'Sensació':{es:'Sensación',en:'Feels like'},
  'Humitat':{es:'Humedad',en:'Humidity'},
  'Punt de rosada':{es:'Punto de rocío',en:'Dew point'},
  'Vent':{es:'Viento',en:'Wind'},
  'Ratxa':{es:'Racha',en:'Gust'},
  'Pressió':{es:'Presión',en:'Pressure'},
  'Pluja avui':{es:'Lluvia hoy',en:'Rain today'},
  'Intensitat de pluja':{es:'Intensidad de lluvia',en:'Rain intensity'},
  'Radiació solar':{es:'Radiación solar',en:'Solar radiation'},
  'Índex UV':{es:'Índice UV',en:'UV index'},
  'Sensació tèrmica':{es:'Sensación térmica',en:'Feels-like temperature'},
  'Temperatura de xafogor':{es:'Temperatura de bochorno',en:'Humidex temperature'},
  'Sensor':{es:'Sensor',en:'Sensor'},
  'Acumulada':{es:'Acumulada',en:'Accumulated'},
  'Risc solar':{es:'Riesgo solar',en:'Solar risk'},
  'Combinada':{es:'Combinada',en:'Combined'},
  'Interpretant':{es:'Interpretando',en:'Interpreting'},
  'Recollint':{es:'Recopilando',en:'Collecting'},
  'Tendència pendent':{es:'Tendencia pendiente',en:'Trend pending'},
  'Lectura pendent':{es:'Lectura pendiente',en:'Reading pending'},
  'Sense lectura':{es:'Sin lectura',en:'No reading'},
  'Sense precipitació':{es:'Sin precipitación',en:'No precipitation'},
  'No disponible':{es:'No disponible',en:'Unavailable'},
  'Màx.':{es:'Máx.',en:'Max.'},
  'Mín.':{es:'Mín.',en:'Min.'},
  'Des de les 00:00':{es:'Desde las 00:00',en:'Since 00:00'},
  'Pressió alta':{es:'Presión alta',en:'High pressure'},
  'Pressió baixa':{es:'Presión baja',en:'Low pressure'},
  'Pressió normal':{es:'Presión normal',en:'Normal pressure'},
  'Rang habitual':{es:'Rango habitual',en:'Typical range'},
  'Rang confortable':{es:'Rango confortable',en:'Comfortable range'},
  'Confortable':{es:'Confortable',en:'Comfortable'},
  'Baix':{es:'Bajo',en:'Low'},
  'Moderat':{es:'Moderado',en:'Moderate'},
  'Alt':{es:'Alto',en:'High'},
  'estable':{es:'estable',en:'stable'},
  'Fred intens':{es:'Frío intenso',en:'Intense cold'},
  'Ambient fresc':{es:'Ambiente fresco',en:'Cool conditions'},
  'Calor moderada':{es:'Calor moderado',en:'Moderate heat'},
  'Calor alta':{es:'Calor intenso',en:'High heat'},
  'Calor extrema':{es:'Calor extremo',en:'Extreme heat'},
  'Aire sec':{es:'Aire seco',en:'Dry air'},
  'Humitat molt alta':{es:'Humedad muy alta',en:'Very high humidity'},
  'Sense acumulació':{es:'Sin acumulación',en:'No accumulation'},
  'Acumulació baixa':{es:'Acumulación baja',en:'Low accumulation'},
  'Acumulació moderada':{es:'Acumulación moderada',en:'Moderate accumulation'},
  'Acumulació alta':{es:'Acumulación alta',en:'High accumulation'},
  'Acumulació molt alta':{es:'Acumulación muy alta',en:'Very high accumulation'},
  'Pluja feble':{es:'Lluvia débil',en:'Light rain'},
  'Pluja moderada':{es:'Lluvia moderada',en:'Moderate rain'},
  'Pluja intensa':{es:'Lluvia intensa',en:'Heavy rain'},
  'Pluja torrencial':{es:'Lluvia torrencial',en:'Torrential rain'},
  'Radiació feble':{es:'Radiación débil',en:'Low radiation'},
  'Radiació moderada':{es:'Radiación moderada',en:'Moderate radiation'},
  'Radiació alta':{es:'Radiación alta',en:'High radiation'},
  'Radiació molt alta':{es:'Radiación muy alta',en:'Very high radiation'},
  'Sensació fresca':{es:'Sensación fresca',en:'Cool feel'},
  'Calor perceptible':{es:'Calor perceptible',en:'Noticeable heat'},
  'Calor intensa':{es:'Calor intenso',en:'Intense heat'},
  'Estrès tèrmic':{es:'Estrés térmico',en:'Heat stress'},
  'Precipitació activa':{es:'Precipitación activa',en:'Active precipitation'},
  'L’estació, sensor a sensor.':{es:'La estación, sensor a sensor.',en:'The station, sensor by sensor.'},
  'Lectures actuals, valors calculats i resum del dia des de Sant Celoni.':{es:'Lecturas actuales, valores calculados y resumen del día desde Sant Celoni.',en:'Current readings, calculated values and today’s summary from Sant Celoni.'},
  'La previsió, ordenada per horitzons.':{es:'La predicción, ordenada por horizontes.',en:'The forecast, organised by time horizon.'},
  'Properes hores, dies i models de confiança per entendre què pot canviar.':{es:'Próximas horas, días y modelos fiables para entender qué puede cambiar.',en:'The next hours, days and trusted models to understand what may change.'},
  'Avisos que poden afectar Sant Celoni.':{es:'Avisos que pueden afectar a Sant Celoni.',en:'Alerts that may affect Sant Celoni.'},
  'Seguiment del Vallès Oriental i del Prelitoral de Barcelona amb fonts oficials.':{es:'Seguimiento del Vallès Oriental y del Prelitoral de Barcelona con fuentes oficiales.',en:'Official monitoring for Vallès Oriental and the Barcelona Pre-Coastal area.'},
  'Una biblioteca per entendre el cel.':{es:'Una biblioteca para entender el cielo.',en:'A library for understanding the sky.'},
  'Recursos educatius verificats, ordenats per nivell i tema, per observar, preguntar i aprendre amb fonts sòlides.':{es:'Recursos educativos verificados, ordenados por nivel y tema, para observar, preguntar y aprender con fuentes sólidas.',en:'Verified educational resources, organised by level and topic, for observing, asking questions and learning from reliable sources.'},
  'Entorn i salut ambiental.':{es:'Entorno y salud ambiental.',en:'Environment and environmental health.'},
  'Aire, radiació, pol·len i accés directe als indicadors oficials del territori i la costa.':{es:'Aire, radiación, polen y acceso directo a los indicadores oficiales del territorio y la costa.',en:'Air, radiation, pollen and direct access to official indicators for the territory and coast.'},
  'Una mirada directa al Montseny.':{es:'Una mirada directa al Montseny.',en:'A direct view of the Montseny.'},
  'Imatge de l’observatori i accessos seleccionats a altres vistes properes.':{es:'Imagen del observatorio y accesos seleccionados a otras vistas cercanas.',en:'The observatory image and selected links to other nearby views.'},
  'El cel, de dia i de nit.':{es:'El cielo, de día y de noche.',en:'The sky, by day and night.'},
  'Sol, Lluna, fases, estacions i esdeveniments visibles des de Catalunya.':{es:'Sol, Luna, fases, estaciones y eventos visibles desde Catalunya.',en:'Sun, Moon, phases, seasons and events visible from Catalonia.'},
  'El temps, explicat en vídeo.':{es:'El tiempo, explicado en vídeo.',en:'The weather, explained on video.'},
  'Les darreres previsions audiovisuals de fonts oficials i fiables, reunides sense reproducció automàtica.':{es:'Las últimas predicciones audiovisuales de fuentes oficiales y fiables, reunidas sin reproducción automática.',en:'The latest video forecasts from official, reliable sources, gathered without autoplay.'},
  'Predicció vs realitat.':{es:'Predicción vs realidad.',en:'Forecast vs reality.'},
  'Mesurem amb dades reals fins a quin punt encerta la previsió meteorològica.':{es:'Medimos con datos reales hasta qué punto acierta la predicción meteorológica.',en:'We use real observations to measure forecast accuracy.'},
  'L’arxiu meteorològic, ordenat.':{es:'El archivo meteorológico, ordenado.',en:'The weather archive, organised.'},
  'Resums, cobertura, rècords i descàrregues a partir de l’històric real.':{es:'Resúmenes, cobertura, récords y descargas a partir del histórico real.',en:'Summaries, coverage, records and downloads from real historical data.'},
  'Parlem de meteorologia.':{es:'Hablemos de meteorología.',en:'Let’s talk about weather.'},
  'Consultes, incidències de dades i propostes per continuar millorant l’Observatori.':{es:'Consultas, incidencias de datos y propuestas para seguir mejorando el Observatorio.',en:'Questions, data issues and ideas to keep improving the Observatory.'},
  'Cerca':{es:'Busca',en:'Search'},
  'On vols consultar el temps?':{es:'¿Dónde quieres consultar el tiempo?',en:'Where would you like to check the weather?'},
  'Comença a escriure i tria la coincidència correcta de la llista.':{es:'Empieza a escribir y elige la coincidencia correcta de la lista.',en:'Start typing and choose the correct match from the list.'},
  'Localitat':{es:'Localidad',en:'Place'},
  'Buscar':{es:'Buscar',en:'Search'},
  'Encara no s’ha fet cap consulta.':{es:'Todavía no se ha realizado ninguna consulta.',en:'No search has been made yet.'},
  'Accés ràpid':{es:'Acceso rápido',en:'Quick access'},
  'Municipis desats':{es:'Municipios guardados',en:'Saved places'},
  'Es desen només en aquest navegador.':{es:'Se guardan solo en este navegador.',en:'They are saved only in this browser.'},
  'Com llegir aquesta pàgina':{es:'Cómo leer esta página',en:'How to read this page'},
  'Fonts diferents, papers diferents':{es:'Fuentes diferentes, funciones diferentes',en:'Different sources, different roles'},
  'Previsions':{es:'Predicciones',en:'Forecasts'},
  'Observació':{es:'Observación',en:'Observation'},
  'Altres fonts':{es:'Otras fuentes',en:'Other sources'},
  'Privacitat':{es:'Privacidad',en:'Privacy'},
  'Tornar amunt ↑':{es:'Volver arriba ↑',en:'Back to top ↑'},
  'Fonts visibles':{es:'Fuentes visibles',en:'Visible sources'},
  'Previsions i estacions arreu del món':{es:'Predicciones y estaciones de todo el mundo',en:'Forecasts and stations worldwide'},
  'Busca una localitat i contrasta dues previsions independents amb les lectures reals d’estacions properes, sempre amb les fonts separades.':{es:'Busca una localidad y contrasta dos pronósticos independientes con lecturas reales de estaciones cercanas, siempre con las fuentes separadas.',en:'Search for a place and compare two independent forecasts with real readings from nearby stations, always keeping sources separate.'},
  'Projecte obert a col·laboracions responsables':{es:'Proyecto abierto a colaboraciones responsables',en:'A project open to responsible collaborations'},
  'Col·laboracions que milloren l’observació local':{es:'Colaboraciones que mejoran la observación local',en:'Collaborations that improve local observation'},
  'Busquem equipament cedit o en préstec, accés tècnic i aliances de divulgació per mesurar millor el temps del Baix Montseny.':{es:'Buscamos equipamiento cedido o en préstamo, acceso técnico y alianzas de divulgación para medir mejor el tiempo del Baix Montseny.',en:'We are looking for donated or loaned equipment, technical access and outreach partnerships to improve weather observation in the Baix Montseny.'},
  'Proposta transparent':{es:'Propuesta transparente',en:'A transparent proposal'},
  'No demanem una opinió positiva ni cedim el control editorial. Qualsevol material rebut s’identifica de manera visible i les conclusions es publiquen amb independència.':{es:'No pedimos una opinión positiva ni cedemos el control editorial. Cualquier material recibido se identifica de forma visible y las conclusiones se publican con independencia.',en:'We do not ask for a positive review or give up editorial control. Any equipment received is clearly disclosed and conclusions are published independently.'},
  'Què aporta l’Observatori':{es:'Qué aporta el Observatorio',en:'What the Observatory offers'},
  'Prova de camp real':{es:'Prueba de campo real',en:'Real-world field testing'},
  'Instal·lació i seguiment en un entorn local amb dades contínues i condicions mediterrànies.':{es:'Instalación y seguimiento en un entorno local con datos continuos y condiciones mediterráneas.',en:'Installation and monitoring in a local setting with continuous data and Mediterranean conditions.'},
  'Integració tècnica':{es:'Integración técnica',en:'Technical integration'},
  'Connexió amb la web, documentació del procés i, quan sigui possible, ús responsable de l’API.':{es:'Conexión con la web, documentación del proceso y, cuando sea posible, uso responsable de la API.',en:'Website integration, documented implementation and responsible API use whenever possible.'},
  'Divulgació útil':{es:'Divulgación útil',en:'Useful outreach'},
  'Cas pràctic públic, contingut educatiu i comunicació a les xarxes del projecte sense promeses d’abast.':{es:'Caso práctico público, contenido educativo y comunicación en las redes del proyecto sin promesas de alcance.',en:'A public case study, educational content and communication through the project’s social channels without reach guarantees.'},
  'Què busquem':{es:'Qué buscamos',en:'What we are looking for'},
  'Estacions i sensors':{es:'Estaciones y sensores',en:'Stations and sensors'},
  'Pluja, vent, qualitat de l’aire, sòl, radiació o detecció de llamps, sempre que siguin compatibles amb un projecte local.':{es:'Lluvia, viento, calidad del aire, suelo, radiación o detección de rayos, siempre que sean compatibles con un proyecto local.',en:'Rain, wind, air quality, soil, radiation or lightning sensors that are suitable for a local project.'},
  'Accés i suport tècnic':{es:'Acceso y soporte técnico',en:'Technical access and support'},
  'Documentació, API o orientació per integrar les dades sense exposar credencials ni alterar el producte.':{es:'Documentación, API u orientación para integrar los datos sin exponer credenciales ni alterar el producto.',en:'Documentation, API access or guidance to integrate data without exposing credentials or altering the product.'},
  'Material, no finançament':{es:'Material, no financiación',en:'Equipment, not funding'},
  'La proposta inicial és una cessió o un préstec de material. No és necessari aportar diners.':{es:'La propuesta inicial es una cesión o un préstamo de material. No es necesario aportar dinero.',en:'The initial proposal is an equipment donation or loan. Financial support is not required.'},
  'Xarxes i difusió':{es:'Redes y difusión',en:'Social channels and outreach'},
  'Una col·laboració amb continuïtat':{es:'Una colaboración con continuidad',en:'An ongoing collaboration'},
  'Canals del projecte':{es:'Canales del proyecto',en:'Project channels'},
  'Instagram, Facebook, TikTok, YouTube i X, amb accés a la resta de comunitats des del directori oficial de xarxes.':{es:'Instagram, Facebook, TikTok, YouTube y X, con acceso al resto de comunidades desde el directorio oficial de redes.',en:'Instagram, Facebook, TikTok, YouTube and X, with access to the other communities from the official social directory.'},
  'Publicacions periòdiques':{es:'Publicaciones periódicas',en:'Periodic posts'},
  'Presentació inicial, actualitzacions pactades durant la col·laboració i una peça final amb resultats, sense saturar l’audiència.':{es:'Presentación inicial, actualizaciones acordadas durante la colaboración y una pieza final con resultados, sin saturar a la audiencia.',en:'An initial announcement, agreed updates during the collaboration and a final results piece, without overwhelming the audience.'},
  'Patrocini identificat':{es:'Patrocinio identificado',en:'Clearly identified sponsorship'},
  'Cada publicació indicarà de manera clara si hi ha material cedit, préstec o patrocini, d’acord amb les normes de cada xarxa.':{es:'Cada publicación indicará claramente si existe material cedido, préstamo o patrocinio, de acuerdo con las normas de cada red.',en:'Every post will clearly state whether equipment was donated, loaned or sponsored, in accordance with each platform’s rules.'},
  'Com funciona':{es:'Cómo funciona',en:'How it works'},
  'Proposta':{es:'Propuesta',en:'Proposal'},
  'Definim l’equipament, l’objectiu i les condicions de transparència.':{es:'Definimos el equipamiento, el objetivo y las condiciones de transparencia.',en:'We define the equipment, objective and transparency terms.'},
  'Compatibilitat':{es:'Compatibilidad',en:'Compatibility'},
  'Revisem instal·lació, connectivitat, llicències de dades i manteniment.':{es:'Revisamos instalación, conectividad, licencias de datos y mantenimiento.',en:'We review installation, connectivity, data licensing and maintenance.'},
  'Prova i publicació':{es:'Prueba y publicación',en:'Testing and publication'},
  'Instal·lem, validem i publiquem el procés i els resultats amb atribució clara.':{es:'Instalamos, validamos y publicamos el proceso y los resultados con una atribución clara.',en:'We install, validate and publish the process and results with clear attribution.'},
  'Situació actual':{es:'Situación actual',en:'Current status'},
  'Actualment no hi ha cap patrocini comercial actiu. Les futures col·laboracions es declararan en aquesta pàgina.':{es:'Actualmente no hay ningún patrocinio comercial activo. Las futuras colaboraciones se declararán en esta página.',en:'There is currently no active commercial sponsorship. Future collaborations will be disclosed on this page.'},
  'Vols proposar una col·laboració?':{es:'¿Quieres proponer una colaboración?',en:'Would you like to propose a collaboration?'},
  'Explica’ns quin material o accés tècnic proposes i quin objectiu voldries validar.':{es:'Explícanos qué material o acceso técnico propones y qué objetivo te gustaría validar.',en:'Tell us what equipment or technical access you propose and what objective you would like to validate.'},
  'Contactar amb l’Observatori →':{es:'Contactar con el Observatorio →',en:'Contact the Observatory →'},
  'Independència editorial':{es:'Independencia editorial',en:'Editorial independence'},
  'Atribució visible':{es:'Atribución visible',en:'Visible attribution'},
  'Dades verificables':{es:'Datos verificables',en:'Verifiable data'}
};

const DYNAMIC_REPLACEMENTS={
  es:[
    [/^Comprovat a les\s+/,'Comprobado a las '],
    [/^Actualitzat a les\s+/,'Actualizado a las '],
    [/^Vigent fins a les\s+/,'Vigente hasta las '],
    [/^Vigent fins al\s+/,'Vigente hasta el '],
    [/^Posta de sol a les\s+/,'Puesta de sol a las '],
    [/^Ara plou a ([\d,.]+) mm\/h\. Cal seguir-ne l’evolució\.$/,'Ahora llueve a $1 mm/h. Conviene seguir su evolución.'],
    [/^El vent bufa a ([\d,.]+) km\/h, amb ratxes de ([\d,.]+) km\/h\.$/,'El viento sopla a $1 km/h, con rachas de $2 km/h.'],
    [/^Humitat elevada del ([\d,.]+)% i punt de rosada a ([\d,.]+) °C\.$/,'Humedad elevada del $1% y punto de rocío a $2 °C.'],
    [/^Fa (\d+) h$/,'Hace $1 h'],
    [/^fa (\d+) min$/,'hace $1 min'],
    [/(^|\s)a les (\d{1,2}:\d{2})/g,'$1a las $2'],
    [/^(\d+) punts històrics reals disponibles$/,'$1 puntos históricos reales disponibles'],
    [/^(\d+) hores amb pluja$/,'$1 horas con lluvia'],
    [/^(\d+) hora amb pluja$/,'$1 hora con lluvia']
  ],
  en:[
    [/^Comprovat a les\s+/,'Checked at '],
    [/^Actualitzat a les\s+/,'Updated at '],
    [/^Vigent fins a les\s+/,'Valid until '],
    [/^Vigent fins al\s+/,'Valid until '],
    [/^Posta de sol a les\s+/,'Sunset at '],
    [/^Ara plou a ([\d,.]+) mm\/h\. Cal seguir-ne l’evolució\.$/,'It is raining at $1 mm/h. Keep monitoring its evolution.'],
    [/^El vent bufa a ([\d,.]+) km\/h, amb ratxes de ([\d,.]+) km\/h\.$/,'Wind is blowing at $1 km/h, with gusts of $2 km/h.'],
    [/^Humitat elevada del ([\d,.]+)% i punt de rosada a ([\d,.]+) °C\.$/,'Humidity is $1%, with a dew point of $2 °C.'],
    [/^Fa (\d+) h$/,'$1 h ago'],
    [/^fa (\d+) min$/,'$1 min ago'],
    [/(^|\s)a les (\d{1,2}:\d{2})/g,'$1at $2'],
    [/^(\d+) punts històrics reals disponibles$/,'$1 real historical points available'],
    [/^(\d+) hores amb pluja$/,'$1 rainy hours'],
    [/^(\d+) hora amb pluja$/,'$1 rainy hour']
  ],
  fr:[
    [/^Comprovat a les\s+/,'Vérifié à '],
    [/^Actualitzat a les\s+/,'Mis à jour à '],
    [/^Vigent fins a les\s+/,'Valable jusqu’à '],
    [/^Vigent fins al\s+/,'Valable jusqu’au '],
    [/^Posta de sol a les\s+/,'Coucher du soleil à '],
    [/^Ara plou a ([\d,.]+) mm\/h\. Cal seguir-ne l’evolució\.$/,'Il pleut actuellement à $1 mm/h. Son évolution doit être surveillée.'],
    [/^El vent bufa a ([\d,.]+) km\/h, amb ratxes de ([\d,.]+) km\/h\.$/,'Le vent souffle à $1 km/h, avec des rafales à $2 km/h.'],
    [/^Humitat elevada del ([\d,.]+)% i punt de rosada a ([\d,.]+) °C\.$/,'Humidité élevée de $1 %, avec un point de rosée à $2 °C.'],
    [/^Fa (\d+) h$/,'Il y a $1 h'],
    [/^fa (\d+) min$/,'il y a $1 min'],
    [/(^|\s)a les (\d{1,2}:\d{2})/g,'$1à $2'],
    [/^(\d+) punts històrics reals disponibles$/,'$1 points historiques réels disponibles'],
    [/^(\d+) hores amb pluja$/,'$1 heures de pluie'],
    [/^(\d+) hora amb pluja$/,'$1 heure de pluie']
  ]
};

const TEXT_SOURCES=new WeakMap();
let language='ca';
let observer;
let languageChangeInProgress=false;

function safeStoredLanguage(){
  try{return localStorage.getItem(STORAGE_KEY);}catch{return null;}
}

export function getLanguage(){return language;}
export function getLocale(){return language==='es'?'es-ES':language==='en'?'en-GB':language==='fr'?'fr-FR':'ca-ES';}
export function t(source){
  if(language==='ca'||typeof source!=='string')return source;
  const exact=language==='fr'?FRENCH_PHRASES[source]:PHRASES[source]?.[language];
  if(exact)return exact;
  return (DYNAMIC_REPLACEMENTS[language]||[]).reduce((value,[pattern,replacement])=>value.replace(pattern,replacement),source);
}

export function getTranslationCoverage(){
  const keys=Object.keys(PHRASES);
  return {
    total:keys.length,
    missing:{
      es:keys.filter(key=>!PHRASES[key]?.es),
      en:keys.filter(key=>!PHRASES[key]?.en),
      fr:keys.filter(key=>!FRENCH_PHRASES[key])
    }
  };
}

function translateTextNode(node){
  if(!node?.parentElement||['SCRIPT','STYLE','NOSCRIPT','CODE','PRE'].includes(node.parentElement.tagName))return;
  const match=node.nodeValue.match(/^(\s*)(.*?)(\s*)$/s);
  const current=match?.[2]||'';
  if(!current)return;
  if(!TEXT_SOURCES.has(node))TEXT_SOURCES.set(node,current);
  else if(!languageChangeInProgress){
    const previous=TEXT_SOURCES.get(node);
    if(current!==previous&&current!==t(previous))TEXT_SOURCES.set(node,current);
  }
  const source=TEXT_SOURCES.get(node);
  const translated=t(source);
  const next=`${match[1]}${translated}${match[3]}`;
  if(node.nodeValue!==next)node.nodeValue=next;
}

export function translateDocument(root=document.body){
  if(!root)return;
  if(root.nodeType===Node.TEXT_NODE){translateTextNode(root);return;}
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode()))translateTextNode(node);
  root.querySelectorAll?.('[data-i18n-placeholder]').forEach(element=>{
    if(!element.dataset.i18nSourcePlaceholder)element.dataset.i18nSourcePlaceholder=element.getAttribute('placeholder')||'';
    element.setAttribute('placeholder',t(element.dataset.i18nSourcePlaceholder));
  });
  root.querySelectorAll?.('[data-i18n-label]').forEach(element=>{
    if(!element.dataset.i18nSourceLabel)element.dataset.i18nSourceLabel=element.getAttribute('aria-label')||'';
    element.setAttribute('aria-label',t(element.dataset.i18nSourceLabel));
  });
}

export function setLanguage(nextLanguage,{persist=true}={}){
  language=SUPPORTED_LANGUAGES.includes(nextLanguage)?nextLanguage:'ca';
  document.documentElement.lang=language;
  if(persist){try{localStorage.setItem(STORAGE_KEY,language);}catch{}}
  languageChangeInProgress=true;
  translateDocument();
  languageChangeInProgress=false;
  document.dispatchEvent(new CustomEvent('observatori:language-change',{detail:{language,locale:getLocale()}}));
  queueMicrotask(()=>translateDocument());
}

export function initLanguage(){
  const stored=safeStoredLanguage();
  language=SUPPORTED_LANGUAGES.includes(stored)?stored:'ca';
  document.documentElement.lang=language;
  translateDocument();
  observer?.disconnect();
  observer=new MutationObserver(records=>records.forEach(record=>{
    if(record.type==='characterData')translateTextNode(record.target);
    record.addedNodes.forEach(node=>translateDocument(node));
  }));
  if(document.body)observer.observe(document.body,{subtree:true,childList:true,characterData:true});
}
