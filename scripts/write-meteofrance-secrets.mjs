import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const names=[
  'METEOFRANCE_AROME_API_KEY','METEOFRANCE_AROME_NOWCAST_API_KEY','METEOFRANCE_AROME_ENSEMBLE_API_KEY',
  'METEOFRANCE_ARPEGE_API_KEY','METEOFRANCE_ARPEGE_ENSEMBLE_API_KEY','METEOFRANCE_PIAF_API_KEY',
];
const missing=names.filter(name=>!String(process.env[name]||'').trim());
if(missing.length)throw new Error(`Falten ${missing.length} credencials Météo-France; no es genera un fitxer parcial.`);
const target=resolve(process.argv[2]||'.meteofrance-secrets.json');
const payload=Object.fromEntries(names.map(name=>[name,String(process.env[name]).trim()]));
await writeFile(target,`${JSON.stringify(payload)}\n`,{mode:0o600});
console.log(`Fitxer temporal preparat amb ${names.length} credencials (valors ocults).`);
