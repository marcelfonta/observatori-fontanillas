import { calculateThermalIndices } from './confort.js';

let charts = [];
let sparklines = [];
const palette = { grid: 'rgba(197,231,208,.07)', text: '#71877e', green: '#89d6a3', blue: '#77b7c8' };
function makeChart(canvas, labels, datasets, unit, showLegend = false) {
  if (!window.Chart || !canvas) return null;
  const normalized=datasets.map(dataset=>({...dataset,tension:.42,borderWidth:2,pointRadius:labels.length<3?3:0,spanGaps:true}));
  return new Chart(canvas, { type:'line', data:{ labels, datasets:normalized }, options:{responsive:true,maintainAspectRatio:false,interaction:{intersect:false,mode:'index'},plugins:{legend:{display:showLegend,position:'bottom',align:'start',labels:{color:palette.text,usePointStyle:true,boxWidth:7,font:{size:10},padding:18}},tooltip:{backgroundColor:'#0c1b17',borderColor:'rgba(197,231,208,.18)',borderWidth:1,displayColors:true,callbacks:{label:c=>`${c.dataset.label}: ${c.formattedValue} ${unit}`}}},scales:{x:{grid:{display:false},ticks:{color:palette.text,maxTicksLimit:6,font:{size:10}}},y:{border:{display:false},grid:{color:palette.grid},ticks:{color:palette.text,maxTicksLimit:5,font:{size:10},callback:v=>`${v}${unit}`}}}}});
}
export function renderCharts(data, history = [], period='24h') {
  charts.forEach(c=>c?.destroy());
  const duration = period==='24h'?86400000:period==='7d'?604800000:period==='30d'?2592000000:31536000000;
  let selected = history.filter(item => item.t >= Date.now() - duration);
  if (!selected.length) selected = [{t:Date.now(),temperature:Number(data.temperature)||20,pressure:Number(data.pressure)||1013}];
  if (selected.length > 720) {
    const step = Math.ceil(selected.length / 720);
    selected = selected.filter((_,index)=>index % step === 0 || index === selected.length - 1);
  }
  const labels=selected.map(item=>new Intl.DateTimeFormat('ca-ES',period==='24h'?{hour:'2-digit',minute:'2-digit'}:{day:'2-digit',month:'short'}).format(new Date(item.t)));
  const temps=selected.map(item=>item.temperature); const dewPoints=selected.map(item=>item.dewPoint); const pressures=selected.map(item=>item.pressure);
  const status=document.getElementById('history-status'); if(status) status.textContent=selected.length>1?`${selected.length} lectures reals`:'Recollint dades';
  charts=[makeChart(document.getElementById('temperature-chart'),labels,[{label:'Temperatura',data:temps,borderColor:palette.green,backgroundColor:`${palette.green}16`,fill:true},{label:'Punt de rosada',data:dewPoints,borderColor:palette.blue,backgroundColor:'transparent',borderDash:[5,5],fill:false}],'°C',true),makeChart(document.getElementById('pressure-chart'),labels,[{label:'Pressió',data:pressures,borderColor:palette.blue,backgroundColor:`${palette.blue}16`,fill:true}],' hPa')];
}

function makeSparkline(canvas, points, label, unit, color) {
  if (!window.Chart || !canvas || points.length < 2) return null;
  const labels = points.map(item => new Intl.DateTimeFormat('ca-ES', { hour:'2-digit', minute:'2-digit' }).format(new Date(item.t)));
  return new Chart(canvas, {
    type:'line',
    data:{labels,datasets:[{label,data:points.map(item=>item.value),borderColor:color,backgroundColor:`${color}18`,borderWidth:1.6,tension:.4,fill:true,pointRadius:0,pointHoverRadius:3,spanGaps:true}]},
    options:{responsive:true,maintainAspectRatio:false,interaction:{intersect:false,mode:'nearest'},plugins:{legend:{display:false},tooltip:{displayColors:false,backgroundColor:'#0c1b17',borderColor:'rgba(197,231,208,.18)',borderWidth:1,titleFont:{size:9},bodyFont:{size:10},callbacks:{label:context=>`${context.formattedValue} ${unit}`}}},scales:{x:{display:false},y:{display:false}}}
  });
}

export function renderMetricSparklines(data, history = []) {
  sparklines.forEach(chart => chart?.destroy());
  const since = Date.now() - 86400000;
  const recent = history.filter(item => item.t >= since).slice(-24);
  const definitions = [
    ['spark-temperature',item=>item.temperature,'Temperatura','°C',palette.green],
    ['spark-humidity',item=>item.humidity,'Humitat','%',palette.blue],
    ['spark-wind',item=>item.windSpeed,'Vent','km/h',palette.green],
    ['spark-pressure',item=>item.pressure,'Pressió','hPa',palette.blue],
    ['spark-rain-total',item=>item.rainTotal,'Pluja acumulada','mm',palette.blue],
    ['spark-rain-rate',item=>item.rainRate,'Intensitat','mm/h',palette.blue],
    ['spark-solar',item=>item.solarRadiation,'Radiació','W/m²','#e6c56c'],
    ['spark-uv',item=>item.uv,'Índex UV','UV','#e6c56c'],
    ['spark-apparent',item=>calculateThermalIndices(item).apparent,'Sensació tèrmica','°C','#e6c56c'],
    ['spark-humidex',item=>calculateThermalIndices(item).humidex,'Humidex','°C eq.','#e6c56c']
  ];
  sparklines = definitions.map(([id,getter,label,unit,color]) => {
    let points = recent.map(item => ({t:item.t,value:Number(getter(item))})).filter(item => Number.isFinite(item.value));
    const current = Number(getter(data));
    if (points.length < 2 && Number.isFinite(current)) points = [{t:Date.now()-300000,value:current},{t:Date.now(),value:current}];
    return makeSparkline(document.getElementById(id), points, label, unit, color);
  }).filter(Boolean);
}
