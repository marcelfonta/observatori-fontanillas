import { fetchLocalityWeather, fetchNearbyStations } from '../services/weather-api.js';

const state={current:null,history:[],forecast:null,alerts:null,environment:null};
let initialized=false;

const weatherCodes={
  0:'cel serè',1:'poc ennuvolat',2:'intervals de núvols',3:'cel cobert',45:'boira',48:'boira gebradora',
  51:'plugim',53:'plugim',55:'plugim intens',56:'plugim glaçat',57:'plugim glaçat',61:'pluja feble',63:'pluja',65:'pluja intensa',
  66:'pluja glaçada',67:'pluja glaçada',71:'neu feble',73:'neu',75:'nevada intensa',77:'neu granulada',80:'ruixats',81:'ruixats',
  82:'ruixats forts',85:'ruixats de neu',86:'ruixats de neu',95:'tempesta',96:'tempesta amb calamarsa',99:'tempesta forta'
};

const n=value=>value!==null&&value!==''&&Number.isFinite(Number(value))?Number(value):null;
const fmt=(value,digits=1)=>n(value)===null?'—':n(value).toLocaleString('ca-ES',{minimumFractionDigits:digits,maximumFractionDigits:digits});
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[¿?!.;,·]/g,' ').replace(/\s+/g,' ').trim();
const timeLabel=value=>{
  const date=new Date(String(value||'').replace(' ','T'));
  return Number.isNaN(date.getTime())?'hora no disponible':new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(date);
};
const source=(label,detail)=>({label,detail});
const response=(title,body,{facts=[],sources=[],level='info',followups=[]}={})=>({title,body,facts,sources,level,followups});

function activeAlerts(context){
  const payload=context.alerts;
  if(!payload?.ok)return null;
  const alerts=Array.isArray(payload.alerts)?payload.alerts:[];
  return {count:Number.isFinite(Number(payload.active))?Number(payload.active):alerts.length,level:payload.maxLevel||'none',alerts,checked:payload.checkedAt||payload.updated};
}

function forecastDay(context,index=0){
  const daily=context.forecast?.daily;
  if(!daily?.time?.[index])return null;
  return {
    date:daily.time[index],code:n(daily.weather_code?.[index]),max:n(daily.temperature_2m_max?.[index]),min:n(daily.temperature_2m_min?.[index]),
    rainChance:n(daily.precipitation_probability_max?.[index]),rain:n(daily.precipitation_sum?.[index]),gust:n(daily.wind_gusts_10m_max?.[index]),uv:n(daily.uv_index_max?.[index])
  };
}

function forecastAnswer(context,question){
  const tomorrow=normalize(question).includes('dema');
  const day=forecastDay(context,tomorrow?1:0);
  if(!day)return response('Predicció pendent','Encara no tinc una predicció actualitzada. Torna-ho a provar quan la pàgina indiqui que les dades ja estan disponibles.',{sources:[source('Open‑Meteo','Predicció no disponible')]});
  const label=tomorrow?'Demà':'Avui';
  const condition=weatherCodes[day.code]||'temps variable';
  const body=`${label} s’espera ${condition}, amb una màxima de ${fmt(day.max)} °C i una mínima de ${fmt(day.min)} °C. La probabilitat màxima de pluja és del ${fmt(day.rainChance,0)}% i l’acumulació prevista és de ${fmt(day.rain)} mm.`;
  const level=(day.rainChance??0)>=70||(day.gust??0)>=50?'caution':'info';
  return response(`${label}: ${condition}`,body,{level,facts:[`Ratxa màxima · ${fmt(day.gust,0)} km/h`,`UV màxim · ${fmt(day.uv,0)}`],sources:[source('Open‑Meteo',`Predicció diària · ${day.date}`)],followups:['Puc sortir a córrer?','Hi ha avisos actius?']});
}

function currentAnswer(context){
  const current=context.current;
  if(!current||n(current.temperature)===null)return response('Lectura pendent','Encara no tinc una lectura vàlida de Fontanillas. Espera que l’estació acabi de connectar.',{sources:[source('Estació Fontanillas','Sense lectura actual')]});
  const raining=(n(current.rainRate)??0)>0;
  const body=`Ara mateix Fontanillas registra ${fmt(current.temperature)} °C, amb una sensació de ${fmt(current.feelsLike)} °C i una humitat del ${fmt(current.humidity,0)}%. ${raining?`Plou a ${fmt(current.rainRate)} mm/h.`:`No s’hi detecta pluja en aquest instant.`}`;
  return response('Situació actual a Fontanillas',body,{facts:[`Vent · ${fmt(current.windSpeed)} km/h`,`Ratxa · ${fmt(current.windGust)} km/h`,`Pressió · ${fmt(current.pressure)} hPa`,`Pluja avui · ${fmt(current.rainToday)} mm`],sources:[source('Sensor Fontanillas',`Lectura de les ${timeLabel(current.updated)}`)],followups:['Plourà avui?','Com ha canviat la temperatura?']});
}

function alertsAnswer(context){
  const alerts=activeAlerts(context);
  if(!alerts)return response('Avisos no verificats','Ara mateix no puc verificar el servei d’avisos. Això no significa que no n’hi hagi: consulta AEMET, Meteocat o Protecció Civil abans de prendre decisions de seguretat.',{level:'warning',sources:[source('Avisos oficials','Verificació temporalment no disponible')]});
  if(!alerts.count)return response('Sense avisos oficials actius','La darrera comprovació no mostra avisos actius per a l’àmbit configurat de Sant Celoni i el Prelitoral de Barcelona.',{level:'safe',sources:[source('AEMET · Meteocat',`Comprovat a les ${timeLabel(alerts.checked)}`)],followups:['Quin temps farà avui?','Puc fer una excursió?']});
  const phenomena=[...new Set(alerts.alerts.map(item=>item.phenomenon||item.title).filter(Boolean))];
  return response(`${alerts.count} ${alerts.count===1?'avís oficial actiu':'avisos oficials actius'}`,`El nivell màxim és ${alerts.level}. ${phenomena.length?`Fenòmens indicats: ${phenomena.join(', ')}.`:'Consulta el detall oficial abans de planificar activitats.'}`,{level:'warning',facts:alerts.alerts.slice(0,3).map(item=>item.description||item.title).filter(Boolean),sources:[source('AEMET · Meteocat',`Comprovat a les ${timeLabel(alerts.checked)}`)],followups:['És segur sortir a córrer?','Què recomanes per a una excursió?']});
}

function historyAnswer(context){
  const history=(context.history||[]).filter(item=>n(item.temperature)!==null&&Number.isFinite(Number(item.t))).sort((a,b)=>a.t-b.t);
  if(history.length<2)return response('Històric insuficient','Encara no tinc prou mostres per descriure l’evolució amb rigor.',{sources:[source('Arxiu Fontanillas',`${history.length} mostres disponibles`)]});
  const cutoff=Date.now()-24*60*60*1000;
  const recent=history.filter(item=>item.t>=cutoff);
  const samples=recent.length>=2?recent:history.slice(-48);
  const values=samples.map(item=>n(item.temperature)).filter(value=>value!==null);
  const first=values[0],last=values.at(-1),delta=last-first;
  const direction=Math.abs(delta)<.3?'s’ha mantingut força estable':delta>0?'ha pujat':'ha baixat';
  return response('Evolució de la temperatura',`Durant el període cobert, la temperatura ${direction} ${fmt(Math.abs(delta))} °C: de ${fmt(first)} °C a ${fmt(last)} °C.`,{facts:[`Màxima · ${fmt(Math.max(...values))} °C`,`Mínima · ${fmt(Math.min(...values))} °C`,`Mostres · ${samples.length}`],sources:[source('Arxiu Fontanillas',recent.length>=2?'Últimes 24 hores':'Darreres mostres disponibles')],followups:['Quina temperatura fa ara?','Plourà demà?']});
}

function environmentAnswer(context){
  const env=context.environment;
  if(!env)return response('Medi ambient pendent','Els indicadors ambientals encara no s’han carregat. Obre o espera uns instants a la pàgina de Medi Ambient.',{sources:[source('CAMS · Sensor Fontanillas','Dades pendents')]});
  const aqi=n(env.european_aqi),uv=n(env.uv),pollen=env.pollenMain||'no disponible';
  const quality=aqi===null?'no disponible':aqi<=20?'bona':aqi<=40?'raonablement bona':aqi<=60?'moderada':aqi<=80?'dolenta':'molt dolenta';
  const level=(aqi??0)>60||(uv??0)>=8?'warning':(aqi??0)>40||(uv??0)>=6?'caution':'safe';
  return response('Lectura ambiental',`La qualitat de l’aire estimada és ${quality}${aqi===null?'':` (índex europeu ${fmt(aqi,0)})`}. L’índex UV és ${fmt(uv,0)} i el pol·len dominant és ${pollen}.`,{level,facts:[`PM2,5 · ${fmt(env.pm25)} µg/m³`,`PM10 · ${fmt(env.pm10)} µg/m³`,`UV · ${fmt(uv,0)} · ${env.uvSource||'font no indicada'}`],sources:[source('CAMS via Open‑Meteo',`Actualitzat a les ${timeLabel(env.time)}`),source(env.uvSource||'Sensor Fontanillas','Índex UV')],followups:['Puc sortir a córrer?','Quin temps farà avui?']});
}

function recommendationAnswer(context,question){
  const q=normalize(question);
  const activity=q.includes('correr')||q.includes('running')?'córrer':q.includes('excurs')||q.includes('muntanya')?'fer una excursió':q.includes('nens')||q.includes('famil')?'fer una activitat familiar':'fer activitat a l’exterior';
  const alerts=activeAlerts(context);const day=forecastDay(context,0);const current=context.current||{};const env=context.environment||{};
  const blockers=[];const cautions=[];
  if(alerts?.count)blockers.push(`${alerts.count} ${alerts.count===1?'avís oficial actiu':'avisos oficials actius'}`);
  if((day?.rainChance??0)>=70)cautions.push(`${fmt(day.rainChance,0)}% de probabilitat de pluja`);
  if((day?.gust??n(current.windGust)??0)>=45)cautions.push(`ratxes de fins a ${fmt(day?.gust??current.windGust,0)} km/h`);
  if((n(current.temperature)??day?.max??0)>=32)cautions.push('calor marcada');
  if((n(env.uv)??day?.uv??0)>=7)cautions.push(`UV ${fmt(n(env.uv)??day?.uv,0)}`);
  if((n(env.european_aqi)??0)>60)cautions.push('qualitat de l’aire desfavorable');
  if(blockers.length)return response(`No recomano ${activity} sense revisar els avisos`,`Hi ha ${blockers.join(' i ')}. Prioritza les instruccions d’AEMET, Meteocat i Protecció Civil; si l’activitat és de muntanya, ajorna-la quan l’avís afecti el fenomen o la zona.`,{level:'warning',facts:cautions,sources:[source('AEMET · Meteocat','Avisos oficials'),source('Estació i predicció','Context meteorològic actual')]});
  if(cautions.length)return response(`Possible, però amb precaucions`,`Per ${activity}, tingues en compte ${cautions.join(', ')}. Adapta l’horari, porta aigua i protecció, i revisa el radar just abans de sortir.`,{level:'caution',sources:[source('Sensor Fontanillas',`Lectura de les ${timeLabel(current.updated)}`),source('Open‑Meteo','Predicció d’avui'),source('AEMET · Meteocat','Sense avisos actius en la darrera comprovació')]});
  return response(`Condicions favorables per ${activity}`,`Les dades disponibles no mostren ara cap factor meteorològic destacat. Tot i així, comprova el radar abans de sortir i adapta l’activitat a les condicions reals del lloc.`,{level:'safe',sources:[source('Sensor Fontanillas',`Lectura de les ${timeLabel(current.updated)}`),source('Open‑Meteo','Predicció d’avui'),source('AEMET · Meteocat','Darrera comprovació')]});
}

async function comparisonAnswer(services){
  try{
    const payload=await services.fetchNearbyStations('now');
    const stations=(payload?.stations||[]).filter(item=>item.status==='online'&&n(item.temperature)!==null);
    if(stations.length<2)throw new Error('NOT_ENOUGH_STATIONS');
    const warmest=[...stations].sort((a,b)=>n(b.temperature)-n(a.temperature))[0];
    const coolest=[...stations].sort((a,b)=>n(a.temperature)-n(b.temperature))[0];
    const wettest=[...stations].filter(item=>n(item.rainToday)!==null).sort((a,b)=>n(b.rainToday)-n(a.rainToday))[0];
    return response('Comparació del Baix Montseny',`${warmest.name} registra la temperatura més alta (${fmt(warmest.temperature)} °C) i ${coolest.name} la més baixa (${fmt(coolest.temperature)} °C) entre les estacions disponibles.`,{facts:[`${stations.length} estacions actives`,wettest?`Més pluja avui · ${wettest.name} · ${fmt(wettest.rainToday)} mm`:null].filter(Boolean),sources:[source('Comparador de l’Observatori',payload.sourcePolicy?.note||'Estacions normalitzades pel Worker')],followups:['Quina temperatura fa a Fontanillas?','Com ha canviat la temperatura?']});
  }catch{
    return response('Comparació temporalment no disponible','No he pogut consultar prou estacions properes. Les dades de Fontanillas continuen disponibles.',{sources:[source('Comparador de l’Observatori','Consulta fallida')]});
  }
}

function localityFromQuestion(question){
  const raw=String(question||'').trim();
  const patterns=[/(?:quin temps fa|quina temperatura fa|temps fa|previsi[oó]|plour[aà]|plou|avisos?|alertes?)\s+(?:a la|al|a|per a)\s+([^?!.]{2,80})/i,/(?:temps|temperatura)\s+(?:a la|al|a|de)\s+([^?!.]{2,80})/i];
  for(const pattern of patterns){const match=raw.match(pattern);if(match)return match[1].trim();}
  return '';
}

async function localityAnswer(name,services){
  try{
    const {location,weather}=await services.fetchLocalityWeather(name);
    const current=weather.current||{};const daily=weather.daily||{};
    const place=[location.name,location.admin1,location.country].filter(Boolean).join(' · ');
    const condition=weatherCodes[n(current.weather_code)]||'temps variable';
    return response(`Temps a ${location.name}`,`Ara hi ha ${condition} i ${fmt(current.temperature_2m)} °C, amb una sensació de ${fmt(current.apparent_temperature)} °C. Per avui s’espera una màxima de ${fmt(daily.temperature_2m_max?.[0])} °C, una mínima de ${fmt(daily.temperature_2m_min?.[0])} °C i un ${fmt(daily.precipitation_probability_max?.[0],0)}% de probabilitat màxima de pluja.`,{facts:[`Humitat · ${fmt(current.relative_humidity_2m,0)}%`,`Vent · ${fmt(current.wind_speed_10m)} km/h`,`Ratxa · ${fmt(current.wind_gusts_10m)} km/h`],sources:[source('Open‑Meteo',`${place} · ${timeLabel(current.time)}`)],followups:['Quin temps fa a Fontanillas?','Hi ha avisos a Sant Celoni?']});
  }catch(error){
    const missing=String(error?.message).includes('LOCALITY_NOT_FOUND');
    return response(missing?'No he trobat aquesta població':'Consulta temporalment no disponible',missing?`No he pogut identificar «${name}». Prova d’escriure el municipi i la comarca o el país.`:'Open‑Meteo no ha respost. Torna-ho a provar d’aquí uns instants.',{sources:[source('Open‑Meteo','Geocodificació i predicció')]});
  }
}

export async function answerMeteoQuestion(question,context=state,services={fetchLocalityWeather,fetchNearbyStations}){
  const q=normalize(question);
  const locality=localityFromQuestion(question);
  if(locality&&!['sant celoni','fontanillas','montseny','baix montseny'].some(name=>normalize(locality).includes(name))){
    if(/avis|alert/.test(q))return response(`Avisos de ${locality} no verificats`,`Meteo IA encara no disposa d’una font oficial territorial normalitzada per verificar avisos fora de Sant Celoni. Consulta AEMET, el servei meteorològic autonòmic i Protecció Civil de la zona.`,{level:'warning',sources:[source('Meteo IA','Cobertura oficial limitada a l’àmbit local')]});
    return localityAnswer(locality,services);
  }
  if(/avis|alert|perill/.test(q))return alertsAnswer(context);
  if(/correr|running|excurs|muntanya|famil|nens|sortir|passeig|bicicleta|bici|bon moment/.test(q))return recommendationAnswer(context,question);
  if(/compar|estacio|mes calor|mes fred|on fa/.test(q))return comparisonAnswer(services);
  if(/aire|contamin|pm2|pm10|pol len|pollen|uv|radiacio/.test(q))return environmentAnswer(context);
  if(/historic|evoluc|canviat|ultimes 24/.test(q))return historyAnswer(context);
  if(/plour|previsi|dema|avui|temps fara/.test(q))return forecastAnswer(context,question);
  if(/temperatura|temps fa|ara|humitat|vent|pressio|pluja actual/.test(q))return currentAnswer(context);
  return response('Et puc ajudar amb dades concretes','Pregunta’m per la situació actual, la predicció, els avisos, l’evolució històrica, les estacions properes, el medi ambient o si convé fer una activitat. Per exemple: «Plourà avui?» o «Puc sortir a córrer?».',{sources:[source('Meteo IA','Interpretació local al navegador')],followups:['Quina temperatura fa ara?','Plourà demà?','Hi ha avisos actius?']});
}

function createMessage(role,resultOrText){
  const article=document.createElement('article');article.className=`meteo-ai-message is-${role}`;
  if(role==='user'){const p=document.createElement('p');p.textContent=resultOrText;article.append(p);return article;}
  const result=resultOrText;article.classList.add(`is-${result.level||'info'}`);
  const header=document.createElement('header');const mark=document.createElement('span');mark.textContent='IA';const title=document.createElement('strong');title.textContent=result.title;header.append(mark,title);
  const body=document.createElement('p');body.textContent=result.body;article.append(header,body);
  if(result.facts?.length){const facts=document.createElement('ul');facts.className='meteo-ai-facts';result.facts.forEach(value=>{const item=document.createElement('li');item.textContent=value;facts.append(item);});article.append(facts);}
  if(result.sources?.length){const sources=document.createElement('div');sources.className='meteo-ai-sources';const label=document.createElement('span');label.textContent='Fonts';sources.append(label);result.sources.forEach(item=>{const chip=document.createElement('small');chip.textContent=`${item.label} · ${item.detail}`;sources.append(chip);});article.append(sources);}
  if(result.followups?.length){const followups=document.createElement('div');followups.className='meteo-ai-followups';result.followups.forEach(value=>{const button=document.createElement('button');button.type='button';button.dataset.aiQuestion=value;button.textContent=value;followups.append(button);});article.append(followups);}
  return article;
}

function updateStatus(){
  const available=[state.current,state.forecast,state.alerts,state.environment,state.history?.length].filter(Boolean).length;
  const status=document.getElementById('meteo-ai-data-status');if(status)status.textContent=available>=4?'Dades principals connectades':`${available}/5 fonts preparades`;
}

export function updateMeteoAIContext(patch){Object.assign(state,patch||{});updateStatus();}

async function ask(question){
  const text=String(question||'').trim().slice(0,160);if(!text)return;
  const log=document.getElementById('meteo-ai-messages');const input=document.getElementById('meteo-ai-input');const submit=document.getElementById('meteo-ai-submit');
  log?.append(createMessage('user',text));if(input)input.value='';if(submit){submit.disabled=true;submit.textContent='Consultant…';}
  const pending=document.createElement('div');pending.className='meteo-ai-typing';pending.textContent='Creuant les dades disponibles…';log?.append(pending);log?.scrollTo({top:log.scrollHeight,behavior:'smooth'});
  try{const result=await answerMeteoQuestion(text);pending.replaceWith(createMessage('assistant',result));}
  catch{pending.replaceWith(createMessage('assistant',response('No he pogut completar la consulta','Les dades principals continuen disponibles al portal. Torna-ho a provar d’aquí uns instants.',{level:'warning'})));}
  if(submit){submit.disabled=false;submit.textContent='Preguntar';}log?.scrollTo({top:log.scrollHeight,behavior:'smooth'});input?.focus();
}

export function initMeteoAI(){
  if(initialized||!document.getElementById('meteo-ia'))return;initialized=true;
  const form=document.getElementById('meteo-ai-form');const input=document.getElementById('meteo-ai-input');const log=document.getElementById('meteo-ai-messages');
  form?.addEventListener('submit',event=>{event.preventDefault();ask(input?.value);});
  document.addEventListener('click',event=>{const button=event.target.closest('[data-ai-question]');if(button)ask(button.dataset.aiQuestion);});
  document.getElementById('meteo-ai-clear')?.addEventListener('click',()=>{if(!log)return;log.replaceChildren(createMessage('assistant',response('Conversa nova','Torno a estar a punt. Pregunta’m pel temps, els avisos o una activitat.',{sources:[source('Meteo IA','Cap conversa desada')]})));input?.focus();});
  document.addEventListener('observatori:alerts-updated',event=>updateMeteoAIContext({alerts:event.detail}));
  document.addEventListener('observatori:environment-updated',event=>updateMeteoAIContext({environment:event.detail}));
  updateStatus();
}
