// Only the provider's observed frames belong on the radar timeline.
export function radarHistory(map, onTileError) {
  let frames = [], layer, request;
  function clear() {
    request?.abort();
    layer?.remove();
    layer = null;
    frames = [];
  }
  async function load() {
    clear();
    const current = new AbortController();
    request = current;
    const response = await fetch('https://api.rainviewer.com/public/weather-maps.json', {
      signal:AbortSignal.any([current.signal, AbortSignal.timeout(15000)])
    });
    if (!response.ok) throw new Error('Radar indisponible');
    const data = await response.json();
    current.signal.throwIfAborted();
    frames = (data.radar?.past || []).filter(f=>Number.isFinite(f.time) && /^\/v2\/radar\/[\w/-]+$/.test(f.path))
      .sort((a,b)=>a.time-b.time).map(f=>({...f,host:data.host}));
    if (!frames.length) throw new Error('Sense observacions');
    return frames.length;
  }
  function show(index) {
    const frame = frames[index];
    if (!frame) return;
    layer?.remove();
    layer = L.tileLayer(frame.host+frame.path+'/256/{z}/{x}/{y}/2/1_1.png',{
      opacity:.82,maxNativeZoom:7,maxZoom:15,attribution:'Radar © RainViewer'
    });
    const active = layer;
    layer.on('tileerror',()=>{if (layer===active) onTileError();});
    layer.addTo(map);
    return new Date(frame.time*1000);
  }
  return {clear,load,show,hide(){layer?.remove();layer=null;}};
}
