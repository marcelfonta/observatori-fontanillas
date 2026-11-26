import { independentModels, readingAt } from './consensus.js';

// Open-Meteo precipitation and snowfall are totals ending at the timestamp.
export function seriesWindow(hourly, field, end, length) {
  const last = hourly?.time?.indexOf(end) ?? -1;
  if (last < length - 1) return null;
  const endMs = Date.parse(end+'Z');
  let sum = 0;
  for (let back = 0; back < length; back++) {
    const i = last - back, value = hourly[field]?.[i];
    if (!Number.isFinite(value) || Date.parse(hourly.time[i]+'Z') !== endMs-back*3600000) return null;
    sum += value;
  }
  return sum;
}

export function productReading(data, model, hour, hours) {
  const row = readingAt(data,model,hour);
  if (!row) return null;
  if (hours > 1) {
    row.rain = seriesWindow(data.hourly,'precipitation',hour,hours);
    row.snow = seriesWindow(data.hourly,'snowfall',hour,hours);
  }
  row.gust = data.hourly.wind_gusts_10m?.[data.hourly.time.indexOf(hour)] ?? null;
  return row;
}

// Only compare complete twelve-hour series. A dry member has no onset.
export function rainTiming(models, getRow, hour) {
  const end = new Date(Date.parse(hour+'Z')+11*3600000).toISOString().slice(0,16);
  const rows = [];
  for (const model of models) {
    const h = getRow(model)?.hourly;
    const rain = seriesWindow(h,'precipitation',end,12);
    if (rain === null) continue;
    const start = h.time.indexOf(hour);
    const onset = h.precipitation.slice(start,start+12).findIndex(v=>v>=0.2);
    rows.push({model,rain,onset});
  }
  const families = independentModels(rows,'rain');
  const wet = families.filter(r=>r.onset>=0);
  return {families,spread:wet.length>=2 ? Math.max(...wet.map(r=>r.onset))-Math.min(...wet.map(r=>r.onset)) : null};
}
