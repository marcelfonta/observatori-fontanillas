const base=String(process.env.SEO_BASE_URL||'https://meteo.fontanillas.cat').replace(/\/$/,'');
const routes=[
  ['/',/Observatori Meteorològic Fontanillas/,'inici','WebPage'],
  ['/prediccio',/Predicció del temps a Sant Celoni/,'prediccio','WebPage'],
  ['/avisos',/Avisos meteorològics per a Sant Celoni/,'avisos','WebPage'],
  ['/centre-dades',/Dades meteorològiques històriques de Sant Celoni/,'centre-dades','Dataset'],
  ['/histories/aiguat-4-octubre-2026',/82,6 mm/,'histories','Article'],
  ['/resums/2026-09',/Setembre de 2026/,'resums','Report']
];

const canonicalUrl=html=>{
  const tag=html.match(/<link[^>]*rel="canonical"[^>]*>/i)?.[0]||'';
  return tag.match(/\bhref="([^"]+)"/i)?.[1]||'';
};
for(const [path,titlePattern,page,schemaType] of routes){
  const response=await fetch(base+path,{headers:{Accept:'text/html'}});
  const html=await response.text();
  if(!response.ok)throw new Error(`${path}: HTTP ${response.status}`);
  if(response.headers.get('x-observatori-route')!==page)throw new Error(`${path}: falta X-Observatori-Route=${page}`);
  const title=html.match(/<title>([^<]+)<\/title>/i)?.[1]||'';
  if(!titlePattern.test(title))throw new Error(`${path}: títol inicial incorrecte: ${title}`);
  const canonical=canonicalUrl(html);
  if(canonical!==base+path)throw new Error(`${path}: canonical incorrecta: ${canonical}`);
  const schemaText=html.match(/<script[^>]*id="seo-structured-data"[^>]*>([\s\S]*?)<\/script>/i)?.[1];
  const graph=JSON.parse(schemaText||'{}')['@graph']||[];
  if(!graph.some(item=>item['@type']===schemaType))throw new Error(`${path}: falta ${schemaType} al JSON-LD`);
  console.log(`✓ ${path} · ${title}`);
}

const missing=await fetch(`${base}/resums/no-existeix`,{headers:{Accept:'text/html'}});
if(missing.status!==404||missing.headers.get('x-robots-tag')!=='noindex')throw new Error('Les rutes editorials inexistents no retornen 404 noindex');
console.log('✓ 404 editorial no indexable');
