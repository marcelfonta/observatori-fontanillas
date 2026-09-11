export const SEASON_TRANSITIONS = [
  { id:'winter-2025', date:'2025-12-21T16:03:00+01:00', season:'Hivern', label:'Solstici d’hivern', symbol:'❄', source:'USNO', sourceUrl:'https://aa.usno.navy.mil/api/seasons?year=2025' },
  { id:'spring-2026', date:'2026-03-20T15:46:00+01:00', season:'Primavera', label:'Equinocci de primavera', symbol:'🌱', source:'USNO', sourceUrl:'https://aa.usno.navy.mil/api/seasons?year=2026' },
  { id:'summer-2026', date:'2026-06-21T10:24:00+02:00', season:'Estiu', label:'Solstici d’estiu', symbol:'☀', source:'USNO', sourceUrl:'https://aa.usno.navy.mil/api/seasons?year=2026' },
  { id:'autumn-2026', date:'2026-09-23T02:05:00+02:00', season:'Tardor', label:'Equinocci de tardor', symbol:'🍂', source:'IGN · Observatori Astronòmic Nacional', sourceUrl:'https://astronomia.ign.es/inicio-estaciones/otono' },
  { id:'winter-2026', date:'2026-12-21T21:50:00+01:00', season:'Hivern', label:'Solstici d’hivern', symbol:'❄', source:'USNO', sourceUrl:'https://aa.usno.navy.mil/api/seasons?year=2026' },
  { id:'spring-2027', date:'2027-03-20T21:24:00+01:00', season:'Primavera', label:'Equinocci de primavera', symbol:'🌱', source:'IGN · Observatori Astronòmic Nacional', sourceUrl:'https://astronomia.ign.es/rknowsys-theme/images/webAstro/paginas/documentos/Agendas_Astronomicas/Agenda_astronomica_2027.pdf' },
  { id:'summer-2027', date:'2027-06-21T16:11:00+02:00', season:'Estiu', label:'Solstici d’estiu', symbol:'☀', source:'IGN · Observatori Astronòmic Nacional', sourceUrl:'https://astronomia.ign.es/rknowsys-theme/images/webAstro/paginas/documentos/Agendas_Astronomicas/Agenda_astronomica_2027.pdf' },
  { id:'autumn-2027', date:'2027-09-23T08:01:00+02:00', season:'Tardor', label:'Equinocci de tardor', symbol:'🍂', source:'IGN · Observatori Astronòmic Nacional', sourceUrl:'https://astronomia.ign.es/rknowsys-theme/images/webAstro/paginas/documentos/Agendas_Astronomicas/Agenda_astronomica_2027.pdf' },
  { id:'winter-2027', date:'2027-12-22T03:42:00+01:00', season:'Hivern', label:'Solstici d’hivern', symbol:'❄', source:'IGN · Observatori Astronòmic Nacional', sourceUrl:'https://astronomia.ign.es/rknowsys-theme/images/webAstro/paginas/documentos/Agendas_Astronomicas/Agenda_astronomica_2027.pdf' },
];

export const ASTRONOMICAL_EVENTS = [
  {
    id:'orionids-2026', date:'2026-10-21T03:00:00+02:00', reminderDate:'2026-10-20',
    forecastStart:'2026-10-21T00:00:00+02:00', forecastEnd:'2026-10-21T06:00:00+02:00',
    title:'Màxim dels Oriònids', badge:'Nit 20–21', symbol:'☄', social:true,
    copy:'La segona meitat de la nit serà la més favorable, després que es pongui la Lluna.',
    source:'IGN · Observatori Astronòmic Nacional', sourceUrl:'https://astronomia.ign.es/orionidas',
  },
  {
    id:'leonids-2026', date:'2026-11-18T00:45:00+01:00', reminderDate:'2026-11-17',
    forecastStart:'2026-11-17T23:00:00+01:00', forecastEnd:'2026-11-18T06:00:00+01:00',
    title:'Màxim dels Leònids', badge:'Nit 17–18', symbol:'☄', social:true,
    copy:'El màxim és previst cap a les 00.45 h; la Lluna es pondrà abans i deixarà el cel més fosc.',
    source:'IGN · Observatori Astronòmic Nacional', sourceUrl:'https://astronomia.ign.es/leonidas',
  },
  {
    id:'geminids-2026', date:'2026-12-14T15:00:00+01:00', reminderDate:'2026-12-13',
    forecastStart:'2026-12-13T20:00:00+01:00', forecastEnd:'2026-12-14T06:00:00+01:00',
    title:'Màxim dels Gemínids', badge:'Nit 13–14', symbol:'✦', social:true,
    copy:'Una de les pluges de meteors més actives de l’any; la Lluna baixa afavorirà l’observació.',
    source:'IGN · Observatori Astronòmic Nacional', sourceUrl:'https://astronomia.ign.es/geminidas',
  },
  {
    id:'quadrantids-2027', date:'2027-01-03T23:00:00+01:00', reminderDate:'2027-01-03',
    forecastStart:'2027-01-03T20:00:00+01:00', forecastEnd:'2027-01-04T06:00:00+01:00',
    title:'Màxim dels Quadràntids', badge:'Finestra curta', symbol:'✦', social:false,
    copy:'Pluja de meteors d’hivern amb un màxim breu; l’hora exacta de 2027 queda pendent de confirmació oficial.',
    source:'IGN · calendari general', sourceUrl:'https://astronomia.ign.es/cuadrantidas',
  },
  {
    id:'lyrids-2027', date:'2027-04-22T23:00:00+02:00', reminderDate:'2027-04-22',
    forecastStart:'2027-04-22T21:00:00+02:00', forecastEnd:'2027-04-23T06:00:00+02:00',
    title:'Màxim dels Lírides', badge:'Primavera', symbol:'☄', social:false,
    copy:'Meteors ràpids visibles millor des de llocs foscos; l’hora exacta de 2027 queda pendent de confirmació oficial.',
    source:'IGN · calendari general', sourceUrl:'https://astronomia.ign.es/liridas',
  },
  {
    id:'solar-eclipse-2027', date:'2027-08-02T10:50:00+02:00', reminderDate:'2027-08-02', reminderTime:'07:30',
    forecastStart:'2027-08-02T09:30:00+02:00', forecastEnd:'2027-08-02T11:30:00+02:00',
    title:'Eclipsi parcial de Sol a Catalunya', badge:'2 d’agost', symbol:'◉', social:true,
    copy:'A Catalunya serà parcial. No s’ha de mirar mai el Sol sense protecció solar homologada.',
    source:'IGN · Observatori Astronòmic Nacional', sourceUrl:'https://astronomia.ign.es/eclipses-de-sol-y-luna/eclipse-total-sol-de-2-de-agosto-2027',
  },
];

export function madridDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Madrid', year:'numeric', month:'2-digit', day:'2-digit' }).format(date);
}

export function shiftCalendarDate(value, days) {
  const date=new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate()+days);
  return date.toISOString().slice(0,10);
}

export function seasonTransitionForDate(date = new Date()) {
  const localDate=madridDateKey(date);
  return SEASON_TRANSITIONS.find(item=>madridDateKey(new Date(item.date))===localDate)||null;
}

export function astronomyEventsForDate(date = new Date(), phase = 'advance') {
  const localDate=madridDateKey(date);
  return ASTRONOMICAL_EVENTS.filter(item=>item.social && (phase==='advance'
    ? shiftCalendarDate(item.reminderDate,-2)===localDate
    : item.reminderDate===localDate));
}

export function astronomyVisibilitySummary(hourly, event) {
  const times=Array.isArray(hourly?.time)?hourly.time:[];
  const start=new Date(event.forecastStart).getTime();
  const end=new Date(event.forecastEnd).getTime();
  const rows=times.map((time,index)=>({
    epoch:new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(String(time))?time:`${time}Z`).getTime(),
    cloud:Number(hourly.cloud_cover?.[index]),
    rainProbability:Number(hourly.precipitation_probability?.[index]),
    precipitation:Number(hourly.precipitation?.[index]),
  })).filter(row=>Number.isFinite(row.epoch)&&row.epoch>=start&&row.epoch<=end
    &&Number.isFinite(row.cloud)&&Number.isFinite(row.rainProbability)&&Number.isFinite(row.precipitation));
  if(rows.length<2)return null;
  const averageCloud=Math.round(rows.reduce((sum,row)=>sum+row.cloud,0)/rows.length);
  const maxRainProbability=Math.round(Math.max(...rows.map(row=>row.rainProbability)));
  const precipitation=Math.round(rows.reduce((sum,row)=>sum+row.precipitation,0)*10)/10;
  return {averageCloud,maxRainProbability,precipitation,hours:rows.length,
    reasonable:averageCloud<=70&&maxRainProbability<=50&&precipitation<=0.5};
}
