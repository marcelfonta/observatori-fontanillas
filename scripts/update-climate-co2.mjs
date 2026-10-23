import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/update-climate-co2.mjs /path/to/co2_mm_mlo.csv');
const raw = await readFile(source, 'utf8');
const byYear = new Map();
for (const line of raw.split(/\r?\n/)) {
  if (!/^\s*\d{4},/.test(line)) continue;
  const fields = line.split(',').map(value => value.trim());
  const year = Number(fields[0]);
  const month = Number(fields[1]);
  const ppm = Number(fields[3]);
  if (!Number.isInteger(year) || month < 1 || month > 12 || !Number.isFinite(ppm) || ppm < 250 || ppm > 650) continue;
  if (!byYear.has(year)) byYear.set(year, new Map());
  if (byYear.get(year).has(month)) throw new Error(`Duplicate month: ${year}-${month}`);
  byYear.get(year).set(month, ppm);
}
const annual = [...byYear].filter(([year, months]) => year >= 1959 && months.size === 12)
  .map(([year, months]) => ({year, ppm: [...months.values()].reduce((sum, value) => sum + value, 0) / 12}))
  .sort((a,b) => a.year-b.year);
if (annual.length < 50 || annual[0].year !== 1959 || annual.at(-1).year < 2025) throw new Error('Incomplete NOAA historical series');
for (let index = 1; index < annual.length; index++) if (annual[index].year !== annual[index-1].year + 1) throw new Error('Gap in NOAA historical series');
const output = path.join(root, 'assets/data/climate');
await mkdir(output, {recursive:true});
await writeFile(path.join(output,'co2-annual-mlo.csv'), `year,co2_ppm\n${annual.map(row=>`${row.year},${row.ppm.toFixed(2)}`).join('\n')}\n`);
const x = row => 60 + (row.year - annual[0].year) / (annual.at(-1).year - annual[0].year) * 820;
const y = row => 310 - (row.ppm - 300) / 150 * 270;
const points = annual.map(row => `${x(row).toFixed(1)},${y(row).toFixed(1)}`).join(' ');
const ticks = [300,350,400,450].map(ppm => `<line x1="60" x2="880" y1="${(310-(ppm-300)/150*270).toFixed(1)}" y2="${(310-(ppm-300)/150*270).toFixed(1)}" stroke="#395b56"/><text x="50" y="${(315-(ppm-300)/150*270).toFixed(1)}" text-anchor="end" fill="#c2d5d0" font-size="15">${ppm}</text>`).join('');
const labels = [1959,1980,2000,2025].map(year=>`<text x="${x({year}).toFixed(1)}" y="340" text-anchor="middle" fill="#c2d5d0" font-size="15">${year}</text>`).join('');
const last = annual.at(-1);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 940 370" role="img" aria-labelledby="title desc"><title id="title">Augment del CO₂ atmosfèric a Mauna Loa</title><desc id="desc">Mitjanes anuals de NOAA de ${annual[0].year} a ${last.year}: de ${annual[0].ppm.toFixed(2)} a ${last.ppm.toFixed(2)} parts per milió.</desc><rect width="940" height="370" rx="18" fill="#0a2522"/><text x="60" y="28" fill="#e5f4ef" font-size="17" font-family="sans-serif">CO₂, mitjana anual · Mauna Loa (NOAA)</text><g font-family="sans-serif">${ticks}${labels}<polyline fill="none" stroke="#7fe0a7" stroke-width="4" stroke-linejoin="round" points="${points}"/><circle cx="${x(last).toFixed(1)}" cy="${y(last).toFixed(1)}" r="6" fill="#fff"/><text x="875" y="${(y(last)-15).toFixed(1)}" text-anchor="end" fill="#fff" font-size="17">${last.ppm.toFixed(2)} ppm</text></g></svg>`;
await writeFile(path.join(output,'co2-annual-mlo.svg'), svg);
console.log(`Generated ${annual.length} complete years (${annual[0].year}–${last.year}) from NOAA monthly means`);
