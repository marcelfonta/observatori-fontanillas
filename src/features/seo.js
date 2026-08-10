const BASE='https://meteo.fontanillas.cat/';
const PAGES={
  inici:{title:'Observatori Meteorològic Fontanillas · Temps a Sant Celoni',description:'Dades meteorològiques en directe, avisos, predicció i radar des de Sant Celoni, als peus del Montseny.'},
  'meteo-ia':{title:'Meteo IA · Pregunta pel temps',description:'Assistent meteorològic amb fonts visibles per consultar Sant Celoni, altres poblacions, dates i activitats.'},
  estacio:{title:'Estació Fontanillas · Dades meteorològiques en directe',description:'Temperatura, humitat, vent, pressió, pluja, radiació i índex UV mesurats a Sant Celoni.'},
  prediccio:{title:'Predicció del temps a Sant Celoni · 7 dies i tendència',description:'Previsió horària i diària, comparació de models i tendència ECMWF fins a sis setmanes per a Sant Celoni.'},
  cel:{title:'Sol, Lluna i astronomia a Sant Celoni',description:'Sortida i posta del Sol, fases de la Lluna, estacions i esdeveniments del cel visibles des del Baix Montseny.'},
  avisos:{title:'Avisos meteorològics per a Sant Celoni',description:'Avisos oficials de Meteocat i AEMET per al Vallès Oriental i el Prelitoral de Barcelona.'},
  radar:{title:'Radar meteorològic i llamps a Catalunya',description:'Radar de precipitació i activitat elèctrica centrats a Sant Celoni i el Baix Montseny.'},
  webcams:{title:'Webcams de Sant Celoni i el Montseny',description:'Vista actual de la webcam Fontanillas i selecció de webcams properes al Montseny.'},
  'centre-dades':{title:'Dades meteorològiques històriques de Sant Celoni',description:'Històric, pluja, extrems, cobertura i descàrregues de l’estació Fontanillas a Sant Celoni.'},
  'medi-ambient':{title:'Qualitat de l’aire i medi ambient a Sant Celoni',description:'Qualitat de l’aire, UV, pol·len, risc d’incendi, sequera i meduses amb fonts identificades.'},
  contacte:{title:'Contacte · Observatori Fontanillas',description:'Contacta amb l’Observatori Meteorològic Fontanillas per consultes, incidències de dades o propostes.'}
};

function setMeta(selector,value){const node=document.querySelector(selector);if(node)node.setAttribute('content',value);}

export function updateSeoMetadata(page='inici'){
  const current=PAGES[page]||PAGES.inici;
  const url=page==='inici'?BASE:`${BASE}?page=${encodeURIComponent(page)}`;
  document.title=current.title;
  document.querySelector('link[rel="canonical"]')?.setAttribute('href',url);
  setMeta('meta[name="description"]',current.description);
  setMeta('meta[property="og:title"]',current.title);setMeta('meta[property="og:description"]',current.description);setMeta('meta[property="og:url"]',url);
  setMeta('meta[name="twitter:title"]',current.title);setMeta('meta[name="twitter:description"]',current.description);
  const schema=document.getElementById('seo-structured-data');if(!schema)return;
  schema.textContent=JSON.stringify({
    '@context':'https://schema.org','@graph':[
      {'@type':'WebSite','@id':`${BASE}#website`,name:'Observatori Meteorològic Fontanillas',url:BASE,inLanguage:'ca',description:PAGES.inici.description},
      {'@type':'WebPage','@id':`${url}#webpage`,url,name:current.title,description:current.description,inLanguage:'ca',isPartOf:{'@id':`${BASE}#website`},about:{'@id':`${BASE}#dataset`}},
      {'@type':'Dataset','@id':`${BASE}#dataset`,name:'Observacions meteorològiques de l’estació Fontanillas',description:'Sèries meteorològiques locals de temperatura, humitat, pressió, vent, precipitació, radiació solar i índex UV.',url:`${BASE}?page=centre-dades`,inLanguage:'ca',spatialCoverage:{'@type':'Place',name:'Sant Celoni, Vallès Oriental',geo:{'@type':'GeoCoordinates',latitude:41.6906,longitude:2.489}},temporalCoverage:'2025/..',measurementTechnique:'Estació meteorològica automàtica',variableMeasured:['Temperatura','Humitat relativa','Pressió atmosfèrica','Velocitat i ratxa del vent','Precipitació','Radiació solar','Índex UV']},
      {'@type':'BreadcrumbList','@id':`${url}#breadcrumb`,itemListElement:page==='inici'?[{'@type':'ListItem',position:1,name:'Inici',item:BASE}]:[{'@type':'ListItem',position:1,name:'Inici',item:BASE},{'@type':'ListItem',position:2,name:current.title,item:url}]}
    ]
  });
}
