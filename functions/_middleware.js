const OBSERVATION_URL='https://fonta-meteo.marcelfonta.workers.dev/';
const BASE_URL='https://meteo.fontanillas.cat/';

const finite=value=>Number.isFinite(Number(value))?Number(value):null;
const format=(value,digits=1)=>finite(value)===null?'—':finite(value).toLocaleString('ca-ES',{minimumFractionDigits:digits,maximumFractionDigits:digits});
const escapeHtml=value=>String(value??'').replace(/[&<>"]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character]));

export function normalizeObservation(payload){
  const temperature=finite(payload?.temperature);
  if(temperature===null)return null;
  return {
    updated:String(payload?.updatedUtc||payload?.updated||new Date().toISOString()),temperature,
    feelsLike:finite(payload?.feelsLike),humidity:finite(payload?.humidity),dewPoint:finite(payload?.dewPoint),
    pressure:finite(payload?.pressure),windSpeed:finite(payload?.windSpeed),windGust:finite(payload?.windGust),
    rainToday:finite(payload?.rainToday),rainRate:finite(payload?.rainRate),stale:Boolean(payload?.stale),degraded:Boolean(payload?.degraded)
  };
}

export function initialCondition(observation){
  if(observation.stale)return 'Darrera lectura disponible';
  if((observation.rainRate??0)>0)return 'Pluja detectada a l’estació';
  if((observation.windGust??0)>=40)return 'Ratxes fortes a l’estació';
  return 'Observació en directe';
}

export function initialSchema(observation){
  const property=(name,value,unit)=>({'@type':'PropertyValue',name,value,...(unit?{unitText:unit}:{})});
  const values=[property('Temperatura',observation.temperature,'°C')];
  if(observation.humidity!==null)values.push(property('Humitat relativa',observation.humidity,'%'));
  if(observation.pressure!==null)values.push(property('Pressió atmosfèrica',observation.pressure,'hPa'));
  if(observation.windSpeed!==null)values.push(property('Velocitat del vent',observation.windSpeed,'km/h'));
  if(observation.rainToday!==null)values.push(property('Precipitació acumulada avui',observation.rainToday,'mm'));
  return {'@context':'https://schema.org','@graph':[
    {'@type':'WebSite','@id':`${BASE_URL}#website`,name:'Observatori Meteorològic Fontanillas',url:BASE_URL,inLanguage:'ca',description:'Dades meteorològiques en directe, avisos, predicció i radar des de Sant Celoni, als peus del Montseny.'},
    {'@type':'WebPage','@id':`${BASE_URL}#webpage`,url:BASE_URL,name:'Observatori Meteorològic Fontanillas · Temps a Sant Celoni',description:'Dades meteorològiques en directe, avisos, predicció i radar des de Sant Celoni, als peus del Montseny.',inLanguage:'ca',isPartOf:{'@id':`${BASE_URL}#website`},about:{'@id':`${BASE_URL}#dataset`}},
    {'@type':'Dataset','@id':`${BASE_URL}#dataset`,name:'Observacions meteorològiques de l’estació Fontanillas',description:'Sèries meteorològiques locals de temperatura, humitat, pressió, vent, precipitació, radiació solar i índex UV.',url:BASE_URL,inLanguage:'ca',spatialCoverage:{'@type':'Place',name:'Sant Celoni, Vallès Oriental',geo:{'@type':'GeoCoordinates',latitude:41.6906,longitude:2.489}},temporalCoverage:'2025/..',measurementTechnique:'Estació meteorològica automàtica',variableMeasured:['Temperatura','Humitat relativa','Pressió atmosfèrica','Velocitat i ratxa del vent','Precipitació','Radiació solar','Índex UV']},
    {'@type':'BreadcrumbList','@id':`${BASE_URL}#breadcrumb`,itemListElement:[{'@type':'ListItem',position:1,name:'Inici',item:BASE_URL}]},
    {'@type':'Observation','@id':`${BASE_URL}#latest-observation`,name:'Darrera observació meteorològica de Fontanillas',observationDate:observation.updated,measuredProperty:values,about:{'@id':`${BASE_URL}#dataset`},spatialCoverage:{'@type':'Place',name:'Sant Celoni'}}
  ]};
}

async function fetchObservation(){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),1400);
  try{
    const response=await fetch(OBSERVATION_URL,{headers:{Accept:'application/json'},signal:controller.signal,cf:{cacheEverything:true,cacheTtl:120}});
    if(!response.ok)return null;
    return normalizeObservation(await response.json());
  }catch{return null;}finally{clearTimeout(timeout);}
}

class TextHandler{constructor(value){this.value=value;}element(element){element.setInnerContent(String(this.value));}}
class SchemaHandler{constructor(value){this.value=value;}element(element){element.setInnerContent(JSON.stringify(this.value));}}
class NoscriptHandler{
  constructor(observation){this.observation=observation;}
  element(element){
    const o=this.observation;
    element.setInnerContent(`<h1>Meteo Fontanillas · Sant Celoni</h1><p><strong>${escapeHtml(format(o.temperature))} °C</strong> · humitat ${escapeHtml(format(o.humidity,0))}% · vent ${escapeHtml(format(o.windSpeed))} km/h · pluja avui ${escapeHtml(format(o.rainToday))} mm.</p><p>Darrera observació: ${escapeHtml(o.updated)}. Dades de l’estació Fontanillas.</p><p><a href="https://www.meteo.cat/prediccio/municipal/082021">Predicció oficial de Meteocat</a> · <a href="https://www.aemet.es/ca/eltiempo/prediccion/municipios/sant-celoni-id08202">Predicció d’AEMET</a></p>`,{html:true});
  }
}

export async function onRequest(context){
  const accepts=context.request.headers.get('Accept')||'';
  const url=new URL(context.request.url);
  if(context.request.method!=='GET'||(url.pathname!=='/'&&url.pathname!=='/index.html')||!accepts.includes('text/html'))return context.next();
  const [response,observation]=await Promise.all([context.next(),fetchObservation()]);
  if(!observation||!response.headers.get('Content-Type')?.includes('text/html'))return response;
  const time=new Date(observation.updated);
  const localTime=Number.isFinite(time.getTime())?time.toLocaleTimeString('ca-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit'}):'—';
  const rewriter=new HTMLRewriter()
    .on('#temperature',new TextHandler(format(observation.temperature)))
    .on('#humidity',new TextHandler(format(observation.humidity,0)))
    .on('#dew-point',new TextHandler(`${format(observation.dewPoint)} °C`))
    .on('#wind-speed',new TextHandler(format(observation.windSpeed)))
    .on('#wind-gust',new TextHandler(`${format(observation.windGust)} km/h`))
    .on('#pressure',new TextHandler(format(observation.pressure,0)))
    .on('#rain-today',new TextHandler(format(observation.rainToday)))
    .on('#condition-label',new TextHandler(initialCondition(observation)))
    .on('#updated-relative',new TextHandler(observation.stale?'darrera lectura':'fa menys de 5 min'))
    .on('#updated-time',new TextHandler(localTime))
    .on('#connection-label',new TextHandler(observation.stale?'Dades desades':'En directe'))
    .on('#seo-structured-data',new SchemaHandler(initialSchema(observation)))
    .on('.noscript-weather',new NoscriptHandler(observation));
  const transformed=rewriter.transform(response);
  const headers=new Headers(transformed.headers);headers.set('X-Observatori-Initial-Data','live');
  return new Response(transformed.body,{status:transformed.status,statusText:transformed.statusText,headers});
}
