import { finiteNumber as finite } from '../src/core/numeric.js';
import { PORTAL_PAGES } from '../src/core/portal-routes.js';
import { buildSeoStructuredGraph, seoPagePresentation, seoPageUrl, SEO_LANGUAGE_META } from '../src/features/seo.js';
import { SUPPORTED_LANGUAGES } from '../src/core/i18n.js';
import {editorialStoryById} from '../src/data/editorial-stories.js';
import {monthlySummaryById} from '../src/data/monthly-summaries.js';

const OBSERVATION_URL='https://fonta-meteo.marcelfonta.workers.dev/';
const BASE_URL='https://meteo.fontanillas.cat/';
const PAGE_SET=new Set(PORTAL_PAGES);
const STATIC_PRETTY_PATHS=new Set([
  '/metodologia','/comparativa','/municipis','/historial-avisos','/privacitat',
  '/condicions','/xarxes','/colaboracions','/administracio','/fonta',
  '/models','/models-franca','/docs/stellarium-licenses',
  '/aula/analisi-aiguat-4-octubre-2026','/aula/analisi-aiguat-4-octubre-2026-solucions',
  '/aula/analisi-aiguat-4-octubre-2026/solucions'
]);

const format=(value,digits=1)=>finite(value)===null?'—':finite(value).toLocaleString('ca-ES',{minimumFractionDigits:digits,maximumFractionDigits:digits});
const escapeHtml=value=>String(value??'').replace(/[&<>"]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character]));

export function normalizeObservation(payload, now = new Date()){
  const temperature=finite(payload?.temperature);
  if(temperature===null)return null;
  const updated=payload?.updatedUtc||payload?.updated;
  // An unzoned local timestamp cannot identify an instant at the autumn DST fold.
  if(typeof updated!=='string'||!/(?:Z|[+-]\d{2}:\d{2})$/.test(updated))return null;
  const epoch=Date.parse(updated);
  const age=now.getTime()-epoch;
  if(!Number.isFinite(epoch)||!Number.isFinite(age)||age < -5*60*1000)return null;
  return {
    updated,temperature,
    feelsLike:finite(payload?.feelsLike),humidity:finite(payload?.humidity),dewPoint:finite(payload?.dewPoint),
    pressure:finite(payload?.pressure),windSpeed:finite(payload?.windSpeed),windGust:finite(payload?.windGust),
    rainToday:finite(payload?.rainToday),rainRate:finite(payload?.rainRate),stale:Boolean(payload?.stale)||age>=5*60*1000,degraded:Boolean(payload?.degraded)
  };
}

export function initialCondition(observation){
  if(observation.stale)return 'Darrera lectura disponible';
  if((observation.rainRate??0)>0)return 'Pluja detectada a l’estació';
  if((observation.windGust??0)>=40)return 'Ratxes fortes a l’estació';
  return 'Observació en directe';
}

export function initialSchema(observation){
  return buildSeoStructuredGraph('inici',observation,'ca');
}

export function portalRouteFromPath(pathname='/'){
  const normalized=String(pathname||'/').replace(/\/+$/,'')||'/';
  if(normalized==='/'||normalized==='/index.html')return {page:'inici'};
  const storyId=decodeURIComponent(normalized.match(/^\/histories\/([^/]+)$/)?.[1]||'');
  if(storyId&&editorialStoryById(storyId))return {page:'histories',storyId};
  const summaryId=decodeURIComponent(normalized.match(/^\/resums\/([^/]+)$/)?.[1]||'');
  if(summaryId&&monthlySummaryById(summaryId))return {page:'resums',summaryId};
  const page=decodeURIComponent(normalized.slice(1));
  return PAGE_SET.has(page)?{page}:null;
}
export function portalPageFromPath(pathname='/'){return portalRouteFromPath(pathname)?.page||null;}

export function routeSeo(page='inici',lang='ca',context={}){
  const safePage=PAGE_SET.has(page)?page:'inici';
  const safeLanguage=safePage==='canvi-climatic'?'ca':SUPPORTED_LANGUAGES.includes(lang)?lang:'ca';
  const presentation=seoPagePresentation(safePage,safeLanguage,context);
  return {...presentation,page:safePage,lang:safeLanguage,locale:SEO_LANGUAGE_META[safeLanguage].locale,url:seoPageUrl(safePage,safeLanguage,context),schema:buildSeoStructuredGraph(safePage,null,safeLanguage,context),context};
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
class AttributeHandler{constructor(name,value){this.name=name;this.value=value;}element(element){element.setAttribute(this.name,String(this.value));}}
class RemoveHandler{element(element){element.remove();}}
class DocumentHandler{constructor(page,lang){this.page=page;this.lang=lang;}element(element){element.setAttribute('lang',this.lang);element.setAttribute('data-portal-page',this.page);}}
class NoscriptHandler{
  constructor(observation){this.observation=observation;}
  element(element){
    const o=this.observation;
    element.setInnerContent(`<h1>Meteo Fontanillas · Sant Celoni</h1><p><strong>${escapeHtml(format(o.temperature))} °C</strong> · humitat ${escapeHtml(format(o.humidity,0))}% · vent ${escapeHtml(format(o.windSpeed))} km/h · pluja avui ${escapeHtml(format(o.rainToday))} mm.</p><p>Darrera observació: ${escapeHtml(o.updated)}. Dades de l’estació Fontanillas.</p><p><a href="https://www.meteo.cat/prediccio/municipal/082021">Predicció oficial de Meteocat</a> · <a href="https://www.aemet.es/ca/eltiempo/prediccion/municipios/sant-celoni-id08202">Predicció d’AEMET</a></p>`,{html:true});
  }
}

class RouteNoscriptHandler{
  constructor(meta){this.meta=meta;}
  element(element){
    element.setInnerContent(`<h1>${escapeHtml(this.meta.title)}</h1><p>${escapeHtml(this.meta.description)}</p><p>El visor interactiu necessita JavaScript. Pots consultar igualment la <a href="https://www.meteo.cat/prediccio/municipal/082021">predicció oficial de Meteocat</a>, els <a href="https://www.meteo.cat/prediccio/general/">avisos oficials</a> i la <a href="${escapeHtml(BASE_URL)}">portada de l’Observatori</a>.</p>`,{html:true});
  }
}

function routeRewriter(meta){
  let rewriter=new HTMLRewriter()
    .on('html',new DocumentHandler(meta.page,meta.lang))
    .on('title',new TextHandler(meta.title))
    .on('meta[name="description"]',new AttributeHandler('content',meta.description))
    .on('meta[property="og:locale"]',new AttributeHandler('content',meta.locale))
    .on('meta[property="og:title"]',new AttributeHandler('content',meta.title))
    .on('meta[property="og:description"]',new AttributeHandler('content',meta.description))
    .on('meta[property="og:url"]',new AttributeHandler('content',meta.url))
    .on('meta[property="og:type"]',new AttributeHandler('content',meta.type))
    .on('meta[property="og:image"]',new AttributeHandler('content',meta.image))
    .on('meta[property="og:image:alt"]',new AttributeHandler('content',meta.title))
    .on('meta[name="twitter:title"]',new AttributeHandler('content',meta.title))
    .on('meta[name="twitter:description"]',new AttributeHandler('content',meta.description))
    .on('meta[name="twitter:image"]',new AttributeHandler('content',meta.image))
    .on('meta[name="twitter:image:alt"]',new AttributeHandler('content',meta.title))
    .on('link[rel="canonical"]',new AttributeHandler('href',meta.url))
    .on('#seo-structured-data',new SchemaHandler(meta.schema))
    .on('.noscript-weather',new RouteNoscriptHandler(meta));
  if(meta.story||meta.summary||meta.page==='canvi-climatic')return rewriter.on('link[rel="alternate"]',new RemoveHandler());
  for(const language of SUPPORTED_LANGUAGES)rewriter=rewriter.on(`link[rel="alternate"][hreflang="${language}"]`,new AttributeHandler('href',seoPageUrl(meta.page,language,meta.context)));
  return rewriter.on('link[rel="alternate"][hreflang="x-default"]',new AttributeHandler('href',seoPageUrl(meta.page,'ca',meta.context)));
}

export async function onRequest(context){
  const accepts=context.request.headers.get('Accept')||'';
  const url=new URL(context.request.url);
  if((context.request.method==='GET'||context.request.method==='HEAD')&&/^(?:\/src\/|\/js\/|\/modules\/|\/css\/|\/(?:service-worker|OneSignalSDKWorker)\.js$)/.test(url.pathname)){
    const response=await context.next();
    if(!response.ok)return response;
    const headers=new Headers(response.headers);
    headers.set('Cache-Control','no-cache, must-revalidate');
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
  }
  const route=portalRouteFromPath(url.pathname);const page=route?.page;
  if(!route&&/^\/(?:histories|resums)\//.test(url.pathname))return new Response('Pàgina no trobada',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8','X-Robots-Tag':'noindex'}});
  if(context.request.method==='GET'&&!route&&accepts.includes('text/html')&&!STATIC_PRETTY_PATHS.has(url.pathname)&&!url.pathname.split('/').at(-1).includes('.')){
    const response=await context.next();
    if(response.status===200&&response.headers.get('Content-Type')?.includes('text/html'))return new Response('Pàgina no trobada',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8','X-Robots-Tag':'noindex'}});
    return response;
  }
  if(context.request.method!=='GET'||!page||!accepts.includes('text/html'))return context.next();
  const requestedLanguage=SUPPORTED_LANGUAGES.includes(url.searchParams.get('lang'))?url.searchParams.get('lang'):'ca';
  const lang=route.storyId||route.summaryId||page==='canvi-climatic'?'ca':requestedLanguage;
  const [response,observation]=await Promise.all([context.next(),page==='inici'?fetchObservation():Promise.resolve(null)]);
  if(!response.headers.get('Content-Type')?.includes('text/html'))return response;
  const meta=routeSeo(page,lang,route);
  let rewriter=routeRewriter(meta);
  if(!observation){
    const transformed=rewriter.transform(response);const headers=new Headers(transformed.headers);headers.set('X-Observatori-Route',page);
    return new Response(transformed.body,{status:transformed.status,statusText:transformed.statusText,headers});
  }
  const time=new Date(observation.updated);
  const localTime=Number.isFinite(time.getTime())?time.toLocaleTimeString('ca-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit'}):'—';
  rewriter=rewriter
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
    .on('#seo-structured-data',new SchemaHandler(buildSeoStructuredGraph(page,observation,lang,route)))
    .on('.noscript-weather',new NoscriptHandler(observation));
  const transformed=rewriter.transform(response);
  const headers=new Headers(transformed.headers);headers.set('X-Observatori-Initial-Data',observation.stale?'stored':'live');headers.set('X-Observatori-Route',page);
  return new Response(transformed.body,{status:transformed.status,statusText:transformed.statusText,headers});
}
