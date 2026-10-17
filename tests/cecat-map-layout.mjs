import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root=resolve(import.meta.dirname,'..');
const program=String.raw`
import json
from scripts.cecat_map_layout import extract_panel_layout, image_window

legacy = """Mapa Risc - Meteor:Intensitat de pluja
Dia: 17/10/2026
Intensitat de pluja(De 0 a 6 hores) Intensitat de pluja(De 6 a 12 hores)
Intensitat de pluja(De 12 a 18 hores) Intensitat de pluja(De 18 a 24 hores)"""
split = """Mapa Risc - Meteor: Intensitat de pluja en 3 hores
Dia: 17/10/2026 00:00
Intensitat de pluja en 3 hores(De 12 a 18 hores)
Intensitat de pluja en 3 hores(De 18 a 24 hores)
Dia: 18/10/2026 00:00
Intensitat de pluja en 3 hores(De 0 a 6 hores)
Intensitat de pluja en 3 hores(De 6 a 12 hores)"""
print(json.dumps({
  "legacy": extract_panel_layout(legacy),
  "split": extract_panel_layout(split),
  "images": [image_window(name) for name in ("img1.png", "img3.png", "img5.png", "img7.png", "img9.png", "img11.png", "img13.png", "img15.png")],
}))
`;
const result=spawnSync('python3',['-c',program],{cwd:root,encoding:'utf8'});
assert.equal(result.status,0,result.stderr);
const parsed=JSON.parse(result.stdout);
assert.deepEqual(parsed.legacy,[
  ['2026-10-17',0,6],['2026-10-17',6,12],['2026-10-17',12,18],['2026-10-17',18,24],
]);
assert.deepEqual(parsed.split,[
  ['2026-10-17',12,18],['2026-10-17',18,24],['2026-10-18',0,6],['2026-10-18',6,12],
]);
assert.deepEqual(parsed.images,[[0,6],[6,12],[12,18],[18,24],[0,6],[6,12],[12,18],[18,24]]);

console.log('Disposicions CECAT antigues i dividides: correctes');
