let charts = [];
const palette = { grid: 'rgba(197,231,208,.07)', text: '#71877e', green: '#89d6a3', blue: '#77b7c8' };
function series(base, points, amplitude) { return Array.from({length: points}, (_,i) => Number(base) + Math.sin(i/2.7)*amplitude + Math.cos(i/4.8)*amplitude*.35); }
function makeChart(canvas, labels, values, color, unit) {
  if (!window.Chart || !canvas) return null;
  return new Chart(canvas, { type:'line', data:{ labels, datasets:[{data:values,borderColor:color,backgroundColor:`${color}18`,fill:true,tension:.42,borderWidth:2,pointRadius:0}] }, options:{responsive:true,maintainAspectRatio:false,interaction:{intersect:false,mode:'index'},plugins:{legend:{display:false},tooltip:{backgroundColor:'#0c1b17',borderColor:'rgba(197,231,208,.18)',borderWidth:1,displayColors:false,callbacks:{label:c=>`${c.formattedValue} ${unit}`}}},scales:{x:{grid:{display:false},ticks:{color:palette.text,maxTicksLimit:6,font:{size:10}}},y:{border:{display:false},grid:{color:palette.grid},ticks:{color:palette.text,maxTicksLimit:5,font:{size:10},callback:v=>`${v}${unit}`}}}}});
}
export function renderCharts(data, period='24h') {
  charts.forEach(c=>c?.destroy());
  const count = period==='24h'?24:period==='7d'?28:30; const labels=Array.from({length:count},(_,i)=>period==='24h'?`${String(i).padStart(2,'0')} h`:period==='7d'?['Dl','Dt','Dc','Dj','Dv','Ds','Dg'][Math.floor(i/4)%7]:`${i+1}`);
  const temps=series(Number(data.temperature)||20,count,period==='24h'?2.8:5.1); temps[temps.length-1]=Number(data.temperature)||20;
  const pressures=series(Number(data.pressure)||1013,count,3.2); pressures[pressures.length-1]=Number(data.pressure)||1013;
  charts=[makeChart(document.getElementById('temperature-chart'),labels,temps,palette.green,'°C'),makeChart(document.getElementById('pressure-chart'),labels,pressures,palette.blue,' hPa')];
}
