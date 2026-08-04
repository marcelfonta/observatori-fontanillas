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

function beaufort(speed) {
  const value = Number(speed);
  if (!Number.isFinite(value)) return { force: '—', label: 'No disponible' };
  const limits = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];
  const labels = ['Calma', 'Ventolina', 'Brisa fluixa', 'Brisa lleugera', 'Brisa moderada', 'Brisa fresca', 'Vent fort', 'Vent molt fort', 'Temporal', 'Temporal fort', 'Temporal molt fort', 'Huracà'];
  const force = limits.findIndex(limit => value < limit);
  const index = force < 0 ? 12 : force;
  return { force: index, label: labels[Math.min(index, labels.length - 1)] };
}

function derivedValues(data) {
  const temperature = Number(data.temperature);
  const humidity = clamp(Number(data.humidity), 0, 100);
  const dewPoint = Number(data.dewPoint);
  if (![temperature, humidity, dewPoint].every(Number.isFinite)) return {};
  const saturationPressure = 6.112 * Math.exp((17.67 * temperature) / (temperature + 243.5));
  const actualPressure = saturationPressure * humidity / 100;
  const wetBulb = temperature * Math.atan(.151977 * Math.sqrt(humidity + 8.313659)) + Math.atan(temperature + humidity) - Math.atan(humidity - 1.676331) + .00391838 * humidity ** 1.5 * Math.atan(.023101 * humidity) - 4.686035;
  return {
    wetBulb,
    vpd: (saturationPressure - actualPressure) / 10,
    cloudBase: Math.max(0, (temperature - dewPoint) * 125),
    absoluteHumidity: 216.7 * actualPressure / (temperature + 273.15)
  };
}

export function renderStation(data, context = {}) {
  setText('temperature', format(data.temperature, 1)); setText('metric-temperature', format(data.temperature, 1)); setText('feels-like', `${format(data.feelsLike, 1)} °C`);
  setText('humidity', format(data.humidity)); setText('dew-point', `${format(data.dewPoint, 1)} °C`); setText('wind-speed', format(data.windSpeed, 1)); setText('wind-gust', `${format(data.windGust, 1)} km/h`);
  setText('wind-direction', cardinal(data.windDirection)); setText('pressure', format(data.pressure, 1)); setText('rain-today', format(data.rainToday, 1)); setText('rain-rate', format(data.rainRate, 1));
  setText('rain-reading', Number(data.rainRate) > 0 ? 'Precipitació activa' : 'Sense precipitació');
  setText('solar-radiation', isNumber(data.solarRadiation) ? format(data.solarRadiation, 0) : '—');
  setText('solar-reading', !isNumber(data.solarRadiation) ? 'No disponible' : Number(data.solarRadiation) < 20 ? 'Radiació molt baixa' : Number(data.solarRadiation) < 300 ? 'Radiació moderada' : Number(data.solarRadiation) < 700 ? 'Radiació alta' : 'Radiació molt alta');
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
  const calculated = derivedValues(data);
  setText('wet-bulb', format(calculated.wetBulb, 1)); setText('vpd', format(calculated.vpd, 2)); setText('cloud-base', format(calculated.cloudBase, 0)); setText('absolute-humidity', format(calculated.absoluteHumidity, 1));
  setText('vpd-reading', !isNumber(calculated.vpd) ? 'Dada no calculable' : calculated.vpd < .4 ? 'Aire gairebé saturat' : calculated.vpd < 1.2 ? 'Demanda baixa o moderada' : calculated.vpd < 2 ? 'Aire força sec' : 'Demanda evaporativa alta');
  const windForce = beaufort(data.windSpeed); setText('beaufort', `${windForce.force} · ${windForce.label}`); setText('beaufort-reading', `${format(data.windSpeed, 1)} km/h segons l’escala Beaufort`);
  const webcam = document.getElementById('webcam-image'); if (webcam) webcam.src = `${data.webcam}?t=${Date.now()}`;
}
