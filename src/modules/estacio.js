import { format, cardinal, setText, clamp, isNumber } from '../core/dom.js';
import { calculateThermalIndices } from './confort.js';

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

function extremeTime(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('ca-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }).format(date)
    : '—';
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
  const pressure = Number(data.pressure);
  if (![temperature, humidity, dewPoint].every(Number.isFinite)) return {};
  const saturationPressure = 6.112 * Math.exp((17.67 * temperature) / (temperature + 243.5));
  const actualPressure = saturationPressure * humidity / 100;
  const wetBulb = temperature * Math.atan(.151977 * Math.sqrt(humidity + 8.313659)) + Math.atan(temperature + humidity) - Math.atan(humidity - 1.676331) + .00391838 * humidity ** 1.5 * Math.atan(.023101 * humidity) - 4.686035;
  const kelvin = temperature + 273.15;
  const dryPressurePa = Number.isFinite(pressure) ? Math.max(0, pressure - actualPressure) * 100 : NaN;
  const vaporPressurePa = actualPressure * 100;
  return {
    wetBulb,
    vpd: (saturationPressure - actualPressure) / 10,
    cloudBase: Math.max(0, (temperature - dewPoint) * 125),
    absoluteHumidity: 216.7 * actualPressure / kelvin,
    vaporPressure: actualPressure,
    mixingRatio: Number.isFinite(pressure) && pressure > actualPressure ? 621.98 * actualPressure / (pressure - actualPressure) : NaN,
    airDensity: Number.isFinite(dryPressurePa) ? dryPressurePa / (287.05 * kelvin) + vaporPressurePa / (461.495 * kelvin) : NaN
  };
}

function setLevel(key, value, min, max, label, level = 'good') {
  const card = document.getElementById(`metric-card-${key}`);
  const marker = document.getElementById(`marker-${key}`);
  setText(`level-${key}`, label);
  if (card) card.dataset.level = level;
  if (marker && isNumber(value)) marker.style.left = `${clamp((Number(value) - min) / (max - min) * 100, 0, 100)}%`;
}

function renderLevels(data, thermal) {
  const feels = thermal.apparent;
  setLevel('temperature', feels, -5, 42, !isNumber(feels) ? 'Sense lectura' : feels < 5 ? 'Fred intens' : feels < 15 ? 'Ambient fresc' : feels < 27 ? 'Confortable' : feels < 32 ? 'Calor moderada' : feels < 38 ? 'Calor alta' : 'Calor extrema', !isNumber(feels) ? 'low' : feels < 15 ? 'low' : feels < 27 ? 'good' : feels < 32 ? 'moderate' : feels < 38 ? 'high' : 'extreme');
  const humidity = isNumber(data.humidity) ? Number(data.humidity) : NaN;
  setLevel('humidity', humidity, 0, 100, !isNumber(humidity) ? 'Sense lectura' : humidity < 30 ? 'Aire sec' : humidity <= 60 ? 'Rang confortable' : humidity <= 80 ? 'Ambient humit' : 'Humitat molt alta', !isNumber(humidity) ? 'low' : humidity < 30 ? 'moderate' : humidity <= 60 ? 'good' : humidity <= 80 ? 'moderate' : 'high');
  const wind = isNumber(data.windSpeed) ? Number(data.windSpeed) : NaN;
  const windScale = beaufort(wind);
  setLevel('wind', wind, 0, 100, `${windScale.force} Beaufort · ${windScale.label}`, !isNumber(wind) ? 'low' : wind < 20 ? 'good' : wind < 40 ? 'moderate' : wind < 70 ? 'high' : 'extreme');
  const pressure = isNumber(data.pressure) ? Number(data.pressure) : NaN;
  setLevel('pressure', pressure, 980, 1040, !isNumber(pressure) ? 'Sense lectura' : pressure < 995 ? 'Pressió baixa' : pressure <= 1025 ? 'Rang habitual' : pressure <= 1035 ? 'Pressió alta' : 'Molt alta', !isNumber(pressure) ? 'low' : pressure < 995 || pressure > 1035 ? 'moderate' : 'good');
  const rainTotal = isNumber(data.rainToday) ? Number(data.rainToday) : NaN;
  setLevel('rain-total', rainTotal, 0, 50, !isNumber(rainTotal) || rainTotal === 0 ? 'Sense acumulació' : rainTotal < 5 ? 'Acumulació baixa' : rainTotal < 20 ? 'Acumulació moderada' : rainTotal < 50 ? 'Acumulació alta' : 'Acumulació molt alta', !isNumber(rainTotal) || rainTotal === 0 ? 'good' : rainTotal < 20 ? 'low' : rainTotal < 50 ? 'moderate' : 'high');
  const rainRate = isNumber(data.rainRate) ? Number(data.rainRate) : NaN;
  setLevel('rain-rate', rainRate, 0, 50, !isNumber(rainRate) || rainRate === 0 ? 'Sense precipitació' : rainRate < 2 ? 'Pluja feble' : rainRate < 10 ? 'Pluja moderada' : rainRate < 30 ? 'Pluja intensa' : 'Pluja torrencial', !isNumber(rainRate) || rainRate === 0 ? 'good' : rainRate < 2 ? 'low' : rainRate < 10 ? 'moderate' : rainRate < 30 ? 'high' : 'extreme');
  const solar = isNumber(data.solarRadiation) ? Number(data.solarRadiation) : NaN;
  setLevel('solar', solar, 0, 1000, !isNumber(data.solarRadiation) ? 'Sense lectura' : solar < 100 ? 'Radiació feble' : solar < 500 ? 'Radiació moderada' : solar < 800 ? 'Radiació alta' : 'Radiació molt alta', !isNumber(data.solarRadiation) ? 'low' : solar < 500 ? 'good' : solar < 800 ? 'moderate' : 'high');
  const uv = isNumber(data.uv) ? Number(data.uv) : NaN;
  const uvLabel = !isNumber(data.uv) ? 'Sense lectura' : uv < 3 ? 'Baix · protecció normal' : uv < 6 ? 'Moderat · protegeix-te' : uv < 8 ? 'Alt · evita el migdia' : uv < 11 ? 'Molt alt · màxima protecció' : 'Extrem · evita exposició';
  const uvLevel = !isNumber(data.uv) ? 'low' : uv < 3 ? 'good' : uv < 6 ? 'moderate' : uv < 8 ? 'high' : uv < 11 ? 'high' : 'extreme';
  setLevel('uv', uv, 0, 12, uvLabel, uvLevel);
  const apparent = thermal.apparent;
  setLevel('apparent', apparent, -5, 45, !isNumber(apparent) ? 'Sense lectura' : apparent < 5 ? 'Fred intens' : apparent < 15 ? 'Sensació fresca' : apparent < 27 ? 'Confortable' : apparent < 32 ? 'Calor perceptible' : apparent < 38 ? 'Calor intensa' : 'Estrès tèrmic', !isNumber(apparent) ? 'low' : apparent < 15 ? 'low' : apparent < 27 ? 'good' : apparent < 32 ? 'moderate' : apparent < 38 ? 'high' : 'extreme');
  const humidex = thermal.humidex;
  setLevel('humidex', humidex, 15, 50, !isNumber(humidex) ? 'Sense càlcul' : humidex < 30 ? 'Poc o gens molest' : humidex < 35 ? 'Xafogor moderada' : humidex < 40 ? 'Xafogor marcada' : humidex < 45 ? 'Gran incomoditat' : 'Perill per calor', !isNumber(humidex) ? 'low' : humidex < 30 ? 'good' : humidex < 35 ? 'moderate' : humidex < 40 ? 'high' : 'extreme');
}

export function renderStation(data, context = {}) {
  const thermal = calculateThermalIndices(data);
  setText('temperature', format(data.temperature, 1)); setText('metric-temperature', format(data.temperature, 1)); setText('feels-like', `${format(thermal.apparent, 1)} °C`);
  setText('humidity', format(data.humidity)); setText('dew-point', `${format(data.dewPoint, 1)} °C`); setText('wind-speed', format(data.windSpeed, 1)); setText('wind-gust', `${format(data.windGust, 1)} km/h`);
  setText('wind-direction', cardinal(data.windDirection)); setText('pressure', format(data.pressure, 1)); setText('rain-today', format(data.rainToday, 1)); setText('rain-rate', format(data.rainRate, 1));
  setText('rain-reading', Number(data.rainRate) > 0 ? 'Precipitació activa' : 'Sense precipitació');
  setText('solar-radiation', isNumber(data.solarRadiation) ? format(data.solarRadiation, 0) : '—');
  setText('solar-reading', !isNumber(data.solarRadiation) ? 'No disponible' : Number(data.solarRadiation) < 20 ? 'Radiació molt baixa' : Number(data.solarRadiation) < 300 ? 'Radiació moderada' : Number(data.solarRadiation) < 700 ? 'Radiació alta' : 'Radiació molt alta');
  setText('uv-index', isNumber(data.uv) ? format(data.uv, 1) : '—'); setText('uv-reading', isNumber(data.uv) ? (data.uv < 3 ? 'Baix' : data.uv < 6 ? 'Moderat' : 'Alt') : 'No disponible');
  setText('chart-temp-now', format(data.temperature, 1)); setText('chart-pressure-now', format(data.pressure, 1));
  setText('chart-humidity-now',format(data.humidity,0)); setText('chart-wind-now',format(data.windSpeed,1)); setText('chart-rain-now',format(data.rainToday,1));
  setText('chart-uv-now',isNumber(data.uv)?format(data.uv,1):'—');
  setText('temp-max', `${format(context.stats?.maxTemperature ?? data.temperature, 1)}°`); setText('temp-min', `${format(context.stats?.minTemperature ?? data.temperature, 1)}°`);
  setText('temp-max-time', extremeTime(context.stats?.maxTemperatureTime)); setText('temp-min-time', extremeTime(context.stats?.minTemperatureTime));
  renderTrend('temp-trend', data.temperature, context.previous?.temperature, '°'); renderTrend('pressure-trend', data.pressure, context.previous?.pressure, ' hPa'); renderTrend('chart-pressure-trend', data.pressure, context.previous?.pressure, ' hPa'); renderTrend('wind-trend', data.windSpeed, context.previous?.windSpeed, ' km/h');
  const [title, copy] = interpret(data); setText('quick-title', title); setText('quick-copy', copy); setText('condition-label', Number(data.rainRate) > 0 ? 'Pluja a l’observatori' : Number(data.windSpeed) > 15 ? 'Vent moderat' : 'Observació en directe');
  const comfort = document.getElementById('comfort-meter'); if (comfort) comfort.style.width = `${isNumber(thermal.apparent)?clamp(100 - Math.abs(thermal.apparent - 22) * 5, 15, 100):0}%`;
  const arrow = document.getElementById('wind-arrow'); if (arrow && isNumber(data.windDirection)) arrow.style.transform = `rotate(${Number(data.windDirection)}deg)`;
  setText('pressure-reading', Number(data.pressure) >= 1015 ? 'Pressió alta' : Number(data.pressure) < 1005 ? 'Pressió baixa' : 'Pressió normal');
  const calculated = derivedValues(data);
  setText('wet-bulb', format(calculated.wetBulb, 1)); setText('vpd', format(calculated.vpd, 2)); setText('cloud-base', format(calculated.cloudBase, 0)); setText('absolute-humidity', format(calculated.absoluteHumidity, 1));
  setText('vapor-pressure',format(calculated.vaporPressure,1)); setText('mixing-ratio',format(calculated.mixingRatio,1)); setText('air-density',format(calculated.airDensity,3));
  setText('air-density-reading',!isNumber(calculated.airDensity)?'Dada no calculable':calculated.airDensity<1.15?'Aire poc dens':calculated.airDensity<1.25?'Densitat habitual':'Aire dens');
  setText('vpd-reading', !isNumber(calculated.vpd) ? 'Dada no calculable' : calculated.vpd < .4 ? 'Aire gairebé saturat' : calculated.vpd < 1.2 ? 'Demanda baixa o moderada' : calculated.vpd < 2 ? 'Aire força sec' : 'Demanda evaporativa alta');
  const windForce = beaufort(data.windSpeed); setText('beaufort', `${windForce.force} · ${windForce.label}`); setText('beaufort-reading', `${format(data.windSpeed, 1)} km/h segons l’escala Beaufort`);
  setText('apparent-temperature',format(thermal.apparent,1));
  setText('apparent-reading',Number(data.temperature) <= 10 && Number(data.windSpeed) > 4.8 ? 'Inclou l’efecte de refredament del vent' : Number(data.temperature) >= 26 ? 'Inclou l’efecte de calor i humitat' : 'Combina temperatura, humitat i vent');
  setText('humidex',format(thermal.humidex,1));
  setText('humidex-reading',!isNumber(thermal.humidex) ? 'Cal temperatura i punt de rosada' : thermal.humidex < 30 ? 'Poc o gens de malestar per xafogor' : thermal.humidex < 40 ? 'La humitat accentua clarament la calor' : 'Condicions exigents: redueix l’exposició');
  renderLevels(data,thermal);
  document.querySelectorAll('#webcam-image, #hero-webcam-image').forEach(webcam => {
    if (data.webcam) webcam.src = `${data.webcam}${String(data.webcam).includes('?') ? '&' : '?'}t=${Date.now()}`;
  });
}
