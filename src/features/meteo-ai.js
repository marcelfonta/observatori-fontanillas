import { fetchAdvancedMeteoAI, fetchAlertHistory, fetchAlerts, fetchCurrentWeather, fetchForecast, fetchLocalityWeather, fetchNearbyStations } from '../services/weather-api.js';
import { ephemerisDateLabel, meteorologicalEphemeridesForDate } from '../data/meteorological-ephemerides.js';

const state={current:null,history:[],forecast:null,alerts:null,environment:null};
let initialized=false;
const CONVERSATION_KEY='fontanillas-meteo-ai-context-v15';

const weatherCodes={
  0:'cel serè',1:'poc ennuvolat',2:'intervals de núvols',3:'cel cobert',45:'boira',48:'boira gebradora',
  51:'plugim',53:'plugim',55:'plugim intens',56:'plugim glaçat',57:'plugim glaçat',61:'pluja feble',63:'pluja',65:'pluja intensa',
  66:'pluja glaçada',67:'pluja glaçada',71:'neu feble',73:'neu',75:'nevada intensa',77:'neu granulada',80:'ruixats',81:'ruixats',
  82:'ruixats forts',85:'ruixats de neu',86:'ruixats de neu',95:'tempesta',96:'tempesta amb calamarsa',99:'tempesta forta'
};

const n=value=>value!==null&&value!==''&&Number.isFinite(Number(value))?Number(value):null;
const fmt=(value,digits=1)=>n(value)===null?'—':n(value).toLocaleString('ca-ES',{minimumFractionDigits:digits,maximumFractionDigits:digits});
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[¿?!.;,·]/g,' ').replace(/\s+/g,' ').trim();
const alertLevelLabel=level=>({red:'Vermell',orange:'Taronja',yellow:'Groc',unknown:'Oficial',none:'Sense avisos'})[level]||'Oficial';
const emptyMemory=()=>({location:null,period:null,activity:null});
const readMemory=()=>{try{return {...emptyMemory(),...JSON.parse(sessionStorage.getItem(CONVERSATION_KEY)||'{}')};}catch{return emptyMemory();}};
let conversationMemory=typeof sessionStorage==='undefined'?emptyMemory():readMemory();
const saveMemory=memory=>{try{sessionStorage.setItem(CONVERSATION_KEY,JSON.stringify(memory));}catch{/* La sessió pot estar desactivada. */}};
const timeLabel=value=>{
  const date=new Date(String(value||'').replace(' ','T'));
  return Number.isNaN(date.getTime())?'hora no disponible':new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(date);
};
const sourceLinks={
  'Sensor Fontanillas':'./?page=estacio','Estació Fontanillas':'./?page=estacio','Arxiu Fontanillas':'./?page=centre-dades',
  'Open‑Meteo':'https://open-meteo.com/','CAMS via Open‑Meteo':'./?page=medi-ambient','CAMS · Sensor Fontanillas':'./?page=medi-ambient',
  'AEMET · Meteocat':'./?page=avisos','Avisos oficials':'./?page=avisos','Comparador de l’Observatori':'./comparativa.html',
  'Historial d’avisos':'./historial-avisos.html',
  'Estació i predicció':'./?page=prediccio','Meteo IA':'./?page=meteo-ia',
  'AEMET · MeteoGlosario':'https://www.aemet.es/es/conocermas/meteo_glosario_visual',
  'AEMET · Dades climatològiques':'https://www.aemet.es/ca/serviciosclimaticos/datosclimatologicos',
  'AEMET OpenData':'https://www.aemet.es/es/datos_abiertos/AEMET_OpenData',
  'Meteocat · Dades obertes':'https://www.meteo.cat/wpweb/serveis/dades-obertes/',
  'Atles de Núvols · OMM':'https://cloudatlas.wmo.int/en/home.html'
};
const source=(label,detail,href=sourceLinks[label]||'')=>({label,detail,href});
const response=(title,body,{facts=[],sources=[],level='info',followups=[]}={})=>({title,body,facts,sources,level,followups});

function activeAlerts(context){
  const payload=context.alerts;
  if(!payload?.ok)return null;
  const alerts=Array.isArray(payload.alerts)?payload.alerts:[];
  return {count:Number.isFinite(Number(payload.active))?Number(payload.active):alerts.length,level:payload.maxLevel||'none',alerts,checked:payload.checkedAt||payload.updated};
}

function forecastDayFromDaily(daily,index=0){
  if(!daily?.time?.[index])return null;
  return {
    date:daily.time[index],code:n(daily.weather_code?.[index]),max:n(daily.temperature_2m_max?.[index]),min:n(daily.temperature_2m_min?.[index]),
    rainChance:n(daily.precipitation_probability_max?.[index]),rain:n(daily.precipitation_sum?.[index]),gust:n(daily.wind_gusts_10m_max?.[index]),uv:n(daily.uv_index_max?.[index])
  };
}

function forecastDay(context,index=0){return forecastDayFromDaily(context.forecast?.daily,index);}

const weekdayNames={diumenge:0,dilluns:1,dimarts:2,dimecres:3,dijous:4,divendres:5,dissabte:6};
const dateAt=value=>new Date(`${value}T12:00:00`);
const dayTitle=value=>new Intl.DateTimeFormat('ca-ES',{weekday:'long',day:'numeric',month:'long'}).format(dateAt(value));
const shortDay=value=>new Intl.DateTimeFormat('ca-ES',{weekday:'short',day:'numeric',month:'short'}).format(dateAt(value)).replaceAll('.','');

function requestedPeriod(question,daily){
  const q=normalize(question);const times=daily?.time||[];if(!times.length)return {type:'missing'};
  const start=dateAt(times[0]);
  const nextWeek=/setmana que ve|setmana vinent|proxima setmana/.test(q);
  const weekday=Object.entries(weekdayNames).find(([name])=>q.includes(name));
  const daysToNextMonday=((8-start.getDay())%7)||7;
  const nextMonday=new Date(start);nextMonday.setDate(start.getDate()+daysToNextMonday);
  if(weekday){
    const min=nextWeek?nextMonday:start;
    const index=times.findIndex(value=>{const date=dateAt(value);return date>=min&&date.getDay()===weekday[1];});
    return index>=0?{type:'day',index,label:dayTitle(times[index])}:{type:'missing',requested:weekday[0]};
  }
  if(/cap de setmana/.test(q)){
    const min=nextWeek?nextMonday:start;
    const indices=times.map((value,index)=>({index,date:dateAt(value)})).filter(item=>item.date>=min&&[0,6].includes(item.date.getDay())).slice(0,2).map(item=>item.index);
    return indices.length?{type:'range',indices,label:'el cap de setmana'}:{type:'missing',requested:'cap de setmana'};
  }
  if(nextWeek){
    const end=new Date(nextMonday);end.setDate(end.getDate()+7);
    const indices=times.map((value,index)=>({index,date:dateAt(value)})).filter(item=>item.date>=nextMonday&&item.date<end).map(item=>item.index);
    return indices.length?{type:'range',indices,label:'la setmana que ve'}:{type:'missing',requested:'la setmana que ve'};
  }
  if(q.includes('dema'))return times[1]?{type:'day',index:1,label:'demà'}:{type:'missing',requested:'demà'};
  if(q.includes('avui'))return {type:'day',index:0,label:'avui'};
  return {type:'current',index:0,label:'avui'};
}

function dailyAnswer(daily,index,place='Sant Celoni',extra=''){
  const day=forecastDayFromDaily(daily,index);
  if(!day)return response('Predicció pendent','No hi ha dades disponibles per al dia demanat dins de l’horitzó actual.',{sources:[source('Open‑Meteo','Predicció no disponible')]});
  const label=dayTitle(day.date);
  const condition=weatherCodes[day.code]||'temps variable';
  const body=`A ${place}, ${label} s’espera ${condition}, amb una màxima de ${fmt(day.max)} °C i una mínima de ${fmt(day.min)} °C. La probabilitat màxima de pluja és del ${fmt(day.rainChance,0)}% i l’acumulació prevista és de ${fmt(day.rain)} mm.${extra}`;
  const level=(day.rainChance??0)>=70||(day.gust??0)>=50?'caution':'info';
  return response(`${label}: ${condition}`,body,{level,facts:[`Ratxa màxima · ${fmt(day.gust,0)} km/h`,`UV màxim · ${fmt(day.uv,0)}`],sources:[source('Open‑Meteo',`${place} · predicció del ${day.date}`)],followups:['Puc sortir a córrer?','Hi ha avisos actius?']});
}

function rangeAnswer(daily,indices,place='Sant Celoni',label='la setmana que ve',extra=''){
  const days=indices.map(index=>forecastDayFromDaily(daily,index)).filter(Boolean);
  if(!days.length)return response('Predicció pendent','No hi ha prou dies disponibles per resumir el període demanat.',{sources:[source('Open‑Meteo','Horitzó insuficient')]});
  const maxima=days.map(day=>day.max).filter(value=>value!==null);const minima=days.map(day=>day.min).filter(value=>value!==null);
  const rainTotal=days.reduce((total,day)=>total+(day.rain??0),0);const rainChance=Math.max(...days.map(day=>day.rainChance??0));const gust=Math.max(...days.map(day=>day.gust??0));
  const far=indices.some(index=>index>=7);const uncertainty=far?' Com que és una previsió a més d’una setmana, la incertesa és més alta i convé revisar-la de nou més endavant.':'';
  const body=`A ${place}, ${label} presenta màximes entre ${fmt(Math.min(...maxima))} i ${fmt(Math.max(...maxima))} °C, i mínimes entre ${fmt(Math.min(...minima))} i ${fmt(Math.max(...minima))} °C. La probabilitat màxima de pluja arriba al ${fmt(rainChance,0)}% i l’acumulació orientativa del període és de ${fmt(rainTotal)} mm.${uncertainty}${extra}`;
  const facts=days.map(day=>`${shortDay(day.date)} · ${fmt(day.max,0)}°/${fmt(day.min,0)}° · pluja ${fmt(day.rainChance,0)}%`);
  return response(`Resum de ${label}`,body,{level:rainChance>=70||gust>=50?'caution':'info',facts,sources:[source('Open‑Meteo',`${place} · horitzó de 14 dies`)],followups:['Quin dia plourà més?','I divendres concretament?']});
}

function rankedDayAnswer(daily,question,place='Sant Celoni',extra=''){
  const q=normalize(question);
  const rainIntent=/(?:quin|que) dia.*(?:plour|mes pluja)|(?:mes pluja|ploura mes).*(?:quin|que) dia/.test(q);
  const windIntent=/(?:quin|que) dia.*(?:mes vent|mes ventos|ratx)/.test(q);
  const warmIntent=/(?:quin|que) dia.*(?:mes calor|mes calid|mes temperatura)/.test(q);
  const coldIntent=/(?:quin|que) dia.*(?:mes fred|mes baixa temperatura)/.test(q);
  const bestIntent=/(?:quin|que) dia.*(?:millor|mes bo|ideal|recomanable)/.test(q);
  if(!rainIntent&&!windIntent&&!warmIntent&&!coldIntent&&!bestIntent)return null;
  const period=requestedPeriod(question,daily);
  const fallback=(daily?.time||[]).map((_,index)=>index).slice(0,7);
  const indices=period.type==='range'?period.indices:period.type==='day'?[period.index]:fallback;
  const days=indices.map(index=>forecastDayFromDaily(daily,index)).filter(Boolean);
  if(!days.length)return response('No hi ha prou horitzó','No tinc dies disponibles dins del període demanat per poder-los comparar.',{sources:[source('Open‑Meteo','Horitzó insuficient')]});
  const by=(selector,direction='max')=>[...days].sort((a,b)=>direction==='min'?selector(a)-selector(b):selector(b)-selector(a))[0];
  let selected,reason,title;
  if(rainIntent){
    selected=by(day=>(day.rain??0)*100+(day.rainChance??0));
    title=`El dia amb més pluja prevista és ${dayTitle(selected.date)}`;
    reason=`És el dia amb més acumulació prevista (${fmt(selected.rain)} mm) i una probabilitat màxima del ${fmt(selected.rainChance,0)}%.`;
  }else if(windIntent){
    selected=by(day=>day.gust??0);title=`El dia més ventós és ${dayTitle(selected.date)}`;reason=`La ratxa màxima prevista arriba als ${fmt(selected.gust,0)} km/h.`;
  }else if(warmIntent||coldIntent){
    selected=by(day=>day.max??(coldIntent?Infinity:-Infinity),coldIntent?'min':'max');title=`El dia ${coldIntent?'més fred':'més càlid'} és ${dayTitle(selected.date)}`;reason=`La temperatura prevista va de ${fmt(selected.min)} a ${fmt(selected.max)} °C.`;
  }else{
    const activity=activityFromQuestion(question);
    const score=day=>{
      const comfort=Math.abs(((day.max??22)+(day.min??16))/2-20);
      const rainPenalty=(day.rainChance??0)*.65+(day.rain??0)*9;
      const windPenalty=(day.gust??0)*(activity?.key==='bike'?1.15:.7);
      const heatPenalty=Math.max(0,(day.max??20)-29)*7;
      return rainPenalty+windPenalty+comfort+heatPenalty;
    };
    selected=by(score,'min');title=`El dia més favorable és ${dayTitle(selected.date)}`;reason=`És el millor equilibri del període entre pluja (${fmt(selected.rainChance,0)}%), ratxes (${fmt(selected.gust,0)} km/h) i temperatura (${fmt(selected.min)}–${fmt(selected.max)} °C).`;
  }
  const condition=weatherCodes[selected.code]||'temps variable';
  const facts=days.map(day=>`${shortDay(day.date)} · ${weatherCodes[day.code]||'variable'} · ${fmt(day.rain)} mm · ratxa ${fmt(day.gust,0)} km/h`);
  const selectedWeekday=new Intl.DateTimeFormat('ca-ES',{weekday:'long'}).format(dateAt(selected.date));
  return response(title,`A ${place}, s’espera ${condition}. ${reason}${extra}`,{level:(selected.rainChance??0)>=70||(selected.gust??0)>=50?'caution':'info',facts,sources:[source('Open‑Meteo',`${place} · comparació del període`)],followups:[`I ${selectedWeekday} concretament?`,'Quin dia farà més vent?']});
}

function forecastFromDaily(daily,question,place='Sant Celoni',extra=''){
  const ranked=rankedDayAnswer(daily,question,place,extra);if(ranked)return ranked;
  const period=requestedPeriod(question,daily);
  if(period.type==='day')return dailyAnswer(daily,period.index,place,extra);
  if(period.type==='range')return rangeAnswer(daily,period.indices,place,period.label,extra);
  if(period.type==='missing')return null;
  return dailyAnswer(daily,0,place,extra);
}

async function forecastAnswer(context,question,services){
  const local=forecastFromDaily(context.forecast?.daily,question,'Sant Celoni');
  if(local)return local;
  try{
    const {weather}=await services.fetchLocalityWeather('Sant Celoni');
    return forecastFromDaily(weather.daily,question,'Sant Celoni')||response('Horitzó no disponible','La data demanada queda fora dels 14 dies disponibles.',{sources:[source('Open‑Meteo','Horitzó màxim de 14 dies')]});
  }catch{
    return response('Predicció pendent','Encara no tinc prou horitzó per respondre aquesta data. Torna-ho a provar més endavant.',{sources:[source('Open‑Meteo','Predicció no disponible')]});
  }
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

function alertHistoryIntent(question){
  const q=normalize(question);
  return /(?:quants?|nombre|total|historic|historial|ha hagut|hi va haver|passats?|darrer|ultim|mes frequent).*(?:avis|alert)|(?:avis|alert).*(?:quants?|historic|historial|ha hagut|hi va haver|passats?|darrer|ultim|mes frequent)/.test(q);
}

async function alertHistoryAnswer(question,services){
  const q=normalize(question);const currentYear=String(new Date().getFullYear());const explicitYear=q.match(/\b(?:19|20|21)\d{2}\b/)?.[0];
  const filters={page:1,pageSize:20,year:explicitYear||(/aquest any|enguany/.test(q)?currentYear:'')};
  if(/vermell/.test(q))filters.level='red';else if(/taronj/.test(q))filters.level='orange';else if(/groc|groga/.test(q))filters.level='yellow';
  try{
    const payload=await services.fetchAlertHistory(filters);const stats=payload.stats||{};const total=Number(stats.total)||0;const period=filters.year?` durant ${filters.year}`:' dins de l’arxiu';
    if(!total)return response('Cap episodi amb aquests criteris',`No hi ha avisos registrats${period}${filters.level?` amb nivell ${alertLevelLabel(filters.level).toLowerCase()}`:''}. Això descriu l’arxiu propi, no la situació activa actual.`,{sources:[source('Historial d’avisos','Consulta filtrada de l’arxiu')],followups:['Hi ha avisos actius?','Quants avisos hi ha hagut aquest any?']});
    const latest=payload.items?.[0];
    if(/darrer|ultim/.test(q)&&latest)return response('Darrer episodi registrat',`El darrer avís de l’arxiu és «${latest.phenomenon||latest.title||'avís meteorològic'}», de nivell ${alertLevelLabel(latest.level).toLowerCase()}, iniciat el ${dateLabelForAnswer(latest.started_at)}.`,{facts:[`Organisme · ${latest.source||'AEMET'}`,latest.expires_at?`Final previst · ${dateLabelForAnswer(latest.expires_at)}`:null].filter(Boolean),sources:[source('Historial d’avisos','Darrer registre del Worker')],followups:['Quants avisos hi ha hagut aquest any?','Hi ha avisos actius?']});
    const levelText=filters.level?` de nivell ${alertLevelLabel(filters.level).toLowerCase()}`:'';const top=stats.topPhenomenon?` El fenomen més freqüent és «${stats.topPhenomenon}».`:'';
    return response(`${total} ${total===1?'episodi registrat':'episodis registrats'}`,`L’arxiu conté ${total} ${total===1?'avís':'avisos'}${levelText}${period}.${top} Són episodis desats pel Worker i no s’han de confondre amb els avisos actius.`,{facts:[`Dies diferents amb avís · ${Number(stats.alertDays)||0}`,`Taronja o vermell · ${Number(stats.severe)||0}`,`Vermells · ${Number(stats.red)||0}`],sources:[source('Historial d’avisos',filters.year?`Estadístiques de ${filters.year}`:'Estadístiques completes')],followups:['Quan va ser l’últim avís?','Hi ha avisos actius?']});
  }catch{
    return response('Historial temporalment no disponible','No he pogut consultar l’arxiu d’avisos. La situació activa continua disponible a la pàgina d’Avisos.',{level:'warning',sources:[source('Historial d’avisos','Consulta no disponible')]});
  }
}

function dateLabelForAnswer(value){const date=new Date(value);return Number.isNaN(date.getTime())?'una data no disponible':new Intl.DateTimeFormat('ca-ES',{dateStyle:'long',timeStyle:'short',timeZone:'Europe/Madrid'}).format(date);}

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

function stationEphemerisAnswer(context){
  const now=new Date();const month=now.getMonth();const day=now.getDate();
  const matches=(context.history||[]).filter(item=>{const date=new Date(Number(item.t));return Number.isFinite(date.getTime())&&date.getFullYear()<now.getFullYear()&&date.getMonth()===month&&date.getDate()===day;});
  if(!matches.length){const events=meteorologicalEphemeridesForDate(now,3);const exact=events.find(item=>item.exact);return response(exact?'Tal dia com avui, a la història del temps':'Curiositats meteorològiques properes a avui',`Fontanillas encara no té una observació d’aquesta data en anys anteriors. Per no deixar l’espai buit, et mostro episodis documentats per Meteocat o rècords verificats per l’OMM; no són dades de l’estació local.`,{facts:events.map(item=>`${ephemerisDateLabel(item)} de ${item.year} · ${item.title} · ${item.scope}`),sources:events.map(item=>source(`${item.source} · Efemèrides`,item.title,item.url)),followups:['Com ha canviat la temperatura?','On puc consultar dades meteorològiques oficials?']});}
  const byYear=new Map();matches.forEach(item=>{const year=new Date(Number(item.t)).getFullYear();if(!byYear.has(year))byYear.set(year,[]);byYear.get(year).push(item);});
  const facts=[...byYear.entries()].sort((a,b)=>b[0]-a[0]).slice(0,6).map(([year,items])=>{const temperatures=items.flatMap(item=>[n(item.temperatureMax),n(item.temperature),n(item.temperatureMin)]).filter(value=>value!==null);const rain=items.reduce((sum,item)=>sum+(n(item.rainIncrement)??0),0);return `${year} · ${temperatures.length?`${fmt(Math.min(...temperatures))}–${fmt(Math.max(...temperatures))} °C`:'temperatura no disponible'} · ${fmt(rain)} mm`;});
  const allTemperatures=matches.flatMap(item=>[n(item.temperatureMax),n(item.temperature),n(item.temperatureMin)]).filter(value=>value!==null);
  return response('Un dia com avui a Fontanillas',`He trobat ${byYear.size} ${byYear.size===1?'any comparable':'anys comparables'} dins de l’arxiu propi.${allTemperatures.length?` El rang observat és de ${fmt(Math.min(...allTemperatures))} a ${fmt(Math.max(...allTemperatures))} °C.`:''} Són dades de l’estació, no una normal climatològica oficial.`,{facts,sources:[source('Arxiu Fontanillas',`${matches.length} observacions comparables`),source('AEMET · Dades climatològiques','Efemèrides oficials d’Espanya')],followups:['Quin és el rècord de temperatura?','Com ha canviat la temperatura?']});
}

const knowledgeTopics=[
  {test:/\bdana\b/,title:'Què és una DANA?',body:'Una DANA és una depressió aïllada en nivells alts: una bossa d’aire fred separada de la circulació principal. No implica sempre aiguats, però pot afavorir inestabilitat intensa si coincideix amb aire càlid i humit a capes baixes.',facts:['No és sinònim de tempesta ni de gota freda','L’impacte depèn de la posició, la humitat i el relleu','Els avisos oficials són la referència per valorar el risc']},
  {test:/front fred|front calent|\bfronts?\b/,title:'Com funciona un front?',body:'Un front és la zona de transició entre dues masses d’aire amb propietats diferents. En un front fred l’aire fred avança i força l’aire càlid a pujar; en un front càlid, l’aire càlid llisca progressivament sobre el fred.',facts:['Front fred · canvi sovint més brusc','Front càlid · nuvolositat més extensa i progressiva','La intensitat real depèn de la humitat i l’estabilitat']},
  {test:/isobara|pressio atmosferica|anticiclo|borrasca/,title:'Pressió, isòbares i vent',body:'Les isòbares uneixen punts amb la mateixa pressió atmosfèrica. Quan estan molt juntes indiquen un gradient de pressió més fort i, habitualment, més vent. Un anticicló no garanteix sempre sol, ni una borrasca implica pluja a tot arreu.',facts:['Pressió alta o baixa és relativa a l’entorn','Isòbares juntes · gradient més intens','El relleu pot modificar molt el vent local']},
  {test:/punt de rosada|humitat relativa/,title:'Humitat i punt de rosada',body:'La humitat relativa indica com de prop és l’aire de la saturació a la temperatura actual. El punt de rosada és la temperatura a la qual l’aire se saturaria; és més útil per saber quanta humitat real hi ha i si pot formar-se condensació.',facts:['Humitat relativa alta no sempre significa més vapor','Punt de rosada pròxim a la temperatura · aire gairebé saturat','La boira o la rosada necessiten també condicions locals favorables']},
  {test:/probabilitat de pluja|percentatge de pluja|\bpop\b/,title:'Què vol dir la probabilitat de pluja?',body:'És la probabilitat que hi hagi precipitació mesurable en un punt de la zona i durant el període indicat. Un 60% no vol dir que plourà el 60% del temps ni sobre el 60% del territori.',facts:['Probabilitat i quantitat prevista són variables diferents','Cal mirar també intensitat, acumulació i horari','En ruixats locals la distribució pot ser molt irregular']},
  {test:/radar.*satel|satel.*radar|radar meteorologic/,title:'Radar i satèl·lit no mostren el mateix',body:'El radar estima precipitació i moviment dels ecos a prop de la superfície; el satèl·lit observa núvols i propietats de l’atmosfera des de l’espai. Per saber si plou ara, el radar és més directe; per entendre l’estructura nuvolosa, el satèl·lit aporta més context.',facts:['Radar · precipitació estimada','Satèl·lit · núvols i masses d’aire','Cap dels dos substitueix una observació a terra']},
  {test:/model|ensemble|conjunt|incertesa/,title:'Models i incertesa meteorològica',body:'Un model meteorològic calcula l’evolució de l’atmosfera a partir d’un estat inicial. Els conjunts o ensembles repeteixen el càlcul amb petites variacions: si les solucions divergeixen, la incertesa és més alta.',facts:['Una sortida única no és una certesa','El conjunt ajuda a veure escenaris i probabilitats','La fiabilitat disminueix amb l’horitzó temporal']},
  {test:/tipus de nuvol|nuvols|cirrus|cumulonimbus/,title:'Com s’identifiquen els núvols?',body:'Els núvols es classifiquen per forma, altura i evolució. Cirrus són núvols alts de cristalls de gel; cúmuls tenen desenvolupament vertical; un cumulonimbus és un núvol de tempesta amb gran extensió vertical.',facts:['La classificació internacional és de l’OMM','Forma i evolució importen tant com l’altura','Un núvol per si sol no basta per fer una previsió']},
  {test:/boira|boirina|visibilitat/,title:'Com es forma la boira?',body:'La boira és un núvol en contacte amb el terra. Sol aparèixer quan l’aire pròxim a la superfície es refreda fins al punt de rosada o rep prou humitat; el vent, el relleu i l’estat del sòl en determinen la persistència.',facts:['Temperatura i punt de rosada pròxims afavoreixen la boira','Una mica de vent pot formar-la o dissipar-la segons la situació','Al Baix Montseny el relleu crea diferències locals importants']},
  {test:/inversio termica|inversio de temperatura/,title:'Què és una inversió tèrmica?',body:'Normalment la temperatura baixa amb l’altura. En una inversió passa al revés durant una capa: l’aire fred queda atrapat a baix i l’aire més càlid a sobre. És freqüent en nits serenes i amb poc vent.',facts:['Pot afavorir boira i glaçada a les fondalades','Pot retenir contaminació a prop del terra','El sol i el vent acostumen a trencar-la']},
  {test:/tempesta|llamp|tro|calamarsa/,title:'Tempestes, llamps i calamarsa',body:'Una tempesta necessita aire humit, inestabilitat i un mecanisme que faci pujar l’aire. Els llamps indiquen fortes càrregues elèctriques dins del núvol; la calamarsa es forma en corrents ascendents intensos.',facts:['El radar i la xarxa de llamps ajuden a seguir-ne el moviment','La intensitat pot variar molt en pocs quilòmetres','Davant un avís oficial, cal seguir Protecció Civil']},
  {test:/sensacio termica|xafogor|index de calor/,title:'Sensació tèrmica i xafogor',body:'La sensació tèrmica estima com percep el cos la temperatura combinant altres variables. Amb calor, la humitat dificulta que la suor s’evapori i augmenta la xafogor; amb fred, el vent accelera la pèrdua de calor.',facts:['No és una temperatura mesurada directament','Sol i activitat física també modifiquen la percepció','En calor intensa, hidrata’t i evita les hores centrals']},
  {test:/ratxa|velocitat del vent|direccio del vent/,title:'Vent mitjà, ratxa i direcció',body:'El vent mitjà resumeix la velocitat durant un interval; la ratxa és un màxim breu i pot ser molt superior. La direcció indica d’on ve el vent, no cap on va.',facts:['Una ratxa descriu un pic curt','El relleu i els edificis poden accelerar o desviar el vent','Per activitats a l’exterior convé mirar sobretot les ratxes']},
  {test:/radiacio solar|index uv|ultraviolada/,title:'Radiació solar i índex UV',body:'La radiació solar mesura l’energia que arriba del Sol. L’índex UV resumeix el risc de radiació ultraviolada per a la pell i els ulls; pot ser elevat fins i tot amb temperatura moderada.',facts:['UV 3 o més ja recomana protecció','Els núvols no sempre bloquegen tota la radiació UV','Ombra, roba, ulleres i protector solar redueixen l’exposició']}
];

function meteorologyKnowledgeAnswer(question){
  const q=normalize(question);const topic=knowledgeTopics.find(item=>item.test.test(q));if(!topic)return null;
  const cloud=/nuvol|cirrus|cumulonimbus/.test(q);
  return response(topic.title,topic.body,{facts:topic.facts,sources:[source('AEMET · MeteoGlosario','Definicions meteorològiques visuals'),...(cloud?[source('Atles de Núvols · OMM','Classificació internacional oficial')]:[])],followups:['On puc consultar dades meteorològiques oficials?','Quina temperatura fa ara?']});
}

function sourceGuideAnswer(){
  return response('Fonts meteorològiques fiables, segons què busquis','Per consultar el temps amb criteri, separa observació, predicció, avisos i climatologia. Aquest portal enllaça cada resposta amb la seva font i evita presentar un model com si fos una observació.',{facts:['Ara a Sant Celoni · Sensor Fontanillas i xarxes oficials','Avisos · AEMET, Meteocat i Protecció Civil','Dades reutilitzables · AEMET OpenData i Dades Obertes de Meteocat','Climatologia i efemèrides · serveis climàtics d’AEMET','Núvols i fenòmens · Atles Internacional de l’OMM'],sources:[source('AEMET OpenData','Catàleg i API reutilitzable'),source('Meteocat · Dades obertes','XEMA, prediccions i atles climàtic'),source('AEMET · Dades climatològiques','Normals, extrems i efemèrides'),source('Atles de Núvols · OMM','Classificació oficial')],followups:['Què és una DANA?','Efemèrides de l’estació']});
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
  const activity=q.includes('bicicleta')||q.includes('bici')?'anar amb bicicleta':q.includes('correr')||q.includes('running')?'córrer':q.includes('excurs')||q.includes('muntanya')?'fer una excursió':q.includes('nens')||q.includes('famil')?'fer una activitat familiar':'fer activitat a l’exterior';
  const alerts=activeAlerts(context);const daily=context.forecast?.daily;const period=requestedPeriod(question,daily);const indices=period.type==='range'?period.indices:period.type==='day'?[period.index]:[0];
  const days=indices.map(index=>forecastDayFromDaily(daily,index)).filter(Boolean);const day=days[0]||forecastDay(context,0);const current=context.current||{};const env=context.environment||{};
  const future=indices.some(index=>index>0)||period.type==='range';const label=period.type==='range'?period.label:period.type==='day'?period.label:'ara';
  const maxRain=Math.max(...(days.length?days:[day]).filter(Boolean).map(item=>item.rainChance??0));const maxGust=Math.max(...(days.length?days:[day]).filter(Boolean).map(item=>item.gust??0));const maxTemp=Math.max(...(days.length?days:[day]).filter(Boolean).map(item=>item.max??-Infinity));const maxUv=Math.max(...(days.length?days:[day]).filter(Boolean).map(item=>item.uv??0));
  const blockers=[];const cautions=[];
  if(alerts?.count)blockers.push(`${alerts.count} ${alerts.count===1?'avís oficial actiu':'avisos oficials actius'}`);
  if(maxRain>=70)cautions.push(`${fmt(maxRain,0)}% de probabilitat de pluja`);
  if((future?maxGust:(day?.gust??n(current.windGust)??0))>=45)cautions.push(`ratxes de fins a ${fmt(future?maxGust:(day?.gust??current.windGust),0)} km/h`);
  if((future?maxTemp:(n(current.temperature)??day?.max??0))>=32)cautions.push('calor marcada');
  if((future?maxUv:(n(env.uv)??day?.uv??0))>=7)cautions.push(`UV ${fmt(future?maxUv:(n(env.uv)??day?.uv),0)}`);
  if((n(env.european_aqi)??0)>60)cautions.push('qualitat de l’aire desfavorable');
  const facts=days.map(item=>`${shortDay(item.date)} · ${fmt(item.max,0)}°/${fmt(item.min,0)}° · pluja ${fmt(item.rainChance,0)}% · ratxa ${fmt(item.gust,0)} km/h`);
  const forecastSource=source('Open‑Meteo',future?`Predicció per ${label}`:'Predicció d’avui');
  if(blockers.length)return response(`No recomano ${activity} sense revisar els avisos`,`Hi ha ${blockers.join(' i ')}. Prioritza les instruccions d’AEMET, Meteocat i Protecció Civil; si l’activitat és de muntanya, ajorna-la quan l’avís afecti el fenomen o la zona.`,{level:'warning',facts:[...cautions,...facts],sources:[source('AEMET · Meteocat','Avisos oficials'),forecastSource]});
  if(cautions.length)return response(`Possible ${label}, però amb precaucions`,`Per ${activity}, tingues en compte ${cautions.join(', ')}. Adapta l’horari, porta aigua i protecció, i revisa el radar just abans de sortir.`,{level:'caution',facts,sources:[forecastSource,source('AEMET · Meteocat','Sense avisos actius en la darrera comprovació')],followups:['Quin dia farà millor?','Quin dia plourà més?']});
  return response(`Condicions favorables per ${activity} ${label}`,`Les dades disponibles no mostren cap factor meteorològic destacat per al període demanat. Tot i així, comprova el radar abans de sortir i adapta l’activitat a les condicions reals del lloc.`,{level:'safe',facts,sources:[forecastSource,source('AEMET · Meteocat','Darrera comprovació')],followups:['Quin dia farà millor?','Hi ha avisos actius?']});
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
  const clean=value=>String(value||'')
    .replace(/\s+(?:per\s+)?(?:avui|dem[aà]|aquest cap de setmana|el cap de setmana|aquesta setmana|la setmana que ve|la setmana vinent|la pr[oò]xima setmana|dilluns|dimarts|dimecres|dijous|divendres|dissabte|diumenge)(?:\s.*)?$/i,'')
    .replace(/\s+per\s+(?:anar|fer|sortir)\b.*$/i,'')
    .replace(/^(?:a\s+)?(?:la|el|les|els)\s+/i,'').replace(/^(?:a\s+)?l['’]\s*/i,'').trim();
  const patterns=[
    /(?:quin temps fa|quin temps far[aà]|quina temperatura fa|temps fa|temps far[aà]|previsi[oó]|plour[aà]|plou|avisos?|alertes?)\s+(?:a les|a la|al|a|per a)\s+([^?!.]{2,100})/i,
    /(?:temps|temperatura)\s+(?:a les|a la|al|a|de)\s+([^?!.]{2,100})/i
  ];
  for(const pattern of patterns){const match=raw.match(pattern);if(match){const value=clean(match[1]);if(value&&!/^partir de/i.test(value))return value;}}
  if(/temps|previsi|plour|temperatura|avis|alert|bici|bicicleta|excurs|correr|córrer|muntanya/i.test(raw)){
    const candidates=[...raw.matchAll(/\s(?:a les|a la|a l['’]|al|a|per(?!\s+(?:anar|fer|sortir))|cap a)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’\- ]{1,100}?)(?=\s+(?:avui|dem[aà]|aquest|aquesta|el cap|la setmana|per\s+(?:anar|fer|sortir))|[?!.]|$)/gi)]
      .map(match=>clean(match[1]))
      .filter(value=>value&&!/^(?:anar|fer|sortir|correr|córrer|bici|bicicleta|una? activitat|partir de)\b/i.test(value));
    if(candidates.length)return candidates.at(-1);
  }
  return '';
}

function periodFromQuestion(question){
  const q=normalize(question);
  if(q.includes('cap de setmana'))return {query:'aquest cap de setmana',label:'aquest cap de setmana'};
  if(/setmana que ve|setmana vinent|proxima setmana/.test(q))return {query:'la setmana que ve',label:'la setmana que ve'};
  const weekday=Object.keys(weekdayNames).find(day=>q.includes(day));if(weekday)return {query:weekday,label:weekday};
  if(q.includes('dema'))return {query:'demà',label:'demà'};
  if(q.includes('avui'))return {query:'avui',label:'avui'};
  return null;
}

function activityFromQuestion(question){
  const q=normalize(question);
  if(/bicicleta|\bbici\b|ciclisme|pedalar/.test(q))return {key:'bike',label:'bicicleta'};
  if(/correr|running/.test(q))return {key:'run',label:'córrer'};
  if(/excurs|sender|muntanya|trekking/.test(q))return {key:'hike',label:'excursió'};
  if(/famil|nens/.test(q))return {key:'family',label:'activitat familiar'};
  return null;
}

function activityAdvice(daily,question,activity){
  if(!activity)return '';
  const period=requestedPeriod(question,daily);const indices=period.type==='range'?period.indices:period.type==='day'?[period.index]:[0];
  const days=indices.map(index=>forecastDayFromDaily(daily,index)).filter(Boolean);if(!days.length)return '';
  const maxTemp=Math.max(...days.map(day=>day.max??-Infinity));const rainChance=Math.max(...days.map(day=>day.rainChance??0));const gust=Math.max(...days.map(day=>day.gust??0));
  const cautions=[];
  if(maxTemp>=30)cautions.push('evita les hores centrals i porta prou aigua');
  if(rainChance>=55)cautions.push(activity.key==='bike'?'compta amb ferm mullat i pitjor adherència':'porta protecció per la pluja');
  if(gust>=35)cautions.push(activity.key==='bike'?'vigila especialment el vent lateral':'vigila les ratxes en zones exposades');
  if(!cautions.length)cautions.push('revisa la previsió i el radar just abans de sortir');
  const action=activity.key==='bike'?'anar amb bicicleta':activity.key==='run'?'sortir a córrer':activity.key==='hike'?'fer l’excursió':'fer l’activitat familiar';
  return ` Per ${action}, ${cautions.join('; ')}.`;
}

const localityAlias=name=>['vall daran','val daran'].includes(normalize(name).replace(/['’]/g,''))?'Vielha e Mijaran':name;

async function localityAnswer(name,services,question,{memory=null,activity=null}={}){
  try{
    const requestedName=String(name||'').trim();const lookup=localityAlias(requestedName);
    const {location,weather}=await services.fetchLocalityWeather(lookup);
    const current=weather.current||{};const daily=weather.daily||{};
    const place=[location.name,location.admin1,location.country].filter(Boolean).join(' · ');
    const isAran=lookup!==requestedName;const displayName=isAran?`Vall d’Aran · ${location.name}`:location.name;
    if(memory){memory.location={query:isAran?requestedName:location.name,label:displayName,country:location.country||'',local:false};saveMemory(memory);}
    const period=requestedPeriod(question,daily);
    const future=/setmana|dilluns|dimarts|dimecres|dijous|divendres|dissabte|diumenge|avui|dema|demà|cap de setmana|farà|fara|plourà|ploura/i.test(question);
    if(future||period.type==='day'||period.type==='range'){
      const caveat=`${activityAdvice(daily,question,activity)} Aquesta consulta no verifica els avisos oficials de ${location.country||'la zona'}.`;
      return forecastFromDaily(daily,question,displayName,caveat)||response('Horitzó no disponible','La data demanada queda fora dels 14 dies disponibles.',{sources:[source('Open‑Meteo',`${place} · horitzó de 14 dies`)]});
    }
    const condition=weatherCodes[n(current.weather_code)]||'temps variable';
    return response(`Temps a ${location.name}`,`Ara hi ha ${condition} i ${fmt(current.temperature_2m)} °C, amb una sensació de ${fmt(current.apparent_temperature)} °C. Per avui s’espera una màxima de ${fmt(daily.temperature_2m_max?.[0])} °C, una mínima de ${fmt(daily.temperature_2m_min?.[0])} °C i un ${fmt(daily.precipitation_probability_max?.[0],0)}% de probabilitat màxima de pluja. Aquesta consulta no verifica els avisos oficials de ${location.country||'la zona'}.`,{facts:[`Humitat · ${fmt(current.relative_humidity_2m,0)}%`,`Vent · ${fmt(current.wind_speed_10m)} km/h`,`Ratxa · ${fmt(current.wind_gusts_10m)} km/h`],sources:[source('Open‑Meteo',`${place} · ${timeLabel(current.time)}`)],followups:['Quin temps fa a Fontanillas?','Hi ha avisos a Sant Celoni?']});
  }catch(error){
    const missing=String(error?.message).includes('LOCALITY_NOT_FOUND');
    return response(missing?'No he trobat aquesta població':'Consulta temporalment no disponible',missing?`No he pogut identificar «${name}». Prova d’escriure el municipi i la comarca o el país.`:'Open‑Meteo no ha respost. Torna-ho a provar d’aquí uns instants.',{sources:[source('Open‑Meteo','Geocodificació i predicció')]});
  }
}

function shouldUseConversation(q){return /\bhi\b|alla|aquella zona|quin temps|quin dia|temps fa|temps fara|previsi|plour|temperatura|vent|calor|fred|humitat|avui|dema|setmana|cap de setmana|dilluns|dimarts|dimecres|dijous|divendres|dissabte|diumenge|concretament/.test(q);}

export async function answerMeteoQuestion(question,context=state,services={fetchLocalityWeather,fetchNearbyStations,fetchAlertHistory},memory=null){
  const q=normalize(question);
  if(/on (puc|es pot)|on consultar|quina font|fonts fiables|d on treure|dades obertes|informacio meteorologica/.test(q))return sourceGuideAnswer();
  if(/efemer|un dia com avui|record historic|record meteorologic|curiositat meteorologica/.test(q))return stationEphemerisAnswer(context);
  const knowledge=meteorologyKnowledgeAnswer(question);if(knowledge)return knowledge;
  const explicitLocality=localityFromQuestion(question);
  const explicitPeriod=periodFromQuestion(question);const explicitActivity=activityFromQuestion(question);
  if(memory&&explicitPeriod)memory.period=explicitPeriod;if(memory&&explicitActivity)memory.activity=explicitActivity;
  const inheritedLocation=!explicitLocality&&memory?.location&&shouldUseConversation(q)?memory.location.query:'';
  const locality=explicitLocality||inheritedLocation;
  const effectiveActivity=explicitActivity||memory?.activity||null;
  const resolvedQuestion=!explicitPeriod&&memory?.period&&shouldUseConversation(q)?`${question} ${memory.period.query}`:question;
  if(locality&&!['sant celoni','fontanillas','montseny','baix montseny'].some(name=>normalize(locality).includes(name))){
    if(/avis|alert/.test(q))return response(`Avisos de ${locality} no verificats`,`Meteo IA encara no disposa d’una font oficial territorial normalitzada per verificar avisos fora de Sant Celoni. Consulta AEMET, el servei meteorològic autonòmic i Protecció Civil de la zona.`,{level:'warning',sources:[source('Meteo IA','Cobertura oficial limitada a l’àmbit local')]});
    return localityAnswer(locality,services,resolvedQuestion,{memory,activity:effectiveActivity});
  }
  if(memory&&explicitLocality){memory.location={query:'Sant Celoni',label:'Sant Celoni · Fontanillas',country:'Catalunya',local:true};saveMemory(memory);}
  if(alertHistoryIntent(question))return alertHistoryAnswer(question,services);
  if(/avis|alert|perill/.test(q))return alertsAnswer(context);
  if(/correr|running|excurs|muntanya|famil|nens|sortir|passeig|bicicleta|bici|bon moment/.test(q))return recommendationAnswer(context,resolvedQuestion);
  if(/compar|estacio|mes calor|mes fred|on fa/.test(q))return comparisonAnswer(services);
  if(/aire|contamin|pm2|pm10|pol len|pollen|uv|radiacio/.test(q))return environmentAnswer(context);
  if(/historic|evoluc|canviat|ultimes 24/.test(q))return historyAnswer(context);
  if(/plour|previsi|dema|avui|temps fara|setmana|cap de setmana|dilluns|dimarts|dimecres|dijous|divendres|dissabte|diumenge|quin dia.*(?:millor|vent|calor|fred)/.test(q))return forecastAnswer(context,resolvedQuestion,services);
  if(/temperatura|temps fa|ara|humitat|vent|pressio|pluja actual/.test(q))return currentAnswer(context);
  return {...response('Ampliant la consulta','Interpretaré la pregunta amb el model avançat i les dades meteorològiques disponibles.',{sources:[source('Meteo IA','Processament avançat protegit')]}),needsAI:true};
}

function advancedContext(context){
  const current=context.current?Object.fromEntries(['updated','temperature','feelsLike','humidity','pressure','windSpeed','windGust','windDirection','rainToday','rainRate','solarRadiation','uv','degraded','stale','ageMinutes'].map(key=>[key,context.current[key]])):null;
  const daily=context.forecast?.daily||null;
  return {station:'Fontanillas · Sant Celoni',current,forecast:daily?{time:daily.time,weather_code:daily.weather_code,temperature_2m_max:daily.temperature_2m_max,temperature_2m_min:daily.temperature_2m_min,precipitation_probability_max:daily.precipitation_probability_max,precipitation_sum:daily.precipitation_sum,wind_gusts_10m_max:daily.wind_gusts_10m_max}:null,alerts:context.alerts?{active:context.alerts.active,maxLevel:context.alerts.maxLevel,alerts:context.alerts.alerts}:null,environment:context.environment||null};
}

export async function answerMeteoQuestionAdvanced(question,context=state,services={fetchLocalityWeather,fetchNearbyStations,fetchAlertHistory},memory=null){
  const local=await answerMeteoQuestion(question,context,services,memory);
  if(!local.needsAI)return local;
  try{return await fetchAdvancedMeteoAI(question,advancedContext(context));}
  catch(error){console.warn('Meteo IA avançada no disponible.',error);return response('Puc ajudar-te amb les dades disponibles','No vull inventar una resposta que les fonts no permeten verificar. Puc respondre ara mateix sobre la situació actual, la predicció de 14 dies, els avisos, activitats a l’exterior, altres poblacions o conceptes meteorològics.',{level:'info',sources:[source('Meteo IA','Mode local fiable')],followups:['Quin temps farà demà?','Hi ha avisos actius?','Explica’m què és la boira']});}
}

function createMessage(role,resultOrText){
  const article=document.createElement('article');article.className=`meteo-ai-message is-${role}`;
  if(role==='user'){const p=document.createElement('p');p.textContent=resultOrText;article.append(p);return article;}
  const result=resultOrText;article.classList.add(`is-${result.level||'info'}`);
  const header=document.createElement('header');const mark=document.createElement('span');mark.textContent='IA';const title=document.createElement('strong');title.textContent=result.title;header.append(mark,title);
  const body=document.createElement('p');body.textContent=result.body;article.append(header,body);
  if(result.facts?.length){const facts=document.createElement('ul');facts.className='meteo-ai-facts';result.facts.forEach(value=>{const item=document.createElement('li');item.textContent=value;facts.append(item);});article.append(facts);}
  if(result.sources?.length){const sources=document.createElement('div');sources.className='meteo-ai-sources';const label=document.createElement('span');label.textContent='Fonts';sources.append(label);result.sources.forEach(item=>{const chip=item.href?document.createElement('a'):document.createElement('small');chip.textContent=`${item.label} · ${item.detail}${item.href?' ↗':''}`;if(item.href){chip.href=item.href;if(/^https?:/i.test(item.href)){chip.target='_blank';chip.rel='noreferrer';}}sources.append(chip);});article.append(sources);}
  if(result.followups?.length){const followups=document.createElement('div');followups.className='meteo-ai-followups';result.followups.forEach(value=>{const button=document.createElement('button');button.type='button';button.dataset.aiQuestion=value;button.textContent=value;followups.append(button);});article.append(followups);}
  return article;
}

function updateStatus(){
  const available=[state.current,state.forecast,state.alerts,state.environment,state.history?.length].filter(Boolean).length;
  const status=document.getElementById('meteo-ai-data-status');if(status)status.textContent=available>=4?'Dades principals connectades':`${available}/5 fonts preparades`;
}

function updateConversationUi(){
  const bar=document.getElementById('meteo-ai-context');if(!bar)return;
  const parts=[conversationMemory.location?.label,conversationMemory.period?.label,conversationMemory.activity?.label].filter(Boolean);
  bar.hidden=!parts.length;const copy=bar.querySelector('span');if(copy)copy.textContent=parts.length?`Context actiu · ${parts.join(' · ')}`:'';
}

function resetConversation(){conversationMemory=emptyMemory();saveMemory(conversationMemory);updateConversationUi();}

export function updateMeteoAIContext(patch){Object.assign(state,patch||{});updateStatus();}

async function ask(question){
  const text=String(question||'').trim().slice(0,160);if(!text)return;
  const log=document.getElementById('meteo-ai-messages');const input=document.getElementById('meteo-ai-input');const submit=document.getElementById('meteo-ai-submit');
  log?.append(createMessage('user',text));if(input)input.value='';if(submit){submit.disabled=true;submit.textContent='Consultant…';}
  const pending=document.createElement('div');pending.className='meteo-ai-typing';pending.textContent='Creuant les dades disponibles…';log?.append(pending);log?.scrollTo({top:log.scrollHeight,behavior:'smooth'});
  try{const result=await answerMeteoQuestionAdvanced(text,state,{fetchLocalityWeather,fetchNearbyStations,fetchAlertHistory},conversationMemory);pending.replaceWith(createMessage('assistant',result));updateConversationUi();}
  catch{pending.replaceWith(createMessage('assistant',response('No he pogut completar la consulta','Les dades principals continuen disponibles al portal. Torna-ho a provar d’aquí uns instants.',{level:'warning'})));}
  if(submit){submit.disabled=false;submit.textContent='Preguntar';}log?.scrollTo({top:log.scrollHeight,behavior:'smooth'});input?.focus();
}

export function initMeteoAI(){
  if(initialized||!document.getElementById('meteo-ia'))return;initialized=true;
  const form=document.getElementById('meteo-ai-form');const input=document.getElementById('meteo-ai-input');const log=document.getElementById('meteo-ai-messages');
  form?.addEventListener('submit',event=>{event.preventDefault();ask(input?.value);});
  document.addEventListener('click',event=>{const button=event.target.closest('[data-ai-question]');if(button)ask(button.dataset.aiQuestion);});
  document.getElementById('meteo-ai-clear')?.addEventListener('click',()=>{if(!log)return;resetConversation();log.replaceChildren(createMessage('assistant',response('Conversa nova','Torno a estar a punt. Pregunta’m pel temps, els avisos, una activitat, una efemèride o un concepte meteorològic.',{sources:[source('Meteo IA','Context de sessió esborrat')]})));input?.focus();});
  document.querySelector('[data-ai-clear-context]')?.addEventListener('click',()=>{resetConversation();input?.focus();});
  document.addEventListener('observatori:alerts-updated',event=>updateMeteoAIContext({alerts:event.detail}));
  document.addEventListener('observatori:environment-updated',event=>updateMeteoAIContext({environment:event.detail}));
  updateStatus();updateConversationUi();
}

async function hydrateWidgetContext(){
  const jobs=[];
  if(!state.current)jobs.push(fetchCurrentWeather().then(current=>updateMeteoAIContext({current})).catch(()=>null));
  if(!state.forecast)jobs.push(fetchForecast().then(forecast=>updateMeteoAIContext({forecast})).catch(()=>null));
  if(!state.alerts)jobs.push(fetchAlerts().then(alerts=>updateMeteoAIContext({alerts})).catch(()=>null));
  if(jobs.length)await Promise.all(jobs);
}

export function initMeteoAIWidget(){
  if(document.getElementById('meteo-ai-widget'))return;
  const root=document.createElement('aside');root.className='meteo-ai-widget';root.id='meteo-ai-widget';
  const toggle=document.createElement('button');toggle.className='meteo-ai-widget__toggle';toggle.type='button';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','meteo-ai-widget-panel');toggle.setAttribute('aria-label','Obrir el xat ràpid de Meteo IA');toggle.innerHTML='<span>IA</span><b>Pregunta al temps</b>';
  const panel=document.createElement('div');panel.className='meteo-ai-widget__panel';panel.id='meteo-ai-widget-panel';panel.hidden=true;
  panel.innerHTML='<header><span><i></i><b>Meteo IA</b><small>Una pregunta ràpida</small></span><button type="button" aria-label="Tancar el xat">×</button></header><div class="meteo-ai-widget__messages"><p>Pregunta pel temps, una data concreta o qualsevol ciutat del món.</p></div><form><label for="meteo-ai-widget-input">Pregunta meteorològica</label><div><input id="meteo-ai-widget-input" type="text" maxlength="160" autocomplete="off" placeholder="Ex.: Divendres plourà a Sant Celoni?" required><button type="submit">Enviar</button></div></form><a class="meteo-ai-widget__continue" href="./?page=meteo-ia" hidden>Continuar a Meteo IA →</a>';
  root.append(panel,toggle);document.body.append(root);
  const close=()=>{panel.hidden=true;toggle.setAttribute('aria-expanded','false');};
  const open=()=>{panel.hidden=false;toggle.setAttribute('aria-expanded','true');panel.querySelector('input')?.focus();};
  toggle.addEventListener('click',()=>panel.hidden?open():close());panel.querySelector('header button')?.addEventListener('click',close);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)close();});
  panel.querySelector('form')?.addEventListener('submit',async event=>{
    event.preventDefault();const form=event.currentTarget;const input=form.querySelector('input');const button=form.querySelector('button');const messages=panel.querySelector('.meteo-ai-widget__messages');const question=String(input?.value||'').trim();if(!question)return;
    button.disabled=true;button.textContent='Consultant…';messages.replaceChildren();const user=createMessage('user',question);const typing=document.createElement('div');typing.className='meteo-ai-typing';typing.textContent='Comprovant dades…';messages.append(user,typing);
    await hydrateWidgetContext();
    const result=await answerMeteoQuestionAdvanced(question,state,{fetchLocalityWeather,fetchNearbyStations,fetchAlertHistory},conversationMemory);const answer=createMessage('assistant',result);answer.querySelector('.meteo-ai-followups')?.remove();typing.replaceWith(answer);form.hidden=true;panel.querySelector('.meteo-ai-widget__continue').hidden=false;
  });
  panel.querySelector('.meteo-ai-widget__continue')?.addEventListener('click',event=>{if(document.body.dataset.page==='meteo-ia'){event.preventDefault();close();document.getElementById('meteo-ai-input')?.scrollIntoView({behavior:'smooth',block:'center'});document.getElementById('meteo-ai-input')?.focus();}});
}
