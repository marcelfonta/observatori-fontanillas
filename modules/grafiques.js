let charts = [];
const palette = { grid: 'rgba(197,231,208,.07)', text: '#71877e', green: '#89d6a3', blue: '#77b7c8' };
function makeChart(canvas, labels, values, color, unit) {
  if (!window.Chart || !canvas) return null;
  return new Chart(canvas, { type:'line', data:{ labels, datasets:[{data:values,borderColor:color,backgroundColor:`${color}18`,fill:true,tension:.42,borderWidth:2,pointRadius:0}] }, options:{responsive:true,maintainAspectRatio:false,interaction:{intersect:false,mode:'index'},plugins:{legend:{display:false},tooltip:{backgroundColor:'#0c1b17',borderColor:'rgba(197,231,208,.18)',borderWidth:1,displayColors:false,callbacks:{label:c=>`${c.formattedValue} ${unit}`}}},scales:{x:{grid:{display:false},ticks:{color:palette.text,maxTicksLimit:6,font:{size:10}}},y:{border:{display:false},grid:{color:palette.grid},ticks:{color:palette.text,maxTicksLimit:5,font:{size:10},callback:v=>`${v}${unit}`}}}}});
}
export function renderCharts(data, history = [], period='24h') {
  charts.forEach(c=>c?.destroy());
  const duration = period==='24h'?86400000:period==='7d'?604800000:2592000000;
  let selected = history.filter(item => item.t >= Date.now() - duration);
  if (!selected.length) selected = [{t:Date.now(),temperature:Number(data.temperature)||20,pressure:Number(data.pressure)||1013}];
  const labels=selected.map(item=>new Intl.DateTimeFormat('ca-ES',period==='24h'?{hour:'2-digit',minute:'2-digit'}:{day:'2-digit',month:'short'}).format(new Date(item.t)));
  const temps=selected.map(item=>item.temperature); const pressures=selected.map(item=>item.pressure);
  const status=document.getElementById('history-status'); if(status) status.textContent=selected.length>1?`${selected.length} lectures reals`:'Recollint dades';
  charts=[makeChart(document.getElementById('temperature-chart'),labels,temps,palette.green,'°C'),makeChart(document.getElementById('pressure-chart'),labels,pressures,palette.blue,' hPa')];
}
