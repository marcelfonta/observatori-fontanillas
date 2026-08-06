import { isNumber } from '../core/dom.js';

function numeric(value) { return isNumber(value) ? Number(value) : NaN; }

export function calculateHumidex(data) {
  const temperature = numeric(data.temperature);
  const dewPoint = numeric(data.dewPoint);
  if (![temperature, dewPoint].every(Number.isFinite)) return NaN;
  const vapourPressure = 6.11 * Math.exp(5417.753 * ((1 / 273.16) - (1 / (dewPoint + 273.15))));
  return temperature + .5555 * (vapourPressure - 10);
}

export function calculateApparentTemperature(data) {
  const temperature = numeric(data.temperature);
  const humidity = numeric(data.humidity);
  const windKmh = numeric(data.windSpeed);
  if (!Number.isFinite(temperature)) return NaN;

  if (temperature <= 10 && windKmh > 4.8) {
    if (isNumber(data.windChill)) return Number(data.windChill);
    return 13.12 + .6215 * temperature - 11.37 * windKmh ** .16 + .3965 * temperature * windKmh ** .16;
  }

  if (temperature >= 26) {
    if (isNumber(data.heatIndex)) return Number(data.heatIndex);
    if (isNumber(data.feelsLike)) return Number(data.feelsLike);
  }

  if (isNumber(data.apparentTemperature)) return Number(data.apparentTemperature);
  if (!Number.isFinite(humidity) || !Number.isFinite(windKmh)) return isNumber(data.feelsLike) ? Number(data.feelsLike) : temperature;
  const vapourPressure = humidity / 100 * 6.105 * Math.exp(17.27 * temperature / (237.7 + temperature));
  return temperature + .33 * vapourPressure - .7 * (windKmh / 3.6) - 4;
}

export function calculateThermalIndices(data) {
  return { apparent:calculateApparentTemperature(data), humidex:calculateHumidex(data) };
}
