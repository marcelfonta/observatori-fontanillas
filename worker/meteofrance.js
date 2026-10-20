const PORTAL_BASE = 'https://public-api.meteofrance.fr';
const CATALOG_CACHE_SECONDS = 30 * 60;
const MAP_CACHE_SECONDS = 10 * 60;
const RETRYABLE_STATUS = new Set([429,500,502,503,504]);

export const METEOFRANCE_REUSE_POLICY = Object.freeze({
  scope:'public products only',
  license:'Licence Ouverte / Open Licence Etalab',
  source:'Météo-France',
  url:'https://donneespubliques.meteofrance.fr/?fond=dossier&id_dossier=12',
  attribution:'Informacions creades a partir de dades de Météo-France',
  rawRedistributionAllowed:false,
  note:'La reutilització amb atribució és permesa, però no la redistribució en l’estat original.',
});

export const METEOFRANCE_PRODUCTS = Object.freeze({
  arome: {
    label:'AROME directe', shortLabel:'AROME', secret:'METEOFRANCE_AROME_API_KEY',
    context:'/public/arome/1.0', protocol:'wms', service:'MF-NWP-HIGHRES-AROME-001-FRANCE-WMS',
    horizon:'0–48 h', purpose:'Detall determinista local', layers:['precipitation','temperature','wind','clouds'], access:'public',
  },
  'arome-pi': {
    label:'AROME previsió immediata', shortLabel:'AROME-PI', secret:'METEOFRANCE_AROME_NOWCAST_API_KEY',
    context:'/public/aromepi/1.0', protocol:'wms', service:'MF-NWP-HIGHRES-AROMEPI-001-FRANCE-WMS',
    horizon:'Pròximes hores', purpose:'Evolució ràpida de la precipitació', layers:['precipitation'], access:'public',
  },
  'pe-arome': {
    label:'AROME conjunt', shortLabel:'PE-AROME', secret:'METEOFRANCE_AROME_ENSEMBLE_API_KEY',
    context:'/public/pearome/1.0', protocol:'wcs', service:'MF-NWP-HIGHRES-PEARO000-0025-FRANCE-WCS', members:25,
    horizon:'Curt termini', purpose:'25 membres per mesurar probabilitat i incertesa local', layers:[], access:'public',
  },
  arpege: {
    label:'ARPEGE directe', shortLabel:'ARPEGE', secret:'METEOFRANCE_ARPEGE_API_KEY',
    context:'/public/arpege/1.0', protocol:'wms', service:'MF-NWP-GLOBAL-ARPEGE-01-EUROPE-WMS',
    horizon:'Mitjà termini', purpose:'Context sinòptic i continuïtat', layers:['precipitation','temperature','wind','clouds'], access:'public',
  },
  'pe-arpege': {
    label:'ARPEGE conjunt', shortLabel:'PE-ARPEGE', secret:'METEOFRANCE_ARPEGE_ENSEMBLE_API_KEY',
    context:'/public/pearpege/1.0', protocol:'wcs', service:'MF-NWP-GLOBAL-PEARP000-01-EUROPE-WCS', members:35,
    horizon:'Mitjà termini', purpose:'35 membres per mesurar dispersió i confiança', layers:[], access:'public',
  },
  piaf: {
    label:'PIAF', shortLabel:'PIAF', secret:'METEOFRANCE_PIAF_API_KEY',
    context:'/pro/piaf/1.0', protocol:'wms', service:'MF-NWP-HIGHRES-PIAF-001-FRANCE-WMS',
    horizon:'0–3 h', purpose:'Precipitació immediata', layers:['precipitation'], experimental:true, access:'professional',
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

export function expandCapabilityTimes(values,maxItems=192){
  const result=[];
  const add=value=>{const date=new Date(value);if(Number.isFinite(date.getTime()))result.push(date.toISOString());};
  for(const raw of values){
    const value=String(raw||'').trim();
    const [startText,endText,stepText]=value.split('/');
    if(!endText||!stepText){add(startText);continue;}
    const start=new Date(startText);const end=new Date(endText);
    const match=String(stepText).match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/i);
    const step=((Number(match?.[1])||0)*60+(Number(match?.[2])||0))*60_000;
    if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||!step){add(startText);continue;}
    for(let instant=start.getTime();instant<=end.getTime()&&result.length<maxItems;instant+=step)add(instant);
  }
  return [...new Set(result)].sort().slice(-maxItems);
}

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
  return { layers:names, coverages, times:expandCapabilityTimes(times) };
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
  let response;
  for(let attempt=0;attempt<3;attempt+=1){
    response=await fetch(request.clone());
    if(!RETRYABLE_STATUS.has(response.status)||attempt===2)break;
    await new Promise(resolve=>setTimeout(resolve,150*(attempt+1)));
  }
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
    configured,available,experimental:Boolean(product.experimental),protocol:product.protocol,access:product.access,
    reuseStatus:product.access==='public'?'open-license-with-attribution':'terms-must-be-confirmed',
    visualizable:product.protocol==='wms',members:product.members||null,layers:product.layers,
    layerAvailability,steps:parsed?.times?.length||null,coverages:parsed?.coverages?.length||null,
    times:product.protocol==='wms'?(parsed?.times||[]):[],
    status:available?'available':configured?'temporarily-unavailable':'not-configured',
    note:error||null,
  };
}

export function numericIngestionDecision(productId,env={}){
  const product=METEOFRANCE_PRODUCTS[productId];
  if(!product)return {allowed:false,reason:'unknown-product'};
  if(product.protocol!=='wcs')return {allowed:false,reason:'not-numeric-wcs'};
  const approved=new Set(String(env.METEOFRANCE_NUMERIC_REUSE_APPROVED_PRODUCTS||'').split(',').map(value=>value.trim()).filter(Boolean));
  if(!approved.has(productId))return {allowed:false,reason:'reuse-not-approved'};
  if(!keyFor(env,product))return {allowed:false,reason:'credential-not-configured'};
  return {allowed:true,reason:'approved-private-pilot'};
}

async function validateWmsImage(product,key,parsed){
  const semantic=product.layers.find(item=>chooseLayer(parsed.layers,item));
  const layer=semantic?chooseLayer(parsed.layers,semantic):null;
  if(!layer)return {ok:false,semantic:null,bytes:0,reason:'no-compatible-layer'};
  const request=new Request(buildMapUrl(product,layer,320,220,parsed.times.at(-1)||''),{headers:{Accept:'image/png,*/*',apikey:key}});
  const response=await cachedFetch(request,MAP_CACHE_SECONDS);
  if(!response.ok)return {ok:false,semantic,bytes:0,reason:`http-${response.status}`};
  const type=response.headers.get('content-type')||'';const bytes=(await response.arrayBuffer()).byteLength;
  return {ok:/^image\/png/i.test(type)&&bytes>=250,semantic,bytes,reason:/^image\/png/i.test(type)&&bytes>=250?null:'invalid-image'};
}

export async function inspectMeteofranceProducts(env,{probeMaps=false}={}){
  const checkedAt=new Date().toISOString();
  const products=await Promise.all(Object.entries(METEOFRANCE_PRODUCTS).map(async ([id,product])=>{
    const key=keyFor(env,product);
    if(!key)return {...publicProduct(id,product,false,false,null,'Credencial pendent de configurar al Worker.'),mapProbe:null,numericIngestion:numericIngestionDecision(id,env)};
    try{
      const parsed=await capabilities(product,key);
      const mapProbe=probeMaps&&product.protocol==='wms'?await validateWmsImage(product,key,parsed):null;
      return {...publicProduct(id,product,true,true,parsed,null),mapProbe,numericIngestion:numericIngestionDecision(id,env)};
    }catch(error){
      const suffix=Number.isFinite(error?.status)?` (HTTP ${error.status})`:'';
      return {...publicProduct(id,product,true,false,null,`El proveïdor no respon ara mateix${suffix}; la resta de models continuen disponibles.`),mapProbe:null,numericIngestion:numericIngestionDecision(id,env)};
    }
  }));
  return {checkedAt,products};
}

export async function meteofranceModels(env){
  const {checkedAt,products}=await inspectMeteofranceProducts(env);
  const publicProducts=products.map(({mapProbe:unusedMapProbe,numericIngestion:unusedNumericIngestion,...product})=>product);
  return payload({ok:true,source:'Météo-France',checkedAt,products:publicProducts},200,300);
}

export async function meteofranceStagingValidation(env){
  const {checkedAt,products}=await inspectMeteofranceProducts(env,{probeMaps:true});
  const configured=products.filter(item=>item.configured).length;
  const catalogs=products.filter(item=>item.available).length;
  const wms=products.filter(item=>item.protocol==='wms');
  const validMaps=wms.filter(item=>item.mapProbe?.ok).length;
  const numericEligible=products.filter(item=>item.available&&item.numericIngestion?.allowed).map(item=>item.id);
  return payload({ok:true,mode:'private-staging-validation',checkedAt,summary:{products:products.length,configured,catalogs,wmsMaps:`${validMaps}/${wms.length}`,numericEligible},reusePolicy:METEOFRANCE_REUSE_POLICY,products},200,0);
}

export function buildMapUrl(product,layer,width=1200,height=700,time=''){
  if(product.protocol!=='wms')throw new Error('Aquest producte no ofereix WMS.');
  const params=new URLSearchParams({
    service:'WMS',version:'1.3.0',request:'GetMap',layers:layer,styles:'',
    crs:'EPSG:4326',format:'image/png',transparent:'true',
    // WMS 1.3.0 + EPSG:4326 utilitza ordre latitud,longitud.
    bbox:'40.4,0.0,43.6,4.5',width:String(width),height:String(height),language:'eng',
  });
  // El catàleg es normalitza amb Date#toISOString (inclou `.000Z`), però el
  // WMS de Météo-France només accepta la representació ISO sense mil·lisegons.
  if(time)params.set('time',String(time).split('/')[0].replace(/\.000Z$/,'Z'));
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
    const requestedTime=String(url.searchParams.get('time')||'');
    const time=requestedTime&&parsed.times.includes(requestedTime)?requestedTime:'';
    if(requestedTime&&!time)return payload({error:'Instant temporal no disponible per a aquesta edició.'},400,60);
    // Sense `time`, el WMS aplica l'instant per defecte de l'edició activa.
    const upstream=new Request(buildMapUrl(product,layer,width,height,time),{headers:{Accept:'image/png,*/*',apikey:key}});
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
