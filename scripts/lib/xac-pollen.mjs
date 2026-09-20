// Read-only preparation tool. Not imported by the Worker or any publisher.
export const XAC_STATIONS = ['barcelona','bellaterra','girona','lleida','manresa','roquetes','tarragona','vielha','son','palma'];
export const XAC_LICENSE = 'CC BY-NC-SA 4.0';
const LEVELS = ['Nul','Baix','Mig','Alt','Màxim'];
const TRENDS = {A:'Augment','=':'Estable',D:'Descens','!':'Situació excepcional'};

export function validDate(value) {
  if(typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
}
export function validity(start, end, target) {
  if(![start,end,target].every(validDate) || start > end)throw Error('Dates XAC invàlides');
  return target < start ? 'future' : target > end ? 'expired' : 'in-period';
}
const children = (node, tag) => [...node.children].filter(child => child.tagName === tag);
function one(node, tag) {
  const matches = children(node,tag);
  if(matches.length !== 1)throw Error(`Estructura XAC invàlida: ${tag}`);
  return matches[0];
}
const text = (node,tag) => one(node,tag).textContent.trim();
function uniqueElements(node) {
  const map = new Map();
  for(const child of node.children) {
    if(map.has(child.tagName))throw Error(`Tàxon XAC duplicat: ${child.tagName}`);
    map.set(child.tagName,child);
  }
  return map;
}

export function parseXacPollen(xml, {station,targetDate,DOMParserImpl=globalThis.DOMParser}={}) {
  if(!XAC_STATIONS.includes(station))throw Error('Cal una estació XAC explícita; Sant Celoni no és una estació de l’API');
  if(!validDate(targetDate))throw Error('Cal una data objectiu vàlida');
  if(typeof xml !== 'string' || xml.length > 300_000 || /<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('XML XAC no admès');
  if(!DOMParserImpl)throw Error('Cal un parser XML estàndard');
  const doc = new DOMParserImpl().parseFromString(xml,'application/xml');
  if(doc.querySelector('parsererror') || doc.documentElement?.tagName !== 'reports')throw Error('XML XAC mal format');
  const root = doc.documentElement, credit = one(root,'credit');
  if(text(credit,'license') !== XAC_LICENSE)throw Error('La llicència XAC ha canviat: cal revisió humana');
  const sourceUrl = `https://aerobiologia.cat/pia/ca/forecast/${station}`;
  const reports = children(root,'report').filter(report => children(one(report,'station'),'url').some(url=>url.textContent.trim()===sourceUrl));
  if(reports.length !== 1)throw Error('Estació absent o duplicada en la resposta XAC');
  const report=reports[0], stationNode=one(report,'station'), date=one(report,'date');
  const start=text(date,'start'),end=text(date,'end'),status=validity(start,end,targetDate);
  const catalog=one(root,'taxons'),current=one(report,'current'),forecast=one(report,'forecast');
  const legend=one(root,'legend');
  // Never silently adopt a new scale or turn an empty value into level zero.
  for(const [group,expected] of [['current',Object.fromEntries(LEVELS.map((label,i)=>[i,label]))],['forecast',TRENDS]]) {
    const entries=children(one(legend,group),'value');
    if(entries.length!==Object.keys(expected).length || new Set(entries.map(n=>n.textContent.trim())).size!==entries.length || entries.some(n=>expected[n.textContent.trim()]!==n.getAttribute('ca')))throw Error('Escala XAC desconeguda');
  }
  const groups={};let incomplete=false;
  for(const group of ['pollens','spores']) {
    const taxa=uniqueElements(one(catalog,group));
    const levels=uniqueElements(one(current,group));
    const trends=uniqueElements(one(forecast,group));
    if([...levels.keys(),...trends.keys()].some(code=>!taxa.has(code)))throw Error('Tàxon XAC sense definició');
    groups[group]=[...taxa].map(([code,node])=>{
      const raw=levels.get(code)?.textContent.trim();
      const level=/^[0-4]$/.test(raw ?? '')?Number(raw):null;
      const trend=trends.get(code)?.textContent.trim();
      const trendCode=Object.hasOwn(TRENDS,trend ?? '')?trend:null;
      const name=node.getAttribute('ca')?.trim();
      if(!name)throw Error('Tàxon XAC sense nom català');
      if(level===null || trendCode===null)incomplete=true;
      return {code,name,scientificName:node.textContent.trim(),level,levelLabel:level===null?null:LEVELS[level],trend:trendCode,trendLabel:trendCode===null?null:TRENDS[trendCode]};
    });
    if(!groups[group].length)incomplete=true;
  }
  return {station,stationName:text(stationNode,'name'),targetDate,start,end,status,incomplete,
    publishing:false,referenceApproved:false,sourceUrl,credit:text(credit,'creditName'),license:XAC_LICENSE,
    licenseUrl:'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    limitation:'Referència de l’estació indicada, no mesura local de Sant Celoni ni diagnòstic d’al·lèrgia.',
    ...groups};
}

const escape = value => String(value ?? '—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function pollenPreviewHtml(data) {
  const rows = group => data[group].map(t=>`<tr><td>${escape(t.name)}</td><td>${escape(t.levelLabel)}</td><td>${escape(t.trendLabel)}</td></tr>`).join('');
  const period = data.status==='in-period'?'Període coincident amb la data consultada':data.status==='future'?'Encara no correspon a la data consultada':'Període caducat per a la data consultada';
  return `<!doctype html><html lang="ca"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Revisió local · XAC</title>
<style>body{font:18px/1.5 system-ui;background:#081d17;color:#edf7f1;margin:auto;padding:24px;max-width:850px}h1{font-size:30px}h2{font-size:24px}table{width:100%;table-layout:fixed;border-collapse:collapse;margin-bottom:28px}th,td{text-align:left;padding:8px;border-bottom:1px solid #496257;overflow-wrap:anywhere}th:first-child{width:40%}th{font-size:14px}a{color:#99ddba}.notice{border:2px solid #e2bd63;padding:16px}small{display:block}*{box-sizing:border-box}@media(max-width:450px){body{padding:18px}td{font-size:16px;padding:8px 4px}th{padding:8px 4px}}</style>
<p class="notice">PREVISUALITZACIÓ LOCAL · NO PUBLICADA · Referència territorial pendent de validar</p>
<h1>Pòl·lens i espores · ${escape(data.stationName)}</h1>
<p>Butlletí del ${escape(data.start)} al ${escape(data.end)}. Consulta per al ${escape(data.targetDate)}.</p><p>${escape(period)}${data.incomplete?' · Dades incompletes':''}.</p>
<p>${escape(data.limitation)}</p>
<h2>Pòl·lens</h2><table><thead><tr><th>Tàxon</th><th>Nivell actual del butlletí</th><th>Tendència prevista</th></tr></thead><tbody>${rows('pollens')}</tbody></table>
<h2>Espores de fongs</h2><table><thead><tr><th>Tàxon</th><th>Nivell actual del butlletí</th><th>Tendència prevista</th></tr></thead><tbody>${rows('spores')}</tbody></table>
<small>Font: <a href="${escape(data.sourceUrl)}">${escape(data.credit)} · XAC</a>. Adaptació: Meteo Fontanillas. <a href="${escape(data.licenseUrl)}">${escape(data.license)}</a>, ús no comercial. Sense logotip PIA ni suport implícit de l’entitat.</small></html>`;
}
