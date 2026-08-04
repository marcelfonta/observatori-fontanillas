let charts = [];
const palette = { grid: 'rgba(197,231,208,.07)', text: '#71877e', green: '#89d6a3', blue: '#77b7c8' };
function makeChart(canvas, labels, datasets, unit, showLegend = false) {
  if (!window.Chart || !canvas) return null;
  const normalized=datasets.map(dataset=>({...dataset,tension:.42,borderWidth:2,pointRadius:labels.length<3?3:0,spanGaps:true}));
  return new Chart(canvas, { type:'line', data:{ labels, datasets:normalized }, options:{responsive:true,maintainAspectRatio:false,interaction:{intersect:false,mode:'index'},plugins:{legend:{display:showLegend,position:'bottom',align:'start',labels:{color:palette.text,usePointStyle:true,boxWidth:7,font:{size:10},padding:18}},tooltip:{backgroundColor:'#0c1b17',borderColor:'rgba(197,231,208,.18)',borderWidth:1,displayColors:true,callbacks:{label:c=>`${c.dataset.label}: ${c.formattedValue} ${unit}`}}},scales:{x:{grid:{display:false},ticks:{color:palette.text,maxTicksLimit:6,font:{size:10}}},y:{border:{display:false},grid:{color:palette.grid},ticks:{color:palette.text,maxTicksLimit:5,font:{size:10},callback:v=>`${v}${unit}`}}}}});
}
export function renderCharts(data, history = [], period='24h') {
  charts.forEach(c=>c?.destroy());
  const duration = period==='24h'?86400000:period==='7d'?604800000:2592000000;
  let selected = history.filter(item => item.t >= Date.now() - duration);
  if (!selected.length) selected = [{t:Date.now(),temperature:Number(data.temperature)||20,pressure:Number(data.pressure)||1013}];
  const labels=selected.map(item=>new Intl.DateTimeFormat('ca-ES',period==='24h'?{hour:'2-digit',minute:'2-digit'}:{day:'2-digit',month:'short'}).format(new Date(item.t)));
  const temps=selected.map(item=>item.temperature); const dewPoints=selected.map(item=>item.dewPoint); const pressures=selected.map(item=>item.pressure);
  const status=document.getElementById('history-status'); if(status) status.textContent=selected.length>1?`${selected.length} lectures reals`:'Recollint dades';
  charts=[makeChart(document.getElementById('temperature-chart'),labels,[{label:'Temperatura',data:temps,borderColor:palette.green,backgroundColor:`${palette.green}16`,fill:true},{label:'Punt de rosada',data:dewPoints,borderColor:palette.blue,backgroundColor:'transparent',borderDash:[5,5],fill:false}],'°C',true),makeChart(document.getElementById('pressure-chart'),labels,[{label:'Pressió',data:pressures,borderColor:palette.blue,backgroundColor:`${palette.blue}16`,fill:true}],' hPa')];
}
