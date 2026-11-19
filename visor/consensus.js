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

export function hourlyComparison(datasets, models, hours, variable) {
  return hours.map(time => {
    const readings = datasets.map((data, index) => readingAt(data, models[index], time)).filter(Boolean);
    return { time, readings, summary: summarize(readings, variable) };
  });
}

/**
 * Verification of archived +24 h temperature predictions against observed hourly readings.
 * Signed error = forecast minus observed. Duplicate observations are averaged in each UTC hour;
 * never treat missing or non-finite values as zero.
 */
export function retrospectiveMetrics(observations, forecasts) {
  const hourlyObserved = new Map();
  for (const row of observations) {
    if (row.temperature === null || row.temperature === undefined || row.temperature === '') continue;
    if (row.epoch === null || row.epoch === undefined || row.epoch === '') continue;
    const temperature = Number(row.temperature), epoch = Number(row.epoch);
    if (!Number.isFinite(temperature) || !Number.isFinite(epoch)) continue;
    const hour = Math.floor(epoch / 3600);
    const values = hourlyObserved.get(hour) || [];
    values.push(temperature);
    hourlyObserved.set(hour, values);
  }
  const actual = new Map([...hourlyObserved].map(([hour, values]) =>
    [hour, values.reduce((total, value) => total + value, 0) / values.length]));
  return forecasts.map(({ name, hourly }) => {
    const errors = [];
    const times = hourly?.time || [];
    for (let index = 0; index < times.length; index++) {
      const predicted = hourly?.temperature_2m_previous_day1?.[index];
      const time = times[index];
      if (!Number.isFinite(predicted) || typeof time !== 'string') continue;
      const utcTime = /(?:Z|[+-]\d\d:\d\d)$/.test(time) ? time : `${time}Z`;
      const instant = Date.parse(utcTime);
      if (!Number.isFinite(instant)) continue;
      const observed = actual.get(Math.floor(instant / 3600000));
      if (Number.isFinite(observed)) errors.push(predicted - observed);
    }
    const count = errors.length;
    return {
      name, count,
      mae: count ? errors.reduce((sum, error) => sum + Math.abs(error), 0) / count : null,
      rmse: count ? Math.sqrt(errors.reduce((sum, error) => sum + error ** 2, 0) / count) : null,
      bias: count ? errors.reduce((sum, error) => sum + error, 0) / count : null
    };
  });
}

// Backward-compatible public contract used by older visualizations and tests.
export function retrospectiveErrors(observations, forecasts) {
  return retrospectiveMetrics(observations, forecasts).map(({ name, count, mae }) => ({ name, count, mae }));
}
