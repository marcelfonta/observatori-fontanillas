export const MODELS = [
  { name: 'Best Match', path: '/v1/forecast', horizon: 7, reference: true },
  { name: 'ECMWF IFS', path: '/v1/ecmwf', horizon: 7, family: 'ecmwf' },
  { name: 'GFS', path: '/v1/gfs', horizon: 7, family: 'gfs' },
  { name: 'ICON', path: '/v1/dwd-icon', horizon: 7, family: 'icon' },
  { name: 'AROME HD', path: '/v1/meteofrance', model: 'meteofrance_arome_france_hd', horizon: 2, family: 'meteofrance', priority: 2 },
  { name: 'ARPEGE Europa', path: '/v1/meteofrance', model: 'meteofrance_arpege_europe', horizon: 4, family: 'meteofrance', priority: 1 },
  { name: 'GEM global', path: '/v1/gem', horizon: 7, family: 'gem' },
  { name: 'UKMO global', path: '/v1/forecast', model: 'ukmo_seamless', horizon: 7, family: 'ukmo' }
];
export const MODEL_VARIABLES = {
  temperature: { label: 'Temperatura a 2 m', unit: '°C', digits: 1 },
  rain: { label: 'Precipitació total', unit: 'mm', digits: 1 },
  wind: { label: 'Vent', unit: 'km/h', digits: 0 },
  clouds: { label: 'Núvols', unit: '%', digits: 0 }
};
