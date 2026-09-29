import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const worker=await readFile(resolve(root,'worker/index.js'),'utf8');
const service=await readFile(resolve(root,'ios/MeteoFontanillas/Shared/MeteoService.swift'),'utf8');
const app=await readFile(resolve(root,'ios/MeteoFontanillas/MeteoFontanillas/ContentView.swift'),'utf8');
const widget=await readFile(resolve(root,'ios/MeteoFontanillas/MeteoFontanillasWidget/MeteoFontanillasWidget.swift'),'utf8');
const formatting=await readFile(resolve(root,'ios/MeteoFontanillas/Shared/MeteoFormatting.swift'),'utf8');

assert.match(worker,/async function widgetObservation\(env\)/);
assert.match(worker,/url\.pathname === "\/widget-observation"/);
assert.match(worker,/source:"d1-widget-cache"/);
assert.match(service,/func loadWidgetSnapshot\(\) async throws/);
assert.match(service,/workers\.dev\/widget-observation/);
assert.match(app,/WidgetCenter\.shared\.reloadTimelines\(ofKind: "MeteoFontanillasWidget"\)/);
assert.match(widget,/WidgetSnapshotCache\.save\(snapshot\)/);
assert.match(widget,/WidgetSnapshotCache\.load\(\)/);
assert.match(widget,/Darrera lectura guardada/);
assert.match(widget,/case \.systemMedium:/);
assert.match(widget,/case \.systemLarge:/);
assert.match(widget,/\.supportedFamilies\(\[[^\]]*\.systemMedium/);
assert.match(widget,/\.supportedFamilies\(\[[^\]]*\.systemLarge/);
assert.match(widget,/MeteoFormatting\.humidity\(snapshot\.observation\.humidity\)/);
assert.match(widget,/snapshot\.forecastDays\.dropFirst\(\)\.prefix\(4\)/);
assert.match(widget,/\.frame\(minWidth: 126, maxWidth: \.infinity, alignment: \.leading\)/);
assert.match(widget,/\.font\(\.system\(size: 44, weight: \.bold, design: \.rounded\)\)[\s\S]*?\.lineLimit\(1\)[\s\S]*?\.minimumScaleFactor\(0\.58\)/);
assert.match(formatting,/static func humidity\(_ value: Double\?\) -> String/);
assert.match(service,/func loadForecasts\(days: Int = 5\) async throws/);
assert.match(service,/forecast_days[^\n]*String\(max\(1, min\(7, days\)\)\)/);

console.log('Widget Apple: memòria cau segura, formats mitjà i gran i temperatura principal adaptable');
