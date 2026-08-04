import { format, cardinal, setText, clamp, isNumber } from '../js/utils.js';

function interpret(data) {
  const t = Number(data.temperature), h = Number(data.humidity), wind = Number(data.windSpeed), rain = Number(data.rainRate);
  if (rain > 0) return ['Pluja activa', `Ara plou a ${format(rain, 1)} mm/h. Cal seguir-ne l’evolució.`];
  if (wind >= 30) return ['Vent destacable', `El vent bufa a ${format(wind, 1)} km/h, amb ratxes de ${format(data.windGust, 1)} km/h.`];
  if (h >= 75) return ['Ambient humit', `Humitat elevada del ${format(h)}% i punt de rosada a ${format(data.dewPoint, 1)} °C.`];
  if (t >= 28) return ['Calor marcada', 'Temperatura alta; la sensació tèrmica és el valor clau ara mateix.'];
  return ['Ambient confortable', 'Condicions suaus i sense fenòmens destacables a l’estació.'];
}

function renderTrend(id, current, previous, suffix = '') {
  const node = document.getElementById(id); if (!node) return;
  if (!previous || !Number.isFinite(Number(previous))) { node.textContent = 'Recollint'; node.className = 'trend'; return; }
  const delta = Number(current) - Number(previous); const stable = Math.abs(delta) < .05;
  node.textContent = stable ? '→ estable' : `${delta > 0 ? '↗' : '↘'} ${delta > 0 ? '+' : ''}${format(delta, 1)}${suffix}`;
  node.className = `trend ${stable ? '' : delta > 0 ? 'trend--up' : 'trend--down'}`;
}

export function renderStation(data, context = {}) {
  setText('temperature', format(data.temperature, 1)); setText('metric-temperature', format(data.temperature, 1)); setText('feels-like', `${format(data.feelsLike, 1)} °C`);
  setText('humidity', format(data.humidity)); setText('dew-point', `${format(data.dewPoint, 1)} °C`); setText('wind-speed', format(data.windSpeed, 1)); setText('wind-gust', `${format(data.windGust, 1)} km/h`);
  setText('wind-direction', cardinal(data.windDirection)); setText('pressure', format(data.pressure, 1)); setText('rain-today', format(data.rainToday, 1)); setText('rain-rate', `${format(data.rainRate, 1)} mm/h`);
  setText('uv-index', isNumber(data.uv) ? format(data.uv, 1) : '—'); setText('uv-reading', isNumber(data.uv) ? (data.uv < 3 ? 'Baix' : data.uv < 6 ? 'Moderat' : 'Alt') : 'No disponible');
  setText('chart-temp-now', format(data.temperature, 1)); setText('chart-pressure-now', format(data.pressure, 1));
  setText('temp-max', `${format(context.stats?.maxTemperature ?? data.temperature, 1)}°`); setText('temp-min', `${format(context.stats?.minTemperature ?? data.temperature, 1)}°`);
  renderTrend('temp-trend', data.temperature, context.previous?.temperature, '°'); renderTrend('pressure-trend', data.pressure, context.previous?.pressure, ' hPa'); renderTrend('chart-pressure-trend', data.pressure, context.previous?.pressure, ' hPa'); renderTrend('wind-trend', data.windSpeed, context.previous?.windSpeed, ' km/h');
  const [title, copy] = interpret(data); setText('quick-title', title); setText('quick-copy', copy); setText('condition-label', Number(data.rainRate) > 0 ? 'Pluja a l’observatori' : Number(data.windSpeed) > 15 ? 'Vent moderat' : 'Observació en directe');
  const humidityBar = document.getElementById('humidity-bar'); if (humidityBar) humidityBar.style.width = `${clamp(Number(data.humidity), 0, 100)}%`;
  const comfort = document.getElementById('comfort-meter'); if (comfort) comfort.style.width = `${clamp(100 - Math.abs(Number(data.feelsLike) - 22) * 5, 15, 100)}%`;
  const marker = document.getElementById('pressure-marker'); if (marker) marker.style.left = `${clamp((Number(data.pressure) - 980) / .65, 0, 100)}%`;
  const arrow = document.getElementById('wind-arrow'); if (arrow && isNumber(data.windDirection)) arrow.style.transform = `rotate(${Number(data.windDirection)}deg)`;
  setText('pressure-reading', Number(data.pressure) >= 1015 ? 'Pressió alta' : Number(data.pressure) < 1005 ? 'Pressió baixa' : 'Pressió normal');
  const webcam = document.getElementById('webcam-image'); if (webcam) webcam.src = `${data.webcam}?t=${Date.now()}`;
}
