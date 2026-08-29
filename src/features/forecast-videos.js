import { fetchForecastVideos } from '../services/weather-api.js';

const SOURCES={
  meteocat:{
    label:'Meteocat',
    title:'Predicció general de Catalunya',
    description:'Vídeo diari del Servei Meteorològic de Catalunya.',
    embedUrl:'https://www.youtube-nocookie.com/embed/videoseries?list=PLOWaA1TFs5he_kR01X0A23zkhrB7eJwMD&rel=0',
    sourceUrl:'https://www.meteo.cat/wpweb/prediccio/audiovisuals-de-prediccio/'
  }
};

function renderSource(sourceKey,source){
  const frame=document.getElementById('forecast-video-frame');
  const shell=document.getElementById('forecast-video-frame-shell');
  const empty=document.getElementById('forecast-video-empty');
  const meta=document.getElementById('forecast-video-meta');
  if(!frame||!shell||!empty||!meta||!source?.embedUrl)return;
  document.querySelectorAll('[data-video-source]').forEach(button=>{
    const active=button.dataset.videoSource===sourceKey;
    button.classList.toggle('is-active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  frame.title=`${source.label}: ${source.title}`;
  const status=document.getElementById('forecast-videos-status');
  if(status)status.textContent=`Carregant el reproductor de ${source.label}…`;
  frame.onload=()=>{if(status)status.textContent=`Reproductor de ${source.label} preparat. Prem ▶ per començar.`;};
  frame.src=source.embedUrl;
  empty.hidden=true;shell.hidden=false;meta.hidden=false;
  document.getElementById('forecast-video-source-label').textContent=`Font: ${source.label}`;
  document.getElementById('forecast-video-title').textContent=source.title;
  document.getElementById('forecast-video-description').textContent=source.description;
  const link=document.getElementById('forecast-video-source-link');
  link.href=source.sourceUrl;link.textContent=`Obrir a ${source.label} ↗`;
}

function connectButtons(sources){
  document.querySelectorAll('[data-video-source]').forEach(control=>{
    control.setAttribute('aria-pressed','false');
    control.addEventListener('click',()=>renderSource(control.dataset.videoSource,sources[control.dataset.videoSource]));
  });
}

export async function initForecastVideos(){
  const root=document.getElementById('forecast-videos');
  if(!root)return;
  const sources={...SOURCES};
  const status=document.getElementById('forecast-videos-status');
  try{
    const payload=await fetchForecastVideos();
    if(payload?.threeCat?.embedUrl){
      sources['3cat']={
        label:'3Cat',
        title:payload.threeCat.title||'Darrera explicació del temps',
        description:payload.threeCat.publishedLabel?`Publicat ${payload.threeCat.publishedLabel}.`:'Darrera previsió meteorològica disponible a 3Cat.',
        embedUrl:payload.threeCat.embedUrl,
        sourceUrl:payload.threeCat.sourceUrl
      };
      const button=document.getElementById('forecast-video-3cat');
      button.hidden=false;
      document.getElementById('forecast-video-3cat-title').textContent=sources['3cat'].title;
      document.getElementById('forecast-video-3cat-date').textContent=sources['3cat'].description;
      status.textContent='Fonts preparades. Meteocat i 3Cat es reprodueixen dins la web.';
    }else{
      status.textContent='Meteocat està disponible. 3Cat apareixerà quan es localitzi una previsió recent.';
    }
  }catch(error){
    console.warn('No s’ha pogut comprovar el darrer vídeo de 3Cat.',error);
    status.textContent='Meteocat està disponible. 3Cat no respon ara mateix.';
  }
  connectButtons(sources);
}
