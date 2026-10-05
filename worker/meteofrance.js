const PORTAL_BASE = 'https://public-api.meteofrance.fr';
const CATALOG_CACHE_SECONDS = 30 * 60;
const MAP_CACHE_SECONDS = 10 * 60;

export const METEOFRANCE_PRODUCTS = Object.freeze({
  arome: {
    label:'AROME directe', shortLabel:'AROME', secret:'METEOFRANCE_AROME_API_KEY',
    context:'/public/arome/1.0', protocol:'wms', service:'MF-NWP-HIGHRES-AROME-001-FRANCE-WMS',
    horizon:'0–48 h', purpose:'Detall determinista local', layers:['precipitation','temperature','wind','clouds'],
  },
  'arome-pi': {
    label:'AROME previsió immediata', shortLabel:'AROME-PI', secret:'METEOFRANCE_AROME_NOWCAST_API_KEY',
    context:'/public/aromepi/1.0', protocol:'wms', service:'MF-NWP-HIGHRES-AROMEPI-001-FRANCE-WMS',
    horizon:'Pròximes hores', purpose:'Evolució ràpida de la precipitació', layers:['precipitation'],
  },
  'pe-arome': {
    label:'AROME conjunt', shortLabel:'PE-AROME', secret:'METEOFRANCE_AROME_ENSEMBLE_API_KEY',
    context:'/public/pearome/1.0', protocol:'wcs', service:'MF-NWP-HIGHRES-PEARO000-0025-FRANCE-WCS', members:25,
    horizon:'Curt termini', purpose:'25 membres per mesurar probabilitat i incertesa local', layers:[],
  },
  arpege: {
    label:'ARPEGE directe', shortLabel:'ARPEGE', secret:'METEOFRANCE_ARPEGE_API_KEY',
    context:'/public/arpege/1.0', protocol:'wms', service:'MF-NWP-GLOBAL-ARPEGE-01-EUROPE-WMS',
    horizon:'Mitjà termini', purpose:'Context sinòptic i continuïtat', layers:['precipitation','temperature','wind','clouds'],
  },
  'pe-arpege': {
    label:'ARPEGE conjunt', shortLabel:'PE-ARPEGE', secret:'METEOFRANCE_ARPEGE_ENSEMBLE_API_KEY',
    context:'/public/pearpege/1.0', protocol:'wcs', service:'MF-NWP-GLOBAL-PEARP000-01-EUROPE-WCS', members:35,
    horizon:'Mitjà termini', purpose:'35 membres per mesurar dispersió i confiança', layers:[],
  },
  piaf: {
    label:'PIAF', shortLabel:'PIAF', secret:'METEOFRANCE_PIAF_API_KEY',
    context:'/pro/piaf/1.0', protocol:'wms', service:'MF-NWP-HIGHRES-PIAF-001-FRANCE-WMS',
    horizon:'0–3 h', purpose:'Precipitació immediata', layers:['precipitation'], experimental:true,
  },
});

const LAYER_PATTERNS = Object.freeze({
  precipitation:[/TOTAL_PRECIPITATION/i,/PRECIPITATION_RATE/i,/RAIN.?FALL_RATE/i,/PRECIPITATION/i,/RAIN/i,/REFLECTIVITY/i],
  temperature:[/TEMPERATURE__SPECIFIC_HEIGHT/i,/TEMPERATURE__GROUND/i,/TEMPERATURE/i],
  wind:[/WIND_SPEED_GUST/i,/WIND_SPEED__SPECIFIC_HEIGHT/i,/WIND_SPEED/i,/WIND__/i],
  clouds:[/TOTAL_CLOUD_COVER/i,/CLOUD_COVER/i,/CLOUD/i],
  probability:[/PROBABILITY.*PRECIP/i,/PRECIP.*PROBABILITY/i,/PROBABILITY/i,/PERCENTILE/i,/QUANTILE/i],
});

const xmlText = value => String(value || '')
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')
  .replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();

export function parseCapabilities(xml) {
  const names=[];
  for(const match of String(xml||'').matchAll(/<(?:\w+:)?Name>([^<]+)<\/(?:\w+:)?Name>/gi)){
    const name=xmlText(match[1]);
    if(name&&!names.includes(name)&&!/^WMS$/i.test(name))names.push(name);
  }
  const times=[];
  for(const match of String(xml||'').matchAll(/<(?:\w+:)?(?:Dimension|Extent)\b[^>]*\bname=["']time["'][^>]*>([^<]+)</gi)){
    for(const value of xmlText(match[1]).split(','))if(value&&!times.includes(value))times.push(value);
  }
  const coverages=[];
  for(const match of String(xml||'').matchAll(/<(?:\w+:)?CoverageId>([^<]+)<\/(?:\w+:)?CoverageId>/gi)){
    const coverage=xmlText(match[1]);
    if(coverage&&!coverages.includes(coverage))coverages.push(coverage);
  }
  return { layers:names, coverages, times:times.slice(-192) };
}

export function chooseLayer(layers, semantic) {
  const candidates=Array.isArray(layers)?layers:[];
  for(const pattern of LAYER_PATTERNS[semantic]||[]){
    const match=candidates.find(name=>pattern.test(name));
    if(match)return match;
  }
  return null;
}

function keyFor(env, product){return String(env?.[product.secret]||'').trim();}
function capabilitiesUrl(product){
  const protocol=product.protocol==='wcs'?'wcs':'wms';
  const params=new URLSearchParams({service:protocol.toUpperCase(),version:protocol==='wcs'?'2.0.1':'1.3.0',language:'eng'});
  return `${PORTAL_BASE}${product.context}/${protocol}/${product.service}/GetCapabilities?${params}`;
}

function safeHeaders(contentType='application/json;charset=UTF-8',maxAge=0){
  return {
    'Content-Type':contentType,
    'Cache-Control':maxAge?`public, max-age=${maxAge}, s-maxage=${maxAge}`:'no-store',
    'Access-Control-Allow-Origin':'*',
    'X-Content-Type-Options':'nosniff',
  };
}

function payload(data,status=200,maxAge=0){
  return new Response(JSON.stringify(data),{status,headers:safeHeaders('application/json;charset=UTF-8',maxAge)});
}

async function cachedFetch(request,ttl,cacheKeyUrl=request.url){
  const cache=typeof caches!=='undefined'?caches.default:null;
  // La clau pública de memòria cau mai no conté la capçalera privada `apikey`.
  const cacheKey=new Request(cacheKeyUrl,{method:'GET'});
  const cached=cache?await cache.match(cacheKey):null;
  if(cached)return cached;
  const response=await fetch(request);
  if(response.ok&&cache){
    const stored=new Response(response.body,{status:response.status,statusText:response.statusText,headers:response.headers});
    stored.headers.set('Cache-Control',`public, max-age=${ttl}`);
    await cache.put(cacheKey,stored.clone());
    return stored;
  }
  return response;
}

async function capabilities(product,key){
  const upstream=new Request(capabilitiesUrl(product),{headers:{Accept:'application/xml,text/xml,*/*',apikey:key}});
  const response=await cachedFetch(upstream,CATALOG_CACHE_SECONDS);
  if(!response.ok)throw Object.assign(new Error(`Météo-France ${response.status}`),{status:response.status});
  return parseCapabilities(await response.text());
}

function publicProduct(id,product,configured,available,parsed,error){
  const layerAvailability={};
  for(const semantic of product.layers)layerAvailability[semantic]=Boolean(chooseLayer(parsed?.layers,semantic));
  return {
    id,label:product.label,shortLabel:product.shortLabel,horizon:product.horizon,purpose:product.purpose,
    configured,available,experimental:Boolean(product.experimental),protocol:product.protocol,
    visualizable:product.protocol==='wms',members:product.members||null,layers:product.layers,
    layerAvailability,steps:parsed?.times?.length||null,coverages:parsed?.coverages?.length||null,
    status:available?'available':configured?'temporarily-unavailable':'not-configured',
    note:error||null,
  };
}

export async function meteofranceModels(env){
  const checkedAt=new Date().toISOString();
  const entries=await Promise.all(Object.entries(METEOFRANCE_PRODUCTS).map(async ([id,product])=>{
    const key=keyFor(env,product);
    if(!key)return publicProduct(id,product,false,false,null,'Credencial pendent de configurar al Worker.');
    try{
      const parsed=await capabilities(product,key);
      return publicProduct(id,product,true,true,parsed,null);
    }catch(error){
      const suffix=Number.isFinite(error?.status)?` (HTTP ${error.status})`:'';
      return publicProduct(id,product,true,false,null,`El proveïdor no respon ara mateix${suffix}; la resta de models continuen disponibles.`);
    }
  }));
  return payload({ok:true,source:'Météo-France',checkedAt,products:entries},200,300);
}

export function buildMapUrl(product,layer,width=1200,height=700,time=''){
  if(product.protocol!=='wms')throw new Error('Aquest producte no ofereix WMS.');
  const params=new URLSearchParams({
    service:'WMS',version:'1.3.0',request:'GetMap',layers:layer,styles:'',
    crs:'EPSG:4326',format:'image/png',transparent:'true',
    // WMS 1.3.0 + EPSG:4326 utilitza ordre latitud,longitud.
    bbox:'40.4,0.0,43.6,4.5',width:String(width),height:String(height),language:'eng',
  });
  if(time)params.set('time',String(time).split('/')[0]);
  return `${PORTAL_BASE}${product.context}/wms/${product.service}/GetMap?${params}`;
}

export async function meteofranceMap(url,env){
  const id=String(url.searchParams.get('model')||'');
  const semantic=String(url.searchParams.get('layer')||'precipitation');
  const product=METEOFRANCE_PRODUCTS[id];
  if(!product||product.protocol!=='wms'||!product.layers.includes(semantic))return payload({error:'Model o capa no admesos per al visor.'},400);
  const key=keyFor(env,product);
  if(!key)return payload({error:'Aquest model encara no està configurat al Worker.'},503);
  try{
    const parsed=await capabilities(product,key);
    const layer=chooseLayer(parsed.layers,semantic);
    if(!layer)return payload({error:'La capa demanada no està disponible en aquesta edició del model.'},404,300);
    const width=Math.min(1600,Math.max(480,Number(url.searchParams.get('width'))||1200));
    const height=Math.min(1000,Math.max(320,Number(url.searchParams.get('height'))||700));
    const upstream=new Request(buildMapUrl(product,layer,width,height,parsed.times?.[0]),{headers:{Accept:'image/png,*/*',apikey:key}});
    const response=await cachedFetch(upstream,MAP_CACHE_SECONDS);
    if(!response.ok)return payload({error:'Météo-France no ha pogut generar el mapa ara mateix.'},response.status>=500?502:response.status,120);
    const headers=safeHeaders(response.headers.get('Content-Type')||'image/png',MAP_CACHE_SECONDS);
    headers['X-Weather-Source']='Meteo-France';
    headers['Content-Disposition']='inline';
    return new Response(response.body,{status:200,headers});
  }catch{
    return payload({error:'Connexió temporalment no disponible amb Météo-France.'},502,120);
  }
}
