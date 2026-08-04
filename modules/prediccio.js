import { format, setText } from '../js/utils.js';

const codes = {
  0:['☀','Cel serè'],1:['🌤','Poc ennuvolat'],2:['⛅','Intervals'],3:['☁','Cobert'],
  45:['≋','Boira'],48:['≋','Boira gebradora'],51:['☂','Plugim'],53:['☂','Plugim'],55:['☂','Plugim intens'],
  61:['🌧','Pluja feble'],63:['🌧','Pluja'],65:['🌧','Pluja intensa'],80:['🌦','Ruixats'],81:['🌦','Ruixats'],82:['⛈','Ruixats forts'],
  95:['⛈','Tempesta'],96:['⛈','Tempesta i calamarsa'],99:['⛈','Tempesta forta']
};

export function renderForecast(data) {
  const strip = document.getElementById('forecast-strip'); if (!strip || !data?.hourly) return;
  const now = Date.now(); let start = data.hourly.time.findIndex(time => new Date(time).getTime() >= now - 1800000); if (start < 0) start = 0;
  const indices = Array.from({length:8},(_,i)=>start+i).filter(i=>data.hourly.time[i]);
  strip.innerHTML = indices.map((index, position) => {
    const time = new Date(data.hourly.time[index]); const [symbol,label] = codes[data.hourly.weather_code[index]] || ['◌','Variable'];
    return `<article class="forecast-item ${position===0?'is-now':''}"><div class="forecast-item__time"><span>${position===0?'Ara':new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit'}).format(time)}</span>${position===0?'<i></i>':''}</div><div class="forecast-item__condition"><span class="forecast-symbol" aria-hidden="true">${symbol}</span><b>${label}</b></div><div class="forecast-item__temp">${format(data.hourly.temperature_2m[index],0)}°</div><div class="forecast-item__meta"><span><b>${format(data.hourly.precipitation_probability[index])}%</b> pluja</span><span>${format(data.hourly.wind_speed_10m[index])} km/h</span></div></article>`;
  }).join('');
  setText('forecast-status', `Model actualitzat · ${new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit'}).format(new Date())}`);
}

export function renderForecastError() { setText('forecast-status','Model temporalment no disponible'); const strip=document.getElementById('forecast-strip'); if(strip) strip.innerHTML='<div class="forecast-loading">La predicció no està disponible ara mateix. Les dades de l’estació continuen actives.</div>'; }
