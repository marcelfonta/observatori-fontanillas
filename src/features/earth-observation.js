import {CONFIG} from '../core/config.js';

export const EARTH_VIEWER_LAYERS={clouds:'Núvols en color natural',airmass:'Masses d’aire',lightning:'Llamps MTG-I sobre els núvols'};
export const EARTH_VIEWER_REGIONS={catalunya:'Catalunya i entorn',mediterrani:'Mediterrani occidental',europa:'Europa'};
export const EARTH_VIEWER_BOUNDS={catalunya:[[40.2,-1.5],[43.5,5.1]],mediterrani:[[30,-12],[50,28]],europa:[[28,-25],[68,55]]};
const EARTH_VIEWER_SOURCE='https://view.eumetsat.int/';
const EARTH_WMS_SOURCE='https://view.eumetsat.int/geoserver/wms';
export const EARTH_VIEWER_DATA={
  clouds:{layers:[{name:'mtg_fd:rgb_geocolour',opacity:.82}],caption:'Meteosat-12 · GeoColour dia/nit · actualització aproximada cada 10 minuts'},
  airmass:{layers:[{name:'msg_fes:rgb_airmass',opacity:.82}],caption:'Meteosat · RGB de masses d’aire · actualització aproximada cada 15 minuts'},
  lightning:{layers:[{name:'mtg_fd:rgb_geocolour',opacity:.62},{name:'mtg_fd:li_afa',opacity:1}],caption:'Meteosat-12 + àrea acumulada de llamps MTG-I · si no hi ha senyals, no s’hi observa activitat recent'}
};

export const EARTH_OBSERVATION_LAYERS=[
  {id:'meteosat',horizon:'now',type:'observation',agency:'EUMETSAT',title:'Meteosat-12 · núvols',summary:'Imatge gairebé en temps real per seguir fronts, tempestes i l’evolució de la nuvolositat.',freshness:'Actualització aproximada cada 10 minuts · retard de processament',use:'Observa com creixen i es desplacen les masses de núvols abans de comparar-les amb el radar.',href:'https://view.eumetsat.int/',cta:'Obrir EUMETView'},
  {id:'lightning',horizon:'now',type:'observation',agency:'EUMETSAT · MTG',title:'Lightning Imager · llamps',summary:'Detecció òptica contínua de llamps totals sobre Europa i Àfrica des de Meteosat-12.',freshness:'Alta freqüència · observació satel·litària',use:'Ajuda a identificar convecció activa; no diferencia per si sola els llamps núvol-terra.',href:'https://view.eumetsat.int/',cta:'Veure capa LI'},
  {id:'radar',horizon:'now',type:'observation',agency:'Meteocat · RainViewer',title:'Radar i webcam locals',summary:'La comprovació més propera a Sant Celoni: precipitació, activitat elèctrica i imatge de la càmera.',freshness:'Minuts · fonts locals i oficials identificades',use:'Contrasta el que veu el satèl·lit amb el que realment arriba al Baix Montseny.',href:'/radar',cta:'Obrir observació local'},
  {id:'firms',horizon:'today',type:'observation',agency:'NASA FIRMS',title:'Anomalies tèrmiques VIIRS',summary:'Punts calents detectats per satèl·lit durant les últimes hores, disponibles al mapa local i mundial.',freshness:'Últimes 24–48 hores segons passada orbital',use:'Serveix per detectar anomalies; un punt FIRMS no confirma per si sol un incendi.',href:'/medi-ambient#environment-panel-firms',cta:'Veure deteccions'},
  {id:'cams',horizon:'today',type:'model',agency:'Copernicus · CAMS',title:'Fum, pols i qualitat de l’aire',summary:'Anàlisi i predicció de composició atmosfèrica que combina models i observacions de satèl·lit.',freshness:'Anàlisi i predicció · no és un sensor local',use:'Dona context territorial al PM10, PM2,5, ozó, fum i intrusions de pols.',href:'https://atmosphere.copernicus.eu/charts/packages/cams/',cta:'Obrir CAMS'},
  {id:'eonet',horizon:'today',type:'context',agency:'NASA EONET',title:'Esdeveniments naturals globals',summary:'Catàleg mundial d’incendis, tempestes, volcans, inundacions i altres episodis observats.',freshness:'Catàleg d’esdeveniments · cobertura global',use:'Aporta context global, però no substitueix els avisos oficials de Catalunya.',href:'https://eonet.gsfc.nasa.gov/',cta:'Explorar EONET'},
  {id:'sentinel2',horizon:'evolution',type:'observation',agency:'ESA · Copernicus',title:'Sentinel-2 · territori i vegetació',summary:'Imatge òptica d’alta resolució per comparar vegetació, sòl, cicatrius d’incendi i canvis de paisatge.',freshness:'Passades orbitals · condicionat pels núvols',use:'Ideal per a comparacions abans/després quan el cel és prou net.',href:'https://browser.dataspace.copernicus.eu/',cta:'Obrir Copernicus Browser'},
  {id:'sentinel1',horizon:'evolution',type:'observation',agency:'ESA · Copernicus',title:'Sentinel-1 · radar orbital',summary:'Radar d’obertura sintètica que pot observar de nit i travessar els núvols.',freshness:'Passades orbitals · observació radar',use:'Útil per estudiar inundacions, humitat i canvis de superfície quan la imatge òptica queda tapada.',href:'https://browser.dataspace.copernicus.eu/',cta:'Comparar amb Sentinel-1'},
  {id:'worldview',horizon:'evolution',type:'context',agency:'NASA Earthdata',title:'Worldview · arxiu global',summary:'Explorador de centenars de capes satel·litàries diàries amb línia temporal i comparació visual.',freshness:'Moltes capes disponibles el mateix dia',use:'Permet reconstruir un episodi i seleccionar la capa adequada abans de crear una història verificable.',href:'https://worldview.earthdata.nasa.gov/',cta:'Obrir NASA Worldview'}
];

const HORIZONS={now:{label:'Ara',copy:'Què està passant a l’atmosfera en aquests moments.'},today:{label:'Avui',copy:'Context ambiental i esdeveniments de les últimes hores.'},evolution:{label:'Evolució',copy:'Com ha canviat el territori abans i després d’un episodi.'}};
const TYPE_LABELS={observation:'Observació',model:'Model + observacions',context:'Context global'};

export function earthLayersFor(horizon){return EARTH_OBSERVATION_LAYERS.filter(layer=>layer.horizon===horizon);}

export function earthViewerUrl(layer='clouds',region='catalunya',revision=''){
  const safeLayer=EARTH_VIEWER_LAYERS[layer]?layer:'clouds';
  const safeRegion=EARTH_VIEWER_REGIONS[region]?region:'catalunya';
  const suffix=revision?`&v=${encodeURIComponent(revision)}`:'';
  return `${CONFIG.apiUrl}/earth-observation/map?layer=${safeLayer}&region=${safeRegion}${suffix}`;
}

export function earthWmsUrl(name,region='catalunya',revision=''){
  const bounds=EARTH_VIEWER_BOUNDS[EARTH_VIEWER_REGIONS[region]?region:'catalunya'];
  const [[south,west],[north,east]]=bounds;
  const params=new URLSearchParams({service:'WMS',version:'1.3.0',request:'GetMap',layers:name,styles:'',crs:'CRS:84',bbox:[west,south,east,north].join(','),width:'1600',height:'1000',format:'image/png',transparent:'true'});
  if(revision)params.set('v',revision);
  return `${EARTH_WMS_SOURCE}?${params}`;
}

let earthLeafletPromise;
function ensureLeaflet(){
  if(window.L)return Promise.resolve(window.L);
  if(earthLeafletPromise)return earthLeafletPromise;
  earthLeafletPromise=new Promise((resolve,reject)=>{
    if(!document.querySelector('link[data-earth-leaflet]')){
      const style=document.createElement('link');style.rel='stylesheet';style.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';style.crossOrigin='';style.dataset.earthLeaflet='';document.head.append(style);
    }
    const existing=document.querySelector('script[data-earth-leaflet]');
    if(existing){existing.addEventListener('load',()=>resolve(window.L),{once:true});existing.addEventListener('error',reject,{once:true});return;}
    const script=document.createElement('script');script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.crossOrigin='';script.dataset.earthLeaflet='';script.onload=()=>resolve(window.L);script.onerror=reject;document.head.append(script);
  });
  return earthLeafletPromise;
}

async function initViewer(){
  const canvas=document.getElementById('earth-viewer-map');
  const loading=document.getElementById('earth-viewer-loading');
  const status=document.getElementById('earth-viewer-status');
  const caption=document.getElementById('earth-viewer-caption');
  const source=document.getElementById('earth-viewer-source');
  if(!canvas||!loading||!status||!caption||!source)return;
  let layer='clouds',region='catalunya';
  let map,weatherLayers=[],generation=0;
  const load=async(fresh=false)=>{
    const currentGeneration=++generation;
    loading.hidden=false;loading.textContent='Carregant observació d’EUMETSAT…';status.textContent='Carregant dades…';
    caption.textContent=`${EARTH_VIEWER_DATA[layer].caption} · ${EARTH_VIEWER_REGIONS[region]}`;
    source.href=EARTH_VIEWER_SOURCE;source.textContent=`Consultar ${EARTH_VIEWER_LAYERS[layer]} a EUMETView ↗`;
    try{
      const L=await ensureLeaflet();
      if(!map){
        map=L.map(canvas,{zoomControl:true,attributionControl:true,preferCanvas:true,zoomSnap:.1});
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:18,attribution:'Mapa topogràfic © Esri, HERE, Garmin, FAO, NOAA, USGS i col·laboradors'}).addTo(map);
        L.circleMarker([41.6906,2.489],{radius:7,color:'#effff4',weight:2,fillColor:'#56c788',fillOpacity:1}).bindPopup('<strong>Observatori Fontanillas</strong><br>Sant Celoni').addTo(map);
      }
      weatherLayers.forEach(item=>map.removeLayer(item));weatherLayers=[];
      const definitions=EARTH_VIEWER_DATA[layer].layers;
      let loaded=0;
      definitions.forEach(definition=>{
        const overlay=L.imageOverlay(earthWmsUrl(definition.name,region,fresh?Date.now():''),EARTH_VIEWER_BOUNDS[region],{opacity:definition.opacity,interactive:false,crossOrigin:true});
        overlay.on('load',()=>{if(currentGeneration!==generation)return;loaded+=1;if(loaded===definitions.length){loading.hidden=true;status.textContent=`Dades carregades a les ${new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit'}).format(new Date())}`;}});
        overlay.on('error',()=>{if(currentGeneration!==generation)return;loading.textContent='La capa meteorològica no està disponible ara mateix. Pots consultar-la al visor oficial d’EUMETSAT.';loading.hidden=false;status.textContent='Dades temporalment no disponibles';});
        overlay.addTo(map);weatherLayers.push(overlay);
      });
      requestAnimationFrame(()=>{map.invalidateSize();map.fitBounds(EARTH_VIEWER_BOUNDS[region],{padding:[18,18]});});
    }catch{
      loading.textContent='No s’ha pogut carregar el visor. La consulta oficial d’EUMETSAT continua disponible.';loading.hidden=false;status.textContent='Visor temporalment no disponible';
    }
  };
  document.querySelectorAll('[data-earth-layer]').forEach(button=>button.addEventListener('click',()=>{layer=button.dataset.earthLayer;document.querySelectorAll('[data-earth-layer]').forEach(item=>item.classList.toggle('is-active',item===button));load();}));
  document.querySelectorAll('[data-earth-region]').forEach(button=>button.addEventListener('click',()=>{region=button.dataset.earthRegion;document.querySelectorAll('[data-earth-region]').forEach(item=>item.classList.toggle('is-active',item===button));load();}));
  document.getElementById('earth-viewer-refresh')?.addEventListener('click',()=>load(true));
  const viewer=document.getElementById('earth-viewer');
  if('IntersectionObserver'in window&&viewer){
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();load();}},{rootMargin:'240px'});
    observer.observe(viewer);
  }else load();
}

function render(horizon='now'){
  const host=document.getElementById('earth-observation-layers');
  const intro=document.getElementById('earth-observation-copy');
  if(!host||!intro)return;
  intro.textContent=HORIZONS[horizon].copy;
  host.innerHTML=earthLayersFor(horizon).map(layer=>`<article class="earth-layer earth-layer--${layer.type}"><header><span>${TYPE_LABELS[layer.type]}</span><small>${layer.agency}</small></header><h3>${layer.title}</h3><p>${layer.summary}</p><dl><div><dt>Frescor</dt><dd>${layer.freshness}</dd></div><div><dt>Com llegir-ho</dt><dd>${layer.use}</dd></div></dl><a href="${layer.href}"${layer.href.startsWith('http')?' target="_blank" rel="noreferrer"':''}>${layer.cta} →</a></article>`).join('');
  document.querySelectorAll('[data-earth-horizon]').forEach(button=>{const active=button.dataset.earthHorizon===horizon;button.classList.toggle('is-active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
}

export function initEarthObservation(){
  if(!document.getElementById('earth-observation-center'))return;
  const tabs=[...document.querySelectorAll('[data-earth-horizon]')];
  tabs.forEach((button,index)=>{
    button.addEventListener('click',()=>render(button.dataset.earthHorizon));
    button.addEventListener('keydown',event=>{
      const direction={ArrowRight:1,ArrowLeft:-1,Home:-index,End:tabs.length-1-index}[event.key];
      if(direction===undefined)return;
      event.preventDefault();
      const next=tabs[(index+direction+tabs.length)%tabs.length];
      render(next.dataset.earthHorizon);
      next.focus();
    });
  });
  render('now');
  initViewer();
}
