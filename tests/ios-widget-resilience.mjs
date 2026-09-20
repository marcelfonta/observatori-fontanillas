import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const worker=await readFile(resolve(root,'worker/index.js'),'utf8');
const service=await readFile(resolve(root,'ios/MeteoFontanillas/Shared/MeteoService.swift'),'utf8');
const app=await readFile(resolve(root,'ios/MeteoFontanillas/MeteoFontanillas/ContentView.swift'),'utf8');
const widget=await readFile(resolve(root,'ios/MeteoFontanillas/MeteoFontanillasWidget/MeteoFontanillasWidget.swift'),'utf8');

assert.match(worker,/async function widgetObservation\(env\)/);
assert.match(worker,/url\.pathname === "\/widget-observation"/);
assert.match(worker,/source:"d1-widget-cache"/);
assert.match(service,/func loadWidgetSnapshot\(\) async throws/);
assert.match(service,/workers\.dev\/widget-observation/);
assert.match(app,/WidgetCenter\.shared\.reloadTimelines\(ofKind: "MeteoFontanillasWidget"\)/);
assert.match(widget,/WidgetSnapshotCache\.save\(snapshot\)/);
assert.match(widget,/WidgetSnapshotCache\.load\(\)/);
assert.match(widget,/Darrera lectura guardada/);

console.log('Widget iPhone: ruta ràpida, recàrrega explícita i darrera lectura segura');
