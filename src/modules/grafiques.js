import { calculateThermalIndices } from './confort.js';
import { finiteNumber } from '../core/numeric.js';
import { t, getLocale } from '../core/i18n.js';
import { historyTimestamp, prepareChartHistory } from '../core/history-data.js';

let charts = [];
let sparklines = [];
const dateLabel = (timestamp, compact=false) => new Intl.DateTimeFormat(getLocale(),{timeZone:'Europe/Madrid',...(compact?{}:{day:'2-digit',month:'short'}),hour:'2-digit',minute:'2-digit'}).format(new Date(timestamp));
const palette = { grid: 'rgba(197,231,208,.07)', text: '#71877e', green: '#89d6a3', blue: '#77b7c8', amber:'#e6c56c', violet:'#b98ce8', coral:'#e88f73' };
function makeChart(canvas, labels, datasets, unit, showLegend = false) {
  if (!window.Chart || !canvas) return null;
  const normalized=datasets.map(dataset=>({...dataset,label:t(dataset.label),data:dataset.data.map((y,index)=>({x:labels[index],y:finiteNumber(y)})),tension:0,borderWidth:2,pointRadius:dataset.data.filter(value=>finiteNumber(value)!==null).length<3?3:0,spanGaps:false}));
  const hasValues = datasets.some(dataset=>dataset.data.some(value=>finiteNumber(value)!==null));
  return new Chart(canvas, { type:'line', data:{ labels, datasets:normalized }, options:{responsive:true,maintainAspectRatio:false,interaction:{intersect:false,mode:'index'},plugins:{legend:{display:showLegend,position:'bottom',align:'start',labels:{color:palette.text,usePointStyle:true,boxWidth:6,font:{size:9},padding:12}},tooltip:{backgroundColor:'#0c1b17',borderColor:'rgba(197,231,208,.18)',borderWidth:1,displayColors:true,callbacks:{title:items=>dateLabel(items[0]?.parsed.x),label:c=>`${c.dataset.label}: ${c.formattedValue} ${c.dataset.unit ?? unit}`}}},scales:{x:{display:hasValues,type:'linear',grid:{display:false},ticks:{color:palette.text,maxTicksLimit:5,font:{size:9},callback:v=>dateLabel(v,labels.at(-1)-labels[0]<172800000)}},y:{display:hasValues,border:{display:false},grid:{color:palette.grid},ticks:{color:palette.text,maxTicksLimit:4,font:{size:9},callback:v=>`${v}${unit}`}}}}});
}
export function renderCharts(data, history = [], period='24h') {
  charts.forEach(c=>c?.destroy());
  let prepared = prepareChartHistory(history, period);
  if (!prepared.rows.length) prepared = prepareChartHistory([{...data,t:historyTimestamp(data),rainTotal:data.rainToday}], period);
  const selected = prepared.points;
  const labels=selected.map(item=>item.t);
  const temps=selected.map(item=>item.temperature); const dewPoints=selected.map(item=>item.dewPoint); const pressures=selected.map(item=>item.pressure);
  const humidity=selected.map(item=>item.humidity); const wind=selected.map(item=>item.windSpeed); const gusts=selected.map(item=>item.windGust);
  const rainTotal=selected.map(item=>item.rainAccumulated);
  const rainRate=selected.map(item=>item.rainRate); const uv=selected.map(item=>item.uv);
  const status=document.getElementById('history-status'); if(status) status.textContent=prepared.rows.length>1?`${prepared.rows.length} punts reals`:'Recollint dades';
  charts=[
    makeChart(document.getElementById('temperature-chart'),labels,[{label:'Temperatura',data:temps,borderColor:palette.green,backgroundColor:`${palette.green}16`,fill:true},{label:'Punt de rosada',data:dewPoints,borderColor:palette.blue,backgroundColor:'transparent',borderDash:[5,5],fill:false}],'°C',true),
    makeChart(document.getElementById('pressure-chart'),labels,[{label:'Pressió',data:pressures,borderColor:palette.blue,backgroundColor:`${palette.blue}16`,fill:true}],' hPa'),
    makeChart(document.getElementById('humidity-chart'),labels,[{label:'Humitat',data:humidity,borderColor:palette.blue,backgroundColor:`${palette.blue}16`,fill:true}],' %'),
    makeChart(document.getElementById('wind-chart'),labels,[{label:'Vent mitjà',data:wind,borderColor:palette.green,backgroundColor:`${palette.green}12`,fill:true},{label:'Ratxa',data:gusts,borderColor:palette.amber,backgroundColor:'transparent',borderDash:[5,5],fill:false}],' km/h',true),
    makeChart(document.getElementById('rain-chart'),labels,[{label:'Acumulada registrada (pot ser parcial)',data:rainTotal,unit:'mm',borderColor:palette.blue,backgroundColor:`${palette.blue}16`,fill:true},{label:'Intensitat',data:rainRate,unit:'mm/h',borderColor:palette.violet,backgroundColor:'transparent',borderDash:[5,5],fill:false}],' mm',true),
    makeChart(document.getElementById('uv-chart'),labels,[{label:'Índex UV',data:uv,borderColor:palette.coral,backgroundColor:`${palette.coral}16`,fill:true}],' UV')
  ].filter(Boolean);
}

function makeSparkline(canvas, points, label, unit, color) {
  if (!window.Chart || !canvas || points.filter(item=>item.value !== null).length < 2) return null;
  const labels = points.map(item => new Intl.DateTimeFormat('ca-ES', { hour:'2-digit', minute:'2-digit' }).format(new Date(item.t)));
  return new Chart(canvas, {
    type:'line',
    data:{labels,datasets:[{label,data:points.map(item=>({x:item.t,y:item.value})),borderColor:color,backgroundColor:`${color}18`,borderWidth:1.6,tension:0,fill:true,pointRadius:0,pointHoverRadius:3,spanGaps:false}]},
    options:{responsive:true,maintainAspectRatio:false,interaction:{intersect:false,mode:'nearest'},plugins:{legend:{display:false},tooltip:{displayColors:false,backgroundColor:'#0c1b17',borderColor:'rgba(197,231,208,.18)',borderWidth:1,titleFont:{size:9},bodyFont:{size:10},callbacks:{title:items=>dateLabel(items[0]?.parsed.x),label:context=>`${context.formattedValue} ${unit}`}}},scales:{x:{type:'linear',display:false},y:{display:false}}}
  });
}

export function renderMetricSparklines(data, history = []) {
  sparklines.forEach(chart => chart?.destroy());
  const recent = prepareChartHistory(history, '24h').points.slice(-48);
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
    const points = recent.map(item => ({t:item.t,value:item.gap ? null : finiteNumber(getter(item))}));
    return makeSparkline(document.getElementById(id), points, label, unit, color);
  }).filter(Boolean);
}
