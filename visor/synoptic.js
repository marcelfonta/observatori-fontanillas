// Interpolate within each triangle of a sampled cell. Never bridge a missing corner.
export function contours(points, values, columns, interval = 2) {
  const lines = new Map();
  for (let i = 0; i + columns + 1 < points.length; i++) {
    if ((i + 1) % columns === 0) continue;
    const corners = [i, i + 1, i + columns + 1, i + columns];
    const pressures = corners.map(k => values[k]);
    if (!pressures.every(Number.isFinite)) continue;
    const top = Math.max(...pressures);
    for (let level = Math.ceil(Math.min(...pressures) / interval) * interval; level <= top; level += interval) {
      for (const triangle of [[0,1,2],[0,2,3]]) {
        const hits = [];
        for (let side = 0; side < 3; side++) {
          const a = triangle[side], b = triangle[(side + 1) % 3];
          if ((pressures[a] < level) === (pressures[b] < level)) continue;
          const ratio = (level - pressures[a]) / (pressures[b] - pressures[a]);
          hits.push(points[corners[a]].map((coord, axis) => coord + ratio * (points[corners[b]][axis] - coord)));
        }
        if (hits.length !== 2 || hits[0].every((v, j) => v === hits[1][j])) continue;
        if (!lines.has(level)) lines.set(level, []);
        lines.get(level).push(hits);
      }
    }
  }
  return lines;
}

export function synoptic(map, points, columns) {
  const group = L.layerGroup().addTo(map);
  const wind = document.querySelector('#wind-arrows'), pressure = document.querySelector('#isobars');
  const status = document.querySelector('#synoptic-status');
  let hour, rows, pending;
  const pane = map.createPane('synoptic');
  pane.style.zIndex = 440;
  pane.style.pointerEvents = 'none';
  const options = {pane:'synoptic',interactive:false,keyboard:false};
  function marker(point, className, html, size) {
    L.marker(point,{...options, icon:L.divIcon({className,html,iconSize:size})}).addTo(group);
  }
  function paint() {
    group.clearLayers();
    status.textContent = '';
    if ((!wind.checked && !pressure.checked) || !hour) return;
    if (!rows) {
      status.textContent = 'Carregant GFS…';
      if (!pending) pending = fetchRows().then(data => {
        rows = data;
        paint();
      }).catch(() => {
        if (hour && (wind.checked || pressure.checked)) status.textContent = 'GFS no disponible. Desactiva i reactiva la capa per reintentar.';
      }).finally(() => {pending = null;});
      return;
    }
    const values = [], speeds = [], directions = [];
    rows.forEach(row => {
      const h = row.hourly, t = h?.time?.indexOf(hour);
      values.push(h?.pressure_msl?.[t]);
      speeds.push(h?.wind_speed_10m?.[t]);
      directions.push(h?.wind_direction_10m?.[t]);
    });
    if (pressure.checked) {
      const lines = contours(points, values, columns);
      for (const [level, paths] of lines) {
        L.polyline(paths,{...options,color:'white',weight:3.5,opacity:.8}).addTo(group);
        L.polyline(paths,{...options,color:'#28352c',weight:1.4,opacity:1}).addTo(group);
        const mid = paths[Math.floor(paths.length / 2)][0];
        marker(mid,'pressure-label',String(level),[34,16]);
      }
      status.textContent = !values.some(Number.isFinite) ? 'Sense pressió per a aquesta hora' :
        lines.size ? 'Isòbares cada 2 hPa' : 'Cap isòbara de 2 hPa dins les cel·les disponibles';
    }
    if (wind.checked) {
      points.forEach((point,i) => {
        if (!Number.isFinite(speeds[i]) || !Number.isFinite(directions[i]) || speeds[i] < 1) return;
        const angle = (directions[i] + 180) % 360;
        const length = Math.min(29,12 + speeds[i] / 3);
        marker(point,'wind-vector','<svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true"><g transform="rotate('+angle+' 18 18)"><path d="M18 '+(18+length/2)+'v-'+length+'m-4 5 4-5 4 5"/></g></svg>',[36,36]);
      });
      const windText = speeds.some((v,i)=>Number.isFinite(v) && Number.isFinite(directions[i])) ? 'Fletxes cap on bufa el vent' : 'Sense vent disponible';
      status.textContent = [status.textContent,windText].filter(Boolean).join(' · ');
    }
  }
  async function fetchRows() {
    const params = new URLSearchParams({latitude:points.map(p=>p[0]).join(','),longitude:points.map(p=>p[1]).join(','),
      hourly:'wind_speed_10m,wind_direction_10m,pressure_msl',wind_speed_unit:'kmh',timezone:'GMT',forecast_days:'3',models:'gfs_global'});
    const res = await fetch('https://api.open-meteo.com/v1/forecast?'+params,{signal:AbortSignal.timeout(20000)});
    if (!res.ok) throw new Error('GFS');
    const data = await res.json();
    if (!Array.isArray(data) || data.length !== points.length) throw new Error('Cobertura');
    return data;
  }
  wind.onchange = pressure.onchange = paint;
  return {show(validHour) {if (validHour !== hour) {hour = validHour; paint();}}};
}
