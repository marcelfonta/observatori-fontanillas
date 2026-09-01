const STORAGE_KEY='fontanillas-language-v1';
const SUPPORTED_LANGUAGES=['ca','es','en'];

const PHRASES={
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
  'Vent moderat':{es:'Viento moderado',en:'Moderate wind'},
  'Condicions suaus i sense fenòmens destacables a l’estació.':{es:'Condiciones suaves y sin fenómenos destacables en la estación.',en:'Mild conditions with no significant weather at the station.'},
  'Confort tèrmic':{es:'Confort térmico',en:'Thermal comfort'},
  'Avisos oficials':{es:'Avisos oficiales',en:'Official alerts'},
  'Veure fonts →':{es:'Ver fuentes →',en:'View sources →'},
  'Cada 5 minuts':{es:'Cada 5 minutos',en:'Every 5 minutes'},
  'Lectura ràpida':{es:'Lectura rápida',en:'Quick view'},
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
  'Busca una localitat i contrasta dues previsions independents amb les lectures reals d’estacions properes, sempre amb les fonts separades.':{es:'Busca una localidad y contrasta dos pronósticos independientes con lecturas reales de estaciones cercanas, siempre con las fuentes separadas.',en:'Search for a place and compare two independent forecasts with real readings from nearby stations, always keeping sources separate.'}
};

const TEXT_SOURCES=new WeakMap();
let language='ca';
let observer;
let languageChangeInProgress=false;

function safeStoredLanguage(){
  try{return localStorage.getItem(STORAGE_KEY);}catch{return null;}
}

export function getLanguage(){return language;}
export function getLocale(){return language==='es'?'es-ES':language==='en'?'en-GB':'ca-ES';}
export function t(source){return language==='ca'?source:(PHRASES[source]?.[language]||source);}

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
