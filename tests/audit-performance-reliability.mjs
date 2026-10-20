import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const social=readFileSync(new URL('../src/features/footer-social.js',import.meta.url),'utf8');
const portal=readFileSync(new URL('../src/features/portal-shell.js',import.meta.url),'utf8');
const ai=readFileSync(new URL('../src/features/meteo-ai.js',import.meta.url),'utf8');

assert.match(app,/let forecastInFlight = null/);
assert.match(app,/if\(forecastInFlight\)return forecastInFlight/);
assert.match(app,/forecastInFlight=pending/);
assert.match(app,/if\(forecastInFlight===pending\)forecastInFlight=null/);
assert.match(app,/const FORECAST_PAGES=new Set/);
assert.match(app,/if\(FORECAST_PAGES\.has\(ACTIVE_PAGE\)\)loadForecastSuite\(\)/);
assert.match(app,/if\(HISTORY_PAGES\.has\(ACTIVE_PAGE\)\)/);
assert.match(app,/if\(ACTIVE_PAGE==='terra'\)loadRouteFeature\(\(\)=>import\('\.\/features\/earth-observation\.js'\)/);
for(const routeModule of ['earth-observation','estofex-local','weather-stories','seasonal-outlook','forecast-videos','forecast-verification','data-center','environment','long-range']){
  assert.doesNotMatch(app,new RegExp(`^import .*${routeModule}\\.js`,'m'),`${routeModule} no ha de formar part de l’arrencada comuna.`);
}
assert.equal((app.match(/initWhenVisible\('\.metrics-grid',enableCharts/g)||[]).length,1);
assert.match(app,/if\(\['inici','webcams'\]\.includes\(ACTIVE_PAGE\)\)initWebcam\(\)/);
assert.match(html,/aria-labelledby="hero-webcam-status"/);
assert.match(html,/id="hero-webcam-status" data-webcam-status/);
assert.match(social,/aria-label','Segueix-nos: veure totes les xarxes socials/);
assert.match(portal,/aria-label','Fontanillas Sant Celoni: inici/);
assert.match(ai,/aria-label','Pregunta al temps amb Meteo IA/);

console.log('Auditoria web: previsió deduplicada, miniatura i noms accessibles protegits.');
