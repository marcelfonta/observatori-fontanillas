// Decorative symbols; the adjacent text remains the accessible forecast.
const cloud='<path fill="#e6f3ee" stroke="#91bcad" d="M18 47h31a10 10 0 0 0 0-20 15 15 0 0 0-28-3 12 12 0 0 0-3 23Z"/>';
const sun='<g stroke="#f2cb7b"><circle cx="25" cy="24" r="10" fill="#f2cb7b"/><path d="M25 7V3m0 42v-4M8 24H4m42 0h-4M13 12l-3-3m30 30-3-3M13 36l-3 3m30-30-3 3"/></g>';
const moon='<path fill="#cbdaf0" stroke="#aebfd9" d="M38 8a19 19 0 1 0 17 29A20 20 0 0 1 38 8Z"/>';
const twilight='<g stroke="#f2cb7b"><path d="M14 39a18 18 0 0 1 36 0" fill="#f2cb7b"/><path d="M32 13v7M13 22l5 5m33-5-5 5"/></g><path d="M7 41h50M13 49h38M20 56h24" stroke="#91bcad"/>';
const clearSky='<g fill="#cbdaf0" stroke="#cbdaf0"><path d="m31 9 2.5 8.5L42 20l-8.5 2.5L31 31l-2.5-8.5L20 20l8.5-2.5Z"/><circle cx="48" cy="13" r="2"/><circle cx="48" cy="34" r="1.5"/><circle cx="15" cy="37" r="2"/></g>';
export function weatherSymbolKind(code){
  if(!Number.isInteger(code))return 'unknown';
  if(code===0)return 'clear';
  if(code===1||code===2)return 'partly';
  if(code===3)return 'cloudy';
  if(code===45||code===48)return 'fog';
  if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return 'rain';
  if([71,73,75,77,85,86].includes(code))return 'snow';
  if([95,96,99].includes(code))return 'storm';
  return 'unknown';
}
export function weatherSymbol(code,light='unknown'){
  const kind=weatherSymbolKind(code);
  // Twilight is a real day/night transition. Unknown means daylight data is missing.
  // The moon remains a weather pictogram, not the real lunar phase.
  const sky=light==='night'?moon:light==='day'?sun:light==='twilight'?twilight:clearSky;
  const rain='<path stroke="#77c9e4" d="m23 53-3 7m15-7-3 7m15-7-3 7"/>';
  const snow='<path stroke="#b8deed" d="M23 52v10m-4-8 8 6m0-6-8 6m24-8v10m-4-8 8 6m0-6-8 6"/>';
  const body=kind==='clear'?sky:kind==='partly'?sky+cloud:kind==='cloudy'?cloud:kind==='rain'?cloud+rain:kind==='snow'?cloud+snow:kind==='storm'?cloud+'<path fill="#f2cb7b" stroke="#f2cb7b" d="m34 43-9 12h9l-3 9 13-14H34l5-7Z"/>':kind==='fog'?cloud+'<path stroke="#a8c6ba" d="M10 53h44M17 60h32"/>':'<circle cx="32" cy="32" r="21" stroke="#93a79f"/><path stroke="#93a79f" d="M23 32h18"/>';
  return `<svg viewBox="0 0 64 68" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-light="${light}" aria-hidden="true" focusable="false">${body}</svg>`;
}
export function temperatureRange(min,max){
  const format=n=>Number.isFinite(n)?`${Math.round(n)}°`:'—';
  if(!Number.isFinite(min)&&!Number.isFinite(max))return '—';
  return Number.isFinite(min)&&Number.isFinite(max)&&Math.round(min)===Math.round(max)?format(min):`${format(min)} – ${format(max)}`;
}
