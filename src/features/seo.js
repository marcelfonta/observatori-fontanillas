import { CONFIG } from '../core/config.js';

const BASE='https://meteo.fontanillas.cat/';
const PAGES={
  inici:{title:'Observatori Meteorològic Fontanillas · Temps a Sant Celoni',description:'Dades meteorològiques en directe, avisos, predicció i radar des de Sant Celoni, als peus del Montseny.'},
  'meteo-ia':{title:'Meteo IA · Pregunta pel temps',description:'Assistent meteorològic amb fonts visibles per consultar Sant Celoni, altres poblacions, dates i activitats.'},
  estacio:{title:'Estació Fontanillas · Dades meteorològiques en directe',description:'Temperatura, humitat, vent, pressió, pluja, radiació i índex UV mesurats a Sant Celoni.'},
  prediccio:{title:'Predicció del temps a Sant Celoni · 7 dies i tendència',description:'Previsió horària i diària, comparació de models i tendència ECMWF fins a sis setmanes per a Sant Celoni.'},
  videos:{title:'Predicció del temps en vídeo · Meteocat, AEMET i 3Cat',description:'Vídeos meteorològics oficials i actualitzats de Meteocat, AEMET i 3Cat reunits en un únic espai.'},
  verificacio:{title:'Predicció vs realitat · Precisió meteorològica a Sant Celoni',description:'Comprovació transparent de la previsió comparada amb les observacions reals de l’estació Fontanillas.'},
  cel:{title:'Sol, Lluna i astronomia a Sant Celoni',description:'Sortida i posta del Sol, fases de la Lluna, estacions i esdeveniments del cel visibles des del Baix Montseny.'},
  avisos:{title:'Avisos meteorològics per a Sant Celoni',description:'Avisos oficials de Meteocat i AEMET per al Vallès Oriental i el Prelitoral de Barcelona.'},
  radar:{title:'Radar meteorològic i llamps a Catalunya',description:'Radar de precipitació i activitat elèctrica centrats a Sant Celoni i el Baix Montseny.'},
  webcams:{title:'Webcams de Sant Celoni i el Montseny',description:'Vista actual de la webcam Fontanillas i selecció de webcams properes al Montseny.'},
  'centre-dades':{title:'Dades meteorològiques històriques de Sant Celoni',description:'Històric, pluja, extrems, cobertura i descàrregues de l’estació Fontanillas a Sant Celoni.'},
  'medi-ambient':{title:'Qualitat de l’aire i medi ambient a Sant Celoni',description:'Qualitat de l’aire, UV, pol·len, risc d’incendi, sequera i meduses amb fonts identificades.'},
  aprendre:{title:'Aprendre meteorologia · Observatori Fontanillas',description:'Biblioteca educativa de meteorologia amb recursos verificats per nivell, tema i idioma de Meteocat, AEMET, OMM, NOAA, NASA, ESA i centres científics.'},
  contacte:{title:'Contacte · Observatori Fontanillas',description:'Contacta amb l’Observatori Meteorològic Fontanillas per consultes, incidències de dades o propostes.'}
};

function setMeta(selector,value){const node=document.querySelector(selector);if(node)node.setAttribute('content',value);}

let activePage='inici';

function observationFromInitialSchema(){
  if(typeof document==='undefined')return null;
  const schema=document.getElementById('seo-structured-data');
  if(!schema?.textContent)return null;
  try{
    const parsed=JSON.parse(schema.textContent);
    const observation=parsed?.['@graph']?.find(item=>item?.['@type']==='Observation');
    if(!observation)return null;
    const values=new Map((observation.measuredProperty||[]).map(item=>[item?.name,item?.value]));
    const temperature=Number(values.get('Temperatura'));
    if(!Number.isFinite(temperature))return null;
    return {
      temperature,
      humidity:values.get('Humitat relativa'),
      pressure:values.get('Pressió atmosfèrica'),
      windSpeed:values.get('Velocitat del vent'),
      rainToday:values.get('Precipitació acumulada avui'),
      updated:observation.observationDate
    };
  }catch{return null;}
}

let latestObservation=observationFromInitialSchema();

function structuredGraph(page,observation){
  const current=PAGES[page]||PAGES.inici;
  const canonicalUrl=BASE;
  const graph=[
    {'@type':'WebSite','@id':`${BASE}#website`,name:'Observatori Meteorològic Fontanillas',url:BASE,inLanguage:'ca',description:PAGES.inici.description},
    {'@type':'Organization','@id':`${BASE}#organization`,name:'Observatori Meteorològic Fontanillas',url:BASE,logo:{'@type':'ImageObject',url:`${BASE}assets/images/observatori-fontanillas-avatar-v21.png`},sameAs:['https://www.facebook.com/meteofontanillas/','https://www.instagram.com/meteo_fontanillas/','https://www.threads.com/@meteo_fontanillas','https://bsky.app/profile/meteofontanillas.bsky.social','https://t.me/meteofontanillas','https://www.tiktok.com/@meteo_fontanillas','https://www.youtube.com/@MeteoFontanillas']},
    {'@type':'WebPage','@id':`${canonicalUrl}#webpage`,url:canonicalUrl,name:current.title,description:current.description,inLanguage:'ca',isPartOf:{'@id':`${BASE}#website`},about:{'@id':`${BASE}#dataset`},publisher:{'@id':`${BASE}#organization`}},
    {'@type':'Dataset','@id':`${BASE}#dataset`,name:'Observacions meteorològiques de l’estació Fontanillas',description:'Sèries meteorològiques locals de temperatura, humitat, pressió, vent, precipitació, radiació solar i índex UV.',url:BASE,inLanguage:'ca',creator:{'@id':`${BASE}#organization`},spatialCoverage:{'@type':'Place',name:'Sant Celoni, Vallès Oriental',geo:{'@type':'GeoCoordinates',latitude:41.6906,longitude:2.489}},temporalCoverage:'2025/..',measurementTechnique:'Estació meteorològica automàtica',variableMeasured:['Temperatura','Humitat relativa','Pressió atmosfèrica','Velocitat i ratxa del vent','Precipitació','Radiació solar','Índex UV']},
    {'@type':'BreadcrumbList','@id':`${canonicalUrl}#breadcrumb`,itemListElement:[{'@type':'ListItem',position:1,name:'Inici',item:BASE}]}
  ];
  if(observation&&Number.isFinite(Number(observation.temperature))){
    const property=(name,value,unit)=>({'@type':'PropertyValue',name,value:Number(value),...(unit?{unitText:unit}:{})});
    const values=[property('Temperatura',observation.temperature,'°C')];
    if(Number.isFinite(Number(observation.humidity)))values.push(property('Humitat relativa',observation.humidity,'%'));
    if(Number.isFinite(Number(observation.pressure)))values.push(property('Pressió atmosfèrica',observation.pressure,'hPa'));
    if(Number.isFinite(Number(observation.windSpeed)))values.push(property('Velocitat del vent',observation.windSpeed,'km/h'));
    if(Number.isFinite(Number(observation.rainToday)))values.push(property('Precipitació acumulada avui',observation.rainToday,'mm'));
    graph.push({'@type':'Observation','@id':`${BASE}#latest-observation`,name:'Darrera observació meteorològica de Fontanillas',observationDate:observation.updated||new Date().toISOString(),measuredProperty:values,about:{'@id':`${BASE}#dataset`},spatialCoverage:{'@type':'Place',name:'Sant Celoni'}});
  }
  return {'@context':'https://schema.org','@graph':graph};
}

function renderStructuredData(){const schema=document.getElementById('seo-structured-data');if(schema)schema.textContent=JSON.stringify(structuredGraph(activePage,latestObservation));}

export function updateSeoMetadata(page='inici'){
  activePage=page;
  const current=PAGES[page]||PAGES.inici;
  const viewUrl=page==='inici'?BASE:`${BASE}?page=${encodeURIComponent(page)}`;
  const canonicalUrl=BASE;
  const verification=String(CONFIG.googleSiteVerification||'').trim();
  let verificationMeta=document.querySelector('meta[name="google-site-verification"]');
  if(verification&&!verificationMeta){verificationMeta=document.createElement('meta');verificationMeta.name='google-site-verification';document.head.append(verificationMeta);}
  if(verificationMeta){if(verification)verificationMeta.content=verification;else verificationMeta.remove();}
  document.title=current.title;
  setMeta('meta[name="description"]',current.description);
  setMeta('meta[property="og:title"]',current.title);setMeta('meta[property="og:description"]',current.description);setMeta('meta[property="og:url"]',viewUrl);
  setMeta('meta[name="twitter:title"]',current.title);setMeta('meta[name="twitter:description"]',current.description);
  renderStructuredData();
}

export function updateSeoObservation(observation){latestObservation=observation||null;renderStructuredData();}
