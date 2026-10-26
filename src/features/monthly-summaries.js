import {MONTHLY_SUMMARIES,monthlySummaryById} from '../data/monthly-summaries.js';

const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[char]);
const selectedId=()=>decodeURIComponent(location.pathname.match(/^\/resums\/([^/]+)\/?$/)?.[1]||new URLSearchParams(location.search).get('summary')||MONTHLY_SUMMARIES[0]?.id||'');
const metric=(label,value,note)=>`<article><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></article>`;

export function chart(summary){
  const lows=summary.daily.map(day=>day[1]);const highs=summary.daily.map(day=>day[2]);
  const min=Math.floor(Math.min(...lows)/5)*5;const max=Math.ceil(Math.max(...highs)/5)*5;
  const range=Math.max(5,max-min);
  const maxRain=Math.max(1,...summary.daily.map(day=>day[3]));
  return `<div class="monthly-summary__chart" role="group" aria-label="Temperatura i pluja diària de ${esc(summary.label)}">${summary.daily.map(([day,low,high,rain,,coverage])=>`<div class="${coverage<85?'is-partial':''}" tabindex="0" aria-label="Dia ${day}: mínima ${low.toFixed(1)} i màxima ${high.toFixed(1)} graus; ${rain.toFixed(2)} mil·límetres de pluja; ${coverage}% de cobertura"><span class="monthly-summary__range" style="bottom:${Math.round((low-min)/range*100)}%;height:${Math.max(2,Math.round((high-low)/range*100))}%"></span><i style="height:${Math.round(rain/maxRain*100)}%"></i><small>${day}</small><em aria-hidden="true">Dia ${day}: ${low.toFixed(1)}–${high.toFixed(1)} °C · ${rain.toFixed(2)} mm · ${coverage}% cobertura</em></div>`).join('')}</div><p class="monthly-summary__scale">Escala de temperatura ${min}–${max} °C · pluja diària fins a ${maxRain.toFixed(2)} mm</p>`;
}

export function initMonthlySummaries(){
  const host=document.getElementById('monthly-summary');if(!host)return;
  const summary=monthlySummaryById(selectedId())||MONTHLY_SUMMARIES[0];if(!summary)return;
  const m=summary.metrics;
  host.innerHTML=`<article class="monthly-summary__hero panel"><div><p class="eyebrow">Butlletí climatològic local · revisat</p><h2>${esc(summary.title)}</h2><p>${esc(summary.summary)}</p></div><span>${esc(summary.period)}</span></article>
  <section class="monthly-summary__metrics" aria-label="El mes en quatre dades">${metric('Temperatura mitjana',`${m.mean.toFixed(1)} °C`,`Entre ${m.low.toFixed(1)} i ${m.high.toFixed(1)} °C · ponderada per cobertura`)}${metric('Pluja registrada',`${m.rain.toFixed(2)} mm`,`${m.rainDays} dies amb registre`)}${metric('Ratxa màxima',`${m.gust.toFixed(1)} km/h`,m.gustAt)}${metric('Cobertura de dades',`${m.coverage.toFixed(1)}%`,`${m.observations} franges horàries`)}</section>
  <section class="monthly-summary__plot panel"><header><div><p class="eyebrow">Evolució diària</p><h3>El mes, dia a dia</h3></div><span><b></b> temperatura <i></i> pluja</span></header>${chart(summary)}<p>Les franges discontínues identifiquen dies amb menys del 85% de cobertura. Pots recórrer cada dia amb el teclat per llegir-ne els valors.</p></section>
  <section class="monthly-summary__columns"><article class="panel"><p class="eyebrow">Dies destacats</p><h3>Quatre lectures amb context</h3><div class="monthly-summary__highlights">${summary.highlights.map(item=>`<div><time>${esc(item.date)}</time><strong>${esc(item.title)}</strong><p>${esc(item.copy)}</p></div>`).join('')}</div></article><article class="panel"><p class="eyebrow">Qualitat i límits</p><h3>Què podem afirmar</h3><ul>${summary.quality.map(item=>`<li>${esc(item)}</li>`).join('')}</ul><a href="/api/history?days=90&resolution=hourly">Consultar la font de dades →</a></article></section>
  <footer class="monthly-summary__footer panel"><span>Dades pròpies · CC BY 4.0 · Publicat el ${esc(summary.published)}</span><nav><a href="/centre-dades">Centre de Dades →</a><a href="/histories">Històries verificades →</a></nav></footer>`;
  if(/^\/resums\/[^/]+\/?$/.test(location.pathname))requestAnimationFrame(()=>host.scrollIntoView({block:'start'}));
}
