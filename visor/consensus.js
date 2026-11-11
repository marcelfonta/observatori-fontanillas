const valid = value => typeof value === 'number' && Number.isFinite(value);

export function localForecastHour(value) {
  const instant = new Date(value);
  const nextHourlyStep = new Date(Math.ceil(instant.getTime() / 3600000) * 3600000);
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).format(nextHourlyStep).replace(' ', 'T');
}

export function independentModels(readings, variable) {
  const families = new Map();
  for (const reading of readings) {
    const { model } = reading;
    if (!model?.family) continue; // Best Match may duplicate one of the listed models.
    const previous = families.get(model.family);
    if (!previous || (valid(reading[variable]) && !valid(previous[variable])) || (valid(reading[variable]) === valid(previous[variable]) && (model.priority || 0) > (previous.model.priority || 0))) families.set(model.family, reading);
  }
  return [...families.values()];
}

export function summarize(readings, variable) {
  const independent = independentModels(readings, variable);
  const values = independent.map(reading => reading[variable]).filter(valid).sort((a, b) => a - b);
  if (!values.length) return { count: 0, available: independent.length };
  const middle = Math.floor(values.length / 2);
  return {
    count: values.length,
    available: independent.length,
    min: values[0],
    max: values.at(-1),
    median: values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2,
    wet: variable === 'rain' ? values.filter(value => value >= 0.2).length : null
  };
}

export function readingAt(data, model, targetIso) {
  const hourly = data?.hourly;
  const index = hourly?.time?.indexOf(targetIso) ?? -1;
  if (index < 0) return null;
  const numberAt = key => {
    const value = hourly[key]?.[index];
    return value === null || value === undefined || !Number.isFinite(Number(value)) ? null : Number(value);
  };
  return {
    model, time: targetIso,
    temperature: numberAt('temperature_2m'),
    rain: numberAt('precipitation'),
    wind: numberAt('wind_speed_10m'),
    clouds: numberAt('cloud_cover')
  };
}
